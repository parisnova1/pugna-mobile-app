import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import GlassSurface from './glass/GlassSurface'
import { TEXT, FONT_DISPLAY_BOLD, SURFACE_BORDER } from '@/theme'

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

// Pill-shaped by default — mirrors the web app's global `button { border-radius: 9999px }` rule.
// Primary is a real frosted-glass surface (GlassSurface); outline/ghost stay flat — a
// button-sized blur adds little once there's no solid fill to distinguish it from.
export default function Button({ label, onPress, variant = 'primary', disabled, uppercase = true, style }: Props) {
  const labelStyle = [styles.label, !uppercase && styles.labelSentenceCase]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {variant === 'primary' ? (
        <GlassSurface variant="pill" strong interactive style={styles.base}>
          <Text style={labelStyle}>{label}</Text>
        </GlassSurface>
      ) : (
        <View style={[styles.base, variant === 'outline' && styles.outline]}>
          <Text style={labelStyle}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 9999,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { borderWidth: 1, borderColor: SURFACE_BORDER },
  label: {
    fontFamily: FONT_DISPLAY_BOLD,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT,
  },
  labelSentenceCase: { textTransform: 'none', letterSpacing: 0, fontSize: 16 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
})
