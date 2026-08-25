import { useFonts } from 'expo-font'
import { Ionicons } from '@expo/vector-icons'
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
    // Every icon in the app is <Ionicons/>. Its glyphs render via a web font
    // that @expo/vector-icons otherwise registers lazily per-icon-instance
    // (Font.loadAsync in Icon's own componentDidMount). On static export,
    // that per-instance load lands after the page's HTML snapshot is taken,
    // so the exported HTML always has the icon unloaded (empty glyph) while
    // a hydrating client — which starts from that same exported HTML and
    // therefore already has the icon's @font-face rule in <head> — sees it
    // as already loaded on its very first render. That divergence is a real
    // hydration mismatch (React #418) at the first icon in the tree, and
    // since nothing below it in that boundary hydrates either, it takes out
    // the whole page section that follows (e.g. the homepage's events list).
    // Preloading it here, alongside the other fonts this hook already gates
    // rendering on, makes it resolve deterministically before first paint on
    // both sides instead of racing a lazy per-icon load.
    ...Ionicons.font,
  })
}
