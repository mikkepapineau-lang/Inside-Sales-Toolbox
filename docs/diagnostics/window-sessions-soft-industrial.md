# Sessions par fenêtre et interface Solotech × Teenage Engineering

Développement du 23 octobre 2026 sur la branche d’essai Teenage Engineering, après l’export 3.5.14. Aucun nouveau numéro, ZIP ou tag n’est créé; le ZIP 3.5.14 publié reste celui de son commit d’export.

## Une session par fenêtre du navigateur

Le panneau utilise désormais le contexte global `sidepanel.html`, ouvert avec `windowId`. Aucune option de panneau propre à un onglet n’est enregistrée. Changer d’onglet dans la même fenêtre conserve le document du panneau, son module et ses données. Le popup retrouve la session de cette fenêtre. Le menu contextuel et les captures suivent la fenêtre source, même si une autre fenêtre a pris le focus.

L’identité d’une nouvelle fenêtre ne réutilise jamais celle d’un onglet : déplacer un onglet vers une autre fenêtre ne lie donc pas implicitement les sessions. Entre fenêtres explicitement liées, la saisie du lead, son effacement et les étapes Lead/Prospect/Soumission se mettent aussi à jour. L’éditeur qui saisit un champ n’est pas reconstruit à chaque notification de sa propre sauvegarde.

Le bouton de chaîne dans l’en-tête ouvre les commandes de liaison :

- Chaque fenêtre normale est indépendante par défaut.
- **Lier à la fenêtre…** adopte la navigation, les brouillons, les préférences et les relevés de la fenêtre choisie. Le titre de son onglet actif aide à l’identifier lorsqu’il est accessible. Les anciens travaux restent conservés.
- **Séparer cette fenêtre** copie les données partagées dans une nouvelle session indépendante, y compris le catalogue Non réservé dans sa propre base IndexedDB. Les cibles de traitement sont réinitialisées pour éviter de piloter les rapports de l’autre session.
- **Reprendre ma session précédente** permet de retrouver le travail conservé avant une liaison.
- Une opération de fond en cours bloque le changement de liaison. Les saisies de filtres différées sont enregistrées avant ce changement.

Les onglets ordinaires de la fenêtre suivent sa nouvelle session lors d’une liaison ou d’une séparation. Les onglets de rapports restent réservés à leur session de traitement. La fermeture d’une fenêtre retire son appartenance au groupe sans effacer les données stockées. La portée reste la session du navigateur : la fermeture complète du navigateur ou le rechargement de l’extension renouvelle l’époque de stockage déjà utilisée par le projet. Ce changement ne promet pas une restauration intersessions du navigateur.

## Une fenêtre de travail distincte

**Préparer ma journée** prépare les quatre cibles D365/Power BI dans une fenêtre normale séparée, créée avec `focused:false`. Les onglets habituels ne sont pas déplacés et le groupe n’occupe plus leur barre d’onglets. Les nouvelles cibles de lecture utilisent aussi cette fenêtre. Elle est réutilisée; si elle a été fermée, elle est recréée.

**Afficher la fenêtre de travail**, dans le menu de liaison, permet de la retrouver. Les fenêtres Toolbox liées utilisent la même fenêtre de travail; une session séparée possède la sienne. Une fenêtre de travail n’est pas proposée comme autre session à lier.

La fenêtre n’est pas automatiquement minimisée. Power BI peut ralentir quand il est masqué ou minimisé; les lectures qui demandent explicitement un affichage peuvent encore mettre leur fenêtre au premier plan. Il ne s’agit pas d’une exécution Power BI entièrement invisible.

## Une direction visuelle plus douce

L’orange reste l’accent principal des actions et de la navigation. Le pictogramme violet Solotech/Toolbox conserve ses couleurs; les icônes d’accueil reprennent cette famille. Les gris mats, la structure compacte et les repères orange gardent l’inspiration Teenage Engineering, avec la police Segoe UI du design précédent, des contours arrondis et des chiffres lisibles sans effet d’afficheur pixelisé. Clair et sombre restent disponibles. Le changement de thème ne fait plus transiter le fond des lignes indépendamment de leur texte, ce qui évite un contraste transitoire insuffisant.

Dans l’en-tête, l’image wordmark intermédiaire est retirée : il reste le pictogramme et le titre Toolbox. Les onglets de navigation restent uniquement des icônes avec leur nom au survol. Les trois familles de produits gardent leurs libellés et Actualisation du catalogue reste en dernier.

Les logos et références disponibles dans le dépôt servent de repères Solotech. Le PDF original de charte mentionné dans la conversation n’est pas présent parmi les fichiers accessibles de cette reprise; aucune conformité exhaustive à ce PDF n’est annoncée.

## Vérifications

- `python3 scripts/check.py` : 66 scripts et 25 suites, dont stabilité des identités, créations concurrentes de fenêtres, liaison/séparation/restauration, refus pendant une opération, échec de copie, fermeture et contrôle des messages.
- `node checks/instances-browser.test.cjs` : bootstrap, workers et stockage IndexedDB réels dans Chromium; transport Chrome et onglets fictifs. Deux fenêtres, changement d’onglet et de focus, préparation répétée dans une fenêtre séparée, partage du calculateur, des contacts et du lead, saisie continue sans reconstruction de son propre éditeur, effacement et étapes CRM synchronisés, fenêtre de travail commune, séparation avec copie du catalogue et transfert des réservations d’onglets, rechargement et redémarrage du worker.
- `node checks/overhaul-browser.test.cjs` : douze vues, clair/sombre, contraste du texte, contrôles FR/EN et clavier, largeurs 320/390/520/900, popup, mouvement réduit. Six commandes complètes et quatre fiches Non réservé visibles dans le panneau de référence 375 × 756.
- `python3 scripts/verify-version-archives.py --archives-only` : archives et snapshots stockés, sans égalité imposée entre ce développement et le dernier ZIP.
- `python3 checks/redesign-preview/teenage.py` : aperçu interactif des quatre vues réelles, données fictives. Captures en 1600 × 900, clair/sombre, police Segoe UI et un seul logo dans chaque en-tête.

Le navigateur de test applique une politique qui empêche le chargement réel d’une extension non empaquetée. Les contrats Chrome sont exercés par des adaptateurs; la stabilité native du panneau dans Edge/Chrome et les lectures D365/Power BI restent à confirmer dans la session connectée. Le sens de `InternalReference` reste également à confirmer.
