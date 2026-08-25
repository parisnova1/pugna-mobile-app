import { useEffect, useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import BackButton from '@/components/BackButton'
import Spinner from '@/components/Spinner'
import { ACCENT, TEXT, CARD, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type EventResult = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string }
type FighterResult = { id: number; name: string; club: string; weight: string; record: string; discipline: string; location: string }
type ClubResult = { id: number; name: string; location: string; disciplines: string[]; member_count: number }

function matches(query: string, ...fields: Array<string | undefined | null>) {
  const q = query.toLowerCase()
  return fields.some(f => f?.toLowerCase().includes(q))
}

export default function SearchScreen() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [events, setEvents] = useState<EventResult[]>([])
  const [fighters, setFighters] = useState<FighterResult[]>([])
  const [clubs, setClubs] = useState<ClubResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setEvents([]); setFighters([]); setClubs([]); return }
    setLoading(true)
    const handle = setTimeout(() => {
      Promise.all([
        apiFetch<{ events: EventResult[] }>('/api/public/events'),
        apiFetch<{ fighters: FighterResult[] }>('/api/public/fighters'),
        apiFetch<{ clubs: ClubResult[] }>('/api/clubs'),
      ])
        .then(([e, f, c]) => {
          setEvents(e.events.filter(x => matches(q, x.name, x.location, x.discipline, x.organizer_name)))
          setFighters(f.fighters.filter(x => matches(q, x.name, x.club, x.location, x.discipline)))
          setClubs(c.clubs.filter(x => matches(q, x.name, x.location, ...x.disciplines)))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  const total = events.length + fighters.length + clubs.length

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={t('header.searchPlaceholder')}
          placeholderTextColor={MUTED}
          style={styles.search}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!query ? null : loading ? (
          <Spinner />
        ) : total === 0 ? (
          <Text style={styles.muted}>No events, fighters or clubs match "{query}".</Text>
        ) : (
          <>
            {events.length > 0 && (
              <ResultSection title={`Events (${events.length})`}>
                {events.map(e => (
                  <ResultCard key={e.id} eyebrow={e.discipline} title={e.name} sub={`${formatDisplayDate(e.date)} · ${e.location}`} tag={e.organizer_name} onPress={() => router.push(`/events/${e.id}`)} />
                ))}
              </ResultSection>
            )}
            {fighters.length > 0 && (
              <ResultSection title={`Fighters (${fighters.length})`}>
                {fighters.map(f => (
                  <ResultCard key={f.id} eyebrow={f.discipline} title={f.name} sub={`${f.club} · ${f.weight}`} tag={f.record} onPress={() => router.push(`/fighters/${f.id}`)} />
                ))}
              </ResultSection>
            )}
            {clubs.length > 0 && (
              <ResultSection title={`Clubs (${clubs.length})`}>
                {clubs.map(c => (
                  <ResultCard key={c.id} eyebrow={c.disciplines[0] ?? ''} title={c.name} sub={c.location} tag={`${c.member_count} members`} onPress={() => router.push(`/clubs/${c.id}`)} />
                ))}
              </ResultSection>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  )
}

function ResultCard({ eyebrow, title, sub, tag, onPress }: { eyebrow: string; title: string; sub: string; tag: string; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {!!eyebrow && <Text style={styles.cardEyebrow}>{eyebrow}</Text>}
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
      {!!tag && <Text style={styles.cardTag}>{tag}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8, gap: 12 },
  search: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },
  muted: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
  sectionTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardEyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 17, textTransform: 'uppercase', color: TEXT, marginBottom: 4 },
  cardSub: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  cardTag: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 6 },
})
