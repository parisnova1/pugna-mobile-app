import type { Role } from '@/auth/AuthContext'

// Organizer/club accounts land in their own dashboard, never the viewer
// tabs — mirrors the web app's strict RequireRole split (no crossover nav).
// These are real, unique path segments (not route groups) — see the long
// comment in src/app/_layout.tsx for why that distinction matters.
export function roleHomePath(role: Role): '/organizer' | '/club-admin' | '/' {
  if (role === 'organizer') return '/organizer'
  if (role === 'club') return '/club-admin'
  return '/'
}
