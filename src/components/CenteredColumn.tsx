import type { ReactNode } from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

// Caps content to a phone-width column and centers it, for onboarding/auth
// screens rendered in the web build at desktop widths — Screen.tsx (used
// app-wide) has no such cap since most of the app is fine going full-bleed;
// this is scoped to the handful of screens that explicitly need it instead.
export default function CenteredColumn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.column, style]}>{children}</View>
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: 390, alignSelf: 'center' },
})
