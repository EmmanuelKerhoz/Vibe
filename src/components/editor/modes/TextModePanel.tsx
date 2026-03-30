import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Type } from '../../ui/icons';
import { useTranslation } from '../../../i18n';
import { EditorModeShell } from './EditorModeShell';

interface TextModePanelProps {
  markupTextareaRef: RefObject<HTMLTextAreaElement>;
  markupText: string;
  setMarkupText: Dispatch<SetStateAction<string>>;
  markupDirection: 'ltr' | 'rtl';
}

export function TextModePanel({
  markupTextareaRef,
  markupText,
  setMarkupText,
  markupDirection,
}: TextModePanelProps) {
  const { t } = useTranslation();

  return (
    <EditorModeShell
      icon={<Type className="w-4 h-4 text-[var(--accent-color)]" />}
      title={t.editor.textMode.title}
      description={t.editor.textMode.description}
      hint={t.editor.textMode.hint}
    >
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <textarea
          ref={markupTextareaRef}
          value={markupText}
          onChange={(e) => setMarkupText(e.target.value)}
          spellCheck={false}
          dir={markupDirection}
          aria-label={t.editor.textMode.title}
          placeholder={t.editor.textMode.placeholder}
          className="absolute inset-0 w-full h-full resize-none bg-[var(--bg-app)] caret-[var(--text-primary)] outline-none font-mono text-sm leading-7 text-[var(--text-primary)]"
          style={{ padding: '1.5rem' }}
        />
      </div>
    </EditorModeShell>
  );
}
