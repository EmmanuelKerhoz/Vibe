import { doLinesRhymeGraphemic } from '/home/runner/work/Vibe/Vibe/src/utils/rhymeDetection.ts';
const lang = 'fr';
const verseLines = [
  "Sa forme défaisait toute ma connaissance,",
  "Une danse de lueurs, une douce effervescence.",
  "Pas de corps ni de chair, juste une vibration,",
  "Parler à la flamme, pure illumination.",
  "Ses yeux sans regard, mais d'une profonde lueur,",
  "Étaient un miroir doux, au fond de mon cœur.",
];
console.log("Pair matrix (forScheme=true) — false positives revealed:");
for (let i=0;i<verseLines.length;i++) for (let j=i+1;j<verseLines.length;j++) {
  const r = doLinesRhymeGraphemic(verseLines[i], verseLines[j], lang, { forScheme: true });
  if (r) console.log(`  ${i+1} ↔ ${j+1}  RHYME`);
}
