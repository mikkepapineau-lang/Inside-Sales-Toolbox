# Inside Sales Toolbox Équipe 3.5.16 — Teenage Engineering (essai)

Export installable complet demandé par Michaël depuis la branche `preview/teenage-engineering`. Cette préversion reprend l’interface Solotech × Teenage Engineering de la version 3.5.15, ses modes clair et sombre, ses sessions par fenêtre et sa fenêtre de travail distincte.

Le catalogue **Non réservé** demande maintenant l’autorisation ciblée `app.powerbi.com` directement depuis le clic sur l’export ou l’ouverture du rapport. Cette demande précède l’injection nécessaire à l’export Excel et évite l’erreur indiquant que le manifeste ne permet pas d’accéder à la page.

Dans **Commandes prêtes**, le périmètre vendeur utilise le véritable filtre et la colonne **Sales Rep Name**. **Sales Responsible** demeure un champ distinct et n’est pas accepté comme preuve du filtre. Dans le calculateur, les cartes sont claires en mode clair et conservent leur traitement d’afficheur foncé en mode sombre.

## Installation

Extraire le ZIP dans un dossier dédié. Dans `edge://extensions` ou `chrome://extensions`, activer le mode développeur puis utiliser **Charger l’extension décompressée** avec le dossier contenant `manifest.json`. Le navigateur affiche **Solotech · Inside Sales Toolbox · TE (test)**, version **3.5.16**. Pour remplacer l’essai 3.5.15 chargé depuis le même dossier, extraire 3.5.16 à sa place puis cliquer sur **Recharger** dans la page des extensions.

## Vérifications et limites

Les contrôles locaux couvrent les 66 scripts et les 25 suites du noyau, la demande d’autorisation Power BI au clic, le filtre **Sales Rep Name**, les sessions par fenêtre, l’interface compacte et le calculateur dans les deux modes. Le ZIP est vérifié par CRC, SHA256 et comparaison octet pour octet avec les sources de cette branche.

La publication utilise le nouveau tag `equipe-v3.5.16` et demeure une préversion. Les validations dans une session Power BI/D365 connectée, notamment l’export Non réservé, le filtre vendeur, le défilement réel, les autres exports Excel natifs et le sens de `InternalReference`, restent à faire.
