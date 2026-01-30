
/**
 * Futures Contract Utilities
 * Handles logic for contract codes (H, M, U, Z) and rollover dates.
 */

const MONTH_CODES = {
    3: 'H',  // March
    6: 'M',  // June
    9: 'U',  // September
    12: 'Z'  // December
};

/**
 * Determines the current active futures contract based on the date.
 * Equity Index futures roll over on the Thursday before the 3rd Friday of the contract month.
 * However, volume often shifts a week prior. For simplicity, we'll suggest the next contract
 * if we are within 7 days of the 3rd Friday of the expiration month.
 */
export function getCurrentFuturesSymbol(rootSymbol, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed, so +1

    // Expiration months are 3, 6, 9, 12.
    // Find the next expiration month.
    let targetYear = year;
    let targetMonthCode = '';

    // Logic:
    // If we are in Dec (post-expiration), go to next year Mar.
    // If we are in a non-expiration month, go to next expiration month.
    // If we are in an expiration month, check if we passed rollover.

    // Simplified logic for "Majority of traders" (Volume switch usually happens ~1 week before expiration)
    // 3rd Friday calculation:
    // 1st day of month -> find Friday -> add 2 weeks.

    const getThirdFriday = (y, m) => {
        const firstDay = new Date(y, m - 1, 1);
        const dayOfWeek = firstDay.getDay(); // 0=Sun, 5=Fri
        const diff = (5 - dayOfWeek + 7) % 7;
        const firstFriday = 1 + diff;
        return firstFriday + 14;
    };

    const expirationMonths = [3, 6, 9, 12];
    let found = false;

    for (let m of expirationMonths) {
        if (month < m) {
            targetMonthCode = MONTH_CODES[m];
            found = true;
            break;
        } else if (month === m) {
            const thirdFriday = getThirdFriday(year, m);
            // Rollover usually Thursday before 3rd Friday, active trading moves days before.
            // Let's pick 8 days before 3rd Friday as the visual "Rollover" warning start, 
            // and switch "Active" recommendation on the Thursday before (day 3rdFri - 1).

            const rolloverDay = thirdFriday - 8; // Approx start of roll
            const switchDay = thirdFriday; // Expiration

            if (date.getDate() < switchDay) {
                targetMonthCode = MONTH_CODES[m];
                found = true;
                break;
            }
        }
    }

    if (!found) {
        // Must be late Dec, roll to March next year
        targetYear = year + 1;
        targetMonthCode = MONTH_CODES[3];
    }

    // Symbol format: ES + Code + LastDigitYear (e.g., ESM6 or ESH6)
    // Yahoo often uses ES=F for the "Current Active Chain", but specific contracts are ESH26.CME etc.
    // For display purposes, Traders usually say "ESH6".
    const shortYear = targetYear.toString().slice(-1); // Last digit only? Or 2? 
    // Industry standard often 1 digit for quick ref, or 2. Let's use 1 digit if standard, 
    // but many platforms use 2 (e.g. H26). User asked for "logically makes sense". 
    // Tradovate/NinjaTrader often use 2 digits (OSH26). 
    // Let's return both format.

    const twoDigitYear = targetYear.toString().slice(-2);

    return {
        root: rootSymbol,
        monthCode: targetMonthCode,
        year: targetYear,
        shortCode: `${rootSymbol}${targetMonthCode}${twoDigitYear}`, // e.g. ESH26
        displayText: `${rootSymbol} ${MONTH_CODES[targetMonthCode]} '${twoDigitYear}` // e.g. ES Z '25
    };
}

export function getRolloverStatus(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const expirationMonths = [3, 6, 9, 12];

    if (!expirationMonths.includes(month)) return null;

    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay();
    const diff = (5 - dayOfWeek + 7) % 7;
    const thirdFriday = 1 + diff + 14;

    const today = date.getDate();
    const daysUntilExpiration = thirdFriday - today;

    if (daysUntilExpiration > 0 && daysUntilExpiration <= 10) {
        return {
            isRolloverPeriod: true,
            message: `Rollover Period! Expiration in ${daysUntilExpiration} days (${month}/${thirdFriday}). Volume is shifting.`
        };
    }

    return null;
}
