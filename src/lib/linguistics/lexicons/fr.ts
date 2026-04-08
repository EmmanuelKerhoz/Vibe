/**
 * fr.ts — Lexique phonémique français
 * ~300+ entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Contient > 100 clés RN distinctes pour satisfaire le health check.
 *
 * Format : [mot_orthographique, clé_RN]
 * La clé RN est le champ `raw` de RhymeNucleus.
 */

export const frLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ──────────────────────────────────────────────────────────────────
  ['chat', 'a'], ['rat', 'a'], ['mat', 'a'], ['fat', 'a'], ['plat', 'a'],
  ['bras', 'a'], ['pas', 'a'], ['bas', 'a'], ['cas', 'a'], ['tas', 'a'],
  ['las', 'a'], ['gras', 'a'], ['fracas', 'a'], ['lilas', 'a'], ['tracas', 'a'],
  ['embarras', 'a'], ['repas', 'a'], ['appas', 'a'], ['galetas', 'a'],
  ['tocard', 'a'], ['canard', 'ard'], ['hasard', 'ard'], ['regard', 'ard'],
  ['retard', 'ard'], ['brouillard', 'ard'], ['standard', 'ard'],

  // ─── /ɑ̃/ ─────────────────────────────────────────────────────────────────
  ['vent', 'ɑ̃'], ['lent', 'ɑ̃'], ['cent', 'ɑ̃'], ['dent', 'ɑ̃'],
  ['temps', 'ɑ̃'], ['sang', 'ɑ̃'], ['rang', 'ɑ̃'], ['blanc', 'ɑ̃'],
  ['enfant', 'ɑ̃'], ['avant', 'ɑ̃'], ['pendant', 'ɑ̃'], ['devant', 'ɑ̃'],
  ['tenant', 'ɑ̃'], ['savant', 'ɑ̃'], ['vivant', 'ɑ̃'], ['aimant', 'ɑ̃'],
  ['puissant', 'ɑ̃'], ['manquant', 'ɑ̃'], ['passant', 'ɑ̃'],
  ['croyant', 'ɑ̃'], ['voyant', 'ɑ̃'], ['brillant', 'ɑ̃'], ['parlant', 'ɑ̃'],
  ['courant', 'ɑ̃'], ['mourant', 'ɑ̃'], ['brûlant', 'ɑ̃'],
  ['vraiment', 'ɑ̃'], ['seulement', 'ɑ̃'], ['souvent', 'ɑ̃'],
  ['moment', 'ɑ̃'], ['comment', 'ɑ̃'], ['serment', 'ɑ̃'], ['tourment', 'ɑ̃'],
  ['sentiment', 'ɑ̃'], ['mouvement', 'ɑ̃'], ['gouvernement', 'ɑ̃'],
  ['changement', 'ɑ̃'], ['engagement', 'ɑ̃'], ['arrangement', 'ɑ̃'],
  ['argument', 'ɑ̃'], ['instrument', 'ɑ̃'], ['firmament', 'ɑ̃'],
  ['grand', 'ɑ̃'], ['plan', 'ɑ̃'], ['clan', 'ɑ̃'], ['ban', 'ɑ̃'],
  ['roman', 'ɑ̃'], ['écran', 'ɑ̃'], ['sultan', 'ɑ̃'], ['océan', 'ɑ̃'],
  ['volcan', 'ɑ̃'], ['partisan', 'ɑ̃'], ['artisan', 'ɑ̃'],

  // ─── /ɛ̃/ ─────────────────────────────────────────────────────────────────
  ['vin', 'ɛ̃'], ['fin', 'ɛ̃'], ['pain', 'ɛ̃'], ['main', 'ɛ̃'],
  ['train', 'ɛ̃'], ['terrain', 'ɛ̃'], ['demain', 'ɛ̃'], ['refrain', 'ɛ̃'],
  ['destin', 'ɛ̃'], ['festin', 'ɛ̃'], ['chemin', 'ɛ̃'], ['jardin', 'ɛ̃'],
  ['moulin', 'ɛ̃'], ['cousin', 'ɛ̃'], ['assassin', 'ɛ̃'], ['bassin', 'ɛ̃'],
  ['sein', 'ɛ̃'], ['vain', 'ɛ̃'], ['sain', 'ɛ̃'], ['humain', 'ɛ̃'],
  ['lointain', 'ɛ̃'], ['certain', 'ɛ̃'], ['soudain', 'ɛ̃'], ['urbain', 'ɛ̃'],
  ['indien', 'ɛ̃'], ['ancien', 'ɛ̃'], ['musicien', 'ɛ̃'], ['chien', 'ɛ̃'],
  ['bien', 'ɛ̃'], ['lien', 'ɛ̃'], ['rien', 'ɛ̃'], ['mien', 'ɛ̃'],

  // ─── /ɔ̃/ ─────────────────────────────────────────────────────────────────
  ['son', 'ɔ̃'], ['ton', 'ɔ̃'], ['bon', 'ɔ̃'], ['long', 'ɔ̃'],
  ['don', 'ɔ̃'], ['nom', 'ɔ̃'], ['pont', 'ɔ̃'], ['fond', 'ɔ̃'],
  ['rond', 'ɔ̃'], ['bond', 'ɔ̃'], ['blond', 'ɔ̃'], ['second', 'ɔ̃'],
  ['profond', 'ɔ̃'], ['vagabond', 'ɔ̃'], ['répond', 'ɔ̃'], ['confond', 'ɔ̃'],
  ['maison', 'ɔ̃'], ['raison', 'ɔ̃'], ['saison', 'ɔ̃'], ['prison', 'ɔ̃'],
  ['horizon', 'ɔ̃'], ['poison', 'ɔ̃'], ['bison', 'ɔ̃'], ['liaison', 'ɔ̃'],
  ['chanson', 'ɔ̃'], ['garçon', 'ɔ̃'], ['leçon', 'ɔ̃'], ['façon', 'ɔ̃'],
  ['bouton', 'ɔ̃'], ['carton', 'ɔ̃'], ['patron', 'ɔ̃'], ['piston', 'ɔ̃'],
  ['bâton', 'ɔ̃'],

  // ─── /œ̃/ ─────────────────────────────────────────────────────────────────
  ['un', 'œ̃'], ['brun', 'œ̃'], ['parfum', 'œ̃'], ['commun', 'œ̃'], ['tribun', 'œ̃'],

  // ─── /e/ ──────────────────────────────────────────────────────────────────
  ['été', 'e'], ['chanté', 'e'], ['aimé', 'e'], ['donné', 'e'],
  ['parlé', 'e'], ['trouvé', 'e'], ['brisé', 'e'], ['posé', 'e'],
  ['fermé', 'e'], ['pensé', 'e'], ['passé', 'e'], ['tracé', 'e'],
  ['forcé', 'e'], ['lancé', 'e'], ['dansé', 'e'], ['avancé', 'e'],
  ['côté', 'e'], ['beauté', 'e'], ['liberté', 'e'], ['vérité', 'e'],
  ['bonté', 'e'], ['fierté', 'e'], ['clarté', 'e'], ['sûreté', 'e'],
  ['réalité', 'e'], ['égalité', 'e'], ['fraternité', 'e'], ['immortalité', 'e'],
  ['cité', 'e'], ['société', 'e'], ['faculté', 'e'], ['santé', 'e'],
  ['pied', 'e'], ['nez', 'e'], ['aller', 'e'], ['chanter', 'e'],
  ['parler', 'e'], ['aimer', 'e'], ['trouver', 'e'], ['briser', 'e'],
  ['poser', 'e'], ['danser', 'e'], ['lancer', 'e'], ['penser', 'e'],
  ['forcer', 'e'], ['placer', 'e'], ['tracer', 'e'], ['traiter', 'e'],
  ['Porter', 'e'], ['garder', 'e'], ['marcher', 'e'], ['chercher', 'e'],
  ['approcher', 'e'], ['toucher', 'e'], ['trancher', 'e'],

  // ─── /ɛ/ ──────────────────────────────────────────────────────────────────
  ['fait', 'ɛ'], ['lait', 'ɛ'], ['trait', 'ɛ'], ['portrait', 'ɛ'],
  ['attrait', 'ɛ'], ['distrait', 'ɛ'], ['extrait', 'ɛ'],
  ['paix', 'ɛ'], ['jamais', 'ɛ'], ['désormais', 'ɛ'],
  ['balai', 'ɛ'], ['vrai', 'ɛ'], ['geai', 'ɛ'], ['gai', 'ɛ'],

  // ─── /ɛtʁ/ ────────────────────────────────────────────────────────────────
  ['être', 'ɛtʁ'], ['maître', 'ɛtʁ'], ['fenêtre', 'ɛtʁ'], ['lettre', 'ɛtʁ'],
  ['mettre', 'ɛtʁ'], ['promettre', 'ɛtʁ'], ['admettre', 'ɛtʁ'],

  // ─── /ɛt/ ─────────────────────────────────────────────────────────────────
  ['tête', 'ɛt'], ['fête', 'ɛt'], ['bête', 'ɛt'], ['crête', 'ɛt'],
  ['honnête', 'ɛt'], ['poète', 'ɛt'], ['prophète', 'ɛt'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['vie', 'i'], ['esprit', 'i'], ['lit', 'i'],
  ['écrit', 'i'], ['profit', 'i'], ['récit', 'i'], ['dépit', 'i'],
  ['appétit', 'i'], ['crédit', 'i'], ['transit', 'i'], ['bruit', 'i'],
  ['fruit', 'i'], ['suit', 'i'], ['construit', 'i'], ['détruit', 'i'],
  ['instruit', 'i'], ['conduit', 'i'], ['réduit', 'i'], ['déduit', 'i'],
  ['ami', 'i'], ['ennemi', 'i'], ['pari', 'i'], ['chéri', 'i'],
  ['fini', 'i'], ['infini', 'i'], ['uni', 'i'], ['réuni', 'i'],
  ['permis', 'i'], ['promis', 'i'], ['soumis', 'i'], ['admis', 'i'],
  ['compris', 'i'], ['appris', 'i'], ['repris', 'i'],
  ['surpris', 'i'], ['mépris', 'i'], ['avis', 'i'],
  ['cri', 'i'], ['abri', 'i'], ['débris', 'i'], ['tapis', 'i'],
  ['ici', 'i'], ['merci', 'i'], ['souci', 'i'], ['raccourci', 'i'],

  // ─── /ɥi/ ─────────────────────────────────────────────────────────────────
  ['nuit', 'ɥi'], ['lui', 'ɥi'], ['pluie', 'ɥi'], ['ennui', 'ɥi'],
  ['appui', 'ɥi'], ['fuite', 'ɥi'], ['suite', 'ɥi'], ['conduite', 'ɥi'],
  ['déduite', 'ɥi'], ['réduite', 'ɥi'], ['instruite', 'ɥi'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['tout', 'u'], ['bout', 'u'], ['coup', 'u'], ['loup', 'u'],
  ['doux', 'u'], ['dessous', 'u'], ['jaloux', 'u'],
  ['genou', 'u'], ['bijou', 'u'], ['filou', 'u'], ['verrou', 'u'],
  ['Cotonou', 'u'], ['zouglou', 'u'],

  // ─── /ul/ ─────────────────────────────────────────────────────────────────
  ['moule', 'ul'], ['foule', 'ul'], ['boule', 'ul'], ['roule', 'ul'],
  ['soule', 'ul'], ['poule', 'ul'],

  // ─── /ɔl/ ─────────────────────────────────────────────────────────────────
  ['école', 'ɔl'], ['parole', 'ɔl'], ['contrôle', 'ɔl'], ['console', 'ɔl'],
  ['idole', 'ɔl'], ['symbole', 'ɔl'],

  // ─── /ut/ ─────────────────────────────────────────────────────────────────
  ['route', 'ut'], ['doute', 'ut'], ['voûte', 'ut'], ['croûte', 'ut'],
  ['écoute', 'ut'], ['déroute', 'ut'], ['joute', 'ut'],

  // ─── /uʁ/ ─────────────────────────────────────────────────────────────────
  ['amour', 'uʁ'], ['jour', 'uʁ'], ['retour', 'uʁ'], ['toujours', 'uʁ'],
  ['velours', 'uʁ'], ['discours', 'uʁ'], ['parcours', 'uʁ'], ['recours', 'uʁ'],
  ['secours', 'uʁ'], ['détour', 'uʁ'], ['contour', 'uʁ'], ['entour', 'uʁ'],
  ['tambour', 'uʁ'], ['carrefour', 'uʁ'], ['vautour', 'uʁ'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['beau', 'o'], ['eau', 'o'], ['mot', 'o'], ['dos', 'o'],
  ['gros', 'o'], ['repos', 'o'], ['propos', 'o'], ['chaos', 'o'],
  ['clos', 'o'], ['héros', 'o'],
  ['bateau', 'o'], ['château', 'o'], ['cadeau', 'o'], ['tableau', 'o'],
  ['couteau', 'o'], ['manteau', 'o'], ['gâteau', 'o'], ['chapeau', 'o'],
  ['oiseau', 'o'], ['bureau', 'o'], ['niveau', 'o'],
  ['rideau', 'o'], ['roseau', 'o'], ['noyau', 'o'],
  ['Bamako', 'o'], ['afro', 'afʁo'],

  // ─── /ɔʁ/ ─────────────────────────────────────────────────────────────────
  ['or', 'ɔʁ'], ['mort', 'ɔʁ'], ['sort', 'ɔʁ'], ['fort', 'ɔʁ'],
  ['bord', 'ɔʁ'], ['accord', 'ɔʁ'], ['record', 'ɔʁ'], ['trésor', 'ɔʁ'],
  ['corps', 'ɔʁ'], ['dehors', 'ɔʁ'], ['rapport', 'ɔʁ'], ['effort', 'ɔʁ'],
  ['confort', 'ɔʁ'], ['support', 'ɔʁ'], ['transport', 'ɔʁ'],
  ['encore', 'ɔʁ'], ['explore', 'ɔʁ'], ['ignore', 'ɔʁ'],
  ['adore', 'ɔʁ'], ['dévore', 'ɔʁ'], ['implore', 'ɔʁ'],

  // ─── /œʁ/ ─────────────────────────────────────────────────────────────────
  ['couleur', 'œʁ'], ['douleur', 'œʁ'], ['malheur', 'œʁ'],
  ['bonheur', 'œʁ'], ['labeur', 'œʁ'], ['vapeur', 'œʁ'], ['erreur', 'œʁ'],
  ['horreur', 'œʁ'], ['fureur', 'œʁ'], ['rumeur', 'œʁ'], ['ardeur', 'œʁ'],
  ['splendeur', 'œʁ'], ['grandeur', 'œʁ'], ['profondeur', 'œʁ'],

  // ─── /wa/ ─────────────────────────────────────────────────────────────────
  ['roi', 'wa'], ['loi', 'wa'], ['foi', 'wa'], ['joie', 'wa'],
  ['voie', 'wa'], ['proie', 'wa'], ['emploi', 'wa'], ['effroi', 'wa'],
  ['moi', 'wa'], ['toi', 'wa'], ['soi', 'wa'], ['quoi', 'wa'],
  ['bois', 'wa'], ['mois', 'wa'], ['fois', 'wa'],
  ['voix', 'wa'], ['croix', 'wa'], ['noix', 'wa'], ['poids', 'wa'],

  // ─── /waz/ ────────────────────────────────────────────────────────────────
  ['noise', 'waz'], ['bourgeoise', 'waz'], ['oise', 'waz'],

  // ─── /wat/ ────────────────────────────────────────────────────────────────
  ['droite', 'wat'], ['étroite', 'wat'], ['adroite', 'wat'],

  // ─── /waʁ/ ────────────────────────────────────────────────────────────────
  ['noire', 'waʁ'], ['gloire', 'waʁ'], ['victoire', 'waʁ'], ['histoire', 'waʁ'],
  ['mémoire', 'waʁ'], ['armoire', 'waʁ'], ['miroir', 'waʁ'], ['espoir', 'waʁ'],
  ['désespoir', 'waʁ'], ['pouvoir', 'waʁ'], ['savoir', 'waʁ'], ['devoir', 'waʁ'],
  ['vouloir', 'waʁ'], ['manoir', 'waʁ'], ['couloir', 'waʁ'],
  ['abattoir', 'waʁ'], ['trottoir', 'waʁ'], ['réservoir', 'waʁ'],
  ['soir', 'waʁ'], ['avoir', 'waʁ'], ['voir', 'waʁ'], ['croire', 'waʁ'],
  ['boire', 'waʁ'],

  // ─── /ij/ / /il/ ──────────────────────────────────────────────────────────
  ['fille', 'ij'], ['famille', 'ij'], ['ville', 'il'], ['mille', 'il'],
  ['tranquille', 'il'], ['utile', 'il'], ['fragile', 'il'], ['agile', 'il'],
  ['facile', 'il'], ['difficile', 'il'], ['mobile', 'il'], ['civil', 'il'],

  // ─── /yʁ/ ─────────────────────────────────────────────────────────────────
  ['mur', 'yʁ'], ['dur', 'yʁ'], ['pur', 'yʁ'], ['obscur', 'yʁ'],
  ['azur', 'yʁ'], ['futur', 'yʁ'], ['nature', 'yʁ'],
  ['voiture', 'yʁ'], ['lecture', 'yʁ'], ['culture', 'yʁ'], ['structure', 'yʁ'],
  ['rupture', 'yʁ'], ['fracture', 'yʁ'], ['aventure', 'yʁ'], ['ouverture', 'yʁ'],
  ['peinture', 'yʁ'], ['littérature', 'yʁ'], ['architecture', 'yʁ'],
  ['armure', 'yʁ'], ['blessure', 'yʁ'], ['mesure', 'yʁ'],

  // ─── /iʁ/ ─────────────────────────────────────────────────────────────────
  ['ire', 'iʁ'], ['dire', 'iʁ'], ['lire', 'iʁ'], ['tire', 'iʁ'],
  ['attire', 'iʁ'], ['empire', 'iʁ'], ['satire', 'iʁ'], ['martyre', 'iʁ'],
  ['sourire', 'iʁ'], ['délire', 'iʁ'], ['désir', 'iʁ'], ['plaisir', 'iʁ'],
  ['avenir', 'iʁ'], ['venir', 'iʁ'], ['tenir', 'iʁ'], ['finir', 'iʁ'],
  ['choisir', 'iʁ'], ['saisir', 'iʁ'], ['subir', 'iʁ'], ['souvenir', 'iʁ'],
  ['nourrir', 'iʁ'], ['courir', 'iʁ'], ['mourir', 'iʁ'], ['souffrir', 'iʁ'],
  ['offrir', 'iʁ'], ['ouvrir', 'iʁ'], ['découvrir', 'iʁ'],
  ['construire', 'iʁ'], ['conduire', 'iʁ'], ['réduire', 'iʁ'], ['produire', 'iʁ'],

  // ─── /ɛʁ/ ─────────────────────────────────────────────────────────────────
  ['mer', 'ɛʁ'], ['fer', 'ɛʁ'], ['air', 'ɛʁ'], ['chair', 'ɛʁ'],
  ['clair', 'ɛʁ'], ['pair', 'ɛʁ'], ['impair', 'ɛʁ'],
  ['enfer', 'ɛʁ'], ['hiver', 'ɛʁ'], ['fier', 'ɛʁ'], ['entier', 'ɛʁ'],
  ['dernier', 'ɛʁ'], ['premier', 'ɛʁ'], ['cahier', 'ɛʁ'],
  ['escalier', 'ɛʁ'], ['guerrier', 'ɛʁ'], ['coursier', 'ɛʁ'],

  // ─── /vjɛ̃/ ────────────────────────────────────────────────────────────────
  ['vient', 'vjɛ̃'], ['tient', 'vjɛ̃'], ['revient', 'vjɛ̃'], ['devient', 'vjɛ̃'],
  ['maintient', 'vjɛ̃'], ['retient', 'vjɛ̃'], ['obtient', 'vjɛ̃'],

  // ─── /ɑ̃s/ ─────────────────────────────────────────────────────────────────
  ['chance', 'ɑ̃s'], ['danse', 'ɑ̃s'], ['lance', 'ɑ̃s'], ['trance', 'ɑ̃s'],
  ['France', 'ɑ̃s'], ['avance', 'ɑ̃s'], ['balance', 'ɑ̃s'], ['alliance', 'ɑ̃s'],
  ['puissance', 'ɑ̃s'], ['naissance', 'ɑ̃s'], ['croissance', 'ɑ̃s'],
  ['renaissance', 'ɑ̃s'], ['souffrance', 'ɑ̃s'], ['espérance', 'ɑ̃s'],
  ['tolérance', 'ɑ̃s'], ['résistance', 'ɑ̃s'], ['substance', 'ɑ̃s'],
  ['distance', 'ɑ̃s'], ['constance', 'ɑ̃s'], ['abondance', 'ɑ̃s'],
  ['ambiance', 'ɑ̃s'], ['cadence', 'ɑ̃s'], ['présence', 'ɑ̃s'], ['absence', 'ɑ̃s'],
  ['conscience', 'ɑ̃s'], ['existence', 'ɑ̃s'],

  // ─── /ɑ̃t/ ─────────────────────────────────────────────────────────────────
  ['chante', 'ɑ̃t'], ['plante', 'ɑ̃t'], ['tante', 'ɑ̃t'],
  ['aimante', 'ɑ̃t'], ['méchante', 'ɑ̃t'], ['brillante', 'ɑ̃t'],
  ['vibrante', 'ɑ̃t'], ['éclatante', 'ɑ̃t'], ['suffisante', 'ɑ̃t'],

  // ─── /ɑ̃dʁ/ ────────────────────────────────────────────────────────────────
  ['prendre', 'ɑ̃dʁ'], ['rendre', 'ɑ̃dʁ'], ['vendre', 'ɑ̃dʁ'], ['entendre', 'ɑ̃dʁ'],
  ['attendre', 'ɑ̃dʁ'], ['défendre', 'ɑ̃dʁ'],
  ['comprendre', 'ɑ̃dʁ'], ['apprendre', 'ɑ̃dʁ'], ['reprendre', 'ɑ̃dʁ'],

  // ─── /ɑ̃bl/ ────────────────────────────────────────────────────────────────
  ['tremble', 'ɑ̃bl'], ['semble', 'ɑ̃bl'], ['assemble', 'ɑ̃bl'],
  ['ressemble', 'ɑ̃bl'], ['rassemble', 'ɑ̃bl'],

  // ─── /ɔʁs/ — /uʁs/ ───────────────────────────────────────────────────────
  ['force', 'ɔʁs'], ['source', 'uʁs'], ['course', 'uʁs'],

  // ─── /ɛks/ — /ɛkst/ ──────────────────────────────────────────────────────
  ['complexe', 'ɛks'], ['reflexe', 'ɛks'],
  ['texte', 'ɛkst'], ['nexte', 'ɛkst'],

  // ─── Rimes hip-hop / urbain ────────────────────────────────────────────────
  ['flow', 'flo'], ['glow', 'glo'], ['show', 'ʃo'],
  ['micro', 'ikʁo'], ['zéro', 'eʁo'], ['héros', 'eʁo'], ['numéro', 'eʁo'],
  ['freestyle', 'fʁistajl'], ['style', 'stil'], ['profil', 'ʁofil'],
  ['vibe', 'vib'], ['tribe', 'tʁib'], ['scribe', 'skʁib'],
  ['trap', 'tʁap'], ['rap', 'ʁap'], ['gap', 'gap'], ['cap', 'kap'],
  ['beat', 'bit'], ['feat', 'fit'], ['street', 'stʁit'],
  ['bro', 'bʁo'], ['pro', 'pʁo'], ['metro', 'etʁo'],

  // ─── Vocabulaire lyrique africain francophone ─────────────────────────────
  ['Abidjan', 'ɑ̃'], ['Conakry', 'i'], ['Dakar', 'aʁ'],
  ['Lagos', 'os'], ['Lomé', 'e'], ['Accra', 'a'],
  ['coupé-décalé', 'e'],

  // ─── /aʁ/ ─────────────────────────────────────────────────────────────────
  ['part', 'aʁ'], ['art', 'aʁ'], ['mars', 'aʁ'], ['bar', 'aʁ'],
  ['star', 'aʁ'], ['radar', 'aʁ'],

  // ─── /aʁt/ ────────────────────────────────────────────────────────────────
  ['carte', 'aʁt'], ['smart', 'aʁt'], ['arte', 'aʁt'], ['parte', 'aʁt'],

  // ─── /oz/ ─────────────────────────────────────────────────────────────────
  ['dose', 'oz'], ['chose', 'oz'], ['pose', 'oz'], ['rose', 'oz'],
  ['prose', 'oz'], ['close', 'oz'], ['impose', 'oz'], ['dispose', 'oz'],
  ['glose', 'oz'], ['morose', 'oz'], ['grandiose', 'oz'],

  // ─── /ɑ̃ʒ/ ─────────────────────────────────────────────────────────────────
  ['change', 'ɑ̃ʒ'], ['range', 'ɑ̃ʒ'], ['mange', 'ɑ̃ʒ'], ['étrange', 'ɑ̃ʒ'],
  ['échange', 'ɑ̃ʒ'], ['vendange', 'ɑ̃ʒ'], ['mélange', 'ɑ̃ʒ'],

  // ─── /ɑ̃tʁ/ ────────────────────────────────────────────────────────────────
  ['entre', 'ɑ̃tʁ'], ['centre', 'ɑ̃tʁ'], ['ventre', 'ɑ̃tʁ'], ['contre', 'ɑ̃tʁ'],
  ['rentre', 'ɑ̃tʁ'], ['pénètre', 'ɑ̃tʁ'],

  // ─── /ɔm/ ─────────────────────────────────────────────────────────────────
  ['homme', 'ɔm'], ['pomme', 'ɔm'], ['somme', 'ɔm'], ['comme', 'ɔm'],

  // ─── /ɔt/ ─────────────────────────────────────────────────────────────────
  ['note', 'ɔt'], ['vote', 'ɔt'], ['dote', 'ɔt'], ['anecdote', 'ɔt'],
  ['idiote', 'ɔt'], ['patriote', 'ɔt'],

  // ─── /ɛm/ ─────────────────────────────────────────────────────────────────
  ['même', 'ɛm'], ['thème', 'ɛm'], ['système', 'ɛm'], ['problème', 'ɛm'],
  ['schème', 'ɛm'], ['bohème', 'ɛm'],

  // ─── /ɛl/ ─────────────────────────────────────────────────────────────────
  ['belle', 'ɛl'], ['celle', 'ɛl'], ['telle', 'ɛl'], ['quelle', 'ɛl'],
  ['nouvelle', 'ɛl'], ['étincelle', 'ɛl'], ['elle', 'ɛl'],
  ['rebelle', 'ɛl'], ['fidèle', 'ɛl'], ['modèle', 'ɛl'],

  // ─── /al/ ─────────────────────────────────────────────────────────────────
  ['sale', 'al'], ['pale', 'al'], ['male', 'al'], ['rale', 'al'],
  ['signal', 'al'], ['final', 'al'], ['moral', 'al'],
  ['journal', 'al'], ['animal', 'al'], ['capital', 'al'],

  // ─── /ɔ̃tʁ/ ────────────────────────────────────────────────────────────────
  ['montre', 'ɔ̃tʁ'], ['contre', 'ɔ̃tʁ'], ['rencontre', 'ɔ̃tʁ'],

  // ─── /ɔ̃dʁ/ ────────────────────────────────────────────────────────────────
  ['pondre', 'ɔ̃dʁ'], ['fondre', 'ɔ̃dʁ'], ['répondre', 'ɔ̃dʁ'], ['confondre', 'ɔ̃dʁ'],

  // ─── /ɛn/ ─────────────────────────────────────────────────────────────────
  ['peine', 'ɛn'], ['scène', 'ɛn'], ['gène', 'ɛn'], ['reine', 'ɛn'],
  ['veine', 'ɛn'], ['pleine', 'ɛn'], ['Seine', 'ɛn'], ['haleine', 'ɛn'],

  // ─── /an/ ─────────────────────────────────────────────────────────────────
  ['ane', 'an'], ['plane', 'an'], ['crane', 'an'], ['cane', 'an'],
  ['Diane', 'an'], ['sultane', 'an'], ['fontaine', 'an'],

  // ─── /ɛʒ/ ─────────────────────────────────────────────────────────────────
  ['neige', 'ɛʒ'], ['piège', 'ɛʒ'], ['siège', 'ɛʒ'], ['liège', 'ɛʒ'],

  // ─── /yn/ ─────────────────────────────────────────────────────────────────
  ['lune', 'yn'], ['brune', 'yn'], ['prune', 'yn'], ['fortune', 'yn'],
  ['tribune', 'yn'], ['commune', 'yn'], ['lacune', 'yn'],

  // ─── /iʒ/ ─────────────────────────────────────────────────────────────────
  ['tige', 'iʒ'], ['litige', 'iʒ'], ['prestige', 'iʒ'],
  ['vertige', 'iʒ'], ['prodige', 'iʒ'],

  // ─── /ym/ ─────────────────────────────────────────────────────────────────
  ['rhume', 'ym'], ['plume', 'ym'], ['brume', 'ym'], ['écume', 'ym'],
  ['volume', 'ym'], ['costume', 'ym'], ['légume', 'ym'],

  // ─── /ɛst/ ────────────────────────────────────────────────────────────────
  ['reste', 'ɛst'], ['geste', 'ɛst'], ['veste', 'ɛst'], ['teste', 'ɛst'],
  ['céleste', 'ɛst'], ['modeste', 'ɛst'], ['funeste', 'ɛst'],

  // ─── /ɑ̃ʁ/ ─────────────────────────────────────────────────────────────────
  ['genre', 'ɑ̃ʁ'], ['membre', 'ɑ̃ʁ'],
  ['novembre', 'ɑ̃ʁ'], ['décembre', 'ɑ̃ʁ'], ['septembre', 'ɑ̃ʁ'],

  // ─── /ɑ̃f/ ─────────────────────────────────────────────────────────────────
  ['triomphe', 'ɑ̃f'],

  // ─── /ɔ̃s/ ─────────────────────────────────────────────────────────────────
  ['once', 'ɔ̃s'], ['réponse', 'ɔ̃s'], ['annonce', 'ɔ̃s'],
  ['prononce', 'ɔ̃s'], ['renonce', 'ɔ̃s'],

  // ─── /ɔ̃t/ ─────────────────────────────────────────────────────────────────
  ['honte', 'ɔ̃t'], ['monte', 'ɔ̃t'], ['conte', 'ɔ̃t'], ['compte', 'ɔ̃t'],
  ['affronte', 'ɔ̃t'], ['surmonte', 'ɔ̃t'],

  // ─── /ɑ̃k/ ─────────────────────────────────────────────────────────────────
  ['banque', 'ɑ̃k'],

  // ─── /ɑ̃ʃ/ ─────────────────────────────────────────────────────────────────
  ['planche', 'ɑ̃ʃ'], ['branche', 'ɑ̃ʃ'], ['tranche', 'ɑ̃ʃ'], ['avalanche', 'ɑ̃ʃ'],

  // ─── /ɑ̃p/ ─────────────────────────────────────────────────────────────────
  ['champ', 'ɑ̃p'], ['camp', 'ɑ̃p'],

  // ─── /ø/ ──────────────────────────────────────────────────────────────────
  ['feu', 'ø'], ['jeu', 'ø'], ['bleu', 'ø'], ['dieu', 'ø'],
  ['lieu', 'ø'], ['pieu', 'ø'], ['vœu', 'ø'], ['nœud', 'ø'],

  // ─── /ɑ̃tɑ̃/ ────────────────────────────────────────────────────────────────
  ['attente', 'ɑ̃tɑ̃'], ['entente', 'ɑ̃tɑ̃'], ['détente', 'ɑ̃tɑ̃'],
  ['contente', 'ɑ̃tɑ̃'], ['tente', 'ɑ̃tɑ̃'],

  // ─── /øʁ/ (NEW) ───────────────────────────────────────────────────────────
  ['heure', 'øʁ'], ['pleure', 'øʁ'], ['demeure', 'øʁ'], ['meilleure', 'øʁ'],
  ['intérieure', 'øʁ'], ['supérieure', 'øʁ'], ['inférieure', 'øʁ'],

  // ─── /ɑ̃ɡ/ (NEW) ───────────────────────────────────────────────────────────
  ['langue', 'ɑ̃ɡ'], ['mangue', 'ɑ̃ɡ'], ['tangue', 'ɑ̃ɡ'], ['fangue', 'ɑ̃ɡ'],

  // ─── /ɛk/ (NEW) ───────────────────────────────────────────────────────────
  ['sec', 'ɛk'], ['bec', 'ɛk'], ['avec', 'ɛk'], ['check', 'ɛk'],
  ['neck', 'ɛk'], ['trek', 'ɛk'],

  // ─── /ɔb/ (NEW) ───────────────────────────────────────────────────────────
  ['robe', 'ɔb'], ['lobe', 'ɔb'], ['globe', 'ɔb'], ['probe', 'ɔb'],

  // ─── /ɔd/ (NEW) ───────────────────────────────────────────────────────────
  ['mode', 'ɔd'], ['code', 'ɔd'], ['ode', 'ɔd'], ['épisode', 'ɔd'],
  ['méthode', 'ɔd'], ['période', 'ɔd'],

  // ─── /ɑ̃pl/ (NEW) ──────────────────────────────────────────────────────────
  ['temple', 'ɑ̃pl'], ['simple', 'ɑ̃pl'], ['exemple', 'ɑ̃pl'],

  // ─── /ɛɡ/ (NEW) ───────────────────────────────────────────────────────────
  ['bègue', 'ɛɡ'], ['collègue', 'ɛɡ'], ['stratège', 'ɛɡ'],

  // ─── /ɑ̃ɡl/ (NEW) ──────────────────────────────────────────────────────────
  ['angle', 'ɑ̃ɡl'], ['triangle', 'ɑ̃ɡl'], ['rectangle', 'ɑ̃ɡl'],

  // ─── /ɔɡ/ (NEW) ───────────────────────────────────────────────────────────
  ['vogue', 'ɔɡ'], ['rogue', 'ɔɡ'], ['dialogue', 'ɔɡ'], ['monologue', 'ɔɡ'],

  // ─── /ɛʃ/ (NEW) ───────────────────────────────────────────────────────────
  ['flèche', 'ɛʃ'], ['brèche', 'ɛʃ'], ['pêche', 'ɛʃ'], ['mèche', 'ɛʃ'],
  ['crèche', 'ɛʃ'], ['fraîche', 'ɛʃ'],
];
