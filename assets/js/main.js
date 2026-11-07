// Made to Count — interactions. Spec: docs/INTERACTIONS.md
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Refreshing always returns to the top of the page: stop the browser restoring the old scroll
  // position (it would do so once the page has loaded), and go to the top now and on load.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  // 'instant': the page uses smooth scrolling, which would otherwise animate this
  var toTop = function () { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  toTop();
  window.addEventListener('load', toTop);

  // The intro phrase (easter egg) is picked by a small script next to it in index.html.

  // Remove the intro layer once its sequence has finished (2200ms).
  var intro = document.querySelector('.intro');
  if (intro) {
    window.setTimeout(function () { intro.remove(); }, reduced ? 0 : 2200);
  }

  // Theme switch: once the page has scrolled 85% of the hero (screen) height (45% on mobile),
  // the hero fades out and the page turns white with black text. Reverses on the way back up.
  // Intro paragraph: pinned in the centre of the screen from that same point. It fades in
  // line by line once the hero has finished fading out (600ms after the theme switch).
  // While the lines appear, scrolling is paused; it resumes when the last line is in.
  var heroForTheme = document.querySelector('.hero');
  var introCopy = document.querySelector('.intro-copy');
  var introPara = document.querySelector('.hero__intro');
  var HERO_FADE = 600;
  // Scroll point (share of the hero height) where the page turns white and the paragraph is
  // centred. Earlier on mobile, where the tiles have scrolled past by about halfway.
  // Must match .intro-copy's margin-top in styles.css (-15vh desktop, -55vh mobile).
  var switchQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  // Where the page turns white, as a share of the hero's height: the moment the headline's top
  // reaches the top of the screen (it scrolls at 60% of the page's speed), or 85% (desktop) /
  // 45% (mobile) if that comes first. The paragraph section is pulled up to start at exactly
  // that point (below), so the next section is there as the page turns white.
  var switchFrac = null;
  function switchAt() { return switchFrac !== null ? switchFrac : (switchQuery.matches ? 0.85 : 0.45); }
  function computeSwitch() {
    var heroEl = document.querySelector('.hero'), titleEl = document.querySelector('.hero__title');
    var section = document.querySelector('.intro-copy');
    var fallback = switchQuery.matches ? 0.85 : 0.45;
    if (!heroEl || !titleEl || !section || !root.classList.contains('js')) { switchFrac = null; return; }
    var h = heroEl.offsetHeight;
    if (!(h > 0)) { switchFrac = null; return; }
    if (switchQuery.matches) {
      switchFrac = fadeRange().end / h; // desktop: the paragraph arrives as the fade to white ends
    } else {
      var touch = titleEl.offsetTop / (1 - 0.4) / h; // 0.4 = the headline's scroll lag (TITLE_LAG)
      switchFrac = Math.min(fallback, Math.max(touch, 0.2));
    }
    section.style.marginTop = (-(1 - switchFrac) * h).toFixed(1) + 'px';
  }
  // Desktop: scrolling on from the hero fades it to white, following the scroll exactly. It
  // starts when the top of the headline is 15% of the screen height from the top and is finished
  // when its first line ("Everything") is half way off the top. Over that stretch the background goes from dark brown to white,
  // the tiles fade out from the bottom up, the headline and the top gradient fade out, and the
  // wordmark turns black half way (.is-light). The paragraph then blurs in as before.
  var FADE_START = 0.15, TITLE_SPEED = 0.6; // start: headline top 15% of the screen height down; it scrolls at 60% of page speed
  var DARK = [0x1b, 0x18, 0x15], LIGHT = [0xff, 0xff, 0xff]; // --hero-bg and --paper
  function fadeRange() {
    var t = document.querySelector('.hero__title');
    if (!t) return { start: 0, end: 1 };
    var line1 = t.querySelector('.line');
    var start = Math.max((t.offsetTop - FADE_START * window.innerHeight) / TITLE_SPEED, 0);
    var mid1 = line1 ? line1.offsetTop + line1.offsetHeight / 2 : t.offsetHeight / 6; // middle of line 1
    var end = (t.offsetTop + mid1) / TITLE_SPEED;
    return { start: start, end: Math.max(end, start + 1) };
  }
  function heroFadeAt(y) {
    var r = fadeRange();
    return Math.min(Math.max((y - r.start) / (r.end - r.start), 0), 1);
  }
  function fadeBackground(p) {
    if (p <= 0 || p >= 1) { root.style.removeProperty('--bg'); return; } // dark / .is-light white
    var c = DARK.map(function (d, i) { return Math.round(d + (LIGHT[i] - d) * p); });
    root.style.setProperty('--bg', 'rgb(' + c.join(',') + ')');
  }

  // .is-mobile on <html>: phones and tablets (anything without the desktop mouse layout).
  // Used by CSS for mobile-only styling.
  function setMobileClass() { root.classList.toggle('is-mobile', !switchQuery.matches); }
  setMobileClass();
  if (switchQuery.addEventListener) switchQuery.addEventListener('change', setMobileClass);
  var LINE_STAGGER = 200;  // each paragraph line starts this long after the one above
  var LINE_FOCUS = 900;    // and is fully in focus this long after it starts
  var MAX_HEIGHT = 0.75; // paragraph never taller than 75% of the screen
  var lightSince = 0;
  var revealTimer = null;
  var lineCount = 0;

  // Wrap each visual line of the paragraph in its own span so lines can fade in turn.
  var introText = introPara ? introPara.textContent.trim().replace(/\s+/g, ' ')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  var lastLayoutKey = '';
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function layoutIntro(force) {
    if (!introPara) return;
    // Touch screens: width only, because mobile browsers change the height while scrolling
    // (toolbars) and re-laying out then would replay the fade. Mouse screens: width and height,
    // so a window that gets shorter re-fits the text. Either way, re-fit if it no longer fits.
    var key = finePointer.matches ? window.innerWidth + 'x' + window.innerHeight : String(window.innerWidth);
    var overflowing = introPara.offsetHeight > window.innerHeight * 0.9;
    if (!force && !overflowing && key === lastLayoutKey) return;
    lastLayoutKey = key;
    var words = introText.split(' ');

    // 1. Size.
    introPara.style.fontSize = '';
    introPara.innerHTML = words.map(function (w) { return '<span class="intro-word">' + w + '</span>'; }).join(' ');
    var size;
    if (!switchQuery.matches) {
      // Mobile: as large as possible inside a box 80vw wide (CSS) and 60% of the screen tall,
      // i.e. 20vh clear above and below, 10vw either side. Binary search on the font size.
      var boxH = window.innerHeight * 0.6;
      var lo = 12, hi = 120;
      for (var it = 0; it < 18; it++) {
        var mid = (lo + hi) / 2;
        introPara.style.fontSize = mid + 'px';
        var fits = introPara.offsetHeight <= boxH && introPara.scrollWidth <= introPara.clientWidth + 1;
        if (fits) lo = mid; else hi = mid;
      }
      size = lo;
      introPara.style.fontSize = size + 'px';
    } else {
      // Desktop: start from the CSS size and shrink until it fits on screen.
      size = parseFloat(getComputedStyle(introPara).fontSize);
      var limit = window.innerHeight * MAX_HEIGHT;
      var guard = 0;
      while (introPara.offsetHeight > limit && size > 12 && guard++ < 40) {
        size *= 0.95;
        introPara.style.fontSize = size + 'px';
      }
    }

    // 2. Lines: group words by the line they wrapped onto.
    var lines = [];
    var lastTop = null;
    Array.prototype.forEach.call(introPara.querySelectorAll('.intro-word'), function (el, i) {
      var top = el.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(words[i]);
    });
    lineCount = lines.length;
    introPara.innerHTML = lines.map(function (line, i) {
      return '<span class="intro-line" style="--l:' + i + '">' + line.join(' ') + '</span>';
    }).join(' ');
    root.classList.add('intro-split');
  }

  // Scroll pause while the lines appear.
  var lockTimer = null;
  var SCROLL_KEYS = { ' ': 1, PageDown: 1, PageUp: 1, ArrowDown: 1, ArrowUp: 1, Home: 1, End: 1 };
  function isLocked() { return root.classList.contains('scroll-locked'); }
  function lockScroll(ms) {
    root.classList.add('scroll-locked');
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(unlockScroll, ms);
  }
  function unlockScroll() {
    window.clearTimeout(lockTimer);
    root.classList.remove('scroll-locked');
  }
  function blockScroll(e) { if (isLocked()) e.preventDefault(); }
  window.addEventListener('wheel', blockScroll, { passive: false });
  window.addEventListener('touchmove', blockScroll, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (isLocked() && SCROLL_KEYS[e.key] && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) e.preventDefault();
  });

  function pinnedNow(y) {
    // True while the paragraph's pinned stretch is on screen.
    if (!introCopy) return false;
    var top = introCopy.getBoundingClientRect().top + y;
    return y >= top - 2 && y <= top + introCopy.offsetHeight - window.innerHeight;
  }

  if (heroForTheme) {
    var updateTheme = function () {
      var y = window.scrollY;
      var h = heroForTheme.offsetHeight;
      var desktop = switchQuery.matches;

      // Desktop: the fade follows the scroll; the wordmark turns black half way and the paragraph
      // comes in once it is fully white. Mobile: the page turns white (see switchAt) at the same
      // moment the paragraph reaches the centre of the screen, so there is never a blank screen.
      var p = desktop ? heroFadeAt(Math.max(y, 0)) : 0;
      fadeBackground(p);
      var light = desktop ? p >= 0.5 : y > h * switchAt();
      if (light && !root.classList.contains('is-light')) lightSince = performance.now();
      root.classList.toggle('is-light', light);

      var wantIntro = desktop ? p >= 1 : light;
      if (wantIntro) {
        if (!root.classList.contains('intro-in') && !revealTimer) {
          var wait = reduced || desktop ? 0 : Math.max(0, HERO_FADE - (performance.now() - lightSince));
          if (!reduced && pinnedNow(y)) {
            lockScroll(wait + Math.max(lineCount - 1, 0) * LINE_STAGGER + LINE_FOCUS); // every line in focus
          }
          revealTimer = window.setTimeout(function () {
            revealTimer = null;
            root.classList.add('intro-in');
          }, wait);
        }
      } else {
        if (revealTimer) { window.clearTimeout(revealTimer); revealTimer = null; }
        root.classList.remove('intro-in');
        unlockScroll();
      }
    };
    window.addEventListener('scroll', updateTheme, { passive: true });
    window.addEventListener('resize', function () { layoutIntro(); computeSwitch(); updateTheme(); });
    layoutIntro(true);
    computeSwitch();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { computeSwitch(); updateTheme(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { layoutIntro(true); });
    }
    updateTheme();
  }

  // Hero tile field (spec: docs/INTERACTIONS.md, "Hero tile field").
  // Every tile floats on its own slow loop. On desktop the whole field is also
  // steered by the mouse; on mobile it drifts upward as the page scrolls.
  var hero = document.querySelector('.hero');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  tiles.forEach(function (tile, i) { tile.style.setProperty('--i', i); });
  var desktopQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

  // New layout on every visit (refresh, or coming back from another page), keeping the designed
  // density and spread: each tile starts from one of the original positions (from index.html),
  // the whole layout may be mirrored left-right and/or top-bottom, and every tile is nudged a
  // little at random. Images are shuffled each time.
  // Mobile and tablet: a random 9 of the tiles, 3x bigger, in the staggered column, likewise
  // mirrored and nudged.
  var MOBILE_SLOTS = [ // [left %, top %] of the tile field
    [-8, 2], [50, 8], [22, 20], [60, 30], [-4, 38], [40, 50], [-10, 62], [52, 68], [18, 82]
  ];
  // Desktop layout, new on every visit (spec: docs/INTERACTIONS.md, "Hero tile field").
  //  - The mouse pans the layer up to 58% of the screen width each way, up/down as well as left/right
  //    (corners: diagonally). The tile area reaches just far enough that, with the mouse pushed
  //    to an edge, the outermost tile stops 5% of the screen width short of it.
  //  - One outlier per side (left, right, top, bottom): it is closer to that edge than any other
  //    tile, and every other tile is at least 80% of a tile's width further in, so the outlier
  //    stands on its own and no row can form along an edge. Outliers are placed first, at a random
  //    point along their edge; then each other tile goes to a random free spot (of 3 tried, the
  //    roomiest), so the spacing is uneven and organic, never a grid. Images shuffled, never repeated.
  //  - Two tiles never overlap by more than 20% of a tile, at any moment: the gap planned between
  //    neighbours leaves room for the most they can float and pan towards each other.
  //  - With the mouse in the middle, tiles cover no more than 20% of the headline's words.
  //  - A tile that can't be placed within the rules is left out (a different few each visit).
  //  - Of 8 such layouts, the one leaving the smallest empty patch on screen (checked with the
  //    mouse at the centre, edges and corners) is used.
  var LAYOUT = { maxOverlap: 0.2, maxTitle: 0.2, spotsPerTile: 3, tries: 60, layouts: 8, sameHeight: 0.1,
    // One outlier per side; every other tile at least this share of a tile's width further in
    outlierLead: 0.8,
    // Planned spacing: neighbours overlap at most 5% (usually not at all), so there is dark
    // background between tiles; floating can never take that past the 20% limit.
    planOverlap: 0.05 };
  // (if no spot fits within 60 tries, keep looking - up to 3000 - rather than break the rules)
  var FLOAT_MAX_X = 8, FLOAT_MAX_Y = 6;   // px: the most a tile floats either way: gentle (see floats below)
  var TILE_VW = 21, TILE_H_VW = 21 * 850 / 600; // tile size in vw (portrait 600 x 850 images)
  var PAN = 0.58;        // the mouse pans the layer up to 58% of the screen width each way (room for all 20)
  var EDGE_SPACE = 0.05; // space left at the screen edge with the mouse pushed to it (share of width)
  var DEPTH_MIN = 1;     // the layout is planned for tiles panning the normal amount (see PARALLAX)
  // Movement: the tiles follow a very heavily smoothed version of the mouse - small wiggles and
  // changes of speed are ignored, so they drift towards the general area the mouse is in, in long,
  // slow, continuous curves, and never look like they are chasing it. Each tile then eases at a
  // slightly different pace. Every tile travels the same distance and never overshoots. Across
  // the middle of the screen the tiles follow at 40% of the full pan; the edge strips (EDGE_PULL)
  // go all the way.
  var PARALLAX = { min: 1, max: 1, easeMin: 100, easeMax: 150, follow: 0.4, smooth: 250, coast: 45 }; // slowest tile 1.5x the quickest; coast: see heldTile // follows about 0.5s behind the mouse, like wanda.net // 0.4 x 58% = about the same travel as before (0.7 x 33%)
  // When the mouse is within 200px of an edge (left, right, top or bottom), the tiles glide all
  // the way to their furthest position on that side (with the same momentum), so that side's
  // outlier shows in full without the mouse going right to the edge.
  var EDGE_PULL = 200;
  var EDGE_BLEND = 80;   // px over which the edge strip's pull fades in (no sudden push)
  var M_TILE_W = 54;     // mobile tile width, % of the field
  var mobileSet = [];
  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { // Fisher-Yates
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function screenSize() { // a page loaded at zero size (e.g. in a frame sized later): lay out for a laptop
    var vw = window.innerWidth, vh = window.innerHeight;
    return vw > 0 && vh > 0 ? { w: vw, h: vh } : { w: 1440, h: 900 };
  }
  // How far (px) the mouse pans the layer each way: the same distance across and up/down.
  function panFor(vw, vh) { return { x: vw * PAN, y: vw * PAN }; }

  // The headline's words, one box per line, in px from the screen's top-left (ignoring its intro scale).
  function headlineBoxes() {
    var title = document.querySelector('.hero__title');
    if (!title) return null;
    var tr = title.getBoundingClientRect(), k = tr.width ? title.offsetWidth / tr.width : 1;
    var cx = (tr.left + tr.right) / 2, cy = (tr.top + tr.bottom) / 2;
    var range = document.createRange(), boxes = [];
    Array.prototype.forEach.call(title.querySelectorAll('.line'), function (line) {
      range.selectNodeContents(line);
      var r = range.getBoundingClientRect();
      if (r.width) boxes.push({ l: cx + (r.left - cx) * k, r: cx + (r.right - cx) * k, t: cy + (r.top - cy) * k, b: cy + (r.bottom - cy) * k });
    });
    return boxes;
  }

  // Returns tile centres in px from the screen's top-left, for a vw x vh screen.
  function desktopLayout(vw, vh, moves) { // moves[n]: how far tile n floats and pans (x, y, depth)
    var u = vw / 100, tw = TILE_VW * u, th = TILE_H_VW * u, hw = tw / 2, hh = th / 2;
    var pan = panFor(vw, vh), space = EDGE_SPACE * vw;
    var ex = pan.x * DEPTH_MIN - space, ey = pan.y * DEPTH_MIN - space; // how far the area reaches past the screen
    var x0 = -ex + hw, x1 = vw + ex - hw, y0 = -ey + hh, y1 = vh + ey - hh; // whole tiles inside the area
    var limit = Math.min(LAYOUT.planOverlap, LAYOUT.maxOverlap) * tw * th;
    // Room to leave for movement between tiles n and i: the most they can float towards each
    // other, plus the most their different depths can pan them together.
    function gapX(n, i) { return moves[n].x + moves[i].x + Math.abs(moves[n].d - moves[i].d) * pan.x; }
    function gapY(n, i) { return moves[n].y + moves[i].y + Math.abs(moves[n].d - moves[i].d) * pan.y; }
    var lines = headlineBoxes(), titleLimit = 0;
    lines.forEach(function (b) { titleLimit += LAYOUT.maxTitle * (b.r - b.l) * (b.b - b.t); });
    function onTitle(c, n) { // area of the headline's words a tile can cover, allowing for its float
      var area = 0;
      lines.forEach(function (b) {
        var ox = Math.min(c[0] + hw + moves[n].x, b.r) - Math.max(c[0] - hw - moves[n].x, b.l);
        var oy = Math.min(c[1] + hh + moves[n].y, b.b) - Math.max(c[1] - hh - moves[n].y, b.t);
        if (ox > 0 && oy > 0) area += ox * oy;
      });
      return area;
    }
    function fits(c, cs, covered, n) {
      var on = onTitle(c, n);
      if (on > 0 && covered + on > titleLimit) return false;
      // Never more than 2 tiles settling at about the same height (no straight lines)
      var level = 0;
      for (var j = 0; j < cs.length; j++) if (Math.abs(c[1] - cs[j][1]) < LAYOUT.sameHeight * th && ++level >= 2) return false;
      for (var i = 0; i < cs.length; i++) {
        var ox = Math.min(tw, tw - Math.abs(c[0] - cs[i][0]) + gapX(n, i)), oy = Math.min(th, th - Math.abs(c[1] - cs[i][1]) + gapY(n, i));
        if (ox > 0 && oy > 0 && ox * oy > limit) return false;
      }
      return true;
    }
    function room(c, cs) { // squared distance to the nearest tile or the area's edge, in tile sizes
      var ex0 = (c[0] - x0) / tw + 0.5, ex1 = (x1 - c[0]) / tw + 0.5; // the edge counts as a neighbour,
      var ey0 = (c[1] - y0) / th + 0.5, ey1 = (y1 - c[1]) / th + 0.5; // so tiles aren't pushed against it
      var m = Math.min(ex0 * ex0, ex1 * ex1, ey0 * ey0, ey1 * ey1);
      for (var i = 0; i < cs.length; i++) {
        var dx = (c[0] - cs[i][0]) / tw, dy = (c[1] - cs[i][1]) / th;
        m = Math.min(m, dx * dx + dy * dy);
      }
      return m;
    }
    function oneLayout() { // as many tiles as can be placed within the rules
      var cs = [], covered = 0;
      // Outliers first: one hugging each side of the tile area, at a random point along it.
      var sides = ['left', 'right', 'top', 'bottom'], out = {}, lead = LAYOUT.outlierLead * tw, hug = 0.1 * tw;
      function spot(side) {
        if (side === 'left') return [rand(x0, x0 + hug), rand(y0, y1)];
        if (side === 'right') return [rand(x1 - hug, x1), rand(y0, y1)];
        if (side === 'top') return [rand(x0, x1), rand(y0, y0 + hug)];
        if (side === 'bottom') return [rand(x0, x1), rand(y1 - hug, y1)];
        return [rand(x0, x1), rand(y0, y1)];
      }
      // Is tile c at least `lead` further in than each other side's outlier placed so far? And, if
      // c is itself an outlier (own side), are the outliers already placed that far behind it?
      function behind(c, side, o) {
        if (side === 'left') return c[0] >= o[0] + lead;
        if (side === 'right') return c[0] <= o[0] - lead;
        if (side === 'top') return c[1] >= o[1] + lead;
        return c[1] <= o[1] - lead;
      }
      function leadOK(c, own) {
        for (var q = 0; q < sides.length; q++) {
          var sd = sides[q];
          if (sd !== own && out[sd] && !behind(c, sd, out[sd])) return false;
        }
        if (own) for (var v = 0; v < sides.length; v++) if (out[sides[v]] && sides[v] !== own && !behind(out[sides[v]], own, c)) return false;
        return true;
      }
      for (var n = 0; n < tiles.length; n++) {
        var best = null, bestRoom = -1, found = 0;
        var side = sides[n], spots = side ? 1 : LAYOUT.spotsPerTile;
        for (var k = 0; found < spots && (k < LAYOUT.tries || (!found && k < 3000)); k++) {
          var c = spot(side);
          if (!leadOK(c, side) || !fits(c, cs, covered, n)) continue;
          found++;
          var r = room(c, cs);
          if (r > bestRoom) { bestRoom = r; best = c; }
        }
        if (!best) { if (side) return []; break; } // a layout must have all 4 outliers
        if (side) { best.side = side; out[side] = best; }
        cs.push(best);
        covered += onTitle(best, n);
      }
      return cs;
    }
    function emptiest(cs) { // biggest empty patch on screen, with the mouse at 9 spots
      var worst = 0;
      for (var sx = -1; sx <= 1; sx++) {
        for (var sy = -1; sy <= 1; sy++) {
          for (var y = 0; y <= vh; y += vh / 12) {
            for (var x = 0; x <= vw; x += vw / 18) {
              var d = Infinity;
              for (var i = 0; i < cs.length && d > 0; i++) {
                var dx = Math.max(Math.abs(x - cs[i][0] - sx * ex) - hw, 0);
                var dy = Math.max(Math.abs(y - cs[i][1] - sy * ey) - hh, 0);
                d = Math.min(d, dx * dx + dy * dy);
              }
              if (d > worst) worst = d;
            }
          }
        }
      }
      return worst;
    }
    // Most tiles placed wins; among equals, the smallest empty patch.
    var best = [], bestEmpty = Infinity;
    for (var l = 0, full = 0; full < LAYOUT.layouts && l < LAYOUT.layouts * 4; l++) {
      var cs = oneLayout();
      if (cs.length === tiles.length) full++;
      if (cs.length < best.length) continue;
      var e = emptiest(cs);
      if (cs.length > best.length || e < bestEmpty) { bestEmpty = e; best = cs; }
    }
    return best;
  }

  // Entry (desktop): once the coloured intro bars have gone (2.2s), each tile fades in from 0% to
  // its resting 15% while growing from 20% to full size where it sits, easing gently to a stop
  // (styles.css). Each takes 1s; they start in a random order, spread over 1.5s. The headline
  // starts its blur-in once 60% of the tiles have fully appeared.
  var ENTRY = { start: 2200, spread: 1500, dur: 1000, titleAfter: 0.6 };
  var ENTRY_END = ENTRY.start + ENTRY.spread + ENTRY.dur;
  function randomiseTiles() {
    // Desktop field (styles.css): 25vw beyond the screen on every side, (150vw) x (screen + 50vw).
    var size = screenSize(), vw = size.w, vh = size.h;
    var u = vw / 100, fieldW = 150 * u, fieldH = vh + 50 * u;
    var order = shuffled(tiles);
    // Each tile's own float size and depth, decided here so the layout can leave room for them
    // (read by the float loop below).
    var moves = order.map(function (t) {
      t._floatX = rand(FLOAT_MAX_X / 2, FLOAT_MAX_X); t._floatY = rand(FLOAT_MAX_Y / 2, FLOAT_MAX_Y);
      return { x: t._floatX, y: t._floatY, d: 1 };
    });
    var centres = desktopLayout(vw, vh, moves);
    order.forEach(function (t, k) {
      t.classList.toggle('is-left-out', k >= centres.length); // no room within the rules
      if (k >= centres.length) return;
      var left = centres[k][0] - TILE_VW * u / 2, top = centres[k][1] - TILE_H_VW * u / 2;
      t.style.setProperty('--x', ((left + 25 * u) / fieldW * 100).toFixed(2) + '%');
      t.style.setProperty('--y', ((top + 25 * u) / fieldH * 100).toFixed(2) + '%');
      t._depth = centres[k].side ? 1 : rand(PARALLAX.min, PARALLAX.max); // parallax pan amount
      t._ease = rand(PARALLAX.easeMin, PARALLAX.easeMax);                  // ms: this tile's pace
      t.style.setProperty('--d', t._depth.toFixed(3));
    });
    // Entry order: random (the layout order is already shuffled), start times spread over 1.5s
    var shown = order.slice(0, centres.length), last = Math.max(shown.length - 1, 1);
    tiles.forEach(function (t) { t._popEnd = 0; });
    shown.forEach(function (t, k) {
      var delay = Math.round(ENTRY.start + ENTRY.spread * k / last);
      t.style.setProperty('--pop-delay', delay + 'ms');
      t._popEnd = delay + ENTRY.dur; // ms after page load: until then the tile stays still (frame loop)
    });
    // Headline: once 60% of the tiles have fully appeared
    var nth = Math.max(Math.ceil(shown.length * ENTRY.titleAfter) - 1, 0);
    root.style.setProperty('--title-delay', Math.round(ENTRY.start + ENTRY.spread * nth / last + ENTRY.dur) + 'ms');
    // Mobile and tablet: a random 9 in the staggered column, the column maybe mirrored, each nudged.
    var mFlip = Math.random() < 0.5;
    mobileSet = shuffled(tiles).slice(0, MOBILE_SLOTS.length);
    mobileSet.forEach(function (t, k) {
      var mx = MOBILE_SLOTS[k][0];
      if (mFlip) mx = 100 - M_TILE_W - mx;
      t.style.setProperty('--mx', (mx + rand(-4, 4)).toFixed(1) + '%');
      t.style.setProperty('--my', (MOBILE_SLOTS[k][1] + rand(-2, 2)).toFixed(1) + '%');
    });
  }
  if (tiles.length) randomiseTiles();
  function applyTileLayout() {
    var mobile = !desktopQuery.matches;
    root.classList.toggle('tiles-mobile', mobile);
    tiles.forEach(function (t) {
      var k = mobileSet.indexOf(t);
      t.classList.toggle('is-unused', mobile && k === -1);
      if (k !== -1 && mobile) t.style.setProperty('--i', k); // fade in by slot order
    });
  }
  if (tiles.length) {
    applyTileLayout();
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', applyTileLayout);
  }
  // Coming back with the browser's back button can restore this page from memory without
  // reloading it; give it a new headline and tile layout then too.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    if (tiles.length) { randomiseTiles(); applyTileLayout(); }
  });

  if (hero && tiles.length && !reduced) {

    // Seeded random so each tile's float is different but the same on every visit.
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function between(a, b) { return a + (b - a) * rand(); }

    // Desktop: all tiles scroll up at the same speed (1.2x the page), so scrolling never slides
    // one tile over another (the 20% overlap rule holds while scrolling too). Phone: own speeds.
    var DESKTOP_SCROLL = 0.2;
    var floats = tiles.map(function (t) {
      var period = between(8000, 14000); // ms for one loop on the x axis
      return {
        depth: parseFloat(t.style.getPropertyValue('--d')) || 1,
        ease: t._ease || 250,         // time constant of each of the two easing stages (ms)
        a: { x: 0, y: 0 }, b: { x: 0, y: 0 },
        hold: null, zone: null, amp: 1, // while hovered: its resting spot, hover zone, float strength
        returning: false,             // gliding back into place after being hovered (can't re-hover yet)
        ax: t._floatX || between(FLOAT_MAX_X / 2, FLOAT_MAX_X), // px of sideways float (set with the layout)
        ay: t._floatY || between(FLOAT_MAX_Y / 2, FLOAT_MAX_Y), // px of vertical float
        wx: (Math.PI * 2) / period,
        wy: (Math.PI * 2) / (period * between(1.2, 1.5)),
        px: between(0, Math.PI * 2),  // phase, so tiles are out of step
        py: between(0, Math.PI * 2),
        // Scroll parallax: extra speed relative to the page. -0.15 = a little slower than the
        // page, 0.6 = 1.6x as fast. Each tile gets its own, so they scroll at different speeds.
        speed: between(-0.15, 0.6)
      };
    });
    // Hand the scroll speeds out by height: the lower a tile starts, the SLOWER it scrolls, so the
    // tiles waiting below the screen linger and keep the bottom of the screen filled until the page
    // turns white, while the higher ones move off first. (Same speeds as before, 0.85x to 1.6x the
    // page, just shared out by position; the bottom tiles move as a group, so none is left alone.)
    function assignSpeeds() {
      var speeds = floats.map(function (f) { return f.speed; }).sort(function (a, b) { return a - b; });
      var mobile = !desktopQuery.matches;
      var byHeight = tiles.slice().sort(function (a, b) {
        var ya = parseFloat(a.style.getPropertyValue(mobile ? '--my' : '--y')) || 0;
        var yb = parseFloat(b.style.getPropertyValue(mobile ? '--my' : '--y')) || 0;
        return ya - yb;
      });
      byHeight.forEach(function (t, i) { floats[tiles.indexOf(t)].speed = speeds[speeds.length - 1 - i]; });
    }
    assignSpeeds();
    window.addEventListener('pageshow', function (e) { if (e.persisted) assignSpeeds(); });
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', assignSpeeds);

    var target = { x: 0, y: 0 };   // where the mouse wants the field (desktop)
    var visible = true;
    var running = false;

    // The hovered tile is tracked here rather than with CSS :hover, because tiles drift under a
    // resting pointer (see updateHoverTile).
    root.classList.add('tiles-js');
    var tilesEl = document.querySelector('.tiles');
    // Wrappers faded bottom-up by updateHeroFade
    var tiltEls = tiles.map(function (t) { return t.querySelector('.tile__tilt'); });
    var mouse = { x: 0, y: 0, inside: false };

    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; mouse.movedAt = performance.now(); }, { passive: true });
    var MOVED_RECENTLY = 120; // ms: a tile only becomes hovered when the mouse moves onto it
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse.inside = false; });

    function keepZone(tile, i) {
      // Where the tile sits now, plus (while hovered) where it was when the hover began.
      var r = tile.getBoundingClientRect();
      var z = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      var hz = floats[i] && floats[i].zone;
      if (hz) { // a hovered tile easing to a stop (or into view) keeps its hover while it moves
        z = { left: Math.min(z.left, hz.left), right: Math.max(z.right, hz.right), top: Math.min(z.top, hz.top), bottom: Math.max(z.bottom, hz.bottom) };
      }
      return z;
    }
    var hoverTile = null;     // tile under the pointer (tracked here: tiles move under a still pointer)
    function updateHoverTile() {
      // Hover, tracked every frame because tiles drift under a resting pointer.
      var hov = null;
      // No hovering until the tiles have finished appearing (it would set the layer moving mid-entry)
      var entered = performance.now() - startTime > ENTRY_END;
      if (entered && desktopQuery.matches && mouse.inside && !root.classList.contains('is-light')) {
        if (hoverTile) { // stays hovered only while the pointer is actually over it
          var hz = keepZone(hoverTile, tiles.indexOf(hoverTile));
          if (mouse.x >= hz.left && mouse.x <= hz.right && mouse.y >= hz.top && mouse.y <= hz.bottom) hov = hoverTile;
        }
        // A new hover only when the mouse itself moves onto a tile (not when a tile slides under a
        // still pointer), and never for a tile still gliding back into place after being hovered
        // - otherwise a tile can flip between hovered and not as it slides under the pointer.
        if (!hov && performance.now() - (mouse.movedAt || 0) < MOVED_RECENTLY) {
          var under = document.elementFromPoint(mouse.x, mouse.y);
          hov = under && under.closest ? under.closest('.tile') : null;
          if (hov && floats[tiles.indexOf(hov)].returning) hov = null;
        }
      }
      if (hov !== hoverTile) {
        if (hoverTile) hoverTile.classList.remove('is-hover');
        if (hov) hov.classList.add('is-hover');
        hoverTile = hov;
        tilesEl.classList.toggle('has-hover', !!hov);
      }
    }

    var startTime = performance.now();
    var lastTime = startTime;
    var FLOAT_START = 1800;        // tiles start fading in here
    var FLOAT_RAMP = 1500;         // float grows in over this long

    // Steering target from the cursor.
    var steer = { x: 0, y: 0 };
    // Hovering: only the tile under the mouse changes. It eases smoothly to a stop and holds still
    // (its gentle float fades out too); if it would be cut off by the screen edge, it glides softly
    // fully into view, 5% from the edges. The other tiles stop following the mouse: they finish
    // their current glide and come to rest (and blur, styles.css). When the mouse moves off,
    // everything follows the mouse again and the tile glides back into its place.
    var HOLD = { ease: 220, float: 300 }; // ms: the held tile's easing stages; its float fading
    var heldTile = null, coast = { x: 0, y: 0 };
    function holdTile(i) { // where tile i should come to rest: just ahead of where it is heading now
      var f = floats[i], el = tiles[i], r = el.getBoundingClientRect();
      var w = window.innerWidth, h = window.innerHeight, m = EDGE_SPACE * w + FLOAT_MAX_X;
      var hx = f.a.x, hy = f.a.y;                                   // its glide's next step: a soft stop
      var left = r.left + (hx - f.b.x), top = r.top + (hy - f.b.y); // where that would leave it
      hx += left < m ? m - left : (left + r.width > w - m ? (w - m) - (left + r.width) : 0);
      hy += top < m ? m - top : (top + r.height > h - m ? (h - m) - (top + r.height) : 0);
      f.hold = { x: hx, y: hy };
      f.zone = { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; // see keepZone
    }
    function onMouseMove(e) {
      if (!desktopQuery.matches) return;
      // The tile layer pans opposite to the mouse, far enough each way (panFor) that the tiles
      // at the edges of the tile area come fully into view.
      var size = screenSize(), pan = panFor(size.w, size.h);
      steer.x = (0.5 - e.clientX / size.w) * 2 * pan.x * PARALLAX.follow;
      steer.y = (0.5 - e.clientY / size.h) * 2 * pan.y * PARALLAX.follow;
      // Edge strips: within 200px of an edge the tiles go all the way to that side; the pull
      // fades in over the 80px before the strip, so crossing into it never gives a sudden push.
      function pull(d) { return Math.min(Math.max((EDGE_PULL + EDGE_BLEND - d) / EDGE_BLEND, 0), 1); }
      var wl = pull(e.clientX), wr = pull(size.w - e.clientX), wt = pull(e.clientY), wb = pull(size.h - e.clientY);
      steer.x += (pan.x - steer.x) * wl + (-pan.x - steer.x) * wr * (1 - wl);
      steer.y += (pan.y - steer.y) * wt + (-pan.y - steer.y) * wb * (1 - wt);
    }
    // Scroll parallax for the headline: it moves down by this share of the scroll, so it
    // travels at 60% of the page's speed and the tiles slide past it.
    var TITLE_LAG = 0.4;
    var heroTitle = document.querySelector('.hero__title');
    function scrollAmount() { return Math.max(window.scrollY, 0); }

    // Phone and tablet: no long-press menus or link previews on tiles, and a tap on a tile does nothing
    tilesEl.addEventListener('contextmenu', function (e) { if (!desktopQuery.matches) e.preventDefault(); });
    document.addEventListener('click', function (e) {
      if (desktopQuery.matches) return;
      if (e.target.closest && e.target.closest('.tile')) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    function onModeChange() {
      if (!desktopQuery.matches) target.x = target.y = 0;
      updateHeroFade(); // clears the desktop fade when switching to the phone layout
    }

    function frame(now) {
      var dt = Math.min(Math.max(now - lastTime, 0), 50);
      lastTime = now;
      var desktop = desktopQuery.matches;

      var scrolled = scrollAmount();
      if (heroTitle) heroTitle.style.transform = 'translate3d(0,' + (scrolled * TITLE_LAG).toFixed(2) + 'px,0)';

      var t = now - startTime;
      var ramp = Math.min(Math.max((t - FLOAT_START) / FLOAT_RAMP, 0), 1);
      ramp = ramp * ramp * (3 - 2 * ramp); // ease in and out

      updateHoverTile();
      if (desktop) {
        if (hoverTile !== heldTile) { // the hovered tile changed: release the old, hold the new
          if (heldTile) { var of = floats[tiles.indexOf(heldTile)]; of.hold = null; of.zone = null; of.returning = true; }
          heldTile = hoverTile;
          if (heldTile) holdTile(tiles.indexOf(heldTile));
        }
        // While a tile is hovered the others stop taking direction from the mouse: they finish
        // their current glide and come to rest. Once the mouse moves off, they follow it again.
        // (They coast on in the direction they were going, about twice as far as stopping dead.)
        var px0 = target.x, py0 = target.y;
        if (!heldTile) {
          var kt = 1 - Math.exp(-dt / PARALLAX.smooth);
          target.x += (steer.x - target.x) * kt;
          target.y += (steer.y - target.y) * kt;
        } else {
          var kc = Math.exp(-dt / PARALLAX.coast);
          coast.x *= kc; coast.y *= kc;
          target.x += coast.x * dt; target.y += coast.y * dt;
        }
        if (!heldTile && dt > 0) { coast.x = (target.x - px0) / dt; coast.y = (target.y - py0) / dt; } // px/ms, kept for coasting
      }

      for (var i = 0; i < tiles.length; i++) {
        var f = floats[i];
        var gx = 0, gy = 0; // no steering on touch screens; scroll parallax below moves the tiles
        // While a tile is growing in (its 1s entry) it stays exactly where it is, whatever the mouse
        // does, so it never looks like it is flying in. Once in, it glides to join the others.
        var appearing = now < (tiles[i]._popEnd || 0);
        if (desktop && appearing) { gx = f.b.x; gy = f.b.y; }
        else if (desktop) { // each tile glides towards its own share of the mouse pan, at its own pace
          // two stages in a row: eases in, then glides to rest. The hovered tile heads for its
          // resting spot (f.hold) instead of the mouse.
          var goal = f.hold || { x: target.x * f.depth, y: target.y * f.depth };
          var ke = 1 - Math.exp(-dt / (f.hold ? HOLD.ease : f.ease));
          f.a.x += (goal.x - f.a.x) * ke; f.a.y += (goal.y - f.a.y) * ke;
          f.b.x += (f.a.x - f.b.x) * ke; f.b.y += (f.a.y - f.b.y) * ke;
          gx = f.b.x; gy = f.b.y;
          // back in place after being hovered: it can be hovered again
          if (f.returning && Math.abs(goal.x - f.b.x) < 2 && Math.abs(goal.y - f.b.y) < 2) f.returning = false;
        }
        f.amp += ((desktop && f.hold ? 0 : 1) - f.amp) * (1 - Math.exp(-dt / HOLD.float)); // float fades out while held
        var x = gx + Math.sin(t * f.wx + f.px) * f.ax * ramp * f.amp;
        var y = gy + Math.sin(t * f.wy + f.py) * f.ay * ramp * f.amp - scrolled * (desktop ? DESKTOP_SCROLL : f.speed);
        tiles[i].style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      }

      // Phone and tablet only: tiles mostly behind the headline fade while it is sharp. On desktop
      // all tiles rest at 15% and hovering never dims the headline; a hovered tile simply comes
      // in front of it (styles.css).
      markTilesBehind(!desktop && !root.classList.contains('is-light'));
      if (desktop) updateHeroFade();

      if (visible) { window.requestAnimationFrame(frame); } else { running = false; }
    }
    // Desktop fade to white (see heroFadeAt): the tiles fade out in a wave from the bottom of the
    // screen up (bottom tiles start straight away, top tiles half way through), the headline and
    // the top gradient fade out with them.
    var fadeShown = false;
    function updateHeroFade() {
      var p = desktopQuery.matches ? heroFadeAt(scrollAmount()) : 0;
      hero.style.setProperty('--hero-fade', p.toFixed(3));
      if (heroTitle) heroTitle.style.opacity = p > 0 ? (1 - p).toFixed(3) : '';
      if (p <= 0 && !fadeShown) return;
      fadeShown = p > 0;
      var vh = window.innerHeight;
      for (var i = 0; i < tiles.length; i++) {
        if (p <= 0) { tiltEls[i].style.opacity = ''; continue; }
        var r = tiles[i].getBoundingClientRect();
        var low = Math.min(Math.max((r.top + r.bottom) / 2 / vh, 0), 1); // 1 = bottom of the screen
        var f = Math.min(Math.max((p - (1 - low) * 0.5) / 0.5, 0), 1);
        tiltEls[i].style.opacity = (1 - f).toFixed(3);
      }
      tilesEl.style.visibility = p >= 1 ? 'hidden' : '';
    }
    window.addEventListener('scroll', updateHeroFade, { passive: true });

    // The area covered by the headline's words (each line measured around its text, not the
    // full line width), as one box.
    var lineRange = document.createRange();
    function titleTextBox() {
      var box = null;
      // Looked up each time, in case the headline markup changes
      var titleLines = heroTitle ? heroTitle.querySelectorAll('.line') : [];
      for (var i = 0; i < titleLines.length; i++) {
        lineRange.selectNodeContents(titleLines[i]);
        var r = lineRange.getBoundingClientRect();
        if (!r.width) continue;
        if (!box) box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        else {
          box.left = Math.min(box.left, r.left); box.right = Math.max(box.right, r.right);
          box.top = Math.min(box.top, r.top); box.bottom = Math.max(box.bottom, r.bottom);
        }
      }
      return box;
    }
    var BEHIND_IN = 0.5, BEHIND_OUT = 0.45; // share of the tile behind the words (a little
                                            // hysteresis so a tile on the edge doesn't flicker)
    function markTilesBehind(on) {
      var box = on ? titleTextBox() : null;
      for (var i = 0; i < tiles.length; i++) {
        var behind = false;
        if (box) {
          var r = tiles[i].getBoundingClientRect();
          var ow = Math.min(r.right, box.right) - Math.max(r.left, box.left);
          var oh = Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top);
          var share = ow > 0 && oh > 0 ? (ow * oh) / (r.width * r.height) : 0;
          behind = share >= (tiles[i].classList.contains('is-behind') ? BEHIND_OUT : BEHIND_IN);
        }
        tiles[i].classList.toggle('is-behind', behind);
      }
    }
    function start() {
      if (running || !visible) return;
      running = true;
      lastTime = performance.now();
      window.requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(hero);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onModeChange);
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onModeChange);
    onModeChange();
    start();
  }

  // Service card deck (spec: docs/INTERACTIONS.md, "Service cards").
  // The stage (.services__list) is pinned while the page scrolls through .services__track.
  // All four cards start closed in a stack of titles at the bottom. Strategy travels up to the
  // top first; after a pause, each card in turn travels up to just below the previous title.
  // Momentum: cards don't follow the scroll position exactly; each glides towards it and eases
  // to a stop, so wheel notches and flicks feel smooth and weighty.
  // A card's text and image reveal (.is-titled) once it actually reaches its mark.
  var deckTrack = document.querySelector('.services__track');
  var deckStage = document.querySelector('.services__list');
  var deckCards = Array.prototype.slice.call(document.querySelectorAll('.service'));
  if (deckTrack && deckStage && deckCards.length) {
    var HEADER_H = 80;
    var PAUSE = 0.6;          // share of the screen height each card holds still
    var GLIDE = 0.05;         // share of the remaining distance covered per 60fps frame
    var deckShown = deckCards.map(function () { return 0; });   // displayed progress per card
    // Image sequence above the closed deck: frame 1 shows while the deck arrives (until the stage
    // pins); the remaining frames then play as Strategy travels up to its mark, so they share
    // Strategy's momentum.
    var seq = document.querySelector('.sequence');
    var seqFrames = seq ? Array.prototype.slice.call(seq.querySelectorAll('.sequence__frame')) : [];
    var seqCurrent = -1;
    var riseShown = 1;        // displayed rise of the title stack (0 = below the screen, 1 = in place)
    var imgShown = 1;         // displayed progress through the desktop image phase (0..1)
    var IMG_STEP = 0.25;      // share of the screen height scrolled per image frame (desktop)
    var deckRunning = false;
    var deckLast = 0;

    var deckTargets = function () {
      var S = deckStage.clientHeight;
      var H = deckCards[0].querySelector('.service__inner').offsetHeight; // content height
      var band = (S - HEADER_H - H) / 3;
      var move = H - band;                     // bottom-stack slot to top-stack slot
      var pause = S * PAUSE;
      var stageTop = deckTrack.getBoundingClientRect().top;
      var s = -stageTop;                       // scroll since the stage pinned (negative before)
      // Desktop: the titles start hidden below the screen and rise into the bottom stack first
      // (while frame 1 shows whole). Mobile: they are already in the stack (rise = 0).
      // Desktop: first the four image frames play (one per IMG_STEP of the screen, and frame 4
      // holds for one more step), then the titles rise in.
      var imgPhase = switchQuery.matches ? 4 * IMG_STEP * S : 0;
      var imgTarget = imgPhase ? Math.min(Math.max(s / imgPhase, 0), 1) : 1;
      var rise = switchQuery.matches ? 4 * band : 0;
      var riseTarget = rise ? Math.min(Math.max((s - imgPhase) / rise, 0), 1) : 1;
      // Then Strategy travels up; each later card follows after a pause.
      var targets = [];
      for (var k = 0; k < deckCards.length; k++) {
        var start = imgPhase + rise + k * (move + pause);
        targets.push(Math.min(Math.max((s - start) / move, 0), 1));
      }
      return { targets: targets, move: move, rise: rise, riseTarget: riseTarget,
               imgPhase: imgPhase, imgTarget: imgTarget };
    };

    var deckFrame = function (now) {
      // The first frame's timestamp can be slightly earlier than when the loop was requested
      var dt = Math.min(Math.max(now - deckLast, 0), 50);
      deckLast = now;
      var t = deckTargets();
      var ease = reduced ? 1 : 1 - Math.pow(1 - GLIDE, dt / 16.67);
      var moving = false;
      var id = t.imgTarget - imgShown;
      if (Math.abs(id) * Math.max(t.imgPhase, 1) < 0.3) { imgShown = t.imgTarget; } else { imgShown += id * ease; moving = true; }
      var rd = t.riseTarget - riseShown;
      if (Math.abs(rd) * Math.max(t.rise, 1) < 0.3) { riseShown = t.riseTarget; } else { riseShown += rd * ease; moving = true; }
      var lift = (1 - riseShown) * t.rise;   // how far below its stack slot each card still is
      for (var k = 0; k < deckCards.length; k++) {
        var d = t.targets[k] - deckShown[k];
        if (Math.abs(d) * t.move < 0.3) { deckShown[k] = t.targets[k]; }
        else { deckShown[k] += d * ease; moving = true; }
        deckCards[k].style.transform = 'translate3d(0,' + (lift - t.move * deckShown[k]).toFixed(2) + 'px,0)';
        deckCards[k].classList.toggle('is-titled', deckShown[k] >= 0.97);
      }
      if (seqFrames.length) {
        var sp = deckShown[0];   // Strategy's displayed progress (0 = closed, 1 = at its mark)
        var N = seqFrames.length;
        var fi;
        if (t.rise) {
          // Desktop: all frames play before the titles appear (frame 1, then one frame per step,
          // the last one holding for a step before the titles rise in)
          fi = Math.min(N - 1, Math.floor(imgShown * 4 + 0.001));
        } else {
          // Mobile: frame 1 until Strategy moves, then the rest over its travel
          fi = sp <= 0.03 ? 0 : Math.min(N - 1, 1 + Math.floor(sp * (N - 1)));
        }
        if (fi !== seqCurrent) {
          if (seqCurrent >= 0) seqFrames[seqCurrent].classList.remove('is-current');
          seqFrames[fi].classList.add('is-current');
          seqCurrent = fi;
        }
      }
      if (moving) { window.requestAnimationFrame(deckFrame); } else { deckRunning = false; }
    };
    var requestDeck = function () {
      if (deckRunning) return;
      deckRunning = true;
      deckLast = performance.now();
      window.requestAnimationFrame(deckFrame);
    };
    window.addEventListener('scroll', requestDeck, { passive: true });
    window.addEventListener('resize', requestDeck);
    // Start in place (no glide on page load or reload mid-page)
    var first = deckTargets();
    for (var f = 0; f < deckCards.length; f++) deckShown[f] = first.targets[f];
    riseShown = first.riseTarget;
    imgShown = first.imgTarget;
    requestDeck();
  }

  // Header contrast over the service cards: white text over the black card, and a black
  // "Book a call" button over the yellow card (the yellow button would disappear on it).
  var headerCards = Array.prototype.slice.call(document.querySelectorAll('.service'));
  if (headerCards.length) {
    var headerTicking = false;
    var updateHeaderTone = function () {
      headerTicking = false;
      var y = 40; // middle of the header
      var under = null;
      headerCards.forEach(function (el) { // later cards sit on top, so the last match wins
        var r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) under = el;
      });
      root.classList.toggle('header-on-dark', !!under && under.classList.contains('service--dark'));
      root.classList.toggle('header-on-yellow', !!under && under.classList.contains('service--yellow'));
    };
    window.addEventListener('scroll', function () {
      if (headerTicking) return;
      headerTicking = true;
      window.requestAnimationFrame(updateHeaderTone);
    }, { passive: true });
    updateHeaderTone();
  }

  // Page transition: green cover rises from the bottom before leaving.
  if (reduced) return;

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    // Same page (anchor links) scroll as normal.
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();
    root.classList.add('is-leaving');
    window.setTimeout(function () { window.location.href = url.href; }, 600);
  });

  // Back/forward cache: make sure the cover is not left covering the page.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) root.classList.remove('is-leaving');
  });
})();
