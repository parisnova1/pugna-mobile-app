import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { Drawer, DrawerContentScrollView, type DrawerContentComponentProps } from 'expo-router/drawer'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import { Icon, type IconName } from '@/components/icons/Icon'
import SectionHeader from '@/components/SectionHeader'
import DrawerNavItem from '@/components/DrawerNavItem'
import { BG, CARD, BORDER, TEXT, MODAL_SCRIM } from '@/theme'

// Drawer, not Tabs — this is the one section of the app with a grouped,
// multi-section nav (Home/Training/Events/Club/Community/Live/Settings),
// which RN's flat <Tabs> has no way to express. Every other section keeps
// its existing <Tabs>/<Stack> untouched; this is a scoped upgrade, not a
// repo-wide convention change.
type Group = { header: string; items: { name: string; icon: IconName; label: string; badge?: number }[] }

export default function ClubAdminLayout() {
  const { user, ready } = useAuth()

  // Mirrors every other role-gated layout in this app — direct navigation by
  // a non-club (or logged-out) account bounces away instead of rendering.
  if (!ready) return null
  if (user?.role !== 'club') return <Redirect href="/" />

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: BG },
        headerTintColor: TEXT,
        headerTitleStyle: { fontFamily: 'System' },
        // Every screen already renders its own big in-body title (matching
        // every other screen in this app) — the top bar just carries the
        // hamburger + a stable brand mark instead of duplicating that title.
        title: 'Pugna',
        drawerType: 'front',
        // A shade off pure BG so the drawer reads as an elevated glass panel
        // over the black content behind it, rather than blending into it —
        // this is the app's single highest-visibility nav chrome surface.
        drawerStyle: { backgroundColor: CARD, width: 280, borderRightWidth: 1, borderRightColor: BORDER },
        overlayColor: MODAL_SCRIM,
      }}
      drawerContent={props => <ClubDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="sparring" />
      <Drawer.Screen name="sessions" />
      <Drawer.Screen name="fighters" />
      <Drawer.Screen name="events" />
      <Drawer.Screen name="my-events" />
      <Drawer.Screen name="club-profile" />
      <Drawer.Screen name="members" />
      <Drawer.Screen name="coaches" />
      <Drawer.Screen name="messages" />
      <Drawer.Screen name="notifications" />
      <Drawer.Screen name="live" />
      <Drawer.Screen name="settings" />
    </Drawer>
  )
}

function ClubDrawerContent(props: DrawerContentComponentProps) {
  const { t } = useLanguage()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Notifications/messages land in a later slice — this stays a harmless
  // no-op (both endpoints 404 today) until those routes exist.
  useEffect(() => {
    apiFetch<{ notifications: { read_at: string | null }[] }>('/api/notifications')
      .then(r => setUnreadNotifications(r.notifications.filter(n => !n.read_at).length))
      .catch(() => {})
  }, [])

  const activeName = props.state.routeNames[props.state.index]
  const go = (name: string) => {
    props.navigation.navigate(name)
    props.navigation.closeDrawer()
  }

  const groups: Group[] = [
    { header: t('club.nav.home'), items: [{ name: 'index', icon: 'clipboard', label: t('club.nav.overview') }] },
    {
      header: t('club.nav.training'),
      items: [
        { name: 'sparring', icon: 'glove', label: t('club.tab.sparring') },
        { name: 'sessions', icon: 'whistle', label: t('club.nav.sessions') },
        { name: 'fighters', icon: 'followPerson', label: t('club.nav.myFighters') },
      ],
    },
    {
      header: t('club.nav.events'),
      items: [
        { name: 'events', icon: 'eye', label: t('club.nav.discoverEvents') },
        { name: 'my-events', icon: 'calendarMark', label: t('club.nav.myEvents') },
      ],
    },
    {
      header: t('club.nav.club'),
      items: [
        { name: 'club-profile', icon: 'followClub', label: t('club.nav.clubProfile') },
        { name: 'members', icon: 'followPerson', label: t('club.nav.members') },
        { name: 'coaches', icon: 'belt', label: t('club.nav.coaches') },
      ],
    },
    {
      header: t('club.nav.community'),
      items: [
        { name: 'messages', icon: 'broadcast', label: t('club.nav.messages'), badge: unreadMessages },
        { name: 'notifications', icon: 'bell', label: t('club.nav.notifications'), badge: unreadNotifications },
      ],
    },
  ]

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.brand}>
        <Icon name="hero" size={28} color={TEXT} />
      </View>

      {groups.map(group => (
        <View key={group.header}>
          <SectionHeader label={group.header} />
          {group.items.map(item => (
            <DrawerNavItem
              key={item.name}
              icon={item.icon}
              label={item.label}
              active={activeName === item.name}
              badge={item.badge}
              onPress={() => go(item.name)}
            />
          ))}
        </View>
      ))}

      <View style={styles.divider} />
      <DrawerNavItem icon="ring" label={t('club.nav.live')} active={activeName === 'live'} onPress={() => go('live')} />
      <DrawerNavItem icon="settings" label={t('club.nav.settings')} active={activeName === 'settings'} onPress={() => go('settings')} />
    </DrawerContentScrollView>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  brand: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  divider: { height: 1, backgroundColor: BORDER, marginTop: 16, marginBottom: 8, marginHorizontal: 16 },
})
