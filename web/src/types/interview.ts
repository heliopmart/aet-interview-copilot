export interface PortglishViolation {
  error_signature: string;
  original_snippet: string;
  native_fix: string;
  reason_pt: string;
}

export interface StarCritique {
  situation_clear: boolean;
  task_clear: boolean;
  action_clear: boolean;
  result_clear: boolean;
  star_recommendation: string;
}

export interface AuditResponse {
  score: number;
  portglish_violations: PortglishViolation[];
  professional_rewrite: string;
  star_critique: StarCritique;
}

export interface LexicalCue {
  category: string;
  verbs: string[];
  adjectives: string[];
  starter: string;
}

export interface ErrorLedgerItem {
  error_signature: string;
  canonical_name: string;
  user_mistake_snippet: string;
  native_correction: string;
  bias_explanation_pt: string;
  reoffense_count: number;
  weight: number;
  last_offense_at: string;
}