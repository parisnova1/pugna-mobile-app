import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { useAuth, type Role } from '@/auth/AuthContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import Button from '@/components/Button'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import OrDivider from '@/components/OrDivider'
import { roleHomePath } from '@/lib/roleHome'
import { ACCENT, ON_ACCENT, TEXT, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

const ROLES: Role[] = ['viewer', 'club', 'organizer']

export default function SignupScreen() {
  const { signup } = useAuth()
  const { t } = useLanguage()
  const { disciplines, homeLocation: onboardingLocation, homeLat, homeLng } = useOnboarding()
  const params = useLocalSearchParams<{ role?: string; name?: string }>()
  const initialRole: Role = ROLES.includes(params.role as Role) ? (params.role as Role) : 'viewer'

  const [role, setRole] = useState<Role>(initialRole)
  const [name, setName] = useState(params.name ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Prefilled from onboarding's club-info.tsx when that's how we got here —
  // stays editable either way, same as every other field on this screen.
  const [homeLocation, setHomeLocation] = useState(initialRole === 'club' ? onboardingLocation : '')
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
      // applies whatever onboarding's club-info.tsx already collected to the
      // real club profile the signup endpoint auto-creates for role 'club'.
      if (newUser.role === 'club' && (disciplines.length > 0 || homeLat != null)) {
        await apiFetch('/api/clubs/me', {
          method: 'PATCH',
          body: JSON.stringify({ disciplines, location: homeLocation, lat: homeLat, lng: homeLng }),
        }).catch(() => {})
      }
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
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12}>
          <Icon name="close" size={22} color={MUTED} />
        </Pressable>

        <Text style={styles.eyebrow}>{t('login.joinPugna')}</Text>
        <Text style={styles.title}>{t('login.createAccount')}</Text>

        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.rolePill, role === r && styles.rolePillActive]}>
              <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>{t(`role.${r}`)}</Text>
            </Pressable>
          ))}
        </View>

        <GoogleSignInButton
          role={role}
          homeLocation={homeLocation}
          onSuccess={newUser => router.replace(roleHomePath(newUser.role))}
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

        {role === 'viewer' && (
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

        <Button label={loading ? t('login.pleaseWait') : t('login.createAccount')} onPress={submit} disabled={loading} style={styles.submit} />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t('login.hasAccount')}</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.switchLink}>{t('login.logInLink')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 60, justifyContent: 'center' },
  close: { position: 'absolute', top: 20, right: 20, padding: 6, zIndex: 1 },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 3, color: ACCENT, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 32, textTransform: 'uppercase', color: TEXT, marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  rolePill: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' },
  rolePillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  roleLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  roleLabelActive: { color: ON_ACCENT },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  error: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12 },
  submit: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  switchText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase' },
  switchLink: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT, textDecorationLine: 'underline' },
})
