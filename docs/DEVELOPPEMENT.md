# Développer et publier Inside Sales Toolbox

## Référence du projet

Le dépôt officiel est https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES.
`main` conserve le travail intégré. Les branches `work/*` servent aux changements en cours; les anciennes branches `versions/*` conservent les sources historiques récupérées.
Les consignes permanentes des assistants sont dans [AGENTS.md](../AGENTS.md).

## À chaque demande de changement

1. Lire l'état courant du dépôt et ses consignes, puis créer une branche si la modification est importante.
2. Modifier les sources et vérifier le comportement concerné. `python3 scripts/check.py` exécute les contrôles de syntaxe et les tests du noyau.
3. Décrire les changements et les limites dans le commit ou la pull request. Conserver les changements intermédiaires sans fabriquer un nouveau numéro de version.
4. Envoyer les commits à GitHub et vérifier leur présence. Une erreur d'envoi doit être signalée, jamais masquée par un ZIP local.

## Sur une demande « export »

1. Donner à l'édition un numéro encore inutilisé. Mettre à jour son manifest et ses mentions embarquées.
2. Écrire `docs/releases/equipe-VERSION.md` et le CHANGELOG. Distinguer tests locaux et essais dans les applications connectées.
3. Exécuter `python3 scripts/release.py --edition equipe --prepare`. Le script vérifie le paquet, conserve un ZIP déjà identique et refuse d'écraser une archive différente. Il prépare les métadonnées `.release/equipe.json`.
4. Envoyer ces fichiers ensemble sur `main` après les contrôles. Le workflow de publication vérifie à nouveau le code et le ZIP, puis crée `equipe-vVERSION` et une publication contenant le ZIP et son empreinte SHA256. L'édition personnelle utilise `michael-vVERSION` et ses propres fichiers.
5. Vérifier que le workflow et la publication ont réussi. Donner à Michaël les liens et le ZIP demandé.

Le numéro de version seul ne déclenche pas une publication : le fichier `.release` doit également être préparé. Ainsi, des commits peuvent être conservés entre deux exports.
L'automatisation se déclenche quand le code est envoyé à GitHub; elle ne lit pas les conversations ChatGPT. L'assistant qui travaille sur le projet doit lire AGENTS.md et effectuer l'envoi pendant sa séance.

## Classement et conservation

- `project/inside-sales-toolbox-team/` : édition équipe.
- `project/inside-sales-toolbox-personal/` : édition personnelle.
- `downloads/` : archives originales, conservées sans réécriture.
- `docs/version-inventory.json` : inventaire historique et références de sources récupérées.
- `docs/ARCHIVES.md` : catalogue des ZIP disponibles, par édition et numéro.
- `docs/releases/` et `CHANGELOG.md` : changements et limites par livraison.
- GitHub Releases : nouvelles publications téléchargeables avec tag et empreinte.

Les règles n'exigent pas d'inventer des tests pour une petite modification visuelle. Il faut vérifier ce qui est concerné et conserver des tests utiles. La présence d'un workflow ne prouve pas qu'il a réussi : consulter son résultat.
