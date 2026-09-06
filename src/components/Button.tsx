import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { ACCENT, ON_ACCENT, TEXT, FONT_DISPLAY_BOLD, SURFACE_BORDER } from '@/theme'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  // Every existing call site relies on the established all-caps micro-copy
  // (tab labels, list actions, etc.) — defaults true so none of them change.
  // Onboarding/auth screens opt into the product spec's sentence-case labels
  // ("Weiter", "Konto erstellen") by passing false.
  uppercase?: boolean
  style?: StyleProp<ViewStyle>
}

// Signal Graphite reserves glass/blur for chrome (bars, sheets, chips) —
// the one primary action per screen is a flat, solid signal-red fill
// instead, so it reads unmistakably as "the thing to press" rather than
// blending into the same frosted treatment as everything around it.
export default function Button({ label, onPress, variant = 'primary', disabled, uppercase = true, style }: Props) {
  const labelStyle = [
    styles.label,
    !uppercase && styles.labelSentenceCase,
    variant === 'primary' && styles.labelOnAccent,
  ]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.base, variant === 'primary' && styles.primary, variant === 'outline' && styles.outline]}>
        <Text style={labelStyle}>{label}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: ACCENT },
  outline: { borderWidth: 1, borderColor: SURFACE_BORDER },
  label: {
    fontFamily: FONT_DISPLAY_BOLD,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT,
  },
  labelOnAccent: { color: ON_ACCENT },
  labelSentenceCase: { textTransform: 'none', letterSpacing: 0, fontSize: 16.5 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
})
