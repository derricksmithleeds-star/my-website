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

Four panels in brand-colour order. Stacking order, top to bottom: mint, rose, gold, blue. Each panel reveals the next one as it leaves; the last one still lifts at 1400ms, so the rest of the intro timing is unchanged.

Timeline (ms from page start):

| Element | Property | From → To | Duration | Delay | Easing |
|---|---|---|---|---|---|
| Mint panel | `translateY` | `0` → `-100%` | 600 | 800 | in-out-quart |
| Rose panel | `translateY` | `0` → `-100%` | 600 | 1000 | in-out-quart |
| Gold panel | `translateY` | `0` → `-100%` | 600 | 1200 | in-out-quart |
| Blue panel | `translateY` | `0` → `-100%` | 600 | 1400 | in-out-quart |
| Wordmark | `opacity` | `1` → `0` | 500 | 1400 | ease |
| Hero headline (all lines together) | `opacity`, `filter`, `scale` | `0`, blur 8px, `0.95` → `1`, sharp, `1` | 1000 | 1800 | out-expo |
| Header | `opacity` | `0` → `1` | 1000 | 1900 | ease |
| Hero tiles | `opacity` | `0` → `0.75` | 600 | 1800 + 60 × tile index | ease |
| Intro layer | `display` | → `none` | — | 2200 | — |

The headline fades in as one piece from a blur at 95% size (it no longer rises line by line).

The intro rule and paragraph are now below the fold and are not animated.

## Hero tile field

Reference: wanda.net homepage. Tiles fade in, the field drifts with the cursor, and the tile under the cursor brightens.

**Scroll parallax (all devices):**
- **Tiles behind the headline (all devices):** while the headline is sharp (no tile hovered, flipped or open), any tile with **at least half** of its area behind the headline's words (measured around the text of the three lines, not the full width) fades to **30%** opacity (300ms ease), and returns to its normal opacity once it drifts or scrolls out (below 45%, so tiles on the edge don't flicker). Checked every frame, because tiles are always moving.
- The **headline** scrolls at **60% of the page's speed** (it moves down by 40% of the distance scrolled), so it lags behind and the tiles slide past it.
- Each **tile** has its own scroll speed, from **0.85× to 1.6×** the page's speed (seeded, so the same on every visit). Tiles therefore pass each other and the headline at different rates, giving the field depth.
- Applied directly from the scroll position every frame (no smoothing), so it never lags behind the finger or wheel. Combines with floating, mouse steering and card flips.
- Reduced motion: no parallax; everything scrolls with the page.

**Floating (all devices):**
- Every tile floats continuously on its own slow loop, like wanda.net, so the field is never still.
- Each tile has its own size of float (14–36px sideways, 10–28px vertically), its own speed (one sideways loop every 8–14s, vertical loop 1.2–1.5× slower) and its own starting point, so tiles move independently and out of step.
- The float grows in smoothly over 1500ms, starting when the tiles begin to fade in (1800ms), so there is no jump when it starts.
- Floating is added on top of the mouse steering (desktop) or scroll drift (mobile).

**Desktop (1024px and above, fine pointer with hover):**
- The field follows the mouse. Cursor at the left edge of the screen shows the field's left edge; cursor at the right edge shows its right edge. Same vertically. Cursor in the centre shows the centre. Total travel: 50vw on each axis (±25vw).
- Movement is smoothed in two stages (6% per 60fps frame each, frame-rate independent), so it starts gently, glides and settles with no jolt, bounce or overshoot, including when the cursor re-enters from an edge.
- Depth: each tile has a depth factor between 0.85 and 1.15 and moves by (field offset × depth), so tiles shift slightly relative to each other.
- **Card flip:** the clicked tile turns over like a playing card (rotates 180° around its vertical axis, with perspective) to show its back, and grows to **130%** while turning (the same size as the hover state). 700ms, in-out-quart easing. Moving off the tile turns it back and shrinks it the same way. Keyboard focus on a tile does the same. Clicking a tile follows its link (with the page transition once project pages exist). Touch devices: tapping a tile follows the link (no flip). Reduced motion: the back face appears without the turn.
- **Card lighting** (all timed with the flip: 700ms, in-out-quart):
  - *Shine:* a diagonal band of white light (55% at its brightest, 105° angle) sweeps across the card as it turns. It crosses the front during the first half of the flip and carries on across the back in the second half, reading as one continuous glint. It sweeps back the other way when the card turns back.
  - *Shading:* the front darkens (up to 45% black) as it turns edge-on; the back starts shaded and brightens to full as it faces the viewer.
  - *Resting glare:* once flipped, a soft radial glare (50% white, fading out over 60% of the card) fades in on the back (400ms, starting 500ms into the flip) and follows the cursor across the card. **(provisional: reading of "a shine that carries on")**
  - Reduced motion: no sweep or shading animation.
- **3D tilt (flipped card):** once the card has flipped (tilt eases in from 550ms to 850ms after the flip starts), it tilts towards the cursor: the part of the card under the cursor presses away, up to **12°** at the card's edges, smoothed at 15% per 60fps frame. The client name and description are fixed flat on the card surface (no parallax), so the card tilts as one solid, physical card. When the card is released, it settles flat as it flips back.
- **Steering pauses while a card is flipped:** the field stops following the mouse while a card is active, so the card stays under the cursor for tilting, reading and clicking. Floating continues. Steering picks up from the cursor's current position when the card is released.
- **Headline while a tile is hovered:** whenever **any** tile is hovered, the headline gets the same Gaussian blur as the other tiles (`--tile-blur`, 8px) and fades to opacity **0.1** and shrinks to **95%** of its size (400ms ease). When the tile is released (or the phone card closed), the headline **holds for 1s**, then its size, blur and fade all return together over **1020ms**. The hovered tile is drawn in front of the headline (its stacking switches 150ms into the hover). When no tile is hovered, the headline sharpens and fades back to full (600ms).
- When the cursor leaves the window, the field stays where it is (it does not return to centre) and keeps floating.
- The mouse wheel scrolls the page as normal; it does not move the tiles.
- **Hover:** straight away, the tile under the pointer goes to opacity 1, comes in front of the headline and shows a pointer cursor, and **all other tiles fade to 30% and blur, and the headline blurs and fades to 10%**. Only after the pointer has rested on the tile for **0.5s** does it **grow to 130%** and **tilt towards the pointer** (same 12° tilt as the flipped card) with a **soft glare on the photo** that follows the pointer (35% white radial), so quick passes over the tiles don't make them jump. It does **not** flip on hover; moving off returns everything to normal.
- **Hovered edge tiles slide into view:** a hovered (or flipped) tile whose 130% card would be closer than **10vw** to any screen edge slides inwards until there is at least 10vw clear on every side, and slides back when released. The slide uses two-stage easing (5% per 60fps frame in each stage), so it starts gently, glides and settles softly over about 1.5s. The tiles **keep floating and following the mouse while a tile is hovered** (steering only pauses while a card is flipped). The edge slide starts as soon as the tile is hovered, without waiting for the 0.5s grow. A hovered tile stays hovered while the pointer is still (within 8px of where the hover began) or over where the tile is now or sat before sliding, so it can't slide away, un-hover and loop. A click while a tile is hovered flips that tile even if it has slid out from under the pointer. (Tracked by script every frame, because tiles drift under a resting pointer.)
- **Click to flip:** the **first click** flips the tile (with everything below: slide into view, stays at 130%, shine, tilt, blur of the other tiles and the headline). A **second click on the flipped card follows its link** (routed to the link even when 3D hit-testing reports the card's front face).
- **Flipping back:** the **close (×) button** in the top-right of the card's back; **moving the pointer more than 10vw beyond the card** (measured from the card's enlarged edges, and from where it sat before sliding in) or out of the window; or **clicking anywhere else** (the click still goes through, e.g. to "Book a call"). Clicking another tile flips that one instead.

**Tablet and mobile (below 1024px, or touch):**
- No horizontal movement.
- Scrolling moves the tiles with the scroll parallax described below (same as desktop), so the lower tiles drift into view. Swiping always scrolls the page; nothing traps the scroll (except while a card is open, below).
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
| Mint cover | `translateY` | `100%` → `0` | 600 | 0 | out-quart |
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

- Primary button: white on the dark page, black once the page turns light (200ms ease). Hover: no distinct hover colour yet (to be decided).
- Text links: underline thickness animates from 1px to 2px on hover, 200ms.
- Email link in contact block: same as text links.
- Focus: 2px `--mint` outline, 4px offset, on every interactive element (on `--mist` surfaces the outline is `--graphite`).

## Scroll behaviour

**Dark-to-light switch.** When the page has scrolled more than **85% of the hero height on desktop** (late enough that visitors can scroll down to look at the lower tiles first), or **45% on mobile and tablet** (where the tiles have scrolled past by about halfway) (the hero is one screen tall):
- The hero headline and the whole tile field fade to opacity 0 (600ms ease), then become hidden so the tiles can't be hovered.
- The page background fades from `--ink` to `--paper` and the text from white to black (600ms ease), across the whole page.

Scrolling back above that point reverses both. The switch is triggered at the threshold, not scrubbed with the scroll position.

**No blank white screen (all devices).** The page turns white at exactly the scroll position where the intro paragraph reaches the centre of the screen and is pinned there (85% desktop, 45% mobile), so there is no in-between blank screen at any scroll position. There is no forced auto-scroll: scrolling stays fully under the visitor's control in both directions.

**Intro paragraph reveal.** When the page has passed the dark-to-light switch (85% desktop, 45% mobile) *and* the hero has finished fading out (600ms later):
- The paragraph fades in **line by line**, top line first. Each line: opacity 0 → 1, 600ms ease, each line starting 150ms after the previous one **(provisional timing)**.
- Lines are the visual lines as wrapped on screen; they are recalculated when the window is resized or the web font loads.
- **Scroll pause:** from the moment the reveal starts until the last line has fully appeared, scrolling is paused (mouse wheel, trackpad, touch swipes and scroll keys are blocked). Total pause = remaining hero fade + 600ms + 150ms × (lines − 1), about 1.2–1.8s. The pause only happens while the paragraph is pinned on screen, so reloading further down the page never locks it.
- The paragraph stays pinned in the centre of the screen while the visitor scrolls one more screen, then scrolls away to reveal "What I do".
- Scrolling back above the switch hides the paragraph again (all lines together, 300ms), ready to replay.
- Reduced motion: the paragraph appears at once, without fading, and scrolling is never paused.

## Service cards (What I do)

Reference: the services cards on serious.business.
- The deck is a **stage pinned to the screen** while the page scrolls through a tall track (built with a sticky stage; cards are moved by main.js).
- **Arrival (closed deck):** as the visitor scrolls down to "What I do", the image sequence area comes in first. **Desktop:** the service titles are hidden below the screen until the deck pins, then rise into a stack at the foot of the screen as the visitor scrolls on (an extra 4 title strips of scrolling). **Mobile:** all four titles arrive already stacked at the bottom of the screen. No blank card ever slides in.
- **Strategy opens first:** once the stage pins, scrolling on moves **Strategy** up from the bottom stack to its mark at the top (1:1 with the scroll, with momentum).
- **Each step:** after Strategy reaches its mark, and after each later card, there is a **pause of 60% of a screen height** of scrolling; then the next card lifts off the bottom stack and travels up to just below the previous card's title. The bottom stack loses a title and the top stack gains one.
- **Momentum:** cards don't follow the scroll position exactly. Each glides towards where the scroll says it should be, covering 5% of the remaining distance per 60fps frame (frame-rate independent), so it eases to a clearly visible stop (about 1.5s to settle after a big jump). Wheel notches and flicks feel smooth and weighty. On page load or reload mid-deck, cards start in place with no glide. Reduced motion: no glide.
- **Reveal:** titles are always visible. A card counts as at its mark when its *displayed* position gets there, so the reveal waits for the glide. When a card reaches its mark, its **description rises 0.4em and fades in** (opacity 500ms ease, movement 700ms out-expo), then its **image fades in while settling from 115% to 100%** (opacity 600ms, scale 1000ms out-expo, both starting 200ms later). Scrolling back before the mark hides them again (250ms), ready to replay.
- **The end:** when Measurement reaches its mark it holds still for **120% of a screen height**. The **next section ("How it works") then slides up over Measurement, stopping just below Measurement's title**; the stage then unpins and everything scrolls on together.
- The header adapts while over the cards (see DESIGN.md, Header contrast).
- Same on all devices. Reduced motion: the text and image appear without animating (the cards still move with the scroll, as that is the layout).

## Image sequence (above the service deck)

- A scroll-driven image sequence sits in the white space above the closed service deck: frames that play like a video as the page scrolls (placeholder frames for now; real PNG frames of the art director to come).
- **Plays (desktop):** once "What I do" pins at the top, **all four frames play before any section appears**: frame 1 first, then frames 2, 3 and 4 one per quarter screen-height of scrolling, and frame 4 holds for one more quarter. Only then do the section titles rise up from the bottom over the image. Frames follow the deck's momentum and play in reverse when scrolling up.
- **Plays (mobile):** the titles are already in their stack as the deck arrives. **Frame 1** shows until Strategy starts moving; the remaining frames play in equal steps as Strategy travels to its mark.
- Shares Strategy's **momentum** (frames follow Strategy's displayed position, not the raw scroll).
- **Fixed box:** the box never moves or changes size; the sections slide up over it. Only one frame shows at a time.
- Strategy (and the cards after it) are drawn above it, so Strategy slides up over it.

## Page load

- **Refresh always returns to the top of the page** (the browser's scroll restoration is turned off and the page jumps to the top instantly on load).
- The intro paragraph re-fits whenever the window size changes on mouse/trackpad screens (width or height), and whenever it would no longer fit. On touch screens only width changes re-fit it, so toolbars sliding in and out do not replay the fade.

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
