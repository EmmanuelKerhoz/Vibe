const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('❌ App.tsx not found at ' + appPath);
  process.exit(1);
}

let code = fs.readFileSync(appPath, 'utf-8');

const insertAfter = "import { IconButton } from './components/ui/IconButton';";
const importBlock = [
  "import { countSyllables, cleanSectionName, safeJsonParse } from './utils/stringUtils';",
  "import { getSectionColor, getSectionTextColor, getSectionDotColor, getRhymeColor } from './utils/themeUtils';",
  "import { DEFAULT_STRUCTURE } from './constants/editor';",
  "import { getAi, handleApiError } from './lib/gemini';",
  "import { LyricInput } from './components/editor/LyricInput';",
  "import { MarkupInput } from './components/editor/MarkupInput';",
  "import { InstructionEditor } from './components/editor/InstructionEditor';"
].join('\n') + "\n";

if (!code.includes("from './utils/stringUtils'")) {
  if (!code.includes(insertAfter)) {
    console.error('❌ Could not find insertion point for new imports.');
    process.exit(1);
  }
  code = code.replace(insertAfter, insertAfter + '\n\n' + importBlock);
}

code = code.replace("import { GoogleGenAI, Type } from '@google/genai';", "import { Type } from '@google/genai';");

const removeBetween = (startMarker, endMarker) => {
  const start = code.indexOf(startMarker);
  const end = code.indexOf(endMarker, start + startMarker.length);
  if (start !== -1 && end !== -1 && end > start) {
    code = code.slice(0, start) + code.slice(end);
    return true;
  }
  return false;
};

removeBetween('const getAi = () => {', 'const LyricInput =');
removeBetween('const LyricInput =', 'const MarkupInput =');
removeBetween('const MarkupInput =', 'const InstructionEditor =');
removeBetween('const InstructionEditor =', 'const getSectionColor =');
removeBetween('const getSectionColor =', 'const MUSICAL_INSTRUCTIONS =');
removeBetween('const MUSICAL_INSTRUCTIONS =', 'const safeJsonParse =');
removeBetween('const safeJsonParse =', 'let isErrorDialogOpen =');
removeBetween('let isErrorDialogOpen = false;', 'const DEFAULT_STRUCTURE =');
removeBetween("const DEFAULT_STRUCTURE = ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Outro'];", 'const cleanSectionName =');
removeBetween('const cleanSectionName =', 'export default function App()');

const countSyllablesStart = code.indexOf('  const countSyllables = (text: string) => {');
if (countSyllablesStart !== -1) {
  const nextMarker = code.indexOf('\n\n  const updateLineText =', countSyllablesStart);
  if (nextMarker !== -1) {
    code = code.slice(0, countSyllablesStart) + code.slice(nextMarker + 2);
  }
}

fs.writeFileSync(appPath, code);

console.log('✅ Phase 1 & 2 applied to App.tsx');
console.log('Next: run typecheck/build to validate.');
