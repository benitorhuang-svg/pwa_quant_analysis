/**
 * data-loader.ts — 雙數據源管理 (with caching)
 */

export interface OHLCVBar {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
}

export interface LoadResult {
    data: OHLCVBar[];
    source: 'real' | 'simulated';
    symbol: string;
}

// ─── Cache ──────────────────────────────────
const dataCache = new Map<string, { data: OHLCVBar[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(symbol: string): OHLCVBar[] | null {
    const cached = dataCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Data] Cache hit: ${symbol}`);
        return cached.data;
    }
    return null;
}

function setCache(symbol: string, data: OHLCVBar[]) {
    dataCache.set(symbol, { data, timestamp: Date.now() });
}

// ─── Yahoo Finance URL ──────────────────────────────────
function yahooChartUrl(symbol: string) {
    // Ensure Taiwan stocks have .TW suffix
    const s = symbol.includes('.') ? symbol : `${symbol}.TW`;
    return `/v8/finance/chart/${encodeURIComponent(s)}?range=2y&interval=1d`;
}

// ─── Parse Yahoo response ──────────────────────────────────
function parseYahooResponse(json: any): OHLCVBar[] | null {
    const result = json.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) return null;

    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0];
    const data: OHLCVBar[] = [];

    for (let i = 0; i < timestamps.length; i++) {
        if (quote.open[i] === null || quote.close[i] === null) continue;
        data.push({
            Date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
            Open: quote.open[i],
            High: quote.high[i],
            Low: quote.low[i],
            Close: quote.close[i],
            Volume: quote.volume[i] || 0
        });
    }
    return data.length > 50 ? data : null;
}

// ─── Fetch strategies (tried in order) ──────────────────────────────────
async function tryFetch(url: string, label: string): Promise<OHLCVBar[] | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const json = await res.json();
        const data = parseYahooResponse(json);
        if (data) console.log(`[Data] ✅ ${label} 成功 (${data.length} 根K線)`);
        return data;
    } catch (e) {
        console.warn(`[Data] ❌ ${label} 失敗:`, (e as Error).message);
        return null;
    }
}

// ─── Main Loader ──────────────────────────────────
export async function loadStockData(symbol = '2330.TW'): Promise<LoadResult> {
    // Check cache first
    const cached = getCached(symbol);
    if (cached) {
        return { data: cached, source: 'real', symbol };
    }

    const chartPath = yahooChartUrl(symbol);
    const yahooFull = `https://query1.finance.yahoo.com${chartPath}`;

    // Strategy 1: Vite dev proxy (works in local development)
    let data = await tryFetch(`/api/yahoo${chartPath}`, 'Vite Dev Proxy');

    // Strategy 2: Multiple CORS proxies (for production / GitHub Pages)
    if (!data) {
        const proxies = [
            `https://corsproxy.io/?url=${encodeURIComponent(yahooFull)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooFull)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooFull)}`,
        ];
        for (const proxyUrl of proxies) {
            data = await tryFetch(proxyUrl, new URL(proxyUrl).hostname);
            if (data) break;
        }
    }

    if (data) {
        setCache(symbol, data);
        return { data, source: 'real', symbol };
    }

    // Strategy 3: Fallback to simulated data
    console.warn('[Data] 所有數據源均失敗，使用模擬數據');
    const simData = generateSimulatedData(500);
    return { data: simData, source: 'simulated', symbol: '模擬股票' };
}

export function generateSimulatedData(n = 500, startPrice = 100): OHLCVBar[] {
    const data: OHLCVBar[] = [];
    let price = startPrice;
    const today = new Date();

    for (let i = 0; i < n; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (n - i));
        const trend = Math.sin(i / 80) * 0.002;
        const noise = (Math.random() - 0.48) * 0.03;
        const change = price * (trend + noise);
        const open = price, close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);

        data.push({
            Date: date.toISOString().slice(0, 10),
            Open: Math.round(open * 100) / 100,
            High: Math.round(high * 100) / 100,
            Low: Math.round(low * 100) / 100,
            Close: Math.round(close * 100) / 100,
            Volume: Math.floor(5000 + Math.random() * 15000)
        });
        price = close;
    }
    return data;
}
