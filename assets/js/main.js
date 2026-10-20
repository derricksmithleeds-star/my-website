// Made to Count — interactions. Spec: docs/INTERACTIONS.md
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Remove the intro layer once its sequence has finished (2200ms).
  var intro = document.querySelector('.intro');
  if (intro) {
    window.setTimeout(function () { intro.remove(); }, reduced ? 0 : 2200);
  }

  // Theme switch: once the page has scrolled 30% of the hero (screen) height,
  // the hero fades out and the page turns white with black text. Reverses on the way back up.
  // Intro paragraph: pinned in the centre of the screen. It fades in line by line once the
  // page has scrolled 40% and the hero has finished fading out (600ms after the theme switch).
  // While the lines appear, scrolling is paused; it resumes when the last line is in.
  var heroForTheme = document.querySelector('.hero');
  var introCopy = document.querySelector('.intro-copy');
  var introPara = document.querySelector('.hero__intro');
  var HERO_FADE = 600;
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

    // 1. Size: start from the CSS size and shrink until it fits on screen.
    introPara.style.fontSize = '';
    introPara.innerHTML = words.map(function (w) { return '<span class="intro-word">' + w + '</span>'; }).join(' ');
    var size = parseFloat(getComputedStyle(introPara).fontSize);
    var limit = window.innerHeight * MAX_HEIGHT;
    var guard = 0;
    while (introPara.offsetHeight > limit && size > 12 && guard++ < 40) {
      size *= 0.95;
      introPara.style.fontSize = size + 'px';
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
      var light = y > h * 0.3;
      if (light && !root.classList.contains('is-light')) lightSince = performance.now();
      root.classList.toggle('is-light', light);

      var wantIntro = y > h * 0.4;
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

  if (hero && tiles.length && !reduced) {
    var desktopQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

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
        py: between(0, Math.PI * 2)
      };
    });

    var target = { x: 0, y: 0 };   // where the cursor/scroll wants the field
    var follow = { x: 0, y: 0 };   // first smoothing stage
    var current = { x: 0, y: 0 };  // second stage: what is drawn
    var visible = true;
    var running = false;
    var titleLines = Array.prototype.slice.call(document.querySelectorAll('.hero__title .line'));
    var titleRange = document.createRange();

    // Active (hovered) tile is tracked here rather than with CSS :hover, because an
    // active tile slides inwards to stay fully on screen and could otherwise slide out
    // from under the cursor, un-hover, slide back and loop.
    root.classList.add('tiles-js');
    var tilesEl = document.querySelector('.tiles');
    var activeTile = null;
    var activatedAt = { x: 0, y: 0 }; // cursor position when the active tile was picked
    var STILL_RADIUS = 8;             // px; a resting cursor never loses its tile
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
        tilesEl.classList.toggle('has-active', !!next);
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

    // True when the active tile overlaps the headline's actual text (not its empty margins).
    function hoveredTileCoversTitle() {
      if (!activeTile || !desktopQuery.matches) return false;
      var a = activeTile.getBoundingClientRect();
      for (var j = 0; j < titleLines.length; j++) {
        titleRange.selectNodeContents(titleLines[j]); // bounds of the words themselves
        var b = titleRange.getBoundingClientRect();
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) return true;
      }
      return false;
    }
    var startTime = performance.now();
    var lastTime = startTime;
    var FLOAT_START = 1800;        // tiles start fading in here
    var FLOAT_RAMP = 1500;         // float grows in over this long
    var SMOOTH = 0.06;             // per 60fps frame, applied twice (no jolts)

    function onMouseMove(e) {
      if (!desktopQuery.matches) return;
      var range = window.innerWidth * 0.25; // 25vw each way = 50vw of travel
      target.x = (0.5 - e.clientX / window.innerWidth) * 2 * range;
      target.y = (0.5 - e.clientY / window.innerHeight) * 2 * range;
    }
    function scrollTarget() {
      var progress = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);
      return -progress * window.innerWidth * 0.5; // up to 50vw of vertical travel
    }
    function onModeChange() {
      if (!desktopQuery.matches) {
        target.x = 0;
        target.y = follow.y = current.y = scrollTarget();
        follow.x = current.x = 0;
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
        current.x = 0;
        current.y = scrollTarget(); // follows the scroll directly, no lag
      }

      var t = now - startTime;
      var ramp = Math.min(Math.max((t - FLOAT_START) / FLOAT_RAMP, 0), 1);
      ramp = ramp * ramp * (3 - 2 * ramp); // ease in and out

      updateActiveTile();
      var ks = 1 - Math.pow(1 - SHIFT_SMOOTH, dt / 16.67);

      for (var i = 0; i < tiles.length; i++) {
        var f = floats[i];
        var sh = shifts[i];
        sh.x += (sh.tx - sh.x) * ks;
        sh.y += (sh.ty - sh.y) * ks;
        var x = current.x * f.depth + Math.sin(t * f.wx + f.px) * f.ax * ramp + sh.x;
        var y = current.y * f.depth + Math.sin(t * f.wy + f.py) * f.ay * ramp + sh.y;
        tiles[i].style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      }

      // Tiles keep moving, so check every frame whether the hovered tile is over the headline.
      root.classList.toggle('title-dim', hoveredTileCoversTitle());

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
