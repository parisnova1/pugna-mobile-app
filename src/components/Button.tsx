import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { ACCENT, ON_ACCENT, FONT_DISPLAY_BOLD, BORDER, TEXT } from '@/theme'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

// Pill-shaped by default — mirrors the web app's global `button { border-radius: 9999px }` rule.
export default function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: ACCENT },
        variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: variant === 'outline' || variant === 'ghost' ? TEXT : ON_ACCENT },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_DISPLAY_BOLD,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
