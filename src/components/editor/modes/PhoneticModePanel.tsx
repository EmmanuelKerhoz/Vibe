import type { RefObject } from 'react';
import { Loader2, PersonVoice } from '../../ui/icons';
import { useTranslation } from '../../../i18n';
import { MarkupInput } from '../MarkupInput';
import { EditorModeShell } from './EditorModeShell';

interface PhoneticModeStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  text: string;
  error: string | null;
  languageLabel: string;
}

interface PhoneticModePanelProps {
  phoneticTextareaRef: RefObject<HTMLTextAreaElement | null>;
  markupDirection: 'ltr' | 'rtl';
  phoneticState: PhoneticModeStatus;
}

export function PhoneticModePanel({
  phoneticTextareaRef,
  markupDirection,
  phoneticState,
}: PhoneticModePanelProps) {
  const { t } = useTranslation();

  return (
    <EditorModeShell
      icon={<PersonVoice className="w-4 h-4 text-[var(--accent-color)]" />}
      title={t.editor.phoneticMode.title}
      description={t.editor.phoneticMode.description}
    >
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
        {phoneticState.status === 'loading' && (
          <div className="absolute inset-0 bg-[var(--bg-app)]/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
              <span>{t.editor.phoneticMode.loading ?? 'Generating phonetics...'}</span>
            </div>
          </div>
        )}
        <MarkupInput
          value={phoneticState.text || (phoneticState.status === 'ready' ? t.editor.phoneticMode.placeholder : '')}
          onChange={() => {}}
          textareaRef={phoneticTextareaRef}
          direction={markupDirection}
          aria-label={t.editor.phoneticMode.title}
          className="w-full flex-1 min-h-0 font-mono text-sm leading-7 text-[var(--text-primary)] bg-[var(--bg-app)]"
          spellCheck={false}
          readOnly
          showLineNumbers
        />
      </div>
      <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--text-secondary)]">
          {phoneticState.status === 'error'
            ? (t.editor.phoneticMode.error
              ? t.editor.phoneticMode.error.replace('{error}', phoneticState.error || 'unavailable')
              : phoneticState.error)
            : t.editor.phoneticMode.hint.replace('{lang}', phoneticState.languageLabel)}
        </p>
        <span className={`text-[10px] uppercase tracking-widest font-semibold ${phoneticState.status === 'error' ? 'text-red-300' : 'text-[var(--accent-color)]'}`}>
          {phoneticState.status === 'error'
            ? (phoneticState.error || 'Error')
            : phoneticState.languageLabel}
        </span>
      </div>
    </EditorModeShell>
  );
}
