import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding, type Persona } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations'
import type { Role } from '@/auth/AuthContext'
import { Icon, type IconName } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import Card from '@/components/Card'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import StepIndicator from '@/onboarding/StepIndicator'
import { TOTAL_STEPS } from '@/onboarding/steps'
import { ACCENT, ON_ACCENT, TEXT, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// 4 onboarding personas, per the redesign brief. Only 'club' maps to a real
// distinct backend role — athlete/coach/fan all become role 'viewer' (the
// backend has no concept of athlete/coach; see OnboardingContext.tsx's
// Persona type comment). Organizer is real and load-bearing in this app but
// deliberately not one of these 4 tiles — it gets its own smaller link below,
// so the primary choice doesn't get diluted with a 5th tile most viewers,
// athletes, coaches, and clubs would never pick.
const TILES: { persona: Persona; icon: IconName; titleKey: TranslationKey; subKey: TranslationKey }[] = [
  { persona: 'athlete', icon: 'glove', titleKey: 'onboarding.persona.athlete', subKey: 'onboarding.persona.athleteSub' },
  { persona: 'coach', icon: 'whistle', titleKey: 'onboarding.persona.coach', subKey: 'onboarding.persona.coachSub' },
  { persona: 'club', icon: 'ring', titleKey: 'onboarding.persona.club', subKey: 'onboarding.persona.clubSub' },
  { persona: 'fan', icon: 'eye', titleKey: 'onboarding.persona.fan', subKey: 'onboarding.persona.fanSub' },
]

export default function RoleScreen() {
  const { t } = useLanguage()
  const { persona, setPersona, setRole, finishOnboarding } = useOnboarding()

  const choose = (p: Persona) => {
    setPersona(p)
    const role: Role = p === 'club' ? 'club' : 'viewer'
    setRole(role)
    router.push(p === 'club' ? '/(onboarding)/club-info' : '/(onboarding)/viewer-goals')
  }

  const chooseOrganizer = async () => {
    // Organizer signup is a fully separate, already-built flow — onboarding's
    // job here is done, so it finishes now rather than leaving the flag
    // unset and re-triggering onboarding if the user backs out of signup.
    await finishOnboarding()
    router.replace({ pathname: '/(auth)/signup', params: { role: 'organizer' } })
  }

  return (
    <Screen>
      <BackLink />
      <SkipLink />
      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={2} total={TOTAL_STEPS.fan} />
        <Text style={styles.title}>{t('onboarding.roleTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.roleSubtitle')}</Text>

        <View style={styles.grid}>
          {TILES.map(tile => {
            const selected = persona === tile.persona
            return (
              <Card key={tile.persona} onPress={() => choose(tile.persona)} selected={selected} style={styles.tile}>
                <View style={[styles.tileIcon, selected && styles.tileIconSelected]}>
                  <Icon name={tile.icon} size={26} color={selected ? ON_ACCENT : TEXT} />
                </View>
                <Text style={styles.tileTitle}>{t(tile.titleKey)}</Text>
                <Text style={styles.tileSub}>{t(tile.subKey)}</Text>
              </Card>
            )
          })}
        </View>

        <Pressable onPress={chooseOrganizer} style={styles.organizerLink} hitSlop={8}>
          <Text style={styles.organizerLinkText}>{t('onboarding.organizerLink')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 28, paddingTop: 100, paddingBottom: 40, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', color: TEXT, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  tile: { width: '48%', alignItems: 'flex-start', gap: 4 },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileIconSelected: { backgroundColor: ACCENT },
  tileTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 15, color: TEXT, textTransform: 'uppercase' },
  tileSub: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, lineHeight: 16 },
  organizerLink: { alignSelf: 'center', marginTop: 24, padding: 4 },
  organizerLinkText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
})
