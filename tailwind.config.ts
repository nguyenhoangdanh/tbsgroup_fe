import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Daily Performance Brand Colors - Green Theme
        'dp-primary': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          DEFAULT: '#22c55e',
        },
        'dp-secondary': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Main emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
          DEFAULT: '#10b981',
        },
        
        // Semantic colors
        'dp-success': {
          50: 'hsl(var(--dp-success-50))',
          100: 'hsl(var(--dp-success-100))',
          500: 'hsl(var(--dp-success-500))',
          600: 'hsl(var(--dp-success-600))',
          700: 'hsl(var(--dp-success-700))',
          DEFAULT: 'hsl(var(--dp-success-500))',
        },
        'dp-warning': {
          50: 'hsl(var(--dp-warning-50))',
          100: 'hsl(var(--dp-warning-100))',
          500: 'hsl(var(--dp-warning-500))',
          600: 'hsl(var(--dp-warning-600))',
          DEFAULT: 'hsl(var(--dp-warning-500))',
        },
        'dp-error': {
          50: 'hsl(var(--dp-error-50))',
          100: 'hsl(var(--dp-error-100))',
          500: 'hsl(var(--dp-error-500))',
          600: 'hsl(var(--dp-error-600))',
          DEFAULT: 'hsl(var(--dp-error-500))',
        },
        'dp-info': {
          50: 'hsl(var(--dp-info-50))',
          100: 'hsl(var(--dp-info-100))',
          500: 'hsl(var(--dp-info-500))',
          600: 'hsl(var(--dp-info-600))',
          DEFAULT: 'hsl(var(--dp-info-500))',
        },

        // System colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#22c55e", // Green instead of blue
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'dp-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'dp-gradient-light': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        'dp-gradient-dark': 'linear-gradient(135deg, #14532d 0%, #064e3b 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        'dp-pulse': {
          '0%, 100%': {
            background: 'var(--dp-gradient-primary)',
            transform: 'scale(1)',
          },
          '50%': {
            background: 'var(--dp-gradient-dark)',
            transform: 'scale(1.05)',
          },
        },
        'dp-fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'dp-pulse': 'dp-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dp-fade-in': 'dp-fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
