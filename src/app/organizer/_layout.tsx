import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, MUTED, BG, BORDER, FONT_DISPLAY_BOLD } from '@/theme'

export default function OrganizerTabsLayout() {
  const { t } = useLanguage()
  const { user, ready } = useAuth()

  // Mirrors the web app's RequireRole gate — direct navigation to /organizer
  // by a non-organizer (or logged-out) account bounces to the login/home
  // flow instead of rendering the dashboard.
  if (!ready) return null
  if (user?.role !== 'organizer') return <Redirect href="/" />

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
        options={{ title: t('organizer.tab.overview'), tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('organizer.tab.events'), tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('organizer.tab.account'), tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }}
      />
    </Tabs>
  )
}
