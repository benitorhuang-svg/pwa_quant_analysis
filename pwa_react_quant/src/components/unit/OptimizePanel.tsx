/**
 * OptimizePanel.tsx — 參數優化掃描面板
 */
import type { UnitDef } from '../../units/types';
import type { ScanResult, ScanParamConfig } from '../../types/backtest';
import { Zap } from 'lucide-react';
import { formatNum } from './utils';

interface Props {
    unit: UnitDef;
    params: Record<string, number>;
    scanParams: Record<string, ScanParamConfig>;
    setScanParams: React.Dispatch<React.SetStateAction<Record<string, ScanParamConfig>>>;
    isOptimizing: boolean;
    optimizeProgress: { current: number; total: number };
    onOptimize: () => void;
}

export default function OptimizeConfigPanel({
    unit, params, scanParams, setScanParams,
    isOptimizing, optimizeProgress, onOptimize
}: Props) {
    return (
        <div className="optimize-config-panel">
            <div className="optimize-header-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="section-title" style={{ marginBottom: 2 }}>參數優化掃描</h3>
                    <p className="optimize-subtitle">選擇並設定參數區間</p>
                </div>
                <button
                    className="btn btn-glow animate-pulse"
                    onClick={onOptimize}
                    disabled={isOptimizing}
                    style={{ margin: 0, padding: '8px 20px', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
                >
                    {isOptimizing ? `計算中 (${optimizeProgress.current}/${optimizeProgress.total})...` : '開始暴力掃描參數'}
                </button>
            </div>

            {isOptimizing && (
                <div className="optimize-progress-wrapper" style={{ padding: '0 4px', marginBottom: '12px' }}>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${(optimizeProgress.current / optimizeProgress.total) * 100}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        <span>正在分析參數組合...</span>
                        <span>{Math.round((optimizeProgress.current / optimizeProgress.total) * 100)}%</span>
                    </div>
                </div>
            )}

            <div className="scan-config-grid">
                {unit.params?.map(p => (
                    <div key={p.id} className={`scan-param-card ${scanParams[p.id]?.active ? 'active' : ''}`}>
                        <div className="param-card-header">
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={scanParams[p.id]?.active ?? false}
                                    onChange={e => setScanParams(prev => ({
                                        ...prev,
                                        [p.id]: { ...prev[p.id], active: e.target.checked }
                                    }))}
                                />
                                <span className="param-name">{p.label}</span>
                            </label>
                            <span className="current-val-hint">Current: {params[p.id] ?? p.default}</span>
                        </div>
                        {scanParams[p.id]?.active && (
                            <div className="param-inputs-row">
                                <div className="input-group">
                                    <label>Start: <span style={{ color: 'var(--text-primary)' }}>{scanParams[p.id].start}</span></label>
                                    <input
                                        type="range" className="custom-slider"
                                        min={p.min} max={p.max} step={p.step}
                                        value={scanParams[p.id].start}
                                        onChange={e => setScanParams(prev => ({
                                            ...prev,
                                            [p.id]: { ...prev[p.id], start: parseFloat(e.target.value) }
                                        }))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>End: <span style={{ color: 'var(--text-primary)' }}>{scanParams[p.id].end}</span></label>
                                    <input
                                        type="range" className="custom-slider"
                                        min={p.min} max={p.max} step={p.step}
                                        value={scanParams[p.id].end}
                                        onChange={e => setScanParams(prev => ({
                                            ...prev,
                                            [p.id]: { ...prev[p.id], end: parseFloat(e.target.value) }
                                        }))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Step: <span style={{ color: 'var(--text-primary)' }}>{scanParams[p.id].step}</span></label>
                                    <input
                                        type="range" className="custom-slider"
                                        min={p.step} max={Math.max(p.step * 10, (p.max - p.min) / 2)} step={p.step}
                                        value={scanParams[p.id].step}
                                        onChange={e => setScanParams(prev => ({
                                            ...prev,
                                            [p.id]: { ...prev[p.id], step: parseFloat(e.target.value) }
                                        }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
