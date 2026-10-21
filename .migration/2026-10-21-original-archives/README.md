# Transfert des archives originales vers Codex

Dossier provisoire pour la migration du 21 octobre 2026. Les 49 ZIP originaux sont regroupés dans une archive tar.xz, encodée en base64 et divisée en parties ordonnées pour le transfert. Aucune archive d'extension n'a été régénérée.

1. Lire `transport.json` et `archive-manifest.json`.
2. Concaténer les fichiers `part-000.txt`, `part-001.txt`, etc. dans l'ordre; décoder le base64 en ignorant seulement les retours à la ligne.
3. Vérifier la taille et le SHA256 du tar.xz avant de le décompresser. Il contient uniquement `archives/*.zip` et `release/equipe.json`.
4. Vérifier les 49 ZIP contre `archive-manifest.json`, ainsi que leurs CRC. Préserver les archives déjà présentes si leurs octets sont identiques; refuser un conflit. Ajouter les 44 ZIP manquants sous `downloads/`, avec un commit d'importation par version. Préserver les neuf archives originales et les deux checkpoints déjà inventoriés.
5. Actualiser le catalogue et le vérificateur historique. Le contrôle de main doit maintenant suivre la version courante plutôt que rester fixé à 3.5.11. Conserver les comparaisons historiques existantes.
6. Envoyer `release/equipe.json` vers `.release/equipe.json` AVEC le ZIP original 3.5.12 quand les contrôles sont prêts. Vérifier la publication GitHub résultante. Aucune nouvelle version n'est demandée.
7. Une fois les fichiers originaux importés et vérifiés, retirer ce dossier provisoire dans un commit séparé. Son historique reste conservé.

Le dossier complet et les sources utiles sont aussi sauvegardés dans le ZIP de reprise. Les règles permanentes sont dans `AGENTS.md` et le contexte dans `docs/CODEX_HANDOFF.md`. Le transfert via ce dossier évite de dépendre des outils Library qui ne sont pas disponibles dans l'environnement Codex du projet.
