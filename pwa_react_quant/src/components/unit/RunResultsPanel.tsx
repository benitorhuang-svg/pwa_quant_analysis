/**
 * RunResultsPanel.tsx — 回測結果展示（圖表 + 交易記錄）
 */
import type { StrategyStats } from '../../types/backtest';
import { Play, FileDown } from 'lucide-react';
import { downloadChart } from './utils';
import { exportCsv } from '../../engine/csv-exporter';
import TradeTable from './TradeTable';

interface Props {
    stats: StrategyStats | null;
    unitId: string;
}

export default function RunResultsPanel({ stats, unitId }: Props) {
    if (!stats) {
        return (
            <div className="empty-state">
                <Play size={44} />
                <p>尚未執行策略代碼</p>
                <p>點擊右側「Run」按鈕查看單次回測結果</p>
            </div>
        );
    }

    return (
        <>
            <div className="chart-container" style={{ minHeight: '400px' }}>
                <div className="chart-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => exportCsv(stats, `quant_report_${unitId}.csv`)} style={{ marginRight: '8px' }}>
                        <FileDown size={11} /> 匯出 CSV 報表
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => downloadChart('result-chart', 'equity', unitId)}>
                        <FileDown size={11} /> 下載圖表
                    </button>
                </div>
                <canvas id="result-chart" style={{ width: '100%', height: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="chart-container" style={{ minHeight: '220px' }}>
                    <div className="chart-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => downloadChart('result-underwater-chart', 'drawdown', unitId)}>
                            <FileDown size={11} /> 下載圖表
                        </button>
                    </div>
                    <canvas id="result-underwater-chart" style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="chart-container" style={{ minHeight: '220px' }}>
                    <div className="chart-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => downloadChart('result-dist-chart', 'profit_distribution', unitId)}>
                            <FileDown size={11} /> 下載圖表
                        </button>
                    </div>
                    <canvas id="result-dist-chart" style={{ width: '100%', height: '100%' }} />
                </div>
            </div>

            <div className="chart-container" style={{ minHeight: '180px' }}>
                <div className="chart-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => downloadChart('result-price-ma-chart', 'price_ma', unitId)}>
                        <FileDown size={11} /> 下載圖表
                    </button>
                </div>
                <canvas id="result-price-ma-chart" style={{ width: '100%', height: '100%' }} />
            </div>

            <div className="chart-container" style={{ minHeight: '180px' }}>
                <div className="chart-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => downloadChart('result-volume-chart', 'volume', unitId)}>
                        <FileDown size={11} /> 下載圖表
                    </button>
                </div>
                <canvas id="result-volume-chart" style={{ width: '100%', height: '100%' }} />
            </div>

            <TradeTable trades={stats.trades || []} unitId={unitId} />
        </>
    );
}
