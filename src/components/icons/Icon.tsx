import Svg, { Path, Circle, Ellipse, Rect, Line, Polygon } from 'react-native-svg'
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
  | 'broadcast' | 'bracket' | 'bell' | 'calendarMark'
  | 'followPerson' | 'followClub' | 'scan' | 'calendarCheck'

// Data-driven monochrome icon set (48x48, hero mark 160x160) — one shared
// component instead of 19 near-identical SVG files, matching this redesign's
// own "extract one primitive instead of N inline copies" principle. Every
// icon uses `currentColor`-style semantics via the `color` prop so it always
// inherits a real theme token (TEXT/ACCENT/ON_ACCENT), never a hardcoded hue —
// this app's monochrome rule (see src/theme/index.ts) applies here too.
const ICONS: Record<IconName, IconDef> = {
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
  eye: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M6 24 Q24 8 42 24 Q24 40 6 24 Z' },
      { t: 'circle', cx: 24, cy: 24, r: 7 },
      { t: 'circle', cx: 26.5, cy: 21.5, r: 2, fill: true },
    ],
  },
  clipboard: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 10, y: 8, w: 28, h: 34, rx: 3 },
      { t: 'rect', x: 18, y: 4, w: 12, h: 8, rx: 2 },
      { t: 'line', x1: 15, y1: 21, x2: 26, y2: 21 },
      { t: 'path', d: 'M15 33 L18 36 L24 30' },
      { t: 'line', x1: 15, y1: 27, x2: 30, y2: 27 },
    ],
  },
  kick: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M10 10 L24 26 L36 18' },
      { t: 'rect', x: 33, y: 14, w: 10, h: 7, rx: 3 },
    ],
  },
  octagon: {
    viewBox: '0 0 48 48',
    prims: [{ t: 'polygon', points: '17,6 31,6 40,15 40,29 31,38 17,38 8,29 8,15' }],
  },
  belt: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 8, y: 21, w: 32, h: 7, rx: 3.5 },
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
      { t: 'rect', x: 6, y: 20, w: 30, h: 9, rx: 4.5, transform: 'rotate(-20 21 24.5)' },
      { t: 'rect', x: 12, y: 20, w: 30, h: 9, rx: 4.5, transform: 'rotate(20 27 24.5)' },
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
  bell: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M14 28 L14 18 Q14 9 24 9 Q34 9 34 18 L34 28' },
      { t: 'line', x1: 10, y1: 28, x2: 38, y2: 28 },
      { t: 'circle', cx: 24, cy: 5, r: 2, fill: true },
      { t: 'path', d: 'M20 32 Q24 37 28 32' },
    ],
  },
  calendarMark: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 7, y: 10, w: 34, h: 30, rx: 4 },
      { t: 'line', x1: 7, y1: 19, x2: 41, y2: 19 },
      { t: 'line', x1: 15, y1: 5, x2: 15, y2: 13 },
      { t: 'line', x1: 33, y1: 5, x2: 33, y2: 13 },
      { t: 'circle', cx: 24, cy: 29, r: 3, fill: true },
    ],
  },
  followPerson: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'circle', cx: 17, cy: 14, r: 7 },
      { t: 'path', d: 'M5 38 Q5 25 17 25 Q29 25 29 38' },
      { t: 'circle', cx: 36, cy: 12, r: 7 },
      { t: 'line', x1: 36, y1: 8, x2: 36, y2: 16 },
      { t: 'line', x1: 32, y1: 12, x2: 40, y2: 12 },
    ],
  },
  followClub: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 5, y: 18, w: 24, h: 20, rx: 2 },
      { t: 'rect', x: 10, y: 23, w: 4, h: 4, fill: true },
      { t: 'rect', x: 20, y: 23, w: 4, h: 4, fill: true },
      { t: 'rect', x: 10, y: 31, w: 4, h: 4, fill: true },
      { t: 'rect', x: 20, y: 31, w: 4, h: 4, fill: true },
      { t: 'circle', cx: 37, cy: 13, r: 7 },
      { t: 'line', x1: 37, y1: 9, x2: 37, y2: 17 },
      { t: 'line', x1: 33, y1: 13, x2: 41, y2: 13 },
    ],
  },
  scan: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'path', d: 'M8 16 V8 H16' },
      { t: 'path', d: 'M32 8 H40 V16' },
      { t: 'path', d: 'M40 32 V40 H32' },
      { t: 'path', d: 'M16 40 H8 V32' },
      { t: 'circle', cx: 24, cy: 24, r: 5 },
    ],
  },
  calendarCheck: {
    viewBox: '0 0 48 48',
    prims: [
      { t: 'rect', x: 7, y: 10, w: 34, h: 30, rx: 4 },
      { t: 'line', x1: 7, y1: 19, x2: 41, y2: 19 },
      { t: 'line', x1: 15, y1: 5, x2: 15, y2: 13 },
      { t: 'line', x1: 33, y1: 5, x2: 33, y2: 13 },
      { t: 'path', d: 'M17 29 L22 34 L32 24' },
    ],
  },
}

export function Icon({
  name,
  size = 24,
  color = TEXT,
  strokeWidth = 2.6,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  const def = ICONS[name]
  return (
    <Svg width={size} height={size} viewBox={def.viewBox} fill="none">
      {def.prims.map((p, i) => {
        const fillProps = 'fill' in p && p.fill ? { fill: color, stroke: 'none' } : { stroke: color, strokeWidth }
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
