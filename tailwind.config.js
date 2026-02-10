// Tailwind config for CoEx
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#F9F7F5', // Warm Canvas
                    100: '#F0EBE8',
                    200: '#E2D6CF',
                    300: '#D4C2B6',
                    400: '#C5AD9E',
                    500: '#A0785A', // Core mid-tone (kept for compatibility, maybe adjust?)
                    600: '#8C5E4A',
                    700: '#754A3A',
                    800: '#5E3A2E', // Deep Organic
                    900: '#4A3B32', // Technical Chocolate (Primary)
                    950: '#2D231E',
                },
                accent: {
                    teal: '#0D9488', // Scientific Teal
                    orange: '#F97316', // Alert Orange
                },
                // Refined attribute colors - "Matte Science"
                attr: {
                    cacao: '#754c29',
                    bitterness: '#9D1F4F', // Less neon pink, more berry
                    astringency: '#366d99',
                    roast: '#D97706', // Burnt orange instead of bright yellow
                    acidity: '#15803D', // Forest green
                    fresh_fruit: '#EAB308', // Mustard yellow
                    browned_fruit: '#78350F', // Dried fruit brown
                    vegetal: '#115E59', // Deep teal
                    floral: '#65A30D', // Olive green
                    woody: '#A97C50',
                    spice: '#B91C1C', // Deep red
                    nutty: '#A0A368',
                    caramel: '#C26A30', // Bronze
                    sweetness: '#F472B6', // Muted pink
                    defects: '#64748B', // Slate gray
                }
            },
            fontFamily: {
                heading: ['Space Grotesk', 'sans-serif'],
                sans: ['Mulish', 'sans-serif'],
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'], // Default mono stack for now
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, #E2D6CF 1px, transparent 1px), linear-gradient(to bottom, #E2D6CF 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
