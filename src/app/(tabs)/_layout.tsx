import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/auth/AuthContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, MUTED, BG, BORDER, FONT_DISPLAY_BOLD } from '@/theme'

export default function TabsLayout() {
  const { t } = useLanguage()
  const { user, ready } = useAuth()
  const { ready: onboardingReady, hasOnboarded } = useOnboarding()

  // Onboarding runs before any auth decision — a brand-new device should
  // never reach the tabs (or get bounced to a role dashboard) without
  // seeing it first, whether or not the user ends up logged in.
  if (onboardingReady && !hasOnboarded) return <Redirect href="/(onboarding)/welcome" />

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
        tabBarStyle: { backgroundColor: BG, borderTopColor: BORDER },
        tabBarLabelStyle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.discover'), tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('nav.events'), tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="clubs"
        options={{ title: t('nav.clubs'), tabBarIcon: ({ color, size }) => <Ionicons name="shield" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="sparring"
        options={{ title: t('nav.sparring'), tabBarIcon: ({ color, size }) => <Ionicons name="body" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: t('header.viewerHome'), tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }}
      />
    </Tabs>
  )
}
