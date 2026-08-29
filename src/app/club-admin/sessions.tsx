import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import DatePickerField from '@/components/DatePickerField'
import { ACCENT, ON_ACCENT, TEXT, CARD, BORDER, MUTED, INPUT_BG, MODAL_SCRIM, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Session = { id: number; discipline: string; location: string; date: string; time: string; weight_range: string; level: string; spots: number; registered_fighters: number; message: string; accepting_requests: number }
type Participant = { club_id: number; club_name: string; fighter_count: number; weight_category: string }

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']
const LEVELS = ['Amateur', 'Intermediate', 'Advanced', 'All Levels']

// `level` stores comma-joined values ("Amateur,Advanced") — a lone value
// (or pre-multi-select legacy data) still parses fine as a 1-item array.
function parseLevels(level: string): string[] {
  return level ? level.split(',').filter(Boolean) : []
}

// Selecting "All Levels" replaces any other selection; picking a specific
// level while "All Levels" is active starts a fresh multi-selection.
function toggleLevel(current: string[], level: string): string[] {
  if (level === 'All Levels') return ['All Levels']
  const base = current.includes('All Levels') ? [] : current
  return base.includes(level) ? base.filter(l => l !== level) : [...base, level]
}

export default function ClubSessionsScreen() {
  return <ErrorBoundary><ClubSessionsInner /></ErrorBoundary>
}

function ClubSessionsInner() {
  const { t } = useLanguage()
  const params = useLocalSearchParams<{ create?: string }>()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [viewingParticipants, setViewingParticipants] = useState<Session | null>(null)

  const load = useCallback(() => {
    apiFetch<{ sessions: Session[] }>('/api/sparring/me').then(r => setSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  // Home's "+Create Sparring" quick action lands here with ?create=1 to open
  // the modal immediately, matching a real one-tap quick action.
  useEffect(() => { if (params.create === '1') setAdding(true) }, [params.create])

  const remove = async (id: number) => {
    try { await apiFetch(`/api/sparring/${id}`, { method: 'DELETE' }); load() } catch { /* ignore */ }
  }

  const toggleAccepting = async (s: Session) => {
    try {
      await apiFetch(`/api/sparring/${s.id}`, { method: 'PATCH', body: JSON.stringify({ acceptingRequests: !s.accepting_requests }) })
      load()
    } catch { /* ignore */ }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.sparring.title')}</Text>
        <Button label={t('club.sparring.add')} onPress={() => setAdding(true)} style={styles.headerButton} />
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
              <View style={styles.cardTop}>
                <Text style={styles.cardDiscipline}>{s.discipline}</Text>
                {!s.accepting_requests && <Text style={styles.closedBadge}>{t('sparring.closed')}</Text>}
              </View>
              <Text style={styles.cardTitle}>{s.location}</Text>
              <Text style={styles.cardMeta}>{formatDisplayDate(s.date)} · {s.time} · {s.weight_range} · {parseLevels(s.level).join(', ')}</Text>
              <Text style={styles.cardMeta}>{s.registered_fighters}/{s.spots === 0 ? t('sparring.unlimited') : s.spots}</Text>
              {!!s.message && <Text style={styles.infoBox}>{s.message}</Text>}
              <View style={styles.actionRow}>
                <Button label={t('club.sparring.participants')} variant="outline" onPress={() => setViewingParticipants(s)} style={styles.actionButton} />
                <Button
                  label={s.accepting_requests ? t('club.sparring.stopRequests') : t('club.sparring.resumeRequests')}
                  variant="outline"
                  onPress={() => toggleAccepting(s)}
                  style={styles.actionButton}
                />
                <Button label={t('common.delete')} variant="ghost" onPress={() => remove(s.id)} style={styles.actionButton} />
              </View>
            </View>
          )}
        />
      )}

      {adding && <AddSessionModal onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); setLoading(true); load() }} />}
      {viewingParticipants && <ParticipantsModal session={viewingParticipants} onClose={() => setViewingParticipants(null)} />}
    </Screen>
  )
}

function AddSessionModal({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [discipline, setDiscipline] = useState(DISCIPLINES[0])
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weightRange, setWeightRange] = useState('')
  const [levels, setLevels] = useState<string[]>(['All Levels'])
  const [spots, setSpots] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!location.trim() || !date.trim() || !time.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    if (levels.length === 0) { setError(t('club.sparring.errorLevel')); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/sparring', {
        method: 'POST',
        body: JSON.stringify({
          discipline, location: location.trim(), date: date.trim(), time: time.trim(),
          weightRange: weightRange.trim(), levels, spots: spots.trim() ? Number(spots) || 0 : 0,
          message: message.trim(),
        }),
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
          <ScrollView>
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
                  <Pressable key={l} onPress={() => setLevels(prev => toggleLevel(prev, l))} style={[styles.pill, levels.includes(l) && styles.pillActive]}>
                    <Text style={[styles.pillLabel, levels.includes(l) && styles.pillLabelActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label={t('club.sparring.spots')}>
              <TextInput style={styles.input} value={spots} onChangeText={setSpots} keyboardType="number-pad" placeholder={t('club.sparring.spotsHint')} placeholderTextColor={MUTED} />
            </Field>
            <Field label={t('club.sparring.message')}>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder={t('club.sparring.messagePlaceholder')}
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={3}
              />
            </Field>

            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
            <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
          </ScrollView>
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
  headerButton: { alignSelf: 'flex-start' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  closedBadge: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  infoBox: { fontFamily: FONT_BODY, fontSize: 12, fontStyle: 'italic', color: MUTED, backgroundColor: INPUT_BG, borderRadius: 4, padding: 10, marginTop: 8 },
  messageInput: { minHeight: 72, textAlignVertical: 'top' },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
  modalOverlay: { flex: 1, backgroundColor: MODAL_SCRIM, alignItems: 'center', justifyContent: 'center', padding: 20 },
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
