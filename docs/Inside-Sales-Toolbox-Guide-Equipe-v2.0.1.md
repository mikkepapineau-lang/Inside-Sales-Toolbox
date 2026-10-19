# Inside Sales Toolbox
## Guide d’installation et d’utilisation
Solotech · Version équipe 2.0.1 · 14 octobre 2026

Ce guide accompagne le fichier Inside-Sales-Toolbox-Equipe-v2.0.1.zip. Chaque collègue installe le Toolbox dans son navigateur et utilise sa propre session Salesforce et Dynamics 365. Le Toolbox est configuré pour la société CAOP.

## 1. Les quatre outils
Salesforce vers Dynamics : récupérer un lead, préparer un prospect et créer une soumission.
Coordonnées client : mettre un contact au bon format et remplir les champs D365.
Product Search : consulter les résultats d’inventaire D365 par article et entrepôt.
Codes HS : consulter les surtaxes canadiennes listées pour les produits américains.

## 2. Avant l’installation
Utilise une version récente de Microsoft Edge ou Google Chrome sur ton ordinateur.
Garde le ZIP et le dossier extrait dans un emplacement permanent. L’extension dépend de ce dossier.
Connecte-toi à Salesforce et à Dynamics 365 avec tes accès habituels.
La création de prospect et de soumission utilise CAOP. Les identifiants de champs sont ceux de l’environnement Solotech.
Le code utilise les API communes à Edge et Chrome. Les parcours D365 ont été testés par l’utilisateur dans Edge. Le fonctionnement réel dans Chrome reste à valider. L’ouverture du panneau latéral nécessite Chrome 116 ou plus récent.

## 3. Installer dans Microsoft Edge
1. Décompresse le ZIP dans un dossier permanent, par exemple Documents/Inside Sales Toolbox.
2. Ouvre edge://extensions dans la barre d’adresse.
3. Active le Mode développeur.
4. Clique sur Charger l’extension décompressée.
5. Sélectionne le dossier qui contient directement manifest.json. Ne sélectionne pas le ZIP.
6. Le Toolbox apparaît dans la liste des extensions.
7. Ouvre le menu Extensions du navigateur et affiche son icône dans la barre d’outils si souhaité.
8. Clique sur l’icône du Toolbox.

## 4. Installer dans Google Chrome
1. Décompresse le même ZIP dans un dossier permanent.
2. Ouvre chrome://extensions.
3. Active le Mode développeur.
4. Clique sur Load unpacked, ou Charger l’extension non empaquetée selon la langue du navigateur.
5. Sélectionne le dossier qui contient manifest.json.
6. Ouvre le menu Extensions et épingle le Toolbox si souhaité.
7. Clique sur son icône.

Si le mode développeur ou l’installation locale sont désactivés par ton organisation, demande au service TI de permettre cette installation. Le ZIP n’est pas une installation depuis le Chrome Web Store ou Edge Add-ons.

## 5. Premier démarrage et autorisations
Clique sur Autoriser tous les accès, ou Allow all access en anglais. Accepte la demande du navigateur.
Le Toolbox utilise l’accès aux sites HTTPS pour Salesforce, D365, Canada.ca, les sites des compagnies et les recherches d’adresse. Il demande aussi l’autorisation de copier dans le presse-papiers.
La recherche de coordonnées consulte le site de la compagnie à partir du domaine du courriel. La recherche d’adresse peut utiliser Google Maps. La proposition de territoire utilise Photon/OpenStreetMap.
Le bloc d’autorisations disparaît lorsque tous les accès sont accordés. Il revient si un accès manque ou a été retiré.

## 6. Navigation, panneau latéral et langue
Les raccourcis du haut donnent accès à Accueil, Salesforce, Contacts, Produits et Codes HS.
Clique sur Panneau, ou Side panel, pour garder le Toolbox ouvert à droite pendant que tu changes d’onglet. Le popup se ferme lorsque tu cliques ailleurs. Le panneau latéral reste ouvert jusqu’à sa fermeture.
Choisis FR ou EN dans l’en-tête. Le choix s’applique aux modules et au menu clic droit, et reste mémorisé.
La langue de l’interface ne modifie pas la préférence du client dans D365. Un client peut conserver fr-CA même si tu utilises le Toolbox en anglais.
Les descriptions de produits et les données provenant de D365 ou de Canada.ca conservent leur langue d’origine. Certains rapports techniques restent dans la langue de leur source.

## 7. Salesforce vers Dynamics : le lead
1. Ouvre le lead Salesforce. Affiche Details si les champs ne sont pas visibles.
2. Dans le module Salesforce, clique sur Récupérer le lead Salesforce, ou Capture Salesforce lead.
3. Vérifie le contact, la compagnie, le téléphone, le poste et le courriel.
4. Vérifie aussi Organisation ou Personne, la langue, l’adresse et les paramètres D365.
Une adresse courriel d’un fournisseur personnel peut proposer Personne. Un domaine d’entreprise peut proposer Organisation.
Si Company est vide ou identique au nom du contact, le Toolbox peut proposer un nom de compagnie d’après le domaine. Cette proposition doit être vérifiée. Un domaine personnalisé ne prouve pas à lui seul le nom légal de la compagnie.
Rechercher les coordonnées consulte le site, y compris les adresses visibles et les pages Contact ou À propos.
Clique sur Utiliser ces coordonnées lorsque la proposition est correcte. Le Toolbox tente ensuite de reprendre l’adresse affichée par Google Maps.
L’import du format Google exige un résultat unique avec le même numéro civique et le même code postal. Si la lecture échoue ou reste ambiguë, l’adresse du site est conservée et le message demande une vérification.
Vérifie le nom, l’adresse complète et la taxe avant de continuer.

## 8. Salesforce vers Dynamics : le prospect
1. Dans D365, ouvre All prospects dans CAOP, ou laisse le Toolbox ouvrir ce module s’il est absent.
2. À l’étape Prospect, clique sur Remplir le prospect.
3. Consulte le rapport et vérifie les données.
4. Clique sur Confirmer et créer le prospect.
Le Toolbox crée le prospect puis remplit et enregistre ses dimensions financières par défaut : Activity ECOMM, Department 021, Division 003, Office et Territory selon les paramètres du parcours.
La langue choisie dans le Toolbox remplace la langue préremplie du formulaire, par exemple fr-CA.
Le Toolbox conserve les autres valeurs existantes selon sa règle de remplissage. Le rapport précise ce qui a été saisi ou conservé.
Les onglets Product Search et les commandes ne servent pas de cible pour créer un prospect. Si plusieurs onglets All prospects sont ouverts, le Toolbox préfère l’onglet mémorisé, puis un onglet actif ou utilisé récemment.
Si le message indique que Save a déjà été cliqué, vérifie D365 avant de relancer. Ne recrée pas un prospect déjà enregistré.

## 9. Salesforce vers Dynamics : la soumission
1. À l’étape Soumission, vérifie l’entrepôt.
2. Clique sur Créer la soumission.
3. Le Toolbox ouvre New Sales Quotation, remplit Sales origin ECOMM, Payment PAYMENT IN ADVANCE et l’entrepôt sélectionné, puis confirme avec OK.
4. Il attend le formulaire de la nouvelle soumission et vérifie son numéro.
5. Il remplit Internal Notes et Delivery Contact Information avec les coordonnées de la personne contact du lead.
6. Vérifie ces champs, puis enregistre la soumission dans D365.
Les dimensions du prospect sont gérées à l’étape Prospect. Elles ne sont pas remplies de nouveau à l’étape Soumission.
Si la soumission est créée mais que ses champs de contact ne sont pas accessibles, complète-les avec le module Coordonnées client. Ne relance pas la création de la soumission.

## 10. Coordonnées client
Colle une signature ou des coordonnées dans la zone de texte, puis clique sur Extraire les coordonnées.
Tu peux aussi cliquer sur Reprendre le contact du lead Salesforce. Le bouton reprend les données du lead actuellement enregistré dans le Toolbox, y compris les corrections faites dans ce parcours.
Vérifie et corrige les trois champs : nom complet, téléphone avec poste, courriel.
Exemple fictif d’Internal Notes, sur trois lignes :
Jean Tremblay
(514) 555-1234 #227
jean.tremblay@example.com
Delivery Contact Information utilise une seule ligne :
Jean Tremblay - (514) 555-1234 #227
Le courriel est en minuscules. Le poste est précédé de #.
Copier les notes place les trois lignes dans le presse-papiers.
Pour Remplir dans D365, sélectionne l’onglet de la soumission ou commande voulue et ouvre le formulaire en mode Edit, avec les champs de contact visibles.
Dans une soumission, le module remplit Internal Notes, Delivery Contact Information et Email.
Dans une commande, il remplit aussi Telephone.
Le remplissage remplace les coordonnées des champs ciblés, même si Email ou Telephone contiennent déjà une valeur. Vérifie puis enregistre dans D365.
Le bouton Effacer ces coordonnées remet ce module à vide.

## 11. Product Search
Sur une page fabricant ou magasin, sélectionne le SKU ou le texte recherché.
Fais un clic droit, puis Inside Sales Toolbox, puis Rechercher dans D365 · Product Search. En anglais : Search in D365 · Product Search.
Le panneau latéral s’ouvre. Product Search effectue la recherche dans un onglet D365 en arrière-plan pendant que tu restes sur ta page.
L’extension réutilise un onglet Product Search CAOP existant. Si aucun n’est ouvert, elle en crée un. Cet onglet reste visible dans la barre d’onglets du navigateur.
Tu peux également lancer une recherche depuis le champ SKU ou texte dans le module Produits.
Une fiche regroupe toutes les lignes chargées qui ont le même Item number D365. Deux numéros D365 différents restent deux produits distincts, même si leur SKU est identique.
Chaque fiche affiche les quantités par entrepôt et, si nécessaire, par emplacement :
Disponible physique, Inventaire physique, Réservé physique, En commande, Commandé au total et Commandé réservé.
Les blocs sans quantité et les champs à zéro sont masqués. Les cellules numériques vides suivent la convention zéro demandée pour cet affichage.
Un badge vert indique une disponibilité physique positive sur au moins une ligne chargée.
Toutes les informations permet de consulter les lignes sources, y compris les zéros et emplacements masqués.
Les lignes chargées peuvent ne représenter qu’une partie du résultat D365. Plusieurs lignes d’emplacement restent distinctes et ne sont pas additionnées automatiquement.
Clique sur Ouvrir dans D365 pour consulter la page complète.

## 12. Autres raccourcis au clic droit
Le menu apparaît lorsque tu sélectionnes du texte sur une page.
Préparer les coordonnées du client : extrait une nouvelle proposition de contact.
Ajouter au texte de coordonnées : ajoute la sélection à la zone de texte existante.
Utiliser comme nom, téléphone ou courriel : reprend seulement cette donnée en conservant les autres champs.
Vérifier ce code HS : ouvre le vérificateur avec le code sélectionné.
Texte en MAJUSCULES, Texte en minuscules ou Majuscule au début de chaque mot : prépare un texte à copier.
Les raccourcis de coordonnées peuvent ouvrir une petite fenêtre du Toolbox qui reste ouverte pendant les changements d’onglet. La recherche produit ouvre le panneau latéral.

## 13. Vérificateur de codes HS
Choisis l’origine du produit, puis saisis le code HS ou SH.
Avec 4 ou 6 chiffres, tu explores une famille. Avec 8 ou 10 chiffres, tu recherches un article plus précis.
Clique sur un code de résultat pour consulter cet article exact.
Le module couvre la liste de surtaxes canadiennes sur les produits américains. Un autre pays d’origine sort du périmètre de cette liste.
Dans Source et actualisation, clique sur Actualiser maintenant et vérifie la date ainsi que la période d’application.
Si l’actualisation échoue, le module peut afficher une copie enregistrée ou incluse à l’installation. Le message précise que son actualité n’est pas confirmée.
Un code absent ne signifie pas zéro droit. Le module ne calcule pas tous les droits, exemptions, remises ou conditions d’application. L’origine du produit ne correspond pas nécessairement au pays d’expédition.

## 14. Données conservées et mises à jour
Les coordonnées du module Contacts, le dernier module, le choix FR/EN et les résultats produits sont conservés dans le navigateur. Ils ne se synchronisent pas entre collègues.
Le lead Salesforce reste disponible pour le parcours pendant huit heures dans la session du navigateur. Au-delà, récupère-le de nouveau.
Pour mettre à jour :
1. Ferme le Toolbox.
2. Décompresse le nouveau ZIP.
3. Remplace les fichiers dans le même dossier d’installation.
4. Ouvre edge://extensions ou chrome://extensions et clique sur Actualiser ou Reload.
5. Ferme et rouvre le panneau.
Garde le dossier d’installation. Ne retire pas puis ne réinstalle pas l’extension simplement pour une mise à jour.

## 15. Dépannage
« manifest.json introuvable » : choisis le dossier extrait contenant ce fichier.
Autorisation manquante : clique sur Autoriser tous les accès.
Lead introuvable : ouvre le bon lead Salesforce et affiche Details.
Champ D365 introuvable : vérifie CAOP, le formulaire visé, le mode Edit et la visibilité du champ. Utilise Diagnostic D365 pour le parcours Salesforce.
Plusieurs onglets All prospects : garde le dossier voulu actif avant de démarrer, puis vérifie le nom et le numéro de prospect dans D365.
Résultats Product Search non confirmés : clique sur Ouvrir dans D365, vérifie la connexion, puis relance la recherche.
Adresse Google non reprise : vérifie l’onglet Google Maps et corrige l’adresse dans le Toolbox.
Copie impossible : vérifie l’autorisation de presse-papiers.
Ancien look ou ancien menu après une mise à jour : actualise l’extension, ferme et rouvre le panneau.
Message indiquant que le prospect ou la soumission ont déjà été créés : vérifie le dossier existant avant toute nouvelle tentative.

## 16. Vérification rapide avant de partager
Teste l’installation sur un autre poste avec ses propres accès.
Vérifie les autorisations, les quatre modules, FR/EN et une recherche produit au clic droit.
Vérifie que l’environnement est CAOP.
Pour un problème, note la version du Toolbox, le navigateur, l’action tentée et le message exact. Une capture ou le diagnostic aide à repérer le champ en cause.

Référence technique pour le panneau Chrome : https://developer.chrome.com/docs/extensions/reference/api/sidePanel

