import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Icon, type IconName } from './icons/Icon'
import { ACCENT, ON_ACCENT, BORDER, MUTED, FONT_DISPLAY_BOLD } from '@/theme'

// Extracted from what every discipline/filter chip in the app already
// hand-rolled inline (events.tsx, clubs.tsx, onboarding/interests.tsx) —
// same visual result, one place to maintain it, plus an optional icon slot
// the onboarding redesign's chip grids need that none of those had before.
export default function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string
  selected: boolean
  onPress: () => void
  icon?: IconName
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive, style]}>
      {icon && <Icon name={icon} size={16} color={selected ? ON_ACCENT : MUTED} />}
      <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 9, paddingHorizontal: 16 },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  labelActive: { color: ON_ACCENT },
})
