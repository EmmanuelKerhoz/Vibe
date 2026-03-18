export type SectionTypeKey =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'refrain'
  | 'hook'
  | 'post-chorus'
  | 'bridge'
  | 'middle-8'
  | 'interlude'
  | 'breakdown'
  | 'build-up'
  | 'drop'
  | 'break'
  | 'final-chorus'
  | 'outro'
  | 'coda'
  | 'tag'
  | 'vamp'
  | 'turnaround';

export type SectionFamily = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'contrast' | 'outro' | 'default';

export type SectionTypeDefinition = {
  key: SectionTypeKey;
  label: string;
  description: string;
  aliases: string[];
  family: SectionFamily;
  unique?: boolean;
  autoNumber?: boolean;
};

const normalizeSectionLookup = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const SECTION_TYPE_DEFINITIONS: SectionTypeDefinition[] = [
  {
    key: 'intro',
    label: 'Intro',
    description: 'Ouvre le morceau et pose l’atmosphère. Repère : presque toujours au début, souvent courte.',
    aliases: ['intro'],
    family: 'intro',
    unique: true,
  },
  {
    key: 'verse',
    label: 'Verse',
    description: 'Fait avancer l’histoire et change généralement de paroles d’un passage à l’autre. Repère : la partie qui raconte.',
    aliases: ['verse', 'couplet'],
    family: 'verse',
    autoNumber: true,
  },
  {
    key: 'pre-chorus',
    label: 'Pre-Chorus',
    description: 'Crée la transition et la tension avant le chorus. Repère : ça monte, on sent que ça arrive.',
    aliases: ['pre chorus', 'pre-chorus', 'prechorus', 'pre refrain', 'pre-refrain', 'prerefrain'],
    family: 'pre-chorus',
    autoNumber: true,
  },
  {
    key: 'chorus',
    label: 'Chorus',
    description: 'Bloc répété, distinct et souvent le plus mémorable. Repère : grosse énergie et hook principal.',
    aliases: ['chorus'],
    family: 'chorus',
    autoNumber: true,
  },
  {
    key: 'refrain',
    label: 'Refrain',
    description: 'Petite phrase répétée, souvent intégrée au couplet plutôt qu’isolée. Repère : une ligne qui revient souvent.',
    aliases: ['refrain'],
    family: 'chorus',
  },
  {
    key: 'hook',
    label: 'Hook',
    description: 'Élément le plus accrocheur, mélodique, rythmique ou verbal. Repère : le truc qui reste dans la tête.',
    aliases: ['hook'],
    family: 'chorus',
  },
  {
    key: 'post-chorus',
    label: 'Post-Chorus',
    description: 'Prolonge le chorus en maintenant ou augmentant l’énergie. Repère : très courant dans la pop moderne.',
    aliases: ['post chorus', 'post-chorus', 'postchorus'],
    family: 'chorus',
  },
  {
    key: 'bridge',
    label: 'Bridge',
    description: 'Section de contraste qui casse la routine verse-chorus. Repère : souvent après le deuxième chorus.',
    aliases: ['bridge', 'pont'],
    family: 'contrast',
  },
  {
    key: 'middle-8',
    label: 'Middle 8',
    description: 'Variante de bridge, souvent autour de huit mesures. Repère : contraste bref au milieu ou vers la fin.',
    aliases: ['middle 8', 'middle8', 'middle eight'],
    family: 'contrast',
  },
  {
    key: 'interlude',
    label: 'Interlude',
    description: 'Passage de liaison, souvent instrumental, entre deux sections. Repère : respiration ou couture entre blocs.',
    aliases: ['interlude'],
    family: 'verse',
  },
  {
    key: 'breakdown',
    label: 'Breakdown',
    description: 'L’arrangement se dépouille pour préparer un retour plus fort. Repère : on retire des couches puis on relance.',
    aliases: ['breakdown'],
    family: 'contrast',
  },
  {
    key: 'build-up',
    label: 'Build-Up',
    description: 'Montée de tension qui prépare la suite. Repère : on sent clairement que ça va exploser.',
    aliases: ['build up', 'build-up', 'buildup'],
    family: 'contrast',
  },
  {
    key: 'drop',
    label: 'Drop',
    description: 'Pic d’énergie après le build-up. Repère : retour massif du groove, des drums ou du hook.',
    aliases: ['drop'],
    family: 'chorus',
  },
  {
    key: 'break',
    label: 'Break',
    description: 'Très courte rupture instrumentale ou rythmique. Repère : plus bref qu’un breakdown ou un interlude.',
    aliases: ['break'],
    family: 'contrast',
  },
  {
    key: 'final-chorus',
    label: 'Final Chorus',
    description: 'Dernier chorus, souvent plus grand, plus long ou plus insistant. Repère : payoff final avant la sortie.',
    aliases: ['final chorus', 'finalchorus', 'refrain final'],
    family: 'chorus',
    unique: true,
  },
  {
    key: 'outro',
    label: 'Outro',
    description: 'Ferme le morceau en prolongeant ou en réduisant la matière. Repère : la sortie musicale.',
    aliases: ['outro'],
    family: 'outro',
    unique: true,
  },
  {
    key: 'coda',
    label: 'Coda',
    description: 'Section finale conclusive qui referme le morceau. Repère : le mot théorique pour une fin très assumée.',
    aliases: ['coda'],
    family: 'outro',
  },
  {
    key: 'tag',
    label: 'Tag',
    description: 'Petite formule finale répétée qui insiste sur la dernière idée. Repère : mini-extension de fin.',
    aliases: ['tag'],
    family: 'outro',
  },
  {
    key: 'vamp',
    label: 'Vamp',
    description: 'Boucle harmonique ou rythmique répétée pendant un moment. Repère : ça tourne sans vraie progression nouvelle.',
    aliases: ['vamp'],
    family: 'verse',
  },
  {
    key: 'turnaround',
    label: 'Turnaround',
    description: 'Courte transition qui ramène vers le début ou la section suivante. Repère : elle colle les sections entre elles.',
    aliases: ['turnaround'],
    family: 'verse',
  },
];

export const SECTION_TYPE_OPTIONS = SECTION_TYPE_DEFINITIONS.map(({ label }) => label);

export const getSectionTypeDefinition = (name: string): SectionTypeDefinition | null => {
  const normalizedName = normalizeSectionLookup(name);
  if (!normalizedName) return null;
  return SECTION_TYPE_DEFINITIONS.find(({ aliases }) =>
    aliases.some(alias => normalizedName === alias || normalizedName.startsWith(`${alias} `)),
  ) ?? null;
};

export const getSectionTypeKey = (name: string): SectionTypeKey | null =>
  getSectionTypeDefinition(name)?.key ?? null;

export const getSectionFamily = (name: string): SectionFamily =>
  getSectionTypeDefinition(name)?.family ?? 'default';

export const getSectionExplanation = (name: string): string | null =>
  getSectionTypeDefinition(name)?.description ?? null;

export const getSectionTooltipLines = (name: string): string[] => {
  const definition = getSectionTypeDefinition(name);
  if (!definition) return [name];

  const [summary, cue] = definition.description.split(/(?<=\.)\s+(?=Repère\s*:)/);
  return [definition.label, summary, cue].filter((line): line is string => Boolean(line && line.trim()));
};

export const getSectionTooltipText = (name: string): string =>
  getSectionTooltipLines(name).join('\n');

export const isSectionType = (name: string, key: SectionTypeKey): boolean =>
  getSectionTypeKey(name) === key;

export const isUniqueSectionType = (name: string): boolean =>
  getSectionTypeDefinition(name)?.unique ?? false;

export const shouldAutoNumberSection = (name: string): boolean =>
  getSectionTypeDefinition(name)?.autoNumber ?? false;

export const isAnchoredStartSection = (name: string): boolean =>
  isSectionType(name, 'intro');

export const isAnchoredEndSection = (name: string): boolean =>
  isSectionType(name, 'outro');
