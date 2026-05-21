# Locker Room — Vision produit

> Hub de l'équipe de five-a-side : inscriptions, compos, vote MVP, stats et articles auto-générés.

## Nom
**Locker Room** — l'équivalent universel du vestiaire de foot. Compris instantanément dans tous les pays où le football existe.
*(Ouvert à un nom en un mot si meilleure option trouvée)*

## Concept en une phrase
Le hub de l'équipe de five : inscriptions, compositions, stats, vote MVP et ambiance club — sans quitter l'app.

## Cible principale
**Capitaine / organisateur** — celui qui gère les matchs, les inscriptions, les compositions et les stats.
Les autres joueurs sont consommateurs : ils reçoivent les infos, votent, suivent leurs perfs.

## Positionnement
**"WhatsApp du five"** — pas un tracker de perf de plus, mais le point de convergence de l'équipe.
Remplace le groupe WhatsApp pour tout ce qui touche au match : convocations, résultats, compos, ambiance.

---

## Navigation

### Coach (5 onglets)
| Onglet | Contenu |
|--------|---------|
| Profil | profil perso (le coach joue aussi), paramètres groupe |
| Joueurs | liste joueurs, invitations, statut (blessé/absent), notes, positions naturelles |
| Calendrier | toutes les sessions passées/à venir — inscriptions intégrées, compo accessible depuis une session |
| Stats | classements groupe (4 méthodes) + stats individuelles |
| *(Compo)* | accessible depuis Calendrier → session |

### Joueur (3 onglets)
| Onglet | Contenu |
|--------|---------|
| Profil | nom, photo, stats personnelles |
| Calendrier | sessions + inscriptions + statut |
| Stats | focus stats perso + classement groupe |

### Rôles
| Rôle | Permissions |
|------|-------------|
| Joueur | profil, stats, calendrier, inscriptions |
| Coach adjoint | + gestion compo, valider présences |
| Coach | + inviter/supprimer joueurs, notes, paramètres groupe |

Le coach désigne un adjoint via l'écran Joueurs (toggle permission).

---

## Système d'inscriptions

- Le coach ouvre/ferme manuellement les inscriptions par session
- Premiers 10 inscrits → titulaires (dans l'ordre)
- 11e, 12e… → banc (file d'attente ordonnée)
- Si un titulaire se désinscrit → le premier du banc monte automatiquement

### Statuts d'un joueur sur une session
| Statut | Déclencheur |
|--------|-------------|
| Inscriptions fermées | défaut avant ouverture |
| Inscriptions ouvertes | coach ouvre → badge vert animé |
| Confirmé ✓ | joueur inscrit dans les 10 |
| Banc 🪑 | joueur inscrit au-delà de 10 — position dans la file affichée |
| Absent ❌ | joueur se désinscrit après inscription |

---

## Notifications push (joueur)

| Événement | Message |
|-----------|---------|
| Inscriptions ouvertes | "Les inscriptions pour le lundi X sont ouvertes 🟢" |
| Tu passes du banc au titulaire | "Tu es maintenant titulaire pour le lundi X — confirme ta présence ✅" |
| Ouverture vote MVP | "Vote pour le MVP du match de lundi ⚡" |
| Annonce MVP | "🏆 Le MVP du lundi X est [Prénom]" |
| Score saisi | "Résultat lundi X : Blanche X – Bleue X" |
| Stats mensuelles | "📊 Ton mois de mai : 4 matchs, 3 victoires. En feu 🔥" |

**Coach** : notifié de toute inscription / désinscription.

---

## 5 features core

### 1. Inscriptions & convocations
Joueurs s'inscrivent eux-mêmes. File d'attente automatique. Notifications push à chaque changement.

### 2. Compositions visuelles
Terrain interactif : auto-fill depuis les inscrits + drag & drop pour ajustements.
Partage en image.

### 3. Vote MVP
Ouverture automatique après le match, clôture à 10 votes ou 22h30 le lendemain.

### 4. Stats & classements
Winrate, régularité, équilibre, paires qui gagnent ensemble. 4 méthodes de classement.

### 5. Article auto-généré (killer feature)
Après chaque match : article façon L'Équipe généré par IA. Partage en un tap.

---

## Modèle économique

- **Freemium** : 1 équipe, fonctions de base gratuites (pubs)
- **Abonnement équipe** : ~5–10 €/mois, toutes features, sans pub, plusieurs équipes
- **Levier de croissance** : l'article partagé = pub organique gratuite

---

## Stack

- React Native (Expo) — iOS + Android
- Supabase — auth, DB, votes temps réel, notifications
- Claude API — génération articles
- GitHub Actions — CI/CD

---

## Avancement

- [x] Nom → **Locker Room**
- [x] Scaffolding Expo + navigation tabs
- [x] Écran Calendrier — cards sessions, statuts inscriptions, animations
- [x] Écran Compo — terrain interactif, drag & drop, snap-to-position, banc
- [ ] Refacto nav Coach vs Joueur
- [ ] Écran Stats
- [x] Écran Profil
- [ ] Auth Supabase
- [ ] Inscriptions réelles (Supabase)
- [ ] Notifications push (Expo Notifications)
