/*
 * Guilden — comportements du site.
 * Aucun contenu essentiel ne dépend de ce script : sans JavaScript,
 * la page reste lisible (menu visible, état vide des jeux, texte de contact).
 */
(function () {
  'use strict';

  var config = window.GUILDEN_CONFIG || {};
  var BRAND_MARK = 'assets/guilden-controller-mark.png';

  /* ---------- Utilitaires ---------- */
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

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(value);
  }

  /* ---------- Année courante ---------- */
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (node) {
    node.textContent = year;
  });

  /* ---------- Menu mobile ---------- */
  (function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    var label = document.querySelector('[data-menu-label]');
    if (!toggle || !menu) return;

    var mobileQuery = window.matchMedia('(max-width: 900px)');

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    /* Se referme après le choix d'une destination. */
    menu.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && mobileQuery.matches) setOpen(false);
    });

    /* Échap referme et rend le focus au bouton. */
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Clic en dehors du header : fermeture. */
    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (event.target.closest('.site-header')) return;
      setOpen(false);
    });

    /* Retour sur grand écran : on nettoie l'état ouvert. */
    function onViewportChange(mq) {
      if (!mq.matches) setOpen(false);
    }
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', onViewportChange);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(onViewportChange);
    }
  })();

  /* ---------- Liens de la galerie, lorsqu'ils sont fournis ---------- */
  document.querySelectorAll('.game-gallery figure').forEach(function (figure) {
    var img = figure.querySelector('img');
    var key = img.getAttribute('src').split('/').pop().replace(/\.[^.]+$/, '');
    var details = (config.galleryDetails || {})[key];
    if (!details) return;
    if (isNonEmptyString(details.title)) {
      figure.querySelector('figcaption span:last-child').textContent = details.title;
      img.alt = details.title + ' — Roblox game artwork';
    }
    if (!isNonEmptyString(details.url) || !isHttpUrl(details.url)) return;
    var link = el('a', { href: details.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Open ' + (details.title || 'this game') + ' on Roblox (new tab)' });
    while (figure.firstChild) link.appendChild(figure.firstChild);
    figure.appendChild(link);
  });

  /* ---------- Nos jeux ---------- */
  (function renderGames() {
    var grid = document.querySelector('[data-games-grid]');
    var empty = document.querySelector('[data-games-empty]');
    if (!grid || !empty) return;

    var games = Array.isArray(config.games) ? config.games : [];
    var valid = games.filter(function (game) {
      return game && isNonEmptyString(game.title);
    });

    if (valid.length === 0) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }

    valid.forEach(function (game) {
      var hasUrl = isNonEmptyString(game.url) && isHttpUrl(game.url);
      var hasImage = isNonEmptyString(game.image);

      var media;
      if (hasImage) {
        media = el('img', {
          class: 'game-card__image',
          src: game.image,
          alt: isNonEmptyString(game.imageAlt) ? game.imageAlt : 'Preview of ' + game.title,
          width: '1280',
          height: '720',
          loading: 'lazy',
          decoding: 'async'
        });
      } else {
        /* Sans vignette, afficher le monogramme du studio. */
        media = el('div', { class: 'game-card__placeholder' }, [
          el('img', { src: BRAND_MARK, alt: '', width: '1254', height: '1254', loading: 'lazy', decoding: 'async' })
        ]);
      }

      var titleContent = hasUrl
        ? el('a', { href: game.url, target: '_blank', rel: 'noopener noreferrer', text: game.title })
        : document.createTextNode(game.title);

      var card = el('li', { class: 'game-card' }, [
        el('div', { class: 'game-card__media' }, [
          media,
          isNonEmptyString(game.status) ? el('span', { class: 'tag game-card__status', text: game.status }) : null
        ]),
        el('div', { class: 'game-card__body' }, [
          el('h3', { class: 'game-card__title' }, [titleContent]),
          isNonEmptyString(game.description) ? el('p', { class: 'game-card__text', text: game.description }) : null

        ])
      ]);

      grid.appendChild(card);
    });

    grid.hidden = false;
    empty.hidden = true;
  })();

  /* ---------- Contact ---------- */
  (function renderContacts() {
    var list = document.querySelector('[data-contact-links]');
    var status = document.querySelector('[data-contact-status]');
    if (!list || !status) return;

    var contacts = config.contacts || {};
    var quote = config.quote || {};
    var definitions = [
      {
        key: 'email',
        label: 'Request a quote by email',
        href: function (v) {
          var params = [];
          if (isNonEmptyString(quote.subject)) params.push('subject=' + encodeURIComponent(quote.subject));
          if (isNonEmptyString(quote.body)) params.push('body=' + encodeURIComponent(quote.body));
          return 'mailto:' + v.trim() + (params.length ? '?' + params.join('&') : '');
        }
      },
      { key: 'discord', label: 'Join the Discord' },
      { key: 'roblox', label: 'Roblox group' },
      { key: 'youtube', label: 'YouTube' },
      { key: 'tiktok', label: 'TikTok' },
      { key: 'x', label: 'X' },
      { key: 'instagram', label: 'Instagram' }
    ];

    var links = [];
    definitions.forEach(function (def) {
      var value = contacts[def.key];
      if (!isNonEmptyString(value)) return;
      var href = def.href ? def.href(value) : value.trim();
      if (!def.href && !isHttpUrl(href)) return; /* on n'affiche jamais un lien douteux */
      var external = !def.href;
      links.push(
        el('li', null, [
          el('a', {
            class: 'text-link',
            href: href,
            target: external ? '_blank' : null,
            rel: external ? 'noopener noreferrer' : null,
            text: def.label
          })
        ])
      );
    });

    var hint = document.querySelector('[data-contact-hint]');

    /* Discord username: shown as a copyable handle, never as a fake link */
    if (isNonEmptyString(contacts.discordUser)) {
      var handle = contacts.discordUser.trim();
      links.push(
        el('li', { class: 'contact-handle' }, [
          el('span', { class: 'contact-handle__label', text: 'Discord' }),
          el('span', { class: 'contact-handle__value', text: handle })
        ])
      );
    }

    if (links.length === 0) {
      status.textContent = 'Our contact details are coming soon.';
      status.hidden = false;
      list.hidden = true;
      if (hint) hint.hidden = true;
      return;
    }

    status.hidden = true;
    links.forEach(function (item) { list.appendChild(item); });
    list.hidden = false;
    if (hint && isNonEmptyString(contacts.email) && isNonEmptyString(quote.hint)) {
      hint.textContent = quote.hint;
      hint.hidden = false;
    }
  })();

})();
