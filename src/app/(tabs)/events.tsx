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
import Chip from '@/components/Chip'
import { useToast } from '@/lib/toastContext'
import { looksLikeTest } from '@/lib/testFlag'
import { DISCIPLINES as REAL_DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import { Icon } from '@/components/icons/Icon'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, SURFACE, SURFACE_BORDER, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_MONO_MEDIUM, FONT_BODY } from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }

const DISCIPLINES = ['All', ...REAL_DISCIPLINES]

export default function EventsScreen() {
  return <ErrorBoundary><EventsScreenInner /></ErrorBoundary>
}

function EventsScreenInner() {
  const { t } = useLanguage()
  const { showToast } = useToast()
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
      .catch(() => showToast(t('common.loadError')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('nav.events')}</Text>
          <Pressable onPress={() => router.push('/scan')} style={styles.scanButton} hitSlop={8}>
            <Icon name="scan" size={18} color={TEXT} />
          </Pressable>
        </View>
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
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, color: TEXT },
  scanButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: SURFACE_BORDER, alignItems: 'center', justifyContent: 'center' },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 12, fontFamily: FONT_BODY, fontSize: 14 },
  chipRow: { flexGrow: 0, marginBottom: 16 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderRadius: 16, padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: ACCENT, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 },
  cardBadgeText: { fontFamily: FONT_MONO_MEDIUM, fontSize: 10.5, letterSpacing: 0.8, color: ON_ACCENT, textTransform: 'uppercase' },
  testBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  testBadgeText: { fontFamily: FONT_MONO_MEDIUM, fontSize: 10.5, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  cardMeta: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11, letterSpacing: 0.4, color: MUTED, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, color: TEXT, marginBottom: 6 },
  cardSub: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11, letterSpacing: 0.4, color: MUTED, textTransform: 'uppercase' },
})
