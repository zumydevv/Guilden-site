/* Scroll-driven analytics are an illustrative scenario, never live studio data. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stats = document.querySelector('.growth-section');
  var revenue = document.querySelector('[data-revenue-scene]');
  var header = document.querySelector('.site-header');
  if (!stats || !revenue) return;
  var cards = Array.from(stats.querySelectorAll('[data-metric]'));
  var counters = Array.from(stats.querySelectorAll('[data-counter]'));
  var chapters = Array.from(revenue.querySelectorAll('[data-growth-chapter]'));
  var line = revenue.querySelector('[data-revenue-line]');
  var area = revenue.querySelector('[data-revenue-area]');
  var pointGroup = revenue.querySelector('[data-revenue-points]');
  var points = [];
  for (var i = 0; i < 21; i++) {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '3.5');
    pointGroup.appendChild(circle);
    points.push(circle);
  }
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
  function ordinal(n) {
    var mod = n % 100;
    return n + (mod >= 11 && mod <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  }
  var baselines = cards.map(function (card) {
    return Number(card.querySelector('[data-trend]').textContent.replace(/[^\d.]/g, ''));
  });
  var lastStats = -1, lastRevenue = -1;
  function renderStats(progress) {
    if (progress === lastStats) return;
    lastStats = progress;
    signal(stats, progress);
    stats.style.setProperty('--growth', progress.toFixed(4));
    cards.forEach(function (card, i) {
      var p = ease(clamp(progress * 1.2 - i * .035));
      signal(card, p);
      card.querySelector('[data-value]').textContent = format(card, p);
      var rank = Math.round(mix(Number(card.dataset.rankFrom), Number(card.dataset.rankTo), p));
      card.style.setProperty('--rank', rank + '%');
      card.querySelector('[data-rank]').textContent = ordinal(rank);
      var change = mix(-baselines[i], (Number(card.dataset.to) / Number(card.dataset.from) - 1) * 100, p);
      card.querySelector('[data-trend]').textContent = (change < 0 ? '↓ ' : '↑ ') + Math.abs(change).toFixed(1) + '%';
    });
    counters.forEach(function (node) { node.textContent = format(node, ease(progress)); });
    stats.querySelector('[data-growth-phase]').textContent = progress < .3 ? 'Needs attention' : progress < .8 ? 'Building momentum' : 'Healthy growth';
    stats.querySelector('[data-growth-report]').textContent = progress < .3 ? 'Every great experience has room to grow.' : progress < .8 ? 'With Guilden, every insight becomes an iteration.' : 'More engaged players. A stronger experience.';
    stats.querySelector('[data-growth-status]').textContent = progress < .9 ? 'Observe → Understand → Improve' : 'The next level starts with the players.';
  }
  var base = [31,30,20,14,11,12,12,11,13,12,15,13,14,16,12,10,11,12,15,21,28];
  var target = [31,34,36,39,45,51,57,65,69,78,86,96,104,116,121,135,142,154,161,178,186.4];
  function renderRevenue(progress) {
    if (progress === lastRevenue) return;
    lastRevenue = progress;
    signal(revenue, ease(progress));
    revenue.querySelector('[data-revenue-value]').textContent = mix(17.36, 186.4, ease(progress)).toFixed(2);
    var path = '';
    points.forEach(function (point, i) {
      // Later points lift slightly later, so the curve grows towards the right.
      var local = ease(clamp(progress * 1.16 - i / 20 * .16));
      var x = i * 50;
      var y = 300 - mix(base[i], target[i], local) * 1.5;
      point.setAttribute('cx', x);
      point.setAttribute('cy', y.toFixed(2));
      path += (i === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(2);
    });
    line.setAttribute('d', path);
    area.setAttribute('d', path + 'V300H0Z');
    revenue.querySelector('[data-revenue-status]').textContent = progress < .28 ? 'Room to grow' : progress < .8 ? 'Building with Guilden' : 'A new level of possibility';
    chapters.forEach(function (node, i) { node.classList.toggle('is-active', progress >= i / 3); });
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
    { root: stats, stage: stats.querySelector('.growth-stage'), render: renderStats, length: 1.2 },
    { root: revenue, stage: revenue.querySelector('.revenue-stage'), render: renderRevenue, length: 1.35 }
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
    lastStats = -1; lastRevenue = -1;
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
