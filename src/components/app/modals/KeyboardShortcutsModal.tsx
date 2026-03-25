import React, { useMemo } from 'react';
import {
  Button as FluentButton,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from '@fluentui/react-components';
import { KeyboardRegular, X } from '../../ui/icons';
import {
  KEYBOARD_SHORTCUTS_METADATA,
  type KeyboardShortcutCombo,
  type KeyboardShortcutMetadata,
} from '../../../hooks/useKeyboardShortcuts';
import { useTranslation } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER: KeyboardShortcutMetadata['category'][] = ['edit', 'navigation', 'file', 'ai'];

const CATEGORY_STYLES = {
  edit: {
    accent: 'var(--lcars-amber)',
    badgeSurface: 'rgba(245, 158, 11, 0.16)',
    badgeBorder: 'rgba(245, 158, 11, 0.34)',
  },
  navigation: {
    accent: 'var(--lcars-cyan)',
    badgeSurface: 'rgba(6, 182, 212, 0.16)',
    badgeBorder: 'rgba(6, 182, 212, 0.34)',
  },
  file: {
    accent: 'var(--lcars-sage)',
    badgeSurface: 'rgba(76, 175, 115, 0.16)',
    badgeBorder: 'rgba(76, 175, 115, 0.34)',
  },
  ai: {
    accent: 'var(--lcars-violet)',
    badgeSurface: 'rgba(167, 139, 250, 0.16)',
    badgeBorder: 'rgba(167, 139, 250, 0.34)',
  },
} as const;

function normalizeKeyLabel(key: string) {
  if (key === 'Escape') return 'Esc';
  return key.toUpperCase();
}

function expandComboLabels(combo: KeyboardShortcutCombo) {
  const trailing = [
    ...(combo.modifiers.includes('shift') ? ['Shift'] : []),
    ...(combo.modifiers.includes('alt') ? ['Alt'] : []),
    normalizeKeyLabel(combo.key),
  ];

  if (!combo.modifiers.includes('ctrlOrMeta')) return [trailing];
  return [
    ['Ctrl', ...trailing],
    ['⌘', ...trailing],
  ];
}

function renderCombo(
  combo: KeyboardShortcutCombo,
  accent: string,
  badgeSurface: string,
  badgeBorder: string,
) {
  const variants = expandComboLabels(combo);

  return (
    <div key={`${combo.modifiers.join('+')}:${combo.key}`} className="flex flex-wrap items-center gap-2">
      {variants.map((labels, variantIndex) => (
        <div key={`${combo.key}-${variantIndex}`} className="flex flex-wrap items-center gap-1.5">
          {variantIndex > 0 && <span className="text-[10px] text-[var(--text-secondary)]">/</span>}
          {labels.map((label, labelIndex) => (
            <React.Fragment key={`${label}-${labelIndex}`}>
              {labelIndex > 0 && <span className="text-[10px] text-[var(--text-secondary)]">+</span>}
              <span
                className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-[12px_4px_12px_4px] border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: accent,
                  backgroundColor: badgeSurface,
                  borderColor: badgeBorder,
                  boxShadow: `inset 0 -1px 0 ${badgeBorder}`,
                }}
              >
                {label}
              </span>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  const shortcutsByCategory = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      shortcuts: KEYBOARD_SHORTCUTS_METADATA.filter((shortcut) => shortcut.category === category),
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      modalType="modal"
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface
        aria-label={t.keyboardShortcuts.title}
        className="w-[calc(100vw-1rem)] border-0 bg-transparent p-0 shadow-none sm:w-[min(880px,calc(100vw-2rem))]"
      >
        <div
          className="lcars-gradient-outline rounded-none sm:rounded-[24px_8px_24px_8px]"
          style={{
            padding: '2px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            isolation: 'isolate',
          }}
        >
          <DialogBody className="dialog-surface overflow-hidden rounded-none p-0 sm:rounded-[22px_6px_22px_6px]">
            <DialogTitle
              action={
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.keyboardShortcuts.close}
                  className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              }
              className="m-0 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/10">
                  <KeyboardRegular className="h-4 w-4 text-[var(--accent-color)]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
                    {t.keyboardShortcuts.title}
                  </h2>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.22em] text-[var(--accent-color)]">
                    LCARS Input Reference
                  </p>
                </div>
              </div>
            </DialogTitle>

            <DialogContent className="custom-scrollbar max-h-[70vh] overflow-y-auto bg-transparent px-6 py-5">
              <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {t.keyboardShortcuts.description}
              </p>

              <div className="space-y-4">
                {shortcutsByCategory.map(({ category, shortcuts }) => {
                  const styles = CATEGORY_STYLES[category];

                  return (
                    <section
                      key={category}
                      className="overflow-hidden rounded-[20px_6px_20px_6px] border border-[var(--border-color)] bg-[var(--bg-app)]"
                    >
                      <div
                        className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3"
                        style={{
                          background: `linear-gradient(90deg, ${styles.badgeSurface} 0%, color-mix(in srgb, ${styles.accent} 10%, transparent) 100%)`,
                        }}
                      >
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: styles.accent }}>
                          {t.keyboardShortcuts.categories[category]}
                        </h3>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                          {shortcuts.length}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--border-color)] text-left">
                              <th className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                                {t.keyboardShortcuts.keysColumn}
                              </th>
                              <th className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                                {t.keyboardShortcuts.actionColumn}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {shortcuts.map((shortcut) => (
                              <tr key={shortcut.id} className="border-b border-[var(--border-color)] last:border-b-0">
                                <td className="w-[260px] px-4 py-3 align-top">
                                  <div className="flex flex-col gap-2">
                                    {shortcut.combos.map((combo) => renderCombo(
                                      combo,
                                      styles.accent,
                                      styles.badgeSurface,
                                      styles.badgeBorder,
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)]">
                                  {t.keyboardShortcuts.shortcuts[shortcut.id]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                })}
              </div>
            </DialogContent>

            <DialogActions className="border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] px-6 py-4">
              <FluentButton appearance="primary" onClick={onClose}>
                {t.keyboardShortcuts.close}
              </FluentButton>
            </DialogActions>
          </DialogBody>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
