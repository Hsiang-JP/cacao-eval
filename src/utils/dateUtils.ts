/**
 * Date utility functions for CoEx App
 */

/**
 * Returns a date string formatted as dd-mm-yy
 * Useful for filenames (e.g. cacao_eval_30-01-26)
 */
export const getDateStringForFilename = (date: Date = new Date()): string => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}-${m}-${y}`;
};

/**
 * Formats a YYYY-MM-DD string into localized format
 * ES: DD/MM/YYYY
 * EN: YYYY-MM-DD (or standard ISO)
 */
export const formatDateForDisplay = (dateStr: string, language: 'en' | 'es'): string => {
    if (!dateStr) return '';

    if (language === 'es') {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // parts[0] is year, parts[1] is month, parts[2] is day
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    return dateStr;
};

/**
 * Returns current date in YYYY-MM-DD format (for input[type=date])
 */
export const getCurrentISODate = (): string => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Returns current time in HH:mm format
 */
export const getCurrentTime = (): string => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
