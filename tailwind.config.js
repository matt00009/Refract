/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Libre Franklin', 'system-ui', 'sans-serif'],
        mono: ['Courier Prime', 'JetBrains Mono', 'Courier New', 'monospace'],
      },
      screens: {
        xs: '400px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        'rf-void':    '#080B0F',
        'rf-depth':   '#0D1117',
        'rf-forest':  '#141E1A',
        'rf-surface': '#1E2D28',
        'rf-border':  '#2A3D35',
        'rf-volt':    '#A8FF3E',
        'rf-sky':     '#79C0FF',
        'rf-ember':   '#FF9070',
        'rf-warn':    '#FFD166',
        'rf-mist':    '#E8F0E0',
      },
      spacing: {
        'gutter-xs': '4px',
        'gutter-sm': '8px',
        'gutter-md': '16px',
        'gutter-lg': '24px',
        'gutter-xl': '32px',
      },
      borderWidth: {
        hairline: '0.5px',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'dot-pulse': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.3' },
          '40%':           { transform: 'scale(1)',   opacity: '1'   },
        },
        'volt-glow': {
          '0%, 100%': { boxShadow: '0 0 4px 0px rgba(168,255,62,0.3)' },
          '50%':      { boxShadow: '0 0 12px 2px rgba(168,255,62,0.6)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'scan-line':    'scan-line 4s linear infinite',
        'dot-pulse':    'dot-pulse 1.4s ease-in-out infinite',
        'volt-glow':    'volt-glow 2s ease-in-out infinite',
        'slide-up':     'slide-up 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
};
