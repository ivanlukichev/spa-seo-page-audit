export const SCORE_LIMITS = {
  content: 45,
  technical: 35,
  links: 20,
  total: 100
} as const;

export const TITLE_LENGTH = {
  goodMin: 30,
  goodMax: 65,
  warningMin: 20,
  warningMax: 75
} as const;

export const DESCRIPTION_LENGTH = {
  goodMin: 120,
  goodMax: 160,
  warningMin: 80,
  warningMax: 180
} as const;
