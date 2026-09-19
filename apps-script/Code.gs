/**
 * LeadRénov' — Réception des leads du formulaire "demande-devis.html"
 *
 * À installer dans le Google Sheet qui sert de base de leads :
 * Extensions > Apps Script > coller ce fichier > Déployer > Nouveau déploiement > Application Web.
 * Voir le README à la racine du repo pour la procédure complète pas à pas.
 */

// Email qui reçoit une notification à chaque nouveau lead.
const OWNER_EMAIL = 'votre-email@exemple.fr';

// Nom de l'onglet du Google Sheet où stocker les leads.
const SHEET_NAME = 'Leads';

// Ordre des colonnes dans la feuille (doit correspondre aux champs du formulaire).
const COLUMNS = [
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
  'etat',     // colonne à remplir manuellement : Nouveau / Contacté / Vendu
  'venduA',   // colonne à remplir manuellement : nom du contact/artisan à qui le lead a été revendu
];

function doPost(e) {
  const sheet = getOrCreateSheet();
  const data = e.parameter;

  const row = COLUMNS.map((key) => {
    if (key === 'etat') return 'Nouveau';
    if (key === 'venduA') return '';
    return data[key] || '';
  });

  sheet.appendRow(row);

  notifyOwner(data);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function notifyOwner(data) {
  const subject = `Nouveau lead : ${data.projet || 'Projet'} — ${data.prenom || ''} ${data.nom || ''}`;
  const body = [
    'Un nouveau lead vient d\'être reçu :',
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
