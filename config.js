/* ==========================================================================
   RenovRenta — RÉGLAGES DU SITE (le seul fichier à modifier)
   Utilisé par index.html (particuliers) et artisans.html (professionnels).
   ========================================================================== */
window.RENOVRENTA = {
  // 1. Adresse du script Google (Apps Script > Déployer > Application Web), se termine par /exec
  SCRIPT_URL: 'COLLEZ_ICI_L_ADRESSE_DU_SCRIPT',

  // 2. Nombre maximum de professionnels à qui chaque demande est transmise
  NB_PROS: 3,

  // 3. Contact affiché sur le site
  NOM_MARQUE: "RenovRenta",
  EMAIL: 'contact@renovrenta.fr',
  TELEPHONE: '',              // ex. '01 84 00 00 00' — laisser vide pour ne pas afficher de numéro

  // 4. Société (mentions légales). Tant que le SIREN est vide, le site affiche
  //    « Société en cours d'immatriculation ». À compléter dès réception du Kbis.
  SOCIETE: {
    RAISON_SOCIALE: "RenovRenta",
    FORME: '',                // ex. 'SASU'
    CAPITAL: '',              // ex. '1 000 €'
    SIREN: '',                // ex. '123 456 789'
    RCS: '',                  // ex. 'RCS Paris'
    ADRESSE: '',              // adresse du siège
    DIRIGEANT: ''             // directeur de la publication
  },

  // 5. Mesure des publicités (facultatif, chargée seulement si le visiteur accepte les cookies)
  GOOGLE_ADS_ID: '',          // ex. 'AW-123456789'
  GOOGLE_ADS_CONVERSION: '',  // libellé de conversion Google Ads, ex. 'AbCdEfGhIjK'
  GA4_ID: '',                 // ex. 'G-XXXXXXXXXX'

  // 6. Hébergeur du site
  HEBERGEUR: 'GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (GitHub Pages)'
};

/* Remplit automatiquement les informations légales et de contact des pages */
(function () {
  var C = window.RENOVRENTA, S = C.SOCIETE;
  function remplir() {
    var societe = S.SIREN
      ? [S.RAISON_SOCIALE, S.FORME, S.CAPITAL ? 'au capital de ' + S.CAPITAL : '', S.RCS ? S.RCS + ' ' + S.SIREN : 'SIREN ' + S.SIREN].filter(Boolean).join(', ')
      : S.RAISON_SOCIALE + ' – société en cours d\'immatriculation';
    var v = {
      'societe': societe,
      'adresse': S.ADRESSE || 'Adresse du siège communiquée dès l\'immatriculation',
      'dirigeant': S.DIRIGEANT || 'le représentant légal de ' + S.RAISON_SOCIALE,
      'email': C.EMAIL,
      'hebergeur': C.HEBERGEUR,
      'telephone': C.TELEPHONE
    };
    document.querySelectorAll('[data-legal]').forEach(function (el) { el.textContent = v[el.getAttribute('data-legal')] || ''; });
    document.querySelectorAll('[data-email]').forEach(function (el) { el.textContent = C.EMAIL; if (el.tagName === 'A') el.href = 'mailto:' + C.EMAIL; });
    document.querySelectorAll('[data-si-tel]').forEach(function (el) { el.hidden = !C.TELEPHONE; });
    document.querySelectorAll('.nb-pros').forEach(function (el) { el.textContent = C.NB_PROS; });
    document.querySelectorAll('.nom-marque').forEach(function (el) { el.textContent = C.NOM_MARQUE; });
    document.querySelectorAll('.annee').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', remplir); else remplir();
})();
