// Onboarding is a flat 3-step flow: Welcome (no indicator shown, cold start
// only) → Role → Fields. Account isn't counted — it's real signup, not an
// onboarding step, same as it never showed a step indicator before this file
// existed. Viewer skips Fields entirely (persona.tsx routes straight to
// signup for that persona), but the Role screen still shows "2/3" per the
// locked design, since Welcome is implicitly step 1.
export const ONBOARDING_TOTAL = 3
export const ONBOARDING_ROLE_STEP = 2
export const ONBOARDING_FIELDS_STEP = 3
