import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, MUTED, BG, BORDER, FONT_DISPLAY_BOLD } from '@/theme'

export default function ClubTabsLayout() {
  const { t } = useLanguage()
  const { user, ready } = useAuth()

  // Mirrors the web app's RequireRole gate — direct navigation to
  // /club-admin by a non-club (or logged-out) account bounces away instead
  // of rendering the dashboard.
  if (!ready) return null
  if (user?.role !== 'club') return <Redirect href="/" />

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
        options={{ title: t('club.tab.details'), tabBarIcon: ({ color, size }) => <Ionicons name="shield" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="sparring"
        options={{ title: t('club.tab.sparring'), tabBarIcon: ({ color, size }) => <Ionicons name="body" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="fighters"
        options={{ title: t('club.tab.fighters'), tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} /> }}
      />
    </Tabs>
  )
}
