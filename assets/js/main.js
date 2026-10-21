// Made to Count — interactions. Spec: docs/INTERACTIONS.md
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  function switchAt() { return switchQuery.matches ? 0.85 : 0.45; }
  // .is-mobile on <html>: phones and tablets (anything without the desktop mouse layout).
  // Used by CSS for mobile-only styling.
  function setMobileClass() { root.classList.toggle('is-mobile', !switchQuery.matches); }
  setMobileClass();
  if (switchQuery.addEventListener) switchQuery.addEventListener('change', setMobileClass);
  var LINE_FADE = 600;
  var LINE_STAGGER = 150;
  var MAX_HEIGHT = 0.75; // paragraph never taller than 75% of the screen
  var lightSince = 0;
  var revealTimer = null;
  var lineCount = 0;

  // Wrap each visual line of the paragraph in its own span so lines can fade in turn.
  var introText = introPara ? introPara.textContent.trim().replace(/\s+/g, ' ')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  var lastLayoutKey = '';
  function layoutIntro(force) {
    if (!introPara) return;
    // Width only: mobile browsers change the height while scrolling (toolbars), and
    // re-laying out then would replay the fade.
    var key = String(window.innerWidth);
    if (!force && key === lastLayoutKey) return;
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

      // At 85% scroll (45% on mobile) the page turns white at the same moment the paragraph reaches the centre
      // of the screen (where it is pinned), so there is never a blank white screen.
      var light = y > h * switchAt();
      if (light && !root.classList.contains('is-light')) lightSince = performance.now();
      root.classList.toggle('is-light', light);

      var wantIntro = light;
      if (wantIntro) {
        if (!root.classList.contains('intro-in') && !revealTimer) {
          var wait = reduced ? 0 : Math.max(0, HERO_FADE - (performance.now() - lightSince));
          if (!reduced && pinnedNow(y)) {
            lockScroll(wait + LINE_FADE + Math.max(lineCount - 1, 0) * LINE_STAGGER);
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
    window.addEventListener('resize', function () { layoutIntro(); updateTheme(); });
    layoutIntro(true);
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

  // Mobile and tablet: show a random 9 of the tiles, 3x bigger, in random slots of a
  // staggered column. A new random set on every visit, so returning visitors see other work.
  var MOBILE_SLOTS = [ // [left %, top %] of the tile field
    [-8, 2], [50, 8], [22, 20], [60, 30], [-4, 38], [40, 50], [-10, 62], [52, 68], [18, 82]
  ];
  var mobileSet = tiles.slice();
  for (var si = mobileSet.length - 1; si > 0; si--) { // shuffle (Fisher-Yates)
    var sj = Math.floor(Math.random() * (si + 1));
    var tmp = mobileSet[si]; mobileSet[si] = mobileSet[sj]; mobileSet[sj] = tmp;
  }
  mobileSet = mobileSet.slice(0, MOBILE_SLOTS.length);
  function applyTileLayout() {
    var mobile = !desktopQuery.matches;
    root.classList.toggle('tiles-mobile', mobile);
    tiles.forEach(function (t) {
      var k = mobileSet.indexOf(t);
      t.classList.toggle('is-unused', mobile && k === -1);
      if (k !== -1) {
        t.style.setProperty('--mx', MOBILE_SLOTS[k][0] + '%');
        t.style.setProperty('--my', MOBILE_SLOTS[k][1] + '%');
        if (mobile) t.style.setProperty('--i', k); // fade in by slot order
      }
    });
  }
  if (tiles.length) {
    applyTileLayout();
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', applyTileLayout);
  }

  if (hero && tiles.length && !reduced) {

    // Seeded random so each tile's float is different but the same on every visit.
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function between(a, b) { return a + (b - a) * rand(); }

    var floats = tiles.map(function (t) {
      var period = between(8000, 14000); // ms for one loop on the x axis
      return {
        depth: parseFloat(t.style.getPropertyValue('--d')) || 1,
        ax: between(14, 36),          // px of sideways float
        ay: between(10, 28),          // px of vertical float
        wx: (Math.PI * 2) / period,
        wy: (Math.PI * 2) / (period * between(1.2, 1.5)),
        px: between(0, Math.PI * 2),  // phase, so tiles are out of step
        py: between(0, Math.PI * 2),
        // Scroll parallax: extra speed relative to the page. -0.15 = a little slower than the
        // page, 0.6 = 1.6x as fast. Each tile gets its own, so they scroll at different speeds.
        speed: between(-0.15, 0.6)
      };
    });

    var target = { x: 0, y: 0 };   // where the cursor/scroll wants the field
    var follow = { x: 0, y: 0 };   // first smoothing stage
    var current = { x: 0, y: 0 };  // second stage: what is drawn
    var visible = true;
    var running = false;

    // Active (hovered) tile is tracked here rather than with CSS :hover, because an
    // active tile slides inwards to stay fully on screen and could otherwise slide out
    // from under the cursor, un-hover, slide back and loop.
    root.classList.add('tiles-js');
    var tilesEl = document.querySelector('.tiles');
    var activeTile = null;
    var activatedAt = { x: 0, y: 0 }; // cursor position when the active tile was picked
    var STILL_RADIUS = 8;             // px; a resting cursor never loses its tile
    var activeSince = 0;
    // 3D tilt of a flipped card towards the cursor
    var tiltEls = tiles.map(function (t) { return t.querySelector('.tile__tilt'); });
    var tilts = tiles.map(function () { return { x: 0, y: 0 }; });
    var TILT_MAX = 12;        // degrees at the card's edge
    var TILT_START = 550;     // ms after the flip begins (flip lasts 700ms)
    var TILT_RAMP = 300;      // tilt eases in over this long
    var TILT_SMOOTH = 0.15;   // per 60fps frame
    var mouse = { x: 0, y: 0, inside: false };
    var shifts = tiles.map(function () { return { x: 0, y: 0, tx: 0, ty: 0 }; });
    var HOVER_SCALE = 1.25;   // matches the CSS flip scale
    var EDGE_GAP = 0.1;       // 10vw clear space around an active tile
    var SHIFT_SMOOTH = 0.12;  // per 60fps frame

    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse.inside = false; });

    function keepZone(tile, i) {
      // Union of where the tile sits now (enlarged) and where it would sit unshifted.
      var r = tile.getBoundingClientRect();
      var growX = r.width * (HOVER_SCALE - 1) / 2;
      var growY = r.height * (HOVER_SCALE - 1) / 2;
      var sh = shifts[i];
      return {
        left: Math.min(r.left - growX, r.left - sh.x),
        right: Math.max(r.right + growX, r.right - sh.x),
        top: Math.min(r.top - growY, r.top - sh.y),
        bottom: Math.max(r.bottom + growY, r.bottom - sh.y)
      };
    }
    function updateActiveTile() {
      var next = null;
      if (desktopQuery.matches && mouse.inside && !root.classList.contains('is-light')) {
        if (activeTile) {
          // Keep the tile while the cursor rests (tiles keep floating and steering under a
          // still cursor) or while it is over where the tile is now or was before sliding in.
          var still = Math.abs(mouse.x - activatedAt.x) <= STILL_RADIUS && Math.abs(mouse.y - activatedAt.y) <= STILL_RADIUS;
          var z = keepZone(activeTile, tiles.indexOf(activeTile));
          if (still || (mouse.x >= z.left && mouse.x <= z.right && mouse.y >= z.top && mouse.y <= z.bottom)) next = activeTile;
        }
        if (!next) {
          var el = document.elementFromPoint(mouse.x, mouse.y);
          var t = el && el.closest ? el.closest('.tile') : null;
          if (t && tiles.indexOf(t) !== -1) next = t;
        }
      }
      if (next !== activeTile) {
        if (activeTile) activeTile.classList.remove('is-active');
        if (next) next.classList.add('is-active');
        activeTile = next;
        activatedAt.x = mouse.x; activatedAt.y = mouse.y;
        activeSince = performance.now();
        tilesEl.classList.toggle('has-active', !!next);
      }
      // Glare on the back of the active card follows the cursor. The back is mirrored by the
      // flip, so the horizontal position is flipped too.
      if (activeTile) {
        var cr = activeTile.querySelector('.tile__card').getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0) {
          var gx = 1 - (mouse.x - cr.left) / cr.width;
          var gy = (mouse.y - cr.top) / cr.height;
          activeTile.style.setProperty('--gx', (Math.min(Math.max(gx, 0), 1) * 100).toFixed(1) + '%');
          activeTile.style.setProperty('--gy', (Math.min(Math.max(gy, 0), 1) * 100).toFixed(1) + '%');
        }
      }

      // Work out how far the active tile must move so its enlarged card has 10vw clear on every side.
      for (var i = 0; i < tiles.length; i++) { shifts[i].tx = 0; shifts[i].ty = 0; }
      if (activeTile) {
        var idx = tiles.indexOf(activeTile);
        var r = activeTile.getBoundingClientRect();
        var sh = shifts[idx];
        var cx = (r.left + r.right) / 2 - sh.x;  // centre without the shift
        var cy = (r.top + r.bottom) / 2 - sh.y;
        var gap = window.innerWidth * EDGE_GAP;
        var halfW = r.width * HOVER_SCALE / 2;
        var halfH = r.height * HOVER_SCALE / 2;
        sh.tx = clampCentre(cx, gap + halfW, window.innerWidth - gap - halfW, window.innerWidth / 2) - cx;
        sh.ty = clampCentre(cy, gap + halfH, window.innerHeight - gap - halfH, window.innerHeight / 2) - cy;
      }
    }
    function clampCentre(v, min, max, fallback) {
      if (min > max) return fallback; // screen too small for the gap: centre it
      return Math.min(Math.max(v, min), max);
    }

    var startTime = performance.now();
    var lastTime = startTime;
    var FLOAT_START = 1800;        // tiles start fading in here
    var FLOAT_RAMP = 1500;         // float grows in over this long
    var SMOOTH = 0.06;             // per 60fps frame, applied twice (no jolts)

    // Steering target from the cursor. While a card is flipped (active), steering pauses so
    // the card stays under the cursor for tilting and clicking; it resumes when released.
    var steer = { x: 0, y: 0 };
    function onMouseMove(e) {
      if (!desktopQuery.matches) return;
      var range = window.innerWidth * 0.25; // 25vw each way = 50vw of travel
      steer.x = (0.5 - e.clientX / window.innerWidth) * 2 * range;
      steer.y = (0.5 - e.clientY / window.innerHeight) * 2 * range;
      if (!activeTile) { target.x = steer.x; target.y = steer.y; }
    }
    // Scroll parallax for the headline: it moves down by this share of the scroll, so it
    // travels at 60% of the page's speed and the tiles slide past it.
    var TITLE_LAG = 0.4;
    var heroTitle = document.querySelector('.hero__title');
    function scrollAmount() { return Math.max(window.scrollY, 0); }
    // ---------- Mobile and tablet: hold a tile for 0.5s to open it ----------
    // The card presses in while held, then flips, glides to the centre of the screen and
    // grows to 80% of the screen width. Drag a finger over it to tilt it and move the glare;
    // untouched, it sways gently. The close button or a tap outside closes it.
    var HOLD_MS = 500;
    var MOVE_CANCEL = 10;     // px a finger can move before the hold counts as a scroll
    var OPEN_WIDTH = 0.8;     // open card width as a share of the screen width
    var IDLE_SWAY = 0.22;     // idle tilt as a share of the full tilt range
    var openTile = null;
    var openSince = 0;
    var openScrollY = 0;       // page position held while a card is open
    var openScale = 1;
    var press = null;          // { tile, x, y, timer }
    var finger = { x: 0, y: 0, down: false };
    var suppressClickUntil = 0;

    function openCard(t) {
      cancelPress();
      openTile = t;
      openSince = performance.now();
      openScrollY = window.scrollY;
      window.scrollTo(0, openScrollY); // stops any momentum scroll still running
      openScale = (window.innerWidth * OPEN_WIDTH) / t.offsetWidth;
      t.style.setProperty('--open-scale', openScale.toFixed(3));
      t.classList.add('is-open');
      tilesEl.classList.add('has-open');
      root.classList.add('tile-open');
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
    }
    function closeCard() {
      if (!openTile) return;
      openTile.classList.remove('is-open');
      tilesEl.classList.remove('has-open');
      root.classList.remove('tile-open');
      openTile = null;
      finger.down = false;
    }
    function cancelPress() {
      if (!press) return;
      window.clearTimeout(press.timer);
      press.tile.classList.remove('is-pressing');
      press = null;
    }

    tilesEl.addEventListener('touchstart', function (e) {
      if (desktopQuery.matches || root.classList.contains('is-light')) return;
      var touch = e.touches[0];
      if (openTile) {
        // Finger on the open card drives the tilt and glare
        if (openTile.contains(e.target)) { finger.x = touch.clientX; finger.y = touch.clientY; finger.down = true; }
        return;
      }
      var t = e.target.closest('.tile');
      if (!t || e.touches.length > 1) return;
      press = { tile: t, x: touch.clientX, y: touch.clientY, timer: 0 };
      t.classList.add('is-pressing');
      press.timer = window.setTimeout(function () {
        suppressClickUntil = performance.now() + 800; // the lifting finger must not click
        openCard(t);
      }, HOLD_MS);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (desktopQuery.matches) return;
      var touch = e.touches[0];
      if (press && (Math.abs(touch.clientX - press.x) > MOVE_CANCEL || Math.abs(touch.clientY - press.y) > MOVE_CANCEL)) {
        cancelPress(); // it's a scroll, not a hold
      }
      if (openTile) {
        e.preventDefault(); // page doesn't scroll while a card is open
        if (finger.down) { finger.x = touch.clientX; finger.y = touch.clientY; }
      }
    }, { passive: false });

    function endTouch() { cancelPress(); finger.down = false; }
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });

    // No long-press menus or link previews on tiles
    tilesEl.addEventListener('contextmenu', function (e) { if (!desktopQuery.matches) e.preventDefault(); });

    // Taps: a quick tap on a closed tile does nothing; on the open card, the close button
    // closes it, the card follows its link, and a tap anywhere else closes it.
    document.addEventListener('click', function (e) {
      if (desktopQuery.matches) return;
      if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); return; }
      if (openTile) {
        // Close button: checked by position as well, because on a tilted 3D card the browser
        // can report the card underneath instead of the button.
        if (e.target.closest('.tile__close') || overCloseButton(e.clientX, e.clientY)) {
          e.preventDefault(); e.stopPropagation(); closeCard(); return;
        }
        if (openTile.contains(e.target)) return; // follow the card's link
        e.preventDefault(); e.stopPropagation(); closeCard();
        return;
      }
      if (e.target.closest('.tile')) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    function overCloseButton(x, y) {
      if (!openTile) return false;
      var r = openTile.querySelector('.tile__close').getBoundingClientRect();
      var pad = 12; // generous touch area around the visible circle
      return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
    }

    function updateOpenTile() {
      // Centre the open card on screen (it keeps its float, the shift keeps it centred)
      if (!openTile) return;
      // Safety net: the page stays exactly where it was while the card is open
      if (Math.abs(window.scrollY - openScrollY) > 0.5) window.scrollTo(0, openScrollY);
      var idx = tiles.indexOf(openTile);
      var r = openTile.getBoundingClientRect();
      var sh = shifts[idx];
      sh.tx = window.innerWidth / 2 - ((r.left + r.right) / 2 - sh.x);
      sh.ty = window.innerHeight / 2 - ((r.top + r.bottom) / 2 - sh.y);
    }

    var lastMode = desktopQuery.matches;
    function onModeChange() {
      if (desktopQuery.matches !== lastMode) { // only when switching desktop <-> mobile
        lastMode = desktopQuery.matches;
        closeCard();
        cancelPress();
      }
      if (!desktopQuery.matches) {
        target.x = target.y = follow.x = follow.y = current.x = current.y = 0;
      }
    }

    function frame(now) {
      var dt = Math.min(now - lastTime, 50);
      lastTime = now;
      var desktop = desktopQuery.matches;

      if (desktop) {
        // Frame-rate independent two-stage easing: starts gently, glides, settles.
        var k = 1 - Math.pow(1 - SMOOTH, dt / 16.67);
        follow.x += (target.x - follow.x) * k;
        follow.y += (target.y - follow.y) * k;
        current.x += (follow.x - current.x) * k;
        current.y += (follow.y - current.y) * k;
      } else {
        current.x = 0; // no steering on touch screens; scroll parallax below moves the tiles
        current.y = 0;
      }
      var scrolled = scrollAmount();
      if (heroTitle) heroTitle.style.transform = 'translate3d(0,' + (scrolled * TITLE_LAG).toFixed(2) + 'px,0)';

      var t = now - startTime;
      var ramp = Math.min(Math.max((t - FLOAT_START) / FLOAT_RAMP, 0), 1);
      ramp = ramp * ramp * (3 - 2 * ramp); // ease in and out

      updateActiveTile();
      if (!activeTile && desktop) { target.x = steer.x; target.y = steer.y; } // resume steering
      if (!desktop) updateOpenTile();
      var ks = 1 - Math.pow(1 - SHIFT_SMOOTH, dt / 16.67);

      for (var i = 0; i < tiles.length; i++) {
        var f = floats[i];
        var sh = shifts[i];
        sh.x += (sh.tx - sh.x) * ks;
        sh.y += (sh.ty - sh.y) * ks;
        var x = current.x * f.depth + Math.sin(t * f.wx + f.px) * f.ax * ramp + sh.x;
        var y = current.y * f.depth + Math.sin(t * f.wy + f.py) * f.ay * ramp + sh.y - scrolled * f.speed;
        tiles[i].style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      }

      // Tilt: the flipped card leans towards the cursor (desktop) or finger (mobile);
      // untouched on mobile it sways gently. All other cards settle flat.
      var kt = 1 - Math.pow(1 - TILT_SMOOTH, dt / 16.67);
      var focusTile = desktop ? activeTile : openTile;
      var focusSince = desktop ? activeSince : openSince;
      var focusScale = desktop ? HOVER_SCALE : openScale;
      var tiltIn = focusTile ? Math.min(Math.max((now - focusSince - TILT_START) / TILT_RAMP, 0), 1) : 0;
      for (var n = 0; n < tiles.length; n++) {
        var goalX = 0, goalY = 0;
        if (tiles[n] === focusTile && tiltIn > 0) {
          var px, py; // pointer position over the card, -0.5..0.5
          var tr = tiles[n].getBoundingClientRect();
          var w = tr.width * focusScale, hgt = tr.height * focusScale;
          if (desktop || finger.down) {
            var pointer = desktop ? mouse : finger;
            px = Math.min(Math.max((pointer.x - (tr.left + tr.right) / 2) / w, -0.5), 0.5);
            py = Math.min(Math.max((pointer.y - (tr.top + tr.bottom) / 2) / hgt, -0.5), 0.5);
          } else {
            px = Math.sin(t / 1700) * IDLE_SWAY;
            py = Math.sin(t / 2300 + 1) * IDLE_SWAY;
          }
          goalY = px * 2 * TILT_MAX * tiltIn;   // pointer right: right edge presses away
          goalX = -py * 2 * TILT_MAX * tiltIn;  // pointer top: top edge presses away
          if (!desktop) { // glare follows the finger / sway (back face is mirrored)
            tiles[n].style.setProperty('--gx', ((0.5 - px) * 100).toFixed(1) + '%');
            tiles[n].style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
          }
        }
        var tl = tilts[n];
        if (Math.abs(goalX - tl.x) < 0.01 && Math.abs(goalY - tl.y) < 0.01 && goalX === 0 && goalY === 0 && tl.x === 0 && tl.y === 0) continue;
        tl.x += (goalX - tl.x) * kt;
        tl.y += (goalY - tl.y) * kt;
        if (goalX === 0 && goalY === 0 && Math.abs(tl.x) < 0.05 && Math.abs(tl.y) < 0.05) { tl.x = 0; tl.y = 0; }
        tiltEls[n].style.transform = 'rotateX(' + tl.x.toFixed(2) + 'deg) rotateY(' + tl.y.toFixed(2) + 'deg)';
      }

      // Tiles keep moving, so check every frame whether the hovered tile is over the headline.
      // Any hovered tile (desktop) blurs and fades the headline; on mobile the open card does (.tile-open).
      root.classList.toggle('title-dim', desktop && !!activeTile);

      if (visible) { window.requestAnimationFrame(frame); } else { running = false; }
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

  // Service cards start at 65% of the screen width and grow to 80% as they reach their pinned
  // position (never full width). They keep 20px rounded corners throughout (matching the hero
  // tiles, whose back colours correspond to the services). Width is scrubbed with the scroll.
  // The service name stays hidden until the card is almost pinned, then rises and fades in
  // (a timed CSS transition triggered by the .is-titled class).
  var deckCards = Array.prototype.slice.call(document.querySelectorAll('.service'));
  if (deckCards.length) {
    var WIDEN_RANGE = 0.6;   // share of the screen height over which a card widens
    var CARD_RADIUS = 20;    // px, kept throughout
    // % of screen width while far from its pinned position / once pinned.
    // Desktop 65 -> 80, mobile 85 -> 96.
    function startW() { return switchQuery.matches ? 65 : 85; }
    function endW() { return switchQuery.matches ? 80 : 96; }
    var TITLE_AT = 0.9;      // widening progress at which the name rises in (~6% of the screen from its mark)
    var deckTicking = false;
    var updateDeck = function () {
      deckTicking = false;
      var vh = window.innerHeight;
      deckCards.forEach(function (card) {
        var stickTop = parseFloat(getComputedStyle(card).top) || 0;
        var dist = card.getBoundingClientRect().top - stickTop;      // 0 once pinned
        var p = reduced ? 1 : Math.min(Math.max(1 - dist / (vh * WIDEN_RANGE), 0), 1);
        var width = startW() + (endW() - startW()) * p;
        var side = (100 - width) / 2;                                 // vw cut from each side
        card.style.clipPath = 'inset(0 ' + side.toFixed(3) + 'vw round ' + CARD_RADIUS + 'px)';
        card.classList.toggle('is-titled', p >= TITLE_AT);
      });
    };
    window.addEventListener('scroll', function () {
      if (deckTicking) return;
      deckTicking = true;
      window.requestAnimationFrame(updateDeck);
    }, { passive: true });
    window.addEventListener('resize', updateDeck);
    updateDeck();
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

  // Page transition: yellow cover rises from the bottom before leaving.
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
