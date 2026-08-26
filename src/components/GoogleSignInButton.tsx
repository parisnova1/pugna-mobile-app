import { useEffect, useState } from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { Ionicons } from '@expo/vector-icons'
import { useAuth, type Role } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, ON_ACCENT, FONT_DISPLAY_BOLD } from '@/theme'

// Required once per app so the browser tab/popup used for the web OAuth
// redirect actually closes and hands control back to the app.
WebBrowser.maybeCompleteAuthSession()

export default function GoogleSignInButton({
  role,
  homeLocation,
  onSuccess,
  onError,
}: {
  // Only relevant the first time this Google identity signs in (account
  // creation) — passed through so a role picked in onboarding, or on the
  // signup screen, doesn't get lost by going through Google instead of the
  // email/password form.
  role?: Role
  homeLocation?: string
  onSuccess: (user: import('@/auth/AuthContext').User) => void
  onError: (message: string) => void
}) {
  const { t } = useLanguage()
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  // useIdTokenAuthRequest throws synchronously during render (not just a
  // rejected promise) if the platform-relevant client ID is undefined —
  // discovered when local dev, which has no EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
  // set, crashed the entire login screen rather than just leaving this one
  // button unusable. A dummy fallback keeps the hook from throwing; `configured`
  // gates the actual sign-in attempt so tapping it fails with a clear message
  // instead of silently trying an OAuth flow with a fake client ID.
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
  const configured = !!(webClientId || iosClientId || androidClientId)

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webClientId || 'not-configured',
    iosClientId: iosClientId || 'not-configured',
    androidClientId: androidClientId || 'not-configured',
  })

  useEffect(() => {
    if (!configured) return
    // promptAsync() builds the auth URL (an async call) before it opens the
    // popup — on web that gap is enough for the browser to no longer count
    // the click as "recent user input" and it silently blocks the popup
    // (ERR_WEB_BROWSER_BLOCKED). Pre-building the URL as soon as the request
    // is ready means promptAsync finds request.url already cached and opens
    // the popup synchronously within the click instead.
    request?.makeAuthUrlAsync(Google.discovery).catch(() => {})
  }, [request, configured])

  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params.id_token
    if (!idToken) {
      onError(t('login.errorGeneric'))
      return
    }
    setLoading(true)
    loginWithGoogle(idToken, role, homeLocation)
      .then(onSuccess)
      .catch(err => onError(err instanceof Error ? err.message : t('login.errorGeneric')))
      .finally(() => setLoading(false))
    // response is a new object every render even without a state change, so
    // only re-run this when the actual result (success + token) changes.
  }, [response?.type, (response as { params?: { id_token?: string } })?.params?.id_token])

  return (
    <Pressable
      onPress={() => (configured ? promptAsync() : onError(t('login.googleNotConfigured')))}
      disabled={(configured && !request) || loading}
      style={({ pressed }) => [styles.base, (pressed || loading) && styles.pressed, configured && !request && styles.disabled]}
    >
      <Ionicons name="logo-google" size={18} color={ON_ACCENT} />
      <Text style={styles.label}>{loading ? t('login.pleaseWait') : t('login.continueWithGoogle')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: ACCENT,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: ON_ACCENT },
})
