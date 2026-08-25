import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import { useAuth } from '@/auth/AuthContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import ErrorBoundary from '@/components/ErrorBoundary'
import { looksLikeTest } from '@/lib/testFlag'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }

export default function DiscoverScreen() {
  return <ErrorBoundary><DiscoverScreenInner /></ErrorBoundary>
}

function DiscoverScreenInner() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  // No role redirect needed in this screen specifically — (tabs)/_layout.tsx
  // already redirects organizer/club accounts away before any tab (including
  // this one) ever renders for them.

  useEffect(() => {
    apiFetch<{ events: PublicEvent[] }>('/api/public/events')
      .then(r => setEvents([...r.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.eyebrow}>{t('hero.eyebrow')}</Text>
            <Pressable onPress={() => router.push('/search')} hitSlop={10}>
              <Ionicons name="search" size={20} color={MUTED} />
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>
            {t('hero.title1')}{'\n'}
            <Text style={{ color: ACCENT }}>{t('hero.title2')}</Text>{'\n'}
            {t('hero.title3')}{'\n'}
            {t('hero.title4')}
          </Text>
        </View>

        <View style={styles.quickRow}>
          <QuickCard icon="calendar" label={t('nav.events')} onPress={() => router.push('/(tabs)/events')} />
          <QuickCard icon="shield" label={t('nav.clubs')} onPress={() => router.push('/(tabs)/clubs')} />
          <QuickCard icon="body" label={t('nav.sparring')} onPress={() => router.push('/(tabs)/sparring')} />
        </View>

        <Pressable style={styles.scanCard} onPress={() => router.push('/scan')}>
          <Ionicons name="qr-code" size={22} color={ACCENT} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanTitle}>{t('viewerHome.scanTitle')}</Text>
            <Text style={styles.scanSub}>{t('viewerHome.scanPointCamera')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </Pressable>

        <Text style={styles.sectionLabel}>{t('viewerHome.upcomingNearYou')}</Text>

        {loading ? (
          <View style={styles.centerFill}><Spinner /></View>
        ) : (
          events.map(ev => (
            <Pressable key={ev.id} style={styles.eventRow} onPress={() => router.push(`/events/${ev.id}`)}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.eventDiscipline}>{ev.discipline}</Text>
                  {looksLikeTest(ev.name, ev.organizer_name) && (
                    <View style={styles.testBadge}><Text style={styles.testBadgeText}>{t('common.testBadge')}</Text></View>
                  )}
                </View>
                <Text style={styles.eventTitle}>{ev.name}</Text>
                <Text style={styles.eventMeta}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </Pressable>
          ))
        )}

        <Pressable style={styles.seeAll} onPress={() => router.push('/(tabs)/events')}>
          <Text style={styles.seeAllLabel}>{t('common.seeAll')}</Text>
        </Pressable>

        {!user && (
          <Pressable style={styles.joinCard} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.joinTitle}>{t('header.joinPugna')}</Text>
            <Ionicons name="arrow-forward" size={18} color={ON_ACCENT} />
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  )
}

function QuickCard({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <Ionicons name={icon} size={20} color={ACCENT} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { marginBottom: 28 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' },
  heroTitle: { fontFamily: FONT_DISPLAY, fontSize: 34, lineHeight: 36, textTransform: 'uppercase', color: TEXT },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickCard: { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, alignItems: 'flex-start', gap: 10 },
  quickLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: TEXT, textTransform: 'uppercase', width: '100%' },
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderWidth: 1, borderColor: ACCENT, borderRadius: 4, padding: 16, marginBottom: 28 },
  scanTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  scanSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: TEXT, textTransform: 'uppercase', marginBottom: 12 },
  centerFill: { paddingVertical: 24, alignItems: 'center' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, marginBottom: 8 },
  eventDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 3 },
  testBadge: { borderWidth: 1, borderColor: TEXT, borderRadius: 4, paddingVertical: 1, paddingHorizontal: 6, marginBottom: 3 },
  testBadgeText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 9, letterSpacing: 1, color: TEXT, textTransform: 'uppercase' },
  eventTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase' },
  eventMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  seeAll: { alignItems: 'center', paddingVertical: 14, marginBottom: 20 },
  seeAllLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  joinCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: ACCENT, borderRadius: 4, padding: 18 },
  joinTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, letterSpacing: 1, color: ON_ACCENT, textTransform: 'uppercase' },
})
