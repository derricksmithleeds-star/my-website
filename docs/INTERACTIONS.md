# Interaction Specification

## Purpose

This file describes how the website behaves.

It covers:
- animations
- transitions
- scrolling behaviour
- hover behaviour
- clicks and taps
- menus
- navigation
- forms
- responsive interaction differences
- desktop, tablet and mobile behaviour

Claude must use this file whenever a task changes how the website behaves.

If behaviour is unclear or missing, Claude must ask instead of inventing it.

Items marked **(provisional)** were chosen for the first build and await art-director approval.

## Global interaction rules

- Do not add animation unless it is described here or I explicitly request it.
- Motion should be intentional and controlled.
- Do not use bounce or elastic animation unless specifically requested.
- Prefer transform and opacity for animation where practical.
- Touch devices must not depend on hover.
- The website must remain usable if animations are disabled or reduced.

## Easing tokens

Taken from the reference site (lightfactory.studio):

| Token | Curve | Use |
|---|---|---|
| `--ease-in-out-quart` | `cubic-bezier(0.77, 0, 0.175, 1)` | Bars, line draws |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Text reveals |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Page-transition cover |

## Page load

Reference: the intro on lightfactory.studio, **flipped vertically**. On the reference the bars slide down; here they slide **up**.

Structure: a fixed full-screen layer above the page (`z-index` above everything) containing three full-screen colour panels stacked on top of each other, plus the centred wordmark/logo.

Stacking order, top to bottom: yellow, green, pink. Each panel reveals the next one as it leaves.

Timeline (ms from page start):

| Element | Property | From → To | Duration | Delay | Easing |
|---|---|---|---|---|---|
| Yellow panel | `translateY` | `0` → `-100%` | 600 | 1000 | in-out-quart |
| Green panel | `translateY` | `0` → `-100%` | 600 | 1200 | in-out-quart |
| Pink panel | `translateY` | `0` → `-100%` | 600 | 1400 | in-out-quart |
| Wordmark | `opacity` | `1` → `0` | 500 | 1400 | ease |
| Hero line 1 | `translateY` | `110%` → `0` | 1000 | 1800 | out-expo |
| Hero line 2 | `translateY` | `110%` → `0` | 1000 | 1900 | out-expo |
| Hero line 3 | `translateY` | `110%` → `0` | 1000 | 2000 | out-expo |
| Header | `opacity` | `0` → `1` | 1000 | 1900 | ease |
| Hero tiles | `opacity` | `0` → `0.75` | 600 | 1800 + 60 × tile index | ease |
| Intro layer | `display` | → `none` | — | 2200 | — |

Hero lines sit inside `overflow: hidden` masks so they rise out of an invisible slot.

The intro rule and paragraph are now below the fold and are not animated.

## Hero tile field

Reference: wanda.net homepage. Tiles fade in, the field drifts with the cursor, and the tile under the cursor brightens.

**Floating (all devices):**
- Every tile floats continuously on its own slow loop, like wanda.net, so the field is never still.
- Each tile has its own size of float (14–36px sideways, 10–28px vertically), its own speed (one sideways loop every 8–14s, vertical loop 1.2–1.5× slower) and its own starting point, so tiles move independently and out of step.
- The float grows in smoothly over 1500ms, starting when the tiles begin to fade in (1800ms), so there is no jump when it starts.
- Floating is added on top of the mouse steering (desktop) or scroll drift (mobile).

**Desktop (1024px and above, fine pointer with hover):**
- The field follows the mouse. Cursor at the left edge of the screen shows the field's left edge; cursor at the right edge shows its right edge. Same vertically. Cursor in the centre shows the centre. Total travel: 50vw on each axis (±25vw).
- Movement is smoothed in two stages (6% per 60fps frame each, frame-rate independent), so it starts gently, glides and settles with no jolt, bounce or overshoot, including when the cursor re-enters from an edge.
- Depth: each tile has a depth factor between 0.85 and 1.15 and moves by (field offset × depth), so tiles shift slightly relative to each other.
- **Card flip:** the hovered tile turns over like a playing card (rotates 180° around its vertical axis, with perspective) to show its back, and grows to **125%** while turning. 700ms, in-out-quart easing. Moving off the tile turns it back and shrinks it the same way. Keyboard focus on a tile does the same. Clicking a tile follows its link (with the page transition once project pages exist). Touch devices: tapping a tile follows the link (no flip). Reduced motion: the back face appears without the turn.
- **Card lighting** (all timed with the flip: 700ms, in-out-quart):
  - *Shine:* a diagonal band of white light (55% at its brightest, 105° angle) sweeps across the card as it turns. It crosses the front during the first half of the flip and carries on across the back in the second half, reading as one continuous glint. It sweeps back the other way when the card turns back.
  - *Shading:* the front darkens (up to 45% black) as it turns edge-on; the back starts shaded and brightens to full as it faces the viewer.
  - *Resting glare:* once flipped, a soft radial glare (50% white, fading out over 60% of the card) fades in on the back (400ms, starting 500ms into the flip) and follows the cursor across the card. **(provisional: reading of "a shine that carries on")**
  - Reduced motion: no sweep or shading animation.
- **3D tilt (flipped card):** once the card has flipped (tilt eases in from 550ms to 850ms after the flip starts), it tilts towards the cursor: the part of the card under the cursor presses away, up to **12°** at the card's edges, smoothed at 15% per 60fps frame. The client name and description are fixed flat on the card surface (no parallax), so the card tilts as one solid, physical card. When the card is released, it settles flat as it flips back.
- **Steering pauses while a card is flipped:** the field stops following the mouse while a card is active, so the card stays under the cursor for tilting, reading and clicking. Floating continues. Steering picks up from the cursor's current position when the card is released.
- **Edge tiles slide into view:** when the hovered tile's enlarged (125%) card would be closer than **10vw** to any edge of the screen, the tile slides inwards until there is at least 10vw clear on every side, so the whole card and its back are visible. The slide eases smoothly (12% per 60fps frame) and reverses when the tile is no longer hovered. If the screen is too small for 10vw on both sides, the card is centred on that axis.
- **Hover is tracked by script, not CSS :hover:** a tile stays hovered while the cursor is still (within 8px of where it picked the tile), because tiles keep floating and steering under a resting cursor, or while the cursor is over where the tile is now or where it sat before sliding in. This stops a sliding tile from leaving the cursor, un-hovering and looping.
- **Headline while a tile is hovered:** whenever **any** tile is hovered, the headline gets the same Gaussian blur as the other tiles (`--tile-blur`, 8px) and fades to opacity **0.1** (400ms ease). The hovered tile is drawn in front of the headline (its stacking switches 150ms into the hover). When no tile is hovered, the headline sharpens and fades back to full (600ms).
- When the cursor leaves the window, the field stays where it is (it does not return to centre) and keeps floating.
- The mouse wheel scrolls the page as normal; it does not move the tiles.
- Hover: the hovered tile goes from opacity 0.75 → 1. At the same time **every other tile** blurs (Gaussian blur, `--tile-blur`, currently **8px (provisional)**: the brief asked for "40%", which needs confirming as a pixel value) and drops to opacity **0.3**. All changes 300ms ease, and they reverse when the cursor leaves the tile.

**Tablet and mobile (below 1024px, or touch):**
- No horizontal movement.
- As the page scrolls from the top to the bottom of the hero, the field moves up by 50vw (× each tile's depth), so the lower tiles drift into view. Tiles move faster than the page, giving a parallax feel. Swiping always scrolls the page; nothing traps the scroll (except while a card is open, below).
- No hover state.
- **Hold to open:** pressing a tile for **0.5 seconds** opens it. While the finger is held, the card presses in (to 94% over the 0.5s) so the visitor knows something is happening **(provisional)**. If the finger moves more than 10px (a scroll) or lifts early, nothing happens. A quick tap on a closed tile does nothing, so accidental touches never open links. Long-press menus and link previews are disabled on tiles. Phones that support it give a tiny 10ms vibration when the card opens.
- **Open card:** flips (same flip, shine and shading as desktop), glides to the **centre of the screen** and grows to **80% of the screen width**. All other tiles blur and fade to **10%** (desktop hover stays at 30%); the headline blurs and fades to 10% (as on desktop). The page does not scroll at all while a card is open (touch scrolling is switched off for the whole page, any momentum scroll is stopped when the card opens, and the page is held at its position). Scrolling returns only when the card is closed with the close button or a tap away from the card.
- **Tilt and glare on mobile:** dragging a finger over the open card tilts it towards the finger (same 12° maximum) and moves the glare with it. When not being touched, the card sways gently on its own (about a fifth of the full tilt) so it still feels alive.
- **Closing:** a **close (×) button** in the top-right corner of the card's back, or a tap anywhere outside the card. Tapping the card itself follows its link.

**Performance:** tile movement uses `transform: translate3d()` only. The animation loop runs only while the hero is on screen.

The wordmark sits on the panels in `--ink` until the logo is supplied.

## Page transitions (leaving a page)

Reference: the yellow cover on lightfactory.studio drops from the top. Flipped here: it **rises from the bottom**.

When the user clicks a link to another page on the same site (not an anchor link on the same page, not a new-tab or modifier-key click):

| Element | Property | From → To | Duration | Delay | Easing |
|---|---|---|---|---|---|
| Yellow cover | `translateY` | `100%` → `0` | 600 | 0 | out-quart |
| Page content | `translateY` | `0` → `-10%` | 600 | 0 | out-quart |
| Wordmark on cover | `opacity` | `0` → `1` | 500 | 200 | ease |

Navigation to the new URL happens when the cover finishes (600ms). The new page then plays the page-load sequence.

If the user returns with the browser Back button and the page is restored from cache, the cover must be hidden immediately.

## Header and navigation

- Header is fixed and stays visible while scrolling.
- Anchor links scroll smoothly to their section (CSS `scroll-behavior: smooth`, disabled under reduced motion).

## Menus

Not used in the first version: the single page has a header with the wordmark and one button. A menu will be specified if more pages are added.

## Buttons and links

- Primary button hover (pointer devices only): background changes from `--yellow` to `--paper`, 200ms ease.
- Text links: underline thickness animates from 1px to 2px on hover, 200ms.
- Email link in contact block: same as text links.
- Focus: 2px `--yellow` outline, 4px offset, on every interactive element (on `--mist` surfaces the outline is `--graphite`).

## Scroll behaviour

**Dark-to-light switch.** When the page has scrolled more than **85% of the hero height** (late enough that visitors can scroll down to look at the lower tiles first) (the hero is one screen tall):
- The hero headline and the whole tile field fade to opacity 0 (600ms ease), then become hidden so the tiles can't be hovered.
- The page background fades from `--ink` to `--paper` and the text from white to black (600ms ease), across the whole page.

Scrolling back above 85% reverses both. The switch is triggered at the threshold, not scrubbed with the scroll position.

**No blank white screen (all devices).** The page turns white at exactly the scroll position where the intro paragraph reaches the centre of the screen and is pinned there (85%), so there is no in-between blank screen at any scroll position. There is no forced auto-scroll: scrolling stays fully under the visitor's control in both directions.

**Intro paragraph reveal.** When the page has scrolled more than **85% of the hero height** (the dark-to-light switch) *and* the hero has finished fading out (600ms later):
- The paragraph fades in **line by line**, top line first. Each line: opacity 0 → 1, 600ms ease, each line starting 150ms after the previous one **(provisional timing)**.
- Lines are the visual lines as wrapped on screen; they are recalculated when the window is resized or the web font loads.
- **Scroll pause:** from the moment the reveal starts until the last line has fully appeared, scrolling is paused (mouse wheel, trackpad, touch swipes and scroll keys are blocked). Total pause = remaining hero fade + 600ms + 150ms × (lines − 1), about 1.2–1.8s. The pause only happens while the paragraph is pinned on screen, so reloading further down the page never locks it.
- The paragraph stays pinned in the centre of the screen while the visitor scrolls one more screen, then scrolls away to reveal "What I do".
- Scrolling back above 85% hides the paragraph again (all lines together, 300ms), ready to replay.
- Reduced motion: the paragraph appears at once, without fading, and scrolling is never paused.

## Section transitions

None.

## Forms

None in the first version. Contact is an email link.

## Desktop behaviour

As above.

## Tablet behaviour

Same motion as desktop.

## Mobile behaviour

Same motion as desktop. Panels use `100dvh` so they fully cover the screen behind mobile browser toolbars.

## Reduced motion

When `prefers-reduced-motion: reduce` is set:
- The intro layer is not shown. The page appears immediately in its final state.
- Hero tiles are shown at rest in their centred positions; they do not follow the mouse or drift on scroll.
- The page-transition cover is skipped; links navigate immediately.
- Smooth scrolling is off.
- Hover colour changes remain (they are not motion).

If JavaScript fails to load, the intro layer must not trap the page: it is hidden by default and only shown when JavaScript adds a `js` class to `<html>`.
