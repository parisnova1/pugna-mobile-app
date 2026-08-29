import type { ReactNode } from 'react'
import { Platform, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import { SURFACE, SURFACE_STRONG, SURFACE_BORDER, SPECULAR, BLUR_INTENSITY } from '@/theme'

// Reserved for the small set of high-visibility, low-instance-count surfaces
// (primary buttons, the drawer's active row, the tab bar, modal sheets) —
// ordinary list rows (Card, Chip) get the flat SURFACE/SURFACE_BORDER token
// treatment instead, since real blur per-instance in a scrollable list is
// wasted cost for a look nobody will compare side-by-side.
//
// Uses the native `GlassView` (real iOS 26 Liquid Glass) where available,
// falling back everywhere else (Android, and web — where this is what the
// Browser-pane preview actually exercises) to `expo-blur`'s `BlurView` plus
// a manual top-edge specular highlight, since only the native path renders
// its own.
const useNativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable()

export default function GlassSurface({
  children,
  variant = 'card',
  strong,
  interactive,
  style,
}: {
  children?: ReactNode
  variant?: 'pill' | 'card'
  strong?: boolean
  interactive?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const radius = variant === 'pill' ? 9999 : 16

  if (useNativeGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    )
  }

  return (
    <BlurView
      intensity={BLUR_INTENSITY}
      tint="dark"
      style={[
        styles.fallback,
        { borderRadius: radius, backgroundColor: strong ? SURFACE_STRONG : SURFACE },
        style,
      ]}
    >
      <View style={[styles.specular, { borderRadius: radius }]} pointerEvents="none" />
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  fallback: { borderWidth: 1, borderColor: SURFACE_BORDER, overflow: 'hidden' },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderColor: SPECULAR,
  },
})
