/* Portfolio · Gbatoby Edouard Nina
   JavaScript natif, sans dépendance. Chaque bloc est indépendant :
   si l'un échoue, les autres continuent de fonctionner. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = function () { return reduceMQ.matches; };
  var hasIO = 'IntersectionObserver' in window;

  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  /* ---------- Année du pied de page ---------- */
  safe(function () {
    var y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
  });

  /* ---------- 1. Mode sombre mémorisé ---------- */
  safe(function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)');
    function current() {
      var t = root.getAttribute('data-theme');
      return t ? t : (sysDark.matches ? 'dark' : 'light');
    }
    function sync() {
      var dark = current() === 'dark';
      btn.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
      btn.setAttribute('title', dark ? 'Mode clair' : 'Mode sombre');
      btn.classList.toggle('is-dark', dark);
    }
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    });
    if (sysDark.addEventListener) sysDark.addEventListener('change', sync);
    sync();
  });

  /* ---------- 2. Menu mobile ---------- */
  safe(function () {
    var header = document.querySelector('.nav');
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('menu');
    if (!header || !burger || !menu) return;
    var mobileMQ = window.matchMedia('(max-width: 760px)');
    burger.hidden = false;

    function setOpen(open, focusBack) {
      header.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      // le menu devient visible après recalcul du style : on attend une image avant d'y placer le focus
      if (open) setTimeout(function () { var first = menu.querySelector('a'); if (first) first.focus(); }, 60);
      else if (focusBack) burger.focus();
    }
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && mobileMQ.matches) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('open')) setOpen(false, true);
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('open') && !header.contains(e.target)) setOpen(false);
    });
    var onChange = function () { if (!mobileMQ.matches) setOpen(false); };
    if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onChange);
  });

  /* ---------- 3. Lien actif du menu selon la section visible ---------- */
  safe(function () {
    if (!hasIO) return;
    var links = {};
    document.querySelectorAll('#menu a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          var on = id === en.target.id;
          links[id].classList.toggle('active', on);
          if (on) links[id].setAttribute('aria-current', 'true'); else links[id].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  });

  /* ---------- 4. Apparition au défilement ---------- */
  safe(function () {
    if (!hasIO || reduce()) return;
    var items = document.querySelectorAll('.sec h2, .sec .intro, .card, .timeline > li, .edu li, h3.sub');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) {
      // petit décalage entre cartes voisines d'une même grille
      var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(idx, 5) * 60 + 'ms';
      el.classList.add('reveal');
      io.observe(el);
    });
  });

  /* ---------- 5. Texte animé façon terminal ---------- */
  safe(function () {
    var k = document.querySelector('.kicker[data-phrases]');
    if (!k || reduce()) return;
    var phrases = k.getAttribute('data-phrases').split('|');
    var original = k.textContent;
    // Le texte d'origine reste disponible pour les lecteurs d'écran ; l'animation est décorative.
    k.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = original;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.className = 'term';
    vis.innerHTML = '<span class="prompt">nina@ninatech:~$</span> <span class="typed"></span><span class="caret"></span>';
    k.appendChild(sr); k.appendChild(vis);
    var out = vis.querySelector('.typed');
    var p = 0, i = 0, deleting = false;
    function tick() {
      if (reduce()) { out.textContent = phrases[0]; return; }
      var word = phrases[p];
      i += deleting ? -1 : 1;
      out.textContent = word.slice(0, i);
      var wait = deleting ? 28 : 55;
      if (!deleting && i === word.length) { deleting = true; wait = 1800; }
      else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    }
    setTimeout(tick, 400);
  });

  /* ---------- 6. Compteurs animés ---------- */
  safe(function () {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !hasIO || reduce()) return;
    function run(el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var final = el.textContent;
      var t0 = null, dur = 1400;
      el.setAttribute('aria-label', final);
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (k < 1) requestAnimationFrame(step); else el.textContent = final;
      }
      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  });

  /* ---------- 7. Filtre des labs et des réalisations ---------- */
  safe(function () {
    var LABELS = { reseau: 'Réseau', securite: 'Sécurité', systemes: 'Systèmes', voip: 'VoIP', support: 'Support' };
    ['labs', 'realisations'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var cards = Array.prototype.slice.call(sec.querySelectorAll('[data-cat]'));
      if (!cards.length) return;
      var grid = cards[0].parentElement;
      var cats = [];
      cards.forEach(function (c) {
        c.getAttribute('data-cat').split(/\s+/).forEach(function (x) { if (cats.indexOf(x) < 0) cats.push(x); });
      });
      cats.sort(function (a, b) { return Object.keys(LABELS).indexOf(a) - Object.keys(LABELS).indexOf(b); });

      var bar = document.createElement('div');
      bar.className = 'filters';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Filtrer par domaine');
      var live = document.createElement('p');
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');

      function make(cat, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.setAttribute('data-filter', cat);
        b.setAttribute('aria-pressed', cat === 'all' ? 'true' : 'false');
        bar.appendChild(b);
      }
      make('all', 'Tout');
      cats.forEach(function (c) { make(c, LABELS[c] || c); });

      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-filter]');
        if (!b) return;
        var f = b.getAttribute('data-filter');
        bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var shown = 0;
        cards.forEach(function (c) {
          var ok = f === 'all' || c.getAttribute('data-cat').split(/\s+/).indexOf(f) >= 0;
          c.hidden = !ok;
          if (ok) {
            shown++;
            c.classList.add('in');
            if (!reduce()) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
          }
        });
        live.textContent = shown + (shown > 1 ? ' éléments affichés' : ' élément affiché');
      });
      grid.parentElement.insertBefore(bar, grid);
      grid.parentElement.insertBefore(live, grid);
    });
  });

  /* ---------- 8. Bouton retour en haut ---------- */
  safe(function () {
    var btn = document.querySelector('.totop');
    var hero = document.querySelector('.hero');
    if (!btn) return;
    function update() {
      var limit = hero ? hero.offsetHeight : 400;
      btn.classList.toggle('show', window.scrollY > limit);
    }
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' });
      var main = document.getElementById('top');
      if (main) main.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    });
    update();
  });

  /* ---------- 9. Formulaire de contact ---------- */
  safe(function () {
    var form = document.getElementById('cform');
    if (!form) return;
    var TO = 'ninascrush01@gmail.com';
    var status = form.querySelector('.fstatus');
    var msg = form.querySelector('#f-msg');
    var count = form.querySelector('.count');
    var EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function check(el) {
      var v = el.value.trim();
      var err = '';
      if (el.required && !v) err = el.tagName === 'SELECT' ? 'Choisissez un objet.' : 'Ce champ est obligatoire.';
      else if (el.type === 'email' && !EMAIL_RX.test(v)) err = 'Adresse e-mail invalide (exemple : nom@domaine.com).';
      else if (el.minLength > 0 && v.length < el.minLength) err = 'Au moins ' + el.minLength + ' caractères (actuellement ' + v.length + ').';
      var box = document.getElementById('e-' + el.id.replace('f-', ''));
      if (box) box.textContent = err;
      el.setAttribute('aria-invalid', err ? 'true' : 'false');
      return !err;
    }
    var fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value) check(el); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });
    msg.addEventListener('input', function () { count.textContent = msg.value.length; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (el) { if (!check(el) && !firstBad) firstBad = el; });
      if (firstBad) {
        firstBad.focus();
        status.className = 'fstatus ko';
        status.textContent = 'Corrigez les champs signalés avant d\'envoyer.';
        return;
      }
      var g = function (n) { return form.elements[n].value.trim(); };
      var subject = '[Portfolio] ' + g('objet') + ' · ' + g('nom');
      var body = g('message') + '\n\n—\n' + g('nom') + '\n' + g('email');
      status.className = 'fstatus ok';
      status.textContent = 'Votre messagerie s\'ouvre avec le message prêt à envoyer. Sinon, écrivez directement à ' + TO + '.';
      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  });
})();
