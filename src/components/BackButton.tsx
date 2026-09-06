import { Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Icon } from './icons/Icon'
import { TEXT } from '@/theme'

// Icon-only back arrow, matching the design — no "Zurück" text label.
export default function BackButton() {
  return (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.button} hitSlop={12}>
      <Icon name="chevronBack" size={22} color={TEXT} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
})
