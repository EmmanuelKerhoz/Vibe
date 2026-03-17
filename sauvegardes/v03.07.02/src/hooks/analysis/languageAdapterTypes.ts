// ---------------------------------------------------------------------------
// Language Adapter – shared types
// ---------------------------------------------------------------------------

export type AdaptationStepId =
  | 'idle'
  | 'adapting'
  | 'reversing'
  | 'reviewing'
  | 'done'
  | 'failed';

export interface AdaptationStep {
  id: AdaptationStepId;
  label: string;
  /** 0–100, undefined while not yet started */
  progress?: number;
}

export interface AdaptationProgress {
  active: AdaptationStepId;
  steps: AdaptationStep[];
  /** Context label, e.g. "French → Baoulé" */
  label: string;
}

export interface AdaptationResult {
  /** Conceptual fidelity score 0–100 returned by the LLM reviewer */
  score: number;
  /** Human-readable warnings produced by the reviewer */
  warnings: string[];
  /** Whether the adapted lyrics were accepted (score >= 50) */
  accepted: boolean;
  /** Target language of this result */
  targetLanguage: string;
}

export const PIPELINE_STEPS: AdaptationStep[] = [
  { id: 'adapting',  label: 'Adapting lyrics'     },
  { id: 'reversing', label: 'Reverse translating' },
  { id: 'reviewing', label: 'Reviewing fidelity'  },
  { id: 'done',      label: 'Done'                },
];

export const IDLE_PROGRESS: AdaptationProgress = {
  active: 'idle',
  steps: PIPELINE_STEPS,
  label: '',
};
