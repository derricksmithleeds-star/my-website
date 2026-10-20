# Design Specification

## Purpose

This file describes what the website should look like.

Until a Figma file exists, **this file is the visual source of truth**.

Claude must use this file to understand:
- colours
- fonts
- spacing
- layout
- components
- responsive design
- visual rules

If something is unclear or missing, Claude must ask instead of inventing a design decision.

Items marked **(provisional)** are placeholders chosen to get a first version built. The art director will confirm or replace them.

## Project

- Agency: Made to Count (one-person marketing agency)
- Domain: madetocount.co
- Visual reference: the page-load bar animation on lightfactory.studio, flipped so the bars move **up** (see `docs/INTERACTIONS.md`).

## Concept

The intro bars move upward like a bar chart rising, which ties the motion to the name: marketing that is measured and shows results. The bars are the one loud moment. Everything after them is quiet, black and typographic, so the colour stays special.

## Figma

Figma file:
[PASTE FIGMA LINK HERE LATER]

## Breakpoints

- Desktop: 1024px and above
- Tablet: 768px to 1023px
- Mobile: below 768px

Content max width: 1440px, centred.

## Colours

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#070707` | Page background |
| `--paper` | `#FFFFFF` | Main text on dark |
| `--mist` | `#F1F1F1` | Light surfaces (menu overlay, contact block) |
| `--graphite` | `#1A1A1A` | Text on light surfaces, dividers on dark |
| `--muted` | `#8C8C8C` | Secondary text on dark |
| `--yellow` | `#DFFF1C` | Intro bar 1, page-transition cover, primary button |
| `--green` | `#29FF65` | Intro bar 2 |
| `--pink` | `#FF1CDB` | Intro bar 3 |

The three bright colours are borrowed from the reference site **(provisional)**. They will be replaced with Made to Count brand colours later. Always reference the tokens, never raw hex values, so they can be swapped in one place.

Page theme:
- The page starts **dark** (`--ink` background, `--paper` text) for the hero.
- Once the visitor scrolls 30% of the screen height, the whole page switches to **light**: `--paper` (white) background and `--ink` (black) text, including the header, all sections, the contact section and the footer. Secondary text is also black in the light theme. See `docs/INTERACTIONS.md`.
- Components take colour from the theme tokens `--bg`, `--fg`, `--fg-soft` and `--focus`, never directly from `--ink`/`--paper`.

Rules:
- Bright colours appear only in the intro bars, the page-transition cover, the primary button and focus outlines.
- No gradients, no shadows.

## Typography

Typeface: **Schibsted Grotesk** (Google Fonts), weights 400 and 500 **(provisional)**. One family across the whole site.

Fallback stack: `"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif`.

Fluid type scale:

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display (hero) | `clamp(3rem, 9vw, 9rem)` | 500 | 0.92 | -0.04em |
| H2 (section titles) | `clamp(2.25rem, 5vw, 4.5rem)` | 500 | 1.0 | -0.03em |
| H3 | `clamp(1.375rem, 2vw, 1.75rem)` | 500 | 1.15 | -0.01em |
| Body large | `clamp(1.125rem, 1.4vw, 1.375rem)` | 400 | 1.45 | 0 |
| Body | `1rem` | 400 | 1.55 | 0 |
| Small | `0.875rem` | 400 | 1.4 | 0 |

Rules:
- Sentence case everywhere. No all-caps labels.
- Numbers (results figures) use tabular numerals.
- Body text max width: 60ch.

## Spacing

Base unit 8px. Scale: 4, 8, 16, 24, 32, 48, 64, 96, 128, 192.

- Page side gutter: 16px mobile, 32px tablet, 48px desktop.
- Section vertical padding: 96px mobile, 128px tablet, 192px desktop.

## Layout

Single page, left-aligned throughout, 12-column grid on desktop.

```
┌──────────────────────────────────────────────┐
│ Made to Count                  [Book a call] │  header
│   ▢      ▢          ▢        ▢               │
│        ▢     MARKETING    ▢      ▢           │  hero: full screen,
│   ▢        THAT'S MADE         ▢             │  headline centred,
│      ▢      TO COUNT.    ▢          ▢        │  tile field behind
│   ▢     ▢          ▢          ▢              │
├──────────────────────────────────────────────┤  ← fold
│        I'M A ONE-PERSON MARKETING            │  intro paragraph,
│      AGENCY FOR SMALL BUSINESSES ...         │  8vw, centred, black
├──────────────────────────────────────────────┤
│                  What I do                   │  full screen,
│                  Strategy                    │  everything centred
│                  Content                     │
│               Paid campaigns                 │
│                Measurement                   │
├──────────────────────────────────────────────┤  (white from here down)
│ How it works     1 Audit · 2 Plan · 3 Launch · 4 Report │
├──────────────────────────────────────────────┤
│ Selected work    result rows: client / figure │
├──────────────────────────────────────────────┤
│ About            portrait slot + short bio    │
├──────────────────────────────────────────────┤
│ CONTACT (light --mist block)  big email link  │
├──────────────────────────────────────────────┤
│ footer                                        │
└──────────────────────────────────────────────┘
```

Tablet and mobile: section labels stack above content; everything is one column.

## Hero

- Full screen (`100dvh`). Nothing else is visible above the fold except the header and the hero.
- Headline "Marketing that's made to count." is centred horizontally and vertically, text centre-aligned, on three lines. It sits **on top of** the tile field and never takes pointer events.
- The intro paragraph sits directly below the hero, below the fold. There is no rule (line) above it.

### Tile field

Visual reference: the homepage tile field on wanda.net (no infinite scroll).

- Tiles: **18vw wide × 14vw tall**, `border-radius: 15px`.
- Tiles are placeholders for now: `--graphite`-family fills (`#1A1A1A`, `#222222`, `#2A2A2A`) behind a single test image (`assets/images/tile-test.webp`) used in every tile. They will later hold still images, Lottie files and videos, cropped with `object-fit: cover`.
- Tiles are scattered across a field larger than the screen and may overlap.
- Resting tile opacity 0.75; the tile under the cursor goes to 1 (desktop only).
- Field size:
  - Desktop (1024px and above, with a mouse): **viewport + 50vw** in both directions (25vw beyond each edge), so there is 50vw of travel horizontally and vertically.
  - Tablet and mobile: viewport width (no horizontal travel), height **viewport + 50vw** (50vw of vertical travel).
- The hero clips the field (`overflow: hidden`); tiles never cause page scrollbars.

## Components

**Header.** Wordmark left (text until logo arrives), "Book a call" button right. Fixed at top, transparent over the page.

**Primary button.** `--yellow` fill, `--ink` text, 500 weight, 48px tall, 24px side padding, fully rounded (999px). Hover: `--paper` fill on the dark theme; `--ink` fill with `--paper` text on the light theme (provisional, so the hover stays visible on white).

**Intro paragraph.** 8vw, weight 500, line height 1.05, tracking -0.03em, centred, balanced line breaks.

**What I do section.** At least full screen height (`100dvh`), content vertically centred. "What I do" label, service titles and descriptions all centre-aligned. Service rows stack title above description, separated by full-width 1px `--graphite` rules.

**Service row.** H3 title + one-line description, separated by 1px `--graphite` rules.

**Process step.** Number, H3 title, short description. Numbers are used here only because the steps are a real sequence.

**Result row.** Client name, what was done, headline figure in display-sized tabular numerals.

**Contact block.** Same white background and black text as the rest of the light page, the email address set at H2 size as a link.

**Logo.** Not supplied yet. Use the text wordmark "Made to Count" until the art director provides a logo file.

## Imagery

No real images yet; the hero tiles are placeholders (see Tile field). A portrait slot exists in the About section as a `--graphite` box with a placeholder label.

## Responsive behaviour

- Hero display scales fluidly; it must never overflow horizontally.
- Grid collapses to one column below 1024px.
- Header keeps wordmark and button on one row at all sizes; button text shortens to "Book" below 400px if needed.
- No horizontal scrolling at any width down to 320px.
