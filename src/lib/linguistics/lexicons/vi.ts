/**
 * vi.ts — Lexique phonémique vietnamien
 * ~260 entrées [word, rnKey] pour le PhonemeIndex de suggestRhymes().
 * Vietnamien : langue monosyllabique, 6 tons, orthographe latine diacritée.
 * rnKey = noyau vocalique (+ coda consonantique si présente).
 * Couvre les finales rimes les plus fréquentes du vietnamien courant et musical.
 */

export const viLexicon: ReadonlyArray<readonly [string, string]> = [
  // ─── /a/ ouvert ──────────────────────────────────────────────────────────
  ['ba', 'a'], ['ca', 'a'], ['da', 'a'], ['ga', 'a'], ['ha', 'a'],
  ['la', 'a'], ['ma', 'a'], ['na', 'a'], ['pa', 'a'], ['ta', 'a'],
  ['va', 'a'], ['xa', 'a'], ['cha', 'a'], ['kha', 'a'], ['nha', 'a'],
  ['pha', 'a'], ['tha', 'a'], ['tra', 'a'],

  // ─── /an/ ─────────────────────────────────────────────────────────────────
  ['ban', 'an'], ['can', 'an'], ['dan', 'an'], ['gan', 'an'], ['han', 'an'],
  ['lan', 'an'], ['man', 'an'], ['nan', 'an'], ['tan', 'an'], ['van', 'an'],
  ['xan', 'an'], ['chan', 'an'], ['khan', 'an'], ['nhan', 'an'],
  ['phan', 'an'], ['than', 'an'], ['tran', 'an'],

  // ─── /ang/ ────────────────────────────────────────────────────────────────
  ['bang', 'ang'], ['cang', 'ang'], ['dang', 'ang'], ['gang', 'ang'],
  ['hang', 'ang'], ['lang', 'ang'], ['mang', 'ang'], ['nang', 'ang'],
  ['sang', 'ang'], ['tang', 'ang'], ['vang', 'ang'], ['xang', 'ang'],
  ['chang', 'ang'], ['khang', 'ang'], ['nhang', 'ang'], ['thang', 'ang'],

  // ─── /at/ ─────────────────────────────────────────────────────────────────
  ['bat', 'at'], ['cat', 'at'], ['dat', 'at'], ['hat', 'at'], ['lat', 'at'],
  ['mat', 'at'], ['nat', 'at'], ['pat', 'at'], ['sat', 'at'], ['tat', 'at'],
  ['vat', 'at'], ['chat', 'at'], ['khat', 'at'], ['nhat', 'at'],
  ['phat', 'at'], ['that', 'at'], ['trat', 'at'],

  // ─── /ăn/ ─────────────────────────────────────────────────────────────────
  ['băn', 'ăn'], ['căn', 'ăn'], ['đăn', 'ăn'], ['gắn', 'ăn'], ['hắn', 'ăn'],
  ['lắn', 'ăn'], ['mắn', 'ăn'], ['nắn', 'ăn'], ['sắn', 'ăn'], ['tắn', 'ăn'],
  ['văn', 'ăn'], ['chăn', 'ăn'], ['khăn', 'ăn'], ['phăn', 'ăn'],

  // ─── /e/ fermé ────────────────────────────────────────────────────────────
  ['be', 'e'], ['ce', 'e'], ['de', 'e'], ['ge', 'e'], ['he', 'e'],
  ['le', 'e'], ['me', 'e'], ['ne', 'e'], ['re', 'e'], ['se', 'e'],
  ['te', 'e'], ['ve', 'e'], ['xe', 'e'], ['che', 'e'], ['khe', 'e'],
  ['nhe', 'e'], ['phe', 'e'], ['the', 'e'], ['tre', 'e'],

  // ─── /en/ ─────────────────────────────────────────────────────────────────
  ['ben', 'en'], ['den', 'en'], ['gen', 'en'], ['hen', 'en'], ['ken', 'en'],
  ['len', 'en'], ['men', 'en'], ['nen', 'en'], ['sen', 'en'], ['ten', 'en'],
  ['ven', 'en'], ['xen', 'en'], ['chen', 'en'], ['khen', 'en'],
  ['nhen', 'en'], ['phen', 'en'], ['then', 'en'],

  // ─── /ên/ ─────────────────────────────────────────────────────────────────
  ['bên', 'ên'], ['cên', 'ên'], ['đên', 'ên'], ['hên', 'ên'], ['lên', 'ên'],
  ['mên', 'ên'], ['nên', 'ên'], ['sên', 'ên'], ['tên', 'ên'], ['vên', 'ên'],
  ['chên', 'ên'], ['khên', 'ên'], ['nhên', 'ên'], ['thên', 'ên'],

  // ─── /i/ / /y/ ────────────────────────────────────────────────────────────
  ['bi', 'i'], ['ci', 'i'], ['di', 'i'], ['gi', 'i'], ['hi', 'i'],
  ['li', 'i'], ['mi', 'i'], ['ni', 'i'], ['ri', 'i'], ['si', 'i'],
  ['ti', 'i'], ['vi', 'i'], ['chi', 'i'], ['khi', 'i'], ['nhi', 'i'],
  ['phi', 'i'], ['thi', 'i'], ['tri', 'i'],

  // ─── /in/ ─────────────────────────────────────────────────────────────────
  ['bin', 'in'], ['din', 'in'], ['gin', 'in'], ['hin', 'in'], ['kin', 'in'],
  ['lin', 'in'], ['min', 'in'], ['nin', 'in'], ['sin', 'in'], ['tin', 'in'],
  ['vin', 'in'], ['xin', 'in'], ['chin', 'in'], ['khin', 'in'],
  ['nhin', 'in'], ['phin', 'in'], ['thin', 'in'],

  // ─── /inh/ ────────────────────────────────────────────────────────────────
  ['binh', 'inh'], ['dinh', 'inh'], ['ginh', 'inh'], ['hinh', 'inh'],
  ['linh', 'inh'], ['minh', 'inh'], ['ninh', 'inh'], ['rinh', 'inh'],
  ['sinh', 'inh'], ['tinh', 'inh'], ['vinh', 'inh'], ['xinh', 'inh'],
  ['chinh', 'inh'], ['khinh', 'inh'], ['nhinh', 'inh'], ['thinh', 'inh'],

  // ─── /o/ ──────────────────────────────────────────────────────────────────
  ['bo', 'o'], ['co', 'o'], ['do', 'o'], ['go', 'o'], ['ho', 'o'],
  ['lo', 'o'], ['mo', 'o'], ['no', 'o'], ['ro', 'o'], ['so', 'o'],
  ['to', 'o'], ['vo', 'o'], ['xo', 'o'], ['cho', 'o'], ['kho', 'o'],
  ['nho', 'o'], ['pho', 'o'], ['tho', 'o'], ['tro', 'o'],

  // ─── /on/ ─────────────────────────────────────────────────────────────────
  ['bon', 'on'], ['con', 'on'], ['don', 'on'], ['gon', 'on'], ['hon', 'on'],
  ['lon', 'on'], ['mon', 'on'], ['non', 'on'], ['ron', 'on'], ['son', 'on'],
  ['ton', 'on'], ['von', 'on'], ['xon', 'on'], ['chon', 'on'], ['khon', 'on'],
  ['nhon', 'on'], ['phon', 'on'], ['thon', 'on'], ['tron', 'on'],

  // ─── /ong/ ────────────────────────────────────────────────────────────────
  ['bong', 'ong'], ['cong', 'ong'], ['dong', 'ong'], ['gong', 'ong'],
  ['hong', 'ong'], ['long', 'ong'], ['mong', 'ong'], ['nong', 'ong'],
  ['rong', 'ong'], ['song', 'ong'], ['tong', 'ong'], ['vong', 'ong'],
  ['xong', 'ong'], ['chong', 'ong'], ['khong', 'ong'], ['nhong', 'ong'],
  ['phong', 'ong'], ['thong', 'ong'], ['trong', 'ong'],

  // ─── /u/ ──────────────────────────────────────────────────────────────────
  ['bu', 'u'], ['cu', 'u'], ['du', 'u'], ['gu', 'u'], ['hu', 'u'],
  ['lu', 'u'], ['mu', 'u'], ['nu', 'u'], ['ru', 'u'], ['su', 'u'],
  ['tu', 'u'], ['vu', 'u'], ['xu', 'u'], ['chu', 'u'], ['khu', 'u'],
  ['nhu', 'u'], ['phu', 'u'], ['thu', 'u'], ['tru', 'u'],

  // ─── /un/ ─────────────────────────────────────────────────────────────────
  ['bun', 'un'], ['cun', 'un'], ['dun', 'un'], ['gun', 'un'], ['hun', 'un'],
  ['lun', 'un'], ['mun', 'un'], ['nun', 'un'], ['run', 'un'], ['sun', 'un'],
  ['tun', 'un'], ['vun', 'un'], ['xun', 'un'], ['chun', 'un'], ['khun', 'un'],
  ['nhun', 'un'], ['phun', 'un'], ['thun', 'un'], ['trun', 'un'],

  // ─── /ung/ ────────────────────────────────────────────────────────────────
  ['bung', 'ung'], ['cung', 'ung'], ['dung', 'ung'], ['gung', 'ung'],
  ['hung', 'ung'], ['lung', 'ung'], ['mung', 'ung'], ['nung', 'ung'],
  ['rung', 'ung'], ['sung', 'ung'], ['tung', 'ung'], ['vung', 'ung'],
  ['xung', 'ung'], ['chung', 'ung'], ['khung', 'ung'], ['nhung', 'ung'],
  ['phung', 'ung'], ['thung', 'ung'], ['trung', 'ung'],

  // ─── Mots courants / vocabulaire musical ─────────────────────────────────
  ['tình', 'inh'], ['yêu', 'êu'], ['trái', 'ai'], ['tim', 'im'],
  ['nhớ', 'ơ'], ['mắt', 'ăt'], ['đêm', 'êm'], ['ngày', 'ay'],
  ['mưa', 'ưa'], ['gió', 'io'], ['biển', 'iên'], ['trời', 'ơi'],
  ['đường', 'ương'], ['sông', 'ong'], ['núi', 'ui'], ['hoa', 'oa'],
  ['người', 'ươi'], ['lòng', 'ong'], ['hồn', 'on'], ['mộng', 'ong'],
  ['xuân', 'uân'], ['thu', 'u'], ['đông', 'ong'], ['hè', 'è'],
];
