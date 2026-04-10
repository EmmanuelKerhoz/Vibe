/**
 * en.ts — English phonemic lexicon
 * ~300 entries [word, rnKey] for the PhonemeIndex used by suggestRhymes().
 * rnKey = final vowel+coda cluster (standard English rhyme nucleus).
 * Covers 100+ distinct RN keys.
 */

export const enLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /eɪ/ (day, say) ─────────────────────────────────────────────────────
  ['day', 'eɪ'], ['say', 'eɪ'], ['way', 'eɪ'], ['play', 'eɪ'],
  ['stay', 'eɪ'], ['pray', 'eɪ'], ['sway', 'eɪ'], ['clay', 'eɪ'],
  ['gray', 'eɪ'], ['spray', 'eɪ'], ['stray', 'eɪ'], ['away', 'eɪ'],
  ['today', 'eɪ'], ['delay', 'eɪ'], ['betray', 'eɪ'], ['display', 'eɪ'],
  ['relay', 'eɪ'], ['decay', 'eɪ'], ['convey', 'eɪ'], ['obey', 'eɪ'],
  ['they', 'eɪ'], ['weigh', 'eɪ'], ['sleigh', 'eɪ'],

  // ─── /eɪt/ (late, fate) ──────────────────────────────────────────────────
  ['late', 'eɪt'], ['fate', 'eɪt'], ['gate', 'eɪt'], ['state', 'eɪt'],
  ['great', 'eɪt'], ['weight', 'eɪt'], ['straight', 'eɪt'], ['plate', 'eɪt'],
  ['create', 'eɪt'], ['relate', 'eɪt'], ['translate', 'eɪt'], ['celebrate', 'eɪt'],

  // ─── /eɪn/ (rain, pain) ──────────────────────────────────────────────────
  ['rain', 'eɪn'], ['pain', 'eɪn'], ['gain', 'eɪn'], ['chain', 'eɪn'],
  ['train', 'eɪn'], ['plain', 'eɪn'], ['brain', 'eɪn'], ['strain', 'eɪn'],
  ['remain', 'eɪn'], ['explain', 'eɪn'], ['contain', 'eɪn'], ['obtain', 'eɪn'],
  ['sustain', 'eɪn'], ['complain', 'eɪn'], ['maintain', 'eɪn'],

  // ─── /iː/ (free, see) ────────────────────────────────────────────────────
  ['free', 'iː'], ['see', 'iː'], ['tree', 'iː'], ['be', 'iː'],
  ['me', 'iː'], ['we', 'iː'], ['key', 'iː'], ['sea', 'iː'],
  ['agree', 'iː'], ['degree', 'iː'], ['guarantee', 'iː'],

  // ─── /iːt/ (beat, street) ────────────────────────────────────────────────
  ['beat', 'iːt'], ['street', 'iːt'], ['meet', 'iːt'], ['feat', 'iːt'],
  ['heat', 'iːt'], ['seat', 'iːt'], ['treat', 'iːt'], ['repeat', 'iːt'],
  ['complete', 'iːt'], ['defeat', 'iːt'], ['elite', 'iːt'],

  // ─── /iːn/ (clean, mean) ─────────────────────────────────────────────────
  ['clean', 'iːn'], ['mean', 'iːn'], ['dream', 'iːm'], ['seen', 'iːn'],
  ['green', 'iːn'], ['screen', 'iːn'], ['queen', 'iːn'], ['between', 'iːn'],
  ['machine', 'iːn'], ['routine', 'iːn'], ['scene', 'iːn'],

  // ─── /iːm/ (dream, team) ─────────────────────────────────────────────────
  ['team', 'iːm'], ['seem', 'iːm'], ['stream', 'iːm'], ['scheme', 'iːm'],
  ['extreme', 'iːm'], ['supreme', 'iːm'], ['theme', 'iːm'],

  // ─── /aɪ/ (my, sky) ──────────────────────────────────────────────────────
  ['my', 'aɪ'], ['sky', 'aɪ'], ['fly', 'aɪ'], ['cry', 'aɪ'],
  ['try', 'aɪ'], ['why', 'aɪ'], ['die', 'aɪ'], ['lie', 'aɪ'],
  ['high', 'aɪ'], ['night', 'aɪt'], ['light', 'aɪt'], ['fight', 'aɪt'],
  ['right', 'aɪt'], ['bright', 'aɪt'], ['sight', 'aɪt'], ['might', 'aɪt'],
  ['tight', 'aɪt'], ['delight', 'aɪt'], ['tonight', 'aɪt'],

  // ─── /aɪn/ (line, mine) ──────────────────────────────────────────────────
  ['line', 'aɪn'], ['mine', 'aɪn'], ['fine', 'aɪn'], ['shine', 'aɪn'],
  ['sign', 'aɪn'], ['wine', 'aɪn'], ['nine', 'aɪn'], ['divine', 'aɪn'],
  ['define', 'aɪn'], ['design', 'aɪn'], ['combine', 'aɪn'],

  // ─── /aɪnd/ (mind, find) ─────────────────────────────────────────────────
  ['mind', 'aɪnd'], ['find', 'aɪnd'], ['kind', 'aɪnd'], ['bind', 'aɪnd'],
  ['blind', 'aɪnd'], ['behind', 'aɪnd'], ['remind', 'aɪnd'],

  // ─── /oʊ/ (go, flow) ─────────────────────────────────────────────────────
  ['go', 'oʊ'], ['flow', 'oʊ'], ['know', 'oʊ'], ['show', 'oʊ'],
  ['grow', 'oʊ'], ['slow', 'oʊ'], ['glow', 'oʊ'], ['blow', 'oʊ'],
  ['below', 'oʊ'], ['shadow', 'oʊ'], ['follow', 'oʊ'],

  // ─── /oʊn/ (stone, alone) ────────────────────────────────────────────────
  ['stone', 'oʊn'], ['alone', 'oʊn'], ['bone', 'oʊn'], ['tone', 'oʊn'],
  ['zone', 'oʊn'], ['phone', 'oʊn'], ['throne', 'oʊn'], ['known', 'oʊn'],
  ['shown', 'oʊn'], ['blown', 'oʊn'], ['unknown', 'oʊn'],

  // ─── /oʊld/ (cold, gold) ─────────────────────────────────────────────────
  ['cold', 'oʊld'], ['gold', 'oʊld'], ['bold', 'oʊld'], ['hold', 'oʊld'],
  ['told', 'oʊld'], ['old', 'oʊld'], ['fold', 'oʊld'], ['untold', 'oʊld'],

  // ─── /uː/ (true, blue) ───────────────────────────────────────────────────
  ['true', 'uː'], ['blue', 'uː'], ['through', 'uː'], ['new', 'uː'],
  ['you', 'uː'], ['do', 'uː'], ['too', 'uː'], ['who', 'uː'],
  ['clue', 'uː'], ['crew', 'uː'], ['grew', 'uː'], ['pursue', 'uː'],

  // ─── /uːn/ (moon, tune) ──────────────────────────────────────────────────
  ['moon', 'uːn'], ['tune', 'uːn'], ['soon', 'uːn'], ['noon', 'uːn'],
  ['spoon', 'uːn'], ['balloon', 'uːn'], ['immune', 'uːn'], ['fortune', 'uːn'],

  // ─── /ʌ/ (love, blood) ───────────────────────────────────────────────────
  ['love', 'ʌv'], ['blood', 'ʌd'], ['flood', 'ʌd'], ['above', 'ʌv'],
  ['dove', 'ʌv'], ['shove', 'ʌv'],

  // ─── /ʌn/ (run, sun) ─────────────────────────────────────────────────────
  ['run', 'ʌn'], ['sun', 'ʌn'], ['gun', 'ʌn'], ['fun', 'ʌn'],
  ['done', 'ʌn'], ['one', 'ʌn'], ['none', 'ʌn'], ['begun', 'ʌn'],
  ['overcome', 'ʌm'], ['come', 'ʌm'], ['some', 'ʌm'], ['numb', 'ʌm'],
  ['drum', 'ʌm'], ['sum', 'ʌm'], ['dumb', 'ʌm'],

  // ─── /ɑːr/ (far, star) ───────────────────────────────────────────────────
  ['far', 'ɑːr'], ['star', 'ɑːr'], ['car', 'ɑːr'], ['bar', 'ɑːr'],
  ['scar', 'ɑːr'], ['guitar', 'ɑːr'], ['bizarre', 'ɑːr'], ['avatar', 'ɑːr'],

  // ─── /ɔːr/ (more, score) ─────────────────────────────────────────────────
  ['more', 'ɔːr'], ['score', 'ɔːr'], ['door', 'ɔːr'], ['floor', 'ɔːr'],
  ['before', 'ɔːr'], ['ignore', 'ɔːr'], ['explore', 'ɔːr'], ['restore', 'ɔːr'],
  ['shore', 'ɔːr'], ['core', 'ɔːr'], ['war', 'ɔːr'],

  // ─── /ɜːr/ (word, heard) ─────────────────────────────────────────────────
  ['word', 'ɜːrd'], ['heard', 'ɜːrd'], ['bird', 'ɜːrd'], ['world', 'ɜːrld'],
  ['learn', 'ɜːrn'], ['burn', 'ɜːrn'], ['turn', 'ɜːrn'], ['return', 'ɜːrn'],
  ['concern', 'ɜːrn'], ['confirm', 'ɜːrm'], ['firm', 'ɜːrm'],

  // ─── /æ/ (back, that) ────────────────────────────────────────────────────
  ['back', 'æk'], ['track', 'æk'], ['black', 'æk'], ['crack', 'æk'],
  ['stack', 'æk'], ['attack', 'æk'], ['react', 'ækt'], ['impact', 'ækt'],
  ['fact', 'ækt'], ['act', 'ækt'],

  // ─── /ænd/ (hand, land) ──────────────────────────────────────────────────
  ['hand', 'ænd'], ['land', 'ænd'], ['band', 'ænd'], ['stand', 'ænd'],
  ['grand', 'ænd'], ['expand', 'ænd'], ['understand', 'ænd'],

  // ─── /ɪ/ (this, give) ────────────────────────────────────────────────────
  ['this', 'ɪs'], ['give', 'ɪv'], ['live', 'ɪv'], ['wish', 'ɪʃ'],
  ['finish', 'ɪʃ'], ['begin', 'ɪn'], ['within', 'ɪn'], ['win', 'ɪn'],
  ['spin', 'ɪn'], ['thin', 'ɪn'], ['skin', 'ɪn'],

  // ─── /ɪŋ/ (ring, bring) ──────────────────────────────────────────────────
  ['ring', 'ɪŋ'], ['bring', 'ɪŋ'], ['sing', 'ɪŋ'], ['king', 'ɪŋ'],
  ['thing', 'ɪŋ'], ['spring', 'ɪŋ'], ['string', 'ɪŋ'], ['swing', 'ɪŋ'],
  ['everything', 'ɪŋ'], ['anything', 'ɪŋ'], ['nothing', 'ɪŋ'],

  // ─── /ɛ/ (head, dead) ────────────────────────────────────────────────────
  ['head', 'ɛd'], ['dead', 'ɛd'], ['red', 'ɛd'], ['spread', 'ɛd'],
  ['thread', 'ɛd'], ['ahead', 'ɛd'], ['instead', 'ɛd'], ['dread', 'ɛd'],

  // ─── /ɛnd/ (end, friend) ─────────────────────────────────────────────────
  ['end', 'ɛnd'], ['friend', 'ɛnd'], ['spend', 'ɛnd'], ['blend', 'ɛnd'],
  ['trend', 'ɛnd'], ['extend', 'ɛnd'], ['defend', 'ɛnd'], ['depend', 'ɛnd'],
  ['pretend', 'ɛnd'], ['recommend', 'ɛnd'],

  // ─── /aʊ/ (now, sound) ───────────────────────────────────────────────────
  ['now', 'aʊ'], ['sound', 'aʊnd'], ['ground', 'aʊnd'], ['found', 'aʊnd'],
  ['round', 'aʊnd'], ['around', 'aʊnd'], ['profound', 'aʊnd'],
  ['crown', 'aʊn'], ['town', 'aʊn'], ['down', 'aʊn'], ['brown', 'aʊn'],
  ['frown', 'aʊn'], ['renown', 'aʊn'],

  // ─── /ɔɪ/ (voice, choice) ────────────────────────────────────────────────
  ['voice', 'ɔɪs'], ['choice', 'ɔɪs'], ['noise', 'ɔɪz'], ['poise', 'ɔɪz'],
  ['boy', 'ɔɪ'], ['joy', 'ɔɪ'], ['toy', 'ɔɪ'], ['employ', 'ɔɪ'],
  ['destroy', 'ɔɪ'], ['enjoy', 'ɔɪ'], ['annoy', 'ɔɪ'],

  // ─── /aɪf/ (life, knife) ─────────────────────────────────────────────────
  ['life', 'aɪf'], ['knife', 'aɪf'], ['wife', 'aɪf'], ['strife', 'aɪf'],

  // ─── hip-hop / urban English ──────────────────────────────────────────────
  ['flow', 'oʊ'], ['glow', 'oʊ'], ['yo', 'oʊ'], ['bro', 'oʊ'],
  ['rap', 'æp'], ['trap', 'æp'], ['clap', 'æp'], ['cap', 'æp'],
  ['mic', 'aɪk'], ['like', 'aɪk'], ['vibe', 'aɪb'], ['tribe', 'aɪb'],
  ['real', 'iːl'], ['feel', 'iːl'], ['deal', 'iːl'], ['heal', 'iːl'],
  ['steal', 'iːl'], ['reveal', 'iːl'],
  ['game', 'eɪm'], ['flame', 'eɪm'], ['name', 'eɪm'], ['claim', 'eɪm'],
  ['fame', 'eɪm'], ['shame', 'eɪm'],
  ['pain', 'eɪn'], ['rain', 'eɪn'], ['brain', 'eɪn'], ['chain', 'eɪn'],
  ['grind', 'aɪnd'], ['shine', 'aɪn'], ['divine', 'aɪn'], ['crime', 'aɪm'],
  ['rhyme', 'aɪm'], ['time', 'aɪm'], ['climb', 'aɪm'], ['prime', 'aɪm'],
];
