import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Role } from '@/auth/AuthContext'

const FLAG_KEY = 'pugna:hasOnboarded'
const ROLE_KEY = 'pugna:onboarding:role'
const LOCATION_KEY = 'pugna:onboarding:location'
const DISCIPLINES_KEY = 'pugna:onboarding:disciplines'
const PERSONA_KEY = 'pugna:onboarding:persona'
const VIEWER_GOALS_KEY = 'pugna:onboarding:viewerGoals'
const WANTS_NOTIFICATIONS_KEY = 'pugna:onboarding:wantsNotifications'
const ORG_NAME_KEY = 'pugna:onboarding:orgName'
const FIGHTER_CLUB_KEY = 'pugna:onboarding:fighterClub'
const FIGHTER_WEIGHT_KEY = 'pugna:onboarding:fighterWeight'

// Which onboarding persona card the user tapped. 'athlete'/'coach'/'fan'
// remain from the original 4-tile viewer breakdown, kept alive for the
// older viewer-goals/interests/experience/gym screens (no longer part of
// the main flow, but still directly reachable — not deleted). 'organizer'
// is new: the current 3-card Persona screen ((onboarding)/persona.tsx) only
// ever sets 'fan' (Zuschauer), 'organizer' (Veranstalter), or 'club'
// (Verein). Distinct from `role` (the real backend enum) because the
// backend has no concept of athlete/coach — both map to role 'viewer'.
export type Persona = 'athlete' | 'coach' | 'club' | 'fan' | 'organizer'

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
  // null = no choice made yet on the Permissions primer; true/false once the
  // user has pressed either "Fight-Alerts aktivieren" or "Jetzt nicht".
  wantsNotifications: boolean | null
  // Set on the organizer-only (onboarding)/organizer-info.tsx step —
  // prefills the name field on (auth)/signup.tsx for role 'organizer',
  // mirroring how club's name is collected today.
  orgName: string
  // Set on the fighter-only (onboarding)/club-join.tsx step — applied via
  // POST /api/fighters right after signup succeeds, same "collect during
  // onboarding, apply once a session exists" pattern as orgName/disciplines.
  fighterClubId: number | null
  fighterClubName: string
  fighterWeight: string
  setRole: (role: Role | null) => void
  setPersona: (persona: Persona | null) => void
  setHomeLocation: (location: string, coords?: { lat: number; lng: number } | null) => void
  setDisciplines: (disciplines: string[]) => void
  setViewerGoals: (goals: string[]) => void
  setWantsNotifications: (next: boolean) => void
  setOrgName: (next: string) => void
  setFighterClub: (id: number | null, name: string) => void
  setFighterWeight: (next: string) => void
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
  const [wantsNotifications, setWantsNotificationsState] = useState<boolean | null>(null)
  const [orgName, setOrgNameState] = useState('')
  const [fighterClubId, setFighterClubId] = useState<number | null>(null)
  const [fighterClubName, setFighterClubName] = useState('')
  const [fighterWeight, setFighterWeightState] = useState('')

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FLAG_KEY),
      AsyncStorage.getItem(ROLE_KEY),
      AsyncStorage.getItem(PERSONA_KEY),
      AsyncStorage.getItem(LOCATION_KEY),
      AsyncStorage.getItem(DISCIPLINES_KEY),
      AsyncStorage.getItem(VIEWER_GOALS_KEY),
      AsyncStorage.getItem(WANTS_NOTIFICATIONS_KEY),
      AsyncStorage.getItem(ORG_NAME_KEY),
      AsyncStorage.getItem(FIGHTER_CLUB_KEY),
      AsyncStorage.getItem(FIGHTER_WEIGHT_KEY),
    ]).then(([flag, storedRole, storedPersona, storedLocation, storedDisciplines, storedGoals, storedWantsNotif, storedOrgName, storedFighterClub, storedFighterWeight]) => {
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
      if (storedWantsNotif) setWantsNotificationsState(storedWantsNotif === 'true')
      if (storedOrgName) setOrgNameState(storedOrgName)
      if (storedFighterClub) {
        try {
          const parsed = JSON.parse(storedFighterClub)
          setFighterClubId(parsed.id ?? null)
          setFighterClubName(parsed.name ?? '')
        } catch {}
      }
      if (storedFighterWeight) setFighterWeightState(storedFighterWeight)
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

  const setWantsNotifications = (next: boolean) => {
    setWantsNotificationsState(next)
    AsyncStorage.setItem(WANTS_NOTIFICATIONS_KEY, String(next))
  }

  const setOrgName = (next: string) => {
    setOrgNameState(next)
    AsyncStorage.setItem(ORG_NAME_KEY, next)
  }

  const setFighterClub = (id: number | null, name: string) => {
    setFighterClubId(id)
    setFighterClubName(name)
    AsyncStorage.setItem(FIGHTER_CLUB_KEY, JSON.stringify({ id, name }))
  }

  const setFighterWeight = (next: string) => {
    setFighterWeightState(next)
    AsyncStorage.setItem(FIGHTER_WEIGHT_KEY, next)
  }

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(FLAG_KEY, 'true')
    setHasOnboarded(true)
  }

  return (
    <OnboardingContext.Provider
      value={{
        ready, hasOnboarded, role, persona, homeLocation, homeLat, homeLng, disciplines, viewerGoals,
        wantsNotifications, orgName, fighterClubId, fighterClubName, fighterWeight,
        setRole, setPersona, setHomeLocation, setDisciplines, setViewerGoals,
        setWantsNotifications, setOrgName, setFighterClub, setFighterWeight, finishOnboarding,
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
