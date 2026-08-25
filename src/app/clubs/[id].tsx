import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native'
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

type Club = { id: number; name: string; location: string; disciplines: string[]; founded_year: number | null; member_count: number; description: string; logo_url: string; cover_url: string }

export default function ClubProfileScreen() {
  return <ErrorBoundary><ClubProfileScreenInner /></ErrorBoundary>
}

function ClubProfileScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ club: Club }>(`/api/clubs/${id}`)
      .then(r => setClub(r.club))
      .catch(err => setError(err instanceof Error ? err.message : t('clubProfile.notFound')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ clubs: { id: number }[] }>('/api/clubs/following')
      .then(r => setFollowing(r.clubs.some(c => c.id === Number(id))))
      .catch(() => {})
  }, [id, user?.role])

  const toggleFollow = async () => {
    setFollowBusy(true)
    try {
      if (following) {
        await apiFetch(`/api/clubs/${id}/follow`, { method: 'DELETE' })
        setFollowing(false)
      } else {
        await apiFetch(`/api/clubs/${id}/follow`, { method: 'POST' })
        setFollowing(true)
      }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) return <Screen><View style={styles.centerFill}><Spinner /></View></Screen>
  if (error || !club) {
    return <Screen><View style={styles.centerFill}><Text style={styles.errorText}>{error || t('clubProfile.notFound')}</Text></View></Screen>
  }

  const initials = club.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />

        {club.cover_url ? (
          <Image source={{ uri: club.cover_url }} style={styles.cover} />
        ) : null}

        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            {club.logo_url ? <Image source={{ uri: club.logo_url }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{initials || '?'}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            {!!club.location && <Text style={styles.eyebrow}>{club.location}</Text>}
            <Text style={styles.name}>{club.name}</Text>
          </View>
        </View>

        <View style={styles.tagRow}>
          {club.disciplines.map(d => (
            <View key={d} style={styles.tag}><Text style={styles.tagText}>{d}</Text></View>
          ))}
        </View>

        {user?.role === 'viewer' && (
          <Button
            label={following ? t('clubs.following') : t('clubs.followClub')}
            variant={following ? 'outline' : 'primary'}
            disabled={followBusy}
            onPress={toggleFollow}
            style={styles.followButton}
          />
        )}

        <View style={styles.statsRow}>
          {[
            { v: String(club.member_count), l: t('clubs.members') },
            { v: club.founded_year ? String(club.founded_year) : '—', l: t('clubProfile.founded') },
            { v: String(club.disciplines.length), l: t('clubProfile.disciplines') },
          ].map(s => (
            <View key={s.l} style={styles.stat}>
              <Text style={styles.statValue}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('clubProfile.about')}</Text>
        <Text style={styles.description}>{club.description || t('clubProfile.noDescription')}</Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '700', color: TEXT },
  scroll: { padding: 20, paddingBottom: 40 },
  cover: { width: '100%', height: 160, borderRadius: 4, marginTop: 12, marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 12 },
  avatar: { width: 64, height: 64, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontFamily: FONT_DISPLAY, fontSize: 22, color: ACCENT },
  eyebrow: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 4 },
  name: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT, lineHeight: 26 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 0.8, color: MUTED, textTransform: 'uppercase' },
  followButton: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, marginBottom: 24 },
  stat: { flex: 1, paddingVertical: 14 },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: 20, color: TEXT },
  statLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 10, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', marginTop: 2 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 11, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 10 },
  description: { fontFamily: FONT_BODY, fontSize: 14, lineHeight: 22, color: MUTED },
})
