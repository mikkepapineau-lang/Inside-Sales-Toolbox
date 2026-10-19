# PROMPT MAÎTRE DE PASSATION À CODEX
## Inside Sales Toolbox Équipe (Solotech)
**État du contexte : 18 octobre 2026**

Tu deviens le développeur chargé de REPRENDRE et MAINTENIR mon projet existant « Inside Sales Toolbox Équipe ». Ce message te transmet les décisions et le contexte de longues conversations ChatGPT que tu ne peux pas voir automatiquement. Lis-le entièrement, ainsi que les fichiers source que je te joins, AVANT de proposer du code.

## 1. Mission immédiate : comprendre avant de modifier

- Le projet existe déjà et a été développé sur plusieurs versions. NE LE RECRÉE PAS de zéro. N'invente pas une architecture ou une fonctionnalité existante sans examiner le code.
- Commence en **mode audit, sans modification de fichier**. Examine les fichiers, identifie la structure, les modules, les versions, les tests, l'état réel et les écarts avec cette passation. Attends mon feu vert avant tout changement au code, packaging ou publication.
- Si une indication de ce texte contredit le code source récent, présente le conflit et demande-moi de trancher. Les guides anciens décrivent une base fonctionnelle, pas nécessairement la dernière version.
- Distingue explicitement : (A) implémenté et vérifié dans le code/tests, (B) observé dans un test réel Edge/D365/Power BI, (C) code de travail non exporté, (D) prototype séparé, (E) fonctionnalité souhaitée.
- Ne prétends JAMAIS que du code a été testé dans mon instance Salesforce, D365 ou Power BI si tu n'as pas la preuve d'une session utilisateur réelle.
- Préserve la version personnelle si elle se trouve dans les fichiers. Les modifications concernent « Équipe » seulement.

## 2. Produit et contraintes non négociables

- Inside Sales Toolbox est une extension de navigateur Microsoft Edge, avec compatibilité Chrome visée, principalement pour les représentants des ventes internes de Solotech Canada.
- Environnement D365 principal : société **CAOP**. Le code est destiné à fonctionner dans les sessions Salesforce, D365 et Power BI déjà authentifiées par CHAQUE utilisateur dans son navigateur.
- Interface sous forme de popup et panneau latéral persistant, menus contextuels sur sélection de texte, navigation compacte, sélecteur global Français/English dont la préférence est mémorisée.
- Approche locale, autant que possible en lecture seule pour les fonctions de recherche et de pricing. Aucun serveur, déploiement cloud, nouveau compte, demande d'accès TI, token/cookie exporté, contournement de restrictions, scraping d'API privée ou modification D365 hors des opérations explicitement approuvées.
- Ne demande pas de nouveau droit Microsoft/SharePoint/Salesforce. Utilise seulement les accès et permissions déjà autorisés si le code et les règles de l'entreprise le permettent.
- Les fonctions Salesforce → D365 qui remplissent et créent des fiches sont les seules parties autorisées à écrire dans D365, avec confirmations explicites, garde-fous et non-duplication. Price List Finder reste en lecture seule.
- Pas d'envoi de données d'entreprise vers des services tiers non approuvés. Pas de télémétrie sensible ou de journalisation de noms, courriels, prix internes, jetons, mots de passe ou données clients.
- Ne change pas les permissions du manifest ou les domaines accessibles sans besoin vérifié et mon approbation.
- Ne publie rien, ne pousse rien sur GitHub, ne crée aucun ZIP exportable, n'envoie aucun courriel et n'exécute aucun acte externe sans ma demande explicite.

## 3. Fichiers de référence et gestion des versions

Je joins **deux artefacts distincts pour la branche Équipe** :

1. **Inside-Sales-Toolbox-Equipe-v3.5.7.zip** : ZIP installable existant, retrouvé dans la bibliothèque, contenant `manifest.json` et les fichiers de l'extension (73 entrées). C'est la version numérotée la plus récente retrouvée, à inspecter, sans présumer qu'elle incorpore tout le travail du checkpoint.
2. **Inside-Sales-Toolbox-Working-Source.json** : checkpoint détaillé de code et tests, qui contient des modifications de travail possiblement non exportées. Il fait référence à sa base 3.5.6 et à des travaux ultérieurs. **Compare les fichiers du JSON et du ZIP avant de choisir la branche de reprise. Ne remplace pas l'un par l'autre à l'aveugle.**

Je joins aussi **price-list-finder-lab-v07.zip**, projet indépendant (12 entrées), à garder SÉPARÉ de l'extension Équipe tant que l'intégration n'est pas approuvée.

La source de travail JSON est un checkpoint structuré :
- format : `toolbox-source-checkpoint-v1`
- projet : `Inside Sales Toolbox Équipe`
- `baseRelease: 3.5.6`
- `status: Unexported: registered related-frame reader and coordinated SUBREGION/table extraction`
- arborescence principale mentionnée : `project/inside-sales-toolbox-team/`
- suite de tests : `checks/*.test.cjs`
- le checkpoint mentionne **3.5.6** comme dernier export AU MOMENT OÙ IL A ÉTÉ CRÉÉ, et décrit ensuite du code **non exporté**. Depuis, un ZIP numéroté **3.5.7** a également été retrouvé. Leurs dates/états internes ne sont pas automatiquement synchronisés : **comparaison technique impérative** avant toute modification.

Autre document de référence : **Inside-Sales-Toolbox-Guide-Equipe-v2.0.1.md**. Il décrit les modules, installation, workflows D365 et formats de données, mais il est ANTÉRIEUR aux modifications 3.5.x. Ne l'utilise pas pour écraser du comportement plus récent.

Je peux également joindre **Price List_ MDG.pdf**, fiche de référence des conditions de prix du Procurement Portal.

Si un fichier source est fourni comme JSON de checkpoint contenant `files[]` avec `path`, `encoding`, `sha256` et `content`, commence par en analyser le format et propose une reconstruction fidèle de l'arborescence en validant les empreintes SHA-256. Préserve les chemins et le contenu original. Ne reconstruis pas approximativement le projet à partir du guide.

## 4. Modules existants ou développés

### A. Salesforce → Dynamics 365 : capture de lead, prospect et soumission

Parcours guidé de récupération du lead Salesforce, vérification/complément des coordonnées, création d'un prospect puis d'une soumission dans D365.

**Capture Salesforce :**
- Capturer à partir de la fiche Lead Salesforce en affichage Details.
- Vérifier contact, entreprise, téléphone, poste, courriel, type Personne/Organisation, langue, adresse, champs D365.
- Si Company est vide ou identique au contact, une suggestion peut être déduite du domaine de courriel, mais jamais acceptée comme preuve d'identité légale. Le type Personne/Organisation doit être confirmé.
- Recherche de coordonnées sur le site d'entreprise à partir du domaine, et éventuellement dans pages Contact / À propos. Validation d'adresse avec Google Maps uniquement quand numéro civique ET code postal correspondent à un résultat non ambigu. Géocodage/territoire possible avec Photon/OpenStreetMap.
- Les champs saisis par l'utilisateur et ses corrections doivent être conservés dans le parcours.
- Animation progressive montrant les vrais champs récupérés, sans simulation trompeuse. La donnée est enregistrée AVANT son animation d'affichage.

**Prospect D365 :**
- Viser exclusivement l'onglet `All prospects` de **CAOP**, et jamais un onglet Product Search ou de commande.
- En présence de plusieurs onglets, préférer l'onglet mémorisé, puis celui utilisé récemment / actif suivant les règles du code.
- Parcours typique : `Remplir le prospect` → rapport de prévisualisation/validation → `Confirmer et créer le prospect`.
- La logique de navigation et d'édition utilise notamment le formulaire `smmBusRelTable` et le bouton `SystemDefinedViewEditButton` dans la portée du bon formulaire. Ne pas faire de sélection DOM globale hasardeuse.
- Dimensions par défaut à conserver : `Activity ECOMM`, `Department 021`, `Division 003`, `Office` et `Territory` d'après le parcours. Inclure aussi le champ obligatoire de limite de crédit selon la logique existante.
- La langue du client dans D365 n'est pas la langue FR/EN de l'interface Toolbox. Le parcours peut appliquer `fr-CA` lorsque sélectionné.
- Les rapports doivent expliquer ce qui a réellement été rempli, conservé ou reste à vérifier.
- Éviter à tout prix la création d'un deuxième prospect après un Save partiel. Lorsqu'une action a possiblement créé l'objet, verrouiller la répétition et demander vérification.

**Soumission D365 :**
- Ouvrir `New Sales Quotation`, sélectionner l'entrepôt demandé, `Sales origin = ECOMM`, `Payment = PAYMENT IN ADVANCE`, confirmer puis reconnaître le véritable numéro de soumission (ex. `SQ-CA...`).
- Remplir les coordonnées dans `Internal Notes`, `Delivery Contact Information`, `Email` selon le formulaire.
- Les dimensions du prospect ne doivent PAS être ressaisies à la création de la soumission.
- Avant toute écriture, vérifier l'identité du bon formulaire `SalesQuotationTable` et la soumission exacte : identifiant visible, titre, légende, heading lié, texte accessible, spans read-only, éventuelle ouverture de l'entête.
- Si le formulaire redirige vers une liste après création, ne suivre que le lien UNIQUE vers cette soumission exacte dans le même onglet et la même société. Exclure les liens externes ou ouvrant un nouvel onglet.
- Si un autre numéro est détecté ou si l'identité est ambiguë, ne rien écrire.
- La fonctionnalité `Réessayer les coordonnées` est prévue pour une soumission DÉJÀ créée, lorsque seuls les contacts restent à remplir. Elle ne doit jamais recréer la soumission. Conserver l'onglet/numéro et la durée de validité du parcours initial.
- L'action `Ouvrir la soumission dans D365` doit identifier et retrouver la soumission existante.
- Utiliser des messages spécifiques : succès réel, action partielle à vérifier, erreur retentable. Anti-double-clic systématique.

**UX des actions CRM :**
- Gros bouton `Continuer` persistent dans le parcours.
- Animations de récupération des champs, remplissage du prospect et création, avec coches et statuts fondés sur le retour réel de l'opération.
- Dans le checkpoint : rythme indicatif 160 ms, démarrage 80 ms, 55 ms entre groupes, animation champ 210 ms et confirmation finale 2400 ms. Préserver la prise en charge reduced-motion/onglet caché.
- Ne jamais afficher un faux chronomètre qui suggère une progression d'une écriture non réalisée.

### B. Coordonnées clients

- Coller une signature ou du texte de coordonnées, puis `Extraire les coordonnées`.
- Bouton `Reprendre le contact du lead Salesforce`, avec les corrections effectuées dans le parcours Salesforce.
- Champs nom complet, téléphone et poste, courriel. Courriel en minuscules, poste préfixé `#`.
- Format `Internal Notes` sur trois lignes : nom, téléphone avec poste, courriel.
- Format `Delivery Contact Information` sur UNE ligne : `Nom - Téléphone #poste`.
- Copier les notes dans le presse-papiers.
- En mode Edit D365 : pour une SOUMISSION, remplir Internal Notes, Delivery Contact Information et Email ; pour une COMMANDE, remplir ces champs et Telephone également. Confirmer l'onglet/document ciblé.
- L'action peut remplacer les valeurs existantes de certains champs ciblés. La vérification humaine avant sauvegarde est essentielle.
- Menu contextuel pour utiliser un texte sélectionné comme nom / téléphone / courriel, préparer ou ajouter aux coordonnées, changer la casse.

### C. Product Search, produits et inventaire usagé

- Rechercher SKU, numéro d'article D365, fabricant ou description depuis le module, ou depuis du texte sélectionné sur une page Web avec menu clic droit.
- Menu FR `Rechercher dans D365 · Product Search`, EN `Search in D365 · Product Search`.
- Utiliser un onglet `Product Search CAOP` existant, sinon en ouvrir un. La recherche peut s'effectuer pendant que l'utilisateur reste sur le site source. Panneau latéral persistant.
- Regrouper par `Item number D365`, PAS simplement par SKU. Deux Item numbers différents restent deux produits même avec SKU identique.
- Montrer, selon lignes réellement chargées, quantités par entrepôt ET emplacement : Disponible physique, Inventaire physique, Réservé physique, En commande, Commandé au total et Commandé réservé.
- Masquer les blocs sans quantité et les zéros dans l'affichage compact, mais conserver toutes les lignes sources dans `Toutes les informations`.
- Badge de disponibilité si une quantité physique positive est présente dans les lignes chargées. Ne pas présenter un résultat partiel D365 comme l'intégralité du stock. Ne pas additionner automatiquement les emplacements distincts.
- Lien `Ouvrir dans D365` pour validation.
- Une section `Inventaire usagé` / `Used Gear` est ajoutée, avec sélection du catalogue `LP Catalog - Used Gear`, recherches et filtres.
- Un catalogue Excel d'environ **12 851 articles**, incluant prix et NBV, a été utilisé dans les versions récentes. Afficher les montants et quantités sans les inventer. Préserver pagination, cache et séparation avec les autres sources.

### D. Power BI, Used Gear, commandes prêtes et préparation quotidienne

- Deux univers Power BI distincts, notamment `Used Gear` et `Ready to PIK` / commandes prêtes. Ne pas les mélanger.
- Commandes prêtes : afficher le **Account Name / nom du client** comme titre principal plutôt que le numéro SO, retirer le représentant, offrir filtres/tri par livraison, paiement, montant. Les autres entrepôts pourront être ajoutés plus tard.
- Fonction `Préparer ma journée` ou équivalent : ouvrir/réutiliser les onglets D365, Product Search et rapports Power BI nécessaires, en évitant les doublons.
- Le rapport Used Gear peut être ouvert par URL Power BI canonique ou `reportEmbed` avec ID exact. Conserver l'association au bon rapport, réutiliser l'onglet correct, éviter les ambiguïtés et ne jamais confondre avec Ready to PIK.
- Filtre Power BI `SUBREGION` avec combinaisons de **CANADA, UK et USA**, multi-sélection et confirmation de l'état réel du filtre avant lecture des données.
- Une difficulté rencontrée : l'interface Power BI et les boutons SUBREGION peuvent se trouver dans des frames auxquelles le DOM de la frame parente n'a pas accès. NE PAS en déduire que l'élément n'existe pas, ni contourner les isolations du navigateur.
- Dernier travail de checkpoint non exporté : lecteur enregistré dynamiquement sur `app.powerbi.com` avec `allFrames` et `matchOriginAsFallback` dans le monde isolé de l'extension, sur permissions déjà acquises ; communication native par messages ciblés et nonce liés à l'onglet/rapport requis.
- Pas de `postMessage` injecté dans la page, pas d'accès aux API internes Power BI, pas de tokens/cookies, pas de nouvelles permissions.
- La frame principale ne lit la table que lorsque la combinaison SUBREGION a été confirmée sans ambiguïté par le lecteur concerné. Revalider pendant la lecture par lots et avant l'enregistrement en cache. Si filtre modifié, ambigu, disparu ou incohérent : abandonner les données recueillies.
- Le diagnostic doit être SANS EFFET DE BORD : pas de rechargement non demandé, pas de modification des filtres, pas d'écriture cache. L'unique rechargement éventuellement permis par la logique opérationnelle a une condition très stricte : première lecture lorsque les agents de frames ne sont pas présents.
- Tests locaux évoqués : `checks/used-embedded-frames.test.cjs`, état d'onglets, combinations régionales, frames inaccessibles, données NBV/prix, préservation des caches, invalidations au fil des scrolls.
- **Important : les simulations locales ont réussi, mais le comportement du dernier lecteur de frames n'a PAS été validé dans une session Power BI authentifiée en direct.** Ce point reste à tester avec moi avant de le considérer réglé.
- Un fichier `SSSI.06.02.Used Gear.xlsx` avait été inspecté : feuille vide, connexion OLAP externe, cache pivot sans données. Ce n'est PAS un export d'inventaire exploitable. Ne pas le remplacer ou le modifier.

### E. Vérificateur de codes HS

- Vérifier les surtaxes canadiennes applicables à certains produits d'origine américaine, à partir d'une liste officielle de référence.
- Recherche par code HS/SH à 4, 6, 8 ou 10 chiffres ; famille ou article précis selon longueur.
- Choix du pays d'origine, consultation de la date de mise à jour et de la période d'application. Copie locale de secours signalée explicitement comme potentiellement périmée.
- Un résultat absent NE signifie PAS que les droits sont nuls. Ne pas confondre pays d'origine et pays d'expédition. Ne pas inventer les droits de douane ou les exemptions.

## 5. Prototype SÉPARÉ : Price List Finder LAB 0.7

C'est une priorité future majeure, MAIS le laboratoire est indépendant de l'extension Équipe principale. Ne l'intègre PAS d'emblée : commence par auditer ce qui existe et propose une intégration seulement après validation.

### Objectif métier

Retrouver rapidement le vrai coût d'achat estimé ou confirmé d'un SKU à partir de deux sources complémentaires :
1. Les fichiers Excel/CSV/PDF de prix hébergés sur SharePoint et disponibles dans les dossiers synchronisés de OneDrive / Procurement Portal Canada.
2. La fiche `Price List` du **Procurement Portal Salesforce**, qui fournit les conditions négociées, la bonne colonne de coût, la devise et l'identité de la liste.

**Impératif : le prix public ou Dealer Price d'un Excel N'EST PAS automatiquement le coût Solotech.** Les rabais, catégories, fournisseurs, devises, quantités, dates et exceptions doivent être interprétés, tracés et validés.

### Structure et sélection des sources

- Organisation prévue : `Procurement Portal Canada` → dossier du fabricant (ex. MDG ou Shure) → catégories et fichiers de listes de prix.
- Parcourir les catégories, préférer les listes courantes/révisées, et **EXCLURE `Archived` PAR DÉFAUT**. Ne considérer les archives qu'en dernier recours, avec indication claire qu'il s'agit d'une ancienne source.
- Le laboratoire a détecté **27 fichiers, soit 19 Excel/CSV et 8 PDF**, sans erreur de repérage dans le test rapporté. La lecture de PDF avait été observée, mais l'extraction fiable et générique des tableaux PDF n'est PAS encore garantie.
- Excel/CSV priorité ; PDF à titre expérimental ou après amélioration fiable. OCR uniquement si nécessaire et justifié, pas comme mécanisme obligatoire.
- Toujours isoler proprement le fabricant, le dossier, la catégorie et le fichier. Une erreur antérieure faisait afficher `Preview` comme fabricant, des sections vides et des associations erronées Excel/PDF : LAB 0.7 a été créé pour y remédier.
- Le laboratoire peut proposer une colonne candidate, par exemple **C**, mais elle doit être confirmée et ne doit pas devenir automatiquement une règle universelle.
- La catégorie produit doit être confirmée lorsque la remise dépend de cette catégorie.

### Fiche Procurement Portal Salesforce

Capture/lecture via l'onglet Edge déjà authentifié, avec permission temporaire `activeTab` et sans accès API/serveur supplémentaire. Le prototype a détecté **15 champs** :
`activelyMonitored`, `applicableSites`, `costColumn`, `currency`, `effectiveDate`, `lastVerification`, `legalEntities`, `manufacturer`, `preferredSupplier`, `priceListLink`, `priceListName`, `pricingSpecifications`, `tradeAgreement`, `upcomingIncrease`, `vendorNumber`.

D'autres champs n'ont pas été détectés dans ce test et ne doivent PAS être simulés comme présents : `nextVerification`, `volumeDiscount`, `transportation`, `warranty`.

Les règles de la fiche peuvent dépendre de la catégorie de produit, du volume, d'une activité de location ou d'achat et des dates. Elles ne sont pas toutes convertibles en formule automatique fiable.

### Exemple vérifié MDG

Fiche `Price List: MDG` :
- Fabricant MDG ; société CAOP ; devise CAD ; fournisseur préféré MDG.
- Colonne de coût indiquée : `PUBLIC PRICE -30% DISCOUNT`.
- `Pricing Specifications` : **30 %** de rabais sur génératrices et accessoires, **30 %** sur fluides fumigènes en situation ordinaire.
- Sous `DISCOUNT FOR RENTAL` : mention distincte de **40 % sur les fluides pour achats de plus de 24 boîtes**. Cette règle est CONDITIONNELLE et son application commerciale exacte doit être validée, surtout la notion de location. Ne pas l'appliquer à tous les fluides ni à des commandes inférieures à ce seuil.
- Exemple produit `NF-B4` : prix public **427,00 CAD**, rabais ordinaire **30 %**, coût calculé **298,90 CAD** (`427 × 0,70`). C'est un coût dérivé de la fiche et de la liste de prix, PAS une confirmation comptable D365 du prix réellement facturé.
- Le champ `Price List Effective Date` peut être antérieur à `Last Verification` : conserver et montrer ces dates distinctement, et avertir sur la validité plutôt qu'affirmer automatiquement qu'une liste est actuelle.

### États UX / règles du Price List Finder

Afficher clairement : fabricant, SKU, description, catégorie, document exact, emplacement du document, colonne lue, prix de base, devise, rabais appliqué, règle de calcul, date/validité, source Salesforce, type de coût et degré de confiance.

Séparer :
- **Prix confirmé dans la source**, quand la source établit réellement le montant ;
- **Coût calculé**, avec formule traçable ;
- **Suggestion non confirmée**, lorsqu'une catégorie, une colonne, une condition ou une remise demande validation ;
- **Introuvable / ambigu**, lorsqu'aucun résultat sûr n'existe.

Interdire toute règle de marge générique et toute invention de coût. Si plusieurs listes, devises ou catégories concordent imparfaitement, montrer les candidats et demander confirmation humaine. L'outil ne doit pas modifier Salesforce, SharePoint ou D365.

### État de développement

- **LAB 0.6** : lecture seule, source locale et fiche Salesforce, extraction 15 champs, exemple MDG NF-B4 calculé, tests concluants selon les comptes rendus ; PDF encore exploratoire.
- **LAB 0.7** : corrections de l'isolation fabricant/dossier/fichier et de la sélection de colonne/catégorie ; tests locaux annoncés réussis. Vérifier le véritable contenu du laboratoire joint avant de déclarer toutes ces fonctions présentes.
- **À faire** : recherche multi-SKU, rapprochement aux données D365 selon l'accès réellement disponible, moteur robuste de règles par fournisseur/catégorie, contrôle de dates et conditions, extraction PDF fiable, intégration UX éventuelle au Toolbox.

## 6. Identité visuelle et ergonomie

- Identité inspirée de Solotech, sans recopier servilement le logo : indigo de référence **#2e1b5a**, blanc, nuances lavande et gris discrets.
- Résultat attendu : design moderne, compact, raffiné, très lisible et professionnel. Le style « classique Solotech » propre/épuré a été préféré à certaines propositions trop complexes. Pas de refonte artistique gratuite.
- Logo du Toolbox distinct, harmonie d'ensemble, cohérence des modules et animations utiles.
- Sélecteur FR/EN global, textes bien traduits, focus clavier, statuts accessibles, état vide/chargement/erreur, animation réduite si le système l'exige.
- Priorité à la fiabilité et à la clarté. Aucun délai artificiel empêchant une opération. Toute animation de succès doit correspondre à une confirmation réelle.
- Ne pas utiliser le tiret cadratin dans les textes français ou les brouillons destinés à l'utilisateur.

## 7. Tests, stabilité et sécurité

- Identifier le système de tests existant ; ne présume pas qu'il utilise npm, Playwright ou un framework particulier.
- Préserver et exécuter si possible les tests `.test.cjs` pertinents sous `checks/`, notamment actions CRM, protections de formulaire D365, tests de Product Search et de cache, navigation Power BI, used embedded frames, filtrage régions, rendu de listes.
- Ajouter des tests de non-régression pour chaque modification approuvée. Utiliser fixtures locales et données fictives.
- Protection contre : mauvais onglet/société, mauvais devis/prospect, IDs ambigus, doublons, sélecteurs DOM hors portée, page partiellement chargée, frame inaccessible, stale source et écriture après interruption.
- Ne pas introduire de récupération de cookies/tokens ni de ponts contournant les contextes de sécurité du navigateur.
- Le fonctionnement en temps réel sur Edge connecté à D365, Salesforce et Power BI doit être testé par MOI sur mes comptes existants avec des vérifications manuelles précises. Ne pas déclarer un test simulé « validation live ».

## 8. Ce que j'attends comme PREMIÈRE réponse de Codex

Pour l'instant, ne code PAS. Après lecture des vrais fichiers, donne-moi en français :

1. **Ce que tu as réellement reçu et ouvert** : arborescence, technologies, version(s) et pièces manquantes. Si je n'ai joint que ce prompt, demande clairement les sources originales ; ne simule pas leur présence.
2. **Carte des modules** : fichier(s) responsables, fonctionnalités présentes, interactions entre modules, tests existants.
3. **État d'avancement prouvé** : stable/testé localement/testé dans Edge/expérimental/non exporté/non implémenté. Différencie le ZIP 3.5.7, le checkpoint basé sur 3.5.6 avec travail non exporté, Price List Finder LAB 0.7 et le guide v2.0.1.
4. **Risques prioritaires** et anomalies possibles, sans supposer des bugs que tu n'as pas pu vérifier.
5. **Plan de reprise progressif** en petites étapes réversibles, en donnant priorité aux bugs et aux validations des derniers changements Power BI, puis au Price List Finder indépendant. Évite la refonte complète.
6. **La toute première action recommandée**, ses critères de succès, les tests à lancer et ce que tu as besoin que je vérifie dans Edge.

Réponds en français québécois naturel, clairement et sans longue mise en scène. S'il reste une ambiguïté bloquante, pose-moi uniquement les questions réellement indispensables. Tu es désormais responsable de comprendre l'existant et d'en préserver le fonctionnement avant d'ajouter quoi que ce soit.
