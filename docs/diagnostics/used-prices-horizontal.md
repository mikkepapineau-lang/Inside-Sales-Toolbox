# Usagé : lecture horizontale des prix et mise en évidence

Le retour utilisateur confirme la reconnaissance du sélecteur SUBREGION et signale que Sell Price / NBV ne sont accessibles qu’à droite du tableau. Le lecteur de quantités ne parcourait que la hauteur; ses en-têtes restaient ceux de la fenêtre de départ.

## Correction de lecture

Le moteur de lecture des commandes expose maintenant une fabrique de lecteurs de tableau. Le comportement du lecteur Commandes est conservé; l’action Usagé Prix + NBV utilise un profil distinct, associé au numéro d’article D365 et au SKU, avec Sell Price et NBV comme colonnes requises.

Le lecteur interne Usagé est désormais 1.2.3 et conserve la reconnaissance SUBREGION déjà essayée par l’utilisateur. Le worker charge le moteur partagé avant le lecteur Usagé et transmet explicitement le mode prix, y compris lorsque le sélecteur est dans un visuel intégré. La lecture des quantités reste sur son parcours existant.

Pour chaque fenêtre de lignes, le lecteur revient à gauche, relève les identifiants, parcourt les colonnes à droite puis revient vérifier les mêmes identifiants avant d’accepter les montants. Les index de colonnes globaux sont pris en compte. Les identifiants de ligne sont limités à la fenêtre courante pour ne pas confondre les lignes recyclées lors du défilement vertical.

Les barres horizontales natives et la barre personnalisée Power BI `.scroll-bar-div` / `.scroll-bar-part-bar` sont prises en charge. Le déplacement est confirmé; un dépassement de contenu simplement coupé n’est pas traité comme une barre pilotable. Les positions sont restaurées à la fin, sur erreur ou après annulation; la restauration de la barre personnalisée est évitée si le rapport a changé.

Les grands tableaux sont traités par tranches, sans reprendre la limite de 45 déplacements du lecteur de commandes. Les contrôles du visuel intégré restent effectués entre les tranches avant tout enregistrement. Les colonnes absentes, les mouvements bloqués, les lignes devenues incohérentes et les changements de filtre ou devise empêchent la mise à jour. Un prix ne peut être associé qu’à un identifiant d’article stable. Les lignes sans identifiant D365 exploitable ne sont pas attribuées à un article par supposition; les articles non actualisés conservent leurs valeurs précédentes. La fin du parcours ne garantit pas que Power BI a exposé la totalité des données du modèle.

La mise à jour des prix conserve les quantités, leurs dates et les relevés régionaux. Un NBV explicitement égal à zéro est conservé. L’action continue d’exiger CANADA + UK + USA pour les données financières globales.

## Présentation

Chaque fiche Usagé présente Prix de vente et NBV dans deux encadrés, avec montants de 21 px, symbole $ et code de devise. Les données absentes ou multiples restent indiquées explicitement. Les autres modules gardent leur présentation. Les libellés FR/EN sont conservés.

## Mettre à jour le poste d’essai

Aucun nouveau ZIP, tag ni numéro installable n’est créé. La publication originale 3.5.12 est inchangée. Pour essayer ces sources de développement, télécharger ces six fichiers de la branche et remplacer leurs homonymes dans le dossier permanent de l’édition équipe :

- [powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/powerbi-reader.js)
- [used-powerbi-reader.js](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/used-powerbi-reader.js)
- [used-powerbi-worker.js](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/used-powerbi-worker.js)
- [used-powerbi-panel.js](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/used-powerbi-panel.js)
- [list-ui.js](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/list-ui.js)
- [theme.css](https://raw.githubusercontent.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/fix/subregion-visual-diagnostic/project/inside-sales-toolbox-team/theme.css)

Enregistrer les fichiers bruts sous leurs noms exacts, sans ajouter .txt. Ensuite : recharger l’extension dans edge://extensions ou chrome://extensions, actualiser le rapport Power BI, puis fermer et rouvrir le panneau. Le diagnostic du lecteur doit indiquer 1.2.3.

Cliquer Prix + NBV, laisser le rapport disponible pendant la lecture, puis vérifier le bilan des articles actualisés et un article connu dans Power BI. Les quantités et la combinaison de pays affichée dans le Toolbox ne doivent pas être remplacées par cette actualisation financière. Un changement des pays du rapport vers le périmètre global est attendu pour cette action.

## Vérifications

- 53 scripts et 13 suites du noyau réussis, dont la nouvelle régression de lecture financière horizontale.
- Relevés de tests avec colonnes financières masquées, barres natives et personnalisées (souris et pointeur), association D365, NBV zéro et conservation des quantités.
- Parcours de 400 articles sur plus de 45 déplacements, lecture par tranches et annulation avec restauration des positions.
- Refus des colonnes manquantes, des barres bloquées ou multiples, des changements de filtre et des lignes réaffectées.
- Tests existants du worker Prix + NBV et du panneau réussis; pont des visuels intégrés exercé avec les vrais lecteurs de production sur fixtures.
- Vérification Chromium de la fiche en français à 320 et 390 px : montants de 21 px, devise CAD, absence de débordement de la fiche; libellé anglais Selling price vérifié, aucune erreur de page.
- `--archives-only` réussi. Le contrôle d’égalité des sources avec le ZIP 3.5.12 n’est pas une validation attendue pour ces sources de développement non exportées.

Le fonctionnement réel de Prix + NBV dans la session Power BI de l’utilisateur reste à confirmer. Les captures d’essai visuel utilisent exclusivement les données fictives de la prévisualisation du dépôt.
