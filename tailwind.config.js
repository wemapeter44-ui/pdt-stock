/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: '#030712', // Very dark blue/black
        surface: '#0B1120',    // Slightly lighter for cards
        border: '#1E293B',     // Subtle borders
        
        // Brand Colors (Cyan/Blue)
        brand: {
          400: '#22d3ee', // Cyan
          500: '#0ea5e9', // Light Blue
          600: '#2563eb', // Deep Blue
        },
        
        // Text
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.15)',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.2)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.15)',
        'glow-orange': '0 0 20px rgba(245, 158, 11, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #22d3ee 0%, #2563eb 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}