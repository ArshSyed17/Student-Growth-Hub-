export type AcquisitionSource = 'Referral' | 'Direct/Organic';
export type RecordOrigin = 'sample' | 'actual';
export type Channel =
  | 'WhatsApp'
  | 'Instagram'
  | 'LinkedIn'
  | 'Telegram'
  | 'College Club'
  | 'Other';
export type BudgetCategory = 'referralRewards' | 'promoMaterials' | 'contingency';
export type ExperimentId = 'messaging' | 'cta' | 'referral-prompt';
export type ExperimentStatus = 'Planned' | 'Running' | 'Completed';

export interface Registration {
  id: string;
  fullName: string;
  /** Email as entered (trimmed). */
  email: string;
  /** Normalised email used for duplicate detection. */
  normalizedEmail: string;
  college: string;
  source: AcquisitionSource;
  /** Code that was credited. Null for Direct/Organic registrations. */
  referralCode: string | null;
  /** ISO timestamp. */
  createdAt: string;
  /** "sample" = synthetic demo record, "actual" = entered in this browser. */
  origin: RecordOrigin;
  consent: true;
}

export interface Ambassador {
  id: string;
  name: string;
  /** Optional. Only used to detect self-referrals. */
  email: string | null;
  code: string;
  channel: Channel;
  createdAt: string;
  origin: RecordOrigin;
}

export interface ExperimentRecord {
  status: ExperimentStatus;
  notes: string;
  updatedAt: string | null;
}

export interface ExperimentVariant {
  label: 'A' | 'B';
  text: string;
}

export interface ExperimentDef {
  id: ExperimentId;
  title: string;
  hypothesis: string;
  variants: [ExperimentVariant, ExperimentVariant];
  metric: string;
}

export interface AppState {
  schemaVersion: 1;
  /** Local date (YYYY-MM-DD) of campaign day 1. */
  campaignStart: string;
  registrations: Registration[];
  ambassadors: Ambassador[];
  /** Actual recorded spend per category (INR). */
  spend: Record<BudgetCategory, number>;
  /** True while spend values are the synthetic demo values. */
  spendIsSample: boolean;
  experiments: Record<ExperimentId, ExperimentRecord>;
}
