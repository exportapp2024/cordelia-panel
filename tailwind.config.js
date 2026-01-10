/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        slideInFromLeft: {
          '0%': { transform: 'translateX(-10px)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInFromLeftModal: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutToLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideInFromLeftXL: {
          '0%': { transform: 'translateX(calc(-240px - 224px)) translateY(-50%)' },
          '100%': { transform: 'translateX(0) translateY(-50%)' },
        },
        slideOutToLeftXL: {
          '0%': { transform: 'translateX(0) translateY(-50%)' },
          '100%': { transform: 'translateX(calc(-240px - 224px)) translateY(-50%)' },
        },
      },
      animation: {
        'slide-in-left': 'slideInFromLeft 0.2s ease-out',
        'slide-in-left-modal': 'slideInFromLeftModal 0.3s ease-out',
        'slide-out-left': 'slideOutToLeft 0.3s ease-out',
        'slide-in-left-xl': 'slideInFromLeftXL 0.3s ease-out',
        'slide-out-left-xl': 'slideOutToLeftXL 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
