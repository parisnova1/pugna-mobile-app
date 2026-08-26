import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import DatePickerField from '@/components/DatePickerField'
import { ACCENT, ON_ACCENT, TEXT, CARD, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Session = { id: number; discipline: string; location: string; date: string; time: string; weight_range: string; level: string; spots: number; registered_fighters: number }
type OtherSession = Session & { club_id: number; host_name: string }
type Participant = { club_id: number; club_name: string; fighter_count: number; weight_category: string }

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']
const LEVELS = ['Amateur', 'Intermediate', 'Advanced', 'All Levels']

// RN Web has no native alert dialog implementation — Alert.alert silently
// no-ops there, so joining would otherwise give zero feedback on web.
function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`)
  else Alert.alert(title, message)
}

export default function ClubSparringScreen() {
  return <ErrorBoundary><ClubSparringInner /></ErrorBoundary>
}

function ClubSparringInner() {
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [viewingParticipants, setViewingParticipants] = useState<Session | null>(null)
  const [browsing, setBrowsing] = useState(false)
  const [ownClubId, setOwnClubId] = useState<number | null>(null)

  const load = useCallback(() => {
    apiFetch<{ sessions: Session[] }>('/api/sparring/me').then(r => setSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { apiFetch<{ club: { id: number } }>('/api/clubs/me').then(r => setOwnClubId(r.club.id)).catch(() => {}) }, [])

  const remove = async (id: number) => {
    try { await apiFetch(`/api/sparring/${id}`, { method: 'DELETE' }); load() } catch { /* ignore */ }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.sparring.title')}</Text>
        <View style={styles.headerButtons}>
          <Button label={t('club.sparring.add')} onPress={() => setAdding(true)} style={styles.headerButton} />
          <Button label={t('sparring.join')} variant="outline" onPress={() => setBrowsing(true)} style={styles.headerButton} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => String(s.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('club.sparring.none')} ctaLabel={t('club.sparring.add')} onPress={() => setAdding(true)} />}
          renderItem={({ item: s }) => (
            <View style={styles.card}>
              <Text style={styles.cardDiscipline}>{s.discipline}</Text>
              <Text style={styles.cardTitle}>{s.location}</Text>
              <Text style={styles.cardMeta}>{formatDisplayDate(s.date)} · {s.time} · {s.weight_range} · {s.level}</Text>
              <Text style={styles.cardMeta}>{s.registered_fighters}/{s.spots}</Text>
              <View style={styles.actionRow}>
                <Button label={t('club.sparring.participants')} variant="outline" onPress={() => setViewingParticipants(s)} style={styles.actionButton} />
                <Button label={t('common.delete')} variant="ghost" onPress={() => remove(s.id)} style={styles.actionButton} />
              </View>
            </View>
          )}
        />
      )}

      {adding && <AddSessionModal onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); setLoading(true); load() }} />}
      {viewingParticipants && <ParticipantsModal session={viewingParticipants} onClose={() => setViewingParticipants(null)} />}
      {browsing && <BrowseSparringModal ownClubId={ownClubId} onClose={() => setBrowsing(false)} />}
    </Screen>
  )
}

function BrowseSparringModal({ ownClubId, onClose }: { ownClubId: number | null; onClose: () => void }) {
  const { t } = useLanguage()
  const [otherSessions, setOtherSessions] = useState<OtherSession[]>([])
  const [loading, setLoading] = useState(true)
  const [joinTarget, setJoinTarget] = useState<OtherSession | null>(null)

  const load = useCallback(() => {
    apiFetch<{ sessions: OtherSession[] }>('/api/sparring').then(r => setOtherSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const browseSessions = otherSessions.filter(s => s.club_id !== ownClubId)

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('club.sparring.browseTitle')}</Text>

          {loading ? (
            <View style={styles.centerFill}><Spinner /></View>
          ) : browseSessions.length === 0 ? (
            <Text style={styles.emptyText}>{t('club.sparring.browseNone')}</Text>
          ) : (
            <ScrollView style={styles.browseScroll}>
              <View style={{ gap: 12 }}>
                {browseSessions.map(s => {
                  const remaining = Math.max(0, s.spots - s.registered_fighters)
                  return (
                    <View key={s.id} style={styles.card}>
                      <View style={styles.cardTop}>
                        <Text style={styles.cardDiscipline}>{s.discipline}</Text>
                        <Text style={[styles.spotsText, { color: remaining > 0 ? TEXT : MUTED }]}>
                          {remaining > 0 ? `${remaining} ${t('sparring.spotsLeft')}` : t('sparring.full')}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle}>{s.location}</Text>
                      <Text style={styles.cardMeta}>{formatDisplayDate(s.date)} · {s.time} · {s.weight_range} · {s.level}</Text>
                      <Text style={styles.cardMeta}>{t('sparring.hostedBy')} {s.host_name}</Text>
                      <Button
                        label={remaining === 0 ? t('sparring.full') : t('sparring.join')}
                        variant="outline"
                        disabled={remaining === 0}
                        onPress={() => setJoinTarget(s)}
                        style={{ marginTop: 12 }}
                      />
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          )}

          <Button label={t('common.close')} variant="ghost" onPress={onClose} style={{ marginTop: 12 }} />
        </Pressable>
      </Pressable>

      {joinTarget && (
        <JoinSparringModal
          session={joinTarget}
          onCancel={() => setJoinTarget(null)}
          onJoined={() => { setJoinTarget(null); setLoading(true); load() }}
        />
      )}
    </Modal>
  )
}

function JoinSparringModal({ session, onCancel, onJoined }: { session: OtherSession; onCancel: () => void; onJoined: () => void }) {
  const { t } = useLanguage()
  const [fighterCount, setFighterCount] = useState('1')
  const [weightCategory, setWeightCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!weightCategory.trim()) { setError(t('sparring.errorWeightCategory')); return }
    setError(null)
    setSaving(true)
    try {
      await apiFetch(`/api/sparring/${session.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ fighterCount: Number(fighterCount) || 1, weightCategory: weightCategory.trim() }),
      })
      notify(t('sparring.join'), t('sparring.joinSuccess', { location: session.location }))
      onJoined()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sparring.errorJoin'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('sparring.join')}</Text>
          <Text style={styles.cardMeta}>{session.host_name} · {session.location} · {formatDisplayDate(session.date)} · {session.time}</Text>

          <Field label={t('sparring.numberOfFighters')}><TextInput style={styles.input} value={fighterCount} onChangeText={setFighterCount} keyboardType="number-pad" /></Field>
          <Field label={t('sparring.weightCategory')}><TextInput style={styles.input} value={weightCategory} onChangeText={setWeightCategory} placeholder="70-80 KG" placeholderTextColor={MUTED} /></Field>

          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('sparring.joining') : t('common.confirm')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function AddSessionModal({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [discipline, setDiscipline] = useState(DISCIPLINES[0])
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weightRange, setWeightRange] = useState('')
  const [level, setLevel] = useState(LEVELS[0])
  const [spots, setSpots] = useState('4')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!location.trim() || !date.trim() || !time.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/sparring', {
        method: 'POST',
        body: JSON.stringify({ discipline, location: location.trim(), date: date.trim(), time: time.trim(), weightRange: weightRange.trim(), level, spots: Number(spots) || 1 }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('club.sparring.add')}</Text>

          <Field label={t('club.sparring.discipline')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DISCIPLINES.map(d => (
                <Pressable key={d} onPress={() => setDiscipline(d)} style={[styles.pill, discipline === d && styles.pillActive]}>
                  <Text style={[styles.pillLabel, discipline === d && styles.pillLabelActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label={t('club.sparring.location')}><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholderTextColor={MUTED} /></Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label={t('club.sparring.date')}><DatePickerField value={date} onChange={setDate} placeholder={t('club.sparring.datePlaceholder')} /></Field></View>
            <View style={{ flex: 1 }}><Field label={t('club.sparring.time')}><TextInput style={styles.input} value={time} onChangeText={setTime} placeholder={t('club.sparring.timePlaceholder')} placeholderTextColor={MUTED} /></Field></View>
          </View>
          <Field label={t('club.sparring.weightRange')}><TextInput style={styles.input} value={weightRange} onChangeText={setWeightRange} placeholder="70-80 KG" placeholderTextColor={MUTED} /></Field>
          <Field label={t('club.sparring.level')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEVELS.map(l => (
                <Pressable key={l} onPress={() => setLevel(l)} style={[styles.pill, level === l && styles.pillActive]}>
                  <Text style={[styles.pillLabel, level === l && styles.pillLabelActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label={t('club.sparring.spots')}><TextInput style={styles.input} value={spots} onChangeText={setSpots} keyboardType="number-pad" /></Field>

          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function ParticipantsModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t } = useLanguage()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ participants: Participant[] }>(`/api/sparring/${session.id}/participants`)
      .then(r => setParticipants(r.participants))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.id])

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('club.sparring.participants')}</Text>
          {loading ? <Spinner /> : participants.length === 0 ? (
            <Text style={styles.emptyText}>{t('club.sparring.noParticipants')}</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {participants.map(p => (
                <View key={p.club_id} style={styles.participantRow}>
                  <Text style={styles.rowTitle}>{p.club_name}</Text>
                  <Text style={styles.cardMeta}>{t('club.sparring.fighterCount', { count: p.fighter_count })} · {p.weight_category}</Text>
                </View>
              ))}
            </View>
          )}
          <Button label={t('common.close')} variant="ghost" onPress={onClose} style={{ marginTop: 12 }} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 14 }}><Text style={styles.label}>{label}</Text>{children}</View>
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButton: { alignSelf: 'flex-start' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  spotsText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
  browseScroll: { maxHeight: 420 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
  emptyText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  participantRow: { backgroundColor: INPUT_BG, borderRadius: 4, padding: 12 },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT, textTransform: 'uppercase' },
})
