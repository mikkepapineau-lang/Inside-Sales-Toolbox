# Actualiser les sous-régions sélectionnées

> Suite actuelle : [trois exports Excel et produits comparés par pays](used-country-excel.md). Cette page conserve le contexte de l’étape régionale précédente.

Cette évolution de développement suit la confirmation utilisateur du bon fonctionnement du sélecteur SUBREGION et du défilement horizontal. Le lecteur interne passe à **1.2.5**. Le numéro installable, le ZIP et le tag publiés 3.5.12 restent inchangés.

## Deux boutons, un même périmètre

Choisir Canada, UK, USA ou une combinaison dans le Toolbox, puis cliquer sur Quantités ou Prix + NBV. Les deux actions demandent et vérifient cette même sélection dans Power BI, en conservant les autres filtres du rapport.

- Quantités effectue une nouvelle lecture explicite. Le bouton ne se contente plus de réutiliser le relevé quotidien. L’ancien accès programmatique de lecture avec cache reste disponible pour les usages qui le demandent; Forcer la lecture reste compatible.
- Prix + NBV ne force plus les trois pays. Une lecture UK actualise les prix et NBV UK, sans modifier ceux de Canada, d’une combinaison de pays ou du catalogue global.
- Chaque combinaison conserve ses propres relevés. Des pays lus séparément ne sont pas additionnés pour créer une combinaison.
- Les prix régionaux utilisent un stockage compact séparé (`toolboxUsedRegionPrices`), lié aux identités du catalogue. Les quantités et leurs dates ne sont pas modifiées par une lecture financière. Le retour à Tout sélectionner retrouve les valeurs globales.
- Si les quantités d’un pays ont été lues mais pas ses prix, les prix et NBV restent non renseignés pour ce pays. Les valeurs globales ne sont pas présentées comme des prix régionaux.
- Si les prix sont lus en premier, les articles correspondants peuvent être consultés, avec quantités inconnues jusqu’à une lecture Quantités pour ce périmètre. Un article absent ou une valeur inconnue ne devient pas zéro.
- Un import Excel Prix et NBV seulement peut aussi actualiser une sélection régionale, à condition que le fichier annonce exactement les mêmes pays et la même devise. Toutes les données reste réservé au catalogue global. La réinitialisation du catalogue initial efface les relevés régionaux de quantités et de prix.

## Limiter le ralentissement

L’option **Afficher Power BI pendant la lecture**, sous les boutons d’actualisation, active l’onglet du rapport et restaure sa fenêtre si elle était réduite. Elle est facultative, désactivée au premier usage, et son choix est conservé localement. Elle n’est appliquée qu’au démarrage d’une lecture demandée; elle ne reprend pas constamment le focus pendant votre travail.

Garder le rapport affiché et la fenêtre non réduite pendant l’opération. Le navigateur peut ralentir les minuteries et Power BI lorsqu’il est en arrière-plan : ce comportement ne peut pas être supprimé par l’extension. Lire seulement les pays nécessaires réduit aussi le nombre de lignes à parcourir. Aucun gain chiffré de vitesse en session connectée n’est annoncé.

Le parcours de quantités évite désormais de reconstruire le diagnostic complet à chaque contrôle de devise ou de chargement. Dans le parcours financier, le document du tableau ne recherche plus à répétition un sélecteur dont l’absence y a déjà été établie : le visuel isolé reste contrôlé par le pont entre les tranches et avant l’enregistrement. Les vérifications d’identité, de filtres, de devise et de sélection restent actives.

## Mise à jour du poste d’essai

Pour un poste qui utilise déjà la correction de défilement, remplacer les dix fichiers suivants dans le dossier permanent de l’édition équipe. Ils proviennent tous du même commit vérifié :

- [used-regions.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/used-regions.js)
- [used-powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/used-powerbi-reader.js)
- [used-powerbi-worker.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/used-powerbi-worker.js)
- [used-powerbi-panel.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/used-powerbi-panel.js)
- [used-refresh-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/used-refresh-ui.js)
- [popup.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/popup.html)
- [sidepanel.html](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/sidepanel.html)
- [theme.css](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/theme.css)
- [i18n.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/i18n.js)
- [i18n-dictionary.js](https://raw.githubusercontent.com/mikkepapineau-lang/Inside-Sales-Toolbox/488a146bd5860df8bd1dd4e29ca6c7e24d251dc0/project/inside-sales-toolbox-team/i18n-dictionary.js)

Enregistrer chaque fichier brut sous son nom exact, sans ajouter .txt. Recharger l’extension dans edge://extensions ou chrome://extensions, actualiser le rapport Power BI, puis fermer et rouvrir le panneau. Le moteur partagé `powerbi-reader.js` et `list-ui.js` des corrections précédentes restent nécessaires et inchangés dans cette évolution.

Choisir un pays, cliquer Quantités, puis Prix + NBV; vérifier un article connu dans la source. Refaire l’essai dans un autre pays et confirmer que l’affichage utilise son propre relevé. Cocher Afficher Power BI pendant la lecture pour activer le rapport au début de l’opération. Les limites précédentes de lecture du tableau et l’absence de confirmation d’exhaustivité du modèle restent applicables.

## Vérifications effectuées

- 53 scripts et 16 suites du noyau réussis; archives-only réussi.
- Modèle régional : six périmètres régionaux isolés et catalogue global préservé, NBV zéro, quantités intactes, données financières jamais empruntées à un autre périmètre, contrôles de devise et d’identité.
- Worker réel : sept périmètres de lecture, sélection transmise au lecteur, import Excel correspondant, refus d’un mauvais périmètre ou d’une devise différente, activation de l’onglet seulement sur demande et restauration d’une fenêtre réduite.
- Pont de visuel intégré exercé avec les lecteurs de production sur fixtures, y compris une lecture financière Canada.
- Test du panneau : sélection et recherche conservées, nouvelle lecture Quantités à chaque clic, option premier plan transmise, FR/EN et erreurs récupérables.
- Chromium sur prévisualisation locale fictive : prix Canada avant quantités, lecture fraîche Canada, absence de reprise des données Canada lors du passage à UK, deux relevés de prix distincts, libellé anglais et aucune erreur de page.

Ces résultats sont locaux. La reconnaissance et le défilement de l’étape précédente ont été confirmés par l’utilisateur, mais ce nouveau comportement régional et son effet sur la durée réelle restent à essayer dans sa session connectée. Aucun nouveau ZIP n’est créé.
