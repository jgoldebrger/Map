# Theme & Design Tokens

**Stack:** Tailwind CSS 3.4 + shadcn/ui CSS variables (HSL) + Inter font + mapbox-gl overrides

## Compact Token Summary

### Colors (`:root` — HSL components, used as `hsl(var(--token))`)

| Token | Value |
|-------|-------|
| `--background` | `0 0% 100%` (white) |
| `--foreground` | `222.2 84% 4.9%` (near-black) |
| `--card` | `0 0% 100%` |
| `--card-foreground` | `222.2 84% 4.9%` |
| `--popover` | `0 0% 100%` |
| `--popover-foreground` | `222.2 84% 4.9%` |
| `--primary` | `221.2 83.2% 53.3%` (blue) |
| `--primary-foreground` | `210 40% 98%` |
| `--secondary` | `210 40% 96.1%` (light slate) |
| `--secondary-foreground` | `222.2 47.4% 11.2%` |
| `--muted` | `210 40% 96.1%` |
| `--muted-foreground` | `215.4 16.3% 46.9%` |
| `--accent` | `210 40% 96.1%` |
| `--accent-foreground` | `222.2 47.4% 11.2%` |
| `--destructive` | `0 84.2% 60.2%` (red) |
| `--destructive-foreground` | `210 40% 98%` |
| `--border` | `214.3 31.8% 91.4%` |
| `--input` | `214.3 31.8% 91.4%` |
| `--ring` | `221.2 83.2% 53.3%` |

No `.dark` theme defined — `darkMode: ["class"]` in Tailwind but only light tokens exist.

### Typography

- **Font family:** Inter (`next/font/google`, applied on `<body>`)
- **Base body:** `bg-background text-foreground antialiased`
- **Common sizes:** `text-xs` (12px), `text-sm` (14px), `text-base`/`md:text-sm`, `text-lg`, `text-2xl`, `text-4xl`
- **Weights:** `font-medium`, `font-semibold`, `font-bold`
- **Tracking:** `tracking-tight`, `tracking-wide` (legend labels)

### Border Radius

| Token | Value |
|-------|-------|
| `--radius` | `0.5rem` (8px) |
| `rounded-lg` | `var(--radius)` |
| `rounded-md` | `calc(var(--radius) - 2px)` |
| `rounded-sm` | `calc(var(--radius) - 4px)` |
| `rounded-xl` | used on cards/panels (Tailwind default 12px) |

### Spacing (Tailwind defaults, common usage)

- Container padding: `px-4`, `p-4`, `p-6`, `p-8`
- Gaps: `gap-1`, `gap-2`, `gap-4`
- Header height: `h-14`
- Input/button height: `h-9` (default), `h-8` (sm), `h-10` (lg)

### Shadows

- Cards/panels: `shadow`, `shadow-sm`, `shadow-lg`, `shadow-xl`, `shadow-2xl`
- Map overlays: `shadow-lg backdrop-blur` on white/95 backgrounds

### Breakpoints (Tailwind defaults)

| Prefix | Min width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Map-specific overrides

- `.mapboxgl-popup-content`: `rounded-lg shadow-lg text-sm p-3`
- `.mapboxgl-ctrl-group button`: `bg-white`
- Territory colors: dynamic inline `backgroundColor` from assignment data (not CSS tokens)

### Page backgrounds

- Home: `bg-gradient-to-b from-white to-slate-50`
- Lookup/admin shell: `bg-slate-50`
- Map overlays: `bg-white`, `bg-white/95`

---

## tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## globals.css

```css
@import "mapbox-gl/dist/mapbox-gl.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}

.mapboxgl-popup-content {
  @apply rounded-lg shadow-lg text-sm p-3;
}

.mapboxgl-ctrl-group button {
  @apply bg-white;
}
```
