import { FileText, LayoutRows, PersonVoice, Type } from '../../ui/icons';
import { LcarsSelect } from '../../ui/LcarsSelect';
import { useTranslation } from '../../../i18n';
import type { EditMode } from '../../../types';

interface ViewModeSelectorProps {
  editMode: EditMode;
  switchEditMode: (target: EditMode) => void;
  disabled: boolean;
}

export function ViewModeSelector({ editMode, switchEditMode, disabled }: ViewModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div style={{ minWidth: '110px', maxWidth: '150px' }}>
        <LcarsSelect
          value={editMode}
          onChange={(value) => switchEditMode(value as EditMode)}
          triggerLabel={<span className="flex items-center gap-1.5 text-[11px]">{t.editor.lyricsEditors ?? 'View'}</span>}
          options={[
            { value: 'text', label: <span className="flex items-center gap-1.5"><Type className="w-3.5 h-3.5" aria-hidden="true" /><span>{t.editor.textModeLabel}</span></span> },
            { value: 'markdown', label: <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" aria-hidden="true" /><span>{t.editor.markupModeLabel}</span></span> },
            { value: 'phonetic', label: <span className="flex items-center gap-1.5"><PersonVoice className="w-3.5 h-3.5" aria-hidden="true" /><span>{t.editor.phoneticModeLabel}</span></span> },
            { value: 'section', label: <span className="flex items-center gap-1.5"><LayoutRows className="w-3.5 h-3.5" aria-hidden="true" /><span>{t.editor.editorMode}</span></span> },
          ]}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
