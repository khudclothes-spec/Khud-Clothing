# Khud — Project Instructions

## Skills

Before starting any task, check `.claude/skills/` for a relevant skill:

| Skill | When to use |
|-------|-------------|
| `ui-ux-pro-max` | Any UI work — new pages, components, styling, layout, animations, accessibility |
| `brand` | Brand consistency, logo usage, color palette, voice/tone |
| `design-system` | Design tokens, component specs, Tailwind integration |
| `ui-styling` | shadcn/ui components, Tailwind utilities, responsive patterns |

If a relevant skill exists, follow it. Otherwise use your own knowledge.

## Project

- **Stack**: Next.js 16 (App Router), React, plain CSS (no Tailwind)
- **Dev**: `npm run dev` — uses `--webpack` flag (Turbopack disabled due to Windows bug)
- **Fonts**: Bodoni Moda (headings, serif) + Hanken Grotesk (body, sans-serif) via Google Fonts
- **Theme**: Warm neutral palette — bone `#F4EFE6`, ink `#11100E`, clay `#A94732`, brass `#B99149`
- **Pages**: `/` Home, `/shop`, `/customize`, `/size-guide`, `/about`
- **Key files**: `app/globals.css` (all styles), `lib/data.js` (all content data), `components/SiteShell.jsx` (nav + cart + footer)
