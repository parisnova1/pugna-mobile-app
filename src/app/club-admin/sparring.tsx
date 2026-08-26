import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal, Alert, Platform } from 'react-native'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { TEXT, CARD, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type OtherSession = {
  id: number; club_id: number; host_name: string; discipline: string; location: string; date: string; time: string
  weight_range: string; level: string; spots: number; registered_fighters: number; message: string; accepting_requests: number
}

// `level` stores comma-joined values ("Amateur,Advanced") — a lone value
// (or pre-multi-select legacy data) still parses fine as a 1-item array.
function parseLevels(level: string): string[] {
  return level ? level.split(',').filter(Boolean) : []
}

// RN Web has no native alert dialog implementation — Alert.alert silently
// no-ops there, so joining would otherwise give zero feedback on web.
function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`)
  else Alert.alert(title, message)
}

export default function ClubBrowseSparringScreen() {
  return <ErrorBoundary><ClubBrowseSparringInner /></ErrorBoundary>
}

function ClubBrowseSparringInner() {
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<OtherSession[]>([])
  const [loading, setLoading] = useState(true)
  const [ownClubId, setOwnClubId] = useState<number | null>(null)
  const [joinTarget, setJoinTarget] = useState<OtherSession | null>(null)

  const load = useCallback(() => {
    apiFetch<{ sessions: OtherSession[] }>('/api/sparring').then(r => setSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { apiFetch<{ club: { id: number } }>('/api/clubs/me').then(r => setOwnClubId(r.club.id)).catch(() => {}) }, [])

  const browseSessions = sessions.filter(s => s.club_id !== ownClubId)

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.sparring.browseTitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={browseSessions}
          keyExtractor={s => String(s.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('club.sparring.browseNone')} />}
          renderItem={({ item: s }) => {
            const unlimited = s.spots === 0
            const remaining = unlimited ? Infinity : Math.max(0, s.spots - s.registered_fighters)
            const closed = !s.accepting_requests
            const full = !unlimited && remaining === 0
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardDiscipline}>{s.discipline}</Text>
                  <Text style={[styles.spotsText, { color: !closed && !full ? TEXT : MUTED }]}>
                    {closed ? t('sparring.closed') : full ? t('sparring.full') : unlimited ? t('sparring.unlimited') : `${remaining} ${t('sparring.spotsLeft')}`}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{s.location}</Text>
                <Text style={styles.cardMeta}>{formatDisplayDate(s.date)} · {s.time} · {s.weight_range} · {parseLevels(s.level).join(', ')}</Text>
                <Text style={styles.cardMeta}>{t('sparring.hostedBy')} {s.host_name}</Text>
                {!!s.message && <Text style={styles.infoBox}>{s.message}</Text>}
                <Button
                  label={closed ? t('sparring.closed') : full ? t('sparring.full') : t('sparring.join')}
                  variant="outline"
                  disabled={closed || full}
                  onPress={() => setJoinTarget(s)}
                  style={{ marginTop: 12, alignSelf: 'flex-start' }}
                />
              </View>
            )
          }}
        />
      )}

      {joinTarget && (
        <JoinSparringModal
          session={joinTarget}
          onCancel={() => setJoinTarget(null)}
          onJoined={() => { setJoinTarget(null); setLoading(true); load() }}
        />
      )}
    </Screen>
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
          {!!session.message && <Text style={styles.infoBox}>{session.message}</Text>}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 14 }}><Text style={styles.label}>{label}</Text>{children}</View>
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  spotsText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  infoBox: { fontFamily: FONT_BODY, fontSize: 12, fontStyle: 'italic', color: MUTED, backgroundColor: INPUT_BG, borderRadius: 4, padding: 10, marginTop: 8 },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})
