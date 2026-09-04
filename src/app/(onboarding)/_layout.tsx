import { Stack } from 'expo-router'
import { BG } from '@/theme'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG }, gestureEnabled: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="persona" />
      <Stack.Screen name="viewer-goals" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="gym" />
      <Stack.Screen name="location" />
      <Stack.Screen name="follow" />
      <Stack.Screen name="organizer-info" />
      <Stack.Screen name="organizer-focus" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="ready" />
      <Stack.Screen name="club-info" />
    </Stack>
  )
}
