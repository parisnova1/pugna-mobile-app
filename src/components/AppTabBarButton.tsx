import { Text, View, Pressable, StyleSheet } from 'react-native'
import { Icon, type IconName } from './icons/Icon'
import { ACCENT, ON_ACCENT, MUTED, FONT_DISPLAY_BOLD } from '@/theme'

// Signal Graphite's tab bar treatment: the focused tab gets a solid
// signal-red pill wrapping icon + label; unfocused tabs stay a plain
// muted icon with a small label underneath. Shared between the viewer
// tabs and the organizer tabs so both bars match.
//
// Not typed against `BottomTabBarButtonProps` from `@react-navigation/
// bottom-tabs` — that package isn't a direct dependency here (expo-router
// vendors its own copy internally) — so this takes the props loosely.
// Focus state arrives as an `aria-selected` boolean prop (BottomTabItem.js
// builds the button's props itself and never sets `accessibilityState`),
// not the more commonly-documented `accessibilityState.selected`.
export function makeTabBarButton(icon: IconName, label: string) {
  return function TabBarButton({ onPress, style, 'aria-selected': ariaSelected, ...rest }: any) {
    const focused = !!ariaSelected
    return (
      <Pressable onPress={onPress} style={[style, styles.tabSlot]} {...rest}>
        <View style={[styles.pill, focused && styles.pillActive]}>
          <Icon name={icon} size={19} color={focused ? ON_ACCENT : MUTED} />
          {focused && <Text style={styles.pillLabel}>{label}</Text>}
        </View>
        {!focused && <Text style={styles.tabLabel}>{label}</Text>}
      </Pressable>
    )
  }
}

const styles = StyleSheet.create({
  tabSlot: { flex: 1, alignItems: 'center', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9999 },
  pillActive: { backgroundColor: ACCENT },
  pillLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: ON_ACCENT },
  tabLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED },
})
