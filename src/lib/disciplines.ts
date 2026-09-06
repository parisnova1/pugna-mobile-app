import type { TranslationKey } from '@/i18n/translations'
import type { IconName } from '@/components/icons/Icon'

// Matches the backend's enforced vocabulary exactly (server/src/constants.js)
// — extracted here instead of duplicated across events.tsx, clubs.tsx, and
// onboarding/interests.tsx (each previously had its own inline copy).
export const ALL_DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

// Product scope for now: boxing only. Every discipline picker/filter in the
// app builds its options from this list, not ALL_DISCIPLINES — flip back to
// ALL_DISCIPLINES here (a single line) once other disciplines come online,
// rather than re-adding chips screen by screen.
export const DISCIPLINES = ['Boxing']

export const DISCIPLINE_LABEL_KEY: Record<string, TranslationKey> = {
  Boxing: 'events.discipline.boxing',
  Kickboxing: 'events.discipline.kickboxing',
  'Muay Thai': 'events.discipline.muayThai',
  MMA: 'events.discipline.mma',
  BJJ: 'events.discipline.bjj',
  Wrestling: 'events.discipline.wrestling',
}

export const DISCIPLINE_ICON: Record<string, IconName> = {
  Boxing: 'glove',
  Kickboxing: 'kick',
  'Muay Thai': 'elbow',
  MMA: 'octagon',
  BJJ: 'belt',
  Wrestling: 'clinch',
}
