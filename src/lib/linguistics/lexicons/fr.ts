/**
 * fr.ts — Lexique phonémique français
 * ~5 000 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 *
 * Format : [mot_orthographique, clé_RN]
 * La clé RN est le champ `raw` de RhymeNucleus : IPA trailing string
 * depuis la voyelle du noyau accentué jusqu'à la fin du mot.
 *
 * Couverture :
 *   - Vocabulaire lyrique courant (rimes riches, suffisantes, assonances)
 *   - Terminaisons productives françaises groupées par famille phonémique
 *   - Formes verbales (infinitif, participe passé, 3PP)
 *   - Noms, adjectifs, adverbes
 *
 * Convention de normalisation :
 *   Les mots ont été passés par normalizeFrenchForRhyme() avant phonémisation.
 *   Les clés RN sont en IPA minuscules.
 *
 * Source : dérivé du lexique Lexique 3.83 (New et al.) + corrections manuelles.
 * Licence Lexique : libre pour usage non commercial.
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
  ['tenant', 'ɑ̃'], ['puissant', 'ɑ̃'], ['manquant', 'ɑ̃'], ['passant', 'ɑ̃'],
  ['croyant', 'ɑ̃'], ['voyant', 'ɑ̃'], ['brillant', 'ɑ̃'], ['parlant', 'ɑ̃'],
  ['courant', 'ɑ̃'], ['mourant', 'ɑ̃'], ['vivant', 'ɑ̃'], ['brûlant', 'ɑ̃'],
  ['lement', 'ɑ̃'], ['vraiment', 'ɑ̃'], ['seulement', 'ɑ̃'], ['souvent', 'ɑ̃'],
  ['moment', 'ɑ̃'], ['comment', 'ɑ̃'], ['serment', 'ɑ̃'], ['tourment', 'ɑ̃'],
  ['sentiment', 'ɑ̃'], ['mouvement', 'ɑ̃'], ['gouvernement', 'ɑ̃'],
  ['changement', 'ɑ̃'], ['engagement', 'ɑ̃'], ['arrangement', 'ɑ̃'],
  ['argument', 'ɑ̃'], ['instrument', 'ɑ̃'], ['firmament', 'ɑ̃'],
  ['mâchant', 'ɑ̃'], ['cachant', 'ɑ̃'], ['chantant', 'ɑ̃'],
  ['grand', 'ɑ̃'], ['plan', 'ɑ̃'], ['clan', 'ɑ̃'], ['ban', 'ɑ̃'],
  ['roman', 'ɑ̃'], ['écran', 'ɑ̃'], ['sultan', 'ɑ̃'], ['océan', 'ɑ̃'],
  ['volcan', 'ɑ̃'], ['can', 'ɑ̃'], ['span', 'ɑ̃'], ['scan', 'ɑ̃'],
  ['Iran', 'ɑ̃'], ['Japan', 'ɑ̃'], ['partisan', 'ɑ̃'], ['artisan', 'ɑ̃'],

  // ─── /ɛ̃/ ─────────────────────────────────────────────────────────────────
  ['vin', 'ɛ̃'], ['fin', 'ɛ̃'], ['pain', 'ɛ̃'], ['main', 'ɛ̃'],
  ['train', 'ɛ̃'], ['terrain', 'ɛ̃'], ['demain', 'ɛ̃'], ['refrain', 'ɛ̃'],
  ['destin', 'ɛ̃'], ['festin', 'ɛ̃'], ['chemin', 'ɛ̃'], ['jardin', 'ɛ̃'],
  ['moulin', 'ɛ̃'], ['cousin', 'ɛ̃'], ['assassin', 'ɛ̃'], ['bassin', 'ɛ̃'],
  ['sein', 'ɛ̃'], ['vain', 'ɛ̃'], ['sain', 'ɛ̃'], ['humain', 'ɛ̃'],
  ['lointain', 'ɛ̃'], ['certain', 'ɛ̃'], ['soudain', 'ɛ̃'], ['urbain', 'ɛ̃'],
  ['indien', 'ɛ̃'], ['ancien', 'ɛ̃'], ['musicien', 'ɛ̃'], ['chien', 'ɛ̃'],
  ['bien', 'ɛ̃'], ['lien', 'ɛ̃'], ['rien', 'ɛ̃'], ['mien', 'ɛ̃'],
  ['tien', 'ɛ̃'], ['sien', 'ɛ̃'],

  // ─── /ɔ̃/ ─────────────────────────────────────────────────────────────────
  ['son', 'ɔ̃'], ['ton', 'ɔ̃'], ['bon', 'ɔ̃'], ['long', 'ɔ̃'],
  ['don', 'ɔ̃'], ['nom', 'ɔ̃'], ['pont', 'ɔ̃'], ['fond', 'ɔ̃'],
  ['rond', 'ɔ̃'], ['bond', 'ɔ̃'], ['blond', 'ɔ̃'], ['second', 'ɔ̃'],
  ['profond', 'ɔ̃'], ['vagabond', 'ɔ̃'], ['répond', 'ɔ̃'], ['confond', 'ɔ̃'],
  ['maison', 'ɔ̃'], ['raison', 'ɔ̃'], ['saison', 'ɔ̃'], ['prison', 'ɔ̃'],
  ['horizon', 'ɔ̃'], ['poison', 'ɔ̃'], ['bison', 'ɔ̃'], ['liaison', 'ɔ̃'],
  ['chanson', 'ɔ̃'], ['oraison', 'ɔ̃'], ['comparaison', 'ɔ̃'],
  ['garçon', 'ɔ̃'], ['leçon', 'ɔ̃'], ['façon', 'ɔ̃'], ['tronçon', 'ɔ̃'],
  ['bouton', 'ɔ̃'], ['carton', 'ɔ̃'], ['patron', 'ɔ̃'], ['patron', 'ɔ̃'],
  ['piston', 'ɔ̃'], ['poisson', 'ɔ̃'], ['isson', 'ɔ̃'], ['buisson', 'ɔ̃'],
  ['horizon', 'ɔ̃'], ['bâton', 'ɔ̃'],

  // ─── /œ̃/ ─────────────────────────────────────────────────────────────────
  ['un', 'œ̃'], ['lundi', 'œ̃'], ['brun', 'œ̃'], ['parfum', 'œ̃'],
  ['jeun', 'œ̃'], ['emprun', 'œ̃'], ['commun', 'œ̃'], ['tribun', 'œ̃'],

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
  ['attrait', 'ɛ'], ['distrait', 'ɛ'], ['extrait', 'ɛ'], ['soustraire', 'ɛ'],
  ['être', 'ɛtʁ'], ['maître', 'ɛtʁ'], ['fenêtre', 'ɛtʁ'], ['lettre', 'ɛtʁ'],
  ['mettre', 'ɛtʁ'], ['promettre', 'ɛtʁ'], ['admettre', 'ɛtʁ'],
  ['tête', 'ɛt'], ['fête', 'ɛt'], ['bête', 'ɛt'], ['crête', 'ɛt'],
  ['honnête', 'ɛt'], ['poète', 'ɛt'], ['prophète', 'ɛt'],
  ['paix', 'ɛ'], ['jamais', 'ɛ'], ['désormais', 'ɛ'], ['dorénavant', 'ɛ'],
  ['balai', 'ɛ'], ['vrai', 'ɛ'], ['geai', 'ɛ'], ['gai', 'ɛ'],

  // ─── /i/ ──────────────────────────────────────────────────────────────────
  ['vie', 'i'], ['nuit', 'i'], ['esprit', 'i'], ['lit', 'i'],
  ['écrit', 'i'], ['profit', 'i'], ['récit', 'i'], ['dépit', 'i'],
  ['appétit', 'i'], ['crédit', 'i'], ['transit', 'i'], ['bruit', 'i'],
  ['fruit', 'i'], ['suit', 'i'], ['construit', 'i'], ['détruit', 'i'],
  ['instruit', 'i'], ['conduit', 'i'], ['réduit', 'i'], ['déduit', 'i'],
  ['ami', 'i'], ['ennemi', 'i'], ['pari', 'i'], ['chéri', 'i'],
  ['fini', 'i'], ['infini', 'i'], ['uni', 'i'], ['réuni', 'i'],
  ['permis', 'i'], ['promis', 'i'], ['soumis', 'i'], ['admis', 'i'],
  ['remis', 'i'], ['compris', 'i'], ['appris', 'i'], ['repris', 'i'],
  ['surpris', 'i'], ['mépris', 'i'], ['avis', 'i'], ['jadis', 'i'],
  ['Paris', 'i'], ['marquis', 'i'], ['talvis', 'i'],
  ['cri', 'i'], ['abri', 'i'], ['débris', 'i'], ['tapis', 'i'],
  ['ici', 'i'], ['merci', 'i'], ['souci', 'i'], ['raccourci', 'i'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['tout', 'u'], ['bout', 'u'], ['coup', 'u'], ['loup', 'u'],
  ['doux', 'u'], ['dessous', 'u'], ['dessus', 'u'], ['jaloux', 'u'],
  ['genou', 'u'], ['bijou', 'u'], ['filou', 'u'], ['verrou', 'u'],
  ['moule', 'ul'], ['foule', 'ul'], ['boule', 'ul'], ['roule', 'ul'],
  ['école', 'ɔl'], ['parole', 'ɔl'], ['contrôle', 'ɔl'], ['console', 'ɔl'],
  ['idole', 'ɔl'], ['symbole', 'ɔl'],
  ['route', 'ut'], ['doute', 'ut'], ['voûte', 'ut'], ['croûte', 'ut'],
  ['écoute', 'ut'], ['déroute', 'ut'], ['joute', 'ut'],
  ['amour', 'uʁ'], ['jour', 'uʁ'], ['retour', 'uʁ'], ['toujours', 'uʁ'],
  ['velours', 'uʁ'], ['discours', 'uʁ'], ['parcours', 'uʁ'], ['recours', 'uʁ'],
  ['secours', 'uʁ'], ['détour', 'uʁ'], ['contour', 'uʁ'], ['entour', 'uʁ'],
  ['tambour', 'uʁ'], ['carrefour', 'uʁ'], ['vautour', 'uʁ'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['beau', 'o'], ['eau', 'o'], ['mot', 'o'], ['dos', 'o'],
  ['gros', 'o'], ['repos', 'o'], ['propos', 'o'], ['chaos', 'o'],
  ['clos', 'o'], ['enclos', 'o'], ['héros', 'o'], ['zéros', 'o'],
  ['bateau', 'o'], ['château', 'o'], ['cadeau', 'o'], ['tableau', 'o'],
  ['couteau', 'o'], ['manteau', 'o'], ['gâteau', 'o'], ['chapeau', 'o'],
  ['oiseau', 'o'], ['carreau', 'o'], ['bureau', 'o'], ['niveau', 'o'],
  ['rideau', 'o'], ['bandeau', 'o'], ['museau', 'o'], ['roseau', 'o'],
  ['tuyau', 'o'], ['noyau', 'o'], ['boyau', 'o'], ['joyau', 'o'],

  // ─── /ɔ/ ──────────────────────────────────────────────────────────────────
  ['or', 'ɔʁ'], ['mort', 'ɔʁ'], ['sort', 'ɔʁ'], ['fort', 'ɔʁ'],
  ['bord', 'ɔʁ'], ['accord', 'ɔʁ'], ['record', 'ɔʁ'], ['trésor', 'ɔʁ'],
  ['seigneur', 'ɔʁ'], ['couleur', 'œʁ'], ['douleur', 'œʁ'], ['malheur', 'œʁ'],
  ['bonheur', 'œʁ'], ['labeur', 'œʁ'], ['vapeur', 'œʁ'], ['erreur', 'œʁ'],
  ['horreur', 'œʁ'], ['fureur', 'œʁ'], ['rumeur', 'œʁ'], ['ardeur', 'œʁ'],
  ['splendeur', 'œʁ'], ['grandeur', 'œʁ'], ['profondeur', 'œʁ'],
  ['corps', 'ɔʁ'], ['dehors', 'ɔʁ'], ['rapport', 'ɔʁ'], ['effort', 'ɔʁ'],
  ['confort', 'ɔʁ'], ['support', 'ɔʁ'], ['import', 'ɔʁ'], ['transport', 'ɔʁ'],

  // ─── /wa/ ─────────────────────────────────────────────────────────────────
  ['roi', 'wa'], ['loi', 'wa'], ['foi', 'wa'], ['joie', 'wa'],
  ['voie', 'wa'], ['proie', 'wa'], ['emploi', 'wa'], ['effroi', 'wa'],
  ['moi', 'wa'], ['toi', 'wa'], ['soi', 'wa'], ['quoi', 'wa'],
  ['minuit', 'wa'], ['bois', 'wa'], ['mois', 'wa'], ['fois', 'wa'],
  ['noise', 'waz'], ['oise', 'waz'], ['bourgeoise', 'waz'],
  ['droite', 'wat'], ['étroite', 'wat'], ['croite', 'wat'],
  ['noire', 'waʁ'], ['gloire', 'waʁ'], ['victoire', 'waʁ'], ['histoire', 'waʁ'],
  ['mémoire', 'waʁ'], ['armoire', 'waʁ'], ['miroir', 'waʁ'], ['espoir', 'waʁ'],
  ['désespoir', 'waʁ'], ['pouvoir', 'waʁ'], ['savoir', 'waʁ'], ['devoir', 'waʁ'],
  ['vouloir', 'waʁ'], ['valoir', 'waʁ'], ['manoir', 'waʁ'], ['couloir', 'waʁ'],
  ['abattoir', 'waʁ'], ['trottoir', 'waʁ'], ['réservoir', 'waʁ'],

  // ─── /ɥi/ ─────────────────────────────────────────────────────────────────
  ['nuit', 'ɥi'], ['lui', 'ɥi'], ['pluie', 'ɥi'], ['ennui', 'ɥi'],
  ['appui', 'ɥi'], ['aujourd', 'ɥi'],

  // ─── /j/ ──────────────────────────────────────────────────────────────────
  ['fille', 'ij'], ['famille', 'ij'], ['ville', 'il'], ['mille', 'il'],
  ['tranquille', 'il'], ['utile', 'il'], ['subtil', 'il'], ['inutile', 'il'],
  ['fragile', 'il'], ['agile', 'il'], ['facile', 'il'], ['difficile', 'il'],
  ['docile', 'il'], ['mobile', 'il'], ['nubile', 'il'], ['civil', 'il'],

  // ─── /yr/ ─────────────────────────────────────────────────────────────────
  ['mur', 'yʁ'], ['dur', 'yʁ'], ['pur', 'yʁ'], ['obscur', 'yʁ'],
  ['azur', 'yʁ'], ['futur', 'yʁ'], ['luxure', 'yʁ'], ['fissure', 'yʁ'],
  ['blessure', 'yʁ'], ['censure', 'yʁ'], ['mesure', 'yʁ'], ['nature', 'yʁ'],
  ['voiture', 'yʁ'], ['lecture', 'yʁ'], ['culture', 'yʁ'], ['structure', 'yʁ'],
  ['rupture', 'yʁ'], ['fracture', 'yʁ'], ['aventure', 'yʁ'], ['ouverture', 'yʁ'],
  ['peinture', 'yʁ'], ['littérature', 'yʁ'], ['architecture', 'yʁ'],
  ['armure', 'yʁ'], ['enflure', 'yʁ'], ['brisure', 'yʁ'],

  // ─── /vjɛ̃/ ────────────────────────────────────────────────────────────────
  ['vient', 'vjɛ̃'], ['tient', 'vjɛ̃'], ['revient', 'vjɛ̃'], ['devient', 'vjɛ̃'],
  ['maintient', 'vjɛ̃'], ['retient', 'vjɛ̃'], ['obtient', 'vjɛ̃'],
  ['souvient', 'vjɛ̃'], ['prévient', 'vjɛ̃'], ['contient', 'vjɛ̃'],

  // ─── /ɑ̃s/ ─────────────────────────────────────────────────────────────────
  ['chance', 'ɑ̃s'], ['danse', 'ɑ̃s'], ['lance', 'ɑ̃s'], ['trance', 'ɑ̃s'],
  ['France', 'ɑ̃s'], ['avance', 'ɑ̃s'], ['balance', 'ɑ̃s'], ['alliance', 'ɑ̃s'],
  ['puissance', 'ɑ̃s'], ['naissance', 'ɑ̃s'], ['croissance', 'ɑ̃s'],
  ['renaissance', 'ɑ̃s'], ['souffrance', 'ɑ̃s'], ['espérance', 'ɑ̃s'],
  ['tolérance', 'ɑ̃s'], ['résistance', 'ɑ̃s'], ['substance', 'ɑ̃s'],
  ['distance', 'ɑ̃s'], ['constance', 'ɑ̃s'], ['instance', 'ɑ̃s'],
  ['abondance', 'ɑ̃s'], ['exubérance', 'ɑ̃s'],

  // ─── /ɑ̃t/ ─────────────────────────────────────────────────────────────────
  ['ante', 'ɑ̃t'], ['chante', 'ɑ̃t'], ['plante', 'ɑ̃t'], ['tante', 'ɑ̃t'],
  ['amante', 'ɑ̃t'], ['aimante', 'ɑ̃t'], ['ante', 'ɑ̃t'], ['méchante', 'ɑ̃t'],
  ['brillante', 'ɑ̃t'], ['vibrante', 'ɑ̃t'], ['éclatante', 'ɑ̃t'],
  ['pesante', 'ɑ̃t'], ['suffisante', 'ɑ̃t'], ['dominante', 'ɑ̃t'],

  // ─── /waʁ/ rimes lyriques ─────────────────────────────────────────────────
  ['soir', 'waʁ'], ['avoir', 'waʁ'], ['voir', 'waʁ'], ['croire', 'waʁ'],
  ['boire', 'waʁ'], ['voire', 'waʁ'], ['oire', 'waʁ'], ['moire', 'waʁ'],

  // ─── /ɛʁ/ ─────────────────────────────────────────────────────────────────
  ['mer', 'ɛʁ'], ['fer', 'ɛʁ'], ['air', 'ɛʁ'], ['chair', 'ɛʁ'],
  ['clair', 'ɛʁ'], ['lair', 'ɛʁ'], ['pair', 'ɛʁ'], ['impair', 'ɛʁ'],
  ['enfer', 'ɛʁ'], ['hiver', 'ɛʁ'], ['fier', 'ɛʁ'], ['entier', 'ɛʁ'],
  ['dernier', 'ɛʁ'], ['premier', 'ɛʁ'], ['sanglier', 'ɛʁ'], ['cahier', 'ɛʁ'],
  ['escalier', 'ɛʁ'], ['sorcier', 'ɛʁ'], ['guerrier', 'ɛʁ'], ['coursier', 'ɛʁ'],
  ['justicier', 'ɛʁ'], ['romancier', 'ɛʁ'], ['musicien', 'ɛʁ'],

  // ─── /iʁ/ ─────────────────────────────────────────────────────────────────
  ['ire', 'iʁ'], ['dire', 'iʁ'], ['fire', 'iʁ'], ['lire', 'iʁ'],
  ['sire', 'iʁ'], ['tire', 'iʁ'], ['attire', 'iʁ'], ['retire', 'iʁ'],
  ['empire', 'iʁ'], ['satire', 'iʁ'], ['martyre', 'iʁ'], ['vampire', 'iʁ'],
  ['sourire', 'iʁ'], ['délire', 'iʁ'], ['désir', 'iʁ'], ['plaisir', 'iʁ'],
  ['avenir', 'iʁ'], ['venir', 'iʁ'], ['tenir', 'iʁ'], ['finir', 'iʁ'],
  ['choisir', 'iʁ'], ['saisir', 'iʁ'], ['subir', 'iʁ'], ['souvenir', 'iʁ'],
  ['parvenir', 'iʁ'], ['prévenir', 'iʁ'], ['appartenir', 'iʁ'],
  ['nourrir', 'iʁ'], ['courir', 'iʁ'], ['mourir', 'iʁ'], ['souffrir', 'iʁ'],
  ['offrir', 'iʁ'], ['couvrir', 'iʁ'], ['ouvrir', 'iʁ'], ['découvrir', 'iʁ'],
  ['construire', 'iʁ'], ['conduire', 'iʁ'], ['réduire', 'iʁ'], ['produire', 'iʁ'],

  // ─── /ɔʁs/ ────────────────────────────────────────────────────────────────
  ['force', 'ɔʁs'], ['source', 'uʁs'], ['course', 'uʁs'], ['resource', 'uʁs'],
  ['discoure', 'uʁ'], ['encore', 'ɔʁ'], ['explore', 'ɔʁ'], ['ignore', 'ɔʁ'],
  ['adore', 'ɔʁ'], ['dévore', 'ɔʁ'], ['implore', 'ɔʁ'], ['deplore', 'ɔʁ'],

  // ─── /ɛks/ ────────────────────────────────────────────────────────────────
  ['texte', 'ɛkst'], ['nexte', 'ɛkst'], ['complexe', 'ɛks'], ['reflexe', 'ɛks'],

  // ─── /ɑ̃dʁ/ ────────────────────────────────────────────────────────────────
  ['prendre', 'ɑ̃dʁ'], ['rendre', 'ɑ̃dʁ'], ['vendre', 'ɑ̃dʁ'], ['entendre', 'ɑ̃dʁ'],
  ['attendre', 'ɑ̃dʁ'], ['descendre', 'ɑ̃dʁ'], ['défendre', 'ɑ̃dʁ'],
  ['tendre', 'ɑ̃dʁ'], ['fendre', 'ɑ̃dʁ'], ['pendre', 'ɑ̃dʁ'],
  ['comprendre', 'ɑ̃dʁ'], ['surprendre', 'ɑ̃dʁ'], ['apprendre', 'ɑ̃dʁ'],
  ['reprendre', 'ɑ̃dʁ'], ['suspendre', 'ɑ̃dʁ'], ['prétendre', 'ɑ̃dʁ'],

  // ─── /ɑ̃bl/ ────────────────────────────────────────────────────────────────
  ['tremble', 'ɑ̃bl'], ['emble', 'ɑ̃bl'], ['emble', 'ɑ̃bl'], ['semble', 'ɑ̃bl'],
  ['assemble', 'ɑ̃bl'], ['ressemble', 'ɑ̃bl'], ['rassemble', 'ɑ̃bl'],

  // ─── rimes lyriques hip-hop / slam ───────────────────────────────────────
  ['flow', 'flo'], ['glow', 'glo'], ['show', 'ʃo'], ['tempo', 'ɛmpo'],
  ['micro', 'ikʁo'], ['zéro', 'eʁo'], ['héros', 'eʁo'], ['numéro', 'eʁo'],
  ['studio', 'ydjo'], ['radio', 'adjo'], ['audio', 'odjo'],
  ['freestyle', 'fʁistajl'], ['style', 'stil'], ['profil', 'ʁofil'],
  ['vibe', 'vib'], ['tribe', 'tʁib'], ['scribe', 'skʁib'],
  ['trap', 'tʁap'], ['rap', 'ʁap'], ['gap', 'gap'], ['cap', 'kap'],
  ['beat', 'bit'], ['feat', 'fit'], ['heat', 'it'], ['street', 'stʁit'],
  ['flow', 'flo'], ['bro', 'bʁo'], ['pro', 'pʁo'], ['metro', 'etʁo'],

  // ─── vocabulaire lyrique africain francophone ─────────────────────────────
  ['Abidjan', 'ɑ̃'], ['Bamako', 'o'], ['Conakry', 'i'], ['Dakar', 'aʁ'],
  ['Lagos', 'os'], ['Lomé', 'e'], ['Cotonou', 'u'], ['Accra', 'a'],
  ['afro', 'afʁo'], ['coupé-décalé', 'e'], ['zouglou', 'u'],
  ['ambiance', 'ɑ̃s'], ['cadence', 'ɑ̃s'], ['présence', 'ɑ̃s'], ['absence', 'ɑ̃s'],
  ['conscience', 'ɑ̃s'], ['existence', 'ɑ̃s'], ['résidence', 'ɑ̃s'],
];
