import { compareTextsWithIPA } from '/home/runner/work/Vibe/Vibe/src/utils/ipaPipeline.ts';
import { frenchG2P } from '/home/runner/work/Vibe/Vibe/src/lib/linguistics/strategies/FrenchG2P.ts';

console.log("G2P traces:");
for (const w of ['connaissance','effervescence','vibration','illumination','lueur','coeur','cœur','espace','passe','visage','âge']) {
  console.log(`  ${w} → ${frenchG2P(w)}`);
}

console.log("\nIPA pair comparisons (FR):");
const pairs = [
  ["Sa forme défaisait toute ma connaissance,", "Une danse de lueurs, une douce effervescence."],
  ["Pas de corps ni de chair, juste une vibration,", "Parler à la flamme, pure illumination."],
  ["Ses yeux sans regard, mais d'une profonde lueur,", "Étaient un miroir doux, au fond de mon cœur."],
  ["Un instant éternel, venu d'un autre espace,", "Mon âme a senti cette étreinte qui passe."],
  ["Avec un inconnu, sans mots et sans visage,", "Un secret partagé, au-delà de l'âge."],
  ["Sa forme défaisait toute ma connaissance,", "Pas de corps ni de chair, juste une vibration,"],
  ["Mon âme a senti cette étreinte qui passe.", "Avec un inconnu, sans mots et sans visage,"],
];
for (const [a, b] of pairs) {
  const sim = await compareTextsWithIPA(a, b, 'fr');
  console.log(`  ${(sim.score ?? 0).toFixed(3)}  q=${sim.quality}  ${a.slice(-25)}  ↔  ${b.slice(-25)}`);
}
