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
| Header, intro paragraph | `opacity` | `0` → `1` | 1000 | 1900 | ease |
| Hero underline | `scaleX` | `0` → `1` (from left) | 1500 | 2000 | in-out-quart |
| Intro layer | `display` | → `none` | — | 2200 | — |

Hero lines sit inside `overflow: hidden` masks so they rise out of an invisible slot.

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

No scroll-triggered animations in the first version **(provisional)**. The intro is the single motion moment. Scroll effects can be added once the art director supplies references.

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
- The page-transition cover is skipped; links navigate immediately.
- Smooth scrolling is off.
- Hover colour changes remain (they are not motion).

If JavaScript fails to load, the intro layer must not trap the page: it is hidden by default and only shown when JavaScript adds a `js` class to `<html>`.
