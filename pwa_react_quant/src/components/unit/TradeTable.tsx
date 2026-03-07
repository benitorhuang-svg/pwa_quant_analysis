/**
 * TradeTable.tsx — 交易詳情記錄
 */
import type { Trade } from '../../types/backtest';
import { Terminal, FileDown } from 'lucide-react';
import { formatNum } from './utils';

interface Props {
    trades: Trade[];
    unitId: string;
}

export default function TradeTable({ trades, unitId }: Props) {
    const handleExportCSV = () => {
        if (!trades.length) return;
        const headers = ["Date", "Type", "Price", "Qty", "Profit%", "Reason"];
        const rows = trades.map(t => [
            t.date, t.type, t.price, t.qty, t.profit_pct || 0, `"${t.reason || ''}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `trades_${unitId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="section-card trade-list-section">
            <div className="trade-history-header">
                <h2 className="section-title"><Terminal size={14} /> 交易詳情記錄 (Trade History)</h2>
                <button className="btn-chart-download" onClick={handleExportCSV}>
                    <FileDown size={11} /> 匯出 CSV 檔案
                </button>
            </div>
            <div className="trade-table-wrapper">
                <table className="trade-table">
                    <thead>
                        <tr>
                            <th>時間</th>
                            <th>類型</th>
                            <th>價格</th>
                            <th>數量</th>
                            <th>損益%</th>
                            <th>理由</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.slice().reverse().map((t, i) => (
                            <tr key={i}>
                                <td>{t.date}</td>
                                <td>
                                    <span className={`trade-badge ${t.type.toLowerCase()}`}>
                                        {t.type}
                                    </span>
                                </td>
                                <td>{formatNum(t.price)}</td>
                                <td>{formatNum(t.qty)}</td>
                                <td className={t.profit_pct ? (t.profit_pct > 0 ? 'up' : t.profit_pct < 0 ? 'down' : '') : ''}>
                                    {t.profit_pct !== undefined ? `${formatNum(t.profit_pct)}%` : '-'}
                                </td>
                                <td className="trade-reason">{t.reason || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
