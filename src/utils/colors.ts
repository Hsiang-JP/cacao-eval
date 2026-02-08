import { currentConfig } from '../constants';

export const getAttributeColor = (id: string) => {
    const attr = currentConfig.attributes.find(a => a.id === id);
    if (attr?.color) return attr.color;

    // Fallback or explicit mapping for items not in attributes list (if any)
    return '#a0785a';
};

export const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
