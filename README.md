# Stage & Stem — Project Brief

## Overview

Stage & Stem is a performance space and bistro operating as one business under a single brand, split into two distinct sides. The website reflects this dual identity — two sets of pages that share the same brand language, with cross-linking between them.

It is a **flat static site**: plain HTML, CSS and a little JavaScript, with no build step and no backend. The live domain is **stageandstem.com**, hosted on **Fasthosts** via their File Manager (`public_html` directory).

> **Note on structure:** all files live in the **root** of the repository — there are no `stage/` or `bistro/` subfolders. Pages are distinguished by filename and by which stylesheet they load.

---

## Brand Identity

**Business name:** Stage & Stem  
**Tagline:** Performance Space & Bistro  
**Email:** info@stageandstem.com  
**Instagram:** @stageandstem

### Logo files
- `logo.png` — full logo, used in the nav bar on every content page
- `logo_left.png` — left half of logo (theatre mask side), used only on the landing page
- `logo_right.png` — right half of logo (wine glass side), used only on the landing page

### Typography
- **Serif:** Cormorant Garamond (Google Fonts) — headings, italic display text
- **Sans:** Montserrat (Google Fonts) — body, navigation, labels

Fonts are loaded from Google Fonts via a `<link>` in each page's `<head>`.

### Colour palette
| Token | Value | Usage |
|---|---|---|
| Gold | `#c9a96e` | Accents, links, highlights |
| Gold dim | `rgba(201,169,110,0.25)` | Borders, dividers |
| White | `#f5f2ed` | Body text |
| Muted | `rgba(245,242,237,0.5)` | Secondary text |
| Stage BG | `#08080f` | Cool indigo-black |
| Bistro BG | `#0d0905` | Warm amber-black |

---

## File Structure

All files are in the repository root:

```
/
├── index.html              ← Split landing / entry page (self-contained)
│
├── stage.html              ← Stage home
├── whats-on.html           ← Stage: events/programme
├── perform-with-us.html    ← Stage: performer & hire enquiries
├── contact_stage.html      ← Stage contact
│
├── bistro.html             ← Bistro home
├── menu.html               ← Bistro: food & drink menu
├── book-a-table.html       ← Bistro: table reservations
├── contact_bistro.html     ← Bistro contact
├── menus.html              ← Duplicate of menu.html (unused — see Known Issues)
│
├── style-stage.css         ← Stage styles (cool, indigo-tinted)
├── style-bistro.css        ← Bistro styles (warm, amber-tinted)
├── style 3.css             ← Orphan stylesheet (unused — see Known Issues)
│
├── newsletter.js           ← MailChimp newsletter signup handler
│
├── logo.png                ← Full logo (nav)
├── logo_left.png           ← Left half (landing page)
└── logo_right.png          ← Right half (landing page)
```

Stage pages load `style-stage.css`; bistro pages load `style-bistro.css`. The landing page has its own inline styles and loads neither.

---

## The Landing Page (`index.html`)

The entry point to the site, and entirely self-contained — all of its CSS and JavaScript are inline; it does not use `style-stage.css`, `style-bistro.css`, or `newsletter.js`.

A full-screen split layout — the left panel links to the Stage, the right panel links to the Bistro.

**Key features:**
- Two equal panels side by side, each a clickable `<a>` element
- `logo_left.png` and `logo_right.png` sit side by side as a single composed logo centred at the divide
- On hover over either panel, the opposite half of the logo fades to ~12% opacity, highlighting the relevant side
- A subtle gold vertical divider line runs behind the logo
- On hover, a gold italic label fades in — "Performance Space" on the left, "Bistro" on the right
- Hover also tints the panel background (cooler tint for stage, warmer for bistro)
- Logo reveal animation on page load (fade in + scale up)

**Links:**
- Left panel → `stage.html`
- Right panel → `bistro.html`

**The half-fade** is achieved via inline JavaScript: `mouseenter`/`mouseleave` events on each panel add/remove `hover-stage` or `hover-bistro` classes on `<body>`, which the inline CSS uses to target `.logo-left` / `.logo-right` opacity.

---

## The Stage Pages

### Feel & aesthetic
Cool, theatrical, dark. Background has a subtle deep indigo/purple tint. Hover states use a soft purple glow.

### Styles (`style-stage.css`)
```css
--bg: #08080f
--bg-2: #0d0d1a
--accent: #c9a96e
--accent-dim: rgba(201,169,110,0.25)
--white: #f5f2ed
--muted: rgba(245,242,237,0.5)
--tint: rgba(80,50,140,0.12)   /* purple glow */
--font-serif: 'Cormorant Garamond', serif
--font-sans: 'Montserrat', sans-serif
```
Includes a `.card-date` class for event dates.

### Pages
| File | Purpose |
|---|---|
| `stage.html` | Stage home — hero + upcoming events cards |
| `whats-on.html` | Programme/events listing |
| `perform-with-us.html` | Info for performers + hire enquiries |
| `contact_stage.html` | Contact for performance/hire |

### Navigation (all stage pages)
Home · What's On · Perform With Us · Contact — with the full `logo.png` as the nav logo.

### Cross-link to Bistro
Every stage page has a **corner tab** fixed to the top-right reading "Bistro", linking to `bistro.html`. Style: small gold uppercase text, gold border, dark blurred background.

### Cross-links within content
- `stage.html` cabaret card → `book-a-table.html`; CTAs → `whats-on.html`
- `whats-on.html` cabaret card → `book-a-table.html`
- `perform-with-us.html` CTA → `contact_stage.html`
- `contact_stage.html` inline note → `book-a-table.html`
- Footer on every stage page links to `bistro.html`

---

## The Bistro Pages

### Feel & aesthetic
Warm, candlelit, intimate. Background has a subtle amber/burgundy tint. Hover states use a soft warm amber glow.

### Styles (`style-bistro.css`)
```css
--bg: #0d0905
--bg-2: #130c06
--accent: #c9a96e
--accent-dim: rgba(201,169,110,0.25)
--white: #f5f2ed
--muted: rgba(245,242,237,0.5)
--tint: rgba(140,60,20,0.1)    /* amber glow */
--font-serif: 'Cormorant Garamond', serif
--font-sans: 'Montserrat', sans-serif
```
Adds menu and newsletter components: `.menu-section`, `.menu-item`, `.menu-item-name`, `.menu-item-price`, `.newsletter-strip`, `.newsletter-form`, `.newsletter-error` (`#c97070`).

### Pages
| File | Purpose |
|---|---|
| `bistro.html` | Bistro home — hero + dining info cards |
| `menu.html` | Food & drink menu (starters, mains, desserts with prices) |
| `book-a-table.html` | Reservation page (email-based for now) |
| `contact_bistro.html` | Contact for dining/private hire |

### Navigation (all bistro pages)
Home · Menu · Book a Table · Contact — with the full `logo.png` as the nav logo.

### Cross-link to Stage
Every bistro page has a **corner tab** fixed to the top-right reading "Stage", linking to `stage.html`.

### Cross-links within content
- `bistro.html` dine & show card → `whats-on.html`; CTA → `menu.html`
- `book-a-table.html` inline note → `whats-on.html`
- `contact_bistro.html` inline note → `contact_stage.html`
- Footer on every bistro page links to `stage.html`

---

## Newsletter Signup (`newsletter.js`)

A lightweight MailChimp signup handler included on **every content page** (not on the landing page).

How it works:
- On `DOMContentLoaded`, it binds a `submit` handler to every `.newsletter-form`
- It serialises the form, rewrites the form's MailChimp `action` from `/post?` to `/post-json?`, and fires a **JSONP** request (avoiding CORS / page reload)
- On success it replaces the `.newsletter-strip` container's contents with a "Thanks for subscribing" message
- On error it strips HTML/error-code prefixes from MailChimp's message and shows it as a `.newsletter-error` above the form

Requirements for the markup it expects:
- A `.newsletter-strip` container wrapping a `.newsletter-form`
- The form's `action` set to the MailChimp `…/post?u=…&id=…` endpoint

---

## Shared Components & Patterns

These patterns appear consistently across the stage and bistro pages. When adding new pages, follow these templates.

### Corner Tab
```html
<a class="corner-tab" href="[other-side].html">
  <svg ...>...</svg>
  [Stage or Bistro]
</a>
```
Fixed top-right, z-index 100, gold text, gold border, blurred dark background.

### Navigation
```html
<nav>
  <a class="nav-logo" href="index.html">
    <img src="logo.png" alt="Stage & Stem" />
  </a>
  <ul class="nav-links">
    <li><a href="..." class="active">Active Page</a></li>
    ...
  </ul>
</nav>
```
Add `class="active"` to the current page link.

### Section layout
```html
<div class="section">
  <p class="section-eyebrow">Short Label</p>
  <h2 class="section-title">Italic Serif Heading</h2>
  <div class="rule"><div class="rule-gem"></div></div>
  <!-- content -->
</div>
```

### Cards grid
```html
<div class="cards">
  <div class="card">
    <p class="card-date">Date or category</p>
    <h3 class="card-title">Card Title</h3>
    <p class="card-body">Description text</p>
  </div>
</div>
```

### Buttons
```html
<a class="btn btn-primary" href="...">Primary Action</a>
<a class="btn btn-outline" href="...">Secondary Action</a>
```

### Footer
```html
<footer>
  <p class="footer-copy">Stage &amp; Stem &nbsp;·&nbsp; Performance Space &amp; Bistro</p>
  <ul class="footer-links">
    <li><a href="...">Link</a></li>
    <!-- Always include a cross-link to the other side as the last item -->
    <li><a href="bistro.html">Bistro →</a></li>
  </ul>
</footer>
```

### Gold rule divider
```html
<div class="rule"><div class="rule-gem"></div></div>
```

---

## Paths

Because the site is flat (all files in the root), every link and asset
reference is a plain filename — no `../` and no subfolder prefixes. For
example, pages link to `logo.png`, `style-stage.css`, `bistro.html`, etc.
directly. Keep all files in the same directory and everything resolves.

---

## What's Been Built

- [x] Landing / split entry page with logo half-fade on hover (`index.html`)
- [x] Stage pages — 4 pages + `style-stage.css`
- [x] Bistro pages — 4 pages + `style-bistro.css`
- [x] Corner tab cross-linking on all pages
- [x] Contextual cross-links (e.g. Dine & Show → What's On)
- [x] Placeholder menu with example dishes and prices
- [x] Newsletter signup wired to MailChimp (`newsletter.js`)

## What Still Needs Building / Improving

- [ ] Google Sheets (or similar) integration for events, so the client can update What's On without touching code
- [ ] Proper events/ticketing on `whats-on.html`
- [ ] Contact & booking forms (currently email links only)
- [ ] Mobile navigation (hamburger menu for small screens)
- [ ] SEO meta tags, Open Graph tags, JSON-LD structured data
- [ ] Instagram feed or social links
- [ ] Real content from the client (copy, images, actual menu)
- [ ] About page for each side, or a shared About page

---

## Known Issues / Cleanup Candidates

These don't break the live site but are worth tidying in a future pass:

- **`menus.html` is a redundant duplicate.** It is byte-identical to
  `menu.html`, and no page links to it (all nav/menu links point to
  `menu.html`). Safe to delete.
- **`style 3.css` is an orphan.** It carries the warm bistro tokens but is
  not referenced by any HTML page. Either remove it or fold any needed rules
  into `style-bistro.css`.
- **`.DS_Store` is tracked in git.** This is a macOS Finder metadata file
  with no purpose in the repo. It should be removed and added to a
  `.gitignore`.

---

## Hosting & Deployment

**Host:** Fasthosts  
**Method:** File Manager → upload to `public_html`  
**Domain:** stageandstem.com

The site is flat, so upload all files into `public_html` together (no
subfolders to recreate). `index.html` serves as the landing page at the
domain root.

---

## Client Notes

- Client is non-technical — any content update system should be simple (e.g. Google Sheets for events)
- The client has existing Fasthosts hosting and domain
- The logo currently exists as `logo.png` (full) and as two split halves (`logo_left.png`, `logo_right.png`)
- For best results, a transparent-background PNG of the full logo would be ideal
