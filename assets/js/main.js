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
  var heroForTheme = document.querySelector('.hero');
  if (heroForTheme) {
    var updateTheme = function () {
      root.classList.toggle('is-light', window.scrollY > heroForTheme.offsetHeight * 0.3);
    };
    window.addEventListener('scroll', updateTheme, { passive: true });
    window.addEventListener('resize', updateTheme);
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

      for (var i = 0; i < tiles.length; i++) {
        var f = floats[i];
        var x = current.x * f.depth + Math.sin(t * f.wx + f.px) * f.ax * ramp;
        var y = current.y * f.depth + Math.sin(t * f.wy + f.py) * f.ay * ramp;
        tiles[i].style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      }

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
