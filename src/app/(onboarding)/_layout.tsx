import { Stack } from 'expo-router'
import { BG } from '@/theme'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG }, gestureEnabled: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role" />
      <Stack.Screen name="location" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="permissions" />
    </Stack>
  )
}
