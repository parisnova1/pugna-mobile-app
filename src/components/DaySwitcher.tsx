import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native'
import { ACCENT, ON_ACCENT, TEXT, BORDER, MUTED, FONT_DISPLAY_BOLD } from '@/theme'

export type EventDay = { id: number; day_index: number; date: string; label: string; status: 'scheduled' | 'live' | 'completed' }

export default function DaySwitcher({ days, selectedId, onSelect }: { days: EventDay[]; selectedId: number | null; onSelect: (id: number) => void }) {
  if (days.length === 0) return null

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map(day => {
        const active = day.id === selectedId
        return (
          <Pressable key={day.id} onPress={() => onSelect(day.id)} style={[styles.pill, active && styles.pillActive]}>
            {day.status === 'live' && <View style={styles.liveDot} />}
            <Text style={[styles.label, active && styles.labelActive]}>{day.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: BORDER, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 14 },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff453a' },
  label: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase' },
  labelActive: { color: ON_ACCENT },
})
