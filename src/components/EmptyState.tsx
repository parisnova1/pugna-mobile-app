import { View, Text, StyleSheet } from 'react-native'
import Button from './Button'
import { CARD, BORDER, MUTED, FONT_BODY } from '@/theme'

export default function EmptyState({ message, ctaLabel, onPress }: { message: string; ctaLabel?: string; onPress?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {ctaLabel && onPress && <Button label={ctaLabel} variant="outline" onPress={onPress} style={styles.cta} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 28, alignItems: 'center' },
  message: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 16 },
  cta: { paddingVertical: 10, paddingHorizontal: 20 },
})
