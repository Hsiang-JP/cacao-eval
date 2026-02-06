/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cacao: {
                    50: '#fdf8f6',
                    100: '#f2e8e5',
                    200: '#eaddd7',
                    300: '#e0cec7',
                    400: '#d2bab0',
                    500: '#a0785a',
                    600: '#8c5e4a',
                    700: '#754a3a',
                    800: '#5e3a2e',
                    900: '#4a2e24',
                },
                // Add attribute colors as utility classes (e.g., text-attr-cacao)
                attr: {
                    cacao: '#754c29',
                    bitterness: '#a01f65',
                    astringency: '#366d99',
                    roast: '#ebab21',
                    acidity: '#00954c',
                    fresh_fruit: '#f6d809',
                    browned_fruit: '#431614',
                    vegetal: '#006260',
                    floral: '#8dc63f',
                    woody: '#a97c50',
                    spice: '#c33d32',
                    nutty: '#a0a368',
                    caramel: '#bd7844',
                    sweetness: '#ffc6e0',
                    defects: '#a7a9ac',
                }
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
