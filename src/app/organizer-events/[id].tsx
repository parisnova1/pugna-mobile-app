import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import BracketView, { type Bout } from '@/components/Bracket'
import DaySwitcher, { type EventDay } from '@/components/DaySwitcher'
import { ACCENT, ON_ACCENT, TEXT, CARD, BORDER, MUTED, INPUT_BG, MODAL_SCRIM, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type EventInfo = {
  id: number; name: string; date: string; location: string; venue: string; discipline: string; status: string
  format: 'bracket' | 'card'; numberOfDays?: number; number_of_days?: number; ringCount?: number; ring_count?: number
  current_bout_id?: number | null
}
type WeightClass = { id: number; name: string; age_group: string; gender: string; rounds_count: number; round_minutes: number; rest_minutes: number; fighterCount: number; status?: 'open' | 'closed' }
type EventFighter = { id: number; name: string; club: string; weight: string; record: string; weight_class_id: number | null; source?: 'manual' | 'walkup' | 'roster' }
type CardBout = { id: number; fighter_a_name: string; fighter_a_record: string; fighter_b_name: string; fighter_b_record: string; weight_class_text: string; card_position: 'main' | 'co-main' | 'undercard'; rounds: number | null }

type Tab = 'weightClasses' | 'nominations' | 'fighters' | 'bracket' | 'fightCard'

export default function ManageEventScreen() {
  return <ErrorBoundary><ManageEventInner /></ErrorBoundary>
}

function ManageEventInner() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useLanguage()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<EventFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('weightClasses')
  const [editingEvent, setEditingEvent] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      apiFetch<{ event: EventInfo; weightClasses: WeightClass[] }>(`/api/events/${id}/detail`),
      apiFetch<{ fighters: EventFighter[] }>(`/api/events/${id}/fighters`),
    ])
      .then(([detail, f]) => {
        setEvent(detail.event)
        setWeightClasses(detail.weightClasses)
        setFighters(f.fighters)
        setTab(detail.event.format === 'card' ? 'fightCard' : 'weightClasses')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>
  if (!event) return <Screen><View style={styles.centerFill}><Text style={styles.notFound}>Event not found.</Text></View></Screen>

  const tabs: Tab[] = event.format === 'card' ? ['fightCard'] : ['weightClasses', 'nominations', 'fighters', 'bracket']

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={tabs.length > 1 ? [1] : undefined}>
        <View style={styles.hero}>
          <BackButton />
          <View style={styles.heroTopRow}>
            <Text style={styles.eyebrow}>{event.discipline} · {formatDisplayDate(event.date)}</Text>
            <Pressable onPress={() => setEditingEvent(true)}><Text style={styles.editLink}>{t('organizer.manage.editEvent')}</Text></Pressable>
          </View>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.meta}>{event.location} · {event.status}</Text>
        </View>

        {tabs.length > 1 && (
          <View style={styles.tabBar}>
            {tabs.map(tk => (
              <Pressable key={tk} onPress={() => setTab(tk)} style={styles.tabButton}>
                <Text style={[styles.tabLabel, tab === tk && styles.tabLabelActive]}>{t(`organizer.manage.tab.${tk}`)}</Text>
                {tab === tk && <View style={styles.tabIndicator} />}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.tabContent}>
          {tab === 'weightClasses' && <WeightClassesTab eventId={String(id)} discipline={event.discipline} weightClasses={weightClasses} onChanged={load} />}
          {tab === 'nominations' && <NominationsTab eventId={String(id)} onChanged={load} />}
          {tab === 'fighters' && <FightersTab eventId={String(id)} fighters={fighters} weightClasses={weightClasses} onChanged={load} />}
          {tab === 'bracket' && <BracketTab eventId={String(id)} currentBoutId={event.current_bout_id ?? null} numberOfDays={event.numberOfDays ?? event.number_of_days ?? 1} weightClasses={weightClasses} fighters={fighters} onChanged={load} />}
          {tab === 'fightCard' && <FightCardTab eventId={String(id)} />}
        </View>
      </ScrollView>

      {editingEvent && (
        <EditEventModal
          event={event}
          onCancel={() => setEditingEvent(false)}
          onSaved={() => { setEditingEvent(false); load() }}
        />
      )}
    </Screen>
  )
}

// ─── Edit Event ─────────────────────────────────────────────────────────────

function EditEventModal({ event, onCancel, onSaved }: { event: EventInfo; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState(event.name)
  const [date, setDate] = useState(event.date)
  const [location, setLocation] = useState(event.location)
  const [venue, setVenue] = useState(event.venue ?? '')
  const [status, setStatus] = useState(event.status)
  const [numberOfDays, setNumberOfDays] = useState(String(event.numberOfDays ?? event.number_of_days ?? 1))
  const [ringCount, setRingCount] = useState(String(event.ringCount ?? event.ring_count ?? 1))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || !date.trim() || !location.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setError(null)
    setSaving(true)
    try {
      await apiFetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(), date: date.trim(), location: location.trim(), venue: venue.trim(), status,
          numberOfDays: Number(numberOfDays) || 1, ringCount: Number(ringCount) || 1,
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
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{t('organizer.eventForm.titleEdit')}</Text>
            <Field label={t('organizer.eventForm.name')}><TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.eventForm.date')}><TextInput style={styles.input} value={date} onChangeText={setDate} placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.eventForm.location')}><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.eventForm.venue')}><TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholderTextColor={MUTED} /></Field>
            {event.format === 'bracket' && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label={t('organizer.eventForm.numberOfDays')}><TextInput style={styles.input} value={numberOfDays} onChangeText={setNumberOfDays} keyboardType="number-pad" placeholderTextColor={MUTED} /></Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t('organizer.eventForm.ringCount')}><TextInput style={styles.input} value={ringCount} onChangeText={setRingCount} keyboardType="number-pad" placeholderTextColor={MUTED} /></Field>
                </View>
              </View>
            )}
            <Field label={t('organizer.eventForm.status')}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['Draft', 'Active'] as const).map(s => (
                  <Pressable key={s} onPress={() => setStatus(s)} style={[styles.pill, { flex: 1 }, status === s && styles.pillActive]}>
                    <Text style={[styles.pillLabel, status === s && styles.pillLabelActive]}>{s === 'Draft' ? t('organizer.eventForm.statusDraft') : t('organizer.eventForm.statusActive')}</Text>
                  </Pressable>
                ))}
              </View>
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

// ─── Nominations ────────────────────────────────────────────────────────────

type NominationRow = {
  id: number; status: 'pending' | 'accepted' | 'rejected'; club_name: string
  fighter_name: string; fighter_weight: string; fighter_record: string; weight_class_name: string; note: string
}

function NominationsTab({ eventId, onChanged }: { eventId: string; onChanged: () => void }) {
  const { t } = useLanguage()
  const [nominations, setNominations] = useState<NominationRow[] | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(() => {
    apiFetch<{ nominations: NominationRow[] }>(`/api/events/${eventId}/nominations`).then(r => setNominations(r.nominations)).catch(() => setNominations([]))
  }, [eventId])

  useEffect(() => { load() }, [load])

  const decide = async (id: number, action: 'accept' | 'reject') => {
    setBusyId(id)
    try {
      await apiFetch(`/api/nominations/${id}/${action}`, { method: 'PATCH' })
      load()
      onChanged()
    } catch {
      /* ignore */
    } finally {
      setBusyId(null)
    }
  }

  if (nominations === null) return <Spinner />
  if (nominations.length === 0) return <Text style={styles.emptyBox}>{t('organizer.nominations.none')}</Text>

  return (
    <View style={{ gap: 8 }}>
      {nominations.map(n => (
        <View key={n.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{n.fighter_name} · {n.weight_class_name}</Text>
            <Text style={styles.rowSub}>{n.club_name} · {n.fighter_weight} · {n.fighter_record}</Text>
            {!!n.note && <Text style={styles.lockedNote}>{n.note}</Text>}
          </View>
          {n.status === 'pending' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => decide(n.id, 'accept')} disabled={busyId === n.id} hitSlop={8}>
                <Text style={[styles.rowTitle, { color: ACCENT }]}>{t('organizer.nominations.accept')}</Text>
              </Pressable>
              <Pressable onPress={() => decide(n.id, 'reject')} disabled={busyId === n.id} hitSlop={8}>
                <Text style={styles.deleteLink}>{t('organizer.nominations.reject')}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.rowSub}>{t(`organizer.nominations.status.${n.status}`)}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

// ─── Weight Classes ─────────────────────────────────────────────────────────

const AGE_GROUPS = ['adult', 'youth', 'children'] as const
const GENDERS = ['male', 'female', 'mixed'] as const

function WeightClassesTab({ eventId, discipline, weightClasses, onChanged }: { eventId: string; discipline: string; weightClasses: WeightClass[]; onChanged: () => void }) {
  const { t } = useLanguage()
  const [adding, setAdding] = useState(false)
  const [templating, setTemplating] = useState(false)
  const [packing, setPacking] = useState(false)

  const remove = async (wcId: number) => {
    try { await apiFetch(`/api/weight-classes/${wcId}`, { method: 'DELETE' }); onChanged() } catch { /* ignore */ }
  }

  const toggleStatus = async (wc: WeightClass) => {
    try { await apiFetch(`/api/weight-classes/${wc.id}`, { method: 'PATCH', body: JSON.stringify({ status: wc.status === 'closed' ? 'open' : 'closed' }) }); onChanged() } catch { /* ignore */ }
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button label={t('organizer.weightClass.add')} onPress={() => setAdding(true)} style={{ flex: 1, paddingVertical: 10 }} />
        <Button label={t('organizer.weightClass.template')} variant="outline" onPress={() => setTemplating(true)} style={{ flex: 1, paddingVertical: 10 }} />
        {discipline === 'Boxing' && (
          <Button label={t('organizer.weightClass.pack')} variant="outline" onPress={() => setPacking(true)} style={{ flex: 1, paddingVertical: 10 }} />
        )}
      </View>

      {weightClasses.length === 0 ? (
        <Text style={styles.emptyBox}>{t('organizer.weightClass.none')}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {weightClasses.map(wc => (
            <View key={wc.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{wc.name}</Text>
                <Text style={styles.rowSub}>{wc.age_group} · {wc.gender} · {t('organizer.weightClass.fighterCount', { count: wc.fighterCount })}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Pressable onPress={() => toggleStatus(wc)} hitSlop={8}>
                  <Text style={styles.wcBadge}>{t(wc.status === 'closed' ? 'organizer.weightClass.closed' : 'organizer.weightClass.open')}</Text>
                </Pressable>
                <Pressable onPress={() => remove(wc.id)} hitSlop={8}><Text style={styles.deleteLink}>{t('common.delete')}</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {adding && (
        <AddWeightClassModal eventId={eventId} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); onChanged() }} />
      )}
      {templating && (
        <TemplateModal eventId={eventId} onCancel={() => setTemplating(false)} onSaved={() => { setTemplating(false); onChanged() }} />
      )}
      {packing && (
        <PackModal eventId={eventId} discipline={discipline} onCancel={() => setPacking(false)} onSaved={() => { setPacking(false); onChanged() }} />
      )}
    </View>
  )
}

type TemplatePack = { id: number; slug: string; name: string; division: string; classes: { id: number }[] }

function PackModal({ eventId, discipline, onCancel, onSaved }: { eventId: string; discipline: string; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [packs, setPacks] = useState<TemplatePack[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ packs: TemplatePack[] }>(`/api/template-packs?discipline=${encodeURIComponent(discipline)}`)
      .then(r => { setPacks(r.packs); setSelected(r.packs[0]?.slug ?? null) })
      .catch(() => setPacks([]))
  }, [discipline])

  const submit = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/weight-classes/from-pack`, { method: 'POST', body: JSON.stringify({ packSlug: selected }) })
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
          <Text style={styles.modalTitle}>{t('organizer.weightClass.pack')}</Text>
          <Text style={styles.lockedNote}>{t('organizer.weightClass.packConfirm')}</Text>

          {packs === null ? (
            <Spinner />
          ) : packs.length === 0 ? (
            <Text style={styles.lockedNote}>{t('organizer.weightClass.packEmpty')}</Text>
          ) : (
            <View style={{ gap: 8, marginTop: 8 }}>
              {packs.map(pack => (
                <Pressable
                  key={pack.slug}
                  onPress={() => setSelected(pack.slug)}
                  style={[styles.row, selected === pack.slug && { borderColor: ACCENT }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{pack.name}</Text>
                    <Text style={styles.rowSub}>{t('organizer.weightClass.classCount', { count: pack.classes.length })}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('common.confirm')} onPress={submit} disabled={saving || !selected} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function AddWeightClassModal({ eventId, onCancel, onSaved }: { eventId: string; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState<typeof AGE_GROUPS[number]>('adult')
  const [gender, setGender] = useState<typeof GENDERS[number]>('male')
  const [rounds, setRounds] = useState('3')
  const [roundMinutes, setRoundMinutes] = useState('3')
  const [restMinutes, setRestMinutes] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/weight-classes`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), ageGroup, gender, roundsCount: Number(rounds) || 3, roundMinutes: Number(roundMinutes) || 3, restMinutes: Number(restMinutes) || 1 }),
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
          <Text style={styles.modalTitle}>{t('organizer.weightClass.add')}</Text>
          <Field label={t('organizer.weightClass.name')}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('organizer.weightClass.namePlaceholder')} placeholderTextColor={MUTED} />
          </Field>
          <Field label={t('organizer.weightClass.ageGroup')}>
            <PillRow options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
          </Field>
          <Field label={t('organizer.weightClass.gender')}>
            <PillRow options={GENDERS} value={gender} onChange={setGender} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label={t('organizer.weightClass.rounds')}><TextInput style={styles.input} value={rounds} onChangeText={setRounds} keyboardType="number-pad" /></Field></View>
            <View style={{ flex: 1 }}><Field label={t('organizer.weightClass.roundMinutes')}><TextInput style={styles.input} value={roundMinutes} onChangeText={setRoundMinutes} keyboardType="number-pad" /></Field></View>
            <View style={{ flex: 1 }}><Field label={t('organizer.weightClass.restMinutes')}><TextInput style={styles.input} value={restMinutes} onChangeText={setRestMinutes} keyboardType="number-pad" /></Field></View>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function TemplateModal({ eventId, onCancel, onSaved }: { eventId: string; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [ageGroup, setAgeGroup] = useState<typeof AGE_GROUPS[number]>('adult')
  const [gender, setGender] = useState<typeof GENDERS[number]>('male')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/weight-classes/template`, { method: 'POST', body: JSON.stringify({ ageGroup, gender }) })
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
          <Text style={styles.modalTitle}>{t('organizer.weightClass.template')}</Text>
          <Text style={styles.lockedNote}>{t('organizer.weightClass.templateConfirm')}</Text>
          <Field label={t('organizer.weightClass.ageGroup')}><PillRow options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} /></Field>
          <Field label={t('organizer.weightClass.gender')}><PillRow options={GENDERS} value={gender} onChange={setGender} /></Field>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('common.confirm')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Fighters ───────────────────────────────────────────────────────────────

function FightersTab({ eventId, fighters, weightClasses, onChanged }: { eventId: string; fighters: EventFighter[]; weightClasses: WeightClass[]; onChanged: () => void }) {
  const { t } = useLanguage()
  const [adding, setAdding] = useState(false)
  const [assigning, setAssigning] = useState<EventFighter | null>(null)
  const wcName = (wcId: number | null) => weightClasses.find(w => w.id === wcId)?.name ?? t('organizer.fighter.unassigned')

  return (
    <View>
      <Button label={t('organizer.fighter.add')} onPress={() => setAdding(true)} style={{ marginBottom: 16 }} />

      {fighters.length === 0 ? (
        <Text style={styles.emptyBox}>{t('organizer.fighter.none')}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {fighters.map(f => (
            <Pressable key={f.id} style={styles.row} onPress={() => setAssigning(f)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{f.name}</Text>
                <Text style={styles.rowSub}>{f.club} · {f.weight} · {f.record}</Text>
                {f.source === 'walkup' && <Text style={styles.walkupBadge}>{t('organizer.fighter.walkup')}</Text>}
              </View>
              <Text style={styles.wcBadge}>{wcName(f.weight_class_id)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {adding && (
        <AddFighterModal eventId={eventId} weightClasses={weightClasses} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); onChanged() }} />
      )}
      {assigning && (
        <AssignWeightClassModal
          fighter={assigning}
          eventId={eventId}
          weightClasses={weightClasses}
          onCancel={() => setAssigning(null)}
          onSaved={() => { setAssigning(null); onChanged() }}
        />
      )}
    </View>
  )
}

function AddFighterModal({ eventId, weightClasses, onCancel, onSaved }: { eventId: string; weightClasses: WeightClass[]; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [club, setClub] = useState('')
  const [weight, setWeight] = useState('')
  const [record, setRecord] = useState('')
  const [weightClassId, setWeightClassId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || !weight.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/events/${eventId}/fighters`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), club: club.trim(), weight: weight.trim(), record: record.trim() || undefined, weightClassId }),
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
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{t('organizer.fighter.add')}</Text>
            <Field label={t('organizer.fighter.name')}><TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.fighter.club')}><TextInput style={styles.input} value={club} onChangeText={setClub} placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.fighter.weight')}><TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="75 KG" placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.fighter.record')}><TextInput style={styles.input} value={record} onChangeText={setRecord} placeholder="0-0" placeholderTextColor={MUTED} /></Field>
            {weightClasses.length > 0 && (
              <Field label={t('organizer.fighter.weightClass')}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {weightClasses.map(wc => (
                      <Pressable key={wc.id} onPress={() => setWeightClassId(wc.id)} style={[styles.pill, weightClassId === wc.id && styles.pillActive]}>
                        <Text style={[styles.pillLabel, weightClassId === wc.id && styles.pillLabelActive]}>{wc.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </Field>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
            <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function AssignWeightClassModal({ fighter, eventId, weightClasses, onCancel, onSaved }: { fighter: EventFighter; eventId: string; weightClasses: WeightClass[]; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)

  const assign = async (weightClassId: number | null) => {
    setSaving(true)
    try {
      await apiFetch(`/api/events/${eventId}/fighters/${fighter.id}/weight-class`, { method: 'PATCH', body: JSON.stringify({ weightClassId }) })
      onSaved()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('organizer.fighter.assignWeightClass')}</Text>
          <Text style={styles.lockedNote}>{fighter.name}</Text>
          <View style={{ gap: 8, marginTop: 14 }}>
            <Pressable disabled={saving} onPress={() => assign(null)} style={styles.row}>
              <Text style={styles.rowTitle}>{t('organizer.fighter.unassigned')}</Text>
            </Pressable>
            {weightClasses.map(wc => (
              <Pressable key={wc.id} disabled={saving} onPress={() => assign(wc.id)} style={styles.row}>
                <Text style={styles.rowTitle}>{wc.name}</Text>
              </Pressable>
            ))}
          </View>
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} style={{ marginTop: 12 }} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Bracket ────────────────────────────────────────────────────────────────

function BracketTab({ eventId, currentBoutId, numberOfDays, weightClasses, fighters, onChanged }: { eventId: string; currentBoutId: number | null; numberOfDays: number; weightClasses: WeightClass[]; fighters: EventFighter[]; onChanged: () => void }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<number | null>(weightClasses[0]?.id ?? null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [liveBusy, setLiveBusy] = useState(false)
  const [resultTarget, setResultTarget] = useState<Bout | null>(null)
  const [days, setDays] = useState<EventDay[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [daysBusy, setDaysBusy] = useState(false)

  const setLive = async (boutId: number | null) => {
    setLiveBusy(true)
    try { await apiFetch(`/api/events/${eventId}/current-bout`, { method: 'PATCH', body: JSON.stringify({ boutId }) }); onChanged() } catch { /* ignore */ } finally { setLiveBusy(false) }
  }

  const fightersById = Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }]))
  const selectedWc = weightClasses.find(w => w.id === selected) ?? null

  const loadDays = useCallback(() => {
    apiFetch<{ days: EventDay[] }>(`/api/events/${eventId}/days`)
      .then(r => { setDays(r.days); setSelectedDay(prev => prev ?? r.days[0]?.id ?? null) })
      .catch(() => setDays([]))
  }, [eventId])

  useEffect(() => { if (numberOfDays > 1) loadDays() }, [numberOfDays, loadDays])

  const generateDays = async () => {
    setDaysBusy(true)
    try { await apiFetch(`/api/events/${eventId}/days`, { method: 'POST' }); loadDays() } catch { /* ignore */ } finally { setDaysBusy(false) }
  }

  const loadBracket = useCallback((weightClassId: number) => {
    setLoading(true)
    apiFetch<{ bouts: Bout[] }>(`/api/weight-classes/${weightClassId}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(() => setBouts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setBouts([]); return }
    loadBracket(selected)
  }, [selected, loadBracket])

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      await apiFetch(`/api/weight-classes/${selected}/bracket`, { method: 'POST', body: JSON.stringify({ dayId: selectedDay }) })
      loadBracket(selected)
      onChanged()
    } catch {
      /* ignore */
    } finally {
      setGenerating(false)
    }
  }

  if (weightClasses.length === 0) return <Text style={styles.emptyBox}>{t('organizer.weightClass.none')}</Text>

  return (
    <View>
      {numberOfDays > 1 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>{t('organizer.days.title')}</Text>
          {days.length === 0 ? (
            <Button label={daysBusy ? t('login.pleaseWait') : t('organizer.days.generate')} variant="outline" onPress={generateDays} disabled={daysBusy} style={{ alignSelf: 'flex-start', paddingVertical: 10 }} />
          ) : (
            <DaySwitcher days={days} selectedId={selectedDay} onSelect={setSelectedDay} />
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {weightClasses.map(wc => (
          <Pressable key={wc.id} onPress={() => setSelected(wc.id)} style={[styles.pill, selected === wc.id && styles.pillActive]}>
            <Text style={[styles.pillLabel, selected === wc.id && styles.pillLabelActive]}>{wc.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedWc && (
        <Button
          label={bouts.length > 0 ? t('organizer.bracket.regenerate') : t('organizer.bracket.generate')}
          variant="outline"
          disabled={generating || selectedWc.fighterCount < 2}
          onPress={generate}
          style={{ marginBottom: 16, alignSelf: 'flex-start', paddingVertical: 10 }}
        />
      )}
      {selectedWc && selectedWc.fighterCount < 2 && <Text style={styles.lockedNote}>{t('organizer.bracket.needTwoFighters')}</Text>}
      {selectedWc && selectedWc.fighterCount >= 2 && selectedWc.status === 'closed' && bouts.length === 0 && (
        <Text style={[styles.lockedNote, { color: ACCENT }]}>{t('organizer.bracket.readyToGenerate')}</Text>
      )}

      {loading ? <Spinner /> : <BracketView bouts={bouts} fighters={fightersById} onBoutClick={setResultTarget} />}

      {bouts.filter(b => b.status === 'scheduled').length > 0 && (
        <View style={{ marginTop: 20, gap: 8 }}>
          <Text style={styles.label}>{t('organizer.live.title')}</Text>
          {bouts.filter(b => b.status === 'scheduled').map(b => {
            const isLive = currentBoutId === b.id
            return (
              <View key={b.id} style={styles.row}>
                <Text style={styles.rowTitle}>{fightersById[b.fighter_red_id ?? -1]?.name ?? '?'} vs {fightersById[b.fighter_blue_id ?? -1]?.name ?? '?'}</Text>
                <Pressable disabled={liveBusy} onPress={() => setLive(isLive ? null : b.id)}>
                  <Text style={[styles.deleteLink, isLive && { color: ACCENT }]}>{isLive ? t('organizer.live.end') : t('organizer.live.go')}</Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      {resultTarget && (
        <ResultModal
          bout={resultTarget}
          fighters={fightersById}
          onCancel={() => setResultTarget(null)}
          onSaved={() => { setResultTarget(null); if (selected) loadBracket(selected) }}
        />
      )}
    </View>
  )
}

const BOUT_METHODS = ['Decision', 'KO', 'TKO', 'RSC', 'Walkover', 'Abd', 'DQ', 'Injury'] as const

function ResultModal({ bout, fighters, onCancel, onSaved }: { bout: Bout; fighters: Record<number, { name: string; club: string }>; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [winnerId, setWinnerId] = useState<number | null>(null)
  const [method, setMethod] = useState<typeof BOUT_METHODS[number] | null>(null)
  const [methodNote, setMethodNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const candidates = [bout.fighter_red_id, bout.fighter_blue_id].filter((id): id is number => id !== null)

  const submit = async () => {
    if (!winnerId || !method) { setError(t('organizer.eventForm.errorRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch(`/api/bouts/${bout.id}/result`, { method: 'PATCH', body: JSON.stringify({ winnerId, method, methodNote: methodNote.trim() || undefined }) })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('organizer.result.title')}</Text>
          <Text style={styles.label}>{t('organizer.result.winner')}</Text>
          <View style={{ gap: 8, marginBottom: 14 }}>
            {candidates.map(fid => (
              <Pressable key={fid} onPress={() => setWinnerId(fid)} style={[styles.row, winnerId === fid && styles.rowSelected]}>
                <Text style={styles.rowTitle}>{fighters[fid]?.name ?? `#${fid}`}</Text>
              </Pressable>
            ))}
          </View>
          <Field label={t('organizer.result.method')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {BOUT_METHODS.map(m => (
                <Pressable key={m} onPress={() => setMethod(m)} style={[styles.pill, method === m && styles.pillActive]}>
                  <Text style={[styles.pillLabel, method === m && styles.pillLabelActive]}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label={t('organizer.result.methodNote')}>
            <TextInput style={styles.input} value={methodNote} onChangeText={setMethodNote} placeholder={t('organizer.result.methodPlaceholder')} placeholderTextColor={MUTED} />
          </Field>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button label={saving ? t('login.pleaseWait') : t('organizer.result.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Fight Card (card-format events) ───────────────────────────────────────

const CARD_POSITIONS = ['main', 'co-main', 'undercard'] as const

function FightCardTab({ eventId }: { eventId: string }) {
  const { t } = useLanguage()
  const [bouts, setBouts] = useState<CardBout[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CardBout | 'new' | null>(null)

  const load = useCallback(() => {
    apiFetch<{ bouts: CardBout[] }>(`/api/events/${eventId}/card-bouts`).then(r => setBouts(r.bouts)).catch(() => {}).finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => { load() }, [load])

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...bouts]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setBouts(next)
    try {
      await apiFetch(`/api/events/${eventId}/card-bouts/reorder`, { method: 'POST', body: JSON.stringify({ order: next.map(b => b.id) }) })
    } catch {
      load()
    }
  }

  const remove = async (id: number) => {
    try { await apiFetch(`/api/card-bouts/${id}`, { method: 'DELETE' }); load() } catch { /* ignore */ }
  }

  if (loading) return <Spinner />

  return (
    <View>
      <Button label={t('organizer.cardBout.add')} onPress={() => setEditing('new')} style={{ marginBottom: 16 }} />

      {bouts.length === 0 ? (
        <Text style={styles.emptyBox}>{t('organizer.cardBout.none')}</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {bouts.map((b, i) => (
            <View key={b.id} style={styles.boutCard}>
              <Text style={styles.positionTag}>{b.card_position}</Text>
              <Text style={styles.rowTitle}>{b.fighter_a_name} vs {b.fighter_b_name}</Text>
              <Text style={styles.rowSub}>{b.weight_class_text} {b.rounds ? `· ${b.rounds} rounds` : ''}</Text>
              <View style={styles.actionRow}>
                <Pressable onPress={() => move(i, -1)} disabled={i === 0}><Text style={[styles.deleteLink, i === 0 && { opacity: 0.3 }]}>{t('organizer.cardBout.moveUp')}</Text></Pressable>
                <Pressable onPress={() => move(i, 1)} disabled={i === bouts.length - 1}><Text style={[styles.deleteLink, i === bouts.length - 1 && { opacity: 0.3 }]}>{t('organizer.cardBout.moveDown')}</Text></Pressable>
                <Pressable onPress={() => setEditing(b)}><Text style={styles.deleteLink}>{t('common.edit')}</Text></Pressable>
                <Pressable onPress={() => remove(b.id)}><Text style={styles.deleteLink}>{t('common.delete')}</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {editing && (
        <CardBoutModal
          eventId={eventId}
          bout={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </View>
  )
}

function CardBoutModal({ eventId, bout, onCancel, onSaved }: { eventId: string; bout: CardBout | null; onCancel: () => void; onSaved: () => void }) {
  const { t } = useLanguage()
  const [fighterAName, setFighterAName] = useState(bout?.fighter_a_name ?? '')
  const [fighterARecord, setFighterARecord] = useState(bout?.fighter_a_record ?? '')
  const [fighterBName, setFighterBName] = useState(bout?.fighter_b_name ?? '')
  const [fighterBRecord, setFighterBRecord] = useState(bout?.fighter_b_record ?? '')
  const [weightClassText, setWeightClassText] = useState(bout?.weight_class_text ?? '')
  const [cardPosition, setCardPosition] = useState<typeof CARD_POSITIONS[number]>(bout?.card_position ?? 'undercard')
  const [rounds, setRounds] = useState(bout?.rounds ? String(bout.rounds) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!fighterAName.trim() || !fighterBName.trim()) { setError(t('organizer.eventForm.errorRequired')); return }
    setSaving(true)
    setError(null)
    const body = {
      fighterAName: fighterAName.trim(), fighterARecord: fighterARecord.trim(), fighterBName: fighterBName.trim(), fighterBRecord: fighterBRecord.trim(),
      weightClassText: weightClassText.trim(), cardPosition, rounds: rounds ? Number(rounds) : undefined,
    }
    try {
      if (bout) await apiFetch(`/api/card-bouts/${bout.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      else await apiFetch(`/api/events/${eventId}/card-bouts`, { method: 'POST', body: JSON.stringify(body) })
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
            <Text style={styles.modalTitle}>{t('organizer.cardBout.add')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label={t('organizer.cardBout.fighterA')}><TextInput style={styles.input} value={fighterAName} onChangeText={setFighterAName} placeholderTextColor={MUTED} /></Field>
                <Field label={t('organizer.cardBout.fighterARecord')}><TextInput style={styles.input} value={fighterARecord} onChangeText={setFighterARecord} placeholder="0-0" placeholderTextColor={MUTED} /></Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t('organizer.cardBout.fighterB')}><TextInput style={styles.input} value={fighterBName} onChangeText={setFighterBName} placeholderTextColor={MUTED} /></Field>
                <Field label={t('organizer.cardBout.fighterBRecord')}><TextInput style={styles.input} value={fighterBRecord} onChangeText={setFighterBRecord} placeholder="0-0" placeholderTextColor={MUTED} /></Field>
              </View>
            </View>
            <Field label={t('organizer.cardBout.weightClassText')}><TextInput style={styles.input} value={weightClassText} onChangeText={setWeightClassText} placeholder="75 KG" placeholderTextColor={MUTED} /></Field>
            <Field label={t('organizer.cardBout.position')}><PillRow options={CARD_POSITIONS} value={cardPosition} onChange={setCardPosition} /></Field>
            <Field label={t('organizer.cardBout.rounds')}><TextInput style={styles.input} value={rounds} onChangeText={setRounds} keyboardType="number-pad" placeholderTextColor={MUTED} /></Field>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button label={saving ? t('login.pleaseWait') : t('common.save')} onPress={submit} disabled={saving} style={{ marginTop: 8 }} />
            <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 14 }}><Text style={styles.label}>{label}</Text>{children}</View>
}

function PillRow<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.pill, value === opt && styles.pillActive]}>
          <Text style={[styles.pillLabel, value === opt && styles.pillLabelActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
  scroll: { paddingBottom: 40 },
  hero: { padding: 20, paddingTop: 4 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' },
  editLink: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.8, color: TEXT, textTransform: 'uppercase', textDecorationLine: 'underline' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 6 },
  meta: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#fff', paddingHorizontal: 12 },
  tabButton: { paddingVertical: 14, paddingHorizontal: 12 },
  tabLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  tabLabelActive: { color: TEXT },
  tabIndicator: { height: 2, backgroundColor: ACCENT, marginTop: 8, borderRadius: 1 },
  tabContent: { padding: 20 },
  emptyBox: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, textAlign: 'center', fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: MUTED, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14, gap: 10 },
  rowSelected: { borderColor: ACCENT },
  rowTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  rowSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 },
  wcBadge: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, color: ACCENT, textTransform: 'uppercase' },
  walkupBadge: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginTop: 4 },
  deleteLink: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: TEXT, textTransform: 'uppercase', textDecorationLine: 'underline' },
  boutCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14 },
  positionTag: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
  modalOverlay: { flex: 1, backgroundColor: MODAL_SCRIM, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85%' },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, textTransform: 'uppercase', color: TEXT, marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  lockedNote: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginBottom: 12 },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
})
