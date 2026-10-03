/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fc',
                    400: '#36abf8',
                    500: '#0c8ee9',
                    600: '#0070c7',
                    700: '#0259a2',
                    800: '#064b85',
                    900: '#0b3f6f',
                    950: '#072849',
                },
                kiosk: {
                    bg: '#0a0d14',
                    surface: '#121824',
                    card: '#1a2332',
                    border: '#2a364f',
                    accent: '#38bdf8',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)' },
                    '100%': { boxShadow: '0 0 30px rgba(56, 189, 248, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
