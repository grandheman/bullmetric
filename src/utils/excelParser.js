import * as XLSX from 'xlsx';

export const parseExcelData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume first sheet contains the data
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // Detect Format
                // NinjaTrader has 'Instrument' and 'Market pos.'
                const firstRow = jsonData[0];
                const isNinjaTrader = 'Instrument' in firstRow && 'Market pos.' in firstRow;

                let normalizedData;

                if (isNinjaTrader) {
                    normalizedData = jsonData.map(row => parseNinjaTraderRow(row));
                } else {
                    normalizedData = jsonData.map(row => parseGenericRow(row));
                }

                // Filter out any nulls (failed parses)
                resolve(normalizedData.filter(item => item !== null));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const parseCurrency = (value) => {
    if (!value) return 0;
    const strVal = String(value).trim();
    // Handle (123.45) as negative
    const isNegative = strVal.startsWith('(') && strVal.endsWith(')');
    const numericString = strVal.replace(/[^0-9.]/g, '');
    const number = parseFloat(numericString);
    return isNegative ? -number : number;
};

// Helper to generate a deterministic ID based on trade content
const generateDeterministicId = (trade) => {
    // Create a string unique to this trade's core data
    const rawString = `${trade.date}|${trade.platform}|${trade.account}|${trade.symbol}|${trade.type}|${trade.quantity}|${trade.entryPrice}|${trade.exitPrice}|${trade.pnl}|${trade.tradeNumber || ''}`;

    // Simple hash to keep ID length manageable
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
        const char = rawString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Return hex string of hash + some entropy from date to be readable
    return `trade_${Math.abs(hash).toString(16)}`;
};

const parseNinjaTraderRow = (row) => {
    try {
        // NinjaTrader format: "1/9/2026 10:07:11 AM"
        const exitTime = row['Exit time'] || row['Entry time'];
        const dateObj = new Date(exitTime);

        // Calculate a cleaner symbol (e.g. "MNQ MAR26" -> "MNQ") if needed, or keep full. 
        // User usually wants the root symbol. Let's keep full for now, can extract later.

        const partialTrade = {
            date: isValidDate(dateObj) ? dateObj.toISOString() : new Date().toISOString(),
            platform: 'NinjaTrader',
            account: row['Account'] || 'Unknown',
            symbol: row['Instrument'] || 'Unknown',
            type: (row['Market pos.'] || 'Long').toUpperCase(), // Long/Short
            quantity: Number(row['Qty'] || 1),
            pnl: parseCurrency(row['Profit']), // "($204.68)" or "$98.96"
            entryPrice: Number(row['Entry price'] || 0),
            exitPrice: Number(row['Exit price'] || 0),
            commission: parseCurrency(row['Commission']),
            tradeNumber: row['Trade number'],
            raw: row
        };

        return {
            ...partialTrade,
            id: generateDeterministicId(partialTrade),
            source: 'NinjaTrader'
        };
    } catch (e) {
        console.warn('Failed to parse NinjaTrader row:', row, e);
        return null;
    }
};

const parseGenericRow = (row) => {
    try {
        const partialTrade = {
            date: row.Date || row.date || new Date().toISOString(),
            platform: row.Platform || row.platform || 'Manual',
            symbol: row.Symbol || row.symbol || 'N/A',
            type: (row.Type || row.type || 'LONG').toUpperCase(),
            quantity: Number(row.Quantity || row.quantity || 0),
            pnl: Number(row.PnL || row['P/L'] || row.Net || 0),
            entryPrice: Number(row.EntryPrice || row.Price || 0),
            exitPrice: Number(row.ExitPrice || 0),
            commission: 0,
            raw: row
        };

        return {
            ...partialTrade,
            id: generateDeterministicId(partialTrade),
            source: 'Generic'
        };
    } catch (e) {
        return null;
    }
};

const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
};
