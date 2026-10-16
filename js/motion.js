/* Guilden: seamless thumbnail rows, restrained depth, and scroll entrances. */
(function () {
  'use strict';
  var config = window.GUILDEN_CONFIG || {};
  var hero = document.querySelector('.hero--immersive');
  var wall = document.querySelector('[data-thumbnail-wall]');
  var header = document.querySelector('.site-header');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var heroVisible = true;
  var journeyActive = false;
  if (!hero || !wall) return;

  var sources = [];
  (Array.isArray(config.games) ? config.games : []).forEach(function (game) {
    if (game && typeof game.image === 'string' && game.image.trim()) sources.push(game.image);
  });
  sources = sources.concat(Array.isArray(config.heroThumbnails) ? config.heroThumbnails : [])
    .filter(function (src, index, list) {
      return typeof src === 'string' && src.trim() && list.indexOf(src) === index;
    });

  if (sources.length) {
    var canvas = document.createElement('div');
    canvas.className = 'thumbnail-wall__canvas';
    var series = sources.slice();
    while (series.length < 11) series = series.concat(sources);
    for (var rowIndex = 0; rowIndex < 4; rowIndex++) {
      var row = document.createElement('div');
      row.className = 'thumbnail-row';
      var track = document.createElement('div');
      track.className = 'thumbnail-track';
      track.style.setProperty('--speed', (125 + rowIndex * 17) + 's');
      track.style.animationDelay = (-rowIndex * 13) + 's';
      var group = document.createElement('div');
      group.className = 'thumbnail-group';
      for (var item = 0; item < series.length; item++) {
        var tile = document.createElement('div');
        tile.className = 'thumbnail-tile';
        var img = document.createElement('img');
        img.src = series[(item + rowIndex * 3) % series.length];
        img.alt = '';
        img.width = 768;
        img.height = 432;
        img.decoding = 'async';
        img.draggable = false;
        tile.appendChild(img);
        group.appendChild(tile);
      }
      track.appendChild(group);
      track.appendChild(group.cloneNode(true));
      row.appendChild(track);
      canvas.appendChild(row);
    }
    wall.appendChild(canvas);
    wall.classList.add('is-ready');
  }

  function syncMotion() {
    hero.classList.toggle('wall-is-idle', journeyActive || !heroVisible || document.hidden || reduced.matches);
    if (reduced.matches) {
      wall.style.setProperty('--wall-x', '0px');
      wall.style.setProperty('--wall-y', '0px');
    }
  }
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      syncMotion();
    }, { threshold: 0 }).observe(hero);
  }
  syncMotion();

  // Pointer events schedule at most one frame; no permanent JavaScript animation loop.
  var pointerFrame = 0;
  var pointerX = 0;
  var pointerY = 0;
  hero.addEventListener('pointermove', function (event) {
    if (journeyActive || reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
    var rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 22;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 16;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(function () {
      wall.style.setProperty('--wall-x', pointerX.toFixed(1) + 'px');
      wall.style.setProperty('--wall-y', pointerY.toFixed(1) + 'px');
      pointerFrame = 0;
    });
  });
  hero.addEventListener('pointerleave', function () {
    if (journeyActive) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    wall.style.setProperty('--wall-x', '0px');
    wall.style.setProperty('--wall-y', '0px');
  });

  function updateHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // A real tile from the moving wall becomes the background of the games section.
  // Native scrolling drives the scene; the sticky stage also works when the hero
  // is taller than a mobile viewport, allowing all its content to scroll into view.
  var journey = document.querySelector('[data-world-journey]');
  if (journey && sources.length) {
    var focusTile = null;
    var origin = null;
    var frame = 0;
    var metrics = {};
    var portal = document.createElement('div');
    portal.className = 'world-portal';
    portal.setAttribute('aria-hidden', 'true');
    var portalImage = document.createElement('img');
    portalImage.alt = '';
    portalImage.draggable = false;
    portal.appendChild(portalImage);
    wall.appendChild(portal);
    var heroContent = [hero.querySelector('.hero__content'), hero.querySelector('.hero__footer'), hero.querySelector('.scroll-cue')].filter(Boolean);
    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function ease(value) { value = clamp(value); return value * value * (3 - 2 * value); }
    function mix(a, b, value) { return a + (b - a) * value; }

    function releaseTile() {
      if (focusTile) focusTile.style.visibility = '';
      focusTile = null;
      origin = null;
      portal.style.opacity = '0';
      journeyActive = false;
      canvas.style.transition = '';
      canvas.style.transform = '';
      syncMotion();
    }

    function captureTile() {
      journeyActive = true;
      syncMotion();
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      // Freeze the current pointer offset as well as the horizontal row animation.
      var transform = getComputedStyle(canvas).transform;
      canvas.style.transition = 'none';
      canvas.style.transform = transform;
      var heroRect = hero.getBoundingClientRect();
      var targetX = metrics.width * (metrics.width > 700 ? .72 : .57);
      var targetY = metrics.height - metrics.viewport * .48;
      var best = Infinity;
      wall.querySelectorAll('.thumbnail-tile').forEach(function (tile) {
        var rect = tile.getBoundingClientRect();
        var x = rect.left + rect.width / 2 - heroRect.left;
        var y = rect.top + rect.height / 2 - heroRect.top;
        if (x < 40 || x > metrics.width - 40 || y < metrics.height - metrics.viewport + 80 || y > metrics.height - 40) return;
        var score = Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2);
        if (score < best) { best = score; focusTile = tile; }
      });
      if (!focusTile) return;
      var rect = focusTile.getBoundingClientRect();
      origin = {
        x: rect.left + rect.width / 2 - heroRect.left,
        y: rect.top + rect.height / 2 - heroRect.top,
        width: focusTile.offsetWidth,
        height: focusTile.offsetHeight
      };
      portalImage.src = focusTile.querySelector('img').src;
      portal.style.width = origin.width + 'px';
      portal.style.height = origin.height + 'px';
      focusTile.style.visibility = 'hidden';
    }

    function renderJourney() {
      frame = 0;
      if (reduced.matches) return;
      var offset = window.scrollY - metrics.top - metrics.lead;
      var progress = clamp(offset / metrics.travel);
      if (progress > 0 && !origin) captureTile();
      if (progress <= 0 && journeyActive) releaseTile();
      var zoom = ease((progress - .06) / .82);
      var exit = ease(progress / .29);
      journey.style.setProperty('--copy-opacity', (1 - exit).toFixed(4));
      journey.style.setProperty('--copy-rise', (-exit * 65) + 'px');
      journey.style.setProperty('--wall-opacity', (1 - ease(progress / .55)).toFixed(4));
      journey.style.setProperty('--wall-mask', (1 - ease(progress / .6)).toFixed(4));
      journey.style.setProperty('--world-shade', (metrics.mobile ? 0 : ease((progress - .38) / .55)).toFixed(4));
      var worldEnd = metrics.mobile
        ? ease((offset - metrics.travel) / (metrics.viewport * .24))
        : ease((offset - metrics.travel - metrics.gamesHeight * .35) / (metrics.gamesHeight * .65));
      journey.style.setProperty('--world-end', worldEnd.toFixed(4));
      heroContent.forEach(function (node) { node.inert = progress > .3; });
      if (!origin) return;
      // Portrait screens retain the complete landscape artwork instead of cropping
      // a 16:9 thumbnail to the height of a phone (a roughly 4x enlargement).
      var endScale = metrics.mobile ? (metrics.width - 32) / origin.width
        : Math.max(metrics.width / origin.width, metrics.viewport / origin.height) * 1.06;
      var scale = mix(1, endScale, zoom);
      var x = mix(origin.x, metrics.width / 2, zoom);
      var endY = metrics.mobile
        ? metrics.lead + metrics.header + 32 + origin.height * endScale / 2
        : metrics.height - metrics.viewport / 2;
      var y = mix(origin.y, endY, zoom);
      portal.style.opacity = mix(.72, 1, ease(progress / .3)).toFixed(4);
      portal.style.borderRadius = mix(14, metrics.mobile ? 18 / endScale : 0, zoom) + 'px';
      portal.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%) rotate(' + mix(-12, 0, zoom) + 'deg) scale(' + scale + ')';
    }

    function measureJourney() {
      releaseTile();
      journey.classList.toggle('journey-enabled', !reduced.matches);
      heroContent.forEach(function (node) { node.inert = false; });
      if (reduced.matches) return;
      var viewport = document.documentElement.clientHeight;
      var height = hero.offsetHeight;
      var mobile = window.matchMedia('(max-width: 620px)').matches;
      metrics = {
        viewport: viewport, height: height, width: hero.clientWidth,
        mobile: mobile, header: header ? header.offsetHeight : 72,
        lead: Math.max(0, height - viewport),
        top: journey.getBoundingClientRect().top + window.scrollY,
        travel: Math.round(viewport * (mobile ? .58 : 1.15)),
        gamesHeight: document.getElementById('vision').offsetHeight
      };
      journey.style.setProperty('--stage-top', Math.min(0, viewport - height) + 'px');
      journey.style.setProperty('--journey-travel', metrics.travel + 'px');
      var artworkBottom = metrics.header + 32 + (metrics.width - 32) * 9 / 16;
      journey.style.setProperty('--mobile-overlap', Math.max(0, Math.round(viewport - artworkBottom + 12)) + 'px');
      renderJourney();
    }
    function scheduleJourney() {
      if (!frame && !reduced.matches) frame = requestAnimationFrame(renderJourney);
    }
    window.addEventListener('scroll', scheduleJourney, { passive: true });
    // Ignore mobile browser-chrome height changes; remeasure on actual layout changes.
    var lastWidth = window.innerWidth;
    var resizeTimer;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth && finePointer.matches === false) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureJourney, 120);
    });
    reduced.addEventListener('change', measureJourney);
    window.addEventListener('load', measureJourney, { once: true });
    measureJourney();
    if (document.fonts) document.fonts.ready.then(measureJourney);
  }

  if ('IntersectionObserver' in window && !reduced.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.section-heading, .world-intro__heading, .world-intro__details, .game-gallery figure, .studio-heading, .studio-method article, .studio-closing, .offer, .process, .contact-layout').forEach(function (node) {
      node.classList.add('reveal-ready');
      if (node.classList.contains('offer') || node.parentNode.classList.contains('studio-method')) {
        node.style.setProperty('--reveal-delay', (Array.prototype.indexOf.call(node.parentNode.children, node) * 90) + 'ms');
      }
      revealObserver.observe(node);
    });
  }
})();
