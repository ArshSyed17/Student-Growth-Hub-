import type { BudgetCategory, Channel, ExperimentDef } from '../types';

export const STORAGE_KEY = 'student-growth-hub:v1';
export const REF_SESSION_KEY = 'student-growth-hub:ref';

export const CAMPAIGN = {
  workshopTitle: 'Build Your First AI Project in 60 Minutes',
  target: 500,
  days: 7,
  budget: 2000,
} as const;

export const BUDGET_PLAN: {
  key: BudgetCategory;
  label: string;
  planned: number;
  note: string;
}[] = [
  {
    key: 'referralRewards',
    label: 'Referral rewards',
    planned: 1200,
    note: 'Small rewards for ambassadors whose referrals register.',
  },
  {
    key: 'promoMaterials',
    label: 'Digital promotional materials',
    planned: 300,
    note: 'Posters, short videos and share cards.',
  },
  {
    key: 'contingency',
    label: 'Contingency',
    planned: 500,
    note: 'Held back for unplanned costs or boosting the best channel.',
  },
];

export const CHANNELS: Channel[] = [
  'WhatsApp',
  'Instagram',
  'LinkedIn',
  'Telegram',
  'College Club',
  'Other',
];

export const EXPERIMENTS: ExperimentDef[] = [
  {
    id: 'messaging',
    title: 'Experiment 1: Messaging',
    hypothesis:
      'An outcome-focused message will generate more registrations than a generic AI workshop announcement.',
    variants: [
      {
        label: 'A',
        text: 'Build Your First AI Project in 60 Minutes — Free Student Workshop.',
      },
      { label: 'B', text: 'Join Our Free AI Workshop.' },
    ],
    metric: 'Valid registrations per 100 delivered messages',
  },
  {
    id: 'cta',
    title: 'Experiment 2: Call to action',
    hypothesis: 'A clear call to action improves form completion.',
    variants: [
      { label: 'A', text: 'Register Free.' },
      { label: 'B', text: 'Save Your Seat.' },
    ],
    metric: 'Registration completion rate',
  },
  {
    id: 'referral-prompt',
    title: 'Experiment 3: Referral prompt',
    hypothesis:
      'Asking students to invite one interested classmate increases incremental registrations.',
    variants: [
      { label: 'A', text: 'Standard confirmation message.' },
      {
        label: 'B',
        text: 'Confirmation message containing a referral link and an invitation to share it.',
      },
    ],
    metric: 'Verified incremental referrals per registrant',
  },
];
