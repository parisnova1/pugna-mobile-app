import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Spinner from '@/components/Spinner'
import { MUTED, FONT_BODY } from '@/theme'

// /go/:code — same guest deep-link contract as /e/:token (see that file for
// why no auth/onboarding gate applies here). The backend has no separate
// "short code" concept yet — a code IS a qr_token today — so this resolves
// identically. Kept as its own route (not a redirect to /e/:code) so the
// two canonical URL shapes from the product brief both exist as real routes
// even though they currently do the same lookup.
export default function GoCode() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useLanguage()

  useEffect(() => {
    if (!code) return
    apiFetch<{ event: { id: number } }>(`/api/public/events/${encodeURIComponent(code)}`)
      .then(({ event }) => router.replace(`/events/${event.id}`))
      .catch(() => router.replace('/'))
  }, [code])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Spinner size="large" />
      <Text style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>{t('common.loading')}</Text>
    </View>
  )
}
