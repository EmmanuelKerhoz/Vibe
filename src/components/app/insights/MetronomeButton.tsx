import { Timer } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';

interface MetronomeButtonProps {
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
}

export function MetronomeButton({ isMetronomeActive, toggleMetronome }: MetronomeButtonProps) {
  const { t } = useTranslation();

  if (!toggleMetronome) {
    return null;
  }

  return (
    <Tooltip title={t.musical?.metronome ?? 'Metronome'}>
      <button
        onClick={toggleMetronome}
        className={`px-2 py-1 text-[11px] rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
          isMetronomeActive ? 'border-transparent metronome-active' : 'glass-button'
        }`}
        style={isMetronomeActive ? { background: '#f59e0b', color: '#000', borderColor: '#f59e0b' } : {}}
      >
        <Timer className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
