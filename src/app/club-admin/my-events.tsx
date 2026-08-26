import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { EventFormModal, type OrganizerEvent } from '@/app/organizer/events'
import { ACCENT, CARD, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function ClubMyEventsScreen() {
  return <ErrorBoundary><ClubMyEventsInner /></ErrorBoundary>
}

function ClubMyEventsInner() {
  const { t } = useLanguage()
  const params = useLocalSearchParams<{ create?: string }>()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget] = useState<OrganizerEvent | 'new' | null>(null)

  const load = () => apiFetch<{ events: OrganizerEvent[] }>('/api/events').then(r => setEvents(r.events)).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  // Home's "+Create Event" quick action lands here with ?create=1 to open the
  // form immediately, matching a real one-tap quick action.
  useEffect(() => { if (params.create === '1') setFormTarget('new') }, [params.create])

  const duplicate = async (id: number) => {
    try {
      await apiFetch(`/api/events/${id}/duplicate`, { method: 'POST' })
      setLoading(true)
      load()
    } catch { /* leave list unchanged on failure */ }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.events.yourEvents')}</Text>
        <Button label={t('organizer.events.create')} onPress={() => setFormTarget('new')} style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={ev => String(ev.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('organizer.events.noEvents')} ctaLabel={t('organizer.events.create')} onPress={() => setFormTarget('new')} />}
          renderItem={({ item: ev }) => (
            <View style={styles.card}>
              <Text style={styles.cardDiscipline}>{ev.discipline} · {ev.status}</Text>
              <Text style={styles.cardTitle}>{ev.name}</Text>
              <Text style={styles.cardMeta}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
              <View style={styles.actionRow}>
                <Button label={t('organizer.events.manage')} onPress={() => router.push(`/organizer-events/${ev.id}`)} style={styles.actionButton} />
                <Button label={t('common.edit')} variant="outline" onPress={() => setFormTarget(ev)} style={styles.actionButton} />
                <Button label={t('organizer.events.duplicate')} variant="outline" onPress={() => duplicate(ev.id)} style={styles.actionButton} />
              </View>
            </View>
          )}
        />
      )}

      {formTarget && (
        <EventFormModal
          event={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSaved={() => { setFormTarget(null); setLoading(true); load() }}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  headerButton: { alignSelf: 'flex-start' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, textTransform: 'uppercase', color: TEXT, marginBottom: 4 },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
})
