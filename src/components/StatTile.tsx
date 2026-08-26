import { Pressable, Text, View, StyleSheet } from 'react-native'
import { ACCENT, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD } from '@/theme'

// Extracted from the pattern organizer/index.tsx hand-rolled 3x inline for its
// stats row — Home/Overview needs the same shape again, so this is a real
// existing duplication being fixed, not speculative scaffolding.
export default function StatTile({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper style={styles.stat} onPress={onPress}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  stat: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  value: { fontFamily: FONT_DISPLAY, fontSize: 26, color: ACCENT },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
})
