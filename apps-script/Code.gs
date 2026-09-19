/**
 * LeadRénov' — Backend unique (Google Apps Script) pour :
 *  1. demande-devis.html  → leads de particuliers à revendre (onglet "Leads")
 *  2. index.html (contact) → demandes d'artisans intéressés par vos leads (onglet "ContactsArtisans")
 *
 * À installer dans le Google Sheet qui sert de base :
 * Extensions > Apps Script > coller ce fichier > Déployer > Nouveau déploiement > Application Web.
 * Voir le README à la racine du repo pour la procédure complète pas à pas.
 */

// Email qui reçoit une notification à chaque nouvelle soumission.
const OWNER_EMAIL = 'votre-email@exemple.fr';

// Colonnes du lead d'un particulier (demande-devis.html).
const LEAD_SHEET_NAME = 'Leads';
const LEAD_COLUMNS = [
  'dateSoumission',
  'projet',
  'statut',
  'logement',
  'codePostal',
  'delai',
  'budget',
  'prenom',
  'nom',
  'telephone',
  'email',
  'source',
  'pageUrl',
  'etat',        // à remplir manuellement : Nouveau / Contacté / Vendu
  'venduA',      // à remplir manuellement : nom du contact/artisan à qui le lead a été revendu
  'codeArtisan', // à remplir manuellement : code d'accès de l'artisan (voir onglet ContactsArtisans), pour l'espace client
];

// Colonnes d'une demande d'artisan (formulaire de contact de index.html).
const ARTISAN_SHEET_NAME = 'ContactsArtisans';
const ARTISAN_COLUMNS = [
  'dateSoumission',
  'nom',
  'entreprise',
  'email',
  'telephone',
  'secteur',
  'zone',
  'message',
  'etat',        // à remplir manuellement : Nouveau / Recontacté / Client
  'codeArtisan', // à remplir manuellement : code d'accès unique à donner à cet artisan pour son espace client
];

function doPost(e) {
  const data = e.parameter;
  const formType = data.formType === 'artisan' ? 'artisan' : 'lead';

  if (formType === 'artisan') {
    appendRow(ARTISAN_SHEET_NAME, ARTISAN_COLUMNS, data);
    notifyOwnerArtisan(data);
  } else {
    appendRow(LEAD_SHEET_NAME, LEAD_COLUMNS, data);
    notifyOwnerLead(data);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Espace client artisan : renvoie (en JSONP) les leads dont la colonne
 * `codeArtisan` correspond au code fourni en paramètre `code`.
 * Appelé depuis espace-client.html via une balise <script> (JSONP), car les
 * requêtes GET cross-origin vers Apps Script ne supportent pas le CORS classique.
 */
function doGet(e) {
  const code = (e.parameter.code || '').trim();
  const callback = e.parameter.callback;
  let payload;

  if (!code) {
    payload = { status: 'error', message: 'Code manquant.' };
  } else {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEAD_SHEET_NAME);
    const leads = [];

    if (sheet && sheet.getLastRow() > 1) {
      const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, LEAD_COLUMNS.length).getValues();
      const codeIndex = LEAD_COLUMNS.indexOf('codeArtisan');

      values.forEach((row) => {
        if (String(row[codeIndex]).trim() === code) {
          const lead = {};
          LEAD_COLUMNS.forEach((col, i) => {
            if (col === 'codeArtisan') return; // pas besoin de renvoyer le code lui-même
            lead[col] = row[i];
          });
          leads.push(lead);
        }
      });
    }

    payload = { status: 'ok', leads: leads };
  }

  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function appendRow(sheetName, columns, data) {
  const sheet = getOrCreateSheet(sheetName, columns);
  const row = columns.map((key) => {
    if (key === 'etat') return 'Nouveau';
    if (key === 'venduA') return '';
    return data[key] || '';
  });
  sheet.appendRow(row);
}

function getOrCreateSheet(sheetName, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function notifyOwnerLead(data) {
  const subject = `Nouveau lead : ${data.projet || 'Projet'} — ${data.prenom || ''} ${data.nom || ''}`;
  const body = [
    'Un nouveau lead particulier vient d\'être reçu :',
    '',
    `Projet : ${data.projet || ''}`,
    `Statut : ${data.statut || ''} — ${data.logement || ''}`,
    `Code postal : ${data.codePostal || ''}`,
    `Délai souhaité : ${data.delai || ''}`,
    `Budget : ${data.budget || 'non précisé'}`,
    '',
    `Nom : ${data.prenom || ''} ${data.nom || ''}`,
    `Téléphone : ${data.telephone || ''}`,
    `Email : ${data.email || ''}`,
    '',
    `Source : ${data.source || 'Direct'}`,
    `Page : ${data.pageUrl || ''}`,
  ].join('\n');

  MailApp.sendEmail(OWNER_EMAIL, subject, body);
}

function notifyOwnerArtisan(data) {
  const subject = `Nouvelle demande artisan : ${data.nom || ''} (${data.secteur || ''})`;
  const body = [
    'Un artisan souhaite acheter des leads :',
    '',
    `Nom : ${data.nom || ''}`,
    `Entreprise : ${data.entreprise || 'non précisée'}`,
    `Email : ${data.email || ''}`,
    `Téléphone : ${data.telephone || ''}`,
    `Secteur d'activité : ${data.secteur || ''}`,
    `Zone d'intervention : ${data.zone || 'non précisée'}`,
    '',
    `Message : ${data.message || '(aucun)'}`,
  ].join('\n');

  MailApp.sendEmail(OWNER_EMAIL, subject, body);
}
