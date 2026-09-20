# RenovRenta — site complet (dépôt Elya1234/Leade)

Adresse : https://elya1234.github.io/Leade/

| Fichier | Rôle |
|---|---|
| **config.js** | **Le seul fichier à modifier** : adresse du script Google, email, société, Google Ads |
| ux.css, ux.js | Animations et finitions (partagées par les deux pages) |
| index.html | Page particuliers : formulaire de demande de devis (les leads) |
| artisans.html | Page professionnels : vente des leads, formulaire « être rappelé » |
| Code.gs | Script à coller dans Google Sheets (Extensions > Apps Script) |
| sitemap.xml, robots.txt | Référencement Google |
| 404.html, og-image.png, favicon.svg, apple-touch-icon.png | Page d'erreur, image de partage, icônes |

Ces fichiers remplacent l'ancien site du dépôt (index.html vitrine artisans, demande-devis.html, js/config.js) :
supprimez ces anciens fichiers pour éviter les doublons.

## Mise en ligne
0. Nom de domaine conseillé : renovrenta.fr (libre au 20/09/2026) pour l'email renovrenta@gmail.com.
1. Envoyer tous les fichiers à la racine de la branche `leade`.
2. Settings > Pages > Deploy from a branch > `leade` / `(root)` > Save.

## Recevoir les leads par email (déjà actif)
Chaque demande est envoyée à renovrenta@gmail.com (réglage EMAIL_LEADS dans config.js, via FormSubmit).
La toute première fois : envoyez une demande de test depuis le site en ligne, puis cliquez sur « Activate Form »
dans l'email reçu de FormSubmit (regardez aussi dans les spams). Ensuite, chaque lead arrive par email.

## En plus : enregistrer les leads dans Google Sheets (conseillé)
1. Importer RenovRenta_Donnees.xlsx dans Google Sheets (Fichier > Importer > Remplacer).
2. Extensions > Apps Script : coller Code.gs, mettre votre email dans EMAIL_NOTIFICATION, Enregistrer.
3. Déployer > Nouveau déploiement > Application Web > Exécuter en tant que : Moi > Accès : Tout le monde.
4. Coller l'URL (.../exec) dans config.js à la place de `COLLEZ_ICI_L_ADRESSE_DU_SCRIPT`.

## Indexation Google
1. search.google.com/search-console > Ajouter une propriété > Préfixe de l'URL > https://elya1234.github.io/Leade/
2. Méthode « Balise HTML » : coller le code dans index.html à la place de `CODE_GOOGLE`, publier, Valider.
3. Sitemaps : `sitemap.xml` > Envoyer. Puis Inspection de l'URL > Demander l'indexation.

## À compléter dès que la société est créée
config.js > SOCIETE : forme, capital, SIREN, RCS, adresse, dirigeant. En attendant, le site affiche
« société en cours d'immatriculation ».
