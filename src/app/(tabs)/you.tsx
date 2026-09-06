import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { useToast } from '@/lib/toastContext'
import { formatDisplayDate } from '@/lib/date'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import {
  TEXT, ACCENT, ON_ACCENT, CARD, SURFACE, SURFACE_BORDER, MUTED, INPUT_BG, POSITIVE_GREEN, CAUTION_AMBER,
  FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY_MEDIUM, FONT_MONO_MEDIUM, FONT_BODY,
} from '@/theme'

type PublicEvent = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string; fights: number }
type FollowedClub = { id: number; name: string; location: string }
type FollowedFighter = { id: number; name: string; club: string; weight: string }

type MyFighter = { id: number; name: string; weight: string; discipline: string; club: string; club_id: number | null } | null
type ClubOption = { id: number; name: string }
type MyNomination = {
  id: number; status: 'pending' | 'accepted' | 'rejected'; fighter_response: 'accepted' | 'declined' | null
  event_id: number; event_name: string; weight_class_name: string
}
type MyBout = { id: number; event_id: number; event_name: string; event_date: string; weight_class_name: string }

export default function YouScreen() {
  return <ErrorBoundary><YouScreenInner /></ErrorBoundary>
}

// Days/hours until an ISO (YYYY-MM-DD) date, for the Next Bout countdown —
// null for anything else (legacy non-ISO rows, or a date already past),
// so the caller can fall back to a plain "no countdown" treatment instead
// of showing a nonsense negative number.
function countdownTo(isoDate: string): { days: number; hours: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  const target = new Date(`${isoDate}T00:00:00`).getTime()
  const diffMs = target - Date.now()
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / 3_600_000)
  return { days: Math.floor(hours / 24), hours: hours % 24 }
}

function FighterWorklist({ fighter, fighterName, clubOptions, nominations, bouts, loading, onChanged }: {
  fighter: MyFighter; fighterName: string; clubOptions: ClubOption[]; nominations: MyNomination[]; bouts: MyBout[]
  loading: boolean; onChanged: () => void
}) {
  const { t } = useLanguage()
  const [editingClub, setEditingClub] = useState(false)
  const [query, setQuery] = useState(fighter?.club ?? '')
  const [selectedId, setSelectedId] = useState<number | null>(fighter?.club_id ?? null)
  const [weight, setWeight] = useState(fighter?.weight ?? '')
  const [saving, setSaving] = useState(false)
  const [respondingId, setRespondingId] = useState<number | null>(null)

  // `fighter` arrives asynchronously (starts null while /api/fighters/me is
  // still loading) — sync the form fields once the real profile lands,
  // rather than only reading it at first mount.
  useEffect(() => {
    if (!fighter) return
    setQuery(fighter.club)
    setSelectedId(fighter.club_id)
    setWeight(fighter.weight)
  }, [fighter])

  const showClubForm = !fighter || editingClub

  const suggestions = useMemo(() => {
    if (selectedId != null) return []
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return clubOptions.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [clubOptions, query, selectedId])

  const saveProfile = async () => {
    if (selectedId == null || !weight.trim()) return
    setSaving(true)
    try {
      // Payload unchanged — same fields the old form sent.
      if (fighter) {
        await apiFetch(`/api/fighters/${fighter.id}`, { method: 'PATCH', body: JSON.stringify({ clubId: selectedId, weight: weight.trim() }) })
      } else {
        await apiFetch('/api/fighters', { method: 'POST', body: JSON.stringify({ name: fighterName, weight: weight.trim(), clubId: selectedId }) })
      }
      setEditingClub(false)
      onChanged()
    } catch {
      // form stays open so the fighter can retry
    } finally {
      setSaving(false)
    }
  }

  // Unchanged payload — same endpoint, same {response} body as before.
  const respond = async (nominationId: number, response: 'accepted' | 'declined') => {
    setRespondingId(nominationId)
    try {
      await apiFetch(`/api/nominations/${nominationId}/fighter-response`, { method: 'PATCH', body: JSON.stringify({ response }) })
      onChanged()
    } catch {
      // ignore — fighter can retry
    } finally {
      setRespondingId(null)
    }
  }

  if (loading) return <Spinner />

  const nextBout = bouts[0] ?? null
  const countdown = nextBout ? countdownTo(nextBout.event_date) : null

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={styles.card}>
        {!fighter && <Text style={styles.cardHint}>{t('fighterHome.noClubYet')}</Text>}

        {!showClubForm && fighter ? (
          <>
            <View style={styles.profileRow}>
              <View style={styles.profileField}><Text style={styles.profileLabel}>{t('fighterHome.club')}</Text><Text style={styles.profileValue}>{fighter.club}</Text></View>
              <View style={styles.profileField}><Text style={styles.profileLabel}>{t('fighterHome.weightLabel')}</Text><Text style={styles.profileValue}>{fighter.weight}</Text></View>
              <View style={styles.profileField}><Text style={styles.profileLabel}>{t('fighterHome.sport')}</Text><Text style={styles.profileValue}>{fighter.discipline}</Text></View>
            </View>
            <Pressable onPress={() => setEditingClub(true)}><Text style={styles.linkText}>{t('fighterHome.changeClub')}</Text></Pressable>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>{t('fighterHome.chooseClub')}</Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={text => { setQuery(text); setSelectedId(null) }}
              placeholder={t('onboarding.clubJoinPlaceholder')}
              placeholderTextColor={MUTED}
            />
            {suggestions.length > 0 && (
              <View style={styles.dropdown}>
                {suggestions.map((c, i) => (
                  <Pressable key={c.id} style={[styles.option, i === suggestions.length - 1 && styles.optionLast]} onPress={() => { setSelectedId(c.id); setQuery(c.name) }}>
                    <Text style={styles.optionText}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={styles.fieldLabel}>{t('fighterHome.weightLabel')}</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder={t('fighterHome.weightPlaceholder')} placeholderTextColor={MUTED} />
            <Button label={t('fighterHome.saveProfile')} uppercase={false} disabled={saving || selectedId == null || !weight.trim()} onPress={saveProfile} style={{ marginTop: 12 }} />
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('fighterHome.nextBout')}</Text>
      {nextBout ? (
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle} numberOfLines={1}>{nextBout.event_name}</Text>
          <Text style={styles.heroSub}>{formatDisplayDate(nextBout.event_date)} · {nextBout.weight_class_name}</Text>
          {countdown && (
            <Text style={styles.heroCountdown}>{t('fighterHome.daysHours', { days: countdown.days, hours: countdown.hours })}</Text>
          )}
          <Pressable style={styles.heroButton} onPress={() => router.push(`/events/${nextBout.event_id}`)}>
            <Text style={styles.heroButtonText}>{t('fighterHome.toCard')}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('fighterHome.noNextBout')}</Text>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('fighterHome.nominationsTitle')}</Text>
      {nominations.length === 0 ? (
        <Text style={styles.emptyText}>{t('fighterHome.noNominations')}</Text>
      ) : (
        nominations.map(nom => (
          <View key={nom.id} style={styles.row}>
            <Pressable onPress={() => router.push(`/events/${nom.event_id}`)}>
              <Text style={styles.rowTitle} numberOfLines={1}>{nom.event_name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{nom.weight_class_name}</Text>
            </Pressable>
            <Text style={[styles.statusText, { color: nom.status === 'accepted' ? POSITIVE_GREEN : nom.status === 'rejected' ? MUTED : CAUTION_AMBER }]}>
              {nom.status === 'accepted' ? t('fighterHome.statusAccepted') : nom.status === 'rejected' ? t('fighterHome.statusRejected') : t('fighterHome.statusPending')}
            </Text>
            {nom.fighter_response ? (
              <Text style={styles.responseText}>{nom.fighter_response === 'accepted' ? t('fighterHome.responseAccepted') : t('fighterHome.responseDeclined')}</Text>
            ) : (
              <View style={styles.respondRow}>
                <Pressable onPress={() => respond(nom.id, 'accepted')} disabled={respondingId === nom.id} style={styles.acceptBtn}><Text style={styles.acceptBtnText}>{t('fighterHome.accept')}</Text></Pressable>
                <Pressable onPress={() => respond(nom.id, 'declined')} disabled={respondingId === nom.id} style={styles.declineBtn}><Text style={styles.declineBtnText}>{t('fighterHome.decline')}</Text></Pressable>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('fighterHome.myCards')}</Text>
      {bouts.length === 0 ? (
        <Text style={styles.emptyText}>{t('fighterHome.noUpcomingBouts')}</Text>
      ) : (
        bouts.map(b => (
          <Pressable key={b.id} style={styles.row} onPress={() => router.push(`/events/${b.event_id}`)}>
            <Text style={styles.rowTitle} numberOfLines={1}>{b.event_name}</Text>
            <Text style={styles.rowSub} numberOfLines={1}>{formatDisplayDate(b.event_date)} · {b.weight_class_name}</Text>
          </Pressable>
        ))
      )}
    </View>
  )
}

function YouScreenInner() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { showToast } = useToast()
  const [savedEvents, setSavedEvents] = useState<PublicEvent[]>([])
  const [followedFighters, setFollowedFighters] = useState<FollowedFighter[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [loading, setLoading] = useState(true)

  const [myFighter, setMyFighter] = useState<MyFighter>(null)
  const [nominations, setNominations] = useState<MyNomination[]>([])
  const [myBouts, setMyBouts] = useState<MyBout[]>([])
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
  const [fighterLoading, setFighterLoading] = useState(true)

  // Club/organizer accounts have their own dedicated home (/club-admin,
  // /organizer) — (tabs)/_layout.tsx already redirects them away from every
  // viewer tab before this ever mounts, but that's a defensive belt-and-
  // suspenders check here too, since this screen must never try to embed
  // admin content inline.
  useEffect(() => {
    if (user?.role === 'club') router.replace('/club-admin')
    else if (user?.role === 'organizer') router.replace('/organizer')
  }, [user?.role])

  useEffect(() => {
    if (!user || user.role === 'club' || user.role === 'organizer') { setLoading(false); return }
    setLoading(true)
    Promise.all([
      apiFetch<{ events: PublicEvent[] }>('/api/public/events/saved'),
      apiFetch<{ fighters: FollowedFighter[] }>('/api/public/fighters/following'),
      apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following'),
    ])
      .then(([s, f, c]) => { setSavedEvents(s.events); setFollowedFighters(f.fighters); setFollowedClubs(c.clubs) })
      .catch(() => showToast(t('common.loadError')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const refetchFighter = () => {
    setFighterLoading(true)
    Promise.all([
      apiFetch<{ fighter: MyFighter }>('/api/fighters/me'),
      apiFetch<{ nominations: MyNomination[] }>('/api/fighters/me/nominations'),
      apiFetch<{ bouts: MyBout[] }>('/api/fighters/me/bouts'),
    ])
      .then(([f, n, b]) => { setMyFighter(f.fighter); setNominations(n.nominations); setMyBouts(b.bouts) })
      .catch(() => showToast(t('common.loadError')))
      .finally(() => setFighterLoading(false))
  }

  useEffect(() => {
    if (user?.role !== 'fighter') return
    refetchFighter()
    apiFetch<{ clubs: ClubOption[] }>('/api/clubs').then(r => setClubOptions(r.clubs)).catch(() => showToast(t('common.loadError')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  // Redirecting — render nothing viewer-shaped while that happens.
  if (user?.role === 'club' || user?.role === 'organizer') {
    return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.loggedOut}>
          <Text style={styles.loggedOutHeading}>{t('viewerHome.loggedOutHeading')}</Text>
          <View style={styles.loggedOutButtons}>
            <Button label={t('header.logIn')} uppercase={false} onPress={() => router.push({ pathname: '/(auth)/account', params: { mode: 'login' } })} />
            <Button label={t('header.joinPugna')} uppercase={false} variant="outline" onPress={() => router.push({ pathname: '/(auth)/account', params: { mode: 'register' } })} style={{ marginTop: 10 }} />
            <Pressable onPress={() => router.push('/events')} style={styles.guestLink} hitSlop={8}>
              <Text style={styles.guestLinkText}>{t('viewerHome.guestToEvents')}</Text>
            </Pressable>
          </View>
          <View style={styles.legalRow}>
            <Pressable onPress={() => router.push('/impressum')} hitSlop={6}><Text style={styles.legalLink}>Impressum</Text></Pressable>
            <Pressable onPress={() => router.push('/datenschutz')} hitSlop={6}><Text style={styles.legalLink}>Datenschutz</Text></Pressable>
            <Pressable onPress={() => router.push('/nutzung')} hitSlop={6}><Text style={styles.legalLink}>Nutzungsbedingungen</Text></Pressable>
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{t('viewerHome.hey', { name: user.name.split(' ')[0] })}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <Pressable onPress={() => router.push('/settings' as never)} hitSlop={10} style={styles.gearButton}>
            <Icon name="settings" size={20} color={TEXT} />
          </Pressable>
        </View>

        {user.role === 'fighter' && (
          <FighterWorklist
            fighter={myFighter}
            fighterName={user.name}
            clubOptions={clubOptions}
            nominations={nominations}
            bouts={myBouts}
            loading={fighterLoading}
            onChanged={refetchFighter}
          />
        )}

        {user.role === 'viewer' && (
          <>
            <Text style={styles.sectionLabel}>{t('viewerHome.savedEvents')}</Text>
            {loading ? <Spinner /> : savedEvents.length === 0 ? (
              <EmptyState message={t('viewerHome.noSaved')} ctaLabel={t('viewerHome.browseEvents')} onPress={() => router.push('/(tabs)/events')} />
            ) : (
              savedEvents.map(ev => (
                <Pressable key={ev.id} style={styles.row} onPress={() => router.push(`/events/${ev.id}`)}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{ev.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{ev.location}</Text>
                </Pressable>
              ))
            )}

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('viewerHome.fightersYouFollow')}</Text>
            {loading ? null : followedFighters.length === 0 ? (
              <EmptyState message={t('viewerHome.noFightersFollowed')} ctaLabel={t('viewerHome.browseEvents')} onPress={() => router.push('/(tabs)/events')} />
            ) : (
              followedFighters.map(f => (
                <Pressable key={f.id} style={styles.row} onPress={() => router.push(`/fighters/${f.id}`)}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{f.club} · {f.weight}</Text>
                </Pressable>
              ))
            )}

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('viewerHome.clubsYouFollow')}</Text>
            {loading ? null : followedClubs.length === 0 ? (
              <EmptyState message={t('viewerHome.noClubsFollowed')} ctaLabel={t('viewerHome.browseClubs')} onPress={() => router.push('/(tabs)/clubs')} />
            ) : (
              followedClubs.map(c => (
                <Pressable key={c.id} style={styles.row} onPress={() => router.push(`/clubs/${c.id}`)}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{c.location}</Text>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loggedOut: { flex: 1, padding: 28, paddingTop: 60 },
  loggedOutHeading: { fontFamily: FONT_DISPLAY, fontSize: 34, color: TEXT, marginBottom: 28 },
  loggedOutButtons: { gap: 0 },
  guestLink: { alignSelf: 'center', padding: 10, marginTop: 18 },
  guestLinkText: { fontFamily: FONT_BODY_MEDIUM, fontSize: 14, color: MUTED },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 'auto', paddingBottom: 20 },
  legalLink: { fontFamily: FONT_BODY, fontSize: 11.5, color: MUTED },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 24, color: TEXT },
  email: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 4 },
  gearButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: SURFACE_BORDER, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase', marginBottom: 12 },
  row: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 8 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED, marginTop: 3 },

  heroCard: { backgroundColor: CARD, borderRadius: 18, padding: 18 },
  heroTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, color: TEXT },
  heroSub: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11.5, letterSpacing: 0.3, color: MUTED, textTransform: 'uppercase', marginTop: 6 },
  heroCountdown: { fontFamily: FONT_DISPLAY, fontSize: 28, color: ACCENT, marginTop: 14, letterSpacing: -0.5 },
  heroButton: { marginTop: 16, height: 48, borderRadius: 13, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  heroButtonText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14.5, color: ON_ACCENT },

  card: { backgroundColor: CARD, borderRadius: 18, padding: 18 },
  cardHint: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 18 },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 12 },
  profileField: {},
  profileLabel: { fontFamily: FONT_MONO_MEDIUM, fontSize: 10, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  profileValue: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, marginTop: 3 },
  linkText: { fontFamily: FONT_BODY_MEDIUM, fontSize: 13, color: TEXT, textDecorationLine: 'underline' },
  fieldLabel: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: SURFACE_BORDER, color: TEXT, padding: 12, fontFamily: FONT_BODY, fontSize: 14, borderRadius: 12 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  option: { padding: 10, borderBottomWidth: 1, borderBottomColor: SURFACE_BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED, marginBottom: 8 },
  statusText: { fontFamily: FONT_MONO_MEDIUM, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 8 },
  responseText: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 6 },
  respondRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: { backgroundColor: ACCENT, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 18 },
  acceptBtnText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: ON_ACCENT },
  declineBtn: { borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 18 },
  declineBtnText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: TEXT },
})
