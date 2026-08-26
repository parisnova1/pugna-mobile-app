import { View, StyleSheet } from 'react-native'
import { ACCENT, BORDER } from '@/theme'

// Onboarding had no step progress feedback at all before this — welcome.tsx's
// pager dots are private to that screen's 3 slides, nothing else in the flow
// showed "how far along am I." `total` is passed in per-screen rather than
// hardcoded since it varies by persona (club's flow is shorter than fan's).
export default function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.segmentActive]} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  segment: { width: 24, height: 4, borderRadius: 2, backgroundColor: BORDER },
  segmentActive: { backgroundColor: ACCENT },
})
