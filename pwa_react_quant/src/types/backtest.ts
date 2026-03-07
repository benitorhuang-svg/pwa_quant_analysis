/**
 * types/backtest.ts — Shared types for backtest results and chart data
 */

export interface Trade {
    type: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
    price: number;
    qty: number;
    index: number;
    date: string;
    reason: string;
    profit_pct?: number;
    comm: number;
}

export interface StrategyStats {
    initial_capital: number;
    final_capital: number;
    total_return: number;
    bh_return?: number;
    max_drawdown: number;
    sharpe_ratio: number;
    win_rate: number;
    total_trades: number;
    calmar_ratio: number;
    profit_factor: number | string;
    payoff_ratio: number | string;
    expectancy: number;
    recovery_factor: number | string;
    equity_curve: number[];
    dates: string[];
    trades: Trade[];
    drawdown_series?: number[];
    profit_distribution?: {
        wins: number[];
        losses: number[];
    };
    price_data?: {
        closes: number[];
        dates: string[];
    };
    ma_data?: {
        ma_short?: number[];
        ma_long?: number[];
    };
    volume_data?: {
        volumes: number[];
        closes: number[];
        dates: string[];
    };
    closes?: number[];
    [key: string]: unknown;
}

export interface ScanResult {
    params: Record<string, number>;
    return: number;
    drawdown: number;
    winRate: number;
    score: number;
}

export interface ScanParamConfig {
    start: number;
    end: number;
    step: number;
    active: boolean;
}
