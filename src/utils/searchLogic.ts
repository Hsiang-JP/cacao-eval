import { StoredSample } from '../services/dbService';

type FilterCondition = {
    key: string;
    operator: '>' | '<' | '>=' | '<=' | '=' | ':';
    value: number | string;
};

/**
 * Parses a search query string into a list of OR-groups.
 * Each OR-group is a list of AND-conditions.
 * Example: "score > 5 OR acidity > 3" -> [[{score > 5}], [{acidity > 3}]]
 * Example: "score > 5 cocoa" -> [[{score > 5}, {text: cocoa}]]
 */
export const parseSearchQuery = (query: string) => {
    // 1. Split by ' OR ' (case insensitive)
    const orParts = query.split(/\s+OR\s+/i);

    return orParts.map(part => {
        const conditions: (FilterCondition | { text: string })[] = [];

        // Match patterns like "key operator value"
        // Operators: >=, <=, >, <, =, :
        // Values: numbers or strings
        const conditionRegex = /([a-zA-Z_]+)\s*(>=|<=|>|<|=|:)\s*([0-9.]+|"[^"]+"|\S+)/g;

        // We need to extract conditions and remove them from the string to identify remaining text
        let remainingText = part;
        let match;

        // Loop through all matches
        while ((match = conditionRegex.exec(part)) !== null) {
            const [fullMatch, key, operator, valueStr] = match;

            // Clean up value (remove quotes if present)
            let value: string | number = valueStr.replace(/^"(.*)"$/, '$1');
            const numValue = parseFloat(value as string);
            if (!isNaN(numValue)) {
                value = numValue;
            }

            conditions.push({
                key: key.toLowerCase(),
                operator: operator as any,
                value
            });

            // Remove this match from remaining text to find plain keywords later
            // We use a placeholder to preserve spacing/structure if needed, or just replace
            // A simple replace might replace wrong occurrences, so we use the index from regex
            // But for simplicity in this pass, let's just create a "clean" string 
        }

        // Re-construct remaining text by removing all matched patterns
        const textOnly = part.replace(conditionRegex, '').trim();
        if (textOnly) {
            // Split remaining text by spaces -> multiple keywords (implicit AND)
            const keywords = textOnly.split(/\s+/);
            keywords.forEach(k => conditions.push({ text: k.toLowerCase() }));
        }

        return conditions;
    });
};

/**
 * Checks if a sample matches the advanced filter query.
 */
export const matchesSearch = (sample: StoredSample, query: string): boolean => {
    const orGroups = parseSearchQuery(query);

    // If any OR-group matches, the sample matches
    return orGroups.some(andConditions => {
        // All conditions in an AND-group must match
        return andConditions.every(condition => {
            if ('text' in condition) {
                // Text search: Matches Code, Evaluator, or Attribute Names
                const text = condition.text;
                if (sample.sampleCode.toLowerCase().includes(text)) return true;
                if (sample.evaluator.toLowerCase().includes(text)) return true;
                if (sample.evaluationType.toLowerCase().includes(text)) return true;
                // Search in attribute names (e.g. searching 'cocoa' matches 'cocoa' attribute existance? maybe not useful)
                // Let's keep text search strictly for metadata for now, OR maybe "TDS" keyword
                if (text === 'tds' && sample.tdsProfile && sample.tdsProfile.events.length > 0) return true;
                return false;
            } else {
                // Key-Value Condition
                const { key, operator, value } = condition;

                // Resolve value from sample
                let actualValue: number | string | undefined;

                if (key === 'score') {
                    actualValue = sample.globalQuality;
                } else if (key === 'year') {
                    actualValue = parseInt(sample.date.substring(0, 4));
                } else if (key === 'date') {
                    actualValue = sample.date;
                } else {
                    // Try to find an attribute with this name (English or Spanish)
                    // We check if "key" is start of an attribute name
                    const attr = sample.attributes.find(a =>
                        a.nameEn.toLowerCase().startsWith(key) ||
                        a.nameEs.toLowerCase().startsWith(key)
                    );
                    if (attr) {
                        actualValue = attr.score;
                    }
                }

                if (actualValue === undefined) return false; // Key not found on sample

                // Compare
                if (typeof value === 'number' && typeof actualValue === 'number') {
                    switch (operator) {
                        case '>': return actualValue > value;
                        case '>=': return actualValue >= value;
                        case '<': return actualValue < value;
                        case '<=': return actualValue <= value;
                        case '=': return actualValue === value;
                        case ':': return actualValue === value;
                        default: return false;
                    }
                } else {
                    // String comparison (only = or :)
                    const sActual = String(actualValue).toLowerCase();
                    const sValue = String(value).toLowerCase();
                    if (operator === '=' || operator === ':') {
                        return sActual.includes(sValue);
                    }
                    return false;
                }
            }
        });
    });
};
