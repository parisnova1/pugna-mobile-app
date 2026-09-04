import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { Icon } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import CenteredColumn from '@/components/CenteredColumn'
import Button from '@/components/Button'
import { TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

// One screen — wordmark, tagline, primary CTA, login link. Replaces the
// previous 3-slide marketing carousel per the agreed product spec.
export default function WelcomeScreen() {
  const { t } = useLanguage()

  return (
    <Screen>
      <CenteredColumn style={styles.content}>
        <View style={styles.hero}>
          <Icon name="hero" size={64} color={TEXT} />
          <Text style={styles.wordmark}>Pugna</Text>
          <Text style={styles.tagline}>{t('onboarding.welcome1')}</Text>
        </View>

        <View style={styles.footer}>
          <Button
            label={t('onboarding.getStarted')}
            uppercase={false}
            onPress={() => router.push('/(onboarding)/persona')}
          />
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginLink} hitSlop={8}>
            <Text style={styles.loginLinkText}>{t('onboarding.alreadyHaveAccount')}</Text>
          </Pressable>
        </View>
      </CenteredColumn>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 60 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  wordmark: { fontFamily: FONT_DISPLAY, fontSize: 40, color: TEXT },
  tagline: { fontFamily: FONT_BODY, fontSize: 17, color: MUTED, textAlign: 'center' },
  footer: { gap: 16 },
  loginLink: { alignSelf: 'center', padding: 4 },
  loginLinkText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', textDecorationLine: 'underline' },
})
