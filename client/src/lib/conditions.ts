import type { Condition, Gender } from './types';

/** Triage order, most urgent first. Colours are the `--color-*` tokens in globals.css. */
export const CONDITIONS: { value: Condition; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'var(--color-critical)' },
  { value: 'under_observation', label: 'Under observation', color: 'var(--color-observation)' },
  { value: 'recovering', label: 'Recovering', color: 'var(--color-recovering)' },
  { value: 'stable', label: 'Stable', color: 'var(--color-stable)' },
  { value: 'discharged', label: 'Discharged', color: 'var(--color-discharged)' },
];

export const conditionMeta = (c: Condition) => CONDITIONS.find((x) => x.value === c) ?? CONDITIONS[3];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];
