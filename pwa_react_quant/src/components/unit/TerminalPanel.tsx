/**
 * TerminalPanel.tsx — 執行終端 + 統計卡片
 */
import type { StrategyStats } from '../../types/backtest';
import { Terminal, Zap, BarChart3, Settings2 } from 'lucide-react';
import { formatNum, getStatClass } from './utils';

interface Props {
    outputLogs: { text: string; type: string }[];
    isRunning: boolean;
    stats: StrategyStats | null;
}

export default function TerminalPanel({ outputLogs, isRunning, stats }: Props) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className="brand-icon" style={{ width: 22, height: 22, fontSize: 10 }}>
                    <Terminal size={12} />
                </div>
                <h3 className="section-title" style={{ margin: 0, fontSize: '0.85rem' }}>Execution Console</h3>
            </div>
            <div className="logs-container">
                {outputLogs.map((log, i) => (
                    <div key={i} className={`log-line ${log.type}`}>{log.text}</div>
                ))}
                {isRunning && (
                    <div className="log-line info">
                        <span className="spinner-dots"></span> 執行中...
                    </div>
                )}
            </div>

            {stats && !isRunning && (
                <div className="stat-cards-row">
                    <div className="stat-card-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="stat-card-label">Total Returns</div>
                            <Zap size={14} color="var(--brand-primary)" />
                        </div>
                        <div className={`stat-card-value ${(stats.total_return ?? 0) >= 0 ? 'up' : 'down'}`}>
                            {(stats.total_return ?? 0) >= 0 ? '+' : ''}{formatNum(stats.total_return ?? 0)}%
                        </div>
                    </div>
                    <div className="stat-card-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="stat-card-label">Sharpe Ratio</div>
                            <BarChart3 size={14} color="var(--brand-secondary)" />
                        </div>
                        <div className={`stat-card-value ${getStatClass(stats.sharpe_ratio ?? 0, 'sharpe')}`}>
                            {formatNum(stats.sharpe_ratio ?? '-')}
                        </div>
                    </div>
                    <div className="stat-card-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="stat-card-label">Profit Factor</div>
                            <Terminal size={14} color="var(--brand-emerald)" />
                        </div>
                        <div className={`stat-card-value ${getStatClass(stats.profit_factor ?? 0, 'pf')}`}>
                            {formatNum(stats.profit_factor ?? '-')}
                        </div>
                    </div>
                    <div className="stat-card-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="stat-card-label">Win Rate</div>
                            <Settings2 size={14} color="var(--brand-blue)" />
                        </div>
                        <div className={`stat-card-value ${Number(stats.win_rate ?? 0) > 50 ? 'up' : 'neutral'}`}>
                            {formatNum(stats.win_rate ?? '-')} %
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
