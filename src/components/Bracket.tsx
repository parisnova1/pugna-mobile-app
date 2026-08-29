import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { ACCENT, CARD, BORDER, MUTED, TEXT, BG, FONT_DISPLAY_BOLD } from '@/theme'

export type Bout = {
  id: number
  round: number
  slot: number
  fighter_red_id: number | null
  fighter_blue_id: number | null
  status: string
  winner_id: number | null
  method: string | null
  event_day_id?: number | null
}

type FighterLookup = Record<number, { name: string; club: string }>

function fighterLabel(id: number | null, lookup: FighterLookup, isFirstRound: boolean): string {
  if (id === null) return isFirstRound ? 'BYE' : 'TBD'
  return lookup[id]?.name ?? `Fighter #${id}`
}

// Round-by-round paged view: a native bracket redesign of the web app's
// absolute-position multi-column layout, which doesn't reflow to narrow
// screens. Round labels scroll horizontally instead of connector lines.
//
// onBoutClick is optional — when present (organizer authoring), scheduled
// non-bye bouts become pressable and open a result-entry flow; the viewer's
// read-only bracket just omits the prop. One component, two contexts.
export default function Bracket({ bouts, fighters, onBoutClick }: { bouts: Bout[]; fighters: FighterLookup; onBoutClick?: (bout: Bout) => void }) {
  if (bouts.length === 0) {
    return <Text style={styles.empty}>No bracket generated yet.</Text>
  }

  const totalRounds = Math.max(...bouts.map(b => b.round))
  const rounds: Bout[][] = Array.from({ length: totalRounds }, (_, r) =>
    bouts.filter(b => b.round === r + 1).sort((a, b) => a.slot - b.slot),
  )

  const roundLabel = (r: number) => (r === 0 ? 'Round 1' : r === totalRounds - 1 ? 'Final' : r === totalRounds - 2 ? 'Semifinal' : `Round ${r + 1}`)

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {rounds.map((matches, r) => (
        <View key={r} style={styles.column}>
          <Text style={styles.roundLabel}>{roundLabel(r)}</Text>
          {matches.map(m => {
            const isBye = m.fighter_red_id === null || m.fighter_blue_id === null
            const isClickable = Boolean(onBoutClick) && m.status === 'scheduled' && !isBye
            return (
              <Pressable key={m.id} style={[styles.bout, isClickable && styles.boutClickable]} onPress={isClickable ? () => onBoutClick!(m) : undefined} disabled={!isClickable}>
                {([['red', m.fighter_red_id], ['blue', m.fighter_blue_id]] as const).map(([side, fid]) => {
                  const isWinner = m.winner_id !== null && m.winner_id === fid
                  return (
                    <View key={side} style={[styles.slot, side === 'red' && styles.slotBorder, isWinner && styles.slotWinner]}>
                      <Text style={[styles.slotText, fid === null && styles.slotTextMuted, isWinner && styles.slotTextWinner]} numberOfLines={1}>
                        {fighterLabel(fid, fighters, r === 0)}
                      </Text>
                    </View>
                  )
                })}
                {!isBye && m.status === 'completed' && m.method && (
                  <View style={styles.methodBadge}><Text style={styles.methodText}>{m.method}</Text></View>
                )}
              </Pressable>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  empty: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: MUTED, textTransform: 'uppercase', paddingVertical: 24 },
  scrollContent: { gap: 20, paddingVertical: 8 },
  column: { width: 220, gap: 14 },
  roundLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1.5, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  bout: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, position: 'relative' },
  boutClickable: { borderColor: ACCENT },
  slot: { paddingVertical: 12, paddingHorizontal: 10 },
  slotBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  slotWinner: { backgroundColor: '#e8e8e8' },
  slotText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, color: TEXT },
  slotTextMuted: { color: MUTED, textTransform: 'uppercase' },
  slotTextWinner: { color: TEXT, fontWeight: '800' },
  methodBadge: { position: 'absolute', right: -4, top: -10, backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 3, paddingVertical: 1, paddingHorizontal: 6 },
  methodText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 9, color: MUTED, textTransform: 'uppercase' },
})
