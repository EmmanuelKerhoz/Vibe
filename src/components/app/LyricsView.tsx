import React, { useRef, useMemo, memo } from 'react';
import { ClipboardPaste, Library, Music, Sparkles } from '../ui/icons';
import { SectionEditor } from '../editor/SectionEditor';
import { countSectionRenderItems } from '../editor/SectionLineList';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { usePhoneticTranscription } from '../../hooks/usePhoneticTranscription';
import { useEditorContext } from '../../contexts/EditorContext';
import { useTranslationAdaptationContext } from '../../contexts/TranslationAdaptationContext';
import { MarkdownModePanel } from '../editor/modes/MarkdownModePanel';
import { PhoneticModePanel } from '../editor/modes/PhoneticModePanel';
import { TextModePanel } from '../editor/modes/TextModePanel';

interface LyricsViewProps {
  isAnalyzing: boolean;
  isAdaptingLanguage?: boolean;
  hasApiKey: boolean;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  canPasteLyrics: boolean;
  targetLanguage?: string;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
}

export const LyricsView = memo(function LyricsView({
  isAnalyzing,
  isAdaptingLanguage = false,
  hasApiKey,
  playAudioFeedback,
  canPasteLyrics,
  targetLanguage,
  onOpenLibrary, onPasteLyrics, onGenerateSong,
}: LyricsViewProps) {
  const { song, songLanguage } = useSongContext();
  const { clearSelection } = useComposerContext();
  const { t } = useTranslation();
  // Editor state sourced from EditorContext — no longer drilled via props
  const { editMode, markupText, setMarkupText, markupTextareaRef, markupDirection } = useEditorContext();
  const {
    sectionTargetLanguages,
    onSectionTargetLanguageChange,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds,
    showTranslationFeatures,
  } = useTranslationAdaptationContext();

  const phoneticTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const phoneticState = usePhoneticTranscription({
    song,
    sectionTargetLanguages,
    songLanguage,
    targetLanguage,
    isActive: editMode === 'phonetic',
  });

  const sectionLineOffsets = useMemo(() => {
    let offset = 0;
    return song.map((section) => {
      const start = offset;
      offset += countSectionRenderItems(section.lines);
      return start;
    });
  }, [song]);

  return (
    <>
      <div className="w-full min-w-0 flex flex-col gap-1 pb-32">
        {editMode === 'text' ? (
          <TextModePanel
            markupTextareaRef={markupTextareaRef}
            markupText={markupText}
            setMarkupText={setMarkupText}
            markupDirection={markupDirection}
          />
        ) : editMode === 'markdown' ? (
          <MarkdownModePanel
            markupText={markupText}
            setMarkupText={setMarkupText}
            markupTextareaRef={markupTextareaRef}
            markupDirection={markupDirection}
          />
        ) : editMode === 'phonetic' ? (
          <PhoneticModePanel
            phoneticTextareaRef={phoneticTextareaRef}
            markupDirection={markupDirection}
            phoneticState={phoneticState}
          />
        ) : song.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center select-none fluent-animate-in" role="status" aria-label={t.editor.emptyState.title}>
            <div className="w-16 h-16 rounded-[16px_4px_16px_4px] bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center mb-6" aria-hidden="true">
              <Music className="w-8 h-8 text-[var(--accent-color)]/40" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] mb-3">
              {t.editor.emptyState.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-2 leading-relaxed">
              {t.editor.emptyState.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={onOpenLibrary} aria-label={t.saveToLibrary.browseDescription} variant="outlined" color="info" size="small" startIcon={<Library className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
                {t.saveToLibrary.title}
              </Button>
              <Button onClick={onPasteLyrics} disabled={!canPasteLyrics} aria-label={t.tooltips.pasteLyrics} variant="outlined" color="info" size="small" startIcon={<ClipboardPaste className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
                {t.editor.emptyState.pasteLyrics}
              </Button>
              <Button onClick={onGenerateSong} disabled={!hasApiKey} aria-label={t.tooltips.generateSong} variant="contained" color="primary" size="small" startIcon={<Sparkles className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
                {t.editor.emptyState.generateSong}
              </Button>
            </div>
          </div>
        ) : (
          song.map((section, sectionIndex) => (
            <div key={section.id} className={`w-full min-w-0 fluent-animate-in fluent-stagger-${Math.min(sectionIndex + 1, 8)}`}>
              <SectionEditor
                section={section}
                sectionIndex={sectionIndex}
                songLength={song.length}
                lineNumberOffset={sectionLineOffsets[sectionIndex]}
                isAnalyzing={isAnalyzing}
                hasApiKey={hasApiKey}
                isAdaptingLanguage={showTranslationFeatures ? isAdaptingLanguage : false}
                sectionTargetLanguage={sectionTargetLanguages[section.id] ?? (songLanguage || 'English')}
                onSectionTargetLanguageChange={showTranslationFeatures ? onSectionTargetLanguageChange : undefined}
                adaptSectionLanguage={showTranslationFeatures ? adaptSectionLanguage : undefined}
                adaptLineLanguage={showTranslationFeatures ? adaptLineLanguage : undefined}
                adaptingLineIds={showTranslationFeatures ? adaptingLineIds : undefined}
                playAudioFeedback={playAudioFeedback}
                onLineBlur={clearSelection}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
});
