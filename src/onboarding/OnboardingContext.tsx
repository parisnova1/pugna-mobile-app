import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FLAG_KEY = 'pugna:hasOnboarded'
const LOCATION_KEY = 'pugna:onboarding:location'
const DISCIPLINES_KEY = 'pugna:onboarding:disciplines'
const PERSONA_KEY = 'pugna:onboarding:persona'

// Which onboarding persona card the user tapped. persona.tsx sets one of
// 'fan' (Zuschauen), 'athlete' (Kämpfer:in), 'club' (Verein), or 'organizer'
// (Veranstalter) — only used to restore the last-picked card if they come
// back to that screen. 'coach' is a leftover value with no card that sets
// it anymore.
export type Persona = 'athlete' | 'coach' | 'club' | 'fan' | 'organizer'

type OnboardingContextValue = {
  // false until the AsyncStorage read resolves — callers must wait for this
  // before redirecting, otherwise every fresh mount would briefly read
  // hasOnboarded as false and bounce straight into onboarding.
  ready: boolean
  hasOnboarded: boolean
  persona: Persona | null
  // Read-only remnants of an older, longer onboarding flow that used to
  // collect these before an account existed — nothing writes them anymore
  // now that registration is just email + password (see (auth)/account.tsx
  // and the post-signup (onboarding)/fields.tsx, which PATCH the live
  // session directly instead). Kept only so the handful of screens that
  // pre-filter by them degrade to "no preference" rather than crashing.
  homeLocation: string
  disciplines: string[]
  setPersona: (persona: Persona | null) => void
  // Marks onboarding done, whether the user finished every screen or hit
  // "Überspringen" partway through — both land the user in (tabs) as a
  // guest and never show onboarding again on this device.
  finishOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [persona, setPersonaState] = useState<Persona | null>(null)
  const [homeLocation, setHomeLocationState] = useState('')
  const [disciplines, setDisciplinesState] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FLAG_KEY),
      AsyncStorage.getItem(PERSONA_KEY),
      AsyncStorage.getItem(LOCATION_KEY),
      AsyncStorage.getItem(DISCIPLINES_KEY),
    ]).then(([flag, storedPersona, storedLocation, storedDisciplines]) => {
      setHasOnboarded(flag === 'true')
      if (storedPersona) setPersonaState(storedPersona as Persona)
      if (storedLocation) {
        try {
          setHomeLocationState(JSON.parse(storedLocation).label ?? '')
        } catch {
          // Pre-existing installs stored this as a plain string, not JSON —
          // still a valid city label.
          setHomeLocationState(storedLocation)
        }
      }
      if (storedDisciplines) {
        try { setDisciplinesState(JSON.parse(storedDisciplines)) } catch {}
      }
      setReady(true)
    })
  }, [])

  const setPersona = (next: Persona | null) => {
    setPersonaState(next)
    AsyncStorage.setItem(PERSONA_KEY, next ?? '')
  }

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(FLAG_KEY, 'true')
    setHasOnboarded(true)
  }

  return (
    <OnboardingContext.Provider value={{ ready, hasOnboarded, persona, homeLocation, disciplines, setPersona, finishOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
