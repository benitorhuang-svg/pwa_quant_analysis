import numpy as np
import json

class BacktestEngine:
    """
    輕量級向量化回測引擎 (針對 Pyodide 設計)
    支援：複利/固定數量、手續費、滑價、做多/做空、進階績效指標
    """
    def __init__(self, data, initial_capital=100000, slippage=0.0001):
        # 數據轉換為 numpy 陣列加速計算
        self.raw_data = data
        self.closes = np.array([d['Close'] for d in data])
        self.dates = [d['Date'] for d in data]
        self.n = len(data)
        
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.position = 0           # 正數為多單，負數為空單
        self.avg_price = 0.0        # 平均成本
        
        self.commission = 0.0005    # 預設手續費 0.05%
        self.slippage = slippage    # 預設滑價 0.01%
        
        # 記錄
        self.equity_curve = np.zeros(self.n)
        self.trades = []
        
    def buy(self, price, index, qty=None, reason=""):
        """ 開多 或 平空 """
        if isinstance(qty, str):
            reason = qty
            qty = None
        # 模擬買入滑價 (買得稍高)
        exec_price = price * (1 + self.slippage)
        
        if self.position < 0:
            # 如果目前有空單，先執行平空 (Cover)
            self.cover(price, index, abs(self.position), reason)
            return

        if qty is None:
            # 扣除手續費與滑價後的可用數量
            cost_factor = 1 + self.commission
            qty = self.capital / (exec_price * cost_factor)
            
        total_cost = qty * exec_price
        comm = total_cost * self.commission
        
        if total_cost + comm > self.capital + 0.01:
            qty = self.capital / (exec_price * (1 + self.commission))
            total_cost = qty * exec_price
            comm = total_cost * self.commission
            
        if qty <= 0: return

        new_total_qty = self.position + qty
        self.avg_price = (self.avg_price * self.position + exec_price * qty) / (new_total_qty if new_total_qty != 0 else 1)
        self.position = new_total_qty
        self.capital -= (total_cost + comm)
        
        self.trades.append({
            "type": "BUY", "price": round(exec_price, 2), "qty": round(qty, 4),
            "index": index, "date": self.dates[index], "reason": reason, "comm": round(comm, 2)
        })
        
    def sell(self, price, index, qty=None, reason=""):
        """ 平多 或 開空 """
        if isinstance(qty, str):
            reason = qty
            qty = None
        # 模擬賣出滑價 (賣得稍低)
        exec_price = price * (1 - self.slippage)

        if self.position > 0:
            # 如果目前有多單，執行平多
            if qty is None or qty > self.position:
                qty = self.position
                
            value = qty * exec_price
            comm = value * self.commission
            self.capital += (value - comm)
            
            profit = (exec_price - self.avg_price) / self.avg_price * 100 if self.avg_price != 0 else 0
            
            self.trades.append({
                "type": "SELL", "price": round(exec_price, 2), "qty": round(qty, 4),
                "index": index, "date": self.dates[index], "reason": reason, 
                "profit_pct": round(profit, 2), "comm": round(comm, 2)
            })
            
            self.position -= qty
            if abs(self.position) < 1e-8:
                self.position = 0
                self.avg_price = 0
        else:
            # 如果沒多單，則視為開空
            self.short(price, index, qty, reason)

    def short(self, price, index, qty=None, reason=""):
        """ 開空 """
        if isinstance(qty, str):
            reason = qty
            qty = None
        if self.position > 0:
            self.sell(price, index, self.position, reason)
            return

        exec_price = price * (1 - self.slippage)
        
        if qty is None:
            cost_factor = 1 + self.commission
            qty = self.capital / (exec_price * cost_factor)

        total_value = qty * exec_price
        comm = total_value * self.commission
        
        if self.capital < comm: return # 連手續費都支不付起

        self.avg_price = (abs(self.avg_price * self.position) + exec_price * qty) / (abs(self.position) + qty)
        self.position -= qty # 空單位置為負
        self.capital -= comm # 只扣手續費
        
        self.trades.append({
            "type": "SHORT", "price": round(exec_price, 2), "qty": round(qty, 4),
            "index": index, "date": self.dates[index], "reason": reason, "comm": round(comm, 2)
        })

    def cover(self, price, index, qty=None, reason=""):
        """ 平空 """
        if isinstance(qty, str):
            reason = qty
            qty = None
        if self.position >= 0: return
        
        exec_price = price * (1 + self.slippage)
        current_short_qty = abs(self.position)
        
        if qty is None or qty > current_short_qty:
            qty = current_short_qty
            
        # 做空利潤 = (開倉價 - 平倉價) * 數量
        raw_profit = (self.avg_price - exec_price) * qty
        value = qty * exec_price
        comm = value * self.commission
        
        self.capital += (raw_profit - comm)
        
        profit_pct = (self.avg_price - exec_price) / self.avg_price * 100 if self.avg_price > 0 else 0
        
        self.trades.append({
            "type": "COVER", "price": round(exec_price, 2), "qty": round(qty, 4),
            "index": index, "date": self.dates[index], "reason": reason,
            "profit_pct": round(profit_pct, 2), "comm": round(comm, 2)
        })
        
        self.position += qty
        if abs(self.position) < 1e-8:
            self.position = 0
            self.avg_price = 0

    def run(self, strategy_func):
        """ 執行回測 """
        for i in range(self.n):
            # 記錄當前權益 (包含未實現損益)
            unrealized = 0
            if self.position > 0:
                unrealized = self.position * (self.closes[i] - self.avg_price)
            elif self.position < 0:
                unrealized = abs(self.position) * (self.avg_price - self.closes[i])
                
            current_value = self.capital + unrealized
            self.equity_curve[i] = current_value
            
            # 執行策略邏輯
            strategy_func(self, self.raw_data, i)
            
        return self._generate_report()
        
    def _generate_report(self):
        final_capital = self.equity_curve[-1]
        total_return = (final_capital - self.initial_capital) / self.initial_capital * 100
        
        # 最大回撤
        peak = np.maximum.accumulate(self.equity_curve)
        drawdown_flat = (peak - self.equity_curve) / peak * 100
        max_drawdown = np.max(drawdown_flat)
        
        # 交易統計
        closed_trades = [t for t in self.trades if t['type'] in ['SELL', 'COVER']]
        win_trades = [t for t in closed_trades if t.get('profit_pct', 0) > 0]
        
        total_trades = len(closed_trades)
        win_rate = (len(win_trades) / total_trades * 100) if total_trades > 0 else 0
        
        # 夏普比率 & 卡瑪比率
        daily_returns = np.diff(self.equity_curve) / self.equity_curve[:-1]
        std = np.std(daily_returns) if len(daily_returns) > 0 else 1e-9
        avg_ret = np.mean(daily_returns)
        sharpe = (avg_ret / std * np.sqrt(252)) if std > 0 else 0
        calmar = (total_return / max_drawdown) if max_drawdown > 0 else 0
        
        # 獲利因子 (Profit Factor)
        gross_profits = sum(t.get('profit_pct', 0) for t in closed_trades if t.get('profit_pct', 0) > 0)
        gross_losses = abs(sum(t.get('profit_pct', 0) for t in closed_trades if t.get('profit_pct', 0) < 0))
        profit_factor = (gross_profits / gross_losses) if gross_losses > 0 else (float('inf') if gross_profits > 0 else 0)

        # 整理數值，確保可以 JSON 序列化 (處理 NaN 與 Inf)
        def s(val):
            if np.isnan(val): return 0
            if np.isinf(val): return 999
            return float(val)

        return {
            "initial_capital": self.initial_capital,
            "final_capital": s(final_capital),
            "total_return": s(total_return),
            "max_drawdown": s(max_drawdown),
            "total_trades": total_trades,
            "win_rate": s(win_rate),
            "sharpe_ratio": s(sharpe),
            "calmar_ratio": s(calmar),
            "profit_factor": s(profit_factor) if profit_factor != float('inf') else "∞",
            "equity_curve": [s(x) for x in self.equity_curve.tolist()],
            "dates": self.dates,
            "trades": self.trades
        }
