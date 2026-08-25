import { useFonts } from 'expo-font'
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_700Bold,
  Geist_900Black,
} from '@expo-google-fonts/geist'
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono'

export function useAppFonts() {
  return useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_700Bold,
    Geist_900Black,
    GeistMono_400Regular,
  })
}
