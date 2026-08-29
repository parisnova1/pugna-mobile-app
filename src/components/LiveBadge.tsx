import { useEffect, useRef } from 'react'
import { Animated, Text, View, StyleSheet } from 'react-native'
import { LIVE_RED, SURFACE_BORDER, FONT_DISPLAY_BOLD } from '@/theme'

// LIVE is the one state the theme reserves real color for — see the
// LIVE_RED/CAUTION_AMBER/POSITIVE_GREEN comment in theme/index.ts.
export default function LiveBadge({ label = 'LIVE' }: { label?: string }) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 550, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <View style={styles.badge}>
      <Animated.View style={[styles.dot, { opacity }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 9999, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIVE_RED },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: LIVE_RED, textTransform: 'uppercase' },
})
