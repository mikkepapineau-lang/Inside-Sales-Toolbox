# Actualisation native Excel et lignes compactes

Évolution de développement de l’édition équipe, lecteur interne 1.2.6. Aucun nouveau numéro installable, ZIP ou tag.

## Utilisation

1. Ouvrir le rapport **LP Catalog - Used Gear** connecté.
2. Choisir Canada, UK, USA ou une combinaison dans le Toolbox.
3. Cliquer **Actualiser par Excel**. Le Toolbox confirme les pays, ouvre les trois points du tableau, choisit **Exporter des données → Données avec disposition actuelle → .xlsx → Exporter**, puis lit le fichier généré et actualise quantités, prix et NBV ensemble.

Ce parcours remplace le balayage des lignes par l’export natif de Power BI. Les limites et autorisations d’export du rapport continuent de s’appliquer. Les autres filtres du rapport sont conservés. Chaque combinaison garde ses relevés séparés; elle ne reprend pas les valeurs d’une autre sélection. Les valeurs sont associées aux identités du catalogue; le bilan indique les articles financiers effectivement associés.

Le fichier est lu localement au moment de sa génération. Aucun accès au dossier Téléchargements ni permission de téléchargement supplémentaire n’est ajouté. Le téléchargement normal peut encore apparaître dans Edge; il n’est pas nécessaire de choisir Enregistrer pour que la capture locale puisse être importée. Si Power BI produit son fichier autrement, désactive l’export ou change son interface, le Toolbox indique l’échec; **Importer Excel** reste disponible. Il n’utilise pas d’API interne ni de jetons Power BI.

Les empreintes SHA256 du transport et les CRC du XLSX sont contrôlés. Une sélection, des filtres ou une devise modifiés pendant l’export font refuser l’import. Un reçu local temporaire à usage unique lie le fichier et les pays confirmés. Les mises à jour régionales des quantités et des prix sont préparées puis enregistrées ensemble. Une erreur de lecture ou de validation conserve les données précédentes.

## Lecture de secours et affichage

**Quantités** et **Prix + NBV** restent disponibles pour la lecture du tableau. Le lecteur attend la stabilisation des cellules au lieu d’utiliser systématiquement les mêmes pauses. Il avance d’une fenêtre presque complète en conservant un chevauchement, et évite certains déplacements inutiles. Les contrôles de lignes, de sous-région, de devise et de filtres restent actifs. L’arrière-plan ou une fenêtre réduite peuvent encore ralentir Power BI; l’option de premier plan reste facultative.

Les lignes sont plus compactes : marges réduites, prix et NBV côte à côte sur toute la largeur, petites cases pour les valeurs inconnues. Les vrais montants restent en 21 px. Dans l’aperçu Chromium fictif, une ligne avec prix passe d’environ 176 à 130 px à 320 et 390 px de largeur, sans débordement horizontal.

## Vérifications

- `python3 scripts/check.py` : 54 scripts, 17 suites du noyau.
- `node checks/used-export-browser.test.cjs` : vrai Chromium, menus français/anglais, choix de disposition, capture exacte du Blob, fichier concurrent, option désactivée, annulation et restauration de la fonction navigateur.
- `node checks/used-export-panel-browser.test.cjs` après reconstruction du document d’aperçu : bouton réel, XLSX fictif compressé, parseur de production/CRC, transmission des pays et du reçu, refus d’une empreinte erronée.
- `node checks/used-prices-panel.test.cjs` : non-régression des boutons, filtres, cache régional, import manuel et traduction.
- Fixture de 400 lignes : mêmes données avec attentes adaptatives et conservatrices, rendu différé de cellules également testé. Minuteries simulées : environ 24,6 s contre 105,5 s; **ce n’est pas une mesure dans Power BI connecté**.

L’export automatique et sa durée réelle restent à valider dans la session Power BI de l’utilisateur. Le test local reproduit le parcours des captures, sans prétendre valider les droits ou le mécanisme de téléchargement du vrai rapport. InternalReference demeure à confirmer séparément dans D365 connecté.

## Installer cette évolution sur le poste d’essai

Dans le dossier permanent de l’édition équipe déjà corrigée, remplacer les fichiers suivants et ajouter `used-export-ui.js`. Les liens sont figés au commit de code testé `94f61ba1575cb9703d000b5e82aa25a6c8889ec3` :

- [powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/powerbi-reader.js)
- [used-regions.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-regions.js)
- [used-powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-powerbi-reader.js)
- [used-powerbi-worker.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-powerbi-worker.js)
- [used-powerbi-panel.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-powerbi-panel.js)
- [used-refresh-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-refresh-ui.js)
- [used-export-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/used-export-ui.js)
- [popup.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/popup.html)
- [sidepanel.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/sidepanel.html)
- [theme.css](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/theme.css)
- [list-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/list-ui.js)
- [i18n.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/i18n.js)
- [i18n-dictionary.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/94f61ba1575cb9703d000b5e82aa25a6c8889ec3/project/inside-sales-toolbox-team/i18n-dictionary.js)

Enregistrer les fichiers bruts sous leur nom exact, sans suffixe `.txt`. Recharger l’extension dans `edge://extensions` ou `chrome://extensions`, actualiser le rapport puis rouvrir le panneau. Choisir un pays et essayer Actualiser par Excel sur un article dont les quantités, prix et NBV sont connus. Vérifier les valeurs, puis refaire l’essai avec un autre pays. Un message explicite signale une interface ou un téléchargement non capturable; ne pas annoncer la réussite avant cet essai connecté.
