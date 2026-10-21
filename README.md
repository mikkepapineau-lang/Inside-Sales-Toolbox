# Inside Sales Toolbox

Extension Microsoft Edge pour les ventes internes, issue du projet Salesforce vers Dynamics commencé le 21 septembre 2026.

**53 archives originales d’extension et 2 checkpoints récupérés.** Les premières versions dont les sources manquent sont recensées dans l’[historique détaillé](docs/HISTORIQUE.md). Cet inventaire distingue les fichiers disponibles et les simples mentions historiques.

## Télécharger

- [Équipe 3.5.12](downloads/Inside-Sales-Toolbox-Equipe-v3.5.12.zip) : export existant, ZIP original récupéré.
- [Catalogue complet des archives](docs/ARCHIVES.md), dont les 44 imports du 21 octobre 2026.
- [Équipe 3.5.11](downloads/Inside-Sales-Toolbox-Equipe-v3.5.11.zip) : archive historique conservée.
- [Équipe 3.5.10](downloads/Inside-Sales-Toolbox-Equipe-v3.5.10.zip), [3.5.9](downloads/Inside-Sales-Toolbox-Equipe-v3.5.9.zip), [3.5.8-test](downloads/Inside-Sales-Toolbox-Equipe-v3.5.8-test.zip) et [3.5.7](downloads/Inside-Sales-Toolbox-Equipe-v3.5.7.zip).
- [Michaël 1.8.18](downloads/Inside-Sales-Toolbox-Michael-v1.8.18.zip).
- Précurseurs : [Lead 1.7.2](downloads/Solotech-Lead-vers-D365-Edge-v1.7.2.zip), [Michaël 1.7.4](downloads/Solotech-Lead-D365-Michael-v1.7.4.zip), [Équipe 1.7.5](downloads/Solotech-Lead-D365-Equipe-v1.7.5.zip).

Sur la page d’un ZIP dans GitHub, utiliser **Download raw file**. Pour mettre à jour une installation existante, remplacer les fichiers dans son dossier actuel, actualiser l’extension dans `edge://extensions`, puis actualiser les onglets concernés et rouvrir le panneau. Les éditions personnelle et équipe ont des dossiers distincts.

## Guides pour les collègues · Équipe 3.5.12

- [Installer dans Edge ou Chrome · PDF, 8 pages](docs/guides/equipe-3.5.12/01-installation.pdf).
- [Utiliser les six outils · PDF, 18 pages](docs/guides/equipe-3.5.12/02-utilisation.pdf).
- [Versions Word modifiables et sources](docs/guides/equipe-3.5.12/README.md).

## Sources et historique

| Dossier / référence | Contenu |
| --- | --- |
| `project/inside-sales-toolbox-team/` | Sources exactes de l’archive Équipe 3.5.12. |
| `project/inside-sales-toolbox-personal/` | Sources exactes de l’archive Michaël 1.8.18. |
| `project/solotech-lead-bridge/` | Précurseur 1.7.2. |
| Branches `versions/*` | Un commit par archive récupérée. |
| `checkpoints/equipe-base3.5.6-20261017` | État de travail complet basé sur 3.5.6, pas le ZIP original de cette version. |
| `work/after-v3.5.11` | État de travail non exporté du 19 octobre. Manifest 3.5.11, lecteur Power BI 2.2.0. |
| `docs/HISTORIQUE.md` | Chronologie, versions documentées seulement, limites et différences entre archives. |
| `archives/` | Checkpoints originaux, dont celui du 19 octobre compressé sans perte. |
| `checks/` | Tests conservés du checkpoint ancien et correction de test déjà présente dans le dépôt. |
| `labs/price-list-finder-lab-v07/` | Prototype indépendant déjà présent, conservé. |

Les commits et tags préexistants restent intacts. L’historique reconstruit est fusionné dans `main`; ses dates de commit sont celles de l’importation. Les versions sans sources ne sont pas recréées à partir d’un code ultérieur.

## Vérifier la récupération

```sh
python3 scripts/verify-version-archives.py
```

Ce contrôle vérifie les empreintes, les contenus des checkpoints et chaque source contre sa référence Git. Les métadonnées sont dans [version-inventory.json](docs/version-inventory.json). Les archives et PDF ont aussi leurs empreintes dans [SHA256SUMS.txt](docs/SHA256SUMS.txt).

Les sources sont archivées telles que retrouvées. Les tests locaux ne prouvent pas le fonctionnement dans une session authentifiée Edge, Salesforce, Dynamics ou Power BI. Les notices anciennes peuvent afficher un numéro obsolète.

Le checkpoint de travail suivant 3.5.11 reste distinct du ZIP installable. Son lecteur personnalisé et l’équivalence `InternalReference` / `Internal Notes` ne sont pas validés dans Power BI connecté.

Le [Price List Finder LAB 0.7](downloads/price-list-finder-lab-v07.zip) demeure un téléchargement indépendant.
