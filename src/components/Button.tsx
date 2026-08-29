import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import GlassSurface from './glass/GlassSurface'
import { TEXT, FONT_DISPLAY_BOLD, SURFACE_BORDER } from '@/theme'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

// Pill-shaped by default — mirrors the web app's global `button { border-radius: 9999px }` rule.
// Primary is a real frosted-glass surface (GlassSurface); outline/ghost stay flat — a
// button-sized blur adds little once there's no solid fill to distinguish it from.
export default function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {variant === 'primary' ? (
        <GlassSurface variant="pill" strong interactive style={styles.base}>
          <Text style={styles.label}>{label}</Text>
        </GlassSurface>
      ) : (
        <View style={[styles.base, variant === 'outline' && styles.outline]}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
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
  outline: { borderWidth: 1, borderColor: SURFACE_BORDER },
  label: {
    fontFamily: FONT_DISPLAY_BOLD,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
})
