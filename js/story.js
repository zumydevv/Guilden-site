/* Scroll-driven analytics are an illustrative scenario, never live studio data. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stats = document.querySelector('.growth-section');
  var header = document.querySelector('.site-header');
  if (!stats) return;
  var cards = Array.from(stats.querySelectorAll('[data-metric]'));
  var steps = Array.from(stats.querySelectorAll('.simulation-steps li'));
  var plot = stats.querySelector('.simulation-plot');
  var line = stats.querySelector('[data-simulation-line]');
  var area = stats.querySelector('[data-simulation-area]');
  var dot = stats.querySelector('[data-simulation-dot]');
  var compact = window.matchMedia('(max-width: 620px)');
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function ease(n) { n = clamp(n); return n * n * (3 - 2 * n); }
  function mix(a, b, p) { return a + (b - a) * p; }
  function signal(node, p) {
    var red = [209,128,125], amber = [192,171,121], green = [102,255,0];
    var from = p < .5 ? red : amber;
    var to = p < .5 ? amber : green;
    var part = p < .5 ? p * 2 : (p - .5) * 2;
    var rgb = from.map(function (n, i) { return Math.round(mix(n, to[i], part)); }).join(',');
    node.style.setProperty('--signal-rgb', rgb);
    node.style.setProperty('--signal', 'rgb(' + rgb + ')');
  }
  function format(node, p) {
    var d = node.dataset;
    var value = mix(Number(d.from), Number(d.to), p);
    return value.toLocaleString('en-US', { minimumFractionDigits: Number(d.decimals || 0), maximumFractionDigits: Number(d.decimals || 0) }) + (d.unit || '');
  }
  var lastStats = -1;
  function renderStats(progress) {
    if (progress === lastStats) return;
    lastStats = progress;
    // Three equal scroll intervals, each with a short hold on the final value.
    var active = Math.min(2, Math.floor(progress * 3));
    var local = ease(clamp((progress * 3 - active) / .82));
    var sequential = compact.matches && !reduced.matches;
    stats.classList.toggle('simulation-sequential', sequential);
    signal(stats, local);
    cards.forEach(function (card, i) {
      var p = ease(clamp((progress * 3 - i) / .82));
      signal(card, p);
      card.querySelector('[data-value]').textContent = format(card, p);
      card.classList.toggle('is-active', i === active);
      if (sequential && i !== active) card.setAttribute('aria-hidden', 'true');
      else card.removeAttribute('aria-hidden');
      steps[i].classList.toggle('is-active', i === active);
      steps[i].classList.toggle('is-complete', p === 1);
      steps[i].style.setProperty('--step-progress', p.toFixed(4));
    });
    var card = cards[active];
    var from = Number(card.dataset.from), to = Number(card.dataset.to), max = Number(card.dataset.max);
    var beforeY = 200 - from / max * 200;
    var path = '';
    // Keep the same axis within each metric and retain the starting baseline.
    for (var i = 0; i <= 40; i++) {
      var x = i / 40;
      var trajectory = Math.pow(x, 1.35) + Math.sin(x * Math.PI * 8) * .018 * Math.sin(x * Math.PI);
      var value = from + (to - from) * trajectory * local;
      var y = 200 - value / max * 200;
      path += (i ? 'L' : 'M') + (x * 1000).toFixed(1) + ' ' + y.toFixed(2);
    }
    line.setAttribute('d', path);
    area.setAttribute('d', path + 'V200H0Z');
    dot.setAttribute('cy', (200 - mix(from, to, local) / max * 200).toFixed(2));
    stats.querySelector('[data-simulation-before]').setAttribute('d', 'M0 ' + beforeY + 'H1000');
    stats.querySelector('[data-axis-max]').textContent = max + card.dataset.unit;
    stats.querySelector('[data-axis-mid]').textContent = max / 2 + card.dataset.unit;
    stats.querySelector('[data-simulation-note]').textContent = card.dataset.note;
    stats.querySelector('[data-simulation-phase]').textContent = local === 1 ? 'After Guilden' : local > 0 ? 'Improving with Guilden' : 'Before Guilden';
    stats.querySelector('[data-simulation-count]').textContent = '0' + (active + 1) + ' / 03';
    stats.querySelector('[data-simulation-scroll]').textContent = progress >= .94 ? 'Your next step starts below.' : 'Keep scrolling to improve the next metric.';
    plot.setAttribute('aria-label', 'Illustrative ' + card.querySelector('h4').textContent + ': ' + format(card, 0) + ' before, ' + format(card, local) + ' in this scenario. Not actual results.');
  }
  var galleryRoot = document.querySelector('.gallery-section');
  var gallery = galleryRoot.querySelector('.game-gallery');
  var galleryCards = Array.from(gallery.querySelectorAll('figure'));
  function renderGallery() {
    var viewport = document.documentElement.clientHeight;
    galleryCards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var enter = reduced.matches ? 1 : ease((viewport - rect.top) / (viewport * .65));
      card.style.setProperty('--card-enter', enter.toFixed(4));
    });
  }
  var scenes = [
    { root: stats, stage: stats.querySelector('.growth-stage'), render: renderStats, length: 2.7 }
  ];

  var navLinks = Array.from(document.querySelectorAll('.site-nav a'));
  // Only top-level navigation chapters determine the active tab. Analytics
  // and monetization stay inside Upgrade Your Game throughout their scroll.
  var sections = navLinks.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  }).filter(Boolean);
  var positions = [];
  var frame = 0;
  function update() {
    frame = 0;
    var y = window.scrollY;
    renderGallery();
    scenes.forEach(function (scene) {
      if (!scene.metrics) return;
      var p = reduced.matches ? 1 : scene.metrics.travel > 0 ? clamp((y - scene.metrics.start) / scene.metrics.travel) : 0;
      scene.root.style.setProperty('--chapter-progress', p.toFixed(4));
      var entry = ease((scene.metrics.viewport - (scene.metrics.top - y)) / (scene.metrics.viewport * .55));
      var exit = ease((scene.metrics.bottom - y) / (scene.metrics.viewport * .45));
      scene.root.style.setProperty('--scene-opacity', reduced.matches || scene.metrics.mobile ? '1' : Math.min(entry, exit).toFixed(4));
      // Quantization avoids needless text and SVG writes below a visible change.
      scene.render(Math.round(p * 1000) / 1000);
    });
    var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    header.style.setProperty('--reading-progress', max > 0 ? clamp(y / max).toFixed(4) : '0');
    var active = '';
    positions.forEach(function (section) { if (section.top <= y + 180) active = section.id; });
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function measure() {
    var viewport = document.documentElement.clientHeight;
    var headerHeight = header.offsetHeight;
    var mobile = window.matchMedia('(max-width: 620px)').matches;
    lastStats = -1;
    // Apply mobile layout before measuring the sticky panel height.
    stats.classList.toggle('simulation-sequential', mobile && !reduced.matches);
    scenes.forEach(function (scene) {
      var animated = !reduced.matches;
      scene.root.classList.toggle('scroll-scene', animated);
      var stageHeight = scene.stage.offsetHeight;
      // Native sticky keeps the chapter on screen while scrolling its animation.
      // On very short screens, read the top first, then pin the panel's bottom.
      var stickyTop = Math.min(headerHeight + 8, viewport - stageHeight - 12);
      var travel = Math.round(viewport * scene.length * (mobile ? .8 : .9));

      scene.root.style.setProperty('--scene-top', stickyTop + 'px');
      scene.root.style.setProperty('--scene-travel', (travel + viewport * .15) + 'px');
      var top = scene.root.getBoundingClientRect().top + window.scrollY;
      scene.metrics = { start: top - stickyTop, travel: travel, top: top, bottom: top + scene.root.offsetHeight, viewport: viewport, mobile: mobile };
    });
    positions = sections.map(function (section) { return { id: section.id, top: section.getBoundingClientRect().top + window.scrollY }; });
    update();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  var resizeTimer, lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth && window.matchMedia('(pointer: coarse)').matches) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 160);
  });
  reduced.addEventListener('change', measure);
  window.addEventListener('load', measure, { once: true });
  measure();
  if (document.fonts) document.fonts.ready.then(measure);
})();
