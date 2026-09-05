import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/i18n/LanguageContext'
import Spinner from '@/components/Spinner'
import { MUTED, FONT_BODY } from '@/theme'

// Guest deep-link entry point (matches the web app's /e/:token). No auth or
// onboarding gate here — every file under src/app is reachable regardless
// of Stack.Screen registration (see root _layout.tsx's own comment), and
// this route doesn't live under (tabs)/(onboarding) so neither of those
// groups' redirects apply. Resolves the token to a numeric event id via the
// same public lookup scan.tsx already uses, then hands off to the real
// event screen — no separate guest UI to keep in sync.
export default function PublicEventToken() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { t } = useLanguage()

  useEffect(() => {
    if (!token) return
    apiFetch<{ event: { id: number } }>(`/api/public/events/${encodeURIComponent(token)}`)
      .then(({ event }) => router.replace(`/events/${event.id}`))
      .catch(() => router.replace('/'))
  }, [token])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Spinner size="large" />
      <Text style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>{t('common.loading')}</Text>
    </View>
  )
}
