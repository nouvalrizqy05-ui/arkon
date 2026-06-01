/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Emerald Design System ──────────────────────
        primary:        '#059669', // emerald-600
        'primary-hover':'#047857', // emerald-700
        'primary-light':'#d1fae5', // emerald-100
        'primary-soft': '#ecfdf5', // emerald-50
        // Base neutrals
        foreground: '#0f172a',     // slate-900
        secondary:  '#64748b',     // slate-500
        muted:      '#f8fafc',     // slate-50
        border:     '#e2e8f0',     // slate-200
        // Accent for data/charts
        accent:     '#0ea5e9',     // sky-500
      },
      fontFamily: {
        sans: ['Lexend Deca', 'sans-serif'],
      },
      boxShadow: {
        'emerald-sm':  '0 1px 3px 0 rgba(5,150,105,.12), 0 1px 2px -1px rgba(5,150,105,.08)',
        'emerald-md':  '0 4px 16px -2px rgba(5,150,105,.18), 0 2px 6px -2px rgba(5,150,105,.10)',
        'emerald-lg':  '0 10px 40px -4px rgba(5,150,105,.22), 0 4px 16px -4px rgba(5,150,105,.12)',
        'card':        '0 1px 4px 0 rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)',
        'card-hover':  '0 4px 20px -2px rgba(15,23,42,.10), 0 0 0 1px rgba(15,23,42,.05)',
        'float':       '0 20px 60px -10px rgba(5,150,105,.20), 0 8px 24px -8px rgba(15,23,42,.10)',
      },
      animation: {
        'marquee':          'marquee 40s linear infinite',
        'float-3d':         'float3d 6s ease-in-out infinite',
        'float-3d-reverse': 'float3dReverse 7s ease-in-out infinite',
        'fade-up':          'fadeUp .4s cubic-bezier(.16,1,.3,1) both',
        'slide-in-right':   'slideInRight .35s cubic-bezier(.16,1,.3,1) both',
        'scale-in':         'scaleIn .25s cubic-bezier(.16,1,.3,1) both',
        'shimmer':          'shimmer 1.8s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float3d: {
          '0%,100%': { transform: 'translateY(0px) rotateX(0deg) rotateY(0deg)' },
          '25%':     { transform: 'translateY(-12px) rotateX(3deg) rotateY(5deg)' },
          '50%':     { transform: 'translateY(-6px) rotateX(-2deg) rotateY(-3deg)' },
          '75%':     { transform: 'translateY(-15px) rotateX(4deg) rotateY(-4deg)' },
        },
        float3dReverse: {
          '0%,100%': { transform: 'translateY(0px) rotateX(0deg) rotateY(0deg)' },
          '25%':     { transform: 'translateY(-15px) rotateX(-4deg) rotateY(-5deg)' },
          '50%':     { transform: 'translateY(-8px) rotateX(3deg) rotateY(4deg)' },
          '75%':     { transform: 'translateY(-12px) rotateX(-3deg) rotateY(3deg)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: 0, transform: 'translateX(20px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(.94)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
};
