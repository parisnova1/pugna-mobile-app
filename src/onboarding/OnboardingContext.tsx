import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Role } from '@/auth/AuthContext'

const FLAG_KEY = 'pugna:hasOnboarded'
const ROLE_KEY = 'pugna:onboarding:role'
const LOCATION_KEY = 'pugna:onboarding:location'
const DISCIPLINES_KEY = 'pugna:onboarding:disciplines'
const PERSONA_KEY = 'pugna:onboarding:persona'
const VIEWER_GOALS_KEY = 'pugna:onboarding:viewerGoals'

// Which of the 4 onboarding tiles the user tapped. Distinct from `role`
// (the real backend enum, 'organizer'|'club'|'viewer') because the backend
// has no concept of athlete/coach — both map to role 'viewer' (see
// (onboarding)/role.tsx) and this field exists purely to drive onboarding
// copy, default chip selections, and the personalized-entry screen.
export type Persona = 'athlete' | 'coach' | 'club' | 'fan'

type OnboardingContextValue = {
  // false until the AsyncStorage read resolves — callers must wait for this
  // before redirecting, otherwise every fresh mount would briefly read
  // hasOnboarded as false and bounce straight into onboarding.
  ready: boolean
  hasOnboarded: boolean
  role: Role | null
  persona: Persona | null
  homeLocation: string
  homeLat: number | null
  homeLng: number | null
  disciplines: string[]
  viewerGoals: string[]
  setRole: (role: Role | null) => void
  setPersona: (persona: Persona | null) => void
  setHomeLocation: (location: string, coords?: { lat: number; lng: number } | null) => void
  setDisciplines: (disciplines: string[]) => void
  setViewerGoals: (goals: string[]) => void
  // Marks onboarding done, whether the user finished every screen or hit
  // "Überspringen" partway through — both land the user in (tabs) as a
  // guest and never show onboarding again on this device.
  finishOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [role, setRoleState] = useState<Role | null>(null)
  const [persona, setPersonaState] = useState<Persona | null>(null)
  const [homeLocation, setHomeLocationState] = useState('')
  const [homeLat, setHomeLat] = useState<number | null>(null)
  const [homeLng, setHomeLng] = useState<number | null>(null)
  const [disciplines, setDisciplinesState] = useState<string[]>([])
  const [viewerGoals, setViewerGoalsState] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FLAG_KEY),
      AsyncStorage.getItem(ROLE_KEY),
      AsyncStorage.getItem(PERSONA_KEY),
      AsyncStorage.getItem(LOCATION_KEY),
      AsyncStorage.getItem(DISCIPLINES_KEY),
      AsyncStorage.getItem(VIEWER_GOALS_KEY),
    ]).then(([flag, storedRole, storedPersona, storedLocation, storedDisciplines, storedGoals]) => {
      setHasOnboarded(flag === 'true')
      if (storedRole) setRoleState(storedRole as Role)
      if (storedPersona) setPersonaState(storedPersona as Persona)
      if (storedLocation) {
        try {
          const parsed = JSON.parse(storedLocation)
          setHomeLocationState(parsed.label ?? '')
          setHomeLat(parsed.lat ?? null)
          setHomeLng(parsed.lng ?? null)
        } catch {
          // Pre-existing installs stored this as a plain string, not JSON —
          // still a valid city label, just without coordinates.
          setHomeLocationState(storedLocation)
        }
      }
      if (storedDisciplines) {
        try { setDisciplinesState(JSON.parse(storedDisciplines)) } catch {}
      }
      if (storedGoals) {
        try { setViewerGoalsState(JSON.parse(storedGoals)) } catch {}
      }
      setReady(true)
    })
  }, [])

  const setRole = (next: Role | null) => {
    setRoleState(next)
    AsyncStorage.setItem(ROLE_KEY, next ?? '')
  }

  const setPersona = (next: Persona | null) => {
    setPersonaState(next)
    AsyncStorage.setItem(PERSONA_KEY, next ?? '')
  }

  const setHomeLocation = (next: string, coords?: { lat: number; lng: number } | null) => {
    setHomeLocationState(next)
    setHomeLat(coords?.lat ?? null)
    setHomeLng(coords?.lng ?? null)
    AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ label: next, lat: coords?.lat ?? null, lng: coords?.lng ?? null }))
  }

  const setDisciplines = (next: string[]) => {
    setDisciplinesState(next)
    AsyncStorage.setItem(DISCIPLINES_KEY, JSON.stringify(next))
  }

  const setViewerGoals = (next: string[]) => {
    setViewerGoalsState(next)
    AsyncStorage.setItem(VIEWER_GOALS_KEY, JSON.stringify(next))
  }

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(FLAG_KEY, 'true')
    setHasOnboarded(true)
  }

  return (
    <OnboardingContext.Provider
      value={{
        ready, hasOnboarded, role, persona, homeLocation, homeLat, homeLng, disciplines, viewerGoals,
        setRole, setPersona, setHomeLocation, setDisciplines, setViewerGoals, finishOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
