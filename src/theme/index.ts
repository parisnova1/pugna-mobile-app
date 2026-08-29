// Shared design tokens, mirroring the per-file constants repeated at the top
// of every page in the web app (D:\pugna\src\pages\*.tsx). One shared file
// here instead of per-file duplication, since native styling isn't
// inline-CSS-in-JSX the same way the web app's is.
//
// Dark OLED "Liquid Glass" theme: true-black background, white text,
// translucent frosted-glass surfaces with a white top-edge specular
// highlight. Color stays reserved for meaning, same discipline as the prior
// monochrome theme — general UI (buttons, active nav state, borders) is
// white-on-black glass, not a saturated brand hue. The only real hues are
// LIVE_RED / CAUTION_AMBER / POSITIVE_GREEN, used only where they signal a
// status (a live bout, an injury pull-out, an accepted nomination).
export const BG = '#000000'
export const CARD = '#111114'
export const BORDER = 'rgba(255,255,255,0.14)'
export const MUTED = '#9a9a9a'
export const TEXT = '#ffffff'
export const ACCENT = '#ffffff'
export const ON_ACCENT = '#000000'
export const INPUT_BG = '#111114'

// Glass surface tokens, for the small set of high-visibility surfaces that
// get a real blur treatment (primary buttons, drawer active row, tab bar,
// modal sheets) rather than the flat CARD/BORDER treatment ordinary list
// rows use — see components/glass/GlassSurface.tsx.
export const SURFACE = '#111114'
export const SURFACE_STRONG = 'rgba(255,255,255,0.22)'
export const SURFACE_BORDER = 'rgba(255,255,255,0.16)'
export const SPECULAR = 'rgba(255,255,255,0.55)'
export const BLUR_INTENSITY = 40
export const MODAL_SCRIM = 'rgba(0,0,0,0.6)'

// Semantic status colors — the only hue in the app. Apple HIG system colors,
// chosen for legibility against true black.
export const LIVE_RED = '#ff453a'
export const CAUTION_AMBER = '#ff9f0a'
export const POSITIVE_GREEN = '#30d158'

export const FONT_DISPLAY = 'Geist_900Black'
export const FONT_DISPLAY_BOLD = 'Geist_700Bold'
export const FONT_BODY = 'Geist_400Regular'
export const FONT_BODY_MEDIUM = 'Geist_500Medium'
export const FONT_MONO = 'GeistMono_400Regular'
