import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Role } from '@/auth/AuthContext'

const FLAG_KEY = 'pugna:hasOnboarded'
const ROLE_KEY = 'pugna:onboarding:role'
const LOCATION_KEY = 'pugna:onboarding:location'
const DISCIPLINES_KEY = 'pugna:onboarding:disciplines'

type OnboardingContextValue = {
  // false until the AsyncStorage read resolves — callers must wait for this
  // before redirecting, otherwise every fresh mount would briefly read
  // hasOnboarded as false and bounce straight into onboarding.
  ready: boolean
  hasOnboarded: boolean
  role: Role | null
  homeLocation: string
  disciplines: string[]
  setRole: (role: Role | null) => void
  setHomeLocation: (location: string) => void
  setDisciplines: (disciplines: string[]) => void
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
  const [homeLocation, setHomeLocationState] = useState('')
  const [disciplines, setDisciplinesState] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FLAG_KEY),
      AsyncStorage.getItem(ROLE_KEY),
      AsyncStorage.getItem(LOCATION_KEY),
      AsyncStorage.getItem(DISCIPLINES_KEY),
    ]).then(([flag, storedRole, storedLocation, storedDisciplines]) => {
      setHasOnboarded(flag === 'true')
      if (storedRole) setRoleState(storedRole as Role)
      if (storedLocation) setHomeLocationState(storedLocation)
      if (storedDisciplines) {
        try { setDisciplinesState(JSON.parse(storedDisciplines)) } catch {}
      }
      setReady(true)
    })
  }, [])

  const setRole = (next: Role | null) => {
    setRoleState(next)
    AsyncStorage.setItem(ROLE_KEY, next ?? '')
  }

  const setHomeLocation = (next: string) => {
    setHomeLocationState(next)
    AsyncStorage.setItem(LOCATION_KEY, next)
  }

  const setDisciplines = (next: string[]) => {
    setDisciplinesState(next)
    AsyncStorage.setItem(DISCIPLINES_KEY, JSON.stringify(next))
  }

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(FLAG_KEY, 'true')
    setHasOnboarded(true)
  }

  return (
    <OnboardingContext.Provider
      value={{ ready, hasOnboarded, role, homeLocation, disciplines, setRole, setHomeLocation, setDisciplines, finishOnboarding }}
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
