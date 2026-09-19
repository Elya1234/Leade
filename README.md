# LeadRénov' — Site vitrine

Site vitrine statique (HTML/CSS/JS, sans dépendances) pour une activité de vente de leads qualifiés destinés aux artisans RGE dans trois secteurs : **pompes à chaleur**, **isolation thermique** et **panneaux solaires**.

## Structure

```
lead-generation-site/
├── index.html      # Page unique : hero, services, process, avantages, tarifs, témoignages, contact, footer
├── css/style.css   # Styles (design responsive, variables CSS)
├── js/script.js    # Menu mobile, compteurs animés, animations au scroll, validation du formulaire
└── img/            # Dossier pour vos futures images/photos
```

## Utiliser le site

Aucune installation nécessaire : ouvrez simplement `index.html` dans un navigateur, ou servez le dossier avec n'importe quel serveur statique :

```bash
cd lead-generation-site
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Personnalisation rapide

- **Textes / offres / tarifs** : à modifier directement dans `index.html`.
- **Couleurs** : variables CSS en haut de `css/style.css` (`--orange`, `--green`, `--blue`, `--navy`...).
- **Formulaire de contact** : `js/script.js` simule actuellement l'envoi (aucun backend connecté). Pour recevoir réellement les demandes, branchez un service comme Formspree, EmailJS ou votre propre API dans le gestionnaire d'événement `submit` du formulaire.
- **Logo / favicon** : le logo est en texte (`LeadRénov'`), à remplacer par une image si besoin dans `index.html`.

## Déploiement

Le site est 100% statique : il peut être déployé tel quel sur GitHub Pages, Netlify, Vercel ou tout hébergeur classique.
