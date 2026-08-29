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

// Liquid Glass tokens — additive only for now (dark OLED + glass panels).
// Not yet applied to any screen: the full rollout happens in one pass once
// every net-new sprint screen already exists, to avoid restyling twice. See
// the boxing-sprint plan's Slice 10.
export const GLASS_BG = '#000000'
export const GLASS_SURFACE = 'rgba(255,255,255,0.06)'
export const GLASS_BORDER = 'rgba(255,255,255,0.14)'
export const GLASS_SPECULAR = 'rgba(255,255,255,0.35)'
export const GLASS_TEXT = '#ffffff'
export const GLASS_MUTED = '#9a9a9a'
export const GLASS_ACCENT = '#0a84ff'
export const GLASS_ON_ACCENT = '#ffffff'
export const GLASS_DANGER = '#ff453a'
export const GLASS_CAUTION = '#ff9f0a'
export const GLASS_POSITIVE = '#30d158'
export const GLASS_BLUR_INTENSITY = 40

export const FONT_DISPLAY = 'Geist_900Black'
export const FONT_DISPLAY_BOLD = 'Geist_700Bold'
export const FONT_BODY = 'Geist_400Regular'
export const FONT_BODY_MEDIUM = 'Geist_500Medium'
export const FONT_MONO = 'GeistMono_400Regular'
