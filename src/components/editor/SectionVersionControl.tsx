import React, { useState, useRef, useEffect, useCallback } from 'react';
import { History, Save, Undo2, X, Trash2 } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { useOptionalSectionVersionContext } from '../../contexts/SectionVersionContext';
import type { Section, SectionVersion } from '../../types';
import { useSongMutation } from '../../contexts/SongMutationContext';

interface SectionVersionControlProps {
  section: Section;
  sectionIndex: number;
}

/**
 * Dropdown menu for managing per-section versions.
 * Shows version history and allows save/restore operations.
 */
export const SectionVersionControl = React.memo(function SectionVersionControl({
  section,
  sectionIndex,
}: SectionVersionControlProps) {
  const { t } = useTranslation();
  const versionContext = useOptionalSectionVersionContext();
  const { updateSection } = useSongMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // If context is not available, don't render anything
  if (!versionContext) return null;

  const {
    getSectionVersions,
    saveSectionVersion,
    deleteSectionVersion,
    getSectionVersionCount,
  } = versionContext;

  const versions = getSectionVersions(section.id);
  const versionCount = getSectionVersionCount(section.id);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSaveVersion = useCallback(() => {
    if (!versionName.trim()) return;
    saveSectionVersion(section, versionName.trim());
    setVersionName('');
    setSaveDialogOpen(false);
  }, [section, versionName, saveSectionVersion]);

  const handleRestoreVersion = useCallback((version: SectionVersion) => {
    // Clone the section from the version and update the current section
    const restoredSection: Section = {
      ...version.section,
      id: section.id, // Keep the current section ID
    };
    updateSection(section.id, restoredSection);
    setIsOpen(false);
  }, [section.id, updateSection]);

  const handleDeleteVersion = useCallback((e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    deleteSectionVersion(section.id, versionId);
  }, [section.id, deleteSectionVersion]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip title={t.tooltips?.sectionVersions ?? 'Section version history'}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={[
            'flex items-center gap-1 px-2 py-0.5 rounded',
            'text-[10px] font-semibold uppercase tracking-[0.15em]',
            'border transition-colors duration-150',
            'border-[var(--lcars-orange)]/60 text-[var(--lcars-orange)]',
            'hover:bg-[var(--lcars-orange)]/10',
            versionCount > 0 ? 'opacity-100' : 'opacity-60',
          ].join(' ')}
          aria-label={`${versionCount} version${versionCount !== 1 ? 's' : ''} saved`}
        >
          <History className="h-3 w-3" />
          <span>{versionCount}</span>
        </button>
      </Tooltip>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 w-80 max-h-96 overflow-y-auto bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 custom-scrollbar"
          role="menu"
          aria-label="Section version history"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] p-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--lcars-orange)]" />
              {section.name} Versions
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Save new version button */}
          <div className="p-3 border-b border-[var(--border-color)]">
            {!saveDialogOpen ? (
              <button
                type="button"
                onClick={() => setSaveDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--accent-color)] text-white rounded-md hover:opacity-90 transition-opacity text-xs font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                {t.editor?.saveSectionVersion ?? 'Save Current Version'}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveVersion();
                    if (e.key === 'Escape') {
                      setSaveDialogOpen(false);
                      setVersionName('');
                    }
                  }}
                  placeholder={t.editor?.versionNamePlaceholder ?? 'Version name...'}
                  className="w-full px-2 py-1.5 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveVersion}
                    disabled={!versionName.trim()}
                    className="flex-1 px-2 py-1.5 bg-[var(--accent-color)] text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.common?.save ?? 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setVersionName('');
                    }}
                    className="flex-1 px-2 py-1.5 bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] rounded text-xs font-medium"
                  >
                    {t.common?.cancel ?? 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Version list */}
          <div className="p-2">
            {versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                {t.editor?.noVersionsSaved ?? 'No versions saved yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="group p-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 rounded transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                            {version.name}
                          </p>
                          {version.isAutoSave && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded text-[var(--text-secondary)] uppercase tracking-wider">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                          {formatTimestamp(version.timestamp)}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                          {version.section.lines.length} {t.editor?.lines ?? 'lines'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip title={t.tooltips?.restoreVersion ?? 'Restore this version'}>
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(version)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded transition-colors"
                            aria-label="Restore version"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip title={t.tooltips?.deleteVersion ?? 'Delete this version'}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteVersion(e, version.id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            aria-label="Delete version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
