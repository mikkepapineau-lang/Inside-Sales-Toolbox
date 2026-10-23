# Non-Reserved Item List dans Recherche de produits

Un troisième onglet **Non réservé** complète Neuf / Stock D365 et Usagé. Il utilise le [rapport et la page fournis par Michaël](https://app.powerbi.com/groups/ff3be965-02e9-4c0f-b9eb-b73e3bb4e51f/reports/d8c07521-770e-41bd-be72-a23a1dbf41ff/2d2858f342dad29953b3?ctid=c2f120b6-e8fc-402c-9972-fa891cb53927&experience=power-bi), **Non-Reserved List to Sell**.

## Utilisation

1. Ouvrir Non réservé dans Recherche de produits. Le bouton Ouvrir le rapport Power BI permet de retrouver le rapport avec sa session habituelle.
2. Vérifier la devise et les filtres voulus dans Power BI. Le Toolbox conserve ces filtres; il ne choisit pas de sous-région et ne crée pas trois exports pour ce rapport.
3. Tout en bas du module, déplier Actualisation du catalogue puis cliquer une fois sur Actualiser par Excel.
4. Le moteur identifie le tableau par ITEMID, QtyNotReserved et ses colonnes de produit/coût, puis utilise les trois points de ce visuel. Il choisit Exporter les données et l’option Excel de tableau disponible. Le fichier est récupéré puis importé automatiquement, y compris lorsque le navigateur attend encore Ouvrir / Enregistrer.
5. Rechercher un produit ou déplier Filtres pour choisir société, site, entrepôt, fabricant et catégories présentes dans l’export. Les résultats sont affichés par tranches de 80 produits.

Les fiches partagent le layout D365. PRODUCTNAME sert de SKU, ITEMID de numéro D365, PRODUCTDESCRIPTION de description et MANUFACTURER de fabricant. QtyNotReserved est une quantité non réservée et AvgUnitCost un **coût unitaire moyen**. Ce coût n’est ni un prix de vente ni un NBV. Les lignes d’un même produit sont regroupées sans additionner les quantités ni moyenner les coûts entre sociétés, sites ou entrepôts. Les détails conservent toutes les colonnes du fichier, notamment celles situées hors de la zone visible du tableau.

Les quantités décimales et les valeurs zéro restent distinctes d’une donnée manquante. Un export valide sans ligne remplace le relevé par un résultat vide. L’indication Dernier import Excel est la date d’importation du fichier utilisé, pas le rafraîchissement du modèle Power BI. La devise n’est pas supposée CAD si elle n’est pas fournie par le rapport ou le fichier.

Options du catalogue non réservé contient un import manuel XLSX et le lien du rapport. Son identité est contrôlée pour éviter d’utiliser le BI Usagé ou Commandes prêtes.

## Conservation et contrôles

Le catalogue Non-Reserved est indépendant de l’usagé et persiste dans l’IndexedDB de l’extension. Les anciennes données ne sont remplacées qu’après validation du fichier. Aucun nouvel accès de manifeste ni permission de téléchargements n’est ajouté.

Le parcours automatique contrôle le rapport, sa page, l’unicité du tableau, les filtres visibles avant/après l’export, la devise, la taille, l’empreinte SHA256, les CRC XLSX et un reçu temporaire d’export. Une erreur de lecture, une empreinte incorrecte ou un échec d’enregistrement conserve le catalogue précédent. Les filtres du rapport et les limites d’export natives Power BI continuent de s’appliquer. Le lecteur accepte jusqu’à 25 Mo et 150 000 lignes, sous les limites XML du parseur.

## Vérifications

- `python3 scripts/check.py` : 59 scripts et 21 suites, dont le modèle Non-Reserved et son worker.
- `node checks/nonreserved-browser.test.cjs` après reconstruction de l’aperçu : vrai Chromium, trois points placés dans l’en-tête extérieur du tableau et visibles au survol, exclusion du menu d’un visuel voisin, un seul export, véritable XLSX fictif lu par le parseur de production, données par entrepôt, zéro/décimales, filtres, conservation de l’usagé, refus d’empreinte incorrecte et persistance IndexedDB après rechargement.
- Les tests d’export natif Usagé, de son panneau et de ses prix/NBV restent passants.

Ces essais utilisent des données fictives. Le rapport Power BI connecté, ses permissions réelles et ses contrôles d’export restent à vérifier dans la session de Michaël. Aucun ZIP ou tag existant n’est modifié; les changements attendent la prochaine demande d’export.

## Mise à jour du code

Le module ajoute `nonreserved-model.js`, `nonreserved-store.js`, `nonreserved-reader.js`, `nonreserved-worker.js` et `nonreserved-panel.js`. Les interfaces popup/panneau, la navigation, le chargement du background, le parseur XLSX et le moteur d’export sont actualisés ensemble. Remplacer le dossier complet de sources de l’édition équipe puis recharger l’extension pour un essai de développement. Le ZIP publié 3.5.13 ne contient pas encore cet onglet.

La présentation compacte et la séparation des sessions sont décrites dans [la note du 23 octobre](compact-sessions-ready.md).
