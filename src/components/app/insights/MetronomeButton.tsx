import { Timer } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';

interface MetronomeButtonProps {
  isActive?: boolean;
  onToggle?: () => void;
}

export function MetronomeButton({ isActive, onToggle }: MetronomeButtonProps) {
  const { t } = useTranslation();

  if (!onToggle) {
    return null;
  }

  return (
    <Tooltip title={t.musical?.metronome ?? 'Metronome'}>
      <button
        onClick={onToggle}
        className={`px-2 py-1 text-[11px] rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
          isActive ? 'border-transparent metronome-active' : 'glass-button'
        }`}
        style={isActive ? { background: '#f59e0b', color: '#000', borderColor: '#f59e0b' } : {}}
      >
        <Timer className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
