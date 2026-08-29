import { useState } from 'react'
import { Text, Pressable, Modal, StyleSheet } from 'react-native'
import { Calendar, type DateData } from 'react-native-calendars'
import { Icon } from './icons/Icon'
import { formatDisplayDate } from '@/lib/date'
import { ACCENT, ON_ACCENT, CARD, BORDER, MUTED, TEXT, INPUT_BG, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// Replaces a plain "type YYYY-MM-DD" TextInput with a real calendar picker.
// react-native-calendars is pure JS (no native linking), so it renders
// identically on web and native — matters here since this app is tested
// through the Expo web build as much as native. dateString from onDayPress
// is already YYYY-MM-DD, the exact format the backend's date columns expect,
// so no conversion needed either way.
export default function DatePickerField({
  value,
  onChange,
  placeholder,
  minDate,
}: {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  minDate?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value ? formatDisplayDate(value) : placeholder}</Text>
        <Icon name="calendarMark" size={18} color={MUTED} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
            <Calendar
              current={value || undefined}
              minDate={minDate}
              onDayPress={(day: DateData) => {
                onChange(day.dateString)
                setOpen(false)
              }}
              markedDates={value ? { [value]: { selected: true, selectedColor: ACCENT, selectedTextColor: ON_ACCENT } } : undefined}
              theme={{
                backgroundColor: CARD,
                calendarBackground: CARD,
                textSectionTitleColor: MUTED,
                dayTextColor: TEXT,
                todayTextColor: ACCENT,
                monthTextColor: TEXT,
                arrowColor: TEXT,
                selectedDayBackgroundColor: ACCENT,
                selectedDayTextColor: ON_ACCENT,
                textDisabledColor: BORDER,
                textDayFontFamily: FONT_BODY,
                textMonthFontFamily: FONT_DISPLAY_BOLD,
                textDayHeaderFontFamily: FONT_DISPLAY_BOLD,
              }}
              style={styles.calendar}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  input: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, padding: 12, borderRadius: 4 },
  valueText: { fontFamily: FONT_BODY, fontSize: 14, color: TEXT },
  placeholderText: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 8, width: '100%', maxWidth: 380 },
  calendar: { borderRadius: 4 },
})
