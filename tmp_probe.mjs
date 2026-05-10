import { doLinesRhymeGraphemic, splitRhymingSuffix, segmentVerseToRhymingUnit } from '/home/runner/work/Vibe/Vibe/src/utils/rhymeDetection.ts';
import { detectRhymeSchemeLocally } from '/home/runner/work/Vibe/Vibe/src/utils/rhymeSchemeUtils.ts';

const lang = 'fr';

const cases = [
  // INTRO
  ["Une étoile filante a traversé ma nuit,", "Une rencontre étrange, loin de tout bruit.", true, "nuit/bruit"],
  ["Un éclair lumineux, un doux étranger,", "Un instant suspendu, je n'peux l'oublier.", true, "étranger/oublier"],
  // VERSE
  ["Sa forme défaisait toute ma connaissance,", "Une danse de lueurs, une douce effervescence.", true, "connaissance/effervescence (ance/ence -> /ɑ̃s/)"],
  ["Pas de corps ni de chair, juste une vibration,", "Parler à la flamme, pure illumination.", true, "vibration/illumination"],
  ["Ses yeux sans regard, mais d'une profonde lueur,", "Étaient un miroir doux, au fond de mon cœur.", true, "lueur/cœur (eur/œur)"],
  // CHORUS
  ["Un instant éternel, venu d'un autre espace,", "Mon âme a senti cette étreinte qui passe.", true, "espace/passe"],
  ["Avec un inconnu, sans mots et sans visage,", "Un secret partagé, au-delà de l'âge.", true, "visage/âge"],
  // CHORUS cross — should NOT rhyme
  ["Un instant éternel, venu d'un autre espace,", "Avec un inconnu, sans mots et sans visage,", false, "espace vs visage (should NOT rhyme)"],
  ["Mon âme a senti cette étreinte qui passe.", "Avec un inconnu, sans mots et sans visage,", false, "passe vs visage (should NOT rhyme)"],
];

console.log("Pair tests (forScheme=true):");
for (const [a, b, expected, desc] of cases) {
  const got = doLinesRhymeGraphemic(a, b, lang, { forScheme: true });
  console.log(`  ${got === expected ? '✅' : '❌'} ${desc}\n     A: ${a}\n     B: ${b}\n     expected ${expected}, got ${got}`);
}

console.log("\n\n=== Section schema for VERSE (AABBCC expected) ===");
const verseLines = [
  "Sa forme défaisait toute ma connaissance,",
  "Une danse de lueurs, une douce effervescence.",
  "Pas de corps ni de chair, juste une vibration,",
  "Parler à la flamme, pure illumination.",
  "Ses yeux sans regard, mais d'une profonde lueur,",
  "Étaient un miroir doux, au fond de mon cœur.",
];
console.log("scheme:", detectRhymeSchemeLocally(verseLines, lang));

console.log("\n=== Section schema for CHORUS (AABB expected: espace/passe, visage/âge) ===");
const chorusLines = [
  "Un instant éternel, venu d'un autre espace,",
  "Mon âme a senti cette étreinte qui passe.",
  "Avec un inconnu, sans mots et sans visage,",
  "Un secret partagé, au-delà de l'âge.",
];
console.log("scheme:", detectRhymeSchemeLocally(chorusLines, lang));

console.log("\n=== Per-line suffix split (peers = same section) for VERSE ===");
for (const l of verseLines) {
  const peers = verseLines.filter(x => x !== l);
  const split = splitRhymingSuffix(l, peers, lang);
  console.log(`  "${l}"  → before="${split?.before}" rhyme="${split?.rhyme}"`);
}
console.log("\n=== Per-line suffix split for CHORUS ===");
for (const l of chorusLines) {
  const peers = chorusLines.filter(x => x !== l);
  const split = splitRhymingSuffix(l, peers, lang);
  console.log(`  "${l}"  → before="${split?.before}" rhyme="${split?.rhyme}"`);
}
