import { useEffect, useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { ACCENT, ON_ACCENT, TEXT, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Club = {
  id: number; name: string; location: string; disciplines: string[]; founded_year: number | null
  member_count: number; description: string; logo_url: string; cover_url: string
}

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

export default function ClubDetailsScreen() {
  return <ErrorBoundary><ClubDetailsInner /></ErrorBoundary>
}

function ClubDetailsInner() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [foundedYear, setFoundedYear] = useState('')
  const [memberCount, setMemberCount] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  useEffect(() => {
    apiFetch<{ club: Club }>('/api/clubs/me')
      .then(r => {
        setName(r.club.name)
        setLocation(r.club.location ?? '')
        setDisciplines(r.club.disciplines ?? [])
        setFoundedYear(r.club.founded_year ? String(r.club.founded_year) : '')
        setMemberCount(r.club.member_count ? String(r.club.member_count) : '')
        setDescription(r.club.description ?? '')
        setLogoUrl(r.club.logo_url ?? '')
        setCoverUrl(r.club.cover_url ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleDiscipline = (d: string) => {
    setDisciplines(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await apiFetch('/api/clubs/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(), location: location.trim(), disciplines,
          foundedYear: foundedYear ? Number(foundedYear) : undefined,
          memberCount: memberCount ? Number(memberCount) : undefined,
          description: description.trim(), logoUrl: logoUrl.trim(), coverUrl: coverUrl.trim(),
        }),
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('club.details.title')}</Text>

        <Field label={t('club.details.name')}><TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={MUTED} /></Field>
        <Field label={t('club.details.location')}><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Region" placeholderTextColor={MUTED} /></Field>

        <Field label={t('club.details.disciplines')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DISCIPLINES.map(d => (
              <Pressable key={d} onPress={() => toggleDiscipline(d)} style={[styles.pill, disciplines.includes(d) && styles.pillActive]}>
                <Text style={[styles.pillLabel, disciplines.includes(d) && styles.pillLabelActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label={t('club.details.founded')}><TextInput style={styles.input} value={foundedYear} onChangeText={setFoundedYear} keyboardType="number-pad" placeholderTextColor={MUTED} /></Field></View>
          <View style={{ flex: 1 }}><Field label={t('club.details.members')}><TextInput style={styles.input} value={memberCount} onChangeText={setMemberCount} keyboardType="number-pad" placeholderTextColor={MUTED} /></Field></View>
        </View>

        <Field label={t('club.details.about')}>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder={t('club.details.aboutPlaceholder')} placeholderTextColor={MUTED} multiline numberOfLines={4} />
        </Field>
        <Field label={t('club.details.logoUrl')}><TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} autoCapitalize="none" placeholderTextColor={MUTED} /></Field>
        <Field label={t('club.details.coverUrl')}><TextInput style={styles.input} value={coverUrl} onChangeText={setCoverUrl} autoCapitalize="none" placeholderTextColor={MUTED} /></Field>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {saved && <Text style={styles.savedText}>{t('club.details.saved')}</Text>}

        <Button label={saving ? t('login.pleaseWait') : t('club.details.save')} onPress={save} disabled={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </Screen>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 16 }}><Text style={styles.label}>{label}</Text>{children}</View>
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 24 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 12, borderRadius: 4, fontFamily: FONT_BODY, fontSize: 14 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  pillLabelActive: { color: ON_ACCENT },
  errorText: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
  savedText: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 8 },
})
