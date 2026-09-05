// Legacy per-persona screen order, kept only for viewer-goals/interests/
// experience/gym — screens the current main flow (see MAIN_FLOW below) no
// longer routes to, but which stay registered and directly reachable rather
// than deleted. fan is the plain 7-screen flow, coach and athlete each
// insert extra screens (gym, and for athlete also experience level) that a
// fan doesn't need, and club is a deliberately short 3-screen flow that ends
// in real signup rather than continuing through interests/location/follow.
// StepIndicator reads `current`/`total` from here so no screen hardcodes a
// step number that would silently go stale if this order changes.
export type FlowPersona = 'fan' | 'coach' | 'athlete'

const FLOW: Record<FlowPersona, string[]> = {
  fan: ['welcome', 'persona', 'viewer-goals', 'interests', 'location', 'follow', 'permissions'],
  coach: ['welcome', 'persona', 'viewer-goals', 'interests', 'gym', 'location', 'follow', 'permissions'],
  athlete: ['welcome', 'persona', 'viewer-goals', 'interests', 'experience', 'gym', 'location', 'follow', 'permissions'],
}

export function stepNumber(persona: FlowPersona, screen: string): number {
  const index = FLOW[persona].indexOf(screen)
  return index === -1 ? 1 : index + 1
}

export const TOTAL_STEPS: Record<FlowPersona | 'club', number> = {
  fan: FLOW.fan.length,
  coach: FLOW.coach.length,
  athlete: FLOW.athlete.length,
  club: 3, // welcome, persona, club-info — then real signup, not counted here
}

// The viewer/club main flow (Persona → Location → Permissions → real
// signup) — no per-persona branching between those two, unlike the FLOW
// map above, which only the older viewer-goals/interests/experience/gym
// screens still use. Follow isn't part of this count — it runs after
// signup succeeds (see (onboarding)/follow.tsx), not before it.
const MAIN_FLOW = ['persona', 'location', 'permissions'] as const
export const MAIN_FLOW_TOTAL = MAIN_FLOW.length

export function mainFlowStepNumber(screen: (typeof MAIN_FLOW)[number]): number {
  return MAIN_FLOW.indexOf(screen) + 1
}

// Organizer gets its own flow instead of the viewer-flavored Location/
// Follow steps — an organization name and what they run in place of a
// home city and a follow list, which don't mean much for someone there to
// host events rather than discover them.
const ORGANIZER_FLOW = ['persona', 'organizer-info', 'organizer-focus', 'permissions'] as const
export const ORGANIZER_FLOW_TOTAL = ORGANIZER_FLOW.length

export function organizerFlowStepNumber(screen: (typeof ORGANIZER_FLOW)[number]): number {
  return ORGANIZER_FLOW.indexOf(screen) + 1
}

// Fighter follows the same shape as the viewer/club main flow (still wants
// Location + Follow after signup) with one extra step inserted — picking a
// club, the "join or create path toward a club" the product brief asks for.
// v1 only supports joining an existing club; going independent is a later
// "coming soon" state, so this step isn't skippable the way most onboarding
// fields are.
const FIGHTER_FLOW = ['persona', 'club-join', 'location', 'permissions'] as const
export const FIGHTER_FLOW_TOTAL = FIGHTER_FLOW.length

export function fighterFlowStepNumber(screen: (typeof FIGHTER_FLOW)[number]): number {
  return FIGHTER_FLOW.indexOf(screen) + 1
}
