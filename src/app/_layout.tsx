import { useEffect } from 'react'
import { View, Platform } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from '@/auth/AuthContext'
import { LanguageProvider } from '@/i18n/LanguageContext'
import { useAppFonts } from '@/hooks/useAppFonts'
import ErrorBoundary from '@/components/ErrorBoundary'
import { BG } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts()

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    // RN Web leaves the <html>/<body> background white below short content —
    // native builds always fill the full device height via flexbox regardless
    // of content length, so this is a web-preview-only fixup.
    if (Platform.OS === 'web') {
      document.documentElement.style.backgroundColor = BG
      document.body.style.backgroundColor = BG
    }
  }, [])

  if (!fontsLoaded && !fontError) return null

  // IMPORTANT: every file under src/app is globally reachable by URL no
  // matter which Stack.Screens are declared here — conditionally mounting
  // a different set of Stack.Screens per role does NOT gate access (direct
  // navigation to e.g. /login still worked while testing an organizer-only
  // Stack that never registered it). Role gating instead lives inside each
  // destination — organizer/_layout.tsx and club-admin/_layout.tsx redirect
  // away non-matching roles, and (tabs)/_layout.tsx redirects organizer/club
  // accounts to their own dashboard — mirroring the web app's RequireRole
  // pattern. This Stack just registers every route, same as before.
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="organizer" />
              <Stack.Screen name="club-admin" />
              <Stack.Screen name="organizer-events/[id]" />
              <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="(auth)/signup" options={{ presentation: 'modal' }} />
              <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </View>
  )
}
