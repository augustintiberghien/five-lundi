# Vision produit — App mobile Five

## Concept en une phrase
Le hub de l'équipe de five : compositions, stats, vote MVP et ambiance club — sans quitter l'app.

## Cible principale
**Capitaine / organisateur** — celui qui gère les matchs, les inscriptions, les compositions et les stats.
Les autres joueurs sont consommateurs : ils reçoivent les infos, votent, suivent leurs perfs.

## Positionnement
**"WhatsApp du five"** — pas un tracker de perf de plus, mais le point de convergence de l'équipe.
Remplace le groupe WhatsApp pour tout ce qui touche au match : convocations, résultats, compos, ambiance.

---

## Propositions de noms

| Nom | Angle | Feeling |
|-----|-------|---------|
| **Cinq** | Simple, le five en français | Épuré, universel |
| **Five HQ** | Headquarter de l'équipe | Sérieux, capitaine |
| **Vestiaire** | Le lieu de vie de l'équipe | Chaud, communauté |
| **Kikojoue** | "Qui joue ce soir ?" | Fun, direct, viral |
| **Onze / Five** | Référence foot | Familier, générique |
| **Lundi** | Ancré dans le rituel du match | Identitaire, niche |

> Recommandation : **Vestiaire** — évocateur, mémorable, différenciant. Ou **Kikojoue** si on vise viral/grand public.

---

## 5 features core

### 1. Convocation & disponibilités
Le capitaine crée un match (date, terrain, heure), les joueurs répondent présent/absent en un tap.
Fin du "c'est bon t'as 10 ?" dans WhatsApp.

### 2. Compositions visuelles
Terrain interactif pour placer les joueurs. Partage en image dans le groupe ou directement dans l'app.
Support des équipes (Blanc / Bleu), des remplaçants, de l'ordre de passage.

### 3. Vote MVP
Ouverture automatique après le match, clôture à 10 votes ou 22h30 le lendemain.
Résultat visible dans l'app, historique par joueur.

### 4. Stats & classements
Winrate, régularité, équilibre, paires qui gagnent ensemble.
4 méthodes de classement (cf. Five Lundi) exportables sur le profil joueur.

### 5. Article auto-généré (killer feature)
Après chaque match : un article façon L'Équipe généré par IA à partir du score, des compos et des stats.
Partage en un tap. Différenciant, viral, crée le rituel.

---

## Modèle économique

- **Freemium** : 1 équipe, fonctions de base gratuites (pubs)
- **Abonnement équipe** : ~5–10 €/mois, toutes features, sans pub, plusieurs équipes
- **Levier de croissance** : l'article partagé = pub organique gratuite

---

## Stack envisagée

- React Native (Expo) — iOS + Android
- Supabase — auth, DB, votes temps réel
- OpenAI / Claude API — génération articles
- GitHub Actions — CI/CD

---

## Prochaines étapes

- [ ] Choisir le nom définitif
- [ ] Scaffolding Expo + navigation (Stack + Tabs)
- [ ] Écran Accueil — prochain match + derniers résultats
- [ ] Écran Compo — terrain interactif
- [ ] Écran Stats — classement joueurs
