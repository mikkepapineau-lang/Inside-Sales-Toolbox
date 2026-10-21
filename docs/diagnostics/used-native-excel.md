# Actualisation native Excel et lignes compactes

Évolution de développement de l’édition équipe, lecteur interne 1.2.6. Aucun nouveau numéro installable, ZIP ou tag.

## Utilisation

1. Ouvrir le rapport **LP Catalog - Used Gear** connecté.
2. Choisir Canada, UK, USA ou une combinaison dans le Toolbox.
3. Cliquer **Actualiser par Excel**. Le Toolbox confirme les pays, ouvre les trois points du tableau, choisit **Exporter des données → Données avec disposition actuelle → .xlsx → Exporter**, puis lit le fichier généré et actualise quantités, prix et NBV ensemble.

Ce parcours remplace le balayage des lignes par l’export natif de Power BI. Les limites et autorisations d’export du rapport continuent de s’appliquer. Les autres filtres du rapport sont conservés. Chaque combinaison garde ses relevés séparés; elle ne reprend pas les valeurs d’une autre sélection. Les valeurs sont associées aux identités du catalogue; le bilan indique les articles financiers effectivement associés.

Le fichier est lu localement au moment de sa génération. Aucun accès au dossier Téléchargements ni permission de téléchargement supplémentaire n’est ajouté. Le téléchargement normal peut encore apparaître dans Edge; il n’est pas nécessaire de choisir Enregistrer pour que la capture locale puisse être importée. Si Power BI produit son fichier autrement, désactive l’export ou change son interface, le Toolbox indique l’échec; **Importer Excel** reste disponible. Il n’utilise pas d’API interne ni de jetons Power BI.

Les empreintes SHA256 du transport et les CRC du XLSX sont contrôlés. Une sélection, des filtres ou une devise modifiés pendant l’export font refuser l’import. Un reçu local temporaire à usage unique lie le fichier et les pays confirmés. Les mises à jour régionales des quantités et des prix sont préparées puis enregistrées ensemble. Une erreur de lecture ou de validation conserve les données précédentes.

## Correctif du survol et du téléchargement Edge

La vidéo fournie montre que les trois points ne sont proposés que lorsque le pointeur entre dans le visuel. La première implémentation envoyait seulement `mouseover` puis recherchait immédiatement le bouton. Le correctif envoie les événements de pointeur et de souris dans la zone du tableau et attend jusqu’à quatre secondes son apparition effective. Il tient compte de l’opacité des ancêtres et tente aussi le focus clavier du bouton. Les menus multiples restent refusés. Les événements JavaScript ne déplacent pas le curseur physique et ne créent pas un véritable état CSS `:hover`. Après le signalement connecté du message « Les trois points du tableau restent invisibles », le lecteur active désormais directement le bouton natif lorsqu’il existe en un seul exemplaire et n’est pas désactivé, même si son affichage dépend du survol CSS. Il recherche également l’en-tête dans le conteneur extérieur du visuel. Il ne modifie ni les styles ni les droits du rapport et confirme l’ouverture du véritable menu Exporter des données avant de poursuivre. Si le bouton est absent ou ambigu, aucun export n’est lancé.

L’utilisateur a également signalé **Actualiser par Excel / Réessayer CANADA** alors qu’Edge attendait **Ouvrir / Enregistrer sous / Enregistrer**. La capture ne surveille plus seulement `URL.createObjectURL` : elle peut aussi lire le lien natif effectivement activé, y compris une URL Blob créée auparavant ou dans un worker de même origine, un lien HTTPS de téléchargement de même origine ou une ouverture de fenêtre utilisée pour cet export. Le navigateur conserve son téléchargement normal; la lecture locale vise à terminer indépendamment du choix d’enregistrement.

Les liens sont observés uniquement pendant l’export demandé, sans inventaire des téléchargements, accès aux fichiers locaux ou nouvelle permission. La taille est bornée à 25 Mo pendant la lecture, le contenu ZIP puis le parseur XLSX restent vérifiés et toutes les interceptions temporaires sont retirées à la fin, y compris en cas d’erreur ou d’arrêt. Aucun lien d’export ni donnée de la vidéo n’est enregistré dans le dépôt. Les tests reproduisent un téléchargement toujours en attente d’enregistrement; ils ne valident pas encore le mécanisme exact du rapport connecté.

Pour un poste déjà à jour avec les treize fichiers ci-dessous, **le correctif initial ne changeait que `used-export-ui.js`**, puis recharger l’extension et actualiser le rapport. Le lien de ce fichier ci-dessous est actualisé au commit du correctif.

## Détection et diagnostic de l’en-tête

Après le signalement connecté « Le bouton natif Plus d’options du tableau est absent, désactivé ou ambigu », le diagnostic transmis par l’utilisateur a confirmé le tableau dans la page principale, sans donner la structure de ses contrôles d’en-tête. La cause exacte du contrôle absent n’est donc pas encore établie.

La détection accepte maintenant aussi les rôles `menuitem`, les libellés portés par un enfant, les noms référencés par `aria-labelledby`, les titres alternatifs et les conteneurs `visualContainerHost`. Ces variantes sont vérifiées sur fixtures, pas annoncées comme observées dans le rapport connecté. Les contrôles ambigus ou désactivés restent refusés.

En cas d’échec, le worker conserve un bloc **nativeExport**, version **native-export-4**, dans le diagnostic affiché sous **Options du catalogue**. Il donne les noms et classes des contrôles et de leurs conteneurs, sans copier les cellules des produits ni les URL de téléchargement. Le nombre de candidats et de contrôles désactivés accompagne le message d’erreur. Ouvrir Options du catalogue et copier la zone de diagnostic déjà remplie après l’échec; ne pas recliquer Diagnostic Power BI avant la copie, car cette commande produit un autre diagnostic général.

**Pour cette mise à jour, remplacer les deux fichiers `used-export-ui.js` et `used-powerbi-worker.js`, puis recharger l’extension et le rapport.** Le worker est nécessaire pour conserver le diagnostic natif jusque dans le panneau. Aucun nouveau ZIP n’est créé.

## Lecture de secours et affichage

**Quantités** et **Prix + NBV** restent disponibles pour la lecture du tableau. Le lecteur attend la stabilisation des cellules au lieu d’utiliser systématiquement les mêmes pauses. Il avance d’une fenêtre presque complète en conservant un chevauchement, et évite certains déplacements inutiles. Les contrôles de lignes, de sous-région, de devise et de filtres restent actifs. L’arrière-plan ou une fenêtre réduite peuvent encore ralentir Power BI; l’option de premier plan reste facultative.

Les lignes sont plus compactes : marges réduites, prix et NBV côte à côte sur toute la largeur, petites cases pour les valeurs inconnues. Les vrais montants restent en 21 px. Dans l’aperçu Chromium fictif, une ligne avec prix passe d’environ 176 à 130 px à 320 et 390 px de largeur, sans débordement horizontal.

## Vérifications

- `python3 scripts/check.py` : 54 scripts, 17 suites du noyau.
- `node checks/used-export-browser.test.cjs` : vrai Chromium, menus français/anglais et apparition différée; boutons cachés uniquement par CSS (opacité, visibilité ou display) avec curseur hors du visuel; en-tête dans le conteneur extérieur; ambiguïté refusée; choix de disposition, capture exacte du Blob et du lien de téléchargement, fichier concurrent, option désactivée, annulation et restauration des fonctions navigateur.
- `node checks/used-export-panel-browser.test.cjs` après reconstruction du document d’aperçu : bouton réel, XLSX fictif compressé, parseur de production/CRC, transmission des pays et du reçu, refus d’une empreinte erronée.
- `node checks/used-prices-panel.test.cjs` : non-régression des boutons, filtres, cache régional, import manuel et traduction.
- Fixture de 400 lignes : mêmes données avec attentes adaptatives et conservatrices, rendu différé de cellules également testé. Minuteries simulées : environ 24,6 s contre 105,5 s; **ce n’est pas une mesure dans Power BI connecté**.

L’export automatique et sa durée réelle restent à valider dans la session Power BI de l’utilisateur. Le test local reproduit le parcours des captures, sans prétendre valider les droits ou le mécanisme de téléchargement du vrai rapport. InternalReference demeure à confirmer séparément dans D365 connecté.

## Installer cette évolution sur le poste d’essai

Dans le dossier permanent de l’édition équipe déjà corrigée, remplacer les fichiers suivants et ajouter `used-export-ui.js`. Les liens sont figés au commit de code testé (sauf `used-export-ui.js` et `used-powerbi-worker.js`, actualisés ensemble au correctif de détection et de diagnostic `cceed56`) `6e43c81b65efa2058ecb62b79a2138de24700d10` :

- [powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/powerbi-reader.js)
- [used-regions.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/used-regions.js)
- [used-powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/used-powerbi-reader.js)
- [used-powerbi-worker.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/cceed56559728fc9b4c38f70aa60c1180430636c/project/inside-sales-toolbox-team/used-powerbi-worker.js)
- [used-powerbi-panel.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/used-powerbi-panel.js)
- [used-refresh-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/used-refresh-ui.js)
- [used-export-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/cceed56559728fc9b4c38f70aa60c1180430636c/project/inside-sales-toolbox-team/used-export-ui.js)
- [popup.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/popup.html)
- [sidepanel.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/sidepanel.html)
- [theme.css](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/theme.css)
- [list-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/list-ui.js)
- [i18n.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/i18n.js)
- [i18n-dictionary.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/6e43c81b65efa2058ecb62b79a2138de24700d10/project/inside-sales-toolbox-team/i18n-dictionary.js)

Enregistrer les fichiers bruts sous leur nom exact, sans suffixe `.txt`. Recharger l’extension dans `edge://extensions` ou `chrome://extensions`, actualiser le rapport puis rouvrir le panneau. Choisir un pays et essayer Actualiser par Excel sur un article dont les quantités, prix et NBV sont connus. Vérifier les valeurs, puis refaire l’essai avec un autre pays. Un message explicite signale une interface ou un téléchargement non capturable; ne pas annoncer la réussite avant cet essai connecté.
