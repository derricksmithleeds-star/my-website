// Made to Count — interactions. Spec: docs/INTERACTIONS.md
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Remove the intro layer once its sequence has finished (2200ms).
  var intro = document.querySelector('.intro');
  if (intro) {
    window.setTimeout(function () { intro.remove(); }, reduced ? 0 : 2200);
  }

  // Hero tile field: follows the mouse on desktop, drifts with scroll on mobile.
  var hero = document.querySelector('.hero');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  tiles.forEach(function (tile, i) { tile.style.setProperty('--i', i); });

  if (hero && tiles.length && !reduced) {
    var desktopQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    var depths = tiles.map(function (t) { return parseFloat(t.style.getPropertyValue('--d')) || 1; });
    var current = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var visible = true;
    var running = false;

    function onMouseMove(e) {
      if (!desktopQuery.matches) return;
      var range = window.innerWidth * 0.25; // 25vw each way = 50vw of travel
      target.x = (0.5 - e.clientX / window.innerWidth) * 2 * range;
      target.y = (0.5 - e.clientY / window.innerHeight) * 2 * range;
      start();
    }
    function onMouseOut(e) {
      if (!e.relatedTarget && desktopQuery.matches) { target.x = 0; target.y = 0; start(); }
    }
    function onScroll() {
      if (desktopQuery.matches) return;
      var progress = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);
      target.x = 0;
      target.y = -progress * window.innerWidth * 0.5; // up to 50vw of vertical travel
      start();
    }
    function onModeChange() {
      target.x = 0; target.y = 0;
      if (!desktopQuery.matches) onScroll();
      start();
    }

    function frame() {
      // Desktop eases 8% per frame; mobile follows the scroll directly.
      var ease = desktopQuery.matches ? 0.08 : 1;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      for (var i = 0; i < tiles.length; i++) {
        tiles[i].style.transform = 'translate3d(' + (current.x * depths[i]).toFixed(2) + 'px,' + (current.y * depths[i]).toFixed(2) + 'px,0)';
      }
      var settled = Math.abs(target.x - current.x) < 0.1 && Math.abs(target.y - current.y) < 0.1;
      if (visible && !settled) { window.requestAnimationFrame(frame); } else { running = false; }
    }
    function start() {
      if (running || !visible) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(hero);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onModeChange);
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onModeChange);
    onModeChange();
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
