import type { TranslationKey } from '@/i18n/translations'
import type { IconName } from '@/components/icons/Icon'

// Matches the backend's enforced vocabulary exactly (server/src/constants.js)
// — extracted here instead of duplicated across events.tsx, clubs.tsx, and
// onboarding/interests.tsx (each previously had its own inline copy).
//
// TODO: confirm with product whether Judo/Karate/"Andere" should be added —
// an earlier onboarding redesign brief asked for them, but they aren't in
// the backend's DISCIPLINES enum. Keeping this list backend-only means every
// chip built from it can actually match a real event/fighter/club
// server-side, rather than a chip that can never match anything.
export const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

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
