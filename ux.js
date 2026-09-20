/* RenovRenta — animations et finitions (partagé par index.html et artisans.html) */
(function () {
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function init() {
    document.documentElement.classList.add('rr-js');

    /* Logo en deux couleurs : Renov + Renta */
    $$('.logo .nom-marque, footer h4 .nom-marque, footer h4.nom-marque').forEach(function (el) {
      var t = el.textContent;
      var m = t.match(/^(.*?)(Renta.*)$/);
      if (m && m[1]) el.innerHTML = '<span class="rr-a">' + m[1] + '</span><span class="rr-b">' + m[2] + '</span>';
    });

    /* Barre de lecture + en-tête resserré */
    var prog = document.createElement('div'); prog.className = 'rr-prog'; document.body.appendChild(prog);
    var header = $('header.top');
    var enCours = false;
    function surDefilement() {
      enCours = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')';
      if (header) header.classList.toggle('rr-scrolled', scrollY > 10);
    }
    addEventListener('scroll', function () { if (!enCours) { enCours = true; requestAnimationFrame(surDefilement); } }, { passive: true });
    surDefilement();

    /* Halos animés dans le hero */
    var hero = $('.hero');
    if (hero && !reduit) ['h1', 'h2', 'h3'].forEach(function (c) { var d = document.createElement('div'); d.className = 'rr-halo ' + c; hero.insertBefore(d, hero.firstChild); });

    /* Pastilles flottantes autour du formulaire (page particuliers) */
    var carte = $('#formulaire');
    if (carte && carte.parentNode && !carte.parentNode.classList.contains('rr-zone')) {
      var zone = document.createElement('div'); zone.className = 'rr-zone';
      carte.parentNode.insertBefore(zone, carte); zone.appendChild(carte);
      zone.insertAdjacentHTML('beforeend',
        '<div class="rr-chip c1" aria-hidden="true"><i>⏱</i>2 minutes chrono</div>' +
        '<div class="rr-chip c2" aria-hidden="true"><i>🔒</i>Sans engagement</div>');
    }

    /* Ruban défilant des travaux sous le hero */
    if (hero && $('#cartes-travaux')) {
      var mots = ['Isolation', 'Pompe à chaleur', 'Panneaux solaires', 'Fenêtres', 'Toiture', 'Salle de bain', 'Cuisine', 'Chauffage', 'Rénovation complète'];
      var bloc = mots.map(function (m) { return '<span>' + m + '</span>'; }).join('');
      hero.insertAdjacentHTML('afterend', '<div class="rr-ruban" aria-hidden="true"><div class="piste">' + bloc + bloc + '</div></div>');
    }

    /* Apparition au défilement, en cascade */
    var groupes = [
      ['section h2.titre, section .sur-titre, section .sur, section p.intro', ''],
      ['.confiance .wrap>div', 'rv-z', 0.08],
      ['.etapes .e, .etapes>div', '', 0.1],
      ['.cartes-t .ct', 'rv-z', 0.06],
      ['.pq>div, .prix>div, .liste-ok>div', '', 0.1],
      ['.faq details', '', 0.05],
      ['.photo, .fiche', 'rv-g'],
      ['.aides .liste>div', 'rv-d', 0.08],
      ['.metiers span', 'rv-z', 0.04],
      ['.final h2, .final p, .final .btn-cta', '', 0.1]
    ];
    var cibles = [];
    groupes.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        if (el.closest('.hero') || el.classList.contains('rv')) return;
        el.classList.add('rv'); if (g[1]) el.classList.add(g[1]);
        if (g[2]) el.style.setProperty('--d', Math.min(i * g[2], 0.6) + 's');
        cibles.push(el);
      });
    });
    if ('IntersectionObserver' in window && !reduit) {
      var io = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      cibles.forEach(function (el) { io.observe(el); });
    } else cibles.forEach(function (el) { el.classList.add('vu'); });

    /* Compteurs animés (page artisans : 29 €, 0 €, 3 max) */
    $$('.chiffres b').forEach(function (b) {
      var m = b.textContent.match(/^(\D*)(\d+)(.*)$/);
      if (!m || reduit) return;
      var cible = parseInt(m[2], 10), avant = m[1], apres = m[3];
      b.classList.add('rr-compte');
      b.textContent = avant + '0' + apres;
      setTimeout(function () {
        var t0 = performance.now(), duree = 1200;
        (function pas(t) {
          var k = Math.min((t - t0) / duree, 1), v = Math.round(cible * (1 - Math.pow(1 - k, 3)));
          b.textContent = avant + v + apres;
          if (k < 1) requestAnimationFrame(pas);
        })(t0);
      }, 700);
    });

    /* Validation en direct : coche verte quand le champ est bon */
    var tests = {
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
      tel: function (v) { return /^0[1-9]\d{8}$/.test(v.replace(/[\s.\-()]/g, '').replace(/^\+33/, '0')); },
      code_postal: function (v) { return /^\d{5}$/.test(v); }
    };
    document.addEventListener('input', function (e) {
      var el = e.target, champ = el.closest && el.closest('.champ[data-requis]');
      if (!champ || !/^(text|tel|email)$/.test(el.type)) return;
      var v = el.value.trim();
      var ok = el.type === 'email' ? tests.email(v) : el.type === 'tel' ? tests.tel(v) : el.name === 'code_postal' ? tests.code_postal(v) : v.length >= 2;
      champ.classList.toggle('rr-ok', ok);
    });

    /* Confettis quand une demande est envoyée */
    function confettis(cible) {
      if (reduit || !cible) return;
      var couleurs = ['#1f7a5a', '#4ade80', '#f59e0b', '#fcd34d', '#8ee3bd'];
      for (var i = 0; i < 26; i++) {
        var c = document.createElement('span'); c.className = 'rr-confetti';
        var ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 90;
        c.style.setProperty('--x', Math.cos(ang) * dist + 'px');
        c.style.setProperty('--y', Math.sin(ang) * dist - 30 + 'px');
        c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
        c.style.background = couleurs[i % couleurs.length];
        c.style.animationDelay = (Math.random() * 0.15) + 's';
        cible.appendChild(c);
        setTimeout(function (n) { n.remove(); }, 1500, c);
      }
    }
    var merci = $('.etape[data-etape="5"]'), okPro = $('#ok');
    if (window.MutationObserver) {
      [merci, okPro].forEach(function (el) {
        if (!el) return;
        new MutationObserver(function () {
          var visible = el.classList.contains('active') || el.style.display === 'block';
          if (visible && !el.dataset.fete) { el.dataset.fete = '1'; setTimeout(function () { confettis(el.querySelector('.rond')); }, 350); }
        }).observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
