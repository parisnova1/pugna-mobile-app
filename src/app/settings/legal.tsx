import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Screen from '@/components/Screen'
import BackButton from '@/components/BackButton'
import { Icon } from '@/components/icons/Icon'
import { TEXT, MUTED, CARD, BORDER, FONT_DISPLAY, FONT_BODY_MEDIUM } from '@/theme'

const LINKS: { label: string; href: '/impressum' | '/datenschutz' | '/nutzung' }[] = [
  { label: 'Impressum', href: '/impressum' },
  { label: 'Datenschutz', href: '/datenschutz' },
  { label: 'Nutzungsbedingungen', href: '/nutzung' },
]

// Labels stay German regardless of app language, same rule as everywhere
// else legal chrome appears (Welcome's footer, the pages themselves).
export default function SettingsLegalScreen() {
  return (
    <Screen style={{ paddingHorizontal: 20 }}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Rechtliches</Text>
      </View>

      <View style={styles.list}>
        {LINKS.map((link, i) => (
          <Pressable key={link.href} onPress={() => router.push(link.href)} style={[styles.row, i < LINKS.length - 1 && styles.rowDivider]}>
            <Text style={styles.rowLabel}>{link.label}</Text>
            <Icon name="chevronForward" size={18} color={MUTED} />
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 22, color: TEXT },
  list: { marginTop: 20, backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: BORDER },
  rowLabel: { fontFamily: FONT_BODY_MEDIUM, fontSize: 15, color: TEXT },
})
