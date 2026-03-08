/**
 * OptimizeResultsPanel.tsx — 優化結果展示
 */
import type { ScanResult } from '../../types/backtest';
import { Zap } from 'lucide-react';
import { formatNum } from './utils';

interface Props {
    scanResults: ScanResult[];
}

export default function OptimizeResultsPanel({ scanResults }: Props) {
    if (scanResults.length === 0) {
        return (
            <div className="empty-state" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '16px', border: '1px dashed var(--border-medium)', borderRadius: '8px' }}>
                <Zap size={36} style={{ opacity: 0.2, marginBottom: '16px', color: 'var(--brand-primary)' }} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>尚無優化結果</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '300px', textAlign: 'center' }}>
                    請先在上方設定參數掃描區間，然後點擊「開始暴力掃描參數」
                </p>
            </div>
        );
    }

    return (
        <div className="optimization-results-section" style={{ marginTop: '0' }}>
            <div className="trade-history-header" style={{ marginBottom: '16px' }}>
                <h2 className="section-title" style={{ color: 'var(--brand-amber)' }}>
                    <Zap size={14} /> 最佳參數優化分析 (Optimization Results)
                </h2>
            </div>

            {/* Best Parameters Summary Card */}
            <div className="section-card" style={{ border: '1px solid var(--brand-amber-muted)', background: 'var(--brand-amber-faded)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🏆</div>
                    <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--brand-amber)', fontWeight: 700 }}>推薦最佳參數組合</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {Object.entries(scanResults[0]?.params || {}).map(([k, v]) => `${k}=${v}`).join(' | ')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            預期總報酬率: <span style={{ color: 'var(--brand-emerald)', fontWeight: 700 }}>{formatNum(scanResults[0]?.return)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="chart-container" style={{ minHeight: '300px', marginBottom: '16px' }}>
                <canvas id="result-opt-bar" style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="chart-container" style={{ minHeight: '300px' }}>
                <canvas id="result-opt-scatter" style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
}
