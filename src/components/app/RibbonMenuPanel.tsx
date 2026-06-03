/**
 * RibbonMenuPanel
 *
 * Renders the burger-menu dropdown for TopRibbon.
 * Owns:
 *   - fixed-position panel with LCARS gradient outline
 *   - outside-click / resize / scroll dismiss logic
 *   - all grouped menu sections (Create / Mode / Outils / App)
 *
 * Parent (TopRibbon) owns isMenuOpen state and passes:
 *   - anchorRef   : ref to the trigger button (for position calculation)
 *   - onClose     : () => void  — called when panel should dismiss
 *   - All action callbacks
 *
 * CREATE section now exposes explicit import/export actions per provider:
 *   Import Local | Import from OneDrive | Import from Google Drive
 *   Export Local | Export to OneDrive   | Export to Google Drive
 *
 * "Open Audio Folder from Cloud" and "Add Audio Files from Cloud" have been
 * moved to the Player tab (cloud functions of the Player, not document import).
 *
 * OUTILS section contains: Reset / Versions / Bibliothèque / Raccourcis clavier / Settings
 */
import React, { useEffect, useRef } from 'react';
import {
  Download, Upload, Trash2, History,
  Library, FilePlus, Settings, Info, WandSparkles, ClipboardPaste, Heart,
  KeyboardRegular, Music, AlignLeft, Cloud,
} from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useAppNavigationContext } from '../../contexts/AppStateContext';
import { useTopRibbonActions } from '../../hooks/useTopRibbonActions';

const MENU_WIDTH = 280;
const MENU_VIEWPORT_PADDING = 12;
const MENU_VERTICAL_OFFSET = 6;
const MENU_BOTTOM_PADDING = 16;

export const menuActionClass =
  'flex w-full items-center gap-3 bg-transparent px-4 py-1.5 text-[12px] text-left ' +
  'transition-colors outline-none focus-visible:bg-[var(--accent-color)]/10 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';

// Sub-item indented style (provider entries under import/export)
const subActionClass =
  'flex w-full items-center gap-3 bg-transparent pl-8 pr-4 py-1 text-[11px] text-left ' +
  'transition-colors outline-none focus-visible:bg-[var(--accent-color)]/10 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-color)]/8';

interface Props {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onOpenNewGeneration: () => void;
  onOpenNewEmpty: () => void;
}

export function RibbonMenuPanel({
  anchorRef,
  onClose,
  onOpenNewGeneration,
  onOpenNewEmpty,
}: Props) {
  const { song } = useSongContext();
  const { setActiveTab } = useAppNavigationContext();
  const {
    openVersionsModal, openResetModal,
    openImportLocal, openImportOneDrive, openImportGDrive,
    openExportLocal, openExportOneDrive, openExportGDrive,
    openLibrary, openSettings, openAbout, openKeyboardShortcuts,
    openPasteModal, canPasteLyrics,
  } = useTopRibbonActions();
  const { t } = useTranslation();

  const panelRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = React.useState({
    left: MENU_VIEWPORT_PADDING,
    top: MENU_VERTICAL_OFFSET,
  });

  useEffect(() => {
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        left: Math.max(
          MENU_VIEWPORT_PADDING,
          Math.min(rect.left, window.innerWidth - MENU_VIEWPORT_PADDING - MENU_WIDTH),
        ),
        top: rect.bottom + MENU_VERTICAL_OFFSET,
      });
    };
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [anchorRef, onClose]);

  const run = (action: () => void) => {
    action();
    onClose();
  };

  const hasSong = song.length > 0;

  return (
    <div
      ref={panelRef}
      className="lcars-gradient-outline rounded-[18px_6px_18px_6px] shadow-2xl py-1.5 overflow-x-hidden overflow-y-auto"
      style={{
        position: 'fixed',
        left: `${menuPosition.left}px`,
        top: `${menuPosition.top}px`,
        width: `${MENU_WIDTH}px`,
        maxHeight: `calc(100dvh - ${menuPosition.top}px - var(--mobile-nav-h, 56px) - var(--sab, 0px) - ${MENU_BOTTOM_PADDING}px)`,
        backgroundColor: 'var(--bg-app, #111)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.06)',
        zIndex: 70,
      }}
    >
      {/* ── Create ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">{t.menu?.create ?? 'Create'}</div>

      <Tooltip title={t.tooltips.newSong ?? 'Create a new empty song'}>
        <button onClick={() => run(onOpenNewEmpty)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <FilePlus className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.menu?.newSong ?? 'Imagine a Song'}
        </button>
      </Tooltip>

      {/* ── Import group ──────────────────────────────────────────────── */}
      <div className="px-4 pt-1.5 pb-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)]/60">
        {(t as { menu?: { importGroup?: string } }).menu?.importGroup ?? 'Import'}
      </div>

      <Tooltip title={t.tooltips.import ?? 'Load a local file from your device'}>
        <button onClick={() => run(openImportLocal)} className={`${subActionClass}`}>
          <Upload className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          {(t as { menu?: { importLocal?: string } }).menu?.importLocal ?? 'From local file'}
        </button>
      </Tooltip>

      <Tooltip title={(t as { tooltips?: { importOneDrive?: string } }).tooltips?.importOneDrive ?? 'Import lyrics from OneDrive (Personal or Business)'}>
        <button onClick={() => run(openImportOneDrive)} className={`${subActionClass}`}>
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          {(t as { menu?: { importOneDrive?: string } }).menu?.importOneDrive ?? 'From OneDrive'}
        </button>
      </Tooltip>

      <Tooltip title={(t as { tooltips?: { importGDrive?: string } }).tooltips?.importGDrive ?? 'Import lyrics from Google Drive'}>
        <button onClick={() => run(openImportGDrive)} className={`${subActionClass}`}>
          <Cloud className="w-3.5 h-3.5 text-yellow-400" />
          {(t as { menu?: { importGDrive?: string } }).menu?.importGDrive ?? 'From Google Drive'}
        </button>
      </Tooltip>

      {/* ── Export / Save group ───────────────────────────────────────── */}
      <div className="px-4 pt-1.5 pb-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)]/60">
        {(t as { menu?: { exportGroup?: string } }).menu?.exportGroup ?? 'Export / Save'}
      </div>

      <Tooltip title={t.tooltips.export ?? 'Download to your device in various formats'}>
        <button onClick={() => run(openExportLocal)} disabled={!hasSong} className={`${subActionClass} ${!hasSong ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          {(t as { menu?: { exportLocal?: string } }).menu?.exportLocal ?? 'To local file'}
        </button>
      </Tooltip>

      <Tooltip title={(t as { tooltips?: { exportOneDrive?: string } }).tooltips?.exportOneDrive ?? 'Save to OneDrive (Personal or Business)'}>
        <button onClick={() => run(openExportOneDrive)} disabled={!hasSong} className={`${subActionClass} ${!hasSong ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          {(t as { menu?: { exportOneDrive?: string } }).menu?.exportOneDrive ?? 'To OneDrive'}
        </button>
      </Tooltip>

      <Tooltip title={(t as { tooltips?: { exportGDrive?: string } }).tooltips?.exportGDrive ?? 'Save to Google Drive'}>
        <button onClick={() => run(openExportGDrive)} disabled={!hasSong} className={`${subActionClass} ${!hasSong ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Cloud className="w-3.5 h-3.5 text-yellow-400" />
          {(t as { menu?: { exportGDrive?: string } }).menu?.exportGDrive ?? 'To Google Drive'}
        </button>
      </Tooltip>

      {/* ── Paste ─────────────────────────────────────────────────────── */}
      <Tooltip title={canPasteLyrics ? (t.tooltips.pasteAvailable ?? 'Paste lyrics from clipboard') : (t.tooltips.pasteUnavailable ?? 'No lyrics detected in clipboard')}>
        <button disabled={!canPasteLyrics} onClick={() => run(openPasteModal)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <ClipboardPaste className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.editor.emptyState.pasteLyrics}
        </button>
      </Tooltip>

      {/* ── Mode ──────────────────────────────────────────────────────── */}
      <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
      <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">{(t as { menu?: { mode?: string } }).menu?.mode ?? 'Mode'}</div>
      <Tooltip title={t.tooltips.lyricsTab ?? 'Open the lyrics editor'}>
        <button onClick={() => run(() => setActiveTab('lyrics'))} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <AlignLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.ribbon?.lyrics ?? 'Lyrics Editor'}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.musicalTab}>
        <button onClick={() => run(() => setActiveTab('musical'))} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <Music className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.ribbon.musical}
        </button>
      </Tooltip>
      <Tooltip title="Open the audio player">
        <button onClick={() => run(() => setActiveTab('player'))} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <Music className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.mobileNav?.player ?? 'PLAYER'}
        </button>
      </Tooltip>

      {/* ── Outils ─────────────────────────────────────────────────────── */}
      <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
      <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">{t.menu?.tools ?? 'Outils'}</div>
      <Tooltip title={t.tooltips.reset}>
        <button onClick={() => run(openResetModal)} disabled={!hasSong} className={`${menuActionClass} text-red-400 hover:bg-red-500/10 disabled:opacity-50`}>
          <Trash2 className="w-4 h-4" />
          {t.ribbon.reset}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.versions}>
        <button onClick={() => run(openVersionsModal)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <History className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.ribbon.versions}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.browseLibrary ?? 'Save or browse your song library'}>
        <button onClick={() => run(openLibrary)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <Library className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.saveToLibrary.title}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.keyboardShortcuts}>
        <button onClick={() => run(openKeyboardShortcuts)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <KeyboardRegular className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.keyboardShortcuts.title}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.openSettings ?? 'Open application settings'}>
        <button onClick={() => run(openSettings)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.statusBar.settings}
        </button>
      </Tooltip>

      {/* ── App ────────────────────────────────────────────────────────── */}
      <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
      <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">{t.menu?.app ?? 'App'}</div>
      <Tooltip title={t.tooltips.appInfo}>
        <button onClick={() => run(openAbout)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
          <Info className="w-4 h-4 text-[var(--text-secondary)]" />
          {t.menu?.about ?? 'About'}
        </button>
      </Tooltip>
      <Tooltip title={t.tooltips.sponsor ?? 'Support the developer'}>
        <button
          onClick={() => run(() => window.open('https://github.com/sponsors/EmmanuelKerhoz', '_blank', 'noopener,noreferrer'))}
          className={`${menuActionClass} text-pink-400 hover:bg-pink-500/10`}
        >
          <Heart className="w-4 h-4" />
          {t.menu?.sponsor ?? 'Sponsor'}
        </button>
      </Tooltip>
    </div>
  );
}
