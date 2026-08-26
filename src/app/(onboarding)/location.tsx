import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useOnboarding } from '@/onboarding/OnboardingContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import { TEXT, BORDER, MUTED, INPUT_BG, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function LocationScreen() {
  const { t } = useLanguage()
  const { homeLocation, setHomeLocation } = useOnboarding()
  const [value, setValue] = useState(homeLocation)

  const submit = () => {
    setHomeLocation(value.trim())
    router.push('/(onboarding)/interests')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackLink />
        <SkipLink />
        <View style={styles.content}>
          <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.locationSubtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('onboarding.locationLabel')}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={t('login.homeLocationPlaceholder')}
              placeholderTextColor={MUTED}
              returnKeyType="next"
              onSubmitEditing={submit}
            />
          </View>

          <Button label={t('onboarding.next')} onPress={submit} style={styles.button} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 28, paddingTop: 100, justifyContent: 'center' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 30, textTransform: 'uppercase', color: TEXT, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 },
  field: { marginBottom: 24 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  button: {},
})
