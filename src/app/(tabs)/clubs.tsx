import { useEffect, useState, useMemo } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import { looksLikeTest } from '@/lib/testFlag'
import { ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string; location: string; disciplines: string[]; founded_year: number | null; member_count: number }

export default function ClubsScreen() {
  return <ErrorBoundary><ClubsScreenInner /></ErrorBoundary>
}

function ClubsScreenInner() {
  const { t } = useLanguage()
  const [clubs, setClubs] = useState<PublicClub[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs')
      .then(r => setClubs(r.clubs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clubs
    return clubs.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.disciplines.some(d => d.toLowerCase().includes(q)))
  }, [clubs, query])

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
