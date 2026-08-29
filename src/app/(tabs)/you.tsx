import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { TEXT, CARD, BORDER, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }
type FollowedClub = { id: number; name: string; location: string }
type FollowedFighter = { id: number; name: string; club: string; weight: string }

export default function YouScreen() {
  return <ErrorBoundary><YouScreenInner /></ErrorBoundary>
}

function YouScreenInner() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [savedEvents, setSavedEvents] = useState<PublicEvent[]>([])
  const [followedFighters, setFollowedFighters] = useState<FollowedFighter[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      apiFetch<{ events: PublicEvent[] }>('/api/public/events/saved'),
      apiFetch<{ fighters: FollowedFighter[] }>('/api/public/fighters/following'),
      apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following'),
    ])
      .then(([s, f, c]) => { setSavedEvents(s.events); setFollowedFighters(f.fighters); setFollowedClubs(c.clubs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <Screen>
        <View style={styles.loggedOut}>
          <Text style={styles.loggedOutTitle}>{t('viewerHome.loggedOutTitle')}</Text>
          <Text style={styles.loggedOutBody}>{t('viewerHome.loggedOutSubtitle')}</Text>
          <Button label={t('header.logIn')} onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20 }} />
          <Button label={t('header.joinPugna')} variant="outline" onPress={() => router.push('/(auth)/signup')} style={{ marginTop: 12 }} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{t('viewerHome.hey', { name: user.name.split(' ')[0] })}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <Pressable onPress={() => logout()} hitSlop={10}>
            <Icon name="logout" size={22} color={MUTED} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t('viewerHome.savedEvents')}</Text>
        {loading ? <Spinner /> : savedEvents.length === 0 ? (
          <EmptyState message={t('viewerHome.noSaved')} ctaLabel={t('viewerHome.browseEvents')} onPress={() => router.push('/(tabs)/events')} />
        ) : (
          savedEvents.map(ev => (
            <Pressable key={ev.id} style={styles.row} onPress={() => router.push(`/events/${ev.id}`)}>
              <Text style={styles.rowTitle} numberOfLines={1}>{ev.name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{ev.location}</Text>
            </Pressable>
          ))
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('viewerHome.fightersYouFollow')}</Text>
        {loading ? null : followedFighters.length === 0 ? (
          <EmptyState message={t('viewerHome.noFightersFollowed')} ctaLabel={t('viewerHome.browseEvents')} onPress={() => router.push('/(tabs)/events')} />
        ) : (
          followedFighters.map(f => (
            <Pressable key={f.id} style={styles.row} onPress={() => router.push(`/fighters/${f.id}`)}>
              <Text style={styles.rowTitle} numberOfLines={1}>{f.name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{f.club} · {f.weight}</Text>
            </Pressable>
          ))
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('viewerHome.clubsYouFollow')}</Text>
        {loading ? null : followedClubs.length === 0 ? (
          <EmptyState message={t('viewerHome.noClubsFollowed')} ctaLabel={t('viewerHome.browseClubs')} onPress={() => router.push('/(tabs)/clubs')} />
        ) : (
          followedClubs.map(c => (
            <Pressable key={c.id} style={styles.row} onPress={() => router.push(`/clubs/${c.id}`)}>
              <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{c.location}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  loggedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutTitle: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, textAlign: 'center', marginBottom: 8 },
  loggedOutBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT },
  email: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 4 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 12 },
  row: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, marginBottom: 8 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
})
