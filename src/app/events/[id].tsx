import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Share, Linking, Alert, Modal, TextInput } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Calendar from 'expo-calendar'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { subscribeToEvent } from '@/lib/ws'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import BracketView, { type Bout } from '@/components/Bracket'
import DaySwitcher, { type EventDay } from '@/components/DaySwitcher'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ACCENT, ON_ACCENT, TEXT, CARD, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type EventInfo = {
  id: number; name: string; date: string; location: string; venue: string; discipline: string; status: string
  format: 'bracket' | 'card'; livestream_url: string; qr_token: string; fights: number; fighters: number; views: number; organizer_name: string
  current_bout_id: number | null
}
type LiveBout = { id: number; weight_class_id: number; fighterRed: { name: string } | null; fighterBlue: { name: string } | null; status: string }
type WeightClass = { id: number; name: string; age_group: string; gender: string; rounds_count: number; round_minutes: number; rest_minutes: number; status?: string }
type EventFighter = { id: number; name: string; club: string; weight: string; record: string; weight_class_id: number | null }
type CardBoutPublic = { id: number; fighter_a_name: string; fighter_a_record: string; fighter_b_name: string; fighter_b_record: string; weight_class_text: string; card_position: 'main' | 'co-main' | 'undercard'; rounds: number | null }

type Tab = 'overview' | 'fightcard' | 'fighters'

export default function EventDetailScreen() {
  return <ErrorBoundary><EventDetailScreenInner /></ErrorBoundary>
}

function EventDetailScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<Tab>('overview')
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<EventFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [nominating, setNominating] = useState(false)
  const [muted, setMuted] = useState(false)
  const [muteBusy, setMuteBusy] = useState(false)
  const [liveBout, setLiveBout] = useState<LiveBout | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch<{ event: EventInfo; weightClasses: WeightClass[] }>(`/api/public/events/${id}`),
      apiFetch<{ fighters: EventFighter[] }>(`/api/public/events/${id}/fighters`),
    ])
      .then(([detail, f]) => { setEvent(detail.event); setWeightClasses(detail.weightClasses); setFighters(f.fighters) })
      .catch(err => setError(err instanceof Error ? err.message : t('eventDetail.notFoundBody')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ events: { id: number }[] }>('/api/public/events/saved')
      .then(r => setSaved(r.events.some(e => e.id === Number(id))))
      .catch(() => {})
  }, [id, user?.role])

  useEffect(() => {
    if (!user) return
    apiFetch<{ eventIds: number[] }>('/api/public/events/muted')
      .then(r => setMuted(r.eventIds.includes(Number(id))))
      .catch(() => {})
  }, [id, user])

  useEffect(() => {
    if (!event?.current_bout_id) { setLiveBout(null); return }
    apiFetch<{ bout: LiveBout }>(`/api/public/bouts/${event.current_bout_id}`)
      .then(r => setLiveBout(r.bout))
      .catch(() => setLiveBout(null))
  }, [event?.current_bout_id])

  useEffect(() => {
    if (!event?.qr_token) return
    const unsubscribe = subscribeToEvent(event.qr_token, msg => {
      if (msg.type === 'bout:live') {
        setEvent(prev => (prev ? { ...prev, current_bout_id: msg.boutId } : prev))
      }
      if (msg.type === 'bout:result' && msg.boutId === event.current_bout_id) {
        setEvent(prev => (prev ? { ...prev, current_bout_id: null } : prev))
      }
    })
    return unsubscribe
  }, [event?.qr_token, event?.current_bout_id])

  const toggleMute = async () => {
    setMuteBusy(true)
    try {
      if (muted) { await apiFetch(`/api/public/events/${id}/mute`, { method: 'DELETE' }); setMuted(false) }
      else { await apiFetch(`/api/public/events/${id}/mute`, { method: 'POST' }); setMuted(true) }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setMuteBusy(false)
    }
  }

  const toggleSave = async () => {
    setSaveBusy(true)
    try {
      if (saved) { await apiFetch(`/api/public/events/${id}/save`, { method: 'DELETE' }); setSaved(false) }
      else { await apiFetch(`/api/public/events/${id}/save`, { method: 'POST' }); setSaved(true) }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setSaveBusy(false)
    }
  }

  const handleShare = async () => {
    if (!event) return
    try {
      await Share.share({ message: `${event.name} — pugna.app/events/${event.id}` })
    } catch {
      /* user dismissed the native share sheet — no-op */
    }
  }

  const handleAddToCalendar = async () => {
    if (!event) return
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.date)
    if (!match) return
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('eventDetail.addToCalendar'), 'Calendar permission is required.')
      return
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    const defaultCalendar = calendars.find(c => c.allowsModifications) ?? calendars[0]
    if (!defaultCalendar) return
    const [, y, m, d] = match
    const start = new Date(Number(y), Number(m) - 1, Number(d))
    const end = new Date(Number(y), Number(m) - 1, Number(d) + 1)
    try {
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.name,
        startDate: start,
        endDate: end,
        allDay: true,
        location: [event.venue, event.location].filter(Boolean).join(', '),
        notes: `${event.discipline} · ${event.organizer_name}`,
      })
      Alert.alert(t('eventDetail.addToCalendar'), 'Added to your calendar.')
    } catch {
      Alert.alert(t('eventDetail.addToCalendar'), 'Could not add this event to your calendar.')
    }
  }

  if (loading) return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>
  if (error || !event) {
    return (
      <Screen>
        <View style={styles.centerFill}>
          <Text style={styles.notFoundTitle}>{t('eventDetail.notFoundTitle')}</Text>
          <Text style={styles.notFoundBody}>{error || t('eventDetail.notFoundBody')}</Text>
        </View>
      </Screen>
    )
  }

  const tabs: Tab[] = event.format === 'card' ? ['overview', 'fightcard'] : ['overview', 'fightcard', 'fighters']

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[2]}>
        <BackButton />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{event.discipline} · {formatDisplayDate(event.date)}</Text>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.venue}>{event.venue ? `${event.venue}, ${event.location}` : event.location}</Text>
          <Text style={styles.organizer}>{event.organizer_name}</Text>

          <View style={styles.actionRow}>
            {user?.role === 'viewer' && (
              <ActionButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? t('eventDetail.saved') : t('eventDetail.save')} active={saved} disabled={saveBusy} onPress={toggleSave} />
            )}
            <ActionButton icon="share-outline" label={t('eventDetail.share')} onPress={handleShare} />
            <ActionButton icon="calendar-outline" label={t('eventDetail.addToCalendar')} onPress={handleAddToCalendar} />
            {!!event.livestream_url && (
              <ActionButton icon="radio-outline" label={t('eventDetail.watchLive')} onPress={() => Linking.openURL(event.livestream_url)} />
            )}
            {user?.role === 'club' && event.status === 'Open' && event.format === 'bracket' && (
              <ActionButton icon="person-add-outline" label={t('eventDetail.nominate')} onPress={() => setNominating(true)} />
            )}
            {!!user && (
              <ActionButton icon={muted ? 'notifications-off-outline' : 'notifications-outline'} label={muted ? t('eventDetail.unmute') : t('eventDetail.mute')} disabled={muteBusy} onPress={toggleMute} />
            )}
          </View>

          {liveBout && (
            <View style={styles.liveCard}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>{t('eventDetail.liveNow')}</Text>
              <Text style={styles.liveFighters}>
                {liveBout.fighterRed?.name ?? '?'} <Text style={styles.liveVs}>vs</Text> {liveBout.fighterBlue?.name ?? '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tk => (
            <Pressable key={tk} onPress={() => setTab(tk)} style={styles.tabButton}>
              <Text style={[styles.tabLabel, tab === tk && styles.tabLabelActive]}>
                {t(tk === 'overview' ? 'eventDetail.tab.overview' : tk === 'fightcard' ? 'eventDetail.tab.fightCard' : 'eventDetail.tab.fighters')}
              </Text>
              {tab === tk && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'overview' && <OverviewTab event={event} weightClasses={weightClasses} />}
          {tab === 'fightcard' && (
            event.format === 'card'
              ? <CardFightCardTab eventId={String(id)} />
              : <FightCardTab eventId={String(id)} weightClasses={weightClasses} fighters={fighters} qrToken={event.qr_token} />
          )}
          {tab === 'fighters' && <FightersTab fighters={fighters} />}
        </View>
      </ScrollView>

      {nominating && (
        <NominateModal eventId={String(id)} weightClasses={weightClasses} onCancel={() => setNominating(false)} onSent={() => setNominating(false)} />
      )}
    </Screen>
  )
}

function ActionButton({ icon, label, active, disabled, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.actionButton, active && styles.actionButtonActive, disabled && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={14} color={active ? ON_ACCENT : TEXT} />
      <Text style={[styles.actionLabel, active && { color: ON_ACCENT }]}>{label}</Text>
    </Pressable>
  )
}

function OverviewTab({ event, weightClasses }: { event: EventInfo; weightClasses: WeightClass[] }) {
  const { t } = useLanguage()
  const rows: Array<[string, string]> = [
    [t('eventDetail.date'), formatDisplayDate(event.date)],
    [t('eventDetail.location'), event.location],
    ...(event.venue ? [[t('eventDetail.venue'), event.venue] as [string, string]] : []),
    [t('eventDetail.organizer'), event.organizer_name],
    [t('eventDetail.discipline'), event.discipline],
    ...(event.format === 'bracket' ? [[t('eventDetail.weightClasses'), String(weightClasses.length)] as [string, string]] : []),
    [t('eventDetail.views'), String(event.views)],
  ]
  const suffix = event.format === 'bracket' && weightClasses.length > 0
    ? t(weightClasses.length === 1 ? 'eventDetail.weightClassesSuffixOne' : 'eventDetail.weightClassesSuffixMany', { count: weightClasses.length })
    : ''

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('eventDetail.about')}</Text>
      <Text style={styles.aboutBody}>
        {t('eventDetail.aboutBody', { discipline: event.discipline.toLowerCase(), organizer: event.organizer_name, location: event.location, date: formatDisplayDate(event.date) })}
        {suffix}
      </Text>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsHeader}>{t('eventDetail.details')}</Text>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.detailRow}>
            <Text style={styles.detailKey}>{k}</Text>
            <Text style={styles.detailValue}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function FightCardTab({ eventId, weightClasses, fighters, qrToken }: { eventId: string; weightClasses: WeightClass[]; fighters: EventFighter[]; qrToken: string }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<number | null>(weightClasses[0]?.id ?? null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState<EventDay[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const fightersById = Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }]))

  const loadBouts = useCallback((weightClassId: number) => {
    setLoading(true)
    apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${weightClassId}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setBouts([]); return }
    loadBouts(selected)
  }, [selected, loadBouts])

  useEffect(() => {
    apiFetch<{ days: EventDay[] }>(`/api/public/events/${eventId}/days`)
      .then(r => { setDays(r.days); setSelectedDay(r.days.find(d => d.status === 'live')?.id ?? r.days[0]?.id ?? null) })
      .catch(() => setDays([]))
  }, [eventId])

  useEffect(() => {
    if (!qrToken) return
    const unsubscribe = subscribeToEvent(qrToken, msg => {
      if (msg.type === 'bracket:update' && msg.weightClassId === selected) {
        apiFetch<{ bouts: Bout[] }>(`/api/public/weight-classes/${msg.weightClassId}/bracket`).then(r => setBouts(r.bouts)).catch(() => {})
      }
    })
    return unsubscribe
  }, [qrToken, selected])

  if (weightClasses.length === 0) {
    return <Text style={styles.emptyBox}>{t('eventDetail.noFightCard')}</Text>
  }

  const visibleBouts = selectedDay ? bouts.filter(b => b.event_day_id === selectedDay) : bouts

  return (
    <View>
      {days.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <DaySwitcher days={days} selectedId={selectedDay} onSelect={setSelectedDay} />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {weightClasses.map(wc => (
          <Pressable key={wc.id} onPress={() => setSelected(wc.id)} style={[styles.pill, selected === wc.id && styles.pillActive]}>
            <Text style={[styles.pillLabel, selected === wc.id && styles.pillLabelActive]}>{wc.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? <Spinner /> : <BracketView bouts={visibleBouts} fighters={fightersById} />}
    </View>
  )
}

function CardFightCardTab({ eventId }: { eventId: string }) {
  const { t } = useLanguage()
  const CARD_POSITION_LABELS: Record<CardBoutPublic['card_position'], string> = {
    main: t('eventDetail.mainEvent'), 'co-main': t('eventDetail.coMain'), undercard: t('eventDetail.undercard'),
  }
  const [bouts, setBouts] = useState<CardBoutPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<{ bouts: CardBoutPublic[] }>(`/api/public/events/${eventId}/card-bouts`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) return <Spinner />
  if (bouts.length === 0) return <Text style={styles.emptyBox}>{t('eventDetail.noFightCard')}</Text>

  return (
    <View style={{ gap: 10 }}>
      {bouts.map(b => (
        <View key={b.id} style={styles.boutCard}>
          <View style={styles.boutTop}>
            <View style={[styles.positionTag, b.card_position === 'main' && { borderColor: ACCENT }]}>
              <Text style={[styles.positionTagText, b.card_position === 'main' && { color: ACCENT }]}>{CARD_POSITION_LABELS[b.card_position]}</Text>
            </View>
            <Text style={styles.boutMeta}>{[b.weight_class_text, b.rounds ? `${b.rounds} ${t('eventDetail.rounds')}` : null].filter(Boolean).join(' · ')}</Text>
          </View>
          <View style={styles.matchupRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fighterName}>{b.fighter_a_name}</Text>
              <Text style={styles.fighterRecord}>{b.fighter_a_record}</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fighterName}>{b.fighter_b_name}</Text>
              <Text style={styles.fighterRecord}>{b.fighter_b_record}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

function FightersTab({ fighters }: { fighters: EventFighter[] }) {
  const { t } = useLanguage()
  if (fighters.length === 0) return <Text style={styles.emptyBox}>{t('eventDetail.noFighters')}</Text>

  return (
    <View style={{ gap: 8 }}>
      {fighters.map(f => (
        <Pressable key={f.id} style={styles.fighterRow} onPress={() => router.push(`/fighters/${f.id}`)}>
          <Text style={styles.fighterRowName}>{f.name}</Text>
          <Text style={styles.fighterRowMeta}>{f.club} · {f.weight}</Text>
          <Text style={styles.fighterRowRecord}>{f.record}</Text>
        </Pressable>
      ))}
    </View>
  )
}

type ClubRosterFighter = { id: number; name: string; weight: string; record: string }

function NominateModal({ eventId, weightClasses, onCancel, onSent }: { eventId: string; weightClasses: WeightClass[]; onCancel: () => void; onSent: () => void }) {
  const { t } = useLanguage()
  const openClasses = weightClasses.filter(wc => (wc.status ?? 'open') === 'open')
  const [rosterFighters, setRosterFighters] = useState<ClubRosterFighter[] | null>(null)
  const [weightClassId, setWeightClassId] = useState<number | null>(openClasses[0]?.id ?? null)
  const [fighterId, setFighterId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ fighters: ClubRosterFighter[] }>(`/api/events/${eventId}/available-club-fighters`)
      .then(r => { setRosterFighters(r.fighters); setFighterId(r.fighters[0]?.id ?? null) })
      .catch(() => setRosterFighters([]))
  }, [eventId])

  const submit = async () => {
    if (!weightClassId || !fighterId) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/weight-classes/${weightClassId}/nominations`, {
        method: 'POST',
        body: JSON.stringify({ fighterId, note: note.trim() }),
      })
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={modalStyles.overlay} onPress={onCancel}>
        <Pressable style={modalStyles.card} onPress={e => e.stopPropagation()}>
          <Text style={modalStyles.title}>{t('eventDetail.nominateTitle')}</Text>

          {openClasses.length === 0 ? (
            <Text style={modalStyles.emptyText}>{t('eventDetail.nominateNoClasses')}</Text>
          ) : (
            <>
              <Text style={modalStyles.label}>{t('eventDetail.nominateWeightClass')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {openClasses.map(wc => (
                  <Pressable key={wc.id} onPress={() => setWeightClassId(wc.id)} style={[modalStyles.pill, weightClassId === wc.id && modalStyles.pillActive]}>
                    <Text style={[modalStyles.pillLabel, weightClassId === wc.id && modalStyles.pillLabelActive]}>{wc.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={modalStyles.label}>{t('eventDetail.nominateFighter')}</Text>
              {rosterFighters === null ? (
                <Spinner />
              ) : rosterFighters.length === 0 ? (
                <Text style={modalStyles.emptyText}>{t('eventDetail.nominateNoFighters')}</Text>
              ) : (
                <View style={{ gap: 6, marginBottom: 14 }}>
                  {rosterFighters.map(f => (
                    <Pressable key={f.id} onPress={() => setFighterId(f.id)} style={[modalStyles.row, fighterId === f.id && { borderColor: ACCENT }]}>
                      <Text style={modalStyles.rowTitle}>{f.name}</Text>
                      <Text style={modalStyles.rowMeta}>{f.weight} · {f.record}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={modalStyles.label}>{t('eventDetail.nominateNote')}</Text>
              <TextInput style={modalStyles.input} value={note} onChangeText={setNote} placeholderTextColor={MUTED} multiline numberOfLines={2} />

              {error && <Text style={modalStyles.errorText}>{error}</Text>}
              <Button
                label={saving ? t('login.pleaseWait') : t('eventDetail.nominate')}
                onPress={submit}
                disabled={saving || !weightClassId || !fighterId || (rosterFighters?.length ?? 0) === 0}
                style={{ marginTop: 8 }}
              />
            </>
          )}
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 14 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 12 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: TEXT, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  row: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 12 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14, marginBottom: 14, minHeight: 60, textAlignVertical: 'top' },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundTitle: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT, marginBottom: 8 },
  notFoundBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  scroll: { paddingBottom: 40 },
  hero: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, lineHeight: 30, marginBottom: 8 },
  venue: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  organizer: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginTop: 2 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  actionButtonActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  actionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: TEXT, textTransform: 'uppercase' },
  liveCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CARD, borderWidth: 1, borderColor: ACCENT, borderRadius: 4, padding: 14, marginTop: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  liveLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase' },
  liveFighters: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT, textTransform: 'uppercase', flex: 1, textAlign: 'right' },
  liveVs: { color: MUTED },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: BG, paddingHorizontal: 12 },
  tabButton: { paddingVertical: 14, paddingHorizontal: 12 },
  tabLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  tabLabelActive: { color: TEXT },
  tabIndicator: { height: 2, backgroundColor: ACCENT, marginTop: 8, borderRadius: 1 },
  tabContent: { padding: 20 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 10 },
  aboutBody: { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 22, color: MUTED, marginBottom: 24 },
  detailsCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4 },
  detailsHeader: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailKey: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  detailValue: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT, textTransform: 'uppercase' },
  emptyBox: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, textAlign: 'center', fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: MUTED, textTransform: 'uppercase' },
  pillRow: { gap: 8, marginBottom: 20 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 9, paddingHorizontal: 16 },
  pillActive: { backgroundColor: CARD, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: TEXT },
  boutCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 18 },
  boutTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  positionTag: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10 },
  positionTagText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase' },
  boutMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, color: MUTED, textTransform: 'uppercase' },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fighterName: { fontFamily: FONT_DISPLAY, fontSize: 17, textTransform: 'uppercase', color: TEXT, lineHeight: 19 },
  fighterRecord: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 3 },
  vs: { fontFamily: FONT_DISPLAY, fontSize: 16, color: ACCENT },
  fighterRow: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  fighterRowName: { fontFamily: FONT_DISPLAY, fontSize: 17, textTransform: 'uppercase', color: TEXT },
  fighterRowMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginTop: 3 },
  fighterRowRecord: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 6 },
})
