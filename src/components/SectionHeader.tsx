import { Text, StyleSheet } from 'react-native'
import { MUTED, FONT_DISPLAY_BOLD } from '@/theme'

// Drawer-only: the uppercase group label ("HOME"/"TRAINING"/...) repeats 5x
// in club-admin/_layout.tsx's custom drawerContent — worth naming.
export default function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>
}

const styles = StyleSheet.create({
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, marginLeft: 16 },
})
