/**
 * RenovRenta — script à coller dans Google Sheets (Extensions > Apps Script)
 *
 * 1. Reçoit les demandes envoyées par le site et les ajoute dans l'onglet « Leads ».
 * 2. Ajoute un menu « RenovRenta » : factures du mois, livre des recettes, test.
 *
 * Seule ligne à modifier : EMAIL_NOTIFICATION (votre email, ou '' pour ne rien recevoir).
 */
const CONFIG = {
  EMAIL_NOTIFICATION: '',           // ex. 'vous@gmail.com'
  ONGLET_LEADS: 'Leads',
  ONGLET_FACTURES: 'Factures',
  ONGLET_ARTISANS: 'Artisans',
  ONGLET_RECETTES: 'Livre des recettes',
  ONGLET_PARAMETRES: 'Paramètres',
  ONGLET_PROSPECTS: 'Prospects artisans',
  FUSEAU: 'Europe/Paris'
};

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

/* ============================== RÉCEPTION DES LEADS ============================== */

function doGet() {
  return ContentService.createTextOutput("RenovRenta : le script fonctionne.");
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return reponse_({ ok: true });                 // piège à robots (champ caché du site)
  if (p.formulaire === 'artisan') return reponse_(enregistrerProspectArtisan_(p));
  const resultat = enregistrerLead_(p);
  return reponse_(resultat);
}

function enregistrerLead_(p) {
  const tel = nettoyerTel_(p.telephone);
  const cp = String(p.code_postal || '').trim();
  if (!tel) return { ok: false, erreur: 'Téléphone invalide' };
  if (!/^\d{5}$/.test(cp)) return { ok: false, erreur: 'Code postal invalide' };
  if (p.consentement !== 'oui') return { ok: false, erreur: 'Consentement manquant' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ONGLET_LEADS);
    const col = colonnes_(sh);
    const derniere = sh.getLastRow();
    const ligne = derniere + 1;

    let doublon = 'Non';
    if (derniere > 1 && col['Téléphone']) {
      const tels = sh.getRange(2, col['Téléphone'], derniere - 1, 1).getDisplayValues();
      if (tels.some(function (t) { return nettoyerTel_(t[0]) === tel; })) doublon = 'Oui';
    }

    const maintenant = new Date();
    const id = 'L' + Utilities.formatDate(maintenant, CONFIG.FUSEAU, 'yyMMdd') + '-' + String(ligne - 1).padStart(4, '0');
    const valeurs = {
      'ID': id,
      'Date réception': maintenant,
      'Prénom': p.prenom,
      'Nom': p.nom,
      'Téléphone': tel,
      'Email': p.email,
      'Code postal': "'" + cp,
      'Département': "'" + departement_(cp),
      'Ville': p.ville,
      'Type de travaux': p.type_travaux,
      'Type de logement': p.type_logement,
      'Statut occupant': p.statut_occupant,
      'Surface (m²)': p.surface,
      'Budget': p.budget,
      'Délai': p.delai,
      'Description': p.description,
      'Consentement': 'Oui – ' + Utilities.formatDate(maintenant, CONFIG.FUSEAU, 'dd/MM/yyyy HH:mm'),
      'Source': p.source || 'site',
      'Statut': 'Nouveau',
      'Doublon ?': doublon
    };

    const rangee = new Array(sh.getLastColumn()).fill('');
    Object.keys(valeurs).forEach(function (k) {
      if (col[k]) rangee[col[k] - 1] = securiser_(valeurs[k]);
    });
    sh.getRange(ligne, 1, 1, rangee.length).setValues([rangee]);
    ecrireFormules_(sh, col, ligne);

    notifier_(valeurs, doublon);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

/** Formules automatiques de la ligne : prix, payé, date de paiement. */
function ecrireFormules_(sh, col, r) {
  const L = function (nom) { return lettre_(col[nom]); };
  const art = L('Artisan acheteur') + r, type = L('Type de travaux') + r, fac = L('N° facture') + r, paye = L('Payé ?') + r;
  const prixArtisan = 'INDEX(Artisans!$J:$J,MATCH(' + art + ',Artisans!$B:$B,0))';
  sh.getRange(r, col['Prix de vente HT']).setFormula(
    '=IF(' + art + '="","",IF(IFERROR(' + prixArtisan + ',"")<>"",' + prixArtisan +
    ',IFERROR(INDEX(\'Paramètres\'!$F:$F,MATCH(' + type + ',\'Paramètres\'!$E:$E,0)),"")))');
  sh.getRange(r, col['Payé ?']).setFormula(
    '=IF(' + fac + '="","Non",IF(IFERROR(INDEX(Factures!$J:$J,MATCH(' + fac + ',Factures!$A:$A,0)),"")="Oui","Oui","Non"))');
  sh.getRange(r, col['Date paiement']).setFormula(
    '=IF(' + paye + '="Oui",INDEX(Factures!$K:$K,MATCH(' + fac + ',Factures!$A:$A,0)),"")')
    .setNumberFormat('dd/mm/yyyy');
  sh.getRange(r, col['Date réception']).setNumberFormat('dd/mm/yyyy hh:mm');
}

function notifier_(v, doublon) {
  if (!CONFIG.EMAIL_NOTIFICATION) return;
  try {
    const sujet = "Nouveau lead " + (v['Type de travaux'] || '') + ' – ' + String(v['Code postal']).replace("'", '') +
      (doublon === 'Oui' ? ' (DOUBLON)' : '');
    const corps = Object.keys(v).map(function (k) {
      return k + ' : ' + (v[k] instanceof Date ? Utilities.formatDate(v[k], CONFIG.FUSEAU, 'dd/MM/yyyy HH:mm') : String(v[k] || '').replace(/^'/, ''));
    }).join('\n') + '\n\nOuvrir le fichier : ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
    MailApp.sendEmail(CONFIG.EMAIL_NOTIFICATION, sujet, corps);
  } catch (err) {
    console.error('Email non envoyé : ' + err);
  }
}

/* ============================== ARTISANS INTÉRESSÉS (page artisans.html) ============================== */

const ENTETES_PROSPECTS = ['Date', 'Entreprise', 'Contact', 'Téléphone', 'Email', 'SIRET', 'Métiers', 'Départements',
  'Volume souhaité', 'Source', 'Statut', 'Notes'];

function enregistrerProspectArtisan_(p) {
  const tel = nettoyerTel_(p.telephone);
  if (!tel) return { ok: false, erreur: 'Téléphone invalide' };
  if (!p.entreprise) return { ok: false, erreur: 'Entreprise manquante' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(CONFIG.ONGLET_PROSPECTS);
    if (!sh) {
      sh = ss.insertSheet(CONFIG.ONGLET_PROSPECTS);
      sh.getRange(1, 1, 1, ENTETES_PROSPECTS.length).setValues([ENTETES_PROSPECTS]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const col = colonnes_(sh);
    const maintenant = new Date();
    const v = {
      'Date': maintenant, 'Entreprise': p.entreprise, 'Contact': p.contact, 'Téléphone': tel, 'Email': p.email,
      'SIRET': p.siret ? "'" + String(p.siret).replace(/\D/g, '') : '', 'Métiers': p.metiers, 'Départements': p.departements,
      'Volume souhaité': p.volume, 'Source': p.source || 'site pro', 'Statut': 'À rappeler'
    };
    const rangee = new Array(sh.getLastColumn()).fill('');
    Object.keys(v).forEach(function (k) { if (col[k]) rangee[col[k] - 1] = securiser_(v[k]); });
    sh.getRange(sh.getLastRow() + 1, 1, 1, rangee.length).setValues([rangee]);
    if (CONFIG.EMAIL_NOTIFICATION) {
      try {
        MailApp.sendEmail(CONFIG.EMAIL_NOTIFICATION, 'Nouvel artisan intéressé : ' + p.entreprise,
          Object.keys(v).map(function (k) { return k + ' : ' + (v[k] instanceof Date ? Utilities.formatDate(v[k], CONFIG.FUSEAU, 'dd/MM/yyyy HH:mm') : String(v[k] || '').replace(/^'/, '')); }).join('\n'));
      } catch (err) { console.error(err); }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ============================== MENU ============================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu("RenovRenta")
    .addItem('Créer les factures du mois dernier', 'facturesMoisDernier')
    .addItem('Créer les factures du mois en cours', 'facturesMoisEnCours')
    .addItem('Mettre à jour le livre des recettes', 'majLivreRecettes')
    .addSeparator()
    .addItem('Tester : ajouter un lead fictif', 'testLead')
    .addToUi();
}

function facturesMoisDernier() {
  const a = new Date();
  creerFactures_(new Date(a.getFullYear(), a.getMonth() - 1, 1), new Date(a.getFullYear(), a.getMonth(), 1));
}

function facturesMoisEnCours() {
  const a = new Date();
  creerFactures_(new Date(a.getFullYear(), a.getMonth(), 1), new Date(a.getFullYear(), a.getMonth() + 1, 1));
}

/** Une facture par artisan pour les leads vendus sur la période et pas encore facturés. */
function creerFactures_(debut, fin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shL = ss.getSheetByName(CONFIG.ONGLET_LEADS);
  const shF = ss.getSheetByName(CONFIG.ONGLET_FACTURES);
  const cL = colonnes_(shL), cF = colonnes_(shF);
  const nb = shL.getLastRow() - 1;
  if (nb < 1) return alerte_('Aucun lead dans le fichier.');

  const data = shL.getRange(2, 1, nb, shL.getLastColumn()).getValues();
  const parArtisan = {};
  data.forEach(function (row, i) {
    const artisan = row[cL['Artisan acheteur'] - 1];
    const dateVente = row[cL['Date de vente'] - 1];
    const prix = row[cL['Prix de vente HT'] - 1];
    const facture = row[cL['N° facture'] - 1];
    if (!artisan || facture || !(dateVente instanceof Date)) return;
    if (typeof prix !== 'number' || prix <= 0) return;
    if (dateVente < debut || dateVente >= fin) return;
    (parArtisan[artisan] = parArtisan[artisan] || []).push({ i: i, prix: prix });
  });

  const artisans = Object.keys(parArtisan);
  if (!artisans.length) {
    return alerte_('Aucun lead vendu à facturer en ' + MOIS[debut.getMonth()] + ' ' + debut.getFullYear() +
      '.\n\nVérifiez que chaque lead vendu a : un artisan, une date de vente et un prix.');
  }

  const prm = parametres_(ss);
  const tvaOn = String(prm['TVA applicable ?'] || 'Non').toLowerCase() === 'oui';
  const taux = Number(prm['Taux de TVA']) || 0;
  const delai = Number(prm['Délai de paiement (jours)']) || 30;
  const aujourdhui = new Date();
  const annee = aujourdhui.getFullYear();
  let numero = prochainNumero_(shF, annee);
  const periode = MOIS[debut.getMonth()] + ' ' + debut.getFullYear();
  const creees = [];

  artisans.sort().forEach(function (artisan) {
    const lignes = parArtisan[artisan];
    const ht = arrondi_(lignes.reduce(function (s, x) { return s + x.prix; }, 0));
    const tva = tvaOn ? arrondi_(ht * taux) : 0;
    const num = 'FA-' + annee + '-' + String(numero++).padStart(4, '0');
    const echeance = new Date(aujourdhui.getTime() + delai * 86400000);
    const v = {
      'N° facture': num, 'Date facture': aujourdhui, 'Artisan': artisan, 'Période': periode,
      'Nb leads': lignes.length, 'Total HT': ht, 'TVA': tva, 'Total TTC': arrondi_(ht + tva),
      'Échéance': echeance, 'Payée ?': 'Non'
    };
    const rangee = new Array(shF.getLastColumn()).fill('');
    Object.keys(v).forEach(function (k) { if (cF[k]) rangee[cF[k] - 1] = v[k]; });
    shF.getRange(shF.getLastRow() + 1, 1, 1, rangee.length).setValues([rangee]);
    lignes.forEach(function (x) { shL.getRange(x.i + 2, cL['N° facture']).setValue(num); });
    creees.push(num + ' – ' + artisan + ' – ' + lignes.length + ' lead(s) – ' + v['Total TTC'].toFixed(2) + ' €');
  });

  alerte_(creees.length + ' facture(s) créée(s) :\n\n' + creees.join('\n') +
    "\n\nPour l'envoyer : onglet « Facture », tapez le numéro, puis Fichier > Télécharger > PDF.");
}

/** Reconstruit le livre des recettes à partir des factures payées. */
function majLivreRecettes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shF = ss.getSheetByName(CONFIG.ONGLET_FACTURES);
  const shR = ss.getSheetByName(CONFIG.ONGLET_RECETTES);
  const cF = colonnes_(shF);
  const nb = shF.getLastRow() - 1;
  const lignes = [];
  if (nb > 0) {
    shF.getRange(2, 1, nb, shF.getLastColumn()).getValues().forEach(function (r) {
      const payee = String(r[cF['Payée ?'] - 1]).toLowerCase() === 'oui';
      const date = r[cF['Date paiement'] - 1];
      if (!payee || !(date instanceof Date)) return;
      lignes.push([date, r[cF['N° facture'] - 1], r[cF['Artisan'] - 1],
        'Vente de contacts qualifiés (leads) – ' + r[cF['Période'] - 1],
        r[cF['Total TTC'] - 1], r[cF['Mode de règlement'] - 1] || '']);
    });
  }
  lignes.sort(function (a, b) { return a[0] - b[0]; });
  const maxR = Math.max(shR.getLastRow(), 2);
  shR.getRange(2, 1, maxR - 1, 6).clearContent();
  if (lignes.length) {
    shR.getRange(2, 1, lignes.length, 6).setValues(lignes);
    shR.getRange(2, 1, lignes.length, 1).setNumberFormat('dd/mm/yyyy');
    shR.getRange(2, 5, lignes.length, 1).setNumberFormat('#,##0.00 €');
  }
  alerte_('Livre des recettes mis à jour : ' + lignes.length + ' encaissement(s).');
}

function testLead() {
  const r = enregistrerLead_({
    prenom: 'TEST', nom: 'À SUPPRIMER', telephone: '06 00 00 00 00', email: 'test@example.com',
    code_postal: '75011', ville: 'Paris', type_travaux: 'Isolation', type_logement: 'Maison',
    statut_occupant: 'Propriétaire', surface: '80 à 120 m²', delai: 'Dans les 3 mois',
    description: 'Lead de test créé depuis le menu', consentement: 'oui', source: 'test'
  });
  alerte_(r.ok ? 'Lead de test ajouté (' + r.id + ') dans l\'onglet Leads. Pensez à le supprimer.' : 'Erreur : ' + r.erreur);
}

/* ============================== OUTILS ============================== */

function colonnes_(sh) {
  const entetes = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  entetes.forEach(function (h, i) { if (h) map[String(h).trim()] = i + 1; });
  return map;
}

function parametres_(ss) {
  const sh = ss.getSheetByName(CONFIG.ONGLET_PARAMETRES);
  const v = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  const map = {};
  v.forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  return map;
}

function prochainNumero_(shF, annee) {
  const n = shF.getLastRow() - 1;
  let max = 0;
  if (n > 0) {
    shF.getRange(2, 1, n, 1).getValues().forEach(function (r) {
      const m = String(r[0]).match(/^FA-(\d{4})-(\d+)$/);
      if (m && Number(m[1]) === annee) max = Math.max(max, Number(m[2]));
    });
  }
  return max + 1;
}

function nettoyerTel_(t) {
  let s = String(t || '').replace(/[^\d+]/g, '');
  if (s.indexOf('+33') === 0) s = '0' + s.slice(3);
  else if (s.indexOf('0033') === 0) s = '0' + s.slice(4);
  if (!/^0[1-9]\d{8}$/.test(s)) return '';
  return s.replace(/(\d{2})(?=\d)/g, '$1 ');
}

function departement_(cp) {
  if (/^97|^98/.test(cp)) return cp.slice(0, 3);
  if (cp.indexOf('20') === 0) return Number(cp) < 20200 ? '2A' : '2B';
  return cp.slice(0, 2);
}

function securiser_(v) {
  if (v instanceof Date || typeof v === 'number') return v;
  let s = String(v == null ? '' : v).trim().slice(0, 2000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;            // empêche l'injection de formules
  return s;
}

function lettre_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function arrondi_(x) { return Math.round(x * 100) / 100; }

function alerte_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
}

function reponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
