const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
if (!fs.existsSync(appPath)) {
    console.error("❌ App.tsx not found at " + appPath);
    process.exit(1);
}
let code = fs.readFileSync(appPath, 'utf-8');

// 1. Add new imports right after the UI component imports
const newImports = `
import { countSyllables, cleanSectionName, safeJsonParse } from './utils/stringUtils';
import { getSectionColor, getSectionTextColor, getSectionDotColor, getRhymeColor } from './utils/themeUtils';
import { DEFAULT_STRUCTURE, MUSICAL_INSTRUCTIONS } from './constants/editor';
import { getAi, handleApiError } from './lib/gemini';
import { LyricInput } from './components/editor/LyricInput';
import { MarkupInput } from './components/editor/MarkupInput';
import { InstructionEditor } from './components/editor/InstructionEditor';
`;

if (!code.includes("import { countSyllables")) {
  code = code.replace("import { IconButton } from './components/ui/IconButton';", "import { IconButton } from './components/ui/IconButton';\n" + newImports);
}

// 2. Remove lib/gemini definitions
code = code.replace(/const getAi = \(\) => \{[\s\S]*?return new GoogleGenAI\(\{ apiKey \}\);\n\};\n/g, '');
code = code.replace(/let isErrorDialogOpen = false;\nconst handleApiError = \([\s\S]*?isErrorDialogOpen = false;\n  \}\n\};\n/g, '');

// 3. Remove string utils
code = code.replace(/const safeJsonParse = \([\s\S]*?return fallback;\n      \}\n    \}\n  \}\n\};\n/g, '');
code = code.replace(/const cleanSectionName = \([\s\S]*?return name\.replace\(\/\[\\\\\[\\\\\]\\\\\\*\]\/g, ''\)\.trim\(\);\n\};\n/g, '');

// 4. Remove Constants
code = code.replace(/const MUSICAL_INSTRUCTIONS = \[[\s\S]*?\];\n/g, '');
code = code.replace(/const DEFAULT_STRUCTURE = \['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Outro'\];\n/g, '');

// 5. Remove Theme utils
code = code.replace(/const getSectionColor = \([\s\S]*?return 'bg-zinc-800\\/50 border-white\\/10 text-zinc-400';\n\};\n/g, '');
code = code.replace(/const getSectionTextColor = \([\s\S]*?return 'text-zinc-600 dark:text-zinc-400';\n\};\n/g, '');
code = code.replace(/const getSectionDotColor = \([\s\S]*?return 'bg-zinc-500';\n\};\n/g, '');
code = code.replace(/const getRhymeColor = \([\s\S]*?return 'bg-white\\/5 text-zinc-500 border-white\\/10';\n\};\n/g, '');

// 6. Remove UI components
code = code.replace(/const LyricInput = \([\s\S]*?<\/div>\n  \);\n\};\n/g, '');
code = code.replace(/const MarkupInput = \([\s\S]*?<\/div>\n  \);\n\};\n/g, '');
code = code.replace(/const InstructionEditor = \([\s\S]*?<\/div>\n  \);\n\};\n/g, '');

// 7. Remove countSyllables from inside App function
code = code.replace(/  const countSyllables = \([\s\S]*?return syllables \? syllables\.length : 1;\n  \};\n/g, '');

fs.writeFileSync(appPath, code);
console.log("✅ App.tsx successfully refactored (Phase 1 & Phase 2 completed)!");
console.log("✅ Check the file, run your build to ensure types and paths are correct.");
