/*
 * WakiCube — Waki, the living mascot.
 *
 * Building blocks:
 *   - createFace(element, baseExpression): a fixed-size square that shows one
 *     expression, can "talk" (alternates the two talking frames for ~1 s) and
 *     flash an expression before returning to its base.
 *   - createBubble(options): a speech bubble. Only one bubble is open at a time
 *     across the whole page.
 *   - Spots: hero (idle, winks on click), studio (wink + fun fact), games
 *     (surprised), footer (sleepy, wakes up), plus the corner companion.
 *
 * Everything is local: no sound, no API, no data collection.
 */
(function () {
  'use strict';

  var assets = window.WAKI_ASSETS || {};
  var t = window.WAKI_DIALOGUES || {};
  var config = window.WAKICUBE_CONFIG || {};
  if (!assets.idle) return;

  var STORAGE_KEY = 'wakicube:waki-hidden';
  var TALK_INTERVAL = 220;
  var TALK_DURATION = 1000;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var uid = 0;

  /* ---------- Utilities ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'text') node.textContent = value;
        else if (key === 'class') node.className = value;
        else node.setAttribute(key, value);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function readPreference() {
    try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch (error) { return false; }
  }

  function writePreference(hidden) {
    try {
      if (hidden) window.localStorage.setItem(STORAGE_KEY, '1');
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) { /* storage unavailable: preference lasts for this visit only */ }
  }

  /* ---------- Images: preload every expression, remember failures ---------- */
  var failed = {};
  Object.keys(assets).forEach(function (key) {
    if (key === 'idle' || typeof assets[key] !== 'string') return;
    var image = new Image();
    image.onerror = function () { failed[key] = true; };
    image.src = assets[key];
  });

  function srcFor(expression) {
    if (expression !== 'idle' && assets[expression] && !failed[expression]) return assets[expression];
    return assets.idle;
  }

  function canTalk() {
    return !reducedMotion.matches && assets.talkA && assets.talkB && !failed.talkA && !failed.talkB;
  }

  /* ---------- Face component ---------- */
  function createFace(element, base) {
    var img = element.querySelector('img');
    var timers = [];

    function clear() {
      timers.forEach(function (id) { window.clearTimeout(id); window.clearInterval(id); });
      timers = [];
    }

    function set(expression) {
      clear();
      element.setAttribute('data-expression', expression);
      img.src = srcFor(expression);
    }

    /* Alternate the two talking frames for about a second, then rest on `after`. */
    function talk(after) {
      clear();
      if (!canTalk()) { set(after); return; }
      var flip = false;
      element.setAttribute('data-expression', 'talking');
      img.src = srcFor('talkA');
      timers.push(window.setInterval(function () {
        flip = !flip;
        img.src = srcFor(flip ? 'talkB' : 'talkA');
      }, TALK_INTERVAL));
      timers.push(window.setTimeout(function () { set(after); }, TALK_DURATION));
    }

    /* Show an expression briefly, then return to `after`. */
    function flash(expression, after, duration) {
      clear();
      set(expression);
      timers.push(window.setTimeout(function () { set(after); }, duration || 1200));
    }

    set(base);
    return { element: element, set: set, talk: talk, flash: flash, clear: clear };
  }

  /* ---------- Speech bubbles (one open at a time) ---------- */
  var live = el('p', { class: 'visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' });
  document.body.appendChild(live);

  var currentBubble = null;

  function createBubble(options) {
    var id = 'waki-bubble-' + (++uid);
    var text = el('p', { class: 'waki-bubble__text' });
    var closeButton = el('button', { class: 'waki-bubble__action waki-bubble__close', type: 'button', text: t.close || 'Close' });
    var actions = el('div', { class: 'waki-bubble__actions' }, [closeButton].concat(options.extraActions || []));
    var node = el('div', {
      class: 'waki-bubble' + (options.fixed ? ' waki-bubble--fixed' : ' waki-bubble--inline'),
      id: id,
      role: 'region',
      'aria-label': t.bubbleRegionLabel || 'Message from Waki',
      hidden: ''
    }, [
      el('span', { class: 'waki-bubble__name', text: t.bubbleName || 'Waki' }),
      text,
      actions
    ]);
    options.host.appendChild(node);
    if (options.trigger) options.trigger.setAttribute('aria-controls', id);

    var api = { node: node, isOpen: false, open: open, close: close, reposition: reposition };

    /* Keep an inline bubble inside the layout viewport (clientWidth ignores scrollbars and overflow). */
    function reposition() {
      if (!api.isOpen || options.fixed || !options.anchor) return;
      node.style.setProperty('--shift', '0px');
      var rect = node.getBoundingClientRect();
      var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      var margin = 16;
      var shift = 0;
      if (rect.left < margin) shift = margin - rect.left;
      else if (rect.right > viewportWidth - margin) shift = (viewportWidth - margin) - rect.right;
      node.style.setProperty('--shift', Math.round(shift) + 'px');
    }

    node.addEventListener('animationend', reposition);

    function open(message) {
      if (!message) return;
      if (currentBubble && currentBubble !== api) currentBubble.close(false);
      currentBubble = api;
      text.textContent = message;
      live.textContent = message;
      node.hidden = false;
      api.isOpen = true;
      if (options.trigger) options.trigger.setAttribute('aria-expanded', 'true');
      reposition();
    }

    function close(returnFocus) {
      if (!api.isOpen) return;
      var hadFocus = node.contains(document.activeElement);
      node.hidden = true;
      api.isOpen = false;
      if (currentBubble === api) currentBubble = null;
      if (options.trigger) options.trigger.setAttribute('aria-expanded', 'false');
      if (options.onClose) options.onClose();
      if ((returnFocus || hadFocus) && options.trigger && options.trigger.offsetParent !== null) options.trigger.focus();
    }

    closeButton.addEventListener('click', function () { close(true); });
    return api;
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && currentBubble) currentBubble.close(false);
  });

  window.addEventListener('resize', function () {
    if (currentBubble) currentBubble.reposition();
  });

  /* ---------- Session memory for one-time moments ---------- */
  var fired = {};
  function once(key) {
    if (fired[key]) return false;
    fired[key] = true;
    return true;
  }

  function hasPublishedGames() {
    return Array.isArray(config.games) && config.games.some(function (game) {
      return game && typeof game.title === 'string' && game.title.trim();
    });
  }

  /* ---------- Hero: idle Waki, winks when poked ---------- */
  (function setupHero() {
    var button = document.querySelector('[data-waki-hero]');
    if (!button) return;
    var face = createFace(button.querySelector('.waki-face'), 'idle');
    if (t.heroLabel) button.setAttribute('aria-label', t.heroLabel);
    button.addEventListener('click', function () { face.flash('wink', 'idle', 1100); });
  })();

  /* ---------- Section spots: studio, games, footer ---------- */
  function setupSpot(name, settings) {
    var spot = document.querySelector('[data-waki-spot="' + name + '"]');
    if (!spot) return null;
    var button = spot.querySelector('.waki-spot__button');
    var faceElement = spot.querySelector('.waki-face');
    if (!button || !faceElement) return null;

    var face = createFace(faceElement, settings.base);
    var bubble = createBubble({
      host: spot,
      anchor: faceElement,
      trigger: button,
      onClose: function () { face.set(settings.base); }
    });

    button.addEventListener('click', function () {
      if (bubble.isOpen) { bubble.close(false); return; }
      var message = settings.message();
      bubble.open(message);
      face.talk(settings.after || settings.base);
    });

    return { spot: spot, face: face, bubble: bubble };
  }

  /* Studio: wink Waki shares the studio's origin in two steps */
  setupSpot('studio', {
    base: 'wink',
    message: function () {
      return once('studio') ? t.studio : t.studioOrigin;
    }
  });

  /* For Businesses: wink Waki sums up the offer, then how it works */
  setupSpot('business', {
    base: 'wink',
    message: function () {
      return once('business') ? t.business : t.businessHow;
    }
  });

  /* Games: surprised Waki. Lives in the empty state; moves next to the title once games exist. */
  (function setupGames() {
    var games = setupSpot('games', {
      base: 'surprised',
      message: function () { return hasPublishedGames() ? t.gamesPublished : t.gamesEmpty; }
    });
    if (!games) return;
    var grid = document.querySelector('[data-games-grid]');
    var head = document.querySelector('#games .section__head');
    if (grid && !grid.hidden && head) {
      head.classList.add('section__head--with-waki');
      head.appendChild(games.spot);
      games.spot.classList.add('waki-spot--head');
    }
  })();

  /* Footer: sleepy Waki wakes up surprised, then dozes off again when the bubble closes */
  (function setupFooter() {
    var footer = setupSpot('footer', {
      base: 'sleepy',
      after: 'surprised',
      message: function () { return t.footerWake; }
    });
    if (footer && t.footerWakeLabel) footer.spot.querySelector('.waki-spot__button').setAttribute('aria-label', t.footerWakeLabel);
  })();

  /* ---------- Corner companion ---------- */
  (function setupCompanion() {
    var root = el('div', { class: 'waki-companion' });
    var faceElement = el('span', { class: 'waki-face waki-face--companion' }, [
      el('img', { src: assets.idle, alt: '', width: '1254', height: '1254', decoding: 'async' })
    ]);
    var button = el('button', {
      class: 'waki-companion__button',
      type: 'button',
      'aria-label': t.companionLabel || 'Talk to Waki',
      'aria-expanded': 'false'
    }, [faceElement]);

    var hideButton = el('button', { class: 'waki-bubble__action waki-bubble__hide', type: 'button', text: t.hide || 'Hide Waki' });
    var bubble = createBubble({ host: root, fixed: true, trigger: button, extraActions: [hideButton], onClose: function () { face.set('idle'); } });
    root.appendChild(button);
    document.body.appendChild(root);

    var face = createFace(faceElement, 'idle');

    /* Footer control to bring the companion back */
    var footerSlot = document.querySelector('[data-waki-footer]');
    var showButton = el('button', { class: 'footer-show-waki', type: 'button', text: t.show || 'Show Waki', hidden: '' });
    if (footerSlot) footerSlot.appendChild(showButton);

    var lines = Array.isArray(t.companionLines) && t.companionLines.length ? t.companionLines : [{ text: 'Hi.' }];
    var activations = 0;
    var hidden = false;

    function nudge() {
      if (reducedMotion.matches) return;
      button.classList.remove('is-nudging');
      void button.offsetWidth;
      button.classList.add('is-nudging');
    }
    button.addEventListener('animationend', function () { button.classList.remove('is-nudging'); });

    function nextLine() {
      activations += 1;
      if (activations >= 3 && once('thirdClick')) return { text: t.thirdClick, face: 'wink' };
      return lines[(activations - 1) % lines.length];
    }

    button.addEventListener('click', function () {
      if (bubble.isOpen) { bubble.close(false); return; }
      var line = nextLine();
      bubble.open(line.text);
      face.talk(line.face || 'idle');
    });

    function hideCompanion(persist) {
      face.clear();
      bubble.close(false);
      hidden = true;
      root.hidden = true;
      showButton.hidden = false;
      if (persist) writePreference(true);
    }

    function showCompanion(focusButton) {
      hidden = false;
      root.hidden = false;
      showButton.hidden = true;
      writePreference(false);
      if (focusButton) button.focus();
      nudge();
    }

    hideButton.addEventListener('click', function () {
      hideCompanion(true);
      showButton.focus();
      showButton.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
    showButton.addEventListener('click', function () { showCompanion(true); });

    if (readPreference()) hideCompanion(false);

    /* Never overlap the open mobile menu */
    var menuToggle = document.querySelector('[data-menu-toggle]');
    if (menuToggle && 'MutationObserver' in window) {
      new MutationObserver(function () {
        var menuOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        root.classList.toggle('is-suspended', menuOpen);
        if (menuOpen && bubble.isOpen) bubble.close(false);
      }).observe(menuToggle, { attributes: true, attributeFilter: ['aria-expanded'] });
    }

    window.addEventListener('pagehide', function () { face.clear(); });
  })();
})();
