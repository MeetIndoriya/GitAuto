import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        "border-focus": "hsl(var(--border-focus))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-subtle": "hsl(var(--background-subtle))",
        foreground: "hsl(var(--foreground))",
        "foreground-muted": "hsl(var(--foreground-muted))",
        "foreground-subtle": "hsl(var(--foreground-subtle))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          bg: "hsl(var(--destructive-bg))",
          border: "hsl(var(--destructive-border))",
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
          hover: "hsl(var(--card-hover))",
        },
        success: {
          DEFAULT: "#10B981",
          bg: "hsl(var(--success-bg))",
          border: "hsl(var(--success-border))",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg: "hsl(var(--warning-bg))",
          border: "hsl(var(--warning-border))",
        },
        info: {
          DEFAULT: "#38BDF8",
          bg: "hsl(var(--info-bg))",
          border: "hsl(var(--info-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.78rem', { lineHeight: '1.15rem', letterSpacing: '-0.01em' }],
        xs: ['0.875rem', { lineHeight: '1.35rem', letterSpacing: '-0.01em' }],
        sm: ['0.975rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em' }],
        base: ['1.075rem', { lineHeight: '1.65rem', letterSpacing: '-0.015em' }],
        lg: ['1.25rem', { lineHeight: '1.8rem', letterSpacing: '-0.02em' }],
        xl: ['1.45rem', { lineHeight: '2.0rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.85rem', { lineHeight: '2.3rem', letterSpacing: '-0.03em' }],
        '3xl': ['2.35rem', { lineHeight: '2.8rem', letterSpacing: '-0.035em' }],
        '4xl': ['2.85rem', { lineHeight: '3.2rem', letterSpacing: '-0.04em' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
    },
  },
  plugins: [],
};

export default config;
