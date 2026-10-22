# Trois exports Excel, une fiche par produit

Le bouton principal **Actualiser par Excel** sélectionne successivement **Canada, UK et USA**, exporte chaque tableau au format XLSX, puis regroupe les trois relevés dans le Toolbox. Il actualise **quantités disponibles et NBV par pays**, ainsi que le **prix de vente commun au produit**. Ce parcours remplace le projet d’un unique export global, qui ne permettait pas d’attribuer les quantités à une sous-région.

Chaque fiche regroupe les lignes liées à la même identité de catalogue (D365 ou correspondance SKU/fabricant/modèle sans ambiguïté). Elle affiche un relevé distinct par pays. Les quantités ne sont pas additionnées. Les quantités et les NBV restent propres à leur pays. Le prix de vente commun est affiché une seule fois en haut de la fiche. Si les relevés donnent des prix différents, la fiche affiche « Plusieurs valeurs »; les prix sources restent consultables dans les détails, sans écrasement des données. Zéro reste zéro; une valeur absente ou non associable reste non renseignée. Les nouveaux produits détectés sont ajoutés aux identités du catalogue. Les correspondances ambiguës restent ignorées plutôt que fusionnées arbitrairement.

Les trois fichiers sont préparés et contrôlés avant un unique enregistrement local. Si un export, une devise, une empreinte, les autres filtres du rapport ou une lecture XLSX ne conviennent pas, le relevé précédent et ses dates restent conservés. Annuler arrête l’ensemble. Le travail temporaire n’est pas enregistré comme un relevé partiellement actualisé. Les relevés de quantités et de prix restent compacts : un jeu d’identités de produits et des valeurs indexées par pays, sans trois copies intégrales du catalogue.

Le tableau exporté reste soumis aux autres filtres et aux limites d’export de Power BI. L’opération laisse le rapport sur le dernier pays lu, USA. Le Toolbox revient à l’affichage des trois pays comparés. Aucune exhaustivité du modèle Power BI n’est annoncée au-delà des fichiers effectivement exportés.

## Démarrage et format du tableau

L’ouverture du menu et de la fenêtre d’export dispose d’une seconde tentative automatique lorsque l’initialisation ne répond pas. Cette reprise se limite à la préparation : la confirmation **Exporter** reste hors de cette boucle pour éviter deux exports du même pays.

Le lecteur cherche le menu appartenant au visuel du tableau et exclut le menu d’un visuel voisin tel que le sélecteur de sous-région. **Données avec disposition actuelle** reste le premier choix. Si Power BI ne la propose pas ou la désactive, **Données résumées** peut être sélectionné lorsqu’il est disponible; le fichier doit ensuite contenir les colonnes et valeurs attendues (SKU, quantités, prix, NBV). Une option désactivée n’est pas forcée, et les données sous-jacentes ne sont pas utilisées.

La capture du fichier et du lien natif conserve les correctifs précédents du téléchargement Edge. Les choix « Ouvrir / Enregistrer » du navigateur ne sont pas utilisés par le Toolbox. Le nouvel enchaînement complet reste à vérifier dans la session connectée; les essais locaux reproduisent les contrôles et les fichiers avec des données fictives.

## Présentation et dates

- Les produits usagés utilisent les mêmes fiches que **Neuf / Stock D365** : SKU, badge de disponibilité, fabricant, numéro D365, description et détails sources dépliables. Les pays prennent la place des blocs entrepôts, avec leur quantité disponible en grand, leurs quantités possédée/maximale et leur NBV mis en évidence. Le prix de vente figure une seule fois au-dessus des pays, avec la même mise en évidence. Une ligne source distincte reste affichée quand plusieurs lignes existent pour un même emplacement. Les valeurs ne sont pas additionnées.
- **Actualisation du catalogue** se trouve tout en bas du module Usagé, après les résultats, la pagination et Options du catalogue et se replie/se déplie. Le groupe est fermé par défaut; le gros bouton Excel reste l’action principale à son ouverture. La lecture de secours est rangée dans ce même groupe.
- **Lecture de secours dans Power BI**, repliée au premier affichage, contient les anciennes lectures Quantités et Prix + NBV et la sélection des pays. Elles défilent dans le tableau et restent plus lentes.
- L’import d’un fichier choisi manuellement reste dans **Options du catalogue**.
- Une mention rappelle qu’une actualisation quotidienne suffit généralement, selon la cadence quotidienne du rapport indiquée par l’utilisateur. Aucun blocage n’empêche une actualisation supplémentaire.
- **Derniers exports Excel** reste visible dans le titre du groupe replié et affiche la date et l’heure du dernier fichier du lot importé. **Options du catalogue** précise les trois dates, et chaque ligne pays porte sa date en infobulle. Il s’agit des heures de récupération des fichiers utilisés, pas de la date de rafraîchissement du modèle BI. Un échec ne rajeunit pas ces dates.
- Le filtre **Disponibles seulement** conserve les autres lignes pays d’un produit disponible dans au moins un pays, afin de pouvoir comparer aussi un zéro confirmé.

Une lecture ou un import de secours remplace la vue concernée et invalide le regroupement Excel précédent; les relevés ne sont pas présentés comme provenant tous d’un nouveau lot. Relancer le bouton principal reconstitue les trois relevés ensemble.

## Vérifications locales

`python3 scripts/check.py` : 54 scripts, 19 suites du noyau, dont deux suites pour le catalogue par pays et l’import groupé. Vérifications : nouveaux SKU, identités prudentes, valeurs par pays sans total inventé, NBV zéro, dates, devises, périmètres, filtres cohérents, trois reçus distincts, ordre des fichiers, enregistrement unique, annulation et conservation des données en cas d’échec.

`node checks/used-export-browser.test.cjs` : vrai Chromium et contrôles natifs fictifs, initialisation exigeant deux activations absorbée dans une seule demande avec une seule confirmation Exporter, exclusion d’un visuel voisin, choix de l’option résumée lorsqu’elle est seule disponible, absence de forçage d’options désactivées, contrôles de capture et d’annulation.

`node checks/used-export-panel-browser.test.cjs` après reconstruction du document d’aperçu : bouton réel, trois XLSX distincts lus par le parseur de production avec contrôle CRC, une fiche produit avec un seul prix de vente commun et trois pays aux quantités/NBV différents, groupe d’actualisation repliable avec date visible, footer quotidien, dates de sources, refus d’une empreinte erronée et conservation du relevé précédent. Les tests du panneau Quantités/Prix + NBV restent passants.

La présentation commune a aussi été observée dans Chromium à 320 et 390 px. À 320 px, les quantités et montants à zéro, un pays absent et les informations sources dépliées restent accessibles, sans débordement horizontal de la fiche. Les vues Neuf et Usagé partagent leurs styles de carte et de disponibilité.

Aucune nouvelle version installable, archive ou tag n’est créé. Édition équipe uniquement. Les essais Power BI et D365 connectés restent distincts.

## Mettre à jour le poste d’essai

Le [ZIP équipe 3.5.13](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/tag/equipe-v3.5.13) contient les trois exports par pays et les fiches communes avec Neuf. Le placement de l’actualisation tout en dernier est une correction postérieure à cet export.

Sur une installation 3.5.13, remplacer les deux fichiers d’interface ci-dessous dans le dossier permanent de l’extension :

- [popup.html](../../project/inside-sales-toolbox-team/popup.html)
- [sidepanel.html](../../project/inside-sales-toolbox-team/sidepanel.html)

Enregistrer leur contenu brut sous leur nom exact, sans `.txt`. [LIRE-MOI.html](../../project/inside-sales-toolbox-team/LIRE-MOI.html) contient aussi les instructions de positionnement actualisées. Pour une installation antérieure, installer d’abord le ZIP 3.5.13, puis appliquer ces fichiers.

Recharger l’extension dans `edge://extensions` ou `chrome://extensions`, puis rouvrir le panneau. Les archives et le tag 3.5.13 sont conservés; cette correction reste un commit en attendant une nouvelle demande d’export.

Vérifier que les résultats, la pagination et Options du catalogue précèdent Actualisation du catalogue. Déplier ce dernier groupe, puis cliquer une seule fois Actualiser par Excel. Contrôler le prix commun, les quantités/NBV par pays et les dates sous Options du catalogue. La date du dernier export reste visible quand le groupe est replié; les messages de chargement et le bouton d’arrêt restent à côté de l’actualisation.

Le parcours complet des trois exports dans la session Power BI connectée reste à confirmer.
