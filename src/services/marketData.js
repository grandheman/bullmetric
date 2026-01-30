
/**
 * Market Data Service
 * Fetches current market data for Symbols (Futures, Index, ETFs).
 * Uses local Vite proxy to bypass CORS for Yahoo Finance.
 * 
 * LOGIC:
 * - During NY Market Hours (9:30 - the 16:00 close), fetch live.
 * - After Market Hours, fetch the 16:00 EST Close price for ALL symbols.
 *   This ensures /ES (which trades 23/5) aligns with SPX (which closes at 16:00).
 */

const SYMBOLS = {
    ES: 'ES=F',
    SPX: '^GSPC',
    SPY: 'SPY',
    NQ: 'NQ=F',
    NDX: '^NDX',
    QQQ: 'QQQ'
};

const PROXY_BASE = '/api/yahoo/v8/finance/chart/';

/**
 * Checks if the NY Market (Equity) is currently open.
 * Returns { isOpen: boolean, reason: string }
 */
export function getMarketStatus() {
    const now = new Date();
    const options = { timeZone: 'America/New_York', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'long' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const getPart = (type) => parts.find(p => p.type === type)?.value;
    const hour = parseInt(getPart('hour'));
    const minute = parseInt(getPart('minute'));
    const day = getPart('weekday');

    // Weekends
    if (day === 'Saturday' || day === 'Sunday') {
        return { isOpen: false, status: 'Closed (Weekend)', isPostMarket: true };
    }

    // Market Hours: 09:30 to 16:00 EST
    const time = hour + (minute / 60);

    if (time < 9.5) {
        return { isOpen: false, status: 'Closed (Pre-market)', isPostMarket: false }; // Before 9:30
    }
    if (time >= 16) {
        return { isOpen: false, status: 'Closed (Post-market)', isPostMarket: true }; // After 16:00
    }

    return { isOpen: true, status: 'Open', isPostMarket: false };
}

/**
 * fetches price for a symbol.
 * If market is closed (Post-Market), tries to find 16:00 candle.
 */
async function fetchSymbolPrice(symbolKey) {
    const yahooSymbol = SYMBOLS[symbolKey] || symbolKey;
    const { isPostMarket } = getMarketStatus();

    // If post-market, we want the specific 16:00 Close.
    // We fetch a 1-day chart with 1-minute intervals to find the 4:00 PM candle.
    // If open, we just want the latest.

    const url = `${PROXY_BASE}${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d&includePrePost=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result) return null;

        // Standard Live Price
        const meta = result.meta;
        let price = meta.regularMarketPrice || meta.chartPreviousClose;

        // Special Handling for Post-Market Sync
        if (isPostMarket) {
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            if (timestamps && closes) {
                // Find 16:00 EST timestamp
                // Timestamps are unix seconds.
                // We need 16:00 EST of the current (or last) trading day.
                // Since we requested range=1d for TODAY (or last trading day), 
                // we just look for the timestamp whose time in NY is 15:59 or 16:00.

                // Actually easiest way: Find the LAST timestamp that is <= 16:00 EST.
                // Convert each timestamp to NY Time.

                for (let i = timestamps.length - 1; i >= 0; i--) {
                    const t = timestamps[i];
                    const date = new Date(t * 1000);
                    const nyTime = date.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
                    // Format "16:00:00"

                    if (nyTime.startsWith('16:00') || nyTime.startsWith('15:59')) {
                        // Found the close candle
                        if (closes[i]) {
                            price = closes[i];
                            break;
                        }
                    }
                    // If we pass 16:00 backwards (e.g. we see 15:58), stop if we want STRICT 16:00, 
                    // but normally the last candle of the day IS the close.
                    // Yahoo 1d range usually ends at 16:00 for indices, but ES continues?
                    // If request has includePrePost=false, ES might stop at 16:15 or 17:00.
                    // However, let's just stick to finding 16:00 explicitly.
                }
            }
        }

        return price;
    } catch (err) {
        console.error(`Error fetching ${symbolKey}:`, err);
        return null;
    }
}

export async function fetchMarketData(symbolsList = Object.keys(SYMBOLS)) {
    const results = {};
    await Promise.all(symbolsList.map(async (key) => {
        results[key] = await fetchSymbolPrice(key);
    }));
    return results;
}
