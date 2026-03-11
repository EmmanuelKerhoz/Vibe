import React, { useState } from 'react';
import { History, Layout, Plus, Sparkles, Undo2, X } from 'lucide-react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input as FluentInput,
  Label as FluentLabel,
} from '@fluentui/react-components';
import { Button } from '../ui/Button';
import type { SongVersion } from '../../types';

type VersionsModalProps = {
  isOpen: boolean;
  versions: SongVersion[];
  onClose: () => void;
  onSaveCurrent: (name: string) => void;
  onRollback: (version: SongVersion) => void;
};

export const VersionsModal = ({ isOpen, versions, onClose, onSaveCurrent, onRollback }: VersionsModalProps) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');

  const handleOpenSaveDialog = () => {
    setVersionName(`Version ${versions.length + 1}`);
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    const name = versionName.trim() || `Version ${versions.length + 1}`;
    onSaveCurrent(name);
    setIsSaveDialogOpen(false);
    setVersionName('');
  };

  const handleCancelSave = () => {
    setIsSaveDialogOpen(false);
    setVersionName('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="acrylic w-full max-w-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 lcars-panel">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
              <History className="w-5 h-5 text-[var(--accent-color)]" />
              Song Versions
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-400">Track your progress and rollback to any previous version of your song.</p>
              <Button
                onClick={handleOpenSaveDialog}
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Save Current
              </Button>
            </div>

            {versions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                  <History className="w-6 h-6 text-zinc-800" />
                </div>
                <p className="text-sm text-zinc-500">No versions saved yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.id} className="group p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[var(--accent-color)]/30 rounded-xl transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-medium text-zinc-200">{version.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(version.timestamp).toLocaleString()}</span>
                      </div>
                      <Button
                        onClick={() => onRollback(version)}
                        variant="text"
                        color="primary"
                        size="small"
                        startIcon={<Undo2 className="w-3.5 h-3.5" />}
                        sx={{ fontSize: '10px' }}
                      >
                        Rollback
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Layout className="w-3 h-3" />
                        {version.song.length} Sections
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {version.topic || 'No topic'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <Button onClick={onClose} variant="contained" color="inherit">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Fluent UI Dialog — replaces prompt() */}
      <Dialog open={isSaveDialogOpen} onOpenChange={(_, data) => { if (!data.open) handleCancelSave(); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save Version</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <FluentLabel htmlFor="version-name-input">Version name</FluentLabel>
                <FluentInput
                  id="version-name-input"
                  value={versionName}
                  onChange={(_, d) => setVersionName(d.value)}
                  placeholder={`Version ${versions.length + 1}`}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSave(); if (e.key === 'Escape') handleCancelSave(); }}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelSave} variant="outlined" color="inherit" size="small">Cancel</Button>
              <Button onClick={handleConfirmSave} variant="contained" color="primary" size="small">Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
