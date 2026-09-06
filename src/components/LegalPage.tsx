import type { ReactNode } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import Screen from './Screen'
import BackButton from './BackButton'
import { TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_MONO_MEDIUM, FONT_BODY } from '@/theme'

// Shared chrome for /impressum, /datenschutz, /nutzung — simple readable
// text pages, reachable without an account (linked from Welcome and
// Settings). Labels stay German regardless of app language per the legal
// spec; only this file's title prop varies per route.
export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </Screen>
  )
}

export function LegalSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  )
}

export function LegalDivider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 8, paddingBottom: 60 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 26, color: TEXT, marginBottom: 22 },
  section: { gap: 8, paddingVertical: 4 },
  label: { fontFamily: FONT_MONO_MEDIUM, fontSize: 10.5, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  body: { fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 24, color: TEXT },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },
})
