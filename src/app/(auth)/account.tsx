import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { useAuth, type Role, type User } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Button from '@/components/Button'
import CenteredColumn from '@/components/CenteredColumn'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import OrDivider from '@/components/OrDivider'
import { roleHomePath } from '@/lib/roleHome'
import { ACCENT, TEXT, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY_BOLD, FONT_BODY, FONT_BODY_MEDIUM } from '@/theme'

const ROLES: Role[] = ['viewer', 'club', 'organizer', 'fighter']
type Mode = 'register' | 'login'

function isSafeNext(next?: string): next is string {
  return !!next && next.startsWith('/') && !next.startsWith('//') && !/^\/https?:/i.test(next)
}

// One screen, two modes — create vs. log in is the same route (`/account`),
// toggled at the bottom, matching the locked spec's "create vs login is the
// same route" rule. Role only matters for register (a returning user's role
// is whatever their account already has).
export default function AccountScreen() {
  const { signup, login } = useAuth()
  const { t } = useLanguage()
  const params = useLocalSearchParams<{ mode?: string; role?: string; next?: string; followEventId?: string }>()

  const [mode, setMode] = useState<Mode>(params.mode === 'login' ? 'login' : 'register')
  const role: Role = ROLES.includes(params.role as Role) ? (params.role as Role) : 'viewer'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const showGuestButton = mode === 'register' && role === 'viewer'

  // Exact order from the locked spec: safe `next` wins immediately for a
  // viewer (or any public-card next); a brand-new fighter/club/organizer
  // account goes to the skippable Fields step next; everyone else lands on
  // their role home. An existing account (login) never gets routed through
  // Fields — "never block login if fields already exist."
  const afterAuth = async (user: User, isNewAccount: boolean) => {
    const next = params.next
    if (params.followEventId) {
      await apiFetch(`/api/public/events/${params.followEventId}/save`, { method: 'POST' }).catch(() => {})
    }
    if (isSafeNext(next) && (user.role === 'viewer' || /^\/(events|e)\//.test(next))) {
      router.replace(next as never)
      return
    }
    if (isNewAccount && user.role !== 'viewer') {
      router.replace('/fields')
      return
    }
    router.replace(roleHomePath(user.role))
  }

  const submitRegister = async () => {
    setError(null)
    setHint(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError(t('login.errorEmail')); return }
    if (password.length < 8) { setError(t('login.errorPassword')); return }
    if (password !== passwordRepeat) { setError(t('login.errorPasswordMismatch')); return }

    setLoading(true)
    try {
      const user = await signup(email, password, role)
      await afterAuth(user, true)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('login.errorGeneric')
      // Duplicate email → this is almost certainly a returning user who
      // meant to log in, not a dead end — switch modes and prefill instead
      // of just showing a red error.
      if (/already exists/i.test(message)) {
        setMode('login')
        setPasswordRepeat('')
        setHint(t('login.duplicateEmailHint'))
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const submitLogin = async () => {
    setError(null)
    setHint(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError(t('login.errorEmail')); return }
    if (!password) { setError(t('login.errorPassword')); return }

    setLoading(true)
    try {
      const user = await login(email, password)
      await afterAuth(user, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const continueAsGuest = () => router.replace(isSafeNext(params.next) ? (params.next as never) : '/events')

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <CenteredColumn>
          <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12}>
            <Icon name="close" size={22} color={MUTED} />
          </Pressable>

          <Text style={styles.eyebrow}>{mode === 'register' ? t('login.welcome') : t('login.welcomeBack')}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{mode === 'register' ? t('login.createAccount') : t('login.logIn')}</Text>
            {/* Every account has exactly one fixed role (set at registration,
                never chosen at login) — this chip doesn't let you pick a
                role, it just surfaces which one a link already pointed you
                at (e.g. sparring.tsx sends club members here with
                role=club) so it's clear which persona's account you're
                about to create or sign into. A generic entry point (Welcome's
                "Anmelden", You tab's "Log In") carries no role param, so no
                chip shows — nothing false to claim there. */}
            {role !== 'viewer' && (
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{t(`role.${role}`)}</Text>
              </View>
            )}
          </View>

          {hint && <Text style={styles.hint}>{hint}</Text>}

          <GoogleSignInButton
            role={mode === 'register' ? role : undefined}
            uppercase={false}
            onSuccess={user => afterAuth(user, mode === 'register')}
            onError={setError}
          />
          <OrDivider />

          <View style={styles.field}>
            <Text style={styles.label}>{t('login.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('login.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={MUTED}
              secureTextEntry
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </View>

          {mode === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('login.passwordRepeat')}</Text>
              <TextInput
                style={styles.input}
                value={passwordRepeat}
                onChangeText={setPasswordRepeat}
                placeholder="••••••••"
                placeholderTextColor={MUTED}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label={loading ? t('login.pleaseWait') : mode === 'register' ? t('login.createAccount') : t('login.logIn')}
            uppercase={false}
            onPress={mode === 'register' ? submitRegister : submitLogin}
            disabled={loading}
            style={styles.submit}
          />

          {mode === 'register' && (
            <Text style={styles.legal}>
              {t('login.legalPrefix')}{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/nutzung' as never)}>Nutzungsbedingungen</Text>
              {' '}{t('login.legalAnd')}{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/datenschutz' as never)}>Datenschutz</Text>.
            </Text>
          )}

          {showGuestButton && (
            <Pressable onPress={continueAsGuest} style={styles.guestLink} hitSlop={8}>
              <Text style={styles.guestLinkText}>{t('login.continueAsGuest')}</Text>
            </Pressable>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{mode === 'register' ? t('login.hasAccount') : t('login.noAccount')}</Text>
            <Pressable onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); setHint(null) }}>
              <Text style={styles.switchLink}>{mode === 'register' ? t('login.logInLink') : t('login.signUp')}</Text>
            </Pressable>
          </View>
        </CenteredColumn>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 60, justifyContent: 'center' },
  close: { position: 'absolute', top: -32, right: 0, padding: 6, zIndex: 1 },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 3, color: ACCENT, textTransform: 'uppercase', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 28, color: TEXT },
  roleChip: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 4, paddingHorizontal: 12 },
  roleChipText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: MUTED },
  hint: { fontFamily: FONT_BODY_MEDIUM, fontSize: 13, color: ACCENT, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 16 },
  error: { fontFamily: FONT_BODY_MEDIUM, fontSize: 13, color: TEXT, marginBottom: 12 },
  submit: { marginTop: 8 },
  legal: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 14, lineHeight: 17 },
  legalLink: { color: TEXT, textDecorationLine: 'underline' },
  guestLink: { alignSelf: 'center', padding: 8, marginTop: 16 },
  guestLinkText: { fontFamily: FONT_BODY_MEDIUM, fontSize: 14, color: TEXT },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  switchText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  switchLink: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT, textDecorationLine: 'underline' },
})
