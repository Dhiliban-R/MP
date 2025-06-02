import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        montserrat: ['var(--font-montserrat)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: '#E5E7EB',
        'fdms-blue': {
          DEFAULT: 'hsl(var(--fdms-blue))',
          50: 'hsl(var(--fdms-blue-50))',
          100: 'hsl(var(--fdms-blue-100))',
          200: 'hsl(var(--fdms-blue-200))',
          300: 'hsl(var(--fdms-blue-300))',
          400: 'hsl(var(--fdms-blue-400))',
          500: 'hsl(var(--fdms-blue-500))',
          600: 'hsl(var(--fdms-blue-600))',
          700: 'hsl(var(--fdms-blue-700))',
          800: 'hsl(var(--fdms-blue-800))',
          900: 'hsl(var(--fdms-blue-900))',
        },
        'fdms-green': {
          DEFAULT: 'hsl(var(--fdms-green))',
          50: 'hsl(var(--fdms-green-50))',
          100: 'hsl(var(--fdms-green-100))',
          200: 'hsl(var(--fdms-green-200))',
          300: 'hsl(var(--fdms-green-300))',
          400: 'hsl(var(--fdms-green-400))',
          500: 'hsl(var(--fdms-green-500))',
          600: 'hsl(var(--fdms-green-600))',
          700: 'hsl(var(--fdms-green-700))',
          800: 'hsl(var(--fdms-green-800))',
          900: 'hsl(var(--fdms-green-900))',
        },
         'fdms-gray': {
          DEFAULT: 'hsl(var(--fdms-gray))',
          50: 'hsl(var(--fdms-gray-50))',
          100: 'hsl(var(--fdms-gray-100))',
          200: 'hsl(var(--fdms-gray-200))',
          300: 'hsl(var(--fdms-gray-300))',
          400: 'hsl(var(--fdms-gray-400))',
          500: 'hsl(var(--fdms-gray-500))',
          600: 'hsl(var(--fdms-gray-600))',
          700: 'hsl(var(--fdms-gray-700))',
          800: 'hsl(var(--fdms-gray-800))',
          900: 'hsl(var(--fdms-gray-900))',
        },
        'fdms-accent': {
          DEFAULT: 'hsl(var(--fdms-accent))',
          50: 'hsl(var(--fdms-accent-50))',
          100: 'hsl(var(--fdms-accent-100))',
          200: 'hsl(var(--fdms-accent-200))',
          300: 'hsl(var(--fdms-accent-300))',
          400: 'hsl(var(--fdms-accent-400))',
          500: 'hsl(var(--fdms-accent-500))',
          600: 'hsl(var(--fdms-accent-600))',
          700: 'hsl(var(--fdms-accent-700))',
          800: 'hsl(var(--fdms-accent-800))',
          900: 'hsl(var(--fdms-accent-900))',
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
