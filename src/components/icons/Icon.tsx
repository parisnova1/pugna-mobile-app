import Svg, { Path, Circle, Ellipse, Rect, Line, Polygon } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { TEXT } from '@/theme'

type Prim =
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill?: true; transform?: string }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: true }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'path'; d: string }
  | { t: 'polygon'; points: string }

type IconDef = { viewBox: string; prims: Prim[] }

export type IconName =
  | 'hero' | 'glove' | 'whistle' | 'ring' | 'eye' | 'clipboard'
  | 'kick' | 'octagon' | 'belt' | 'elbow' | 'clinch'
  | 'broadcast' | 'bracket' | 'bell' | 'bellOff' | 'calendarMark'
  | 'followPerson' | 'followClub' | 'scan' | 'calendarCheck' | 'settings'
  | 'close' | 'chevronBack' | 'chevronForward' | 'arrowForward' | 'search'
  | 'flash' | 'shield' | 'personCircle' | 'statsChart' | 'logout'
  | 'bookmark' | 'share' | 'personAdd' | 'check' | 'pin'

// Only the glyphs Ionicons has no real equivalent for stay hand-drawn: the
// brand mark and combat-sport-specific shapes (glove, whistle, ring, kick,
// octagon, belt, elbow, clinch, tournament bracket). Every generic UI glyph
// (nav chrome, actions, chips) now renders through Ionicons' outline/sharp
// pair instead — see the `filled` prop on Icon() below — for a crisper,
// more current look than this file's original all-hand-drawn set.
const ICONS: Record<'hero' | 'glove' | 'whistle' | 'ring' | 'kick' | 'octagon' | 'belt' | 'elbow' | 'clinch' | 'broadcast' | 'bracket', IconDef> = {
  hero: {
    viewBox: '0 0 160 160',
    prims: [
      { t: 'rect', x: 26, y: 26, w: 108, h: 108, rx: 6 },
      { t: 'circle', cx: 26, cy: 26, r: 6, fill: true },
      { t: 'circle', cx: 134, cy: 26, r: 6, fill: true },
      { t: 'circle', cx: 26, cy: 134, r: 6, fill: true },
      { t: 'circle', cx: 134, cy: 134, r: 6, fill: true },
      { t: 'line', x1: 26, y1: 61, x2: 134, y2: 61 },
      { t: 'line', x1: 26, y1: 99, x2: 134, y2: 99 },
      { t: 'line', x1: 61, y1: 26, x2: 61, y2: 134 },
      { t: 'line', x1: 99, y1: 26, x2: 99, y2: 134 },
      { t: 'circle', cx: 80, cy: 80, r: 22 },
      { t: 'circle', cx: 80, cy: 80, r: 12, fill: true },
    ],
  },
  glove: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'ellipse', cx: 26, cy: 22, rx: 13, ry: 11 },
      { t: 'circle', cx: 14, cy: 18, r: 6 },
      { t: 'rect', x: 18, y: 30, w: 16, h: 12, rx: 5 },
    ],
  },
  whistle: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'circle', cx: 20, cy: 24, r: 10 },
      { t: 'rect', x: 30, y: 20, w: 10, h: 8, rx: 3 },
      { t: 'circle', cx: 20, cy: 24, r: 2.4, fill: true },
      { t: 'path', d: 'M14 15 Q17 9 23 10' },
    ],
  },
  ring: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 8, y: 10, w: 32, h: 28, rx: 3 },
      { t: 'circle', cx: 8, cy: 10, r: 2.6, fill: true },
      { t: 'circle', cx: 40, cy: 10, r: 2.6, fill: true },
      { t: 'circle', cx: 8, cy: 38, r: 2.6, fill: true },
      { t: 'circle', cx: 40, cy: 38, r: 2.6, fill: true },
      { t: 'line', x1: 8, y1: 10, x2: 40, y2: 38 },
      { t: 'line', x1: 40, y1: 10, x2: 8, y2: 38 },
    ],
  },
  kick: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M10 10 L24 26 L36 18' },
      { t: 'rect', x: 33, y: 14, w: 10, h: 7, rx: 2 },
    ],
  },
  octagon: {
    viewBox: '0 0 48 48',
    prims: [{ t: 'polygon', points: '17,6 31,6 40,15 40,29 31,38 17,38 8,29 8,15' }],
  },
  belt: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 8, y: 21, w: 32, h: 7, rx: 2 },
      { t: 'circle', cx: 24, cy: 24.5, r: 6 },
      { t: 'line', x1: 20, y1: 30, x2: 15, y2: 40 },
      { t: 'line', x1: 28, y1: 30, x2: 33, y2: 40 },
    ],
  },
  elbow: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M10 36 L22 24 L34 12' },
      { t: 'path', d: 'M22 24 L18 15 M22 24 L27 14 M22 24 L31 19' },
    ],
  },
  clinch: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 6, y: 20, w: 30, h: 9, rx: 2, transform: 'rotate(-20 21 24.5)' },
      { t: 'rect', x: 12, y: 20, w: 30, h: 9, rx: 2, transform: 'rotate(20 27 24.5)' },
    ],
  },
  broadcast: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'circle', cx: 8, cy: 40, r: 3, fill: true },
      { t: 'path', d: 'M14 40 A12 12 0 0 0 26 28' },
      { t: 'path', d: 'M20 40 A20 20 0 0 0 40 20' },
    ],
  },
  bracket: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'circle', cx: 12, cy: 10, r: 3.2, fill: true },
      { t: 'circle', cx: 36, cy: 10, r: 3.2, fill: true },
      { t: 'circle', cx: 24, cy: 36, r: 3.2, fill: true },
      { t: 'path', d: 'M12 13 L12 20 L24 20 L24 33' },
      { t: 'path', d: 'M36 13 L36 20 L24 20' },
    ],
  },
}

// Maps every non-hand-drawn IconName onto an Ionicons base glyph name —
// suffixed with '-outline' (default) or '-sharp' (filled=true) at render
// time, see Icon() below.
const IONICONS_MAP: Record<Exclude<IconName, keyof typeof ICONS>, string> = {
  eye: 'eye',
  clipboard: 'clipboard',
  bell: 'notifications',
  bellOff: 'notifications-off',
  calendarMark: 'calendar',
  followPerson: 'people',
  followClub: 'business',
  scan: 'scan',
  calendarCheck: 'calendar',
  settings: 'settings',
  close: 'close',
  chevronBack: 'chevron-back',
  chevronForward: 'chevron-forward',
  arrowForward: 'arrow-forward',
  search: 'search',
  flash: 'flash',
  shield: 'shield',
  personCircle: 'person-circle',
  statsChart: 'stats-chart',
  logout: 'log-out',
  bookmark: 'bookmark',
  share: 'share',
  personAdd: 'person-add',
  check: 'checkmark',
  pin: 'location',
}

export function Icon({
  name,
  size = 24,
  color = TEXT,
  strokeWidth = 2.2,
  filled,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  // Hand-drawn set: solid fill instead of outline. Ionicons set: the bold,
  // sharp-cornered '-sharp' variant instead of the default thin outline —
  // used for active/selected/emphasized states (an active tab, a saved
  // bookmark, a selected persona card) rather than a second icon definition.
  filled?: boolean
}) {
  if (name in IONICONS_MAP) {
    const base = IONICONS_MAP[name as Exclude<IconName, keyof typeof ICONS>]
    const ioniconsName = `${base}-${filled ? 'sharp' : 'outline'}` as keyof typeof Ionicons.glyphMap
    return <Ionicons name={ioniconsName} size={size} color={color} />
  }

  const def = ICONS[name as keyof typeof ICONS]
  return (
    <Svg width={size} height={size} viewBox={def.viewBox} fill="none">
      {def.prims.map((p, i) => {
        const fillProps =
          filled || ('fill' in p && p.fill) ? { fill: color, stroke: 'none' } : { stroke: color, strokeWidth }
        const common = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...fillProps }
        switch (p.t) {
          case 'rect':
            return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx ?? 0} transform={p.transform} {...common} />
          case 'circle':
            return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} {...common} />
          case 'ellipse':
            return <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} {...common} />
          case 'line':
            return <Line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} {...common} />
          case 'path':
            return <Path key={i} d={p.d} {...common} />
          case 'polygon':
            return <Polygon key={i} points={p.points} {...common} />
        }
      })}
    </Svg>
  )
}
