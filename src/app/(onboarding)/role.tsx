import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding, type Persona } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import type { Role } from '@/auth/AuthContext'
import { Icon, type IconName } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import GlassSurface from '@/components/glass/GlassSurface'
import Button from '@/components/Button'
import StepIndicator from '@/onboarding/StepIndicator'
import { mainFlowStepNumber, MAIN_FLOW_TOTAL } from '@/onboarding/steps'
import { TEXT, MUTED, CARD, BORDER, ACCENT, ON_ACCENT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// The 3 personas the current product actually has, each mapping 1:1 onto
// the real backend role — no separate athlete/coach/fan breakdown anymore
// (that older, finer split still exists for viewer-goals.tsx and friends,
// which this flow no longer routes to, but stays reachable — see
// OnboardingContext's Persona comment).
const CARDS: { persona: Persona; role: Role; icon: IconName; titleKey: TranslationKey; subKey: TranslationKey }[] = [
  { persona: 'fan', role: 'viewer', icon: 'eye', titleKey: 'onboarding.persona.viewer', subKey: 'onboarding.persona.viewerSub' },
  { persona: 'organizer', role: 'organizer', icon: 'bracket', titleKey: 'onboarding.persona.organizer', subKey: 'onboarding.persona.organizerSub' },
  { persona: 'club', role: 'club', icon: 'ring', titleKey: 'onboarding.persona.club', subKey: 'onboarding.persona.clubSub' },
]

export default function RoleScreen() {
  const { t } = useLanguage()
  const { persona, setPersona, setRole } = useOnboarding()
  const [selected, setSelected] = useState<Persona | null>(
    persona && CARDS.some(c => c.persona === persona) ? persona : null,
  )

  const confirm = () => {
    const card = CARDS.find(c => c.persona === selected)
    if (!card) return
    setPersona(card.persona)
    setRole(card.role)
    // Organizer gets its own next step — an org name and focus don't mean
    // much for someone there to host events rather than discover them.
    router.push(card.role === 'organizer' ? '/(onboarding)/organizer-info' : '/(onboarding)/location')
  }

  return (
    <Screen>
      <CenteredColumn style={styles.content}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <StepIndicator current={mainFlowStepNumber('role')} total={MAIN_FLOW_TOTAL} />
          <Text style={styles.title}>{t('onboarding.roleTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.roleSubtitle')}</Text>

          <View style={styles.stack}>
            {CARDS.map(card => {
              const isSelected = selected === card.persona
              const content = (
                <>
                  <Icon name={card.icon} size={24} color={TEXT} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{t(card.titleKey)}</Text>
                    <Text style={styles.cardSub}>{t(card.subKey)}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.check}>
                      <Icon name="check" size={14} color={ON_ACCENT} />
                    </View>
                  )}
                </>
              )
              return (
                <Pressable key={card.persona} onPress={() => setSelected(card.persona)}>
                  {isSelected ? (
                    <GlassSurface variant="card" strong style={styles.card}>
                      {content}
                    </GlassSurface>
                  ) : (
                    <View style={[styles.card, styles.cardFlat]}>{content}</View>
                  )}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('onboarding.next')} uppercase={false} disabled={!selected} onPress={confirm} />
        </View>
      </CenteredColumn>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scroll: { padding: 28, paddingTop: 60, paddingBottom: 20 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, color: TEXT, marginTop: 20, marginBottom: 6 },
  subtitle: { fontFamily: FONT_BODY, fontSize: 15, color: MUTED, marginBottom: 28 },
  stack: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16 },
  cardFlat: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 16, color: TEXT },
  cardSub: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 28, paddingTop: 0 },
})
