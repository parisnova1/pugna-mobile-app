import { View, Text, StyleSheet } from 'react-native'
import { useLanguage } from '@/i18n/LanguageContext'
import { BORDER, MUTED, FONT_DISPLAY_BOLD } from '@/theme'

export default function OrDivider() {
  const { t } = useLanguage()
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{t('login.orDivider')}</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
})
