# Xilveno — Shopify Theme

**Premium multi-category dropshipping theme for Shopify OS 2.0**

> Discover More. Live Better.

---

## Quick Start

### Option A — Upload a ZIP

1. Download the `xilveno.zip` file
2. Go to **Shopify Admin → Online Store → Themes**
3. Click **Add theme → Upload ZIP file**
4. Select `xilveno.zip`
5. Click **Customize** to open the Theme Editor and begin configuring

### Option B — Connect from GitHub (recommended for development)

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Add theme → Connect from GitHub**
3. Connect your GitHub account and select:
   - **Repository:** `abdullahallaminbd1-hub/xilveno-shopify-theme`
   - **Branch:** `main`
4. **Theme root directory: leave it empty (`/`)** — the theme files (including
   `layout/theme.liquid`) live directly at the repository root.
5. Click **Save**.

> **Troubleshooting — "Role can't be set to main: missing required file
> layout/theme.liquid"**
>
> This error means Shopify is looking for the theme in a nested folder that no
> longer exists. Previously this repository stored the theme under
> `xilveno_upload/`, but the theme now lives at the **repository root**. To fix:
>
> 1. In the GitHub connection, set **Theme root directory to `/`**
>    (blank = repo root).
> 2. Re-import, or push a new commit to `main` to trigger a re-sync.
> 3. `layout/theme.liquid` is verified to exist at `main` root.

---

## Theme Editor — What You Can Customize

Everything below is configurable in **Shopify Admin → Online Store → Themes → Customize** without touching code.

### Global Settings (Theme Settings panel)
| Setting | Description |
|---|---|
| Color scheme | Light or Dark mode |
| Brand colors | Primary, background, accent, surface, border |
| Typography | Heading & body fonts, sizes |
| Page width | Max container width (1000–1600px) |
| Button corners | Square, rounded, or pill |
| Free shipping bar | Set threshold amount (e.g. 5000 = $50) |
| Animation level | Full, moderate, subtle, or none |
| Social media links | Instagram, TikTok, Facebook, Pinterest, YouTube |
| Favicon | Upload 32×32px PNG |
| Share image | Default Open Graph image |

### Homepage Sections (drag & drop order)
- Hero Slideshow — add/remove slides, images, headings, CTAs
- USP Strip — icons and labels
- Category Grid — images, names, links
- Featured Products — select any collection
- Promotional Banner — background image, title, CTA
- Testimonials — add reviewer quotes, ratings, avatars
- Newsletter — heading, email form, privacy note
- Blog Posts — auto-pulls from selected blog
- Image with Text — layout, image, copy, button
- Multicolumn — 2–4 columns with icons or images
- Rich Text — centered content block
- Recently Viewed — auto-populated from browser history

### Header
- Logo upload (or text fallback)
- Announcement bar — up to 10 rotating messages
- Navigation items — with optional mega menus
- Sticky header toggle

### Footer
- Brand description
- 3 link columns — connect any navigation menu
- Social icon links
- Payment icons (auto from Shopify)

---

## Pages — What's Included

| Page | Template | URL |
|---|---|---|
| Homepage | `index.json` | `/` |
| Collection | `collection.json` | `/collections/[handle]` |
| Product | `product.json` | `/products/[handle]` |
| Cart | `cart.json` | `/cart` |
| Search | `search.json` | `/search` |
| Blog listing | `blog.json` | `/blogs/[handle]` |
| Blog post | `article.json` | `/blogs/[handle]/[post]` |
| About | `page.about.json` | Assign to page in Shopify admin |
| Contact | `page.contact.json` | Assign to page in Shopify admin |
| FAQ | `page.faq.json` | Assign to page in Shopify admin |
| Lookbook | `page.lookbook.json` | Assign to page in Shopify admin |
| Policies | `page.policy.json` | Assign to policy pages |
| Wishlist | `page.wishlist.json` | Assign to page with handle `wishlist` |
| 404 | `404.json` | Automatic |
| Coming soon | `password.liquid` | Active when store is password-protected |
| Customer login | `customers/login.json` | `/account/login` |
| Customer register | `customers/register.json` | `/account/register` |
| Account dashboard | `customers/account.json` | `/account` |
| Order detail | `customers/order.json` | `/account/orders/[id]` |
| Addresses | `customers/addresses.json` | `/account/addresses` |
| Gift card | `gift_card.liquid` | Auto (when gift cards are enabled) |

### Assigning Page Templates in Shopify Admin
1. Go to **Online Store → Pages**
2. Create or edit the page (e.g. "About Us")
3. On the right sidebar, under **Theme template**, select the correct template (e.g. `about`)
4. Save

---

## Features & Integration Notes

### Wishlist
The wishlist is **localStorage-based** — it works immediately without any app installation and persists across pages on the same browser/device. Limitation: not synced across devices or after clearing browser data.

**For cross-device wishlist sync**, connect one of these apps in Shopify App Store:
- Wishlist Hero
- Growave
- Froonze

### Product Reviews
The product page includes an **app block slot** for reviews. To show real reviews:
1. Install **Judge.me**, **Okendo**, **Yotpo**, or **Shopify Product Reviews** from the App Store
2. In Theme Editor → Product page → App blocks, add the review block
3. Reviews will render in the designated slot

### Loyalty / Points
The account dashboard shows a **placeholder loyalty widget**. To populate with real data:
1. Install **Smile.io**, **LoyaltyLion**, or **Stamped** from the App Store
2. Configure the app — it auto-renders via app embed

### Returns
The "Request return" link routes to the contact form with the order number pre-filled. For automated returns:
- Install **Loop Returns**, **AfterShip Returns**, or **Rich Returns**

### Predictive Search
Built using Shopify's native `/search/suggest.json` endpoint. No app required. Shows products, collections, and pages as you type.

### Free Shipping Bar
Configured via **Theme Settings → Cart → Free shipping threshold**. Uses the real cart total from Shopify's AJAX Cart API. Set to `0` to hide.

---

## Navigation Menus — Create These in Shopify Admin

Go to **Online Store → Navigation** and create these menus:

| Menu name | Handle | Purpose |
|---|---|---|
| Main menu | `main-menu` | Mobile navigation |
| Shop menu | `shop-menu` | Footer column 1 |
| Help menu | `help-menu` | Footer column 2 |
| Company menu | `company-menu` | Footer column 3 |

---

## Collections — Recommended Handles

Create collections with these handles for the default category links to work:

- `all` — All products
- `fashion` — Fashion & Apparel
- `home-kitchen` — Home & Kitchen
- `beauty` — Beauty & Skincare
- `kids` — Kids & Baby
- `new-arrivals` — New arrivals
- `sale` — Sale items

---

## Product Tags

The theme reads these product tags for automatic badge display:
- `new` or `New` → shows "New" badge on product cards
- Sale is detected automatically from `compare_at_price`

---

## Performance Notes

- Hero images use `fetchpriority="high"` and `loading="eager"` for fast LCP
- All below-fold images use native lazy loading
- JavaScript is deferred — no render-blocking scripts
- CSS uses custom properties throughout — one variable change updates the entire theme
- All animations use `transform` and `opacity` only — no layout shifts
- `prefers-reduced-motion` is respected — all animations disabled when user preference is set
- Shopify CDN `image_url` filter with `srcset` used for all images

---

## Multi-language Support

The theme uses Shopify's `t` filter for all user-facing strings. To add another language:
1. Go to **Shopify Admin → Settings → Languages**
2. Add a language
3. Use **Shopify Translate & Adapt** app or manually translate `locales/en.default.json`

---

## Accessibility

- WCAG 2.1 AA target
- Skip-to-content link
- Full keyboard navigation on all drawers, modals, menus
- Focus management on cart drawer, mobile nav, search
- `aria-live` regions for cart updates and search results
- Semantic HTML throughout
- Screen-reader text via `.visually-hidden`
- Colour contrast verified at AA level for black/white palette

---

## Developer Notes

### File structure
```
xilveno/
├── assets/          — CSS and JS
├── config/          — Theme settings schema and data
├── layout/          — Master Liquid layouts
├── locales/         — Translation strings
├── sections/        — All section Liquid files (with {% schema %})
├── snippets/        — Reusable Liquid partials
└── templates/       — JSON templates (OS 2.0)
    └── customers/   — Customer account templates
```

### Adding a new section
1. Create `sections/my-section.liquid` with `{% schema %}` block
2. Add it to a template JSON file under `sections` and `order`
3. It will appear in the Theme Editor for that page

### Environment
- Shopify Online Store 2.0
- No build tools required — pure Liquid, CSS, and vanilla JS
- No external dependencies or CDN scripts

---

## Support

For questions about this theme, visit the contact page or email hello@xilveno.com.