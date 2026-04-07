# Errata officiel — Moteur Lyricist v4.2
> **Statut** : fait autorité sur les sections indiquées dans `docs_fusion_optimal.md`  
> **Auteur** : Emmanuel Kerhoz | **Date** : Avril 2026  
> **Scope** : 7 corrections issues de l'audit du 07/04/2026

---

## CORRECTION 1 — Numérotation du pipeline

**Fichier cible** : `docs_fusion_optimal.md` — Partie A §2.1, Annexe 1 §1  
**Problème** : trois numérotations coexistaient (5 / 7 / 5 bis).

**Convention retenue : 7 étapes, numérotation de la Partie A §2.1**

```text
INPUT TEXTE BRUT
  ↓
[1] Normalisation Unicode + détection de script + LID
  ↓
[2] Tokenisation / représentation d'entrée adaptée
  ↓
[3] G2P : graphème → phonème (IPA)
  ↓
[4] Syllabification
  ↓
[5] Extraction du Rhyme Nucleus (RN)
  ↓
[6] Scoring phonologique
  ↓
[7] Classification, post-traitement, sortie JSON
```

L'Annexe 1 fusionniait les étapes [1]+[2] en une seule et [6]+[7] en une seule.  
Ces fusions sont valides comme raccourcis documentaires mais **la numérotation officielle est 7 étapes**.  
Toute référence à « 5 étapes » dans le corpus doit être lue comme une vue compressée, non normative.

---

## CORRECTION 2 — Définition de Sₖ (Rhyme Nucleus §4.2)

**Fichier cible** : `docs_fusion_optimal.md` — Partie A §4.2, et `Lyricist algo v2.txt` §1.4  
**Problème** : `docs_fusion_optimal.md` dit « syllabe accentuée principale », `v2.txt` dit « dernière syllabe accentuée » — les deux formulations divergent pour les langues à accent non-final.

**Formulation normative** :

> `Sₖ` est la syllabe portant l'**accent prosodique principal**, identifiée par le module prosodique de la famille :
> - Accent **final** (FR, turcique en suffixé) → dernière syllabe non-schwa
> - Accent **initial** (FI, HU, certains TRK racines) → première syllabe
> - Accent **mobile / lexical** (RU, BG, ES, IT) → déterminé par dictionnaire ou règles suffixales
> - Accent **absent / mora-based** (JA, VI) → dernière mora du vers

Le pseudo-code `last_non_schwa_syllable()` de ALGO-ROM reste valide pour FR uniquement.

---

## CORRECTION 3 — Hiérarchie des seuils de scoring

**Fichier cible** : `docs_fusion_optimal.md` — Partie A §6, Annexe 1 tableau « Catégories sortie »  
**Problème** : plage morte (rime faible définie comme ≥ 0.75 ET < 0.60, impossible), chevauchement assonance/suffisante.

**Hiérarchie normative** (alignée sur `_categorize()` du skeleton Python §11) :

| Type | Seuil | Critère |
|---|---|---|
| Rime riche | ≥ 0.95 | RN exact ou distance quasi nulle |
| Rime suffisante | ≥ 0.85 | nucleus + coda identiques ou très proches |
| Assonance | ≥ 0.75 | nucleus proches, coda divergente |
| Rime faible | ≥ 0.40 | approximatif, au-dessus du plancher |
| Non-rime | < 0.40 | score inférieur au plancher |

> `θ` (seuil de rime minimum) = 0.75 par défaut, configurable.  
> La valeur `0.60–0.80` qui apparaissait pour l'assonance était **descriptive**, non prescriptive. Elle est supprimée de la spec normative.

---

## CORRECTION 4 — ALGO-KWA : politique de réduction des contours tonaux BA

**Fichier cible** : `docs_fusion_optimal.md` — Partie A §5.3, YAML `tone_normalization`  
**Problème** : la normalisation BA 5 niveaux → 2 classes ne documentait pas le traitement des contours (HL, LH, HML…).

**Politique normative** :

```
HIGH = {H, MH}
LOW  = {ML, M, L}
Contours : ton INITIAL dominant
  HL → HIGH  (commence haut)
  LH → LOW   (commence bas)
  HML → HIGH (commence haut)
  LHL → LOW  (commence bas)
```

> Justification phonologique : en poésie BA et DI, la perception de rime tonale est dominée par la hauteur de départ du contour (expérience perceptuelle locuteur natif, cohérente avec la littérature sur les tons lexicaux WA-KWA).

**Ajout YAML** :
```yaml
ALGO-KWA:
  preprocess:
    tone_normalization: 5level_to_binary_HL
    tone_contour_policy: initial_dominant   # NOUVEAU
```

---

## CORRECTION 5 — Schéma JSON : champs fallback obligatoires

**Fichier cible** : `docs_fusion_optimal.md` — Partie A §7, Annexe 1 §18.1, exemples JSON §5.5 et §6.5  
**Problème** : `low_resource_fallback` mentionné dans §12.4 (ALGO-CRV) mais absent du schéma JSON standard.

**Schéma JSON normalisé — champs ajoutés dans `metadata`** :

```json
{
  "algo_id": "ALGO-CRV",
  "lang": "BK",
  "input": "...",
  "ipa": "...",
  "syllables": [],
  "rhyme_nucleus": "...",
  "score": 0.0,
  "rhyme_type": "none",
  "similarity_method": "feature_weighted_levenshtein",
  "fallback_used": true,
  "fallback_reason": "low_resource_g2p",
  "g2p_confidence": "low",
  "metadata": {}
}
```

**Valeurs normatives de `fallback_reason`** :
- `null` — aucun fallback
- `"low_resource_g2p"` — G2P indisponible, fallback ByT5 ou règles CV
- `"low_resource_g2p_rules_only"` — uniquement règles artisanales, pas de modèle
- `"unknown_language"` — LID échoué, mode universel activé

**Valeurs normatives de `g2p_confidence`** :
- `"high"` — modèle entraîné natif
- `"medium"` — eSpeak ou Epitran couvrant la langue
- `"rules"` — règles artisanales manuelles
- `"low"` — ByT5 byte-level ou transcription proxy

---

## CORRECTION 6 — G2P Backend Registry pour KWA/CRV

**Fichier cible** : `docs_fusion_optimal.md` — Annexe 1 §2.1 tableau briques transverses  
**Problème** : eSpeak et Epitran cités comme backends génériques mais ne couvrent pas BA/DI/EW/MI/BK/OG nativement.

**Tableau G2P Backend Registry (remplace la ligne générique KWA/CRV)** :

| Langue | Code | Backend primaire | Fallback | `g2p_confidence` |
|---|---|---|---|---|
| Baoulé | BA | Règles CV tonal manuelles (v4.1) | ByT5-G2P byte-level | `rules` |
| Dioula | DI | Règles CV tonal manuelles (v4.1) | ByT5-G2P byte-level | `rules` |
| Ewe | EW | Règles CV tonal + harmonie | ByT5-G2P byte-level | `rules` |
| Mina | MI | Règles CV dérivées Ewe | ByT5-G2P byte-level | `rules` |
| Bekwarra | BK | ByT5-G2P byte-level | Transcription humaine | `low` |
| Calabari | CB | ByT5-G2P + règles implosives | Transcription humaine | `low` |
| Ogoja | OG | ByT5-G2P byte-level | Transcription humaine | `low` |
| Hausa | HA | eSpeak-NG `ha` + règles poids mora | Epitran `ha-Latn` | `medium` |

> ByT5-G2P = modèle ByT5 fine-tuné en G2P (séquence byte-to-IPA).  
> Pour BA/EW priorité d'implémentation v4.x : règles manuelles d'abord, ByT5 en v5.x.

---

## CORRECTION 7 — Purge des artefacts `citeturn...` dans Moteur linguistique R.md

**Fichier cible** : `Moteur-linguistique-R.md` (non versionné dans ce repo à ce jour)  
**Problème** : document contient des centaines d'occurrences de `citeturn3search0`, `citeturn0file0`, etc.

**Action** : appliquer le regex suivant avant tout usage en code-gen ou RAG :

```bash
sed -i 's/\s*cite\w\+//g' Moteur-linguistique-R.md
sed -i 's/\s*filecite\w\+//g' Moteur-linguistique-R.md
```

Ou en Python :
```python
import re
with open('Moteur-linguistique-R.md', 'r') as f:
    txt = f.read()
txt = re.sub(r'\s*cite\w+', '', txt)
txt = re.sub(r'\s*filecite\w+', '', txt)
with open('Moteur-linguistique-R.md', 'w') as f:
    f.write(txt)
```

Références bibliographiques à substituer (liste dans `docs_fusion_optimal.md` section `*Refs*`) :
`PHOIBLE` · `UAX15` · `LinCE` · `AfriBERTa` · `MasakhaNER` · `UD` · `FLORES-200` · `DAPT` · `XLM-R` · `mT5`

---

## Statut des corrections

| # | Correction | Priorité | Impact code | Statut |
|---|---|---|---|---|
| 1 | Numérotation pipeline 7 étapes | Basse | Nul (doc only) | ✅ Documenté |
| 2 | Définition Sₖ | Moyenne | Faible (module prosodique) | ✅ Documenté |
| 3 | Hiérarchie seuils | **Critique** | Fort (categorize()) | ✅ Corrigé |
| 4 | Contours tonaux BA | **Critique** | Fort (ALGO-KWA) | ✅ Corrigé |
| 5 | Schéma JSON fallback | **Critique** | Fort (output schema) | ✅ Corrigé |
| 6 | G2P Backend Registry | **Critique** | Fort (ALGO-KWA/CRV) | ✅ Corrigé |
| 7 | Purge citeturn... | Basse | Nul (cleanup) | ✅ Script fourni |

---

*Errata v4.2 — Emmanuel Kerhoz / Perplexity AI — Avril 2026*
