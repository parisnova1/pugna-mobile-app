import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import Screen from '@/components/Screen'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import { TEXT, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// The "Live" tile from the original redesign brief is deliberately not here.
// The backend has no live-fight concept at all — bout status is only ever
// 'scheduled'/'completed', with no round/timer state anywhere (confirmed by
// reading every relevant backend file) — so the only honest version would be
// "is there an Active bracket event with a bout completed today," which
// needs a detail + bracket fetch per active event just to answer one
// yes/no question. Not worth the request fan-out for this pass; the brief
// itself says to omit it if it's too weak to build for real.
type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string }
type FollowedClub = { id: number; name: string }
type FollowedFighter = { id: number; name: string }
type NearbyClub = { id: number; name: string; location: string }

export default function ReadyScreen() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { homeLocation, homeLat, homeLng, disciplines, finishOnboarding } = useOnboarding()
  const [loading, setLoading] = useState(true)
  const [upcoming, setUpcoming] = useState<PublicEvent[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [followedFighters, setFollowedFighters] = useState<FollowedFighter[]>([])
  const [nearbyClubs, setNearbyClubs] = useState<NearbyClub[]>([])

  useEffect(() => {
    const tasks: Promise<void>[] = [
      // Same matching logic as (tabs)/index.tsx's Discover screen — reused
      // here rather than reimplemented, just surfacing fewer results.
      apiFetch<{ events: PublicEvent[] }>('/api/public/events').then(r => {
        const sorted = [...r.events].sort((a, b) => a.date.localeCompare(b.date))
        const loc = homeLocation.trim().toLowerCase()
        const isMatch = (e: PublicEvent) => (!!loc && e.location.toLowerCase().includes(loc)) || disciplines.includes(e.discipline)
        const personalized = sorted.filter(isMatch)
        const rest = sorted.filter(e => !isMatch(e))
        setUpcoming([...personalized, ...rest].slice(0, 2))
      }).catch(() => {}),
    ]
    if (homeLat != null && homeLng != null) {
      tasks.push(
        apiFetch<{ clubs: NearbyClub[] }>(`/api/clubs/?lat=${homeLat}&lng=${homeLng}&radiusKm=100`)
          .then(r => setNearbyClubs(r.clubs.slice(0, 3)))
          .catch(() => {}),
      )
    }
    if (user) {
      tasks.push(
        apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following').then(r => setFollowedClubs(r.clubs)).catch(() => {}),
        apiFetch<{ fighters: FollowedFighter[] }>('/api/public/fighters/following').then(r => setFollowedFighters(r.fighters)).catch(() => {}),
      )
    }
    Promise.all(tasks).finally(() => setLoading(false))
  }, [homeLocation, homeLat, homeLng, disciplines, user])

  const finish = async () => {
    await finishOnboarding()
    router.replace('/(tabs)')
  }

  const hasFollowing = followedClubs.length > 0 || followedFighters.length > 0

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('onboarding.readyTitle')}</Text>

        {loading ? (
          <View style={styles.centerFill}><Spinner /></View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title={t('onboarding.readyUpcoming')}>
                {upcoming.map(ev => (
                  <Card key={ev.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{ev.name}</Text>
                    <Text style={styles.rowSub}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
                  </Card>
                ))}
              </Section>
            )}

            {hasFollowing && (
              <Section title={t('onboarding.readyFollowing')}>
                {followedFighters.map(f => (
                  <Card key={`f-${f.id}`} style={styles.row}><Text style={styles.rowTitle}>{f.name}</Text></Card>
                ))}
                {followedClubs.map(c => (
                  <Card key={`c-${c.id}`} style={styles.row}><Text style={styles.rowTitle}>{c.name}</Text></Card>
                ))}
              </Section>
            )}

            {nearbyClubs.length > 0 && (
              <Section title={t('onboarding.readyNearYou')}>
                {nearbyClubs.map(c => (
                  <Card key={c.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{c.name}</Text>
                    <Text style={styles.rowSub}>{c.location}</Text>
                  </Card>
                ))}
              </Section>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('onboarding.readyCta')} onPress={finish} style={styles.button} />
      </View>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 28, paddingTop: 80, paddingBottom: 20 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, textAlign: 'center', marginBottom: 32 },
  centerFill: { paddingVertical: 40, alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', marginBottom: 10 },
  sectionList: { gap: 8 },
  row: { padding: 14 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  footer: { padding: 28, paddingTop: 0 },
  button: {},
})
