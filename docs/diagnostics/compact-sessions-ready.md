# Vue compacte et sessions indépendantes — 23 octobre 2026

Les trois onglets de Recherche de produits utilisent des fiches plus courtes. Les filtres Usagé et Non réservé sont repliés au premier affichage. La recherche, le compteur et les quantités restent devant les résultats; la préparation de la journée reste accessible à l’accueil. Pour Non réservé, une ligne montre société/site/entrepôt, coût unitaire moyen et quantité. Toutes les colonnes restent dans les détails. Les prix de vente et NBV de l’usagé conservent leurs montants mis en évidence. Actualisation du catalogue reste en dernier.

## Commandes prêtes : Sales Rep Name

Michaël a d’abord indiqué **Sales Responsible**, puis a corrigé le champ le 23 octobre 2026 : le filtre réel est **Sales Rep Name**. Il n’est pas assimilé à **Sales Responsible**. Le lien d’ouverture ne contient plus de signet enregistré ni de paramètre de partage d’un visuel.

Le module demande un vendeur, saisi tel qu’il apparaît dans le filtre Power BI **Sales Rep Name**, ou le choix explicite « Filtres actuels du rapport ». Le mode vendeur confirme le contrôle natif, attend l’actualisation du tableau et contrôle encore le filtre après lecture. Si la colonne Sales Rep Name est exportée, chaque ligne doit également correspondre. Sans cette colonne, la sélection native confirmée constitue la provenance du relevé. Un filtre absent, ambigu, inaccessible, modifié pendant la lecture ou donnant un autre vendeur ne remplace pas le relevé précédent. Un relevé vide confirmé est accepté. Modifier le vendeur dans le module masque les anciens résultats jusqu’à une nouvelle lecture.

Les contrôles standards `select` et combobox/listbox ARIA sont couverts. Un filtre personnalisé ou une liste multisélection non lisible peut exiger de choisir un seul responsable directement dans Power BI puis de refermer le menu. Les autres filtres et les restrictions d’accès du rapport s’appliquent toujours. La compatibilité avec le contrôle du rapport connecté reste à vérifier.

## Sessions par onglet

**Historique :** cette première implémentation ne correspondait pas au besoin précisé ensuite. Le développement après 3.5.14 passe à des sessions **par fenêtre**, avec liaison facultative et fenêtre de travail séparée. Voir [le fonctionnement actuel et ses vérifications](window-sessions-soft-industrial.md). Les paragraphes ci-dessous décrivent le comportement antérieur.

Le panneau latéral utilise un chemin distinct par onglet; le popup et le panneau d’un même onglet retrouvent sa session. Navigation, lead/contact, calculs, recherches, responsable, relevés, filtres, états et reçus d’export sont séparés. Les fenêtres créées par le menu contextuel reprennent la session de leur onglet source.

`instances.js` fournit le stockage et le routage; `instance-ui.js` résout la session avant de charger les modules. Les traitements de fond possèdent leurs propres verrous et leurs cibles par session. La réservation d’un onglet empêche deux sessions de le piloter. Une réutilisation concurrente crée une cible distincte; une association explicite à la cible déjà possédée par l’autre session est refusée. Les messages de progression des scripts de contenu retrouvent leur session par l’onglet réservé, même après redémarrage du worker.

Les données volumineuses et les préférences locales de session vivent dans IndexedDB, hors du quota de `chrome.storage.local`. Le catalogue Non réservé possède lui aussi des relevés distincts. Les anciennes données globales restent conservées; les catalogues et préférences autorisés sont copiés au premier accès, sans recopier un ancien relevé Ready ou un ancien filtre de vendeur. Les taux de change et le référentiel HS sont des caches communs. Un identifiant de session navigateur évite de récupérer les préférences d’un ancien numéro d’onglet après redémarrage. Un relevé déjà ouvert dans une autre session n’est pas remplacé par une actualisation de la session courante.

## Vérifications et aperçu

- `python3 scripts/check.py` couvre le périmètre Sales Rep Name et son worker.
- `node checks/instances-browser.test.cjs` : vrai Chromium, HTML/bootstrap et workers de production, avec transport Chrome et onglets locaux fictifs. Deux vues, navigation/contacts/responsables/résultats distincts, imports simultanés, réservation concurrente de rapports, refus de cible étrangère, persistance après rechargement et redémarrage du worker. Aucun service connecté.
- `node checks/ready-seller-browser.test.cjs` : vrais contrôles DOM, champ Sales Rep Name laissé intact, `select` et listbox, attente du tableau, changement de sélection et refus des contrôles ambigus.
- Parcours natif Excel Non réservé et Usagé, panneau Usagé et prix/NBV : contrôles de régression séparés.
- `python3 checks/redesign-preview/build.py --nonreserved` génère `/workspace/toolbox-nonreserved-preview.html`, autonome et interactif, avec deux vues et uniquement des données fictives. Le fichier généré reste hors du dépôt et des ZIP.

Ces vérifications ne constituent pas une validation dans Power BI ou D365 connecté. Aucun nouveau numéro, ZIP ou tag n’est créé pour ces travaux.
