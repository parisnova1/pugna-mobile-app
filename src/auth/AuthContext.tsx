import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, getToken, setToken } from '../lib/api'

export type Role = 'organizer' | 'club' | 'viewer' | 'fighter'
export type User = { id: number; name: string; email: string; role: Role; home_location: string }

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (email: string, password: string, role?: Role, homeLocation?: string) => Promise<User>
  loginWithGoogle: (idToken: string, role?: Role, homeLocation?: string) => Promise<User>
  updateProfile: (fields: { name?: string; homeLocation?: string }) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    getToken().then(token => {
      if (!token) {
        if (!cancelled) setReady(true)
        return
      }
      apiFetch<{ user: User }>('/api/auth/me')
        .then(({ user }) => { if (!cancelled) setUser(user) })
        .catch(() => setToken(null))
        .finally(() => { if (!cancelled) setReady(true) })
    })
    return () => { cancelled = true }
  }, [])

  const login: AuthContextValue['login'] = async (email, password) => {
    const { token, user } = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await setToken(token)
    setUser(user)
    return user
  }

  // Registration collects only email + password + role — no name field.
  // The backend derives a display name from the email's local part; a real
  // name (and, for role 'club', the club's own name) is collected on the
  // post-signup Fields step instead, which is skippable.
  const signup: AuthContextValue['signup'] = async (email, password, role, homeLocation) => {
    const { token, user } = await apiFetch<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, homeLocation }),
    })
    await setToken(token)
    setUser(user)
    return user
  }

  // role/homeLocation only matter the first time this Google identity signs
  // in (account creation) — the backend ignores them for an existing user.
  const loginWithGoogle: AuthContextValue['loginWithGoogle'] = async (idToken, role, homeLocation) => {
    const { token, user } = await apiFetch<{ token: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role, homeLocation }),
    })
    await setToken(token)
    setUser(user)
    return user
  }

  const updateProfile: AuthContextValue['updateProfile'] = async fields => {
    const { user: updated } = await apiFetch<{ user: User }>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    })
    setUser(updated)
    return updated
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, login, signup, loginWithGoogle, updateProfile, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
