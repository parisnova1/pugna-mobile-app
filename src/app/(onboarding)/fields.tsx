import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { Icon } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import LocationInput from '@/components/LocationInput'
import StepIndicator from '@/onboarding/StepIndicator'
import { roleHomePath } from '@/lib/roleHome'
import { ONBOARDING_TOTAL, ONBOARDING_FIELDS_STEP } from '@/onboarding/steps'
import { TEXT, MUTED, BORDER, CARD, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type PublicClub = { id: number; name: string }

// Reached only right after a fresh fighter/club/organizer signup (see
// (auth)/account.tsx's afterAuth) — a real session already exists by the
// time this screen mounts, so every field here PATCHes/POSTs live, unlike
// the old pre-signup version of this screen that stashed everything in
// OnboardingContext and applied it after the fact. Skippable either way:
// "Weiter" saves whatever was filled in, "Überspringen" saves nothing —
// both land on the same role home.
export default function FieldsScreen() {
  const { t } = useLanguage()
  const { user, updateProfile } = useAuth()
  const role = user?.role ?? 'viewer'

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [clubQuery, setClubQuery] = useState('')
  const [clubId, setClubId] = useState<number | null>(null)
  const [weight, setWeight] = useState('')
  const [clubs, setClubs] = useState<PublicClub[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (role !== 'fighter') return
    apiFetch<{ clubs: PublicClub[] }>('/api/clubs').then(r => setClubs(r.clubs)).catch(() => {})
  }, [role])

  const suggestions = useMemo(() => {
    if (clubId != null) return []
    const q = clubQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return clubs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [clubs, clubQuery, clubId])

  const land = () => router.replace(roleHomePath(role))

  const save = async () => {
    setSaving(true)
    try {
      if (role === 'organizer' && name.trim()) {
        await updateProfile({ name: name.trim(), ...(location.trim() ? { homeLocation: location.trim() } : {}) })
      } else if (role === 'organizer' && location.trim()) {
        await updateProfile({ homeLocation: location.trim() })
      }

      if (role === 'club' && (name.trim() || location.trim())) {
        const body: Record<string, unknown> = { disciplines: ['Boxing'] }
        if (name.trim()) body.name = name.trim()
        if (location.trim()) { body.location = location.trim(); body.lat = coords?.lat ?? null; body.lng = coords?.lng ?? null }
        await apiFetch('/api/clubs/me', { method: 'PATCH', body: JSON.stringify(body) })
      }

      if (role === 'fighter') {
        const trimmedName = name.trim()
        if (trimmedName) await updateProfile({ name: trimmedName })
        if (clubId != null && weight.trim()) {
          await apiFetch('/api/fighters', {
            method: 'POST',
            body: JSON.stringify({ name: trimmedName || user?.name, weight: weight.trim(), clubId }),
          })
        }
      }
    } catch {
      // Best-effort — Fields is always skippable, a failed save shouldn't
      // trap the user on this screen. They can fill it in later from Settings.
    } finally {
      setSaving(false)
    }
    land()
  }

  const title = role === 'fighter' ? t('onboarding.fieldsFighterTitle')
    : role === 'club' ? t('onboarding.fieldsClubTitle')
    : t('onboarding.fieldsOrganizerTitle')

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={12}>
            <Icon name="chevronBack" size={22} color={TEXT} />
          </Pressable>
          <StepIndicator current={ONBOARDING_FIELDS_STEP} total={ONBOARDING_TOTAL} />
          <Pressable onPress={land} style={styles.headerButton} hitSlop={12} disabled={saving}>
            <Text style={styles.skipLabel}>{t('onboarding.skip')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{t('onboarding.fieldsSubtitle')}</Text>

          {role === 'organizer' && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.orgNameLabel')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('onboarding.orgNamePlaceholder')}
                placeholderTextColor={MUTED}
                autoComplete="organization"
              />
            </View>
          )}

          {role === 'club' && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('login.clubName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('login.clubNamePlaceholder')}
                placeholderTextColor={MUTED}
                autoComplete="organization"
              />
            </View>
          )}

          {(role === 'club' || role === 'organizer') && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('onboarding.locationLabel')}<Text style={styles.optional}> {t('common.optional')}</Text></Text>
              <LocationInput
                value={location}
                onChangeText={text => { setLocation(text); setCoords(null) }}
                onSelect={r => { setLocation(r.label); setCoords({ lat: r.lat, lng: r.lng }) }}
                placeholder={t('onboarding.locationSearchPlaceholder')}
              />
            </View>
          )}

          {role === 'fighter' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>{t('login.name')}<Text style={styles.optional}> {t('common.optional')}</Text></Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('login.namePlaceholder')}
                  placeholderTextColor={MUTED}
                  autoComplete="name"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('onboarding.clubJoinLabel')}<Text style={styles.optional}> {t('common.optional')}</Text></Text>
                <TextInput
                  style={styles.input}
                  value={clubQuery}
                  onChangeText={text => { setClubQuery(text); setClubId(null) }}
                  placeholder={t('onboarding.clubJoinPlaceholder')}
                  placeholderTextColor={MUTED}
                />
                {suggestions.length > 0 && (
                  <View style={styles.dropdown}>
                    {suggestions.map((c, i) => (
                      <Pressable key={c.id} style={[styles.option, i === suggestions.length - 1 && styles.optionLast]} onPress={() => { setClubId(c.id); setClubQuery(c.name) }}>
                        <Text style={styles.optionText}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t('onboarding.clubJoinWeightLabel')}<Text style={styles.optional}> {t('common.optional')}</Text></Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={t('onboarding.clubJoinWeightPlaceholder')}
                  placeholderTextColor={MUTED}
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={saving ? t('login.pleaseWait') : t('onboarding.next')} uppercase={false} disabled={saving} onPress={save} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 52 },
  headerButton: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  skipLabel: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED },
  scroll: { padding: 20, paddingTop: 14, paddingBottom: 20 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 30, color: TEXT, letterSpacing: -0.4, marginBottom: 8 },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14.5, color: MUTED, lineHeight: 20, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', marginBottom: 7 },
  optional: { fontFamily: FONT_BODY, fontSize: 11, letterSpacing: 0, textTransform: 'none', color: MUTED },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 12 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  option: { padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
})
