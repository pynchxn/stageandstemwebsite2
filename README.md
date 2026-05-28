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
├── whats-on.html           ← Stage: events/programme with filter tabs
├── perform-with-us.html    ← Stage: performer & hire enquiries
├── contact_stage.html      ← Stage contact
├── book_stage.html         ← Stage: Eventbrite ticket booking page
│
├── bistro.html             ← Bistro home
├── menus.html              ← Bistro: food & drink menu
├── book-a-table.html       ← Bistro: table reservations
├── contact_bistro.html     ← Bistro contact
│
├── 404.html                ← Custom 404 page (noindex)
│
├── style-stage.css         ← Stage styles (cool, indigo-tinted)
├── style-bistro.css        ← Bistro styles (warm, amber-tinted)
│
├── newsletter.js           ← Mailchimp newsletter signup handler
│
├── logo.png                ← Full logo (nav)
├── logo_left.png           ← Left half (landing page)
├── logo_right.png          ← Right half (landing page)
│
├── og-image.png            ← Social-share image (1200×600), referenced by every page's og:image
├── favicon.ico             ← Browser tab icon (16/32/48 multi-size)
├── favicon-32.png          ← Modern-browser PNG favicon
├── apple-touch-icon.png    ← iOS home-screen icon (180×180)
├── favicon-source.png      ← 1024×1024 source — regenerate the favicon set from this
│
├── .htaccess               ← Apache rewrites (404, www → non-www, HTTPS-ready)
├── robots.txt              ← Crawler directives + sitemap pointer
└── sitemap.xml             ← Page list for search engines
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
- On touch devices (no hover), both labels are always visible at the bottom of their respective panels, so users know which side to tap
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

Includes event calendar classes: `.filter-tabs`, `.filter-tab`, `.events-list`, `.event-row`, `.event-row-date`, `.event-row-day`, `.event-row-month`, `.event-row-tag`, `.event-row-name`, `.event-row-detail`, `.event-row-action`, `.event-row-price`, `.sold-out`, `.sold-out-badge`, `.hire-banner`, `.btn--gold`.

### Pages
| File | Purpose |
|---|---|
| `stage.html` | Stage home — hero + upcoming events cards |
| `whats-on.html` | Programme/events listing with category filter tabs |
| `perform-with-us.html` | Info for performers + hire enquiries |
| `contact_stage.html` | Contact for performance/hire |
| `book_stage.html` | Ticket booking via Eventbrite embed |

### Navigation (all stage pages)
Home · What's On · Perform With Us · Contact · **Bistro** (gold crosslink) — with the full `logo.png` as the nav logo. The Bistro crosslink is styled as `.nav-crosslink-item` / `.nav-crosslink` and separated from the main links by a thin gold vertical border.

### Cross-links within content
- `stage.html` cabaret card → `book-a-table.html`; CTAs → `whats-on.html`
- `whats-on.html` event rows & Book Now buttons → `book_stage.html`
- `whats-on.html` private hire banner → `contact_stage.html`
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

Adds menu and newsletter components: `.menu-section`, `.menu-item`, `.menu-item-name`, `.menu-item-price`, `.newsletter-strip`, `.newsletter-form`, `.newsletter-error`.

### Pages
| File | Purpose |
|---|---|
| `bistro.html` | Bistro home — hero + dining info cards |
| `menus.html` | Food & drink menu |
| `book-a-table.html` | Reservation page (email-based) |
| `contact_bistro.html` | Contact for dining/private hire |

### Navigation (all bistro pages)
Home · Menu · Book a Table · Contact · **Stage** (gold crosslink) — with the full `logo.png` as the nav logo.

### Cross-links within content
- `bistro.html` dine & show card → `whats-on.html`; CTA → `menus.html`
- `book-a-table.html` inline note → `whats-on.html`
- `contact_bistro.html` inline note → `contact_stage.html`
- Footer on every bistro page links to `stage.html`

---

## Newsletter Signup (`newsletter.js`)

A lightweight Mailchimp signup handler included on **every content page** (not on the landing page).

**Mailchimp list:** `stageandstem.us18.list-manage.com` — list ID `05e230634f`, tag `3021990`.

How it works:
- On `DOMContentLoaded`, it binds a `submit` handler to every `.newsletter-form`
- Serialises the form, rewrites the Mailchimp `action` from `/post?` to `/post-json?`, and fires a **JSONP** request (no CORS / no page reload)
- On success: replaces the `.newsletter-strip` contents with a "Thanks for subscribing" message
- On error: strips HTML/error-code prefixes from Mailchimp's message and shows it as `.newsletter-error` above the form

**Fields collected:** First name (`FNAME`), Last name (`LNAME`), Email (`EMAIL`).

Requirements for the markup it expects:
- A `.newsletter-strip` container wrapping a `.newsletter-form`
- The form's `action` set to the Mailchimp `.../post?u=...&id=...` endpoint
- The honeypot field (`b_...`) must be present

---

## Events Calendar (`whats-on.html`)

The What's On page uses a filterable event list. Each event row links to `book_stage.html`.

### Filter tabs
```html
<div class="filter-tabs">
  <div class="filter-tab active" data-filter="All Events">All Events</div>
  <div class="filter-tab" data-filter="Music">Music</div>
  <!-- Comedy, Theatre, Special -->
</div>
```
An inline `<script>` at the bottom of `whats-on.html` handles tab clicks and shows/hides rows by matching `data-filter` against `data-category` on each `.event-row`.

### Event row
```html
<div class="event-row" data-category="Music" onclick="location.href='book_stage.html'">
  <div class="event-row-date">
    <div class="event-row-day">12</div>
    <div class="event-row-month">Apr 2026</div>
  </div>
  <div>
    <div class="event-row-tag">Jazz · Live Music</div>
    <div class="event-row-name">An Evening of Jazz</div>
    <div class="event-row-detail">Details · Doors 6:30pm · Show 8pm</div>
  </div>
  <div class="event-row-action">
    <div class="event-row-price">£45 <span>per person</span></div>
    <a href="book_stage.html" class="btn btn--gold">Book Now</a>
  </div>
</div>
```

### Sold out event
Add `class="event-row sold-out"`, remove the `onclick`, and replace the action div with:
```html
<div class="event-row-action">
  <div class="sold-out-badge">Sold Out</div>
</div>
```

---

## Ticket Booking (`book_stage.html`)

A Stage-branded page that embeds the Eventbrite booking widget.

**To wire up Eventbrite:**
1. Log in to Eventbrite → Manage Events → your event → Promote → Embed
2. Copy the widget code
3. In `book_stage.html`, find the `<!-- EVENTBRITE EMBED -->` comment block and replace the placeholder `<div>` and `<script>` tags with your copied embed code

The page currently uses `widgetType: 'checkout'` for a single event. If you want to show all events in one widget, Eventbrite also supports `widgetType: 'collection'` with a `collectionId`.

---

## Shared Components & Patterns

These patterns appear consistently across the stage and bistro pages. When adding new pages, follow these templates.

### Navigation
```html
<nav>
  <a class="nav-logo" href="index.html">
    <img src="logo.png" alt="Stage & Stem" />
  </a>
  <input type="checkbox" id="nav-toggle" class="nav-toggle" />
  <label class="nav-burger" for="nav-toggle" aria-label="Toggle menu">
    <span></span><span></span><span></span>
  </label>
  <ul class="nav-links">
    <li><a href="..." class="active">Active Page</a></li>
    ...
    <!-- Always last — crosslink to the other side -->
    <li class="nav-crosslink-item">
      <a href="bistro.html" class="nav-crosslink">Bistro</a>
    </li>
  </ul>
</nav>
```
Add `class="active"` to the current page link. The crosslink is always the final `<li>`, separated by a thin gold left border via `.nav-crosslink-item`.

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
<a class="btn btn--gold" href="...">Gold Action (events)</a>
```

### Newsletter strip
```html
<div class="newsletter-strip">
  <p class="newsletter-eyebrow">Stay in the loop</p>
  <h2 class="newsletter-title">Updates, direct to your inbox</h2>
  <p class="newsletter-sub">Your copy here.</p>
  <form action="https://stageandstem.us18.list-manage.com/subscribe/post?u=f675c39799c38096ac60029aa&id=05e230634f&f_id=00d9a9e6f0"
        method="post" name="mc-embedded-subscribe-form" class="newsletter-form" target="_self" novalidate>
    <input type="text" name="FNAME" placeholder="First name">
    <input type="text" name="LNAME" placeholder="Last name">
    <input type="email" name="EMAIL" placeholder="Your email address" required>
    <input type="hidden" name="tags" value="3021990">
    <div aria-hidden="true" style="position:absolute;left:-5000px">
      <input type="text" name="b_f675c39799c38096ac60029aa_05e230634f" tabindex="-1" value="">
    </div>
    <button type="submit">Subscribe</button>
  </form>
</div>
```
Include `<script src="newsletter.js"></script>` before `</body>` on every page that uses this.

### Footer
```html
<footer>
  <p class="footer-copy">Stage &amp; Stem &nbsp;·&nbsp; Performance Space &amp; Bistro</p>
  <ul class="footer-links">
    <li><a href="...">Link</a></li>
    <!-- Always include a cross-link to the other side as the last item -->
    <li><a href="bistro.html">Bistro →</a></li>
  </ul>
  <ul class="social-links">
    <li><a href="https://www.instagram.com/stageandstem/" aria-label="Instagram"><!-- svg --></a></li>
    <li><a href="#" aria-label="Facebook"><!-- svg --></a></li>
    <li><a href="#" aria-label="TikTok"><!-- svg --></a></li>
    <li><a href="#" aria-label="X (Twitter)"><!-- svg --></a></li>
  </ul>
</footer>
```
Social links use inline SVG icons. Facebook, TikTok and X currently link to `#` — update when accounts are live.

### Gold rule divider
```html
<div class="rule"><div class="rule-gem"></div></div>
```

### Contact page layout

Both contact pages use a shared two-column layout. On desktop the left column holds contact info and the right column holds a Google Maps embed; on mobile both stack to a single column.

```html
<div class="section" style="padding-top:5rem;">
  <p class="section-eyebrow">Get in Touch</p>
  <h1 class="section-title">Contact the Stage</h1>
  <div class="rule"><div class="rule-gem"></div></div>

  <div class="contact-grid">
    <div class="contact-info">
      <!-- email button, address, social links, crosslink note -->
    </div>
    <div class="contact-map">
      <iframe src="https://maps.google.com/maps?q=199+Richmond+Road+Cardiff+CF24+3BT&output=embed"
              allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              title="..."></iframe>
    </div>
  </div>

  <div class="contact-faqs">
    <h2 class="contact-faqs-title">Common Questions</h2>
    <div class="faq-grid">
      <div class="faq-entry">
        <p class="faq-entry-q">Question label</p>
        <p class="faq-entry-a">Answer text.</p>
      </div>
      <!-- repeat for each Q&A pair -->
    </div>
  </div>
</div>
```

Key CSS classes:
| Class | Purpose |
|---|---|
| `.contact-grid` | Two-column grid (1fr 1fr) with `gap: 4rem`; collapses to 1fr on mobile |
| `.contact-info` | Left column — text, email button, address details, social links |
| `.contact-map` | Right column — contains the map iframe |
| `.contact-map iframe` | Full-width, 420px tall, gold border |
| `.contact-detail` | Labelled detail block (address, hours, etc.) |
| `.contact-detail-label` | Small uppercase accent-coloured label |
| `.contact-detail-value` | Muted body text below the label |
| `.contact-faqs` | FAQ section below the grid; top gold border, `margin-top: 5rem` |
| `.contact-faqs-title` | Italic serif heading for the FAQ section |
| `.faq-grid` | Two-column grid of Q&A entries; collapses to 1 column on mobile |
| `.faq-entry-q` | Tiny uppercase gold question label |
| `.faq-entry-a` | Muted answer text |

The FAQ entries are static (no accordion, no JavaScript). All questions and answers are always visible.

---

## SEO & Discoverability

Every content page carries the same SEO scaffolding directly in its `<head>` — there is no template engine, so additions are duplicated across pages.

### Per-page head additions
Each page adds the following after `<title>`:
- `<meta name="description">` — unique 140–160 character summary
- `<link rel="canonical" href="https://stageandstem.com/...">`
- Open Graph: `og:type`, `og:site_name`, `og:locale` (`en_GB`), `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width` / `og:image:height`
- Twitter Cards: `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`
- Favicons: `<link rel="icon" href="/favicon.ico">`, `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`, `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
- `<meta name="theme-color">` — `#08080f` on stage / landing / 404, `#0d0905` on bistro pages

`og-image.png` (1200×600) is the shared social-share image referenced by every page's `og:image` / `twitter:image`.

The landing page also includes a `.visually-hidden` `<h1>` ("Stage & Stem — Performance Space & Bistro in Cardiff") so the split layout still exposes a heading to crawlers and screen readers.

`404.html` is set to `noindex, follow` and intentionally omits canonical / OG / JSON-LD.

### Structured data (JSON-LD)
Each page's `<head>` includes one or more `<script type="application/ld+json">` blocks:
- **`Organization`** — on every content page. Carries name, URL, logo, image, `sameAs` (Instagram), Richmond Road `PostalAddress`, and a `contactPoint` with `info@stageandstem.com`.
- **`Restaurant`** — on the four bistro pages (`bistro`, `menus`, `book-a-table`, `contact_bistro`). Includes `priceRange: "£"`, `currenciesAccepted: "GBP"`, `hasMenu: ".../menus.html"`, `acceptsReservations: true`.
- **`PerformingArtsTheater`** — on the five stage pages (`stage`, `whats-on`, `perform-with-us`, `contact_stage`, `book_stage`).
- **`FAQPage`** — on both contact pages (`contact_bistro`, `contact_stage`), mirroring the visible FAQ section on each page (opening hours / bookings / parking / accessibility, etc.).

Restaurant and Theater both link back to the Organization via `parentOrganization: { "@id": "https://stageandstem.com/#organization" }`.

**Currently omitted from the schema** (add as a follow-up when known): `telephone`, `openingHoursSpecification`, `servesCuisine`.

### `sitemap.xml` and `robots.txt`
`sitemap.xml` lists the 10 indexable pages (`404.html` is excluded) with `<lastmod>`, `<changefreq>` and `<priority>`. `robots.txt` allows all crawlers and points to the sitemap.

After deploying, submit `https://stageandstem.com/sitemap.xml` to Google Search Console.

### `.htaccess`
- `ErrorDocument 404 /404.html`
- 301 redirect: `www.stageandstem.com` → `stageandstem.com`
- Force-HTTPS rule is **commented out** — uncomment the two `RewriteCond %{HTTPS} off` / `RewriteRule` lines once SSL is provisioned on the domain.

### Favicon assets
Three favicon files (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`) are derived from `favicon-source.png` (1024×1024 PNG — comedy mask + wine glass on black). To regenerate them after editing the source, run any favicon tool (e.g. realfavicongenerator.net), or use Pillow:

```python
from PIL import Image
src = Image.open("favicon-source.png").convert("RGBA")
src.resize((180, 180), Image.LANCZOS).convert("RGB").save("apple-touch-icon.png", "PNG", optimize=True)
src.resize((32, 32), Image.LANCZOS).save("favicon-32.png", "PNG", optimize=True)
src.save("favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
```

---

## Paths

Because the site is flat (all files in the root), every link and asset reference is a plain filename — no `../` and no subfolder prefixes. For example, pages link to `logo.png`, `style-stage.css`, `bistro.html`, etc. directly. Keep all files in the same directory and everything resolves.

---

## What's Been Built

- [x] Landing / split entry page with logo half-fade on hover (`index.html`); panel labels permanently visible on touch devices
- [x] Stage pages — 5 pages + `style-stage.css`
- [x] Bistro pages — 4 pages + `style-bistro.css`
- [x] Nav crosslinks on all pages (Bistro link on stage pages, Stage link on bistro pages)
- [x] Contextual cross-links (e.g. Dine & Show → What's On)
- [x] Placeholder menu with example dishes and prices
- [x] Newsletter signup strip on all content pages, wired to Mailchimp (`newsletter.js`)
- [x] Events calendar on `whats-on.html` with category filter tabs and sold-out support
- [x] Ticket booking page (`book_stage.html`) with Eventbrite embed placeholder
- [x] Social links in footer of all pages (Instagram live, Facebook/TikTok/X placeholder)
- [x] Mobile hamburger nav on all pages
- [x] SEO foundation: per-page meta descriptions, canonical URLs, Open Graph & Twitter Cards
- [x] JSON-LD structured data (`Organization` sitewide; `Restaurant` on bistro pages; `PerformingArtsTheater` on stage pages; `FAQPage` on both contact pages)
- [x] Favicon set (ICO + 32px PNG + 180px apple-touch) generated from `favicon-source.png`
- [x] `robots.txt`, `sitemap.xml`, and `.htaccess` redirects (404, www → non-www, HTTPS-ready)
- [x] Contact page desktop layout — two-column grid (contact info + Google Maps embed) with FAQ grid below; responsive single-column on mobile

## What Still Needs Building / Improving

- [ ] Wire up Eventbrite event ID in `book_stage.html` (replace placeholder embed)
- [ ] Update Facebook, TikTok and X social links when accounts are live
- [ ] Real content from the client (copy, images, actual menu)
- [ ] Contact & booking forms (currently email links only)
- [ ] Phone number, opening hours and `servesCuisine` — currently omitted from JSON-LD; add when confirmed
- [ ] Uncomment the force-HTTPS rule in `.htaccess` once SSL is provisioned on the domain
- [ ] Submit `sitemap.xml` to Google Search Console after first deploy
- [ ] About page for each side, or a shared About page
- [ ] Google Sheets (or similar) integration for events, so the client can update What's On without touching code

---

## Known Issues / Cleanup Candidates

- **`.DS_Store` is tracked in git.** This is a macOS Finder metadata file with no purpose in the repo. It should be removed and added to a `.gitignore`.

---

## Hosting & Deployment

**Host:** Fasthosts  
**Method:** File Manager → upload to `public_html`  
**Domain:** stageandstem.com

The site is flat, so upload all files into `public_html` together (no subfolders to recreate). `index.html` serves as the landing page at the domain root.

---

## Client Notes

- Client is non-technical — any content update system should be simple (e.g. Google Sheets for events)
- The client has existing Fasthosts hosting and domain
- Logo exists as `logo.png` (full) and as two split halves (`logo_left.png`, `logo_right.png`)
- For best results, a transparent-background PNG of the full logo would be ideal
