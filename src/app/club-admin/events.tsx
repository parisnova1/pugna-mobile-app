import { useEffect, useState, useMemo } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import Chip from '@/components/Chip'
import { looksLikeTest } from '@/lib/testFlag'
import { DISCIPLINES as REAL_DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import { EventFormModal, type OrganizerEvent } from '@/app/organizer/events'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }

const DISCIPLINES = ['All', ...REAL_DISCIPLINES]

export default function ClubEventsScreen() {
  return <ErrorBoundary><ClubEventsInner /></ErrorBoundary>
}

function ClubEventsInner() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  // Empty array means "All" — matches the public Events tab's filter.
  const [active, setActive] = useState<string[]>([])
  const [query, setQuery] = useState('')

  const [ownEvents, setOwnEvents] = useState<OrganizerEvent[]>([])
  const [loadingOwn, setLoadingOwn] = useState(true)
  const [viewingOwn, setViewingOwn] = useState(false)
  const [formTarget, setFormTarget] = useState<OrganizerEvent | 'new' | null>(null)

  useEffect(() => {
    apiFetch<{ events: PublicEvent[] }>('/api/public/events').then(r => setEvents(r.events)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadOwn = () => apiFetch<{ events: OrganizerEvent[] }>('/api/events').then(r => setOwnEvents(r.events)).catch(() => {}).finally(() => setLoadingOwn(false))
  useEffect(() => { loadOwn() }, [])

  const duplicate = async (id: number) => {
    try {
      await apiFetch(`/api/events/${id}/duplicate`, { method: 'POST' })
      setLoadingOwn(true)
      loadOwn()
    } catch { /* leave list unchanged on failure */ }
  }

  const toggleDiscipline = (d: string) => {
    if (d === 'All') { setActive([]); return }
    setActive(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events
      .filter(e => active.length === 0 || active.includes(e.discipline))
      .filter(e => !q || e.name.toLowerCase().includes(q) || e.organizer_name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
  }, [events, active, query])

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.events.title')}</Text>
        <View style={styles.headerButtons}>
          <Button label={t('organizer.events.create')} onPress={() => setFormTarget('new')} style={styles.headerButton} />
          <Button label={t('club.events.yourEvents')} variant="outline" onPress={() => setViewingOwn(true)} style={styles.headerButton} />
        </View>
        <TextInput value={query} onChangeText={setQuery} placeholder={t('events.searchPlaceholder')} placeholderTextColor={MUTED} style={styles.search} />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DISCIPLINES}
        keyExtractor={d => d}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item: d }) => {
          const isActive = d === 'All' ? active.length === 0 : active.includes(d)
          const label = d === 'All' ? t('events.discipline.all') : t(DISCIPLINE_LABEL_KEY[d])
          return <Chip icon={d === 'All' ? undefined : DISCIPLINE_ICON[d]} label={label} selected={isActive} onPress={() => toggleDiscipline(d)} />
        }}
      />

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={ev => String(ev.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('events.noMatch')} />}
          renderItem={({ item: ev }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/events/${ev.id}`)}>
              <View style={styles.badgeRow}>
                <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{ev.discipline}</Text></View>
                {looksLikeTest(ev.name, ev.organizer_name) && (
                  <View style={styles.testBadge}><Text style={styles.testBadgeText}>{t('common.testBadge')}</Text></View>
                )}
              </View>
              <Text style={styles.cardMeta}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
              <Text style={styles.cardTitle}>{ev.name}</Text>
              <Text style={styles.cardSub}>{ev.organizer_name}</Text>
            </Pressable>
          )}
        />
      )}

      {viewingOwn && (
        <YourEventsModal
          events={ownEvents}
          loading={loadingOwn}
          onClose={() => setViewingOwn(false)}
          onCreate={() => setFormTarget('new')}
          onEdit={ev => setFormTarget(ev)}
          onDuplicate={duplicate}
        />
      )}

      {formTarget && (
        <EventFormModal
          event={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSaved={() => { setFormTarget(null); setLoadingOwn(true); loadOwn() }}
        />
      )}
    </Screen>
  )
}

function YourEventsModal({ events, loading, onClose, onCreate, onEdit, onDuplicate }: {
  events: OrganizerEvent[]
  loading: boolean
  onClose: () => void
  onCreate: () => void
  onEdit: (ev: OrganizerEvent) => void
  onDuplicate: (id: number) => void
}) {
  const { t } = useLanguage()
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('club.events.yourEvents')}</Text>

          {loading ? (
            <View style={styles.centerFill}><Spinner /></View>
          ) : events.length === 0 ? (
            <Text style={styles.emptyText}>{t('organizer.events.noEvents')}</Text>
          ) : (
            <ScrollView style={styles.browseScroll}>
              <View style={{ gap: 12 }}>
                {events.map(ev => (
                  <View key={ev.id} style={styles.ownCard}>
                    <Text style={styles.ownCardMeta}>{ev.discipline} · {ev.status}</Text>
                    <Text style={styles.cardTitle}>{ev.name}</Text>
                    <Text style={styles.cardMeta}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
                    <View style={styles.actionRow}>
                      <Button label={t('organizer.events.manage')} onPress={() => router.push(`/organizer-events/${ev.id}`)} style={styles.actionButton} />
                      <Button label={t('common.edit')} variant="outline" onPress={() => onEdit(ev)} style={styles.actionButton} />
                      <Button label={t('organizer.events.duplicate')} variant="outline" onPress={() => onDuplicate(ev.id)} style={styles.actionButton} />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <Button label={t('organizer.events.create')} onPress={onCreate} style={{ marginTop: 12 }} />
          <Button label={t('common.close')} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButton: { alignSelf: 'flex-start' },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  chipRow: { flexGrow: 0, marginBottom: 16 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  cardBadge: { alignSelf: 'flex-start', backgroundColor: ACCENT, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8 },
  cardBadgeText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ON_ACCENT, textTransform: 'uppercase' },
  testBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: TEXT, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 8 },
  testBadgeText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: TEXT, textTransform: 'uppercase' },
  cardMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, textTransform: 'uppercase', color: TEXT, marginBottom: 6 },
  cardSub: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  browseScroll: { maxHeight: 420 },
  ownCard: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  ownCardMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
})
