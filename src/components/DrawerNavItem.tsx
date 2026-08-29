import { Pressable, Text, View, StyleSheet } from 'react-native'
import { Icon, type IconName } from './icons/Icon'
import NotificationBadge from './NotificationBadge'
import GlassSurface from './glass/GlassSurface'
import { TEXT, FONT_DISPLAY_BOLD } from '@/theme'

export default function DrawerNavItem({ icon, label, active, badge, onPress }: {
  icon: IconName
  label: string
  active: boolean
  badge?: number
  onPress: () => void
}) {
  const content = (
    <>
      <Icon name={icon} size={20} color={TEXT} />
      <Text style={styles.label}>{label}</Text>
      {!!badge && (
        <View style={styles.badgeSlot}>
          <NotificationBadge count={badge} />
        </View>
      )}
    </>
  )

  if (active) {
    return (
      <Pressable onPress={onPress} style={styles.rowWrap}>
        <GlassSurface variant="card" style={styles.row}>
          {content}
        </GlassSurface>
      </Pressable>
    )
  }

  return (
    <Pressable onPress={onPress} style={[styles.row, styles.rowWrap]}>
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rowWrap: { marginHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 4 },
  label: { flex: 1, fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 0.4, color: TEXT, textTransform: 'uppercase' },
  badgeSlot: { marginLeft: 8 },
})
