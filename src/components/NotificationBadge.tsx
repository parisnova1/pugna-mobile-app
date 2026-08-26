import { Text, View, StyleSheet } from 'react-native'
import { ACCENT, ON_ACCENT, FONT_DISPLAY_BOLD } from '@/theme'

export default function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{count > 99 ? '99+' : count}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, color: ON_ACCENT },
})
