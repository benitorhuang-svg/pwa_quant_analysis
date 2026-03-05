import { useEffect, useRef, useState, useCallback } from 'react';
import type { UnitDef } from '../units/types';
import { createEditor, getCode, setCode } from '../engine/editor';
import { runAndGetResult, setGlobal } from '../engine/pyodide-runner';
import { loadStockData } from '../engine/data-loader';
import katex from 'katex';
import { BookOpen, BarChart3, Play, Copy, Terminal, Settings2, Square, X, Code2, Zap } from 'lucide-react';

interface Props {
    unitId: string;
    unit: UnitDef;
    pyodideReady: boolean;
}

interface StrategyStats {
    total_return: number;
    sharpe_ratio: number;
    win_rate: number;
    total_trades: number;
    calmar_ratio: number;
    profit_factor: number | string;
    equity_curve: number[];
    dates: string[];
    trades: any[];
    [key: string]: unknown;
}

export default function UnitContent({ unitId, unit, pyodideReady }: Props) {
    const format4 = (val: any) => {
        if (val === undefined || val === null || val === '-') return '-';
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (isNaN(num)) return val;
        // For integers like total_trades, we might want to keep them as is, 
        // but the user said "all numerical values". However, usually counts shouldn't have decimals.
        // I will apply it to everything for now as requested.
        return num.toFixed(4);
    };

    const editorRef = useRef<HTMLDivElement>(null);
    const theoryRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const [leftWidth, setLeftWidth] = useState(50);

    const [params, setParams] = useState<Record<string, number>>(() => {
        const defaults: Record<string, number> = {};
        if (unit.params) {
            unit.params.forEach(p => defaults[p.id] = p.default);
        }
        return defaults;
    });

    const [outputLogs, setOutputLogs] = useState<{ text: string, type: string }[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState<StrategyStats | null>(null);
    const [centerView, setCenterView] = useState<'theory' | 'result'>('theory');
    const [rightView, setRightView] = useState<'code' | 'terminal' | 'optimize'>('code');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [scanParams, setScanParams] = useState<Record<string, { start: number, end: number, step: number, active: boolean }>>({});

    useEffect(() => {
        if (editorRef.current) {
            const savedCode = localStorage.getItem(`quant_code_${unitId}`);

            createEditor(editorRef.current, savedCode || unit.defaultCode, (newCode) => {
                localStorage.setItem(`quant_code_${unitId}`, newCode);
            });
        }

        if (unit.needsData && pyodideReady) {
            loadStockData('2330').then(result => {
                setGlobal('stock_data', result.data);
            });
        }
        if (unit.params) {
            const scanInit: any = {};
            unit.params.forEach(p => {
                scanInit[p.id] = { start: p.min, end: p.max, step: p.step * 5, active: false };
            });
            setScanParams(scanInit);
        }
    }, [unitId, unit, pyodideReady]);

    useEffect(() => {
        if (centerView === 'theory' && theoryRef.current) {
            theoryRef.current.querySelectorAll('.formula-box').forEach(el => {
                if (el.id === 'kelly-formula') katex.render('f^* = \\frac{bp - q}{b}', el as HTMLElement, { displayMode: true, throwOnError: false });
                if (el.id === 'ma-formula') katex.render('MA(n) = \\frac{1}{n} \\sum_{i=1}^{n} C_i', el as HTMLElement, { displayMode: true, throwOnError: false });
            });
        }
    }, [centerView, unitId]);

    const handleParamChange = (id: string, value: string) => {
        const val = parseFloat(value);
        setParams(prev => ({ ...prev, [id]: val }));
        const currentCode = getCode();
        const newDoc = currentCode.replace(new RegExp(`(${id}\\s*=\\s*)([\\d.]+)`), `$1${value}`);
        if (newDoc !== currentCode) setCode(newDoc);
    };

    const handleRun = async () => {
        if (!pyodideReady) return alert('引擎準備中...');
        setIsRunning(true);
        setRightView('terminal');
        setOutputLogs([{ text: '> 正在初始化回測引擎...', type: 'info' }]);

        const code = getCode();
        const res = await runAndGetResult(code, unit.resultVar, (text, type) => {
            setOutputLogs(prev => [...prev, { text: `[${new Date().toLocaleTimeString([], { hour12: false })}] ${text}`, type }]);
        });

        if (res.success && res.data) {
            setStats(res.data as StrategyStats);
            setCenterView('result');
            setTimeout(() => {
                unit.renderChart('result-chart', res.data as StrategyStats);
            }, 100);
        } else if (!res.success) {
            setOutputLogs(prev => [...prev, { text: 'ERROR: ' + (res.error || 'Execution failed'), type: 'error' }]);
        }
        setIsRunning(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getCode());
    };

    const handleReset = () => {
        if (confirm("確定要重設為預設程式碼嗎？這將會覆蓋您目前的修改。")) {
            setCode(unit.defaultCode);
            localStorage.setItem(`quant_code_${unitId}`, unit.defaultCode);
        }
    };

    const handleOptimize = async () => {
        if (!pyodideReady) return;
        setIsOptimizing(true);
        setScanResults([]);

        const activeParams = Object.entries(scanParams).filter(([_, v]) => v.active);
        if (activeParams.length === 0) {
            setIsOptimizing(false);
            return alert("請至少選擇一個參數進行優化");
        }

        const originalCode = getCode();
        const combinations: Record<string, number>[] = [{}];

        activeParams.forEach(([id, cfg]) => {
            const currentCombos = [...combinations];
            combinations.length = 0;
            for (let v = cfg.start; v <= cfg.end; v += cfg.step) {
                currentCombos.forEach(c => combinations.push({ ...c, [id]: v }));
            }
        });

        if (combinations.length > 50) {
            if (!confirm(`將執行 ${combinations.length} 次回測，可能需要一點時間。確定繼續？`)) {
                setIsOptimizing(false);
                return;
            }
        }

        const results = [];
        for (const combo of combinations) {
            let trialCode = originalCode;
            Object.entries(combo).forEach(([id, val]) => {
                trialCode = trialCode.replace(new RegExp(`(${id}\\s*=\\s*)([\\d.]+)`), `$1${val}`);
            });

            const res = await runAndGetResult(trialCode, unit.resultVar);
            if (res.success && res.data) {
                results.push({
                    params: combo,
                    return: (res.data as any).total_return,
                    drawdown: (res.data as any).max_drawdown,
                    winRate: (res.data as any).win_rate,
                    score: (res.data as any).total_return / ((res.data as any).max_drawdown || 1)
                });
            }
        }

        results.sort((a, b) => b.return - a.return);
        setScanResults(results);
        setIsOptimizing(false);
    };

    const startResizing = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const width = (e.clientX / window.innerWidth) * 100;
        if (width > 20 && width < 80) setLeftWidth(width);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className="unit-layout-2col" style={{ gridTemplateColumns: `${leftWidth}% auto ${100 - leftWidth}%` }}>
            {/* ═══ CENTER PANEL ═══ */}
            <div className="unit-center-panel">
                {/* Top tabs */}
                <div className="panel-top-tabs">
                    <button
                        className={`panel-tab ${centerView === 'theory' ? 'active' : ''}`}
                        onClick={() => setCenterView('theory')}
                    >
                        <BookOpen size={12} /> 內容說明
                    </button>
                    <button
                        className={`panel-tab ${centerView === 'result' ? 'active' : ''}`}
                        onClick={() => setCenterView('result')}
                    >
                        <BarChart3 size={12} /> 執行結果
                    </button>
                </div>

                {/* Stat cards row */}
                <div className="stat-cards-row" style={{ display: centerView === 'result' && stats ? 'grid' : 'none' }}>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Returns</div>
                        <div className={`stat-card-value ${(stats?.total_return ?? 0) >= 0 ? 'up' : 'down'}`}>
                            {(stats?.total_return ?? 0) >= 0 ? '+' : ''}{format4(stats?.total_return ?? 0)}%
                        </div>
                    </div>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Sharpe</div>
                        <div className="stat-card-value neutral">{format4(stats?.sharpe_ratio ?? '-')}</div>
                    </div>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Calmar</div>
                        <div className="stat-card-value neutral">{format4(stats?.calmar_ratio ?? '-')}</div>
                    </div>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Profit Factor</div>
                        <div className="stat-card-value neutral">{format4(stats?.profit_factor ?? '-')}</div>
                    </div>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Win Rate</div>
                        <div className={`stat-card-value ${Number(stats?.win_rate ?? 0) > 50 ? 'up' : 'neutral'}`}>
                            {format4(stats?.win_rate ?? 0)}%
                        </div>
                    </div>
                    <div className="stat-card-compact">
                        <div className="stat-card-label">Trades</div>
                        <div className="stat-card-value accent">{format4(stats?.total_trades ?? 0)}</div>
                    </div>
                </div>

                {/* Content area — BOTH views always in DOM */}
                <div className="center-content-area">
                    {/* Theory */}
                    <div className={`theory-scroll ${centerView === 'theory' ? 'active-view' : 'hidden-view'}`}>
                        <div className="unit-header-area">
                            <div className="unit-header-badges">
                                <span className="badge-module">{unit.module}</span>
                                {unit.difficulty && <span className="badge-difficulty">{unit.difficulty}</span>}
                            </div>
                            <h1 className="unit-title">{unit.title}</h1>
                            <div className="unit-description">
                                <p>{unit.description}</p>
                            </div>
                        </div>

                        <div className="section-card">
                            <h2 className="section-title"><BookOpen size={14} /> 核心理論</h2>
                            <div className="theory-text" ref={theoryRef} dangerouslySetInnerHTML={{ __html: unit.theory }} />
                        </div>
                    </div>

                    {/* Results */}
                    <div className={`results-scroll ${centerView === 'result' ? 'active-view' : 'hidden-view'}`}>
                        {stats ? (
                            <>
                                <div className="chart-container">
                                    <div className="chart-actions">
                                        <button className="btn-chart-download" onClick={() => {
                                            const canvas = document.getElementById('result-chart') as HTMLCanvasElement;
                                            if (canvas) {
                                                const link = document.createElement('a');
                                                link.download = `backtest_${unitId}.png`;
                                                link.href = canvas.toDataURL('image/png');
                                                link.click();
                                            }
                                        }}>
                                            <Copy size={11} /> 下載圖表 PNG
                                        </button>
                                    </div>
                                    <canvas id="result-chart" style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div className="section-card trade-list-section">
                                    <h2 className="section-title"><Terminal size={14} /> 交易詳情記錄 (Trade History)</h2>
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
                                                {(stats.trades || []).slice().reverse().map((t, i) => (
                                                    <tr key={i}>
                                                        <td>{t.date}</td>
                                                        <td>
                                                            <span className={`trade-badge ${t.type.toLowerCase()}`}>
                                                                {t.type}
                                                            </span>
                                                        </td>
                                                        <td>{format4(t.price)}</td>
                                                        <td>{format4(t.qty)}</td>
                                                        <td className={t.profit_pct > 0 ? 'up' : t.profit_pct < 0 ? 'down' : ''}>
                                                            {t.profit_pct !== undefined ? `${format4(t.profit_pct)}%` : '-'}
                                                        </td>
                                                        <td className="trade-reason">{t.reason || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <Play size={44} />
                                <p>尚未執行策略代碼</p>
                                <p>點擊右側「Run」按鈕查看結果</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ SPLITTER ═══ */}
            <div className="resizer" onMouseDown={startResizing} />

            {/* ═══ RIGHT PANEL ═══ */}
            <div className="unit-editor-panel">
                {/* Top toolbar: tabs + actions */}
                <div className="editor-toolbar">
                    <div className="editor-tabs">
                        <button
                            className={`editor-tab ${rightView === 'code' ? 'active' : ''}`}
                            onClick={() => setRightView('code')}
                        >
                            <Code2 size={12} /> Code
                        </button>
                        <button
                            className={`editor-tab ${rightView === 'optimize' ? 'active' : ''}`}
                            onClick={() => setRightView('optimize')}
                        >
                            <Zap size={12} /> Optimize
                        </button>
                        <button className="editor-tab" onClick={handleCopy} title="複製程式碼">
                            <Copy size={12} /> Copy
                        </button>
                        <button className="editor-tab" onClick={handleReset} title="還原預設代碼">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            Reset
                        </button>
                    </div>
                    <div className="btn-group">
                        <button
                            className={`btn-action ${rightView === 'terminal' ? 'active-btn' : ''}`}
                            onClick={() => setRightView('terminal')}
                        >
                            <Terminal size={12} /> Terminal Result
                        </button>
                        <button
                            className={`btn-action btn-execute ${isRunning ? 'active' : ''}`}
                            disabled={isRunning}
                            onClick={handleRun}
                        >
                            {isRunning ? (
                                <><Square size={11} fill="white" /> Stop</>
                            ) : (
                                <><Play size={12} fill="currentColor" /> Run</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Parameters (Shared across right views) */}
                {unit.params && unit.params.length > 0 && (
                    <div className="params-block">
                        <div className="params-header">
                            <div className="params-title"><Settings2 size={11} /> Parameters</div>
                        </div>
                        <div className="params-grid">
                            {unit.params.map(p => (
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
                                        onChange={e => handleParamChange(p.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Code View (default) */}
                <div className={rightView === 'code' ? 'right-panel-active' : 'hidden-view'}>
                    <div className="editor-container" ref={editorRef} />
                </div>

                {/* Terminal Result View */}
                <div className={`terminal-result-view ${rightView === 'terminal' ? 'active-view' : 'hidden-view'}`}>
                    {outputLogs.length > 0 && !isRunning && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button className="btn-clear-terminal" style={{ marginTop: 0 }} onClick={() => setOutputLogs([])}>
                                <X size={11} /> Clear
                            </button>
                        </div>
                    )}
                    <div className="terminal-window-full">
                        <div className="terminal-body">
                            {outputLogs.length === 0 && (
                                <div style={{ color: 'var(--text-dim)', opacity: 0.4, fontSize: '0.72rem' }}>
                                    {'// 等待執行命令...'}
                                </div>
                            )}
                            {outputLogs.map((log, i) => (
                                <div key={i} className={`log-line ${log.type}`}>{log.text}</div>
                            ))}
                            {isRunning && <span className="blink">▋</span>}
                        </div>
                    </div>

                    {unit.exercises && (
                        <div className="section-card" style={{ marginTop: '16px' }}>
                            <h2 className="section-title" style={{ color: 'var(--brand-amber)' }}>💡 實戰練習</h2>
                            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                                {unit.exercises.map((e, i) => (
                                    <li key={i} style={{ marginBottom: '6px' }}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Optimization View */}
                <div className={`optimize-view ${rightView === 'optimize' ? 'active-view' : 'hidden-view'}`}>
                    <div className="section-card" style={{ padding: '14px' }}>
                        <h3 className="section-title" style={{ fontSize: '0.62rem', marginBottom: '10px' }}>
                            <Settings2 size={12} /> 掃描參數設定
                        </h3>
                        <div className="scan-config-list">
                            {unit.params?.map(p => (
                                <div key={p.id} className="scan-config-row">
                                    <label className="scan-check">
                                        <input
                                            type="checkbox"
                                            checked={scanParams[p.id]?.active ?? false}
                                            onChange={e => setScanParams(prev => ({ ...prev, [p.id]: { ...prev[p.id], active: e.target.checked } }))}
                                        />
                                        <span>{p.label}</span>
                                    </label>
                                    {scanParams[p.id]?.active && (
                                        <div className="scan-inputs">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>Start</span>
                                                <input type="number" value={scanParams[p.id].start} onChange={e => setScanParams(prev => ({ ...prev, [p.id]: { ...prev[p.id], start: parseFloat(e.target.value) } }))} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>End</span>
                                                <input type="number" value={scanParams[p.id].end} onChange={e => setScanParams(prev => ({ ...prev, [p.id]: { ...prev[p.id], end: parseFloat(e.target.value) } }))} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>Step</span>
                                                <input type="number" value={scanParams[p.id].step} onChange={e => setScanParams(prev => ({ ...prev, [p.id]: { ...prev[p.id], step: parseFloat(e.target.value) } }))} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className="btn-execute" style={{ width: '100%', marginTop: '12px' }} onClick={handleOptimize} disabled={isOptimizing}>
                            {isOptimizing ? '優化計算中...' : '開始參數優化掃描'}
                        </button>
                    </div>

                    {scanResults.length > 0 && (
                        <div className="section-card scan-results-area" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="results-table-header" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-header)', fontSize: '0.7rem' }}>
                                🏆 優化排名 (依報酬率排序)
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="scan-table">
                                    <thead>
                                        <tr>
                                            <th>參數組合</th>
                                            <th>報酬 %</th>
                                            <th>風報比</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scanResults.map((r, i) => (
                                            <tr key={i} onClick={() => {
                                                // Apply these params to current code and run once to refresh main charts
                                                Object.entries(r.params).forEach(([id, val]: [string, any]) => handleParamChange(id, val.toString()));
                                                setRightView('code');
                                                handleRun();
                                            }} style={{ cursor: 'pointer' }}>
                                                <td>{Object.values(r.params).join(' / ')}</td>
                                                <td className={r.return > 0 ? 'up' : r.return < 0 ? 'down' : ''}>{format4(r.return)}%</td>
                                                <td>{format4(r.score)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
