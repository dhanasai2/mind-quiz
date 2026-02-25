/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix': {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
          950: '#1a0540',
        },
        'neon': {
          cyan: '#00f5ff',
          purple: '#bf00ff',
          green: '#39ff14',
          pink: '#ff006e',
          blue: '#4361ee',
          yellow: '#ffd60a',
        },
        'dark': {
          DEFAULT: '#0a0a0f',
          100: '#16161f',
          200: '#1e1e2e',
          300: '#2a2a3d',
          400: '#363650',
        }
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'matrix-rain': 'matrixRain 20s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'neural-pulse': 'neuralPulse 3s ease-in-out infinite',
        'breathe': 'breatheGlow 4s ease-in-out infinite',
        'electric-arc': 'electricArc 3s ease-in-out infinite',
        'hex-rotate': 'hexRotate 20s linear infinite',
        'synaptic-flash': 'synapticFlash 2s ease-in-out infinite',
        'waveform': 'waveform 1.5s ease-in-out infinite',
        'scan-line': 'scanLine 8s linear infinite',
        'orbit': 'orbit 6s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.8), 0 0 60px rgba(124, 58, 237, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        neuralPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124,58,237,0.3), 0 0 15px rgba(124,58,237,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(124,58,237,0.5), 0 0 50px rgba(124,58,237,0.2)' },
        },
        breatheGlow: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        synapticFlash: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
