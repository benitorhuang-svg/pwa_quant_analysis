/**
 * ParamsBlock.tsx — 共用參數滑桿區域
 */
import type { UnitParam } from '../../units/types';
import { Settings2 } from 'lucide-react';

interface Props {
    params: Record<string, number>;
    unitParams: UnitParam[];
    needsData?: boolean;
    dataSource: 'real' | 'simulated';
    symbol: string;
    onParamChange: (id: string, value: string) => void;
    onDataSourceChange: (source: 'real' | 'simulated') => void;
    onSymbolChange: (symbol: string) => void;
}

export default function ParamsBlock({
    params, unitParams, needsData, dataSource, symbol,
    onParamChange, onDataSourceChange, onSymbolChange
}: Props) {
    if (!unitParams || unitParams.length === 0) return null;

    return (
        <div className="params-block">
            <div className="params-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="params-title"><Settings2 size={11} /> Parameters</div>
                {needsData && (
                    <div className="data-source-toggle" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
                        <span style={{ opacity: 0.8, color: 'var(--text-muted)' }}>Data:</span>
                        <button
                            className={`btn-data-toggle ${dataSource === 'simulated' ? 'active' : ''}`}
                            onClick={() => onDataSourceChange('simulated')}
                            title="使用虛擬隨機數據"
                        >
                            虛擬資料
                        </button>
                        <button
                            className={`btn-data-toggle ${dataSource === 'real' ? 'active' : ''}`}
                            onClick={() => onDataSourceChange('real')}
                            title="使用真實股票數據 (透過 API)"
                        >
                            API
                        </button>
                        {dataSource === 'real' && (
                            <input
                                type="text"
                                className="symbol-input"
                                value={symbol}
                                onChange={(e) => onSymbolChange(e.target.value)}
                                placeholder="Symbol"
                                style={{
                                    width: '60px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)', fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px'
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
            <div className="params-grid">
                {unitParams.map(p => (
                    <div key={p.id} className="param-item">
                        <div className="param-info">
                            <span className="param-label">{p.label}</span>
                            <span className="param-value">{p.format(params[p.id] ?? p.default)}</span>
                        </div>
                        <input
                            type="range"
                            className="custom-slider"
                            min={p.min} max={p.max} step={p.step}
                            value={params[p.id] ?? p.default}
                            onChange={e => onParamChange(p.id, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
