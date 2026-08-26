import { useEffect, useState, useMemo, useRef } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Chip from '@/components/Chip'
import { looksLikeTest } from '@/lib/testFlag'
import { DISCIPLINES as REAL_DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import { ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string; location: string; disciplines: string[]; founded_year: number | null; member_count: number }

const DISCIPLINES = ['All', ...REAL_DISCIPLINES]

export default function ClubsScreen() {
  return <ErrorBoundary><ClubsScreenInner /></ErrorBoundary>
}

function ClubsScreenInner() {
  const { t } = useLanguage()
  const { disciplines: preferredDisciplines } = useOnboarding()
  const [clubs, setClubs] = useState<PublicClub[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  // Empty array means "All", same convention as the Events tab's filter.
  const [active, setActive] = useState<string[]>([])
  const appliedPrefs = useRef(false)

  useEffect(() => {
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs')
      .then(r => setClubs(r.clubs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    return clubs
      .filter(c => active.length === 0 || c.disciplines.some(d => active.includes(d)))
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.disciplines.some(d => d.toLowerCase().includes(q)))
  }, [clubs, active, query])

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.clubs')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('header.searchPlaceholder')}
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
          keyExtractor={c => String(c.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('events.noMatch')} />}
          renderItem={({ item: c }) => {
            const initials = c.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/clubs/${c.id}`)}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials || '?'}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cardTitle}>{c.name}</Text>
                    {looksLikeTest(c.name) && (
                      <View style={styles.testBadge}><Text style={styles.testBadgeText}>{t('common.testBadge')}</Text></View>
                    )}
                  </View>
                  <Text style={styles.cardSub}>{[c.location, c.disciplines.join(', ')].filter(Boolean).join(' · ')}</Text>
                  <Text style={styles.cardMeta}>{c.member_count} {t('clubs.members')}</Text>
                </View>
              </Pressable>
            )
          }}
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
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 16, color: ACCENT },
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase' },
  testBadge: { borderWidth: 1, borderColor: TEXT, borderRadius: 4, paddingVertical: 1, paddingHorizontal: 6 },
  testBadgeText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 9, letterSpacing: 1, color: TEXT, textTransform: 'uppercase' },
  cardSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginBottom: 2 },
  cardMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
})
