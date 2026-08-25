import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ACCENT, TEXT, CARD, BORDER, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type Fighter = { id: number; name: string; club: string; weight: string; record: string; discipline: string; location: string; organizer_name: string }

export default function FighterProfileScreen() {
  return <ErrorBoundary><FighterProfileScreenInner /></ErrorBoundary>
}

function FighterProfileScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [fighter, setFighter] = useState<Fighter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ fighter: Fighter }>(`/api/public/fighters/${id}`)
      .then(r => setFighter(r.fighter))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load this fighter.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ fighters: { id: number }[] }>('/api/public/fighters/following')
      .then(r => setFollowing(r.fighters.some(f => f.id === Number(id))))
      .catch(() => {})
  }, [id, user?.role])

  const toggleFollow = async () => {
    setFollowBusy(true)
    try {
      if (following) {
        await apiFetch(`/api/public/fighters/${id}/follow`, { method: 'DELETE' })
        setFollowing(false)
      } else {
        await apiFetch(`/api/public/fighters/${id}/follow`, { method: 'POST' })
        setFollowing(true)
      }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>
  }
  if (error || !fighter) {
    return (
      <Screen>
        <View style={styles.centerFill}>
          <Text style={styles.notFoundTitle}>Fighter Not Found</Text>
          <Text style={styles.notFoundBody}>{error || 'This fighter doesn’t exist.'}</Text>
        </View>
      </Screen>
    )
  }

  const initials = fighter.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />

        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{fighter.club}</Text>
            <Text style={styles.name}>{fighter.name}</Text>
          </View>
        </View>

        <View style={styles.tagRow}>
          {[fighter.discipline, fighter.weight, fighter.location].filter(Boolean).map(tag => (
            <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          ))}
        </View>

        {user?.role === 'viewer' && (
          <Button
            label={following ? t('fighterProfile.following') : t('fighterProfile.followFighter')}
            variant={following ? 'outline' : 'primary'}
            disabled={followBusy}
            onPress={toggleFollow}
            style={styles.followButton}
          />
        )}

        <View style={styles.statsRow}>
          {[{ v: fighter.record, l: 'Record' }, { v: fighter.weight, l: 'Weight' }, { v: fighter.discipline, l: 'Discipline' }].map(s => (
            <View key={s.l} style={styles.stat}>
              <Text style={styles.statValue}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.details}>
          {[['Club', fighter.club], ['Location', fighter.location], ['Discipline', fighter.discipline], ['Weight', fighter.weight], ['Record', fighter.record], ['Organizer', fighter.organizer_name]].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailValue}>{v || '—'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundTitle: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT, marginBottom: 8 },
  notFoundBody: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 12 },
  avatar: { width: 72, height: 72, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT_DISPLAY, fontSize: 26, color: ACCENT },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  name: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, lineHeight: 28 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  followButton: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginBottom: 24 },
  stat: { flex: 1, paddingVertical: 14 },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 20, color: TEXT },
  statLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginTop: 2 },
  details: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailKey: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  detailValue: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, color: TEXT, textTransform: 'uppercase' },
})
