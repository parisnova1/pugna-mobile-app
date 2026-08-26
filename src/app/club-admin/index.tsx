import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Card from '@/components/Card'
import StatTile from '@/components/StatTile'
import LiveBadge from '@/components/LiveBadge'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ACCENT, TEXT, BORDER, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Session = { id: number; location: string; date: string; time: string; registered_fighters: number; spots: number }
type OwnEvent = { id: number; name: string; date: string; location: string; status: string }
type ClubEvent = { id: number; name: string; date: string; location: string; qr_token: string; status: string; has_live_bout: number }

export default function ClubHomeScreen() {
  return <ErrorBoundary><ClubHomeInner /></ErrorBoundary>
}

function ClubHomeInner() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [ownEvents, setOwnEvents] = useState<OwnEvent[]>([])
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch<{ sessions: Session[] }>('/api/sparring/me'),
      apiFetch<{ events: OwnEvent[] }>('/api/events'),
      apiFetch<{ events: ClubEvent[] }>('/api/clubs/me/events'),
    ])
      .then(([s, e, ce]) => { setSessions(s.sessions); setOwnEvents(e.events); setClubEvents(ce.events) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)
  const nextSession = sessions.filter(s => s.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))[0]
  const nextEvent = ownEvents.filter(e => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))[0]
  const liveEvent = clubEvents.find(e => e.has_live_bout)

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>{t('club.home.greeting', { name: user?.name.split(' ')[0] ?? '' })}</Text>
        <Text style={styles.subGreeting}>{t('club.home.subGreeting')}</Text>

        <View style={styles.quickActions}>
          <Button label={t('club.home.createSparring')} onPress={() => router.push('/club-admin/sessions?create=1')} style={styles.quickAction} />
          <Button label={t('club.home.createEvent')} onPress={() => router.push('/club-admin/my-events?create=1')} style={styles.quickAction} />
          <Button label={t('club.home.findSparring')} variant="outline" onPress={() => router.push('/club-admin/sparring')} style={styles.quickAction} />
          <Button label={t('club.home.findEvent')} variant="outline" onPress={() => router.push('/club-admin/events')} style={styles.quickAction} />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}><Spinner /></View>
        ) : (
          <>
            {liveEvent && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.sectionLabel}>{t('club.home.liveNow')}</Text>
                <Card onPress={() => router.push(`/events/${liveEvent.id}`)}>
                  <LiveBadge />
                  <Text style={styles.eventTitle}>{liveEvent.name}</Text>
                  <Text style={styles.eventMeta}>{liveEvent.location}</Text>
                </Card>
              </View>
            )}

            <Text style={styles.sectionLabel}>{t('club.home.today')}</Text>
            <View style={{ gap: 10, marginBottom: 24 }}>
              {nextSession && (
                <Card>
                  <Text style={styles.cardEyebrow}>{t('club.home.sparringSession')}</Text>
                  <Text style={styles.eventTitle}>{nextSession.location}</Text>
                  <Text style={styles.eventMeta}>{formatDisplayDate(nextSession.date)} · {nextSession.time} · {t('club.home.fightersConfirmed', { count: nextSession.registered_fighters })}</Text>
                  <Button label={t('organizer.events.manage')} variant="outline" onPress={() => router.push('/club-admin/sessions')} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
                </Card>
              )}
              {nextEvent && (
                <Card>
                  <Text style={styles.cardEyebrow}>{t('club.home.upcomingEvent')}</Text>
                  <Text style={styles.eventTitle}>{nextEvent.name}</Text>
                  <Text style={styles.eventMeta}>{formatDisplayDate(nextEvent.date)} · {nextEvent.location}</Text>
                  <Button label={t('common.viewArrow')} variant="outline" onPress={() => router.push(`/organizer-events/${nextEvent.id}`)} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
                </Card>
              )}
              {!nextSession && !nextEvent && (
                <Text style={styles.emptyText}>{t('club.home.noActivity')}</Text>
              )}
            </View>

            <Text style={styles.sectionLabel}>{t('club.home.overview')}</Text>
            <View style={styles.statsRow}>
              <StatTile value={sessions.length} label={t('club.home.statSessions')} onPress={() => router.push('/club-admin/sessions')} />
              <StatTile value={ownEvents.length} label={t('club.home.statEvents')} onPress={() => router.push('/club-admin/my-events')} />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT },
  subGreeting: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginTop: 2, marginBottom: 20 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  quickAction: { paddingVertical: 10, paddingHorizontal: 16 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: TEXT, textTransform: 'uppercase', marginBottom: 12 },
  cardEyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 },
  eventTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, textTransform: 'uppercase', color: TEXT, marginTop: 6 },
  eventMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER },
})
