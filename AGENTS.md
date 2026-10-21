# Inside Sales Toolbox: règles de développement

Ces règles enregistrent les consignes de Michaël du 20 octobre 2026.

- Dépôt officiel : `mikkepapineau-lang/TOOLBOX-INSIDE-SALES`. Lire sa branche et son état actuels avant de modifier le code. Préserver tous les commits, archives et éditions existants. Ne jamais pousser de force.
- Chaque ensemble de changements terminé doit être vérifié, décrit dans un commit et envoyé à GitHub dans la même séance. Cette autorisation est permanente pour ce projet. Une sauvegarde locale ou un ZIP seul ne suffit pas. Si l'envoi échoue, le dire explicitement et fournir l'état exact restant à envoyer.
- Utiliser une branche de travail et une pull request pour les changements importants. Décrire le problème, le résultat, les vérifications et les limites. Ne jamais présenter une vérification locale comme une validation dans D365 ou Power BI connecté.
- Travailler sur l'édition équipe par défaut. Modifier l'édition personnelle ou le guide séparé seulement sur demande.
- Ne créer une nouvelle version installable et son ZIP que sur demande explicite d'export. Les travaux intermédiaires restent des commits. Ne jamais remplacer une archive ou déplacer un tag déjà publié.
- Pour exporter : augmenter le numéro dans le manifest et les mentions embarquées; ajouter une entrée au CHANGELOG et des notes dans `docs/releases/`; exécuter `python3 scripts/check.py`, puis `python3 scripts/release.py --edition equipe --prepare`. Cette commande prépare le ZIP et `.release/equipe.json`.
- Envoyer le code, les tests, les notes, le ZIP et le fichier `.release` ensemble. La modification de `.release/*.json` sur `main` déclenche les vérifications et la publication GitHub du ZIP avec un tag distinct par édition.
- Vérifier le résultat du workflow et de la publication avant d'annoncer une synchronisation complète. Donner le lien du commit ou de la publication. Si GitHub Actions est bloqué par les permissions du compte, identifier précisément le blocage.
- Maintenir l'inventaire des versions et les empreintes. Les anciennes archives importées ne doivent pas être antidatées ni présentées comme des commits d'origine.
- Garder les données de démonstration et les fichiers temporaires hors des ZIP. Ne pas ajouter de coordonnées client, jetons ou données de session au dépôt.

Procédure détaillée : `docs/DEVELOPPEMENT.md`.
