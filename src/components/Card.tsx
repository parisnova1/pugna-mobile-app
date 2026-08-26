import type { ReactNode } from 'react'
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { CARD, BORDER, ACCENT } from '@/theme'

// Generic tappable/static container — extracted because role tiles, follow
// list rows, and personalized-entry tiles all otherwise reimplement the same
// CARD/BORDER/borderRadius box inline (same pattern as Chip.tsx).
export default function Card({
  children,
  onPress,
  selected,
  style,
}: {
  children: ReactNode
  onPress?: () => void
  selected?: boolean
  style?: StyleProp<ViewStyle>
}) {
  // `style` must land on whichever element is outermost in each branch —
  // a layout width like '48%' (used for grid tiles) resolves against this
  // component's own slot in its parent's flex row, so it's meaningless one
  // level further in on a wrapped inner View while the actual outer
  // Pressable stays unsized and collapses the whole grid to full width.
  if (!onPress) {
    return <View style={[styles.card, selected && styles.selected, style]}>{children}</View>
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  selected: { borderColor: ACCENT, borderWidth: 2 },
  pressed: { opacity: 0.8 },
})
