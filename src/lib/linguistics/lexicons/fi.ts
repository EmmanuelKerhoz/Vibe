/**
 * fi.ts — Lexique phonémique finnois
 * ~260 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Finnois : langue agglutinante, harmonie vocalique (a/ä, o/ö, u/y),
 * accent fixe sur la première syllabe, orthographe très régulière.
 * rnKey = voyelle finale (+ consonne coda si présente).
 * Couvre les terminaisons de cas nominaux et les formes verbales fréquentes.
 */

export const fiLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['maa', 'aa'], ['taa', 'aa'], ['kaa', 'aa'], ['saa', 'aa'], ['paa', 'aa'],
  ['naa', 'aa'], ['laa', 'aa'], ['raa', 'aa'], ['vaa', 'aa'], ['haa', 'aa'],
  ['talo', 'o'], ['kalo', 'o'], ['salo', 'o'], ['palo', 'o'], ['malo', 'o'],
  ['valo', 'o'], ['halo', 'o'], ['ralo', 'o'], ['nalo', 'o'], ['jalo', 'o'],
  ['jana', 'a'], ['kana', 'a'], ['sana', 'a'], ['pana', 'a'], ['mana', 'a'],
  ['vana', 'a'], ['hana', 'a'], ['rana', 'a'], ['lana', 'a'], ['tana', 'a'],

  // ─── /ä/ (série palatale) ─────────────────────────────────────────────────
  ['mäki', 'i'], ['käki', 'i'], ['säki', 'i'], ['päki', 'i'], ['läki', 'i'],
  ['räki', 'i'], ['täki', 'i'], ['väki', 'i'], ['häki', 'i'],
  ['mänty', 'y'], ['känty', 'y'], ['sänty', 'y'], ['pänty', 'y'],
  ['länty', 'y'], ['ränty', 'y'], ['tänty', 'y'], ['vänty', 'y'],
  ['käsi', 'i'], ['mäsi', 'i'], ['säsi', 'i'], ['päsi', 'i'],
  ['läsi', 'i'], ['räsi', 'i'], ['täsi', 'i'], ['väsi', 'i'],

  // ─── /e/ ──────────────────────────────────────────────────────────────────
  ['meri', 'i'], ['keri', 'i'], ['seri', 'i'], ['peri', 'i'], ['leri', 'i'],
  ['reri', 'i'], ['teri', 'i'], ['veri', 'i'], ['heri', 'i'], ['jeri', 'i'],
  ['mene', 'e'], ['kene', 'e'], ['sene', 'e'], ['pene', 'e'], ['lene', 'e'],
  ['rene', 'e'], ['tene', 'e'], ['vene', 'e'], ['hene', 'e'], ['jene', 'e'],
  ['tele', 'e'], ['pele', 'e'], ['kele', 'e'], ['mele', 'e'], ['sele', 'e'],
  ['rele', 'e'], ['hele', 'e'], ['lele', 'e'], ['vele', 'e'], ['jele', 'e'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['mili', 'i'], ['kili', 'i'], ['sili', 'i'], ['pili', 'i'], ['lili', 'i'],
  ['rili', 'i'], ['tili', 'i'], ['vili', 'i'], ['hili', 'i'], ['jili', 'i'],
  ['misi', 'i'], ['kisi', 'i'], ['sisi', 'i'], ['pisi', 'i'], ['lisi', 'i'],
  ['risi', 'i'], ['tisi', 'i'], ['visi', 'i'], ['hisi', 'i'], ['nisi', 'i'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['molo', 'o'], ['kolo', 'o'], ['solo', 'o'], ['polo', 'o'], ['lolo', 'o'],
  ['rolo', 'o'], ['tolo', 'o'], ['volo', 'o'], ['holo', 'o'], ['nolo', 'o'],
  ['mono', 'o'], ['kono', 'o'], ['sono', 'o'], ['pono', 'o'], ['lono', 'o'],
  ['rono', 'o'], ['tono', 'o'], ['vono', 'o'], ['hono', 'o'], ['nono', 'o'],

  // ─── /ö/ ──────────────────────────────────────────────────────────────────
  ['möly', 'y'], ['köly', 'y'], ['söly', 'y'], ['pöly', 'y'], ['löly', 'y'],
  ['röly', 'y'], ['töly', 'y'], ['völy', 'y'], ['höly', 'y'],
  ['möne', 'e'], ['köne', 'e'], ['söne', 'e'], ['pöne', 'e'], ['löne', 'e'],
  ['röne', 'e'], ['töne', 'e'], ['vöne', 'e'], ['höne', 'e'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['muru', 'u'], ['kuru', 'u'], ['suru', 'u'], ['puru', 'u'], ['luru', 'u'],
  ['ruru', 'u'], ['turu', 'u'], ['vuru', 'u'], ['huru', 'u'], ['nuru', 'u'],
  ['munu', 'u'], ['kunu', 'u'], ['sunu', 'u'], ['punu', 'u'], ['lunu', 'u'],
  ['runu', 'u'], ['tunu', 'u'], ['vunu', 'u'], ['hunu', 'u'], ['nunu', 'u'],

  // ─── Terminaisons casuelles et verbales typiques ──────────────────────────
  ['talo', 'o'], ['talon', 'on'], ['taloa', 'oa'], ['talossa', 'ossa'],
  ['talosta', 'osta'], ['taloon', 'oon'], ['talolla', 'olla'],
  ['talolta', 'olta'], ['talolle', 'olle'], ['talona', 'ona'],
  ['taloksi', 'oksi'], ['taloin', 'oin'], ['taloihin', 'ihin'],

  // ─── Mots courants / musique / poésie finnoise ────────────────────────────
  ['sydän', 'än'], ['mieli', 'i'], ['sielu', 'u'], ['rakkaus', 'us'],
  ['tähti', 'i'], ['kuusi', 'i'], ['järvi', 'i'], ['metsä', 'ä'],
  ['koivu', 'u'], ['talvi', 'i'], ['kesä', 'ä'], ['syksy', 'y'],
  ['kevät', 'ät'], ['yö', 'ö'], ['päivä', 'ä'], ['aamu', 'u'],
  ['ilta', 'a'], ['koti', 'i'], ['perhe', 'e'], ['lapsi', 'i'],
  ['nainen', 'en'], ['mies', 'es'], ['nuori', 'i'], ['vanha', 'a'],
  ['hyvä', 'ä'], ['kaunis', 'is'], ['suuri', 'i'], ['pieni', 'i'],
  ['uusi', 'i'], ['vanha', 'a'], ['oma', 'a'], ['tosi', 'i'],
  ['laulu', 'u'], ['musiikki', 'i'], ['rytmi', 'i'], ['sävel', 'el'],
  ['runo', 'o'], ['tarina', 'a'], ['elämä', 'ä'], ['kuolema', 'a'],
  ['vapaus', 'us'], ['totuus', 'us'], ['rauha', 'a'], ['sota', 'a'],
  ['voitto', 'o'], ['tappio', 'io'], ['ilo', 'o'], ['suru', 'u'],
];
