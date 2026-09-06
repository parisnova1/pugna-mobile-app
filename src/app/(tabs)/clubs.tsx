import { useEffect, useState, useMemo, useRef } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Chip from '@/components/Chip'
import { looksLikeTest } from '@/lib/testFlag'
import { DISCIPLINES as REAL_DISCIPLINES, DISCIPLINE_LABEL_KEY, DISCIPLINE_ICON } from '@/lib/disciplines'
import { ACCENT, ON_ACCENT, CARD, SURFACE, SURFACE_BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_MONO_MEDIUM, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string; location: string; disciplines: string[] }

const DISCIPLINES = ['All', ...REAL_DISCIPLINES]

// A club-discover row, not a membership directory: name, city · sport, and
// whether you follow them — no member counts, no letter-avatar hero. See
// clubs/[id].tsx for the full public profile a row taps into; this list
// never routes anywhere near /club-admin.
export default function ClubsScreen() {
  return <ErrorBoundary><ClubsScreenInner /></ErrorBoundary>
}

function ClubsScreenInner() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { disciplines: preferredDisciplines } = useOnboarding()
  const [clubs, setClubs] = useState<PublicClub[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  // Empty array means "All", same convention as the Events tab's filter.
  const [active, setActive] = useState<string[]>([])
  const [following, setFollowing] = useState<Set<number>>(new Set())
  const [followBusy, setFollowBusy] = useState<number | null>(null)
  const appliedPrefs = useRef(false)

  useEffect(() => {
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs')
      .then(r => setClubs(r.clubs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.role !== 'viewer') { setFollowing(new Set()); return }
    apiFetch<{ clubs: { id: number }[] }>('/api/clubs/following')
      .then(r => setFollowing(new Set(r.clubs.map(c => c.id))))
      .catch(() => {})
  }, [user?.role])

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

  const toggleFollow = async (club: PublicClub) => {
    // Guest: no account to attach a follow to — send them through the same
    // account flow the live card's Follow button uses, carrying followClubId
    // so account.tsx follows this club automatically once signed in, then
    // lands back here.
    if (!user) {
      router.push({ pathname: '/(auth)/account', params: { mode: 'register', role: 'viewer', next: '/clubs', followClubId: String(club.id) } })
      return
    }
    if (user.role !== 'viewer') return
    setFollowBusy(club.id)
    const isFollowing = following.has(club.id)
    try {
      await apiFetch(`/api/clubs/${club.id}/follow`, { method: isFollowing ? 'DELETE' : 'POST' })
      setFollowing(prev => {
        const next = new Set(prev)
        isFollowing ? next.delete(club.id) : next.add(club.id)
        return next
      })
    } catch {
      // leave state unchanged on failure
    } finally {
      setFollowBusy(null)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.clubs')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('clubs.searchPlaceholder')}
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
          ListEmptyComponent={<EmptyState message={t('clubs.noClubs')} />}
          renderItem={({ item: c }) => {
            const sport = c.disciplines[0] ? t(DISCIPLINE_LABEL_KEY[c.disciplines[0]]) : ''
            const isFollowing = following.has(c.id)
            const showFollow = !user || user.role === 'viewer'
            return (
              <Pressable style={styles.row} onPress={() => router.push(`/clubs/${c.id}`)}>
                <View style={styles.rowInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                    {looksLikeTest(c.name) && (
                      <View style={styles.testBadge}><Text style={styles.testBadgeText}>{t('common.testBadge')}</Text></View>
                    )}
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>{[c.location, sport].filter(Boolean).join(' · ')}</Text>
                </View>
                {showFollow && (
                  <Pressable
                    onPress={() => toggleFollow(c)}
                    disabled={followBusy === c.id}
                    style={[styles.followPill, isFollowing && styles.followPillActive]}
                  >
                    <Text style={[styles.followLabel, isFollowing && styles.followLabelActive]}>
                      {isFollowing ? t('clubs.followingShort') : t('clubs.follow')}
                    </Text>
                  </Pressable>
                )}
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
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, color: TEXT },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: SURFACE_BORDER, color: TEXT, padding: 12, borderRadius: 12, fontFamily: FONT_BODY, fontSize: 14 },
  chipRow: { flexGrow: 0, marginBottom: 16 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderRadius: 16, padding: 16 },
  rowInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { flexShrink: 1, fontFamily: FONT_DISPLAY, fontSize: 16, color: TEXT },
  testBadge: { borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 999, paddingVertical: 1, paddingHorizontal: 7 },
  testBadgeText: { fontFamily: FONT_MONO_MEDIUM, fontSize: 9, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11.5, letterSpacing: 0.3, color: MUTED, textTransform: 'uppercase', marginTop: 4 },
  followPill: { backgroundColor: ACCENT, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  followPillActive: { backgroundColor: SURFACE, borderWidth: 1, borderColor: SURFACE_BORDER },
  followLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: ON_ACCENT },
  followLabelActive: { color: TEXT },
})
