# SUBREGION : pays repérés, état inconnu

Le diagnostic utilisateur du 21 octobre 2026 trouve un seul groupe Canada / UK / USA dans un visuel intégré. Chaque contrôle est un `LI.slicerItemContainer` sans état ARIA ou data-selected; ses descendants ne donnent pas non plus cet état. Le pont de visuels est enregistré et le tableau est accessible. La capture Power BI montre Canada rose et UK / USA blancs. Cette preuve visuelle ne fournit pas le signal DOM qui représente la sélection.

La modification ajoute au diagnostic des contrôles et de leurs descendants une liste limitée de styles calculés (couleurs, bordure, opacité, affichage et visibilité) et les seuls booléens `selected` / `isSelected` éventuellement présents dans les données liées au nœud. Les autres données du visuel ne sont pas sérialisées. Les erreurs de lecture des styles ou des données sont tolérées. Les pays, les règles de sélection et les relevés ne sont pas modifiés.

## Obtenir la preuve manquante

La version ZIP publiée 3.5.12 reste inchangée. Pour un essai de développement avec ce lecteur, utiliser les sources de la branche `fix/subregion-visual-diagnostic`, ou remplacer uniquement `used-powerbi-reader.js` dans le dossier local de l’édition équipe par ce fichier provenant de la branche. Recharger l’extension depuis la page des extensions, actualiser le rapport Used Gear, puis fermer et rouvrir le panneau. Aucun nouveau ZIP installable n’a été produit.

1. Dans Power BI, sélectionner Canada seul et laisser le visuel se stabiliser.
2. Dans Options du catalogue du Toolbox, lancer Diagnostic inventaire usagé et conserver le résultat.
3. Dans Power BI, sélectionner UK seul, puis relancer le diagnostic.
4. Comparer les `computedStyle` et `dataSelection` des contrôles : les variations liées au pays réellement sélectionné pourront établir une règle vérifiable. Vérifier les données avant de partager le diagnostic.

Ne pas relancer Quantités dans l’espoir que cette instrumentation résolve à elle seule le blocage. Elle n’ajoute aucune nouvelle règle de reconnaissance. La correction de lecture devra conserver les contrôles de cohérence pendant tout le relevé; aucun pays ne doit être confirmé par la seule sélection demandée dans le Toolbox.

## Validation locale

53 scripts vérifiés et 12 suites du noyau réussies; archives-only réussi. Le test SUBREGION couvre le cas coloré sans état accessible, la collecte bornée des booléens sans sérialisation des données privées, et les erreurs de style/données. Le lecteur refuse toujours une sélection non vérifiable et ne clique pas sur les pays dans ce cas. Aucune validation dans la session Power BI de l’utilisateur n’a été effectuée.
