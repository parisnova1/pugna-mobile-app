import { useEffect, useRef, useState } from 'react'
import { View, TextInput, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { apiFetch } from '@/lib/api'
import { BORDER, MUTED, TEXT, INPUT_BG, CARD, FONT_BODY } from '@/theme'

type GeoResult = { label: string; lat: string; lon: string }

// Debounced autocomplete against the backend's existing GET /api/geo/search
// (a Nominatim proxy — see server/src/routes/geo.js) — no new geocoding
// dependency or API key, this endpoint already exists and is already used
// server-side by the club profile's own location field.
export default function LocationInput({
  value,
  onChangeText,
  onSelect,
  placeholder,
}: {
  value: string
  onChangeText: (text: string) => void
  onSelect: (result: { label: string; lat: number; lng: number }) => void
  placeholder?: string
}) {
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Selecting a suggestion sets `value` to that suggestion's own full label,
  // which is still >= 2 chars and would otherwise re-trigger this same
  // search below — reopening an identical dropdown right under the item the
  // user just picked. This skips exactly that one resulting effect run.
  const skipNextSearch = useRef(false)

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      apiFetch<{ results: GeoResult[] }>(`/api/geo/search?q=${encodeURIComponent(value.trim())}`)
        .then(r => setResults(r.results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  return (
    <View>
      <View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => {
            onChangeText(text)
            setResults([])
          }}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
        />
        {loading && <ActivityIndicator style={styles.spinner} size="small" color={MUTED} />}
      </View>
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <Pressable
              key={`${r.lat}-${r.lon}-${i}`}
              style={[styles.option, i === results.length - 1 && styles.optionLast]}
              onPress={() => {
                skipNextSearch.current = true
                onSelect({ label: r.label, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
                setResults([])
              }}
            >
              <Text style={styles.optionText} numberOfLines={1}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, paddingRight: 40, fontFamily: FONT_BODY, fontSize: 15, borderRadius: 4 },
  spinner: { position: 'absolute', right: 14, top: 14 },
  dropdown: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  option: { padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontFamily: FONT_BODY, fontSize: 13, color: TEXT },
})
