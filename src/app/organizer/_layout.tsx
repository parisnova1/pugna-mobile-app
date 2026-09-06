import { Tabs, Redirect } from 'expo-router'
import { makeTabBarButton } from '@/components/AppTabBarButton'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ACCENT, MUTED, CARD, BORDER, FONT_DISPLAY_BOLD } from '@/theme'

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
        tabBarStyle: { backgroundColor: CARD, borderTopColor: BORDER, borderTopWidth: 1, height: 84, paddingTop: 9 },
        tabBarLabelStyle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('organizer.tab.overview'), tabBarButton: makeTabBarButton('statsChart', t('organizer.tab.overview')) }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('organizer.tab.events'), tabBarButton: makeTabBarButton('calendarMark', t('organizer.tab.events')) }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('organizer.tab.account'), tabBarButton: makeTabBarButton('personCircle', t('organizer.tab.account')) }}
      />
    </Tabs>
  )
}
