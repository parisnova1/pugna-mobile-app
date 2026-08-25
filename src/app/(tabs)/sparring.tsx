import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { TEXT, CARD, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type SparringSession = { id: number; club_id: number; location: string; date: string; time: string; weight_range: string; level: string; spots: number; discipline: string; host_name: string; registered_fighters: number }

const DAY_KEYS = ['day.0', 'day.1', 'day.2', 'day.3', 'day.4', 'day.5', 'day.6'] as const

function dayLabel(isoDate: string, t: (k: any) => string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? isoDate : t(DAY_KEYS[d.getDay()])
}

// RN Web has no native alert dialog implementation — Alert.alert silently
// no-ops there, so joining would otherwise give zero feedback on web.
function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`)
  else Alert.alert(title, message)
}

export default function SparringScreen() {
  return <ErrorBoundary><SparringScreenInner /></ErrorBoundary>
}

function SparringScreenInner() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<SparringSession[]>([])
  const [ownClubId, setOwnClubId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [joinTarget, setJoinTarget] = useState<SparringSession | null>(null)

  const load = () => apiFetch<{ sessions: SparringSession[] }>('/api/sparring').then(r => setSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (user?.role !== 'club') { setOwnClubId(null); return }
    apiFetch<{ club: { id: number } }>('/api/clubs/me').then(r => setOwnClubId(r.club.id)).catch(() => setOwnClubId(null))
  }, [user])

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.sparring')}</Text>
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => String(s.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('sparring.noSessions')} />}
          renderItem={({ item: s }) => {
            const remaining = Math.max(0, s.spots - s.registered_fighters)
            const isOwn = ownClubId !== null && s.club_id === ownClubId
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.tag}><Text style={styles.tagText}>{s.discipline}</Text></View>
                  <Text style={[styles.spotsText, { color: remaining > 0 ? TEXT : MUTED }]}>
                    {remaining > 0 ? `${remaining} ${t('sparring.spotsLeft')}` : t('sparring.full')}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{s.location}</Text>
                <Text style={styles.cardMeta}>{dayLabel(s.date, t)} · {s.time}</Text>
                <View style={styles.tagRow}>
                  {!!s.weight_range && <View style={styles.tag}><Text style={styles.tagText}>{s.weight_range}</Text></View>}
                  <View style={styles.tag}><Text style={styles.tagText}>{s.level}</Text></View>
                </View>
                <Text style={styles.hostText}>{t('sparring.hostedBy')} {s.host_name}</Text>

                {isOwn ? (
                  <View style={styles.disabledButton}><Text style={styles.disabledButtonText}>{t('sparring.yourSession')}</Text></View>
                ) : user && user.role !== 'club' ? (
                  <Text style={styles.clubOnlyText}>{t('sparring.clubAccountsOnly')}</Text>
                ) : (
                  <Button
                    label={remaining === 0 ? t('sparring.full') : t('sparring.join')}
                    variant="outline"
                    disabled={remaining === 0}
                    onPress={() => (user ? setJoinTarget(s) : router.push({ pathname: '/(auth)/login', params: { role: 'club' } }))}
                  />
                )}
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

function JoinSparringModal({ session, onCancel, onJoined }: { session: SparringSession; onCancel: () => void; onJoined: () => void }) {
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
          <Text style={styles.modalMeta}>{session.host_name} · {session.location} · {dayLabel(session.date, t)} · {session.time}</Text>

          <Text style={styles.label}>{t('sparring.numberOfFighters')}</Text>
          <TextInput style={styles.input} value={fighterCount} onChangeText={setFighterCount} keyboardType="number-pad" />

          <Text style={styles.label}>{t('sparring.weightCategory')}</Text>
          <TextInput style={styles.input} value={weightCategory} onChangeText={setWeightCategory} placeholder="70-80 KG" placeholderTextColor={MUTED} />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button label={saving ? t('sparring.joining') : t('common.confirm')} onPress={submit} disabled={saving} style={{ marginTop: 12 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tag: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8 },
  tagText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  spotsText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', color: TEXT, marginBottom: 2 },
  cardMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  hostText: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginBottom: 12 },
  disabledButton: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' },
  disabledButtonText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  clubOnlyText: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, textAlign: 'center', textTransform: 'uppercase', paddingVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 420 },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', color: TEXT, marginBottom: 8 },
  modalMeta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginBottom: 20 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14, marginBottom: 14 },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})
