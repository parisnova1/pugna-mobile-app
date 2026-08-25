import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { ACCENT, CARD, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type OrganizerEvent = { id: number; name: string; date: string; location: string; discipline: string; status: string; format: 'bracket' | 'card' }
type OrganizerFighter = { id: number; status: 'Matched' | 'Unmatched' }

export default function OrganizerOverviewScreen() {
  return <ErrorBoundary><OrganizerOverviewInner /></ErrorBoundary>
}

function OrganizerOverviewInner() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [fighters, setFighters] = useState<OrganizerFighter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<{ events: OrganizerEvent[] }>('/api/events'),
      apiFetch<{ fighters: OrganizerFighter[] }>('/api/fighters'),
    ])
      .then(([e, f]) => { setEvents(e.events); setFighters(f.fighters) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))
  const unmatched = fighters.filter(f => f.status === 'Unmatched').length

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>{t('organizer.overview.greeting', { name: user?.name.split(' ')[0] ?? '' })}</Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}><Spinner /></View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{upcoming.length}</Text>
                <Text style={styles.statLabel}>{t('organizer.overview.upcomingEvents')}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{fighters.length}</Text>
                <Text style={styles.statLabel}>{t('organizer.overview.totalFighters')}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{unmatched}</Text>
                <Text style={styles.statLabel}>{t('organizer.overview.unmatchedFighters')}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>{t('organizer.overview.upcoming')}</Text>
            {upcoming.length === 0 ? (
              <EmptyState message={t('organizer.overview.noEvents')} ctaLabel={t('organizer.overview.createEvent')} onPress={() => router.push('/organizer/events')} />
            ) : (
              upcoming.map(ev => (
                <Pressable key={ev.id} style={styles.eventRow} onPress={() => router.push(`/organizer-events/${ev.id}`)}>
                  <Text style={styles.eventDiscipline}>{ev.discipline}</Text>
                  <Text style={styles.eventTitle}>{ev.name}</Text>
                  <Text style={styles.eventMeta}>{formatDisplayDate(ev.date)} · {ev.location} · {ev.status}</Text>
                </Pressable>
              ))
            )}

            <Button label={t('organizer.overview.createEvent')} onPress={() => router.push('/organizer/events')} style={{ marginTop: 20 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 20 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginBottom: 28 },
  stat: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 26, color: ACCENT },
  statLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: TEXT, textTransform: 'uppercase', marginBottom: 12 },
  eventRow: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, marginBottom: 8 },
  eventDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 3 },
  eventTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase' },
  eventMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
})
