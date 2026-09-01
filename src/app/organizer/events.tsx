import { useEffect, useState } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Modal, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import DatePickerField from '@/components/DatePickerField'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, MODAL_SCRIM, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export type OrganizerEvent = {
  id: number; name: string; date: string; location: string; venue: string; discipline: string
  format: 'bracket' | 'card'; status: string
}

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

export default function OrganizerEventsScreen() {
  return <ErrorBoundary><OrganizerEventsInner /></ErrorBoundary>
}

function OrganizerEventsInner() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget] = useState<OrganizerEvent | 'new' | null>(null)

  const load = () => apiFetch<{ events: OrganizerEvent[] }>('/api/events').then(r => setEvents(r.events)).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const duplicate = async (id: number) => {
    try {
      await apiFetch(`/api/events/${id}/duplicate`, { method: 'POST' })
      setLoading(true)
      load()
    } catch {
      /* leave list unchanged on failure */
    }
  }

  const remove = (ev: OrganizerEvent) => {
    Alert.alert(t('organizer.events.deleteConfirmTitle'), t('organizer.events.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/events/${ev.id}`, { method: 'DELETE' })
            setLoading(true)
            load()
          } catch {
            /* leave list unchanged on failure */
          }
        },
      },
    ])
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('organizer.events.title')}</Text>
        <Button label={t('organizer.events.create')} onPress={() => setFormTarget('new')} style={styles.createButton} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={ev => String(ev.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('organizer.events.noEvents')} ctaLabel={t('organizer.events.create')} onPress={() => setFormTarget('new')} />}
          renderItem={({ item: ev }) => (
            <View style={styles.card}>
              <Text style={styles.cardDiscipline}>{ev.discipline} · {ev.status}</Text>
              <Text style={styles.cardTitle}>{ev.name}</Text>
              <Text style={styles.cardMeta}>{formatDisplayDate(ev.date)} · {ev.location}</Text>
              <View style={styles.actionRow}>
                <Button label={t('organizer.events.manage')} onPress={() => router.push(`/organizer-events/${ev.id}`)} style={styles.actionButton} />
                <Button label={t('common.edit')} variant="outline" onPress={() => setFormTarget(ev)} style={styles.actionButton} />
                <Button label={t('organizer.events.duplicate')} variant="outline" onPress={() => duplicate(ev.id)} style={styles.actionButton} />
                <Button label={t('common.delete')} variant="outline" onPress={() => remove(ev)} style={styles.actionButton} />
              </View>
            </View>
          )}
        />
      )}

      {formTarget && (
        <EventFormModal
          event={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSaved={() => { setFormTarget(null); setLoading(true); load() }}
        />
      )}
    </Screen>
  )
}

// Exported so club accounts (club-admin/events.tsx) can create and edit
// events through the exact same form/backend as organizers — the events API
// has no role restriction, only ownership, so this is the real feature, not
// a lookalike copy that could drift from it.
export function EventFormModal({ event, onCancel, onSaved }: { event: OrganizerEvent | null; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState(event?.name ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [discipline, setDiscipline] = useState(event?.discipline ?? DISCIPLINES[0])
  const [format, setFormat] = useState<'bracket' | 'card'>(event?.format ?? 'bracket')
  const [status, setStatus] = useState(event?.status ?? 'Draft')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim() || !date.trim() || !location.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setError(null)
    setSaving(true)
    try {
      if (event) {
        await apiFetch(`/api/events/${event.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim(), date: date.trim(), location: location.trim(), venue: venue.trim(), discipline, status }),
        })
      } else {
        await apiFetch('/api/events', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), date: date.trim(), location: location.trim(), venue: venue.trim(), discipline, format, status }),
        })
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
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{event ? t('organizer.eventForm.titleEdit') : t('organizer.eventForm.titleNew')}</Text>

            <Field label={t('organizer.eventForm.name')}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('organizer.eventForm.namePlaceholder')} placeholderTextColor={MUTED} />
            </Field>
            <Field label={t('organizer.eventForm.date')}>
              <DatePickerField value={date} onChange={setDate} placeholder={t('organizer.eventForm.datePlaceholder')} />
            </Field>
            <Field label={t('organizer.eventForm.location')}>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder={t('organizer.eventForm.locationPlaceholder')} placeholderTextColor={MUTED} />
            </Field>
            <Field label={t('organizer.eventForm.venue')}>
              <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder={t('organizer.eventForm.venuePlaceholder')} placeholderTextColor={MUTED} />
            </Field>

            <Field label={t('organizer.eventForm.discipline')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {DISCIPLINES.map(d => (
                    <Pressable key={d} onPress={() => setDiscipline(d)} style={[styles.pill, discipline === d && styles.pillActive]}>
                      <Text style={[styles.pillLabel, discipline === d && styles.pillLabelActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>

            <Field label={t('organizer.eventForm.format')}>
              {event ? (
                <Text style={styles.lockedNote}>{format === 'bracket' ? t('organizer.eventForm.formatBracket') : t('organizer.eventForm.formatCard')} — {t('organizer.eventForm.formatLocked')}</Text>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['bracket', 'card'] as const).map(f => (
                    <Pressable key={f} onPress={() => setFormat(f)} style={[styles.pill, { flex: 1 }, format === f && styles.pillActive]}>
                      <Text style={[styles.pillLabel, format === f && styles.pillLabelActive]}>{f === 'bracket' ? t('organizer.eventForm.formatBracket') : t('organizer.eventForm.formatCard')}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Field>

            <Field label={t('organizer.eventForm.status')}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {(['Draft', 'Open', 'Active'] as const).map(s => (
                  <Pressable key={s} onPress={() => setStatus(s)} style={[styles.pill, { flexGrow: 1 }, status === s && styles.pillActive]}>
                    <Text style={[styles.pillLabel, status === s && styles.pillLabelActive]}>
                      {s === 'Draft' ? t('organizer.eventForm.statusDraft') : s === 'Open' ? t('organizer.eventForm.statusOpen') : t('organizer.eventForm.statusActive')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 14 }} />
            <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT },
  createButton: { alignSelf: 'flex-start' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  cardDiscipline: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, textTransform: 'uppercase', color: TEXT, marginBottom: 4 },
  cardMeta: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14 },
  modalOverlay: { flex: 1, backgroundColor: MODAL_SCRIM, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  lockedNote: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})
