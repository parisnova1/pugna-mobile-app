import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal } from 'react-native'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { TEXT, CARD, BORDER, MUTED, INPUT_BG, ACCENT, ON_ACCENT, MODAL_SCRIM, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type RosterFighter = { id: number; name: string; weight: string; record: string }
type Nomination = { id: number; status: 'pending' | 'accepted' | 'rejected'; event_name: string; weight_class_name: string; fighter_name: string }

export default function ClubMyFightersScreen() {
  return <ErrorBoundary><ClubMyFightersInner /></ErrorBoundary>
}

function ClubMyFightersInner() {
  const { t } = useLanguage()
  const [fighters, setFighters] = useState<RosterFighter[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget] = useState<RosterFighter | 'new' | null>(null)

  const load = useCallback(() => {
    Promise.all([
      apiFetch<{ fighters: RosterFighter[] }>('/api/fighters'),
      apiFetch<{ nominations: Nomination[] }>('/api/clubs/me/nominations'),
    ])
      .then(([f, n]) => { setFighters(f.fighters); setNominations(n.nominations) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const withdraw = async (id: number) => {
    try { await apiFetch(`/api/nominations/${id}`, { method: 'DELETE' }); load() } catch { /* ignore */ }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.nav.myFighters')}</Text>
        <Button label={t('club.fighters.add')} onPress={() => setFormTarget('new')} style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={fighters}
          keyExtractor={f => String(f.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('club.fighters.none')} ctaLabel={t('club.fighters.add')} onPress={() => setFormTarget('new')} />}
          ListFooterComponent={
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>{t('club.fighters.nominationsTitle')}</Text>
              {nominations.length === 0 ? (
                <Text style={styles.muted}>{t('club.fighters.noNominations')}</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {nominations.map(n => (
                    <View key={n.id} style={styles.card}>
                      <Text style={styles.cardTitle}>{n.fighter_name} · {n.weight_class_name}</Text>
                      <Text style={styles.cardMeta}>{n.event_name}</Text>
                      <View style={styles.statusRow}>
                        <Text style={[styles.statusBadge, styles[`status_${n.status}` as const]]}>{t(`club.fighters.status.${n.status}`)}</Text>
                        {n.status === 'pending' && (
                          <Pressable onPress={() => withdraw(n.id)} hitSlop={8}><Text style={styles.withdrawLink}>{t('club.fighters.withdraw')}</Text></Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item: f }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{f.name}</Text>
              <Text style={styles.cardMeta}>{f.weight} · {f.record}</Text>
              <View style={styles.actionRow}>
                <Button label={t('common.edit')} variant="outline" onPress={() => setFormTarget(f)} style={styles.actionButton} />
              </View>
            </View>
          )}
        />
      )}

      {formTarget && (
        <FighterFormModal
          entry={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSaved={() => { setFormTarget(null); setLoading(true); load() }}
        />
      )}
    </Screen>
  )
}

function FighterFormModal({ entry, onCancel, onSaved }: { entry: RosterFighter | null; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState(entry?.name ?? '')
  const [weight, setWeight] = useState(entry?.weight ?? '')
  const [record, setRecord] = useState(entry?.record ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || !weight.trim()) { setError(t('club.fighters.errorRequired')); return }
    setSaving(true)
    setError(null)
    try {
      if (entry) {
        await apiFetch(`/api/fighters/${entry.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim(), weight: weight.trim(), record: record.trim() }) })
      } else {
        await apiFetch('/api/fighters', { method: 'POST', body: JSON.stringify({ name: name.trim(), club: '', weight: weight.trim(), record: record.trim(), discipline: 'Boxing' }) })
      }
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
          <Text style={styles.modalTitle}>{entry ? t('common.edit') : t('club.fighters.add')}</Text>

          <Field label={t('club.fighters.name')}><TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={MUTED} /></Field>
          <Field label={t('club.fighters.weight')}><TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="75 KG" placeholderTextColor={MUTED} /></Field>
          <Field label={t('club.fighters.record')}><TextInput style={styles.input} value={record} onChangeText={setRecord} placeholder="0–0" placeholderTextColor={MUTED} /></Field>

          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
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
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  headerButton: { alignSelf: 'flex-start' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  sectionTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 10 },
  muted: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 17, textTransform: 'uppercase', color: TEXT },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: TEXT },
  status_pending: { color: MUTED },
  status_accepted: { color: ACCENT },
  status_rejected: { color: MUTED },
  withdrawLink: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: MUTED, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: MODAL_SCRIM, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})
