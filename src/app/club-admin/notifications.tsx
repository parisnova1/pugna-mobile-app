import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { formatDisplayDate } from '@/lib/date'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import ErrorBoundary from '@/components/ErrorBoundary'
import { TEXT, CARD, BORDER, MUTED, ACCENT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

type NotificationRow = {
  id: number; type: string; title: string; body: string
  event_id: number | null; read_at: string | null; created_at: string
}

export default function ClubNotificationsScreen() {
  return <ErrorBoundary><ClubNotificationsInner /></ErrorBoundary>
}

function ClubNotificationsInner() {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    apiFetch<{ notifications: NotificationRow[] }>('/api/notifications')
      .then(r => setNotifications(r.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openNotification = async (n: NotificationRow) => {
    if (!n.read_at) {
      try { await apiFetch(`/api/notifications/${n.id}/read`, { method: 'POST' }); load() } catch { /* ignore */ }
    }
    if (n.event_id) router.push(`/events/${n.event_id}`)
  }

  const markAllRead = async () => {
    try { await apiFetch('/api/notifications/read-all', { method: 'POST' }); load() } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.nav.notifications')}</Text>
        {unreadCount > 0 && (
          <Button label={t('notifications.markAllRead')} variant="outline" onPress={markAllRead} style={styles.headerButton} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerFill}><Spinner /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => String(n.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState message={t('club.comingSoon.notifications')} />}
          renderItem={({ item: n }) => (
            <Pressable style={[styles.card, !n.read_at && styles.cardUnread]} onPress={() => openNotification(n)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!n.read_at && <View style={styles.dot} />}
                <Text style={styles.cardTitle}>{n.title}</Text>
              </View>
              {!!n.body && <Text style={styles.cardBody}>{n.body}</Text>}
              <Text style={styles.cardTime}>{formatDisplayDate(n.created_at.slice(0, 10))}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  headerButton: { paddingVertical: 8, paddingHorizontal: 14 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 14 },
  cardUnread: { borderColor: ACCENT },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  cardTitle: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 14, color: TEXT, textTransform: 'uppercase' },
  cardBody: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginTop: 4 },
  cardTime: { fontFamily: FONT_BODY, fontSize: 11, color: MUTED, marginTop: 6 },
})
