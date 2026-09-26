# Notes de travail — frises historiques

À lire au début de chaque nouvelle session : consignes du propriétaire du projet et façon de travailler.
Dépôt `Bolotaure/Fiches`, branche `main`.
**Projet privé** : le dépôt doit être privé et le site n'est partagé qu'avec les personnes choisies par le propriétaire
(Cloudflare Pages, projet `fiches-memo`, protégé par mot de passe : `functions/_middleware.js`, identifiants dans la variable secrète
`SITE_USERS` de Cloudflare, jamais dans le dépôt ; « Fail open/closed » doit rester sur **Fail closed**). Ne jamais écrire l'adresse du site, du dépôt ou l'e-mail du
propriétaire dans le code, les pages, les requêtes vers d'autres services (User-Agent…) ni les messages de commit.
Migration en cours : GitHub Pages à désactiver et dépôt à passer en privé une fois la protection Cloudflare vérifiée.

## Le projet
- Frises historiques interactives pour enfants d'environ 10 ans, en **français, anglais et japonais**.
- 7 frises (clé du thème = dossier de données = ancre d'URL) :
  | Frise | Clé | Données | Cartes |
  |---|---|---|---|
  | Histoire du christianisme | `christianity` | `data/` | 52 |
  | Histoire du Japon | `japan` | `data/japan/` | 50 |
  | Histoire de France | `france` | `data/france/` | 50 |
  | Histoire des États-Unis | `usa` | `data/usa/` | 50 |
  | La Révolution française | `revolution` | `data/revolution/` | 50 |
  | La conquête de l'espace | `space` | `data/space/` | 50 |
  | Le temps de la République (CM2, thème 1) | `republique` | `data/republique/` | 37 |
- Une seule page : `index.html` (CSS et JS intégrés). Chaque frise est déclarée dans l'objet `THEMES` (dossier, couleurs des périodes, titres et noms de périodes dans les 3 langues).
- Les données (`data/`) et les images (`images/`) sont lues en chemins relatifs, à côté de la page : le site marche quelle que soit son adresse. `_headers` (Cloudflare) : noindex et no-referrer.

## Consignes du propriétaire (à respecter)
1. **Les traductions traduisent, un point c'est tout.** Le français est la référence. L'anglais et le japonais disent exactement la même chose : pas d'ajouts « pour lecteurs japonais » (exemples du Japon, noms japonais…), pas de phrases supprimées ou remplacées. Seule exception tolérée : une courte précision de vocabulaire dans le glossaire (ex. « イースター（復活祭）»).
2. **Public de 10 ans** : phrases simples, vocabulaire expliqué par les mots soulignés, événements sombres racontés honnêtement mais sobrement.
3. **Dates approximatives** : préfixe `~` (ex. `~1000`, `~17 000 av. J.-C.`), jamais « v. », « vers » ou « c. ».
4. **Pas de carte Thomas Pesquet**, et pas de « SpaceX » dans les titres des cartes (SpaceX reste cité dans le texte des cartes fusées réutilisables et Starship).
5. **Mise en page validée** (ne pas revenir en arrière sans demande) :
   - titre des cartes en doré (`var(--gold)`) ;
   - pas de boutons « Avant / Après » ni de phrases d'aide en bas des cartes ; navigation par les flèches latérales et le balayage ;
   - icône porte + main (5 doigts) en haut à gauche des cartes et en bas des mini-cartes (au lieu du texte « touche pour revenir ») ;
   - icône de balayage (main à 5 doigts) de 30 px en bas au centre de la frise, qui s'efface quand un repère passe dessous ;
   - téléphone en paysage : écran « Tourne ton téléphone » (le verrouillage en portrait est impossible sur iPhone) ;
   - menus thème/langue au style « verre » ; titre de frise sur 2 lignes réservées ;
   - cartes avec illustration dessinée (`art`) : zone d'image au format 16/9 sans fond flouté ; icône image + main (en haut à droite) qui ouvre l'image Wikipédia dans une mini-carte, avec la mention « Image : Wikimedia Commons » ;
   - légende, auteur, licence et lien Commons de l'image Wikipédia sous l'image dans la mini-carte (champs `picCap`, `picBy`, `picLic`, fait pour la frise République ; à faire pour les autres frises au moment de leurs dessins) ;
   - bouton à droite de la mini-frise (rond coché + flèches) : fait glisser la frise jusqu'au repère de la carte en cours ; grisé tant qu'aucune carte n'a été ouverte ;
   - la mention « générée par IA » n'est pas sur les cartes : elle est expliquée une seule fois dans « À propos » (bouton « i » de la page principale).
6. Le propriétaire écrit en français : répondre en français.

## Format des données (par frise)
- `events.json` (EN), `events.fr.json`, `events.ja.json` : même liste de cartes, **même ordre** (ordre chronologique : les repères sont placés par ordre, et les périodes doivent être contiguës).
- Champs : `id`, `y` (date affichée), `era` (clé de période définie dans `THEMES`), `icon` (emoji), `img` (titre de page Wikipédia d'origine), `image` (vignette Wikimedia, secours), `pic` (copie locale `images/<thème>/<id>.<ext>`), `art` (illustration dessinée, facultatif : `images/<thème>/<id>-dessin.jpg`), `picCap` (légende de l'image Wikipédia, traduite), `picBy` (auteur) et `picLic` (licence, `PD` = domaine public), `title`, `refs` (pages Wikipédia/Vikidia/Kiddle proposées), `text`.
- Mots soulignés : `[mot]` dans le texte → entrée `mot` (en minuscules) dans `glossary(.fr|.ja).json`. Recherche : minuscules, puis sans `s` / `es` / `x` final. Pour un autre mot-clé : `[mot affiché|clé]`. Définition en ligne possible : `[mot::définition]`.
- Français : espaces insécables avant `: ; ! ? »` et après `«`.

## Images
- Chaque carte a une image, copiée dans `images/<thème>/` (servie par GitHub Pages) avec `image` Wikimedia en secours.
- Récupération : vignette de la page Wikipédia (API REST `page/summary`), puis `python3 tools/download_images.py <thème>` qui télécharge les copies et remplit `pic`.
- Vérifier chaque image : pas de logo, drapeau, carte générique ou photo hors sujet, pas de doublon dans une même frise. Sinon chercher une autre page (souvent sur fr.wikipedia).
- Requêtes vers Wikipédia/Wikimedia (ou tout autre service) : en-tête `User-Agent` générique (`timeline-images/1.0`). **Ne jamais y mettre l'e-mail du propriétaire, ni l'adresse du site ou du dépôt.**
- Génération d'images (Grok Imagine, xAI) : la clé est fournie par les **API credentials** de l'environnement pour `api.x.ai` (en-tête `Authorization: Bearer …`, injecté automatiquement). Ne jamais écrire, afficher ni committer de clé. Réserver les images générées aux illustrations d'ambiance, pas aux portraits de personnes réelles.
- Charte des illustrations dessinées : en cours de validation par le propriétaire (essai en ligne sur la carte `rp-classe`).

## Vérifications avant chaque mise en ligne
- `node tools/check_data.js` : mêmes cartes dans les 3 langues, chaque mot souligné a sa définition, pas de définition inutilisée.
- `node tools/test_timeline.mjs` : ouvre toutes les frises dans les 3 langues (écrans 390×844 et 375×560), ouvre des cartes et des mini-cartes, vérifie l'absence d'erreurs JS et de repères qui se chevauchent (Playwright + Chromium préinstallé).
- Regarder aussi une capture d'écran quand on touche à la mise en page.
- Le site se met à jour quelques minutes après chaque publication sur `main`.

## Ajouter une frise
1. Écrire les cartes en français (référence), puis les traduire fidèlement en anglais et en japonais ; glossaires dans les 3 langues.
2. Créer `data/<clé>/events(.fr|.ja).json` et `glossary(.fr|.ja).json`.
3. Ajouter l'entrée dans `THEMES` (index.html) : `dir`, `deco`, couleurs des périodes, textes EN/FR/JA (nom, titre, sous-titre, noms des périodes).
4. Images (voir plus haut), puis `tools/check_data.js` et `tools/test_timeline.mjs`.
5. Mettre à jour `README.md` (liste des frises et ancres d'URL).
