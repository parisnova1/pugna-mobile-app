import { Pressable, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MUTED, FONT_DISPLAY_BOLD } from '@/theme'
import { useLanguage } from '@/i18n/LanguageContext'

export default function BackButton() {
  const { t } = useLanguage()
  return (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.row} hitSlop={12}>
      <Ionicons name="chevron-back" size={18} color={MUTED} />
      <Text style={styles.label}>{t('common.back')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: MUTED },
})
