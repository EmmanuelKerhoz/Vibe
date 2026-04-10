/**
 * de.ts — Deutsches phonemisches Lexikon
 * ~300 Einträge [Wort, rnKey] für den PhonemeIndex.
 * rnKey = finales Vokal+Koda-Cluster (Standard-Reimnukleus).
 */

export const deLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /aɪ/ (Zeit, Leid) ────────────────────────────────────────────────────
  ['Zeit', 'aɪt'], ['Leid', 'aɪt'], ['Weit', 'aɪt'], ['Streit', 'aɪt'],
  ['Heit', 'aɪt'], ['weit', 'aɪt'], ['breit', 'aɪt'], ['Arbeit', 'aɪt'],
  ['Freiheit', 'aɪt'], ['Einheit', 'aɪt'], ['Wahrheit', 'aɪt'], ['Schönheit', 'aɪt'],
  ['mein', 'aɪn'], ['dein', 'aɪn'], ['kein', 'aɪn'], ['ein', 'aɪn'],
  ['Stein', 'aɪn'], ['Wein', 'aɪn'], ['Rein', 'aɪn'], ['Schein', 'aɪn'],
  ['allein', 'aɪn'], ['gemein', 'aɪn'], ['erschein', 'aɪn'],
  ['frei', 'aɪ'], ['zwei', 'aɪ'], ['neu', 'aɪ'], ['treu', 'aɪ'],
  ['dabei', 'aɪ'], ['vorbei', 'aɪ'], ['herbei', 'aɪ'],

  // ─── /aɪl/ (Weile, Eile) ─────────────────────────────────────────────────
  ['Weile', 'aɪlə'], ['Eile', 'aɪlə'], ['Zeile', 'aɪlə'], ['Meile', 'aɪlə'],

  // ─── /aː/ (Nacht, Macht) — Langvokal ─────────────────────────────────────
  ['Nacht', 'axt'], ['Macht', 'axt'], ['Wacht', 'axt'], ['Pracht', 'axt'],
  ['lacht', 'axt'], ['dacht', 'axt'],
  ['Satz', 'ats'], ['Platz', 'ats'], ['Schatz', 'ats'], ['Glanz', 'ants'],
  ['Tanz', 'ants'], ['ganz', 'ants'], ['Franz', 'ants'],

  // ─── /aːt/ (Tat, Rat) ────────────────────────────────────────────────────
  ['Tat', 'aːt'], ['Rat', 'aːt'], ['Staat', 'aːt'], ['Pfad', 'aːt'],
  ['Grad', 'aːt'], ['Blatt', 'at'], ['Statt', 'at'], ['matt', 'at'],

  // ─── /iː/ (Licht, Sicht) — /iːt/ ─────────────────────────────────────────
  ['Licht', 'ɪçt'], ['Sicht', 'ɪçt'], ['Pflicht', 'ɪçt'], ['Gedicht', 'ɪçt'],
  ['Gesicht', 'ɪçt'], ['Gewicht', 'ɪçt'], ['Verzicht', 'ɪçt'],
  ['ich', 'ɪç'], ['dich', 'ɪç'], ['mich', 'ɪç'], ['sich', 'ɪç'],
  ['gleich', 'aɪç'], ['weich', 'aɪç'], ['reich', 'aɪç'], ['Bereich', 'aɪç'],

  // ─── /iːn/ (Kinn, Sinn) ──────────────────────────────────────────────────
  ['Sinn', 'ɪn'], ['Kinn', 'ɪn'], ['Finn', 'ɪn'], ['Beginn', 'ɪn'],
  ['Gewinn', 'ɪn'], ['Rinn', 'ɪn'],
  ['Bein', 'aɪn'], ['Sein', 'aɪn'], ['fein', 'aɪn'], ['rein', 'aɪn'],

  // ─── /uː/ (Ruf, Mut) ─────────────────────────────────────────────────────
  ['Ruf', 'uːf'], ['Mut', 'uːt'], ['gut', 'uːt'], ['Blut', 'uːt'],
  ['Flut', 'uːt'], ['Hut', 'uːt'], ['Wut', 'uːt'], ['Glut', 'uːt'],
  ['tut', 'uːt'], ['Gut', 'uːt'],
  ['Stuhl', 'uːl'], ['kühl', 'yːl'], ['Pfühl', 'yːl'],

  // ─── /oː/ (Lohn, Sohn) ───────────────────────────────────────────────────
  ['Lohn', 'oːn'], ['Sohn', 'oːn'], ['Thron', 'oːn'], ['Ton', 'oːn'],
  ['schon', 'oːn'], ['davon', 'oːn'], ['wohin', 'oːn'],
  ['groß', 'oːs'], ['bloß', 'oːs'], ['Stoß', 'oːs'], ['Schoß', 'oːs'],

  // ─── /eː/ (Weg, Schnee) ──────────────────────────────────────────────────
  ['Weg', 'eːk'], ['Sieg', 'iːk'], ['liegt', 'iːkt'],
  ['Seele', 'eːlə'], ['Höhle', 'øːlə'], ['Keule', 'ɔɪlə'],
  ['Liebe', 'iːbə'], ['Triebe', 'iːbə'], ['Diebe', 'iːbə'],

  // ─── /ɛn/ (Leben, geben) ─────────────────────────────────────────────────
  ['Leben', 'eːbən'], ['geben', 'eːbən'], ['heben', 'eːbən'], ['streben', 'eːbən'],
  ['schweben', 'eːbən'], ['Reben', 'eːbən'],
  ['stehen', 'eːən'], ['sehen', 'eːən'], ['drehen', 'eːən'], ['flehen', 'eːən'],
  ['gehen', 'eːən'], ['geschehen', 'eːən'],

  // ─── /ɛs/ (Fest, Rest) ───────────────────────────────────────────────────
  ['Fest', 'ɛst'], ['Rest', 'ɛst'], ['Best', 'ɛst'], ['Test', 'ɛst'],
  ['West', 'ɛst'], ['Nest', 'ɛst'], ['Gäst', 'ɛst'],

  // ─── /ɛlt/ (Welt, Held) ──────────────────────────────────────────────────
  ['Welt', 'ɛlt'], ['Held', 'ɛlt'], ['Geld', 'ɛlt'], ['Feld', 'ɛlt'],
  ['Weld', 'ɛlt'], ['Zelt', 'ɛlt'], ['schnell', 'ɛl'],

  // ─── /aʊ/ (Traum, Raum) ──────────────────────────────────────────────────
  ['Traum', 'aʊm'], ['Raum', 'aʊm'], ['Schaum', 'aʊm'], ['Gaum', 'aʊm'],
  ['Baum', 'aʊm'], ['Saum', 'aʊm'], ['Flaum', 'aʊm'],
  ['Haus', 'aʊs'], ['Maus', 'aʊs'], ['Straus', 'aʊs'], ['heraus', 'aʊs'],
  ['hinaus', 'aʊs'], ['Saus', 'aʊs'],
  ['laut', 'aʊt'], ['Haut', 'aʊt'], ['Braut', 'aʊt'], ['Faust', 'aʊst'],
  ['Staub', 'aʊp'], ['Glaub', 'aʊp'],

  // ─── /ɔɪ/ (Freude, Heute) ────────────────────────────────────────────────
  ['Freude', 'ɔɪdə'], ['Beute', 'ɔɪtə'], ['Leute', 'ɔɪtə'], ['Häute', 'ɔɪtə'],
  ['Kreuz', 'ɔɪts'], ['Deutsch', 'ɔɪtʃ'],

  // ─── /yː/ (kühn, Glück) ──────────────────────────────────────────────────
  ['kühn', 'yːn'], ['Bühn', 'yːn'], ['Müh', 'yː'],
  ['Glück', 'ʏk'], ['Blick', 'ɪk'], ['Trick', 'ɪk'], ['zurück', 'ʏk'],

  // ─── /øː/ (schön, hören) ─────────────────────────────────────────────────
  ['schön', 'øːn'], ['hören', 'øːʁən'], ['stören', 'øːʁən'], ['gehören', 'øːʁən'],
  ['Flöte', 'øːtə'], ['Röte', 'øːtə'], ['Größe', 'øːsə'],

  // ─── /ʁ/ rimes renforcées ─────────────────────────────────────────────────
  ['Herz', 'ɛʁts'], ['Schmerz', 'ɛʁts'], ['Scherz', 'ɛʁts'], ['Nerz', 'ɛʁts'],
  ['Stern', 'ɛʁn'], ['fern', 'ɛʁn'], ['Kern', 'ɛʁn'], ['gern', 'ɛʁn'],
  ['Wort', 'ɔʁt'], ['dort', 'ɔʁt'], ['fort', 'ɔʁt'], ['Ort', 'ɔʁt'],

  // ─── /ʊŋ/ (-ung suffix) ───────────────────────────────────────────────────
  ['Hoffnung', 'ʊŋ'], ['Lösung', 'ʊŋ'], ['Bildung', 'ʊŋ'], ['Wirkung', 'ʊŋ'],
  ['Meinung', 'ʊŋ'], ['Richtung', 'ʊŋ'], ['Bewegung', 'ʊŋ'], ['Erfahrung', 'ʊŋ'],
  ['Erinnerung', 'ʊŋ'], ['Hoffnung', 'ʊŋ'], ['Begegnung', 'ʊŋ'],
  ['Veränderung', 'ʊŋ'], ['Entwicklung', 'ʊŋ'], ['Entscheidung', 'ʊŋ'],

  // ─── hip-hop / urban Deutsch ──────────────────────────────────────────────
  ['Rap', 'ap'], ['Trap', 'ap'], ['klar', 'aː'], ['Bar', 'aː'],
  ['Flow', 'floː'], ['Bro', 'broː'], ['Show', 'ʃoː'],
  ['krass', 'as'], ['Bass', 'as'], ['Glas', 'as'],
  ['real', 'ʁɪəl'], ['feel', 'fiːl'], ['Zeal', 'tsiːl'],
  ['Stress', 'ɛs'], ['mess', 'ɛs'], ['Weg', 'eːk'],
];
