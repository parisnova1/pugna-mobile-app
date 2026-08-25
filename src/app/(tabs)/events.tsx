import { useEffect, useState, useMemo, useRef } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import { looksLikeTest } from '@/lib/testFlag'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }

const DISCIPLINES = ['All', 'Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

export default function EventsScreen() {
  return <ErrorBoundary><EventsScreenInner /></ErrorBoundary>
}

function EventsScreenInner() {
  const { t } = useLanguage()
  const { disciplines: preferredDisciplines } = useOnboarding()
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  // Empty array means "All" — multi-select so the onboarding interests step
  // (which lets you pick several disciplines) can preselect more than one.
  const [active, setActive] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const appliedPrefs = useRef(false)

  useEffect(() => {
    apiFetch<{ events: PublicEvent[] }>('/api/public/events')
      .then(r => setEvents(r.events))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Runs once, as soon as the onboarding preferences finish loading from
  // AsyncStorage (they start empty on first render regardless of what was
  // actually saved) — a user who never picked interests keeps the "All" default.
  useEffect(() => {
    if (!appliedPrefs.current && preferredDisciplines.length > 0) {
      setActive(preferredDisciplines)
      appliedPrefs.current = true
    }
  }, [preferredDisciplines])

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
        <Text style={styles.title}>{t('nav.events')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('events.searchPlaceholder')}
          placeholderTextColor={MUTED}
          style={styles.search}
        />
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
          return (
            <Pressable onPress={() => toggleDiscipline(d)} style={[styles.chip, isActive && styles.chipActive]}>
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{d}</Text>
            </Pressable>
          )
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
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  chipRow: { flexGrow: 0, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16 },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  chipLabelActive: { color: ON_ACCENT },
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
})
