import type { UnitDef } from './units/types';

/**
 * Unified unit registry — single source of truth.
 * Adding a new unit only requires ONE entry here.
 */
interface UnitEntry {
    loader: () => Promise<{ [key: string]: UnitDef }>;
    exportKey: string;
    title: string;
    module: string;
}

export const UNITS: Record<string, UnitEntry> = {
    '1-1': { loader: () => import('./units/1-1-dual-ma'), exportKey: 'unitDualMA', title: '雙均線策略', module: '模組一 · 量化入門' },
    '2-1': { loader: () => import('./units/2-1-macd'), exportKey: 'unitMacd', title: '經典 MACD 策略', module: '模組二 · 趨勢跟蹤' },
    '2-2': { loader: () => import('./units/2-2-adx-macd'), exportKey: 'unitAdxMacd', title: '利用平均趨向指數輔助MACD策略', module: '模組二 · 趨勢跟蹤' },
    '2-3': { loader: () => import('./units/2-3-ama'), exportKey: 'unitAma', title: '自適應動態雙均線策略 (AMA)', module: '模組二 · 趨勢跟蹤' },
    '2-4': { loader: () => import('./units/2-4-aroon'), exportKey: 'unitAroon', title: '阿隆指標 AROON 策略', module: '模組二 · 趨勢跟蹤' },
    '2-5': { loader: () => import('./units/2-5-emv'), exportKey: 'unitEmv', title: '簡易波動 EMV 策略', module: '模組二 · 趨勢跟蹤' },
    '2-6': { loader: () => import('./units/2-6-bollinger'), exportKey: 'unitBollinger', title: '布林帶 Bollinger Bands 策略', module: '模組二 · 趨勢跟蹤' },
    '2-7': { loader: () => import('./units/2-7-rsi'), exportKey: 'unitRsi', title: '相對強弱 RSI 策略', module: '模組二 · 趨勢跟蹤' },
    '2-8': { loader: () => import('./units/2-8-kdj'), exportKey: 'unitKdj', title: '隨機指標 KDJ 策略', module: '模組二 · 趨勢跟蹤' },
    '3-1': { loader: () => import('./units/3-1-dual-thrust'), exportKey: 'unitDualThrust', title: 'Dual Thrust 策略', module: '模組三 · 突破策略' },
    '3-2': { loader: () => import('./units/3-2-hl-breakout'), exportKey: 'unitHlBreakout', title: '日內高低點突破策略', module: '模組三 · 突破策略' },
    '3-3': { loader: () => import('./units/3-3-donchian'), exportKey: 'unitDonchian', title: '增強版唐奇安通道策略', module: '模組三 · 突破策略' },
    '3-4': { loader: () => import('./units/3-4-hans123'), exportKey: 'unitHans123', title: 'Hans123 日內突破策略', module: '模組三 · 突破策略' },
    '3-5': { loader: () => import('./units/3-5-fiali'), exportKey: 'unitFiali', title: '菲阿里四價策略', module: '模組三 · 突破策略' },
    '3-6': { loader: () => import('./units/3-6-dynamic-breakout'), exportKey: 'unitDynamicBreakout', title: '動態波幅突破策略', module: '模組三 · 突破策略' },
    '3-7': { loader: () => import('./units/3-7-r-breaker'), exportKey: 'unitRBreaker', title: 'R-breaker 交易策略', module: '模組三 · 突破策略' },
    '4-1': { loader: () => import('./units/4-1-thermostat'), exportKey: 'unitThermostat', title: '經典恆溫器策略', module: '模組四 · 切換策略' },
    '4-2': { loader: () => import('./units/4-2-macd-rsi'), exportKey: 'unitMacdRsi', title: 'MACD + RSI 雙重過濾策略', module: '模組四 · 切換策略' },
    '5-1': { loader: () => import('./units/5-1-arbitrage'), exportKey: 'unitArbitrage', title: '期貨跨期套利實戰', module: '模組五 · 高級交易與套利' },
    '5-2': { loader: () => import('./units/5-2-bias'), exportKey: 'unitBias', title: '乖離率 BIAS 策略', module: '模組五 · 高級交易與套利' },
    '6-1': { loader: () => import('./units/6-1-martingale'), exportKey: 'unitMartingale', title: '馬丁格爾策略與倍增法', module: '模組六 · 風險管理' },
    '6-2': { loader: () => import('./units/6-2-kelly'), exportKey: 'unitKelly', title: '凱利公式部位管理', module: '模組六 · 風險管理' },
    '6-4': { loader: () => import('./units/6-4-anti-martingale'), exportKey: 'unitAntiMartingale', title: '反向馬丁格爾 (逆勢倍增法)', module: '模組六 · 風險管理' },
    '7-1': { loader: () => import('./units/7-1-fundamentals'), exportKey: 'unitFundamentals', title: '基本面與技術面結合實踐', module: '模組七 · 終極實戰' },
    '8-1': { loader: () => import('./units/8-1-linear-regression'), exportKey: 'unitLinearRegression', title: '線性回歸價格預測', module: '模組八 · 機器學習入門' },
};

// Derived helpers for backward compatibility
export const UNIT_METADATA: Record<string, { title: string; module: string }> = Object.fromEntries(
    Object.entries(UNITS).map(([id, { title, module }]) => [id, { title, module }])
);
