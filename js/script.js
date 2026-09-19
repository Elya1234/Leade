// Menu mobile
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger?.addEventListener('click', () => {
  nav.classList.toggle('open');
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// Header: ombre au scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 4px 20px rgba(15,27,45,0.06)';
  } else {
    header.style.boxShadow = 'none';
  }
});

// Compteurs animés dans le hero
const counters = document.querySelectorAll('.stat-num');
let countersStarted = false;

function animateCounters() {
  counters.forEach((el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !countersStarted) {
      countersStarted = true;
      animateCounters();
    }
  });
}, { threshold: 0.4 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// Apparition au scroll pour les cartes
const revealTargets = document.querySelectorAll(
  '.service-card, .step, .price-card, .temoignage-card, .avantage-item'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  revealObserver.observe(el);
});

// Formulaire de contact artisans — envoi vers le même backend Google Sheets
// que le formulaire de capture de leads (voir js/config.js et apps-script/Code.gs)
const form = document.getElementById('leadForm');
const formNote = document.getElementById('formNote');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const nom = data.get('nom')?.toString().trim();
  const email = data.get('email')?.toString().trim();
  const telephone = data.get('telephone')?.toString().trim();
  const secteur = data.get('secteur')?.toString().trim();

  if (!nom || !email || !telephone || !secteur) {
    formNote.textContent = 'Merci de remplir tous les champs obligatoires.';
    formNote.className = 'form-note error';
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    formNote.textContent = 'Merci de saisir une adresse email valide.';
    formNote.className = 'form-note error';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours...';

  const payload = new URLSearchParams();
  data.forEach((value, key) => payload.append(key, value.toString()));
  payload.append('dateSoumission', new Date().toISOString());

  try {
    if (typeof LEAD_ENDPOINT_URL === 'undefined' || LEAD_ENDPOINT_URL.includes('REMPLACER_PAR_VOTRE_URL_WEB_APP')) {
      throw new Error('endpoint-not-configured');
    }

    // mode 'no-cors' : Google Apps Script ne renvoie pas d'en-têtes CORS,
    // la requête part bien mais la réponse n'est pas lisible ici.
    await fetch(LEAD_ENDPOINT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload.toString(),
    });

    formNote.textContent = `Merci ${nom} ! Votre demande a bien été enregistrée, nous revenons vers vous sous 24h ouvrées.`;
    formNote.className = 'form-note success';
    form.reset();
  } catch (err) {
    if (err.message === 'endpoint-not-configured') {
      formNote.textContent = "Configuration en attente : ajoutez votre URL Google Apps Script dans js/config.js (voir README).";
    } else {
      formNote.textContent = 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.';
    }
    formNote.className = 'form-note error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer ma demande';
  }
});

// Année dynamique dans le footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
