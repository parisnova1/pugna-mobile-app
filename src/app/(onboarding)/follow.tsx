import { useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { mainFlowStepNumber, MAIN_FLOW_TOTAL } from '@/onboarding/steps'
import { ACCENT, ON_ACCENT, TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Fighter = { id: number; name: string; discipline: string; weight: string; club: string }
type Club = { id: number; name: string; location: string }
type PublicEvent = { id: number; name: string; date: string; location: string }
type TabKey = 'fighters' | 'clubs' | 'events'

// Follow runs before Account in the current flow, so there's no session to
// call the follow/save APIs against yet — picks are stored locally
// (OnboardingContext.pendingFollows) and applied for real via those same
// APIs right after signup succeeds (see (auth)/signup.tsx).
export default function FollowScreen() {
  const { t } = useLanguage()
  const { homeLat, homeLng, pendingFollows, setPendingFollows } = useOnboarding()
  const [tab, setTab] = useState<TabKey>('fighters')
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [followedFighters, setFollowedFighters] = useState<Set<number>>(new Set(pendingFollows.fighterIds))
  const [followedClubs, setFollowedClubs] = useState<Set<number>>(new Set(pendingFollows.clubIds))
  const [savedEvents, setSavedEvents] = useState<Set<number>>(new Set(pendingFollows.eventIds))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const clubsQuery = homeLat != null && homeLng != null ? `?lat=${homeLat}&lng=${homeLng}&radiusKm=100` : ''
    Promise.all([
      apiFetch<{ fighters: Fighter[] }>('/api/public/fighters').then(r => setFighters(r.fighters)).catch(() => {}),
      apiFetch<{ clubs: Club[] }>(`/api/clubs/${clubsQuery}`).then(r => setClubs(r.clubs)).catch(() => {}),
      apiFetch<{ events: PublicEvent[] }>('/api/public/events').then(r => setEvents(r.events)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [homeLat, homeLng])

  const toggleFighter = (id: number) => {
    setFollowedFighters(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleClub = (id: number) => {
    setFollowedClubs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleEvent = (id: number) => {
    setSavedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Weiter and Überspringen are the same action — this step is optional
  // either way, the second button just reassures anyone who hasn't picked
  // anything yet that they don't have to.
  const advance = () => {
    setPendingFollows({
      fighterIds: [...followedFighters],
      clubIds: [...followedClubs],
      eventIds: [...savedEvents],
    })
    router.push('/(onboarding)/permissions')
  }

  const TABS: { key: TabKey; labelKey: 'onboarding.followTabFighters' | 'onboarding.followTabClubs' | 'onboarding.followTabEvents' }[] = [
    { key: 'fighters', labelKey: 'onboarding.followTabFighters' },
    { key: 'clubs', labelKey: 'onboarding.followTabClubs' },
    { key: 'events', labelKey: 'onboarding.followTabEvents' },
  ]

  return (
    <Screen>
      <BackLink />
      <CenteredColumn style={styles.flex}>
        <View style={styles.header}>
          <StepIndicator current={mainFlowStepNumber('follow')} total={MAIN_FLOW_TOTAL} />
          <Text style={styles.title}>{t('onboarding.followTitle')}</Text>

          <View style={styles.tabRow}>
            {TABS.map(tb => (
              <Pressable key={tb.key} onPress={() => setTab(tb.key)} style={[styles.tab, tab === tb.key && styles.tabActive]}>
                <Text style={[styles.tabLabel, tab === tb.key && styles.tabLabelActive]}>{t(tb.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerFill}><Spinner /></View>
        ) : (
          <>
            {tab === 'fighters' && (
              <FlatList
                data={fighters}
                keyExtractor={f => String(f.id)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<EmptyState message={t('events.noMatch')} />}
                renderItem={({ item: f }) => (
                  <Card style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{f.name}</Text>
                      <Text style={styles.rowSub}>{f.discipline} · {f.weight} · {f.club}</Text>
                    </View>
                    <FollowButton active={followedFighters.has(f.id)} onPress={() => toggleFighter(f.id)} t={t} />
                  </Card>
                )}
              />
            )}
            {tab === 'clubs' && (
              <FlatList
                data={clubs}
                keyExtractor={c => String(c.id)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<EmptyState message={t('clubs.noClubs')} />}
                renderItem={({ item: c }) => (
                  <Card style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{c.name}</Text>
                      <Text style={styles.rowSub}>{c.location}</Text>
                    </View>
                    <FollowButton active={followedClubs.has(c.id)} onPress={() => toggleClub(c.id)} t={t} />
                  </Card>
                )}
              />
            )}
            {tab === 'events' && (
              <FlatList
                data={events}
                keyExtractor={ev => String(ev.id)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<EmptyState message={t('events.noMatch')} />}
                renderItem={({ item: ev }) => (
                  <Card style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{ev.name}</Text>
                      <Text style={styles.rowSub}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
                    </View>
                    <FollowButton active={savedEvents.has(ev.id)} onPress={() => toggleEvent(ev.id)} t={t} />
                  </Card>
                )}
              />
            )}
          </>
        )}

        <View style={styles.footer}>
          <Button label={t('onboarding.next')} uppercase={false} onPress={advance} style={styles.button} />
          <Pressable onPress={advance} style={styles.skipLink} hitSlop={8}>
            <Text style={styles.skipLinkText}>{t('onboarding.skip')}</Text>
          </Pressable>
        </View>
      </CenteredColumn>
    </Screen>
  )
}

function FollowButton({ active, onPress, t }: { active: boolean; onPress: () => void; t: (k: 'onboarding.follow' | 'onboarding.following') => string }) {
  return (
    <Pressable onPress={onPress} style={[styles.followButton, active && styles.followButtonActive]}>
      <Text style={[styles.followButtonText, active && styles.followButtonTextActive]}>{t(active ? 'onboarding.following' : 'onboarding.follow')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { padding: 20, paddingTop: 60, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, color: TEXT, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, alignItems: 'center' },
  tabActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  tabLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  tabLabelActive: { color: ON_ACCENT },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowInfo: { flex: 1 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  followButton: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16 },
  followButtonActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  followButtonText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: TEXT, textTransform: 'uppercase' },
  followButtonTextActive: { color: ON_ACCENT },
  footer: { padding: 20, paddingTop: 8, gap: 12 },
  button: {},
  skipLink: { alignSelf: 'center', padding: 4 },
  skipLinkText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
})
