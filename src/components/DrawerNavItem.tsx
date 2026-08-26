import { Pressable, Text, View, StyleSheet } from 'react-native'
import { Icon, type IconName } from './icons/Icon'
import NotificationBadge from './NotificationBadge'
import { ACCENT, ON_ACCENT, TEXT, MUTED, FONT_DISPLAY_BOLD } from '@/theme'

export default function DrawerNavItem({ icon, label, active, badge, onPress }: {
  icon: IconName
  label: string
  active: boolean
  badge?: number
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, active && styles.rowActive]}>
      <Icon name={icon} size={20} color={active ? ON_ACCENT : TEXT} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {!!badge && (
        <View style={styles.badgeSlot}>
          <NotificationBadge count={badge} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 4, marginHorizontal: 8 },
  rowActive: { backgroundColor: ACCENT },
  label: { flex: 1, fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.4, color: TEXT, textTransform: 'uppercase' },
  labelActive: { color: ON_ACCENT },
  badgeSlot: { marginLeft: 8 },
})
