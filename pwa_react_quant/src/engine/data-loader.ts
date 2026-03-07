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

// ─── Main Loader ──────────────────────────────────
export async function loadStockData(symbol = '2330.TW'): Promise<LoadResult> {
    // Check cache first
    const cached = getCached(symbol);
    if (cached) {
        return { data: cached, source: 'real', symbol };
    }

    try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;

        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });

        if (res.ok) {
            const json = await res.json();
            const result = json.chart?.result?.[0];

            if (result && result.timestamp && result.indicators?.quote?.[0]) {
                const timestamps = result.timestamp as number[];
                const quote = result.indicators.quote[0];

                const data: OHLCVBar[] = [];
                for (let i = 0; i < timestamps.length; i++) {
                    if (quote.open[i] === null || quote.close[i] === null) continue;

                    const dateObj = new Date(timestamps[i] * 1000);
                    const dateStr = dateObj.toISOString().slice(0, 10);

                    data.push({
                        Date: dateStr,
                        Open: quote.open[i],
                        High: quote.high[i],
                        Low: quote.low[i],
                        Close: quote.close[i],
                        Volume: quote.volume[i] || 0
                    });
                }

                if (data.length > 50) {
                    console.log(`[Data] Yahoo Finance 真實數據: ${symbol} (${data.length} 根K線)`);
                    setCache(symbol, data);
                    return { data, source: 'real', symbol };
                }
            }
        }
        console.warn(`[Data] Yahoo API did not return valid chart data for ${symbol}`);
    } catch (e) {
        console.warn('[Data] Yahoo Finance API 請求失敗，改用模擬數據:', (e as Error).message);
    }

    const data = generateSimulatedData(500);
    return { data, source: 'simulated', symbol: '模擬股票' };
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
