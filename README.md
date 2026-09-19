# LeadRénov' — Site vitrine + système de génération de leads

Site statique (HTML/CSS/JS, sans dépendances) pour une activité de vente de leads qualifiés destinés aux artisans RGE dans trois secteurs : **pompes à chaleur**, **isolation thermique** et **panneaux solaires**.

Le projet contient deux briques complémentaires :

1. **`index.html`** — le site vitrine B2B : il présente votre offre aux **artisans** qui achètent des leads chez vous.
2. **`demande-devis.html`** — la page de **capture de leads** : c'est ici que les **particuliers** (via vos campagnes pub, Google/Facebook Ads, etc.) déposent leur demande de devis. Chaque soumission devient un lead que vous pourrez ensuite revendre à vos contacts artisans.

## Structure

```
├── index.html            # Site vitrine B2B (présentation, tarifs, contact artisans)
├── demande-devis.html    # Landing page de capture de leads (particuliers)
├── css/
│   ├── style.css         # Styles communs (design, variables CSS)
│   └── lead-form.css     # Styles du formulaire multi-étapes de capture de lead
├── js/
│   ├── script.js         # Comportements du site vitrine (menu, compteurs, formulaire contact)
│   └── lead-form.js       # Logique du formulaire de capture + envoi vers Google Sheets
├── apps-script/
│   └── Code.gs            # Backend "no-code" (Google Apps Script) : stockage + notification email
└── img/
```

## Système de génération de leads (sans backend à héberger)

Le formulaire de `demande-devis.html` envoie chaque demande vers un **Google Sheet**, via un script Google Apps Script qui fait office de backend gratuit (pas de serveur à gérer). Vous recevez :

- **Un email de notification instantané** à chaque nouveau lead.
- **Toutes vos données dans un Google Sheet**, filtrables/triables, exportables en CSV pour être envoyées à vos contacts artisans.

### Mise en place (10 minutes, une seule fois)

1. **Créer le Google Sheet**
   Allez sur [sheets.google.com](https://sheets.google.com) → créez une feuille vide → renommez-la par ex. `Leads LeadRénov'`.

2. **Ajouter le script**
   Dans le Sheet : `Extensions` → `Apps Script`. Supprimez le contenu par défaut et collez le contenu du fichier [`apps-script/Code.gs`](apps-script/Code.gs) de ce repo.

3. **Configurer votre email**
   Dans le script collé, modifiez la ligne :
   ```js
   const OWNER_EMAIL = 'votre-email@exemple.fr';
   ```
   avec l'adresse qui doit recevoir les notifications de nouveaux leads.

4. **Déployer comme application Web**
   Dans l'éditeur Apps Script : `Déployer` → `Nouveau déploiement` → type **Application Web**.
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   Cliquez sur `Déployer`, autorisez les permissions demandées (c'est votre propre script), puis **copiez l'URL de l'application Web** fournie (elle se termine par `/exec`).

5. **Connecter le formulaire du site**
   Ouvrez [`js/lead-form.js`](js/lead-form.js) et remplacez :
   ```js
   const LEAD_ENDPOINT_URL = 'REMPLACER_PAR_VOTRE_URL_WEB_APP';
   ```
   par l'URL copiée à l'étape précédente. Enregistrez, commitez et déployez le site.

6. **Tester**
   Ouvrez `demande-devis.html`, remplissez le formulaire de test. Vous devez recevoir un email et voir une nouvelle ligne apparaître dans l'onglet `Leads` du Google Sheet.

> ⚠️ Si vous modifiez `Code.gs` plus tard, il faut créer un **nouveau déploiement** (ou gérer les déploiements existants) dans Apps Script pour que les changements soient pris en compte par l'URL publiée.

### Revendre vos leads à vos contacts

Le Google Sheet contient deux colonnes prévues à cet effet :

- **`etat`** : passez-la de `Nouveau` à `Contacté` ou `Vendu` au fur et à mesure.
- **`venduA`** : indiquez le nom du contact/artisan à qui le lead a été vendu.

Pour préparer un envoi à un contact : filtrez le Sheet par secteur (`projet`) et zone (`codePostal`), sélectionnez les lignes concernées, puis `Fichier` → `Télécharger` → `Valeurs séparées par une virgule (.csv)` pour obtenir un fichier prêt à transmettre.

### Suivre l'origine de vos leads (campagnes publicitaires)

La landing page capte automatiquement les paramètres `utm_source` et `utm_campaign` de l'URL. Exemple de lien à utiliser dans vos publicités :

```
https://votresite.fr/demande-devis.html?utm_source=facebook&utm_campaign=pac-hiver
```

Cette information est enregistrée dans la colonne `source` du Google Sheet.

## Utiliser le site en local

Aucune installation nécessaire : ouvrez directement les fichiers `.html` dans un navigateur, ou servez le dossier avec un serveur statique :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Personnalisation rapide

- **Textes / offres / tarifs** (site vitrine) : à modifier dans `index.html`.
- **Questions du formulaire de capture** : à modifier dans `demande-devis.html` (et les colonnes correspondantes dans `apps-script/Code.gs`).
- **Couleurs** : variables CSS en haut de `css/style.css` (`--orange`, `--green`, `--blue`, `--navy`...).
- **Formulaire de contact artisans** (`index.html`) : `js/script.js` simule actuellement l'envoi. Vous pouvez le connecter au même système Google Sheets, ou à un service comme Formspree/EmailJS.
- **Logo / favicon** : le logo est en texte (`LeadRénov'`), à remplacer par une image si besoin.

## Déploiement

Le site est 100% statique : il peut être déployé tel quel sur GitHub Pages, Netlify, Vercel ou tout hébergeur classique. Le stockage des leads (Google Sheets + Apps Script) ne nécessite aucun serveur à maintenir.
