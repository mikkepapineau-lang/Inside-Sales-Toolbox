# Utiliser Inside Sales Toolbox
## Le carnet des six outils

ÉDITION ÉQUIPE · VERSION 3.5.12

Le guide quotidien des ventes internes.

Pour trouver un produit, préparer un prospect et une soumission, mettre des coordonnées au bon format, consulter les commandes, calculer une marge ou vérifier une surtaxe.

**Le fil conducteur :** choisissez l’outil → vérifiez les données → lancez l’action → contrôlez le résultat dans l’application concernée.

Solotech · Ventes internes · 21 octobre 2026

Ce carnet décrit les fonctions présentes dans l’export 3.5.12. Cette publication est une version de test : le véritable défilement Power BI et la lecture des notes restent à confirmer en session connectée. Les exemples de personnes et les chiffres utilisés dans ce carnet sont fictifs.

---

# Se repérer
## Trouver le bon outil

| Vous voulez… | Ouvrez… | Pages |
| --- | --- | --- |
| Préparer les onglets du matin | Accueil | 3 |
| Passer d’un lead à une soumission | Salesforce | 4–6 |
| Reformater et remplir un contact | Contacts | 7 |
| Chercher du stock neuf dans D365 | Produits → Neuf | 8 |
| Chercher et actualiser l’usagé | Produits → Usagé | 9–11 |
| Consulter les commandes prêtes | Commandes | 12 |
| Calculer marge, prix, coût et taxes | Calculs → Marge | 13 |
| Convertir CAD et USD | Calculs → Conversion | 14 |
| Vérifier la liste de surtaxes | Codes HS | 15 |
| Utiliser la sélection et le clic droit | Menu du navigateur | 16 |
| Comprendre les données et les sigles | Aide | 17 |
| Résoudre un problème | Aide | 18 |

## Trois habitudes à adopter

1. **Vérifiez la bonne page et la bonne société.** Le parcours D365 de l’équipe utilise CAOP. Confirmez le client, la commande ou la soumission visés.
2. **Distinguez consulter et modifier.** Une recherche produit consulte des données. Remplir un formulaire remplace des champs; confirmer une création peut enregistrer un nouveau dossier.
3. **Lisez le message de résultat.** Une quantité inconnue ou non revérifiée ne doit pas être interprétée comme zéro ou comme une disponibilité confirmée.

Gardez le **Panneau** ouvert pour travailler d’un onglet à l’autre. **FR / EN** change la langue de l’interface; les données sources conservent leur langue.

---

# Préparer sa journée
## Ouvrir les pages utiles sans les chercher

À la première ouverture du jour, l’accueil propose **Préparer ma journée**. Cliquez sur **Préparer**.

Le Toolbox ouvre ou réutilise les quatre pages suivantes :

- **All prospects** dans D365 : pour préparer les prospects.
- **Product Search** dans D365 : pour rechercher le stock neuf.
- **Ready to PIK** dans Power BI : pour consulter les commandes prêtes.
- **Used Gear** dans Power BI : pour le catalogue usagé.

Les onglets reconnus sont regroupés sous **Solotech Toolbox** dans la fenêtre courante. Le groupe peut être réduit pour libérer la barre d’onglets. Les onglets épinglés sont conservés; une page de travail distincte peut être utilisée au besoin.

**Cette préparation ne remplit aucun formulaire et ne lit aucun rapport.** Si une application demande votre connexion, connectez-vous avec votre compte habituel.

## Relancer la préparation

Après une réussite, le bouton quotidien est masqué pour la journée, selon l’heure de Toronto. La croix permet de le reporter au lendemain.

Pour rouvrir un onglet fermé ou reprendre une préparation incomplète, utilisez **Préparer les onglets de travail** sur l’accueil. Les pages reconnues sont réutilisées plutôt que systématiquement dupliquées.

## Retrouver son outil

Le Toolbox reprend le dernier outil lors des retours rapides. À la prochaine ouverture après 30 minutes d’inactivité, il revient à l’accueil. Le redémarrage du navigateur réinitialise aussi la navigation, sans effacer à lui seul les contacts et données locales du catalogue.

---

# Salesforce → D365
## Étape 1 · Récupérer et vérifier le lead

**À préparer :** le lead Salesforce voulu, votre connexion Salesforce et votre accès D365 CAOP.

1. Ouvrez la fiche du lead dans Salesforce. Affichez **Details** si les champs ne sont pas visibles.
2. Ouvrez **Salesforce** dans le Toolbox, puis cliquez sur **Récupérer le lead Salesforce**.
3. Laissez la récupération terminer. Vérifiez le nom du contact, la compagnie, le téléphone, le poste et le courriel.
4. Vérifiez le type **Personne / Organisation**, l’adresse, la langue et les paramètres proposés. Corrigez les erreurs avant de continuer.
5. Si nécessaire, cliquez sur **Rechercher les coordonnées** pour retrouver les renseignements de la compagnie à partir du domaine du courriel.
6. Relisez la proposition avant de l’utiliser. Quand le résultat est correct, utilisez l’action de reprise proposée, puis **Continuer vers le prospect** lorsque cette étape est disponible.

## Comment fonctionne la recherche ?

Le Toolbox consulte le site de la compagnie pour y chercher des coordonnées. Il peut aussi tenter de reprendre une adresse affichée dans Google Maps. Une adresse ambiguë doit être vérifiée manuellement.

Le domaine du courriel aide à faire une proposition; il ne prouve pas le nom légal de l’entreprise. Une adresse courriel personnelle peut conduire à proposer Personne. Vous devez confirmer le bon type de client.

**Exemple fictif :** un lead présente « Alex Martin », « Exemple Audio », un téléphone et un courriel. Vérifiez que l’adresse trouvée correspond à la bonne compagnie avant de la transférer vers D365.

**Données à reprendre :** le lead est conservé pour le parcours pendant huit heures dans la session du navigateur. S’il n’est plus disponible, ouvrez sa fiche et récupérez-le à nouveau.

---

# Salesforce → D365
## Étape 2 · Préparer et créer le prospect

1. Vérifiez que vous êtes dans **CAOP**. Ouvrez **All prospects** dans D365 si nécessaire.
2. Dans l’étape **Prospect** du Toolbox, cliquez sur **Remplir le prospect**.
3. Suivez la progression et lisez le **Rapport du remplissage** : il distingue les valeurs saisies, conservées et à vérifier.
4. Contrôlez le formulaire dans D365 : nom, type de client, langue, adresse et autres champs proposés.
5. Quand tout est correct, cliquez sur **Confirmer et créer le prospect**.
6. Attendez le résultat et vérifiez le dossier créé dans D365 avant de poursuivre vers la soumission.

## Ce qui peut être enregistré

La confirmation crée le prospect puis le parcours remplit et enregistre ses dimensions financières. Ce bouton a donc un effet dans D365; il ne sert pas seulement à afficher un aperçu.

Les valeurs par défaut visibles dans cette édition comprennent **Activity : ECOMM**, **Department : 021**, **Division : 003** et **Office : MONTREAL**. Vérifiez les champs réels du dossier. Le territoire peut être proposé selon l’adresse; sans adresse exploitable, une valeur de repli MONTREAL peut être proposée.

**Proposer selon l’adresse** utilise une recherche de localisation qui transmet l’adresse à Photon/OpenStreetMap. Relisez la proposition avant de la retenir.

## Si le parcours s’arrête

Consultez le message au-dessus des étapes. Ouvrez **Diagnostic D365** pour obtenir les informations de repérage des champs. Vérifiez le bon formulaire et la bonne société.

**Ne recréez pas un prospect déjà enregistré.** Si le message indique que l’enregistrement a été tenté, cherchez d’abord le dossier dans D365 et confirmez son numéro. Une nouvelle tentative de création peut produire un doublon.

---

# Salesforce → D365
## Étape 3 · Créer la soumission

1. Dans l’étape **Soumission**, vérifiez **Sales origin : ECOMM** et **Payment : PAYMENT IN ADVANCE**, Ces paramètres sont prédéfinis dans ce parcours; vérifiez qu’ils conviennent au dossier réel.
2. Choisissez le **Site**, puis le **Warehouse** proposé pour ce site. Un changement de site efface l’entrepôt précédemment choisi; HAL sélectionne automatiquement son seul entrepôt.
3. Ouvrez **Coordonnées reprises du lead** et vérifiez le texte destiné à Internal Notes, Delivery Contact Information et Email.
4. Cliquez sur **Créer la soumission**. Le Toolbox ouvre le formulaire de création D365, renseigne les paramètres, vérifie Site / Warehouse puis confirme la création.
5. Utilisez **Ouvrir la soumission dans D365** pour vérifier le numéro, le client et les coordonnées de la soumission créée.
6. Vérifiez puis enregistrez les coordonnées dans D365. Ne supposez pas que cette dernière vérification est faite à votre place.

## Site et Warehouse

La liste comprend les sites **MTL, QUE, HAL, OTT, TOR, USED-CA et CAL**. Seuls les entrepôts associés au site choisi sont proposés. Le préfixe de l’entrepôt ne suffit pas toujours à déterminer son site : utilisez la liste du Toolbox.

Le Toolbox remplit Site avant Warehouse et vérifie la combinaison. S’il ne peut pas confirmer ces champs, la création peut rester en attente dans D365. Lisez le message et terminez la vérification sur le formulaire.

## Une soumission existe, mais ses coordonnées sont incomplètes ?

Utilisez **Réessayer les coordonnées** pour reprendre le remplissage dans la soumission existante, ou le module **Coordonnées client**. **Ne cliquez pas de nouveau sur Créer la soumission pour réparer les coordonnées.**

Internal Notes reçoit le contact sur plusieurs lignes; Delivery Contact Information reprend le nom et le téléphone; Email reçoit le courriel. Les dimensions du prospect ne sont pas remplies de nouveau à cette étape.

---

# Coordonnées client
## Préparer un contact et remplir le bon dossier

1. Ouvrez **Contacts**. Collez une signature ou du texte dans **Coordonnées ou signature à reformater**, puis cliquez sur **Extraire les coordonnées**. Vous pouvez aussi choisir **Reprendre le contact du lead Salesforce**.
2. Vérifiez les trois champs : **Nom complet**, **Téléphone et poste**, **Courriel**. Corrigez-les directement au besoin.
3. Vérifiez l’**Aperçu Internal Notes**.
4. Pour copier seulement le texte, cliquez sur **Copier les notes**, puis collez-le vous-même à l’endroit voulu.
5. Pour remplir D365, ouvrez la commande ou soumission voulue, passez en **Edit** et rendez ses champs de coordonnées visibles. Gardez cet onglet comme cible.
6. Cliquez sur **Remplir dans D365**, contrôlez les champs, puis enregistrez dans D365.

## Exemple fictif de notes

Alex Martin

(514) 555-0100 #227

alex.martin@example.com

Le format Delivery Contact Information rassemble le nom et le téléphone sur une ligne. Le courriel est normalisé en minuscules et le poste est présenté avec #.

**Attention : Remplir dans D365 remplace les coordonnées des champs ciblés, même si des valeurs sont déjà présentes.** Dans une soumission, les cibles comprennent Internal Notes, Delivery Contact Information et Email. Dans une commande, Telephone est aussi pris en charge.

Les coordonnées restent conservées dans votre profil à la fermeture. **Effacer ces coordonnées** vide ce module. **Diagnostic coordonnées D365** aide à identifier un champ manquant; il ne remplace pas votre contrôle du client et du numéro de dossier.

---

# Recherche de produits · Neuf
## Consulter le stock D365 par entrepôt

1. Ouvrez **Produits**, puis **Neuf**.
2. Saisissez un **SKU ou texte**, par exemple SM58-LC, puis cliquez sur **Rechercher**.
3. Le Toolbox utilise un onglet **Product Search** D365 CAOP. Il peut en réutiliser un ou en ouvrir un si nécessaire.
4. Consultez la fiche de l’article et ses lignes par entrepôt ou emplacement. Ouvrez les détails pour voir les informations sources.
5. Utilisez **Ouvrir dans D365** pour vérifier le résultat complet, surtout avant de promettre une disponibilité.

## Comprendre le résultat

Le **numéro d’article D365** sert à regrouper les lignes d’une même fiche. Deux numéros D365 différents restent deux articles, même si leur SKU est semblable.

La disponibilité physique positive est mise en évidence en vert. Les informations d’inventaire physique, de réservation et de commande restent accessibles dans les détails. Les champs et blocs à zéro sont simplifiés dans la vue compacte.

Les entrepôts **MTL-06 et YUL-99** sont exclus de cette recherche. Cette règle est indépendante de la liste d’entrepôts utilisée pour créer une soumission.

## Recherche depuis une autre page

Sur une page fabricant ou fournisseur, sélectionnez un SKU. Faites un clic droit, puis **Inside Sales Toolbox → Rechercher dans D365 · Product Search**. Le panneau latéral s’ouvre et lance la recherche pendant que vous restez sur votre page.

**Ce résultat est une consultation des lignes chargées par D365.** Il ne garantit pas que toutes les lignes possibles ont été récupérées. Les emplacements distincts ne doivent pas être additionnés sans vérification. La recherche ne réserve aucun stock et ne crée aucune commande.

---

# Recherche de produits · Usagé
## Trouver un article et comprendre les quantités

1. Ouvrez **Produits → Usagé**.
2. Choisissez vos **Sous-régions** : Canada, UK, USA ou une combinaison.
3. Recherchez par SKU, numéro D365, fabricant ou description.
4. Au besoin, activez **Disponibles seulement** et utilisez les six menus de **Filtres** : Catégorie, Sous-catégorie, SKU, Fabricant, N° D365 et Modèle.
5. Ouvrez un article pour consulter son détail. Vérifiez la devise, la date et l’état de ses quantités avant de vous engager.

## Comment les filtres se combinent

Plusieurs valeurs dans le même menu signifient **l’une ou l’autre**. Des choix dans plusieurs menus doivent être respectés **ensemble**. Les menus proposent des valeurs compatibles avec les autres filtres.

La recherche dans un menu couvre toutes ses valeurs, même si seules les premières sont affichées. **Tout afficher** efface le choix de ce filtre. **Réinitialiser** efface les filtres, la recherche et Disponibles seulement. **Filtres** replie les menus sans supprimer les choix.

La recherche porte sur tout le catalogue chargé. La liste s’affiche par tranches de 80 : **Afficher 80 articles de plus** ajoute une tranche à l’écran.

## Ce que les chiffres veulent dire

Le catalogue initial comprend **12 851 articles**, issus du fichier du 15 octobre 2026, en **CAD**, selon ses filtres USA / CANADA / UK. Ce total n’est pas une promesse d’inventaire disponible aujourd’hui.

Le prix de vente et le **NBV** restent visibles. Un vrai zéro est conservé; une valeur absente reste non renseignée. Le NBV est une valeur comptable nette, distincte du prix de vente. Un entrepôt n’apparaît que si la source le fournit.

---

# Usagé · Actualiser depuis Power BI
## Quantités et prix ont des actions distinctes

**Sélection des pays :** un clic choisit un seul pays. **Ctrl + clic**, ou **⌘ + clic** sur Mac, ajoute ou retire un pays. **Tout sélectionner** choisit Canada + UK + USA. Au moins un pays reste sélectionné.

1. Connectez-vous au rapport **Used Gear** avec votre compte.
2. Choisissez les pays dans le Toolbox, puis cliquez sur **Actualisation → Quantités**.
3. Laissez le rapport chargé pendant la lecture. Le Toolbox vérifie la sélection SUBREGION dans Power BI; ne changez pas les pays ou filtres pendant cette opération.
4. Attendez la confirmation de réussite et relisez la date et la couverture affichées. Si un bouton **Réessayer** apparaît, lisez le message avant de relancer.

## Les sept combinaisons sont indépendantes

Chaque combinaison de pays conserve son propre relevé quotidien, selon l’heure de Toronto. Les relevés séparés ne sont pas additionnés pour fabriquer une combinaison. Sans relevé vérifié de la sélection, les quantités d’une autre combinaison ne sont pas utilisées à sa place.

**Quantités** peut réutiliser le relevé déjà récupéré aujourd’hui. Dans **Options du catalogue**, **Forcer la lecture Power BI** relit le rapport pour la sélection, même si un relevé existe déjà.

**Prix + NBV** relit séparément les données financières du catalogue global sur Canada + UK + USA, dans la devise du catalogue. Cette action conserve les quantités et leurs relevés régionaux. Les autres filtres du rapport influencent les lignes lues.

La lecture peut être longue car elle parcourt les lignes du tableau. **Arrêter le chargement** permet d’interrompre la récupération et de conserver les données précédentes. Une sélection ambiguë ou un visuel devenu inaccessible annule la nouvelle lecture.

**Important :** ces actions relisent les données affichées; elles ne rafraîchissent pas le modèle Power BI. Le défilement réel de cette version reste à confirmer dans une session connectée.

---

# Usagé · Importer un export Excel
## Une autre façon de mettre le catalogue à jour

1. Obtenez l’export **.xlsx** approprié du rapport Used Gear. Vérifiez ses filtres, sa devise et les pays couverts.
2. Dans **Options du catalogue**, choisissez **Mise à jour par Excel** avant l’import.
3. Pour les quantités régionales, choisissez dans le Toolbox exactement les mêmes pays que ceux annoncés par le fichier.
4. Cliquez sur **Importer Excel**, choisissez le fichier et attendez le résultat.
5. Relisez le bilan et les dates de mise à jour avant d’utiliser les données.

| Mode d’import | Ce qu’il met à jour |
| --- | --- |
| Quantités seulement | Les quantités, en conservant les prix, NBV et descriptions existants. C’est le mode par défaut. Les nouveaux articles peuvent être ajoutés. |
| Prix et NBV seulement | Les données financières des articles existants; conserve les quantités et relevés régionaux. Utilisez un export global Canada + UK + USA dans la même devise. |
| Toutes les données, prix et NBV inclus | Les données des articles correspondants, y compris les données financières. Choisissez Tout sélectionner et un export global dans la même devise. |

## Les règles de conservation

Un article absent d’un nouvel import n’est pas supprimé : il peut garder ses anciennes quantités avec la mention **Quantités non revérifiées**. Une absence ne devient jamais zéro. Une quantité explicitement à zéro peut remplacer l’ancienne.

Le numéro D365 est l’identifiant principal. Sans ce numéro, une correspondance unique peut être recherchée avec SKU, fabricant et modèle; une correspondance ambiguë est ignorée. Les quantités de lignes distinctes ne sont pas additionnées automatiquement.

**Rétablir le catalogue Excel initial** remplace les mises à jour locales par le catalogue initial et efface les relevés régionaux. Utilisez cette action seulement si vous voulez réellement revenir au point de départ.

---

# Commandes prêtes
## Consulter, filtrer et trier Ready to PIK

1. Ouvrez **Commandes**. Vérifiez votre accès au rapport Power BI; la flèche **↗** permet de l’ouvrir.
2. Cliquez sur **Actualiser**. Le Toolbox sélectionne la page **Ready to PIK** et lit les lignes accessibles selon les filtres actifs du rapport.
3. Recherchez un client, une **SO** ou une référence.
4. Combinez les filtres **Livraison** et **Paiement** pour réduire la liste.
5. Choisissez **Classer par** : livraison, termes de paiement, montant croissant ou décroissant, ou nom du client.
6. Contrôlez la commande dans la source avant toute action opérationnelle.

## Lire une fiche

Le **client** sert de titre. Le numéro **SO** apparaît dessous et le montant reste visible. Les tris par livraison et paiement peuvent regrouper les commandes. Les filtres et tris du Toolbox sont locaux et ne relisent pas Power BI à chaque changement.

Les **Internal Notes** apparaissent sous la SO quand la lecture le permet. Si elles ne sont pas disponibles dans le rapport, le Toolbox peut les rechercher dans les commandes déjà ouvertes dans D365. Le numéro SO doit correspondre exactement.

Une note confirmée vide est différente d’une colonne non chargée ou inaccessible. Ne remplacez pas ces informations par une supposition. Le champ **InternalReference** ne doit pas être interprété comme Internal Notes : sa signification reste à confirmer.

## Options du rapport

**Utiliser l’onglet Power BI actif** permet d’associer le bon rapport si nécessaire. **Diagnostic Power BI** aide à comprendre un échec. **Effacer les données récupérées** retire la copie locale de ce module.

**Actualiser** relit le rapport; ce bouton ne rafraîchit pas son modèle de données. L’exhaustivité des lignes n’est pas garantie. Le véritable défilement Power BI de cette version reste à valider en session connectée.

---

# Calculateur · Marge
## Verrouiller deux valeurs pour calculer la troisième

1. Ouvrez **Calculs → Marge**.
2. Choisissez les devises du **Coût** et du **Prix de vente**. Si elles diffèrent, vérifiez le taux CAD / USD affiché.
3. Utilisez les cadenas pour conserver **deux valeurs connues** parmi Coût, Prix de vente et Marge. La troisième est calculée et porte la mention **RÉSULTAT**.
4. Saisissez les deux valeurs connues. Ajoutez un **Escompte sur le coût** si applicable.
5. Vérifiez le **Taux de taxes**, puis les montants Avant taxes, Taxes et Avec taxes.

## Trois exemples fictifs · même devise, sans escompte

| Valeurs connues | Valeur calculée |
| --- | --- |
| Coût 100 $; marge 20 % | Prix de vente 125 $ |
| Prix de vente 125 $; marge 20 % | Coût 100 $ |
| Coût 100 $; prix de vente 125 $ | Marge 20 % |

**La marge se calcule sur le prix de vente.** Elle n’est pas la majoration ajoutée au coût. Avec 100 $ de coût et 20 % de marge, le prix est 125 $, pas 120 $.

## Escompte et taxes

Un escompte réduit le coût utilisé pour le calcul. Exemple : coût 100 $, escompte 10 %, marge 20 % → coût net 90 $, prix de vente 112,50 $ avant taxes.

Le taux de taxes initial est **14,975 %**, mais vous devez le vérifier pour le dossier. Pour 125 $ avant taxes à ce taux, les taxes sont 18,72 $ et le total 143,72 $. Les taxes s’appliquent au prix de vente affiché, arrondi aux cents.

Les montants négatifs ne sont pas acceptés pour le coût ou le prix. La marge saisie et l’escompte doivent rester sous 100 %. **Effacer les valeurs** permet de reprendre le calcul; revérifiez ensuite devises et taxes.

---

# Calculateur · Conversion
## Passer de CAD à USD, ou l’inverse

1. Ouvrez **Calculs → Conversion**.
2. Entrez le **Montant à convertir**, puis choisissez la devise de départ.
3. Choisissez la devise d’arrivée. **Inverser les devises** échange le sens de conversion.
4. Lisez le **Montant converti**, sa devise et le taux utilisé.
5. Cliquez sur **Actualiser le taux** si vous voulez tenter de récupérer la dernière observation publiée.

## Comprendre le taux affiché

La source est la **Banque du Canada**. Le taux demandé correspond au nombre de dollars canadiens pour un dollar américain. Il s’agit d’une observation publiée, pas d’un taux de transaction bancaire garanti ou d’une cotation en temps réel.

**Exemple fictif :** si le taux était de 1 USD = 1,35 CAD, 100 USD donneraient 135 CAD; 135 CAD donneraient 100 USD. Le taux réellement affiché par votre Toolbox peut être différent.

Le Toolbox réutilise normalement un taux vérifié depuis moins d’une heure. La date de l’observation peut précéder le jour de votre demande. Relisez cette date, surtout après une fin de semaine ou un jour férié.

## Si la source ne répond pas

Un taux précédemment enregistré peut être utilisé avec une indication de repli hors ligne. S’il n’existe aucun taux utilisable, la conversion entre devises ne peut pas être calculée. Vérifiez la connexion et les accès, puis réessayez.

Les calculs de marge avec coût et prix dans des devises différentes utilisent aussi ce taux. Vérifiez-le avant de reprendre un résultat dans une soumission.

**Les montants saisis restent sur cet appareil.** La requête à la Banque du Canada demande le taux public, sans transmettre vos montants de calcul.

---

# Codes HS
## Consulter les surtaxes canadiennes listées

1. Ouvrez **Codes HS**.
2. Choisissez **Origine du produit** : À confirmer, États-Unis ou Autre pays.
3. Saisissez le **Code HS / SH** fourni pour l’article. Utilisez 4 ou 6 chiffres pour explorer une famille, 8 ou 10 chiffres pour un article plus précis.
4. Lisez les descriptions et les taux publiés. Cliquez sur un code proposé pour consulter cet article exact.
5. Dans **Source et actualisation**, cliquez sur **Actualiser maintenant** et vérifiez la date ainsi que la période d’application.
6. Utilisez **Consulter le tableau sur Canada.ca** pour vérifier les conditions de la source officielle.

## Ce que cet outil couvre

Il consulte une liste de surtaxes canadiennes visant les produits américains. Une famille à 4 ou 6 chiffres peut contenir plusieurs articles et plusieurs taux : un taux ne s’applique pas automatiquement à toute la famille.

**Aucune correspondance** signifie que le code n’a pas été trouvé dans le tableau consulté. Cela ne prouve ni la validité du code, ni l’absence de droits ou de surtaxes.

Si l’origine est **Autre pays**, le produit sort du périmètre de cette liste. Le pays d’expédition n’est pas nécessairement le pays d’origine du produit.

## Quand faut-il revérifier ?

Une copie incluse à l’installation ou conservée localement peut s’afficher si la source ne répond pas. L’interface signale alors que l’actualité des résultats reste à confirmer. Une période expirée demande une actualisation.

Le Toolbox ne calcule pas tous les droits, exemptions, remises ou conditions applicables. Avant de confirmer un coût d’importation à un client, faites vérifier le classement et l’application des règles par la personne responsable de ces questions dans votre organisation.

---

# Les raccourcis au clic droit
## Réutiliser le texte d’une page

Sélectionnez d’abord le texte utile sur une page, puis faites un clic droit et ouvrez **Inside Sales Toolbox**. Les libellés suivent votre choix FR / EN.

| Action | Utilité |
| --- | --- |
| Rechercher dans D365 · Product Search | Lance la recherche du SKU ou du texte sélectionné et ouvre le panneau latéral. |
| Préparer les coordonnées du client | Propose un contact à partir du texte sélectionné. Relisez les champs avant de les utiliser. |
| Ajouter au texte de coordonnées | Ajoute la sélection au texte déjà présent, par exemple pour compléter une signature. |
| Utiliser comme nom, téléphone ou courriel | Reprend une seule donnée en conservant les autres champs du contact. |
| Vérifier ce code HS | Ouvre le vérificateur avec le code sélectionné. |
| Texte en MAJUSCULES / minuscules / Majuscule au début de chaque mot | Prépare un texte transformé que vous pouvez vérifier puis copier. |

## Exemple de travail

Vous lisez une page fournisseur. Sélectionnez le SKU, faites un clic droit et lancez Product Search. Consultez le stock dans le panneau sans recopier le SKU à la main.

Pour une signature, sélectionnez le bloc complet et choisissez Préparer les coordonnées du client. Si le téléphone manque, sélectionnez-le ensuite et utilisez l’action correspondante pour compléter le contact.

Certains raccourcis ouvrent une petite fenêtre du Toolbox qui reste disponible pendant vos changements d’onglets. Pour les textes transformés, utilisez **Copier le texte formaté** puis collez le résultat dans votre application.

**Le texte sélectionné doit toujours être relu.** Un clic droit prépare ou ouvre un outil; il ne confirme pas que les coordonnées ou le code choisi sont corrects pour le dossier client.

---

# Comprendre vos données
## Ce qui est conservé et ce qui est partagé

Contacts, recherches, filtres, imports et certains résultats restent dans votre profil de navigateur. Ils ne se synchronisent pas automatiquement entre collègues, ordinateurs, Edge ou Chrome. Le lead Salesforce est conservé huit heures dans la session; récupérez-le à nouveau lorsqu’il n’est plus disponible.

Préparer les onglets ne modifie aucun dossier. Les boutons de remplissage et de création peuvent écrire dans D365 : vérifiez la cible. Les fonctions en ligne exigent vos accès. Une copie locale du catalogue ou d’un résultat ne prouve pas son actualité.

## Petit lexique

| Terme | Ce qu’il signifie ici |
| --- | --- |
| Lead / prospect | Fiche de contact commercial à reprendre de Salesforce vers le parcours D365. |
| Soumission / quotation | Proposition commerciale créée dans D365; différente d’une commande. |
| SO | Numéro de commande de vente, ou Sales Order. |
| SKU | Référence de produit; elle peut être distincte du numéro d’article D365. |
| Site / Warehouse | Site et entrepôt à vérifier dans D365. |
| NBV | Valeur comptable nette; distincte du prix de vente et de la quantité. |
| Internal Notes | Champ de notes internes. InternalReference est un champ distinct. |
| HS / SH | Système harmonisé de classement des marchandises. |
| CAOP | Société D365 configurée pour cette édition du Toolbox. |

Pour transmettre un problème au soutien, privilégiez le message exact et des captures masquées. Un diagnostic peut contenir des renseignements de votre environnement; vérifiez-le avant de le partager.

---

# Dépannage et bons réflexes
## Retrouver le bon point de départ

**Lead introuvable :** ouvrez la fiche Salesforce voulue, affichez Details, confirmez votre connexion et récupérez le lead à nouveau.

**Champ D365 introuvable ou valeur refusée :** vérifiez CAOP, le bon formulaire et le mode Edit lorsque demandé. Affichez les champs concernés. Utilisez le diagnostic du module et relisez le résultat avant de recommencer.

**Un prospect ou une soumission existe déjà :** recherchez-le dans D365. Réessayez seulement les coordonnées si c’est ce qui manque; ne recréez pas le dossier pour réparer un remplissage.

**Aucun résultat produit confirmé :** ouvrez la source D365, vérifiez le SKU, les lignes chargées et votre connexion. Un affichage partiel ne prouve pas une absence de stock.

**Power BI bloqué, inaccessible ou incomplet :** ouvrez le rapport avec votre compte, vérifiez l’accès de l’extension au site et utilisez le bon onglet actif dans les options. Consultez le diagnostic. Ne changez pas les filtres pendant une lecture.

**Usagé : quantité inconnue ou non revérifiée :** choisissez les bons pays puis actualisez les quantités, ou importez le fichier approprié. Ne transformez pas une valeur inconnue en zéro et ne promettez pas du stock à partir d’un ancien relevé.

**Conversion indisponible :** vérifiez les autorisations et la connexion, puis actualisez le taux. Si un taux de repli est affiché, contrôlez sa date avant usage.

**Copie impossible :** revérifiez l’autorisation de presse-papiers. **Ancien affichage :** rechargez l’extension, actualisez les pages, fermez et rouvrez le panneau.

## Pour demander de l’aide

Transmettez **Équipe 3.5.12**, le navigateur et sa version, l’outil, l’action tentée et le message exact, avec une capture masquée si utile. Les essais en session Power BI/D365 connectée restent distincts des tests locaux du code.

**Ressources :** [téléchargement officiel 3.5.12](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/releases/tag/equipe-v3.5.12) · carnet « Installer Inside Sales Toolbox ».
