import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { useAuth, type Role } from '@/auth/AuthContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Button from '@/components/Button'
import CenteredColumn from '@/components/CenteredColumn'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import OrDivider from '@/components/OrDivider'
import { roleHomePath } from '@/lib/roleHome'
import { ACCENT, TEXT, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const ROLES: Role[] = ['viewer', 'club', 'organizer']

// Applies whatever was picked pre-account (Follow's local selections, the
// Permissions primer's notification intent) via the real APIs now that a
// session finally exists, then clears them — best-effort, a failure here
// shouldn't block landing on the new account's home screen.
async function applyPendingOnboardingState(
  pendingFollows: { fighterIds: number[]; clubIds: number[]; eventIds: number[] },
  wantsNotifications: boolean | null,
) {
  const follows = [
    ...pendingFollows.fighterIds.map(id => apiFetch(`/api/public/fighters/${id}/follow`, { method: 'POST' })),
    ...pendingFollows.clubIds.map(id => apiFetch(`/api/clubs/${id}/follow`, { method: 'POST' })),
    ...pendingFollows.eventIds.map(id => apiFetch(`/api/public/events/${id}/save`, { method: 'POST' })),
  ]
  await Promise.allSettled(follows)

  if (wantsNotifications !== null) {
    const categories = Object.fromEntries(
      ['event.live', 'bout.result', 'event.stream', 'nomination.accepted', 'nomination.injured'].map(k => [k, wantsNotifications]),
    )
    await apiFetch('/api/notifications/settings', { method: 'PATCH', body: JSON.stringify({ categories }) }).catch(() => {})
  }
}

export default function SignupScreen() {
  const { signup } = useAuth()
  const { t } = useLanguage()
  const {
    role: onboardingRole, disciplines, homeLocation: onboardingLocation, homeLat, homeLng,
    pendingFollows, wantsNotifications, setPendingFollows, finishOnboarding,
  } = useOnboarding()
  const params = useLocalSearchParams<{ role?: string; name?: string }>()
  // Persona (onboarding/role.tsx) is the source of truth now that it sets
  // role for all three personas — the route param stays as a fallback for
  // any stray direct link.
  const role: Role = ROLES.includes(onboardingRole as Role)
    ? (onboardingRole as Role)
    : ROLES.includes(params.role as Role) ? (params.role as Role) : 'viewer'

  const [name, setName] = useState(params.name ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [homeLocation, setHomeLocation] = useState(onboardingLocation)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError(t('login.errorEmail')); return }
    if (password.length < 6) { setError(t('login.errorPassword')); return }
    if (!name.trim()) { setError(t('login.errorName')); return }

    setLoading(true)
    try {
      const newUser = await signup(name, email, password, role, homeLocation)
      // clubs.location/clubs.disciplines aren't part of the signup endpoint
      // (only users.home_location is) — this is the one follow-up call that
      // applies whatever onboarding already collected to the real club
      // profile the signup endpoint auto-creates for role 'club'.
      if (newUser.role === 'club' && (disciplines.length > 0 || homeLat != null)) {
        await apiFetch('/api/clubs/me', {
          method: 'PATCH',
          body: JSON.stringify({ disciplines, location: homeLocation, lat: homeLat, lng: homeLng }),
        }).catch(() => {})
      }
      await applyPendingOnboardingState(pendingFollows, wantsNotifications)
      setPendingFollows({ fighterIds: [], clubIds: [], eventIds: [] })
      await finishOnboarding()
      router.replace(roleHomePath(newUser.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <CenteredColumn>
          <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12}>
            <Icon name="close" size={22} color={MUTED} />
          </Pressable>

          <Text style={styles.eyebrow}>{t('login.joinPugna')}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('login.createAccount')}</Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{t(`role.${role}`)}</Text>
            </View>
          </View>

          <GoogleSignInButton
            role={role}
            homeLocation={homeLocation}
            uppercase={false}
            onSuccess={newUser => {
              applyPendingOnboardingState(pendingFollows, wantsNotifications).finally(() => {
                setPendingFollows({ fighterIds: [], clubIds: [], eventIds: [] })
                finishOnboarding()
              })
              router.replace(roleHomePath(newUser.role))
            }}
            onError={setError}
          />
          <OrDivider />

          <View style={styles.field}>
            <Text style={styles.label}>{role === 'club' ? t('login.clubName') : t('login.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={role === 'club' ? t('login.clubNamePlaceholder') : t('login.namePlaceholder')}
              placeholderTextColor={MUTED}
              autoComplete="name"
            />
          </View>

          {!onboardingLocation && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('login.homeLocation')}</Text>
              <TextInput
                style={styles.input}
                value={homeLocation}
                onChangeText={setHomeLocation}
                placeholder={t('login.homeLocationPlaceholder')}
                placeholderTextColor={MUTED}
              />
            </View>
          )}

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
              autoComplete="new-password"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label={loading ? t('login.pleaseWait') : t('login.createAccount')}
            uppercase={false}
            onPress={submit}
            disabled={loading}
            style={styles.submit}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('login.hasAccount')}</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.switchLink}>{t('login.logInLink')}</Text>
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
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 16 },
  error: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12 },
  submit: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  switchText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  switchLink: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT, textDecorationLine: 'underline' },
})
