// Shared design tokens, mirroring the per-file constants repeated at the top
// of every page in the web app (D:\pugna\src\pages\*.tsx). One shared file
// here instead of per-file duplication, since native styling isn't
// inline-CSS-in-JSX the same way the web app's is.
//
// "Signal Graphite" theme (locked palette): near-black void background,
// warm off-white text, a single signal-red accent reserved for the one
// primary action per screen and for live/status indicators. Glass/blur is
// reserved for chrome — top bars, tab bar, sheets, chips — never for
// primary buttons, which are solid signal fill so they read unmistakably
// as "the one thing to press."
export const BG = '#0B0C0E' // void
export const CARD = '#14161A' // panel
export const BORDER = 'rgba(255,255,255,0.08)'
export const MUTED = '#8A8580' // mute
export const TEXT = '#F4F1EC' // type
export const ACCENT = '#DC3A2C' // signal
export const ON_ACCENT = '#0B0C0E' // onSignal — dark text on signal-red fills
export const INPUT_BG = '#14161A'

// Glass surface tokens, for the small set of high-visibility surfaces that
// get a real blur treatment (drawer active row, tab bar, modal sheets,
// chips) rather than the flat CARD/BORDER treatment ordinary list rows
// use — see components/glass/GlassSurface.tsx.
export const SURFACE = 'rgba(20,22,26,0.64)' // glass fill
export const SURFACE_STRONG = 'rgba(20,22,26,0.82)'
export const SURFACE_BORDER = 'rgba(255,255,255,0.10)'
export const SPECULAR = 'rgba(255,255,255,0.10)'
export const BLUR_INTENSITY = 30
export const MODAL_SCRIM = 'rgba(11,12,14,0.55)'
export const GLASS = 'rgba(20,22,26,0.64)'

// Semantic status colors. LIVE reuses the signal red itself — there is only
// one red in this palette. Amber/green stay for delay/positive states that
// need to read differently from both "live" and plain muted text.
export const LIVE_RED = '#DC3A2C'
export const CAUTION_AMBER = '#ff9f0a'
export const POSITIVE_GREEN = '#30d158'

export const FONT_DISPLAY = 'Geist_600SemiBold'
export const FONT_DISPLAY_BOLD = 'Geist_700Bold'
export const FONT_BODY = 'Geist_400Regular'
export const FONT_BODY_MEDIUM = 'Geist_500Medium'
export const FONT_MONO = 'GeistMono_400Regular'
export const FONT_MONO_MEDIUM = 'GeistMono_500Medium'
