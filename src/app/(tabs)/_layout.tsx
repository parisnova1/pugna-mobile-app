import { Tabs, Redirect, useSegments } from 'expo-router'
import { makeTabBarButton } from '@/components/AppTabBarButton'
import { useAuth } from '@/auth/AuthContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, MUTED, CARD, BORDER, FONT_DISPLAY_BOLD } from '@/theme'

export default function TabsLayout() {
  const { t } = useLanguage()
  const { user, ready } = useAuth()
  const { ready: onboardingReady, hasOnboarded } = useOnboarding()
  const segments = useSegments()

  // Only the bare root ("/", i.e. the Discover tab with no further segment)
  // redirects a brand-new device to Welcome first. Every other tab route —
  // /events, /clubs, /sparring, /you — must render standalone for a guest
  // who deep-links or taps "Events entdecken" straight past onboarding; the
  // previous version of this guard fired for the whole (tabs) group at
  // once, which is why /events used to show the splash too.
  const isRootTab = segments[segments.length - 1] === '(tabs)'
  if (onboardingReady && !hasOnboarded && isRootTab) return <Redirect href="/(onboarding)/welcome" />

  // No crossover nav — organizer/club accounts never see the viewer tabs,
  // same as the web app's strict RequireRole split. Direct navigation here
  // (not just in-app links) bounces them straight to their own dashboard.
  if (ready && user?.role === 'organizer') return <Redirect href="/organizer" />
  if (ready && user?.role === 'club') return <Redirect href="/club-admin" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: { backgroundColor: CARD, borderTopColor: BORDER, borderTopWidth: 1, height: 84, paddingTop: 9 },
        tabBarLabelStyle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.discover'), tabBarButton: makeTabBarButton('flash', t('nav.discover')) }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('nav.events'), tabBarButton: makeTabBarButton('calendarMark', t('nav.events')) }}
      />
      <Tabs.Screen
        name="clubs"
        options={{ title: t('nav.clubs'), tabBarButton: makeTabBarButton('shield', t('nav.clubs')) }}
      />
      <Tabs.Screen
        name="sparring"
        options={{ title: t('nav.sparring'), tabBarButton: makeTabBarButton('clinch', t('nav.sparring')) }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: t('nav.you'), tabBarButton: makeTabBarButton('personCircle', t('nav.you')) }}
      />
    </Tabs>
  )
}
