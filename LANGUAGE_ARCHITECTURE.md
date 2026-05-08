# Language Architecture in Vibe

> **Single source of truth for all language-related decisions in the Lyricist Pro codebase.**
> Any future contributor (human or AI) must stay within this contract.

---

## 1. Core Contract

A language value in Vibe is **always a canonical `langId`** — never a bare code, an AI name, or an emoji.

| Format | Example | Scope |
|---|---|---|
| `"ui:<bcp47>"` | `"ui:fr"` | UI locale (interface strings) |
| `"adapt:<CODE>"` | `"adapt:ES"`, `"adapt:YO"` | Adaptation pipeline |
| `"custom:<text>"` | `"custom:Scots Gaelic"` | Free-input adaptation |

**Rule:** Every component, hook, storage key, and AI prompt pipeline must store, pass, and compare `langId` values. Raw codes (`"ES"`, `"fr"`), AI names (`"French"`), and emoji are **never** the primary identifier.

---

## 2. Central Registry — `src/i18n/constants.ts`

All language metadata lives in two canonical arrays:

- **`SUPPORTED_UI_LOCALES`** — static, versioned, human-reviewed UI translation packs.
  Each entry: `{ langId, code, label, flag, dir }`.

- **`SUPPORTED_ADAPTATION_LANGUAGES`** — AI-powered lyric adaptation targets.
  Each entry: `{ langId, code, aiName, sign, region?, isEthnical? }`.
  Sorted alphabetically by `aiName`. Includes nation flags and ethnic pictograms (unique per entry).

Two runtime indexes are built once at module load:

- **`LANG_ID_INDEX`** — `langId → { label, sign, region?, isEthnical? }` (authoritative lookup).
- **`LEGACY_INDEX`** — bare code / aiName → `langId` (migration only, read-only).

### Key Helpers

| Helper | Purpose |
|---|---|
| `getLanguageDisplay(langId)` | Resolve `{ label, sign, region? }` for any langId (UI rendering). |
| `formatLanguageDisplay(langId)` | `"🇫🇷 French"` — one-liner for compact display. |
| `migrateToLangId(stored)` | Upgrade any legacy value to canonical langId (use at storage/transport boundaries). |
| `migrateAdaptationToLangId(stored)` | Same, scoped to the adaptation domain. |
| `langIdToAiName(langId)` | Convert a canonical `AdaptationLangId` to the human name passed to the LLM. |
| `langIdToLocaleCode(langId)` | Extract BCP-47 code from a `ui:*` langId for `Intl.*` APIs. |
| `isCustomLangId(langId)` | `true` for `"custom:*"` values. |
| `readCustomLangText(langId)` | Extract the typed text from a `"custom:<text>"` sentinel. |

---

## 3. Rendering Rules

### 3.1 Flag / Sign

**Components MUST NOT derive a flag or label from a code, name, or emoji directly.**

The only allowed render path:

```tsx
// ✅ Correct
<LanguageBadge langId={lang.langId} />

// ❌ Forbidden — flag and label computed independently
<span>{lang.sign}</span>
<span>{lang.aiName}</span>
```

`<LanguageBadge>` accepts only a `langId` and resolves both sign and label from the central registry via `getLanguageDisplay`. The pair can never desync.

### 3.2 Selectors

All language selectors (dropdowns, pickers) must:

1. Build their options from `SUPPORTED_ADAPTATION_LANGUAGES` (or `SUPPORTED_UI_LOCALES` for UI locale pickers).
2. Use `lang.langId` as the option `value`.
3. Render each option with `<LanguageBadge langId={lang.langId} />`.
4. Emit only `langId` values across component boundaries.

See `useCustomLanguageSelector.ts` → `makeLangOption()` for the canonical implementation.

### 3.3 Custom Language

- The dropdown sentinel value is `CUSTOM_LANGUAGE_VALUE = '__custom__'`.
- The stored/emitted value for a custom language is `"custom:<user-typed-text>"`.
- Components detect custom values via `isCustomAdaptationLanguage(value)` or `isCustomLangId(langId)`.
- The typed text is recovered via `readCustomLangText(langId)`.
- Custom values are rendered as `🌐 <text>` by `getLanguageDisplay`.

---

## 4. Adaptation Pipeline Contract

File: `src/hooks/analysis/useLanguageAdapter.ts`

```
UI selector  →  langId  →  adaptSongLanguage(langId)
                               ↓
                    langIdToAiName(langId)   →  LLM prompt
                    sanitizeLangName(name)
```

- `adaptSongLanguage`, `adaptSectionLanguage`, `adaptLineLanguage` all accept a canonical `AdaptationLangId`.
- The **first operation** inside each function is `sanitizeLangName(langIdToAiName(rawLanguage))` — converting the langId to the human name used in AI prompts.
- **No legacy values may reach these functions.** Migration (`migrateAdaptationToLangId`) must happen upstream (in the UI or at storage read time).
- To update what name is sent to the LLM for a given language: change `aiName` in `SUPPORTED_ADAPTATION_LANGUAGES`. The pipeline picks it up automatically.

---

## 5. Storage & Migration

When reading a language value from `localStorage` or any external source:

```ts
const langId = migrateToLangId(stored);        // UI locales
const langId = migrateAdaptationToLangId(stored); // Adaptation
```

This upgrades:
- `"ES"` → `"adapt:ES"`
- `"French"` → `"adapt:FR"`
- `"ui:fr"` → `"ui:fr"` (no-op, already canonical)
- `"custom:Mina street"` → `"custom:Mina street"` (no-op)

Do **not** persist display strings (labels, emoji) — only `langId`.

---

## 6. Adding a New Language

1. Append an entry to `SUPPORTED_ADAPTATION_LANGUAGES` in `src/i18n/constants.ts`:
   - Choose a unique `code` (uppercase, 2–3 chars).
   - Set `langId: 'adapt:<CODE>'`.
   - Set `sign`: nation flag for sovereign-state languages, unique ethnic pictogram for regional/dialectal languages (`isEthnical: true`).
   - **Picto uniqueness rule**: no two `isEthnical` entries may share the same `sign`.
2. Add the `code` to the appropriate group in `LANGUAGE_GROUPS` (`useCustomLanguageSelector.ts`).
3. Run `npx ts-node scripts/validateLanguageGroups.ts` to verify no orphan codes.
4. No other files need to change — the registry, picker, and pipeline all derive from the single array.

---

## 7. Invariants (Non-Negotiable)

- A `langId` is the **only** identifier that crosses a component boundary.
- `LANG_ID_INDEX` is the **only** source of truth for display metadata at render time.
- `langIdToAiName` is the **only** conversion path from langId to LLM prompt text.
- `migrateAdaptationToLangId` is the **only** allowed entry point for legacy values.
- `<LanguageBadge langId={…}/>` is the **only** allowed render path for a flag+label pair.
