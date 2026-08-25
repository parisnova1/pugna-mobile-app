import { useEffect, useState, useMemo } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import { CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicFighter = { id: number; name: string; club: string; weight: string; record: string; discipline: string; location: string }

export default function ClubFindFightersScreen() {
  return <ErrorBoundary><ClubFindFightersInner /></ErrorBoundary>
}

function ClubFindFightersInner() {
  const { t } = useLanguage()
  const [fighters, setFighters] = useState<PublicFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch<{ fighters: PublicFighter[] }>('/api/public/fighters').then(r => setFighters(r.fighters)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return fighters
    return fighters.filter(f => f.name.toLowerCase().includes(q) || f.club.toLowerCase().includes(q) || f.discipline.toLowerCase().includes(q) || f.location.toLowerCase().includes(q))
  }, [fighters, query])

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.fighters.title')}</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder={t('header.searchPlaceholder')} placeholderTextColor={MUTED} style={styles.search} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={f => String(f.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('events.noMatch')} />}
          renderItem={({ item: f }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/fighters/${f.id}`)}>
              <Text style={styles.cardDiscipline}>{f.discipline}</Text>
              <Text style={styles.cardTitle}>{f.name}</Text>
              <Text style={styles.cardMeta}>{f.club} · {f.weight} · {f.location}</Text>
              <Text style={styles.cardRecord}>{f.record}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14 },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 3 },
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 16, color: TEXT, textTransform: 'uppercase' },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  cardRecord: { fontFamily: FONT_BODY, fontSize: 12, color: TEXT, marginTop: 6 },
})
