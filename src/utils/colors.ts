export const getAttributeColor = (id: string) => {
    switch (id) {
        case 'cacao': return '#754c29';
        case 'bitterness': return '#a01f65';
        case 'astringency': return '#366d99';
        case 'roast': return '#ebab21';
        case 'acidity': return '#00954c';
        case 'fresh_fruit': return '#f6d809';
        case 'browned_fruit': return '#431614';
        case 'vegetal': return '#006260';
        case 'floral': return '#8dc63f';
        case 'woody': return '#a97c50';
        case 'spice': return '#c33d32';
        case 'nutty': return '#a0a368';
        case 'caramel': return '#bd7844';
        case 'sweetness': return '#ffc6e0';
        case 'defects': return '#a7a9ac';
        default: return '#a0785a';
    }
};

export const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
