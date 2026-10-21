# SUBREGION : pays repérés, état inconnu

Le diagnostic utilisateur du 21 octobre 2026 trouve un seul groupe Canada / UK / USA dans un visuel intégré. Chaque contrôle est un `LI.slicerItemContainer` sans état ARIA ou data-selected; ses descendants ne donnent pas non plus cet état. Le pont de visuels est enregistré et le tableau est accessible. La capture Power BI montre Canada rose et UK / USA blancs. Cette preuve visuelle ne fournit pas le signal DOM qui représente la sélection.

La modification ajoute au diagnostic des contrôles et de leurs descendants une liste limitée de styles calculés (couleurs, bordure, opacité, affichage et visibilité) et les seuls booléens `selected` / `isSelected` éventuellement présents dans les données liées au nœud. Les autres données du visuel ne sont pas sérialisées. Les erreurs de lecture des styles ou des données sont tolérées. Les pays, les règles de sélection et les relevés ne sont pas modifiés.

## Résultat des relevés Canada et UK

Les deux diagnostics enrichis confirment les mêmes styles, en inversant le pays sélectionné : fond `rgb(248, 163, 195)` pour le pays choisi et `rgb(255, 255, 255)` pour les autres, texte `rgb(46, 27, 90)`, bordure noire, affichage flex et opacité 1. Aucun booléen de sélection n’est exposé. Les JSON de l’utilisateur et leurs données de rapport ne sont pas ajoutés au dépôt.

Le lecteur interne **1.2.2** reconnaît ce profil uniquement dans un groupe SUBREGION nommé, unique, contenant les trois contrôles `LI.slicerItemContainer`. Une couleur inattendue, un thème différent, des états accessibles contradictoires, des signaux partiels ou un état entièrement blanc restent non vérifiés. Les couleurs ne remplacent jamais un état accessible présent. Le diagnostic indique `selectionSource: custom-slicer-pink-v1` lorsque ce profil est utilisé.

Pour changer de pays, le lecteur ajoute d’abord le pays manquant avant de retirer les autres. Cela évite de passer par une sélection entièrement blanche, dont le sens n’est pas confirmé. La sélection reste contrôlée pendant le chargement et le relevé; les caches restent séparés par combinaison de pays.

## Essai sur le poste de l’utilisateur

Le ZIP publié 3.5.12 et le numéro installable sont inchangés. Pour cet essai de développement, remplacer uniquement `used-powerbi-reader.js` dans le dossier local de l’édition équipe par le fichier de la branche `fix/subregion-visual-diagnostic`. Recharger l’extension dans Edge/Chrome, actualiser le rapport Power BI, puis fermer et rouvrir le panneau.

1. Sélectionner Canada seul dans Power BI et Canada dans le Toolbox.
2. Relancer Diagnostic inventaire usagé. Dans le visuel concerné, attendre `readerVersion: 1.2.2`, `verified: true`, `selected: [CANADA]` et `selectionSource: custom-slicer-pink-v1`.
3. Cliquer sur Quantités et vérifier le résultat et la couverture réels. Le diagnostic confirme le pays, pas l’exhaustivité du tableau.
4. Tester ensuite UK et les combinaisons utiles. En cas d’échec, conserver le message et le nouveau diagnostic plutôt que supposer que les données sont à jour.

## Validation locale

53 scripts vérifiés et 12 suites du noyau réussies; archives-only réussi. Le test SUBREGION couvre les styles observés Canada/UK, les sept combinaisons avec lectures effectives du lecteur de production sur fixtures, les transitions entre pays et les refus pour styles inconnus, thème différent, transparence, état entièrement blanc, état accessible contradictoire et groupes multiples ou non nommés. Les tests existants des relevés régionaux et du pont de visuels restent réussis.

La reconnaissance est testée localement contre les éléments observés dans les diagnostics. La réussite du téléchargement de quantités dans la session Power BI de l’utilisateur reste à confirmer. Aucun nouveau ZIP ni tag n’est créé.
