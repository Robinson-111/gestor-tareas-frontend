/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Tokens temáticos: sus valores viven en variables CSS (index.css)
        // y se invierten bajo la clase .dark del <html>.
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        sidebar: 'rgb(var(--c-sidebar) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        brand: {
          50: '#F2F0FF',
          100: '#E8E4FF',
          200: '#D3CCFF',
          300: '#B6A9FF',
          400: '#9584FF',
          500: '#7664F5',
          600: '#5B4BE0',
          700: '#4B3CC4',
          800: '#3E32A2',
          900: '#30277C',
        },
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        // Escala slate remapeada a variables para que los componentes existentes
        // (bg-slate-50, text-slate-600, …) se adapten solos al tema oscuro.
        slate: {
          50: 'rgb(var(--c-s50) / <alpha-value>)',
          100: 'rgb(var(--c-s100) / <alpha-value>)',
          200: 'rgb(var(--c-s200) / <alpha-value>)',
          300: 'rgb(var(--c-s300) / <alpha-value>)',
          400: 'rgb(var(--c-s400) / <alpha-value>)',
          500: 'rgb(var(--c-s500) / <alpha-value>)',
          600: 'rgb(var(--c-s600) / <alpha-value>)',
          700: 'rgb(var(--c-s700) / <alpha-value>)',
          800: 'rgb(var(--c-s800) / <alpha-value>)',
          900: 'rgb(var(--c-s900) / <alpha-value>)',
          950: '#020617',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(25, 31, 61, 0.03), 0 8px 24px -18px rgba(25, 31, 61, 0.25)',
        soft: '0 10px 35px -18px rgba(53, 44, 114, 0.22)',
        float: '0 24px 60px -20px rgba(38, 30, 90, 0.28)',
        drawer: '-24px 0 70px -30px rgba(38, 30, 90, 0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(36px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.16s ease-out',
      },
    },
  },
  plugins: [],
}
