// Shared design tokens, mirroring the per-file constants repeated at the top
// of every page in the web app (D:\pugna\src\pages\*.tsx). One shared file
// here instead of per-file duplication, since native styling isn't
// inline-CSS-in-JSX the same way the web app's is.
//
// Monochrome light theme: white background, black text, grey for surfaces,
// borders, and interactive highlights — no color hue anywhere (no blue, no
// red, no green), including for error/status states.
export const BG = '#ffffff'
export const CARD = '#f4f4f4'
export const BORDER = '#dcdcdc'
export const MUTED = '#767676'
export const TEXT = '#111111'
export const ACCENT = '#4a4a4a'
export const ON_ACCENT = '#ffffff'
export const INPUT_BG = '#f4f4f4'

export const FONT_DISPLAY = 'Geist_900Black'
export const FONT_DISPLAY_BOLD = 'Geist_700Bold'
export const FONT_BODY = 'Geist_400Regular'
export const FONT_BODY_MEDIUM = 'Geist_500Medium'
export const FONT_MONO = 'GeistMono_400Regular'
