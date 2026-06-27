# Khud — Project Instructions

A persistent handoff document for contributors and AI assistants. Keep this file updated as the project evolves.

---

## Project Overview

**Khud** (from the Urdu word for *yourself*) is a premium clothing brand based in Pakistan. The frontend is a Next.js 16 App Router application that serves as a brand showcase and storefront UI demo. The current implementation is a fully functional frontend — backend, database, and payment integrations are not yet connected.

---

## Brand Identity

### Colors (CSS variables in `app/globals.css`)

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#11100E` | Primary text, dark backgrounds |
| `--charcoal` | `#5F5A52` | Secondary / muted text |
| `--clay` | `#A94732` | Accent, CTAs, highlights |
| `--terra` | `#C15A40` | Hover state of clay |
| `--taupe` | `#D8CDBB` | Borders, dividers |
| `--brass` | `#B99149` | Metallic accent (on dark) |
| `--bone` | `#F4EFE6` | Primary background |
| `--cream` | `#FBF8F1` | Card backgrounds |
| `--olive` | `#6D745F` | Earth-tone accent |
| `--muted-on-dark` | `#9A9488` | Subdued text on dark backgrounds |

### Typography

- **Headings / Display**: Bodoni Moda (Google Fonts, serif) — editorial, luxury fashion feel
- **Body / UI**: Hanken Grotesk (Google Fonts, sans-serif) — clean, contemporary
- **Display sizes**: `display--hero` (clamp 54–112px), `display--large` (40–76px), `display--section` (34–58px)
- **Eyebrow labels**: 11px, 700 weight, 0.22em tracking, uppercase

### Design Philosophy

- Warm neutral palette — no stark white backgrounds
- Bone (`#F4EFE6`) as the primary canvas
- Clay (`#A94732`) used sparingly as an accent — never as a dominant section background
- Luxury editorial aesthetic: wide spacing, strong typographic hierarchy
- Italic serif + clay color used for emotional headline moments (`italic-clay` class)

---

## Current Frontend Status

### Pages

| Route | File | Status |
|---|---|---|
| `/` | `app/page.jsx` | Complete |
| `/shop` | `app/shop/page.jsx` | Complete (UI only, no filtering logic) |
| `/customize` | `app/customize/page.jsx` | Complete (UI only, no order submission) |
| `/size-guide` | `app/size-guide/page.jsx` | Complete |
| `/size` | `app/size/page.jsx` | Alias — re-exports from size-guide |
| `/about` | `app/about/page.jsx` | Complete |

### Components

| File | Purpose |
|---|---|
| `components/SiteShell.jsx` | Nav, cart drawer, mobile menu, page-transition, footer |
| `components/CartContext.jsx` | Cart state (React Context, no persistence) |
| `components/ProductCard.jsx` | Product card with quick-add |
| `components/Newsletter.jsx` | Email signup form (UI only) |
| `components/TeeGraphic.jsx` | SVG tee/hoodie silhouette |
| `components/Icons.jsx` | Custom SVG icon set |
| `components/CustomizeBuilder.jsx` | Custom order builder UI |
| `components/Reveal.jsx` | Framer Motion scroll-reveal wrapper |

### Data

All content is static and lives in `lib/data.js`:
- `products` — 6 product entries
- `categories` — 4 category cards
- `steps` — 4 custom studio steps
- `quality` — 5 quality promise cards
- `navLinks` — navigation items
- `filters`, `sizeRows`, `fitCards`, `measureTips`, `aboutBlocks`, `promises`, `customProducts`, `customColors`, `customPlacements`, `customSizes`

---

## Existing Animations

### Page Transition (DO NOT MODIFY)
Three-panel vertical rollout — implemented in `SiteShell.jsx` via CSS classes:
- `.page-transition.is-covering` — panels slide up from bottom
- `.page-transition.is-revealing` — panels retract from top
- Timing: 430ms navigate, 520ms reveal start, 1020ms reset

### Hero Animations (CSS, `globals.css`)
| Element | Animation | Delay |
|---|---|---|
| Kicker label | `riseIn` 0.7s | 0s |
| Hero word 1 (WEAR) | `heroWord` 0.8s | 0s |
| Hero word 2 (YOUR) | `heroWord` 0.8s | 0.1s |
| Hero word 3 (IMPRINT.) | `heroWord` 0.8s | 0.2s |
| Copy paragraph | `riseIn` 0.8s | 0.3s |
| CTA buttons | `riseIn` 0.8s | 0.4s |
| Stats row | `riseIn` 0.8s | 0.5s |
| Hero visual card | `riseIn` 1s | 0.2s |
| Floating product card | `scaleIn` 1s | 0.5s |
| Badge | `drift` infinite (float) | — |

### Scroll Reveal
- Sections with `data-reveal` attribute use `IntersectionObserver` (in `SiteShell.jsx`)
- When visible, class `is-visible` is added, triggering CSS transitions
- Respects `prefers-reduced-motion`

### Framer Motion (Installed — v11+)
- `components/Reveal.jsx` — `<Reveal>`, `<StaggerReveal>`, `<StaggerItem>` components
- `lib/animations.js` — named variants: `fadeUp`, `fadeIn`, `scaleUp`, `stagger`, `staggerItem`, `slideLeft`
- `ProductCard.jsx` — `motion.article` with `whileInView` entrance

### CSS Hover Transitions
- Product cards: `translateY(-10px)` + shadow
- Category/quality/step cards: `translateY(-4px to -5px)` + border color
- Buttons: `translateY(-3px)` + shadow, `0.3s cubic-bezier(0.22, 1, 0.36, 1)`
- Nav links: underline indicator on active
- Icon buttons: subtle lift + clay tint background

---

## Folder Structure Notes

```
khud-frontend/
├── app/               # Next.js App Router pages + root layout
│   ├── layout.jsx     # Root layout with fonts, SiteShell wrapper, metadata
│   ├── page.jsx       # Homepage
│   ├── globals.css    # ALL styles (no Tailwind; single CSS file)
│   ├── shop/
│   ├── customize/
│   ├── size-guide/
│   ├── size/          # URL alias → re-exports size-guide
│   └── about/
├── components/        # Shared React components
├── lib/
│   ├── data.js        # All static content data
│   └── animations.js  # Framer Motion reusable variants
├── public/
│   └── images/
│       ├── logo-black-writing.png
│       └── logo-white-writing.png
└── instructions.md    # This file
```

**Styling convention**: All styles are in `app/globals.css` — no CSS modules, no Tailwind. BEM-like class naming.

**Dev command**: `npm run dev` uses `--webpack` flag. Turbopack is intentionally disabled due to a Windows rendering bug.

---

## Completed Tasks

- [x] Next.js 16 App Router setup
- [x] Brand token system (CSS custom properties)
- [x] Bodoni Moda + Hanken Grotesk font pairing
- [x] Three-panel page transition animation
- [x] Homepage: hero, featured products, custom studio, categories, quality, newsletter
- [x] Shop page: product grid with UI-only filters
- [x] Customize page: full custom builder UI
- [x] Size guide page: table, fit cards, measurement tips
- [x] About page: brand story, quality promise
- [x] Cart context + cart drawer (session-only, no persistence)
- [x] Sticky header with blur backdrop
- [x] Mobile-responsive navigation + hamburger menu
- [x] Announcement bar with marquee animation
- [x] Footer with four-column grid
- [x] Hero typography fix — removed `rotateX` distortion from `heroWord` animation
- [x] Newsletter section redesign — dark card on bone background (no more full-red section)
- [x] Favicon and full metadata in `app/layout.jsx` (Open Graph, Twitter card)
- [x] Scroll-reveal upgrade — IntersectionObserver replaces immediate CSS animation
- [x] Animation polish — button hover, product card hover, icon button micro-interactions
- [x] Framer Motion installed — `lib/animations.js`, `components/Reveal.jsx` created
- [x] `ProductCard` upgraded to Framer Motion `whileInView` entrance
- [x] `.gitignore` — comprehensive patterns, `.claude/` properly excluded

---

## Pending Tasks

### Backend & Infrastructure

- [ ] **Database** — Set up PostgreSQL or Supabase for products, orders, users
- [ ] **Authentication** — Implement user registration/login (NextAuth.js or Supabase Auth)
- [ ] **Cart persistence** — Save cart to DB/local storage, restore on reload
- [ ] **Product catalog backend** — Replace static `lib/data.js` with DB queries
- [ ] **Custom order backend** — API route to receive `CustomizeBuilder` form submissions
- [ ] **Email notifications** — Order confirmation, custom proof notification (Resend / Nodemailer)
- [ ] **Payments** — Stripe or local gateway (Easypaisa / JazzCash) integration
- [ ] **Admin dashboard** — Order management, inventory, custom order approvals
- [ ] **Image uploads** — Product images, custom artwork upload to S3 / Cloudinary
- [ ] **Newsletter** — Connect to Mailchimp / ConvertKit / custom email list

### Frontend Remaining

- [ ] Product detail page (`/shop/[slug]`) — currently no individual product pages
- [ ] Checkout flow — shipping address, payment, order confirmation
- [ ] Order tracking page
- [ ] Search functionality
- [ ] Wishlist / saved items
- [ ] Social proof — reviews, user-generated content
- [ ] SEO — `sitemap.xml`, `robots.txt`, structured data
- [ ] Image optimization — replace SVG mockups with real product photography

---

## Backend Accelerator

### Recommended Stack

| Layer | Choice | Reason |
|---|---|---|
| Database | Supabase (PostgreSQL) | Hosted, free tier, real-time, Auth built-in |
| ORM | Prisma | Type-safe, great Next.js integration |
| Auth | Supabase Auth or NextAuth.js | Flexible, supports social login |
| File uploads | Cloudinary | Image transforms, fast CDN |
| Email | Resend | Developer-friendly, React Email templates |
| Payments | Stripe | Global; add local gateways later |

### Phase 1 — Core (2–3 weeks)
1. Supabase project setup, schema design (users, products, orders, custom_orders)
2. Prisma ORM integration in Next.js
3. Product catalog API — replace `lib/data.js` with DB-fetched products
4. User auth (email + password minimum)
5. Cart persistence (DB for logged-in users, localStorage fallback)

### Phase 2 — Orders (2 weeks)
1. Custom order API route — saves builder submission to DB
2. Email flow: order received → proof sent → approved → shipped
3. Stripe checkout integration
4. Order confirmation page

### Phase 3 — Admin (1–2 weeks)
1. Protected `/admin` dashboard
2. Order management (view, update status)
3. Custom order approval (upload proof, mark approved)
4. Basic inventory management

---

## Notes for Future Development

### CSS Architecture
- Keep all styles in `app/globals.css`. Do not introduce CSS Modules or styled-components without migrating the full codebase.
- CSS variable names follow the `--token-name` pattern (no prefix).
- Media breakpoints: 1024px (tablet), 760px (mobile), 480px (small mobile).

### Animation Rules
- **Never** remove or modify the page transition (`.page-transition`, `.pt-panel` in SiteShell).
- Hero CSS animations (`heroWord`, `riseIn`) load immediately — intentional, do not add `whileInView` here.
- Use `data-reveal` + IntersectionObserver for scroll sections.
- Use `components/Reveal.jsx` or `lib/animations.js` for Framer Motion sections.
- Always respect `prefers-reduced-motion`.

### Component Conventions
- All interactive components must be `"use client"`.
- Server components (page files) remain server-side — avoid adding `"use client"` to page files.
- Add new content data to `lib/data.js` as named exports.

### Dev Setup
```bash
npm install
npm run dev   # uses --webpack (not Turbopack)
```
