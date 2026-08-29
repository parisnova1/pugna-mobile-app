import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { useAuth, type Role } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Button from '@/components/Button'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import OrDivider from '@/components/OrDivider'
import { roleHomePath } from '@/lib/roleHome'
import { ACCENT, TEXT, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function LoginScreen() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const params = useLocalSearchParams<{ role?: string }>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError(t('login.errorEmail')); return }
    if (password.length < 6) { setError(t('login.errorPassword')); return }

    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      router.replace(roleHomePath(loggedInUser.role))
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

        <Text style={styles.eyebrow}>{t('login.welcomeBack')}</Text>
        <Text style={styles.title}>{t('login.logIn')}</Text>

        <GoogleSignInButton
          onSuccess={loggedInUser => router.replace(roleHomePath(loggedInUser.role))}
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
            autoComplete="current-password"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button label={loading ? t('login.pleaseWait') : t('login.logIn')} onPress={submit} disabled={loading} style={styles.submit} />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t('login.noAccount')}</Text>
          <Pressable onPress={() => router.replace({ pathname: '/(auth)/signup', params: params.role ? { role: params.role } : undefined })}>
            <Text style={styles.switchLink}>{t('login.signUp')}</Text>
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
  title: { fontFamily: FONT_DISPLAY, fontSize: 32, textTransform: 'uppercase', color: TEXT, marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  error: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12 },
  submit: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  switchText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase' },
  switchLink: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT, textDecorationLine: 'underline' },
})
