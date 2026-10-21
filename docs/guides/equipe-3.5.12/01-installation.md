# Installer Inside Sales Toolbox
## Le carnet pour bien démarrer

ÉDITION ÉQUIPE · VERSION 3.5.12

Pour Microsoft Edge et Google Chrome sur ordinateur.

Ce carnet vous accompagne du téléchargement à la première ouverture. Aucune connaissance en programmation n’est nécessaire.

**À la fin :** le Toolbox est installé dans votre navigateur, ses accès sont autorisés et vous savez comment l’ouvrir et le mettre à jour.

**Votre parcours :** télécharger → extraire → installer → autoriser → ouvrir.

Solotech · Ventes internes · 21 octobre 2026

Version de test publiée. Les parcours Power BI de cette version restent à confirmer en session connectée. L’installation ne vous donne pas de nouveaux droits Salesforce, D365 ou Power BI.

---

# Avant de commencer
## Ce qu’il vous faut

- Un ordinateur avec une version récente de Microsoft Edge ou Google Chrome. Ce guide concerne les versions de bureau, pas les téléphones et tablettes.
- La permission d’installer une extension locale dans votre navigateur de travail.
- Vos accès habituels aux applications que vous utiliserez : Salesforce, Dynamics 365 et les rapports Power BI de l’équipe.
- Un dossier permanent sur votre ordinateur pour les fichiers du Toolbox.

**Si votre entreprise bloque le mode développeur ou les extensions locales :** demandez l’aide du service TI. Ne tentez pas de contourner cette politique.

## Ce que vous installez

Le Toolbox est une extension de navigateur. Cette version s’installe à partir d’un ZIP décompressé, et non depuis Chrome Web Store ou Microsoft Edge Add-ons. Le même ZIP sert aux deux navigateurs.

L’édition équipe est configurée pour la société **CAOP** dans D365. Chaque collègue utilise sa propre connexion; aucun mot de passe n’est fourni par le Toolbox. Edge et Chrome conservent des installations et des données séparées.

## Dans ce carnet

- Page 3 — Télécharger et extraire le bon fichier.
- Page 4 — Installer dans Microsoft Edge.
- Page 5 — Installer dans Google Chrome.
- Page 6 — Autoriser les accès et ouvrir le panneau.
- Page 7 — Vérifier l’installation et mettre à jour.
- Page 8 — Résoudre les problèmes les plus fréquents.

Le carnet « Utiliser Inside Sales Toolbox » explique ensuite les six outils.

---

# Télécharger et extraire
## Une seule préparation pour Edge ou Chrome

1. Ouvrez la [page de téléchargement officielle de l’équipe 3.5.12](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/releases/tag/equipe-v3.5.12).
2. Dans les fichiers de la publication, téléchargez **Inside-Sales-Toolbox-Equipe-v3.5.12.zip**. Les fichiers « Source code » ne sont pas le paquet à installer.
3. Créez un dossier permanent, par exemple **Documents / Inside Sales Toolbox / Equipe**.
4. Décompressez le ZIP dans ce dossier. Sous Windows, faites un clic droit sur le ZIP, puis **Extraire tout**. Sur Mac, ouvrez le ZIP, puis placez le dossier extrait à l’endroit voulu.
5. Ouvrez le dossier obtenu et repérez **manifest.json**, avec les fichiers **popup.html** et le dossier **icons**. C’est ce dossier précis que vous choisirez dans le navigateur.

**Attention au double dossier :** si vous voyez un dossier « Inside Sales Toolbox » à l’intérieur d’un autre dossier du même nom, ouvrez le second jusqu’à voir manifest.json.

## Gardez ce dossier en place

Le navigateur utilise directement les fichiers extraits. Ne les supprimez pas et ne déplacez pas le dossier après l’installation. Vous pouvez conserver le ZIP à part comme copie d’origine.

**Ne choisissez pas le ZIP dans le navigateur.** Il faut sélectionner le dossier décompressé contenant manifest.json.

## Pour le soutien technique

Le ZIP original 3.5.12 mesure **1 174 696 octets**. Son empreinte SHA256 est fournie dans le fichier .sha256 de la publication officielle. Il n’est pas nécessaire de calculer cette empreinte pour suivre l’installation.

---

# Installer dans Microsoft Edge
## Choisissez cette page si vous utilisez Edge

1. Ouvrez Microsoft Edge dans votre **profil de travail habituel**.
2. Tapez **edge://extensions** dans la barre d’adresse, puis appuyez sur Entrée. Ne tapez pas cette adresse dans un moteur de recherche.
3. Activez **Mode développeur** sur la page des extensions.
4. Cliquez sur **Charger l’extension décompressée**. Selon la langue du navigateur, le bouton peut s’appeler **Load unpacked**.
5. Sélectionnez le dossier permanent qui contient directement **manifest.json**, puis confirmez.
6. Vérifiez que **Solotech · Inside Sales Toolbox** apparaît dans la liste et que son commutateur est activé. La version indiquée doit être **3.5.12**.
7. Ouvrez le menu **Extensions** d’Edge, près de la barre d’adresse. Choisissez l’option permettant d’afficher le Toolbox dans la barre d’outils, si vous souhaitez garder son icône visible.
8. Cliquez sur l’icône du Toolbox, puis poursuivez à la page 6.

**Résultat attendu :** l’accueil du Toolbox apparaît, avec les raccourcis Salesforce, Contacts, Produits, Codes HS, Commandes et Calculs.

## Si Edge demande une confirmation

Une installation locale peut afficher un avertissement lié au mode développeur. Vérifiez que vous utilisez bien le paquet officiel, puis suivez les règles de votre organisation. Si Edge refuse ou désactive l’extension, transmettez le message au service TI.

**Vous ne voyez pas le bouton de chargement ?** Vérifiez d’abord que Mode développeur est activé. S’il est grisé ou verrouillé, le service TI doit intervenir.

---

# Installer dans Google Chrome
## Choisissez cette page si vous utilisez Chrome

1. Ouvrez Google Chrome dans votre **profil de travail habituel**.
2. Tapez **chrome://extensions** dans la barre d’adresse, puis appuyez sur Entrée.
3. Activez **Mode développeur**.
4. Cliquez sur **Charger l’extension non empaquetée**, **Charger l’extension décompressée** ou **Load unpacked**, selon la langue et la version de Chrome.
5. Sélectionnez le dossier permanent qui contient directement **manifest.json**, puis confirmez.
6. Vérifiez que **Solotech · Inside Sales Toolbox** apparaît, qu’il est activé et que sa version est **3.5.12**.
7. Cliquez sur l’icône **Extensions** en forme de casse-tête, puis sur l’épingle du Toolbox pour l’afficher dans la barre d’outils.
8. Cliquez sur son icône et poursuivez à la page 6.

**Résultat attendu :** l’accueil du Toolbox s’ouvre dans Chrome. Le bouton **Panneau** permet de demander son ouverture dans le panneau latéral.

## À savoir pour Chrome

Utilisez une version récente et à jour. Le panneau latéral repose sur des fonctions disponibles dans les versions modernes de Chrome; la référence du projet indique Chrome 116 ou plus récent pour son ouverture.

Le paquet prend en charge les API communes à Edge et Chrome. Les parcours réels de cette version dans Chrome ne sont pas certifiés par les vérifications locales du code. Faites un premier essai avec vos accès de travail avant de traiter un dossier client.

Si votre profil est administré et que l’installation locale est bloquée, demandez l’aide du service TI.

---

# Première ouverture
## Autoriser les accès et choisir votre affichage

1. Dans le Toolbox, cliquez sur **Autoriser tous les accès**.
2. Lisez la demande du navigateur, puis acceptez si elle respecte les règles de votre organisation.
3. Vérifiez que le bloc d’accès ne signale plus d’autorisation manquante. Il peut disparaître lorsque tout est prêt.
4. Connectez-vous avec votre compte habituel aux applications nécessaires. Si un outil ouvre une page de connexion, terminez cette connexion puis réessayez.
5. Choisissez **FR** ou **EN** dans l’en-tête. Ce choix change la langue du Toolbox, pas celle des données ni la préférence linguistique du client dans D365.
6. Cliquez sur **Panneau** pour garder le Toolbox ouvert pendant vos changements d’onglets.

## À quoi servent les accès ?

- **Sites HTTPS :** communiquer avec les pages Salesforce, D365 et Power BI, consulter Canada.ca et la Banque du Canada, et rechercher les coordonnées sur les sites de compagnies.
- **Adresses :** la proposition de territoire peut transmettre l’adresse à Photon/OpenStreetMap. La recherche de coordonnées peut ouvrir le site de la compagnie et Google Maps.
- **Presse-papiers :** copier les notes et les textes préparés.
- **Onglets :** ouvrir, réutiliser et regrouper les pages de travail.

L’autorisation HTTPS est large. Elle sert notamment à la recherche sur les sites de compagnies. Vous pouvez revoir les accès dans les paramètres de l’extension; en retirer certains peut empêcher les outils concernés de fonctionner.

**Fenêtre ou panneau ?** La petite fenêtre ouverte par l’icône se ferme quand vous cliquez ailleurs. Le panneau latéral sert à travailler tout en consultant vos pages.

---

# Vérifier et mettre à jour
## Votre contrôle de première installation

- La page des extensions indique **3.5.12** et l’extension est activée.
- Le Toolbox s’ouvre et les six outils sont accessibles.
- Le choix FR / EN et le bouton Panneau fonctionnent.
- Aucun accès nécessaire n’est signalé comme manquant.
- Vos pages D365 sont dans **CAOP** et vos rapports Power BI sont accessibles avec votre compte.

Sur l’accueil, **Préparer ma journée** ouvre ou réutilise quatre pages de travail et les regroupe sous **Solotech Toolbox**. Cette action ne crée pas de dossier client. Consultez le second carnet avant d’utiliser les boutons de création ou de remplissage.

## Mettre à jour une installation existante

1. Fermez le Toolbox et son panneau latéral.
2. Téléchargez le paquet de mise à jour approuvé pour l’édition équipe.
3. Décompressez-le et remplacez les fichiers **dans le même dossier d’installation**, sans mélanger les éditions.
4. Ouvrez edge://extensions ou chrome://extensions et cliquez sur **Actualiser / Recharger / Reload** sur la carte du Toolbox.
5. Actualisez les onglets Salesforce, D365 et Power BI concernés.
6. Rouvrez le panneau et vérifiez la version et les accès.

**Ne désinstallez pas l’extension pour une simple mise à jour.** En conservant le même dossier et le même profil, les données locales sont normalement conservées. Une suppression de l’extension ou du profil peut les effacer.

Les contacts, filtres et imports du Toolbox appartiennent au profil de navigateur utilisé. Ils ne sont pas automatiquement partagés avec vos collègues ni entre Edge et Chrome.

---

# Besoin d’aide ?
## Les solutions les plus courantes

**« manifest.json introuvable » ou installation impossible**
Vérifiez que le ZIP a été extrait. Choisissez le dossier contenant directement manifest.json, pas son dossier parent.

**Le Toolbox n’apparaît pas dans la barre d’outils**
Ouvrez le menu Extensions du navigateur. Affichez ou épinglez son icône. Vérifiez aussi qu’il est activé dans la page des extensions.

**Mode développeur indisponible ou extension bloquée**
Demandez l’aide du service TI. L’installation peut être limitée par la politique de votre ordinateur ou profil de travail.

**Un outil demande des accès ou Edge affiche « Blocked »**
Utilisez Autoriser tous les accès. Pour Power BI, ouvrez le menu Extensions pendant que vous êtes sur app.powerbi.com et vérifiez l’accès du Toolbox à ce site. Connectez-vous au rapport avec votre compte.

**L’ancien affichage revient après la mise à jour**
Rechargez l’extension, actualisez les onglets concernés, puis fermez et rouvrez complètement le panneau. Vérifiez le dossier utilisé et le numéro de version.

**Le panneau ne s’ouvre pas ou une application ne répond pas**
Mettez le navigateur à jour. Vérifiez votre connexion aux applications et réessayez. Le Toolbox ne remplace pas les droits d’accès de votre compte.

## Quoi transmettre au soutien ?

Indiquez : **Toolbox équipe 3.5.12**, Edge ou Chrome et sa version, l’outil utilisé, l’action tentée et le message exact. Si une capture est utile, masquez les coordonnées clients et les autres renseignements confidentiels.

**Vous êtes prêt.** Passez au carnet « Utiliser Inside Sales Toolbox » pour découvrir chaque outil, étape par étape.
