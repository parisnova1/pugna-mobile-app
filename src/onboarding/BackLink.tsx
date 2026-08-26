import { Pressable, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useLanguage } from '@/i18n/LanguageContext'
import { MUTED, FONT_DISPLAY_BOLD } from '@/theme'

// Mirrors SkipLink's positioning (opposite corner) so every onboarding
// screen can drop both in without touching its own layout. Defaults to
// router.back() — safe for every screen except the first slide of welcome,
// which has nothing to go back to and passes its own onPress instead
// (stepping to the previous slide) or omits this component entirely.
export default function BackLink({ onPress }: { onPress?: () => void }) {
  const { t } = useLanguage()
  return (
    <Pressable style={styles.back} hitSlop={12} onPress={onPress ?? (() => router.back())}>
      <Ionicons name="chevron-back" size={16} color={MUTED} />
      <Text style={styles.label}>{t('common.back')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 2, padding: 6, zIndex: 1 },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
})
