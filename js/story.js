/* Native vertical scrolling: build steps and navigation. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var header = document.querySelector('.site-header');
  var steps = Array.from(document.querySelectorAll('[data-build-step]'));
  var links = Array.from(document.querySelectorAll('.site-nav a'));
  var sections = links.map(function (link) { return document.querySelector(link.getAttribute('href')); }).filter(Boolean);
  var frame = 0;
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function update() {
    frame = 0;
    var viewport = document.documentElement.clientHeight;
    steps.forEach(function (step) {
      step.classList.toggle('is-current', reduced.matches || step.getBoundingClientRect().top < viewport * .68);
    });
    var active = '';
    sections.forEach(function (section) { if (section.getBoundingClientRect().top <= 180) active = section.id; });
    links.forEach(function (link) {
      if (link.getAttribute('href') === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    var max = document.documentElement.scrollHeight - viewport;
    if (header) header.style.setProperty('--reading-progress', max > 0 ? clamp(window.scrollY / max).toFixed(4) : '0');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule, { once: true });
  reduced.addEventListener('change', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  update();
})();
