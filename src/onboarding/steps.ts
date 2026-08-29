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
  fan: ['welcome', 'role', 'viewer-goals', 'interests', 'location', 'follow', 'permissions'],
  coach: ['welcome', 'role', 'viewer-goals', 'interests', 'gym', 'location', 'follow', 'permissions'],
  athlete: ['welcome', 'role', 'viewer-goals', 'interests', 'experience', 'gym', 'location', 'follow', 'permissions'],
}

export function stepNumber(persona: FlowPersona, screen: string): number {
  const index = FLOW[persona].indexOf(screen)
  return index === -1 ? 1 : index + 1
}

export const TOTAL_STEPS: Record<FlowPersona | 'club', number> = {
  fan: FLOW.fan.length,
  coach: FLOW.coach.length,
  athlete: FLOW.athlete.length,
  club: 3, // welcome, role, club-info — then real signup, not counted here
}

// The current main flow (Persona → Location → Follow → Permissions → real
// signup) is uniform for all three personas — no per-persona branching, no
// extra screens — unlike the FLOW map above, which only the older
// viewer-goals/interests/experience/gym screens still use.
const MAIN_FLOW = ['role', 'location', 'follow', 'permissions'] as const
export const MAIN_FLOW_TOTAL = MAIN_FLOW.length

export function mainFlowStepNumber(screen: (typeof MAIN_FLOW)[number]): number {
  return MAIN_FLOW.indexOf(screen) + 1
}
