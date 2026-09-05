import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatDisplayDate } from '@/lib/date'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { TEXT, CARD, BORDER, MUTED, INPUT_BG, POSITIVE_GREEN, CAUTION_AMBER, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

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

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionLabel}>{t('fighterHome.profileTitle')}</Text>
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

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('fighterHome.upcomingBoutsTitle')}</Text>
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
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [savedEvents, setSavedEvents] = useState<PublicEvent[]>([])
  const [followedFighters, setFollowedFighters] = useState<FollowedFighter[]>([])
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([])
  const [loading, setLoading] = useState(true)

  const [myFighter, setMyFighter] = useState<MyFighter>(null)
  const [nominations, setNominations] = useState<MyNomination[]>([])
  const [myBouts, setMyBouts] = useState<MyBout[]>([])
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
  const [fighterLoading, setFighterLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      apiFetch<{ events: PublicEvent[] }>('/api/public/events/saved'),
      apiFetch<{ fighters: FollowedFighter[] }>('/api/public/fighters/following'),
      apiFetch<{ clubs: FollowedClub[] }>('/api/clubs/following'),
    ])
      .then(([s, f, c]) => { setSavedEvents(s.events); setFollowedFighters(f.fighters); setFollowedClubs(c.clubs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const refetchFighter = () => {
    setFighterLoading(true)
    Promise.all([
      apiFetch<{ fighter: MyFighter }>('/api/fighters/me'),
      apiFetch<{ nominations: MyNomination[] }>('/api/fighters/me/nominations'),
      apiFetch<{ bouts: MyBout[] }>('/api/fighters/me/bouts'),
    ])
      .then(([f, n, b]) => { setMyFighter(f.fighter); setNominations(n.nominations); setMyBouts(b.bouts) })
      .catch(() => {})
      .finally(() => setFighterLoading(false))
  }

  useEffect(() => {
    if (user?.role !== 'fighter') return
    refetchFighter()
    apiFetch<{ clubs: ClubOption[] }>('/api/clubs').then(r => setClubOptions(r.clubs)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  if (!user) {
    return (
      <Screen>
        <View style={styles.loggedOut}>
          <Text style={styles.loggedOutTitle}>{t('viewerHome.loggedOutTitle')}</Text>
          <Text style={styles.loggedOutBody}>{t('viewerHome.loggedOutSubtitle')}</Text>
          <Button label={t('header.logIn')} onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20 }} />
          <Button label={t('header.joinPugna')} variant="outline" onPress={() => router.push('/(auth)/signup')} style={{ marginTop: 12 }} />
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
          <Pressable onPress={() => logout()} hitSlop={10}>
            <Icon name="logout" size={22} color={MUTED} />
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
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  loggedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutTitle: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, textAlign: 'center', marginBottom: 8 },
  loggedOutBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT },
  email: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 4 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 12 },
  row: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, marginBottom: 8 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },

  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16 },
  cardHint: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 18 },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 12 },
  profileField: {},
  profileLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  profileValue: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, marginTop: 2 },
  linkText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: TEXT, textDecorationLine: 'underline' },
  fieldLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, fontFamily: FONT_BODY, fontSize: 14, borderRadius: 8 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  option: { padding: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 8 },
  statusText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  responseText: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 6, textTransform: 'uppercase' },
  respondRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: { backgroundColor: POSITIVE_GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  acceptBtnText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, color: '#fff', textTransform: 'uppercase' },
  declineBtn: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  declineBtnText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, color: TEXT, textTransform: 'uppercase' },
})
