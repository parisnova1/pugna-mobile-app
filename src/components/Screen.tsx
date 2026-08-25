import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BG } from '@/theme'

export default function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
})
