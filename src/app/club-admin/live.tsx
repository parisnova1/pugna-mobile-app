import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Icon } from '@/components/icons/Icon'
import { TEXT, MUTED, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

// The "Scan" action is real today (reuses the existing QR scanner). "Live
// Updates" becomes real once bouts gain live/round state (Slice 5) — see
// the Club Command Center plan; until then there is genuinely nothing to
// show here, matching the same reasoning documented in
// (onboarding)/ready.tsx for why a "Live" tile wasn't built earlier.
export default function ClubLiveScreen() {
  return <ErrorBoundary><ClubLiveInner /></ErrorBoundary>
}

function ClubLiveInner() {
  const { t } = useLanguage()
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('club.nav.live')}</Text>
      </View>

      <View style={styles.scanCard}>
        <Icon name="scan" size={32} color={TEXT} />
        <Text style={styles.scanLabel}>{t('club.live.scanHint')}</Text>
        <Button label={t('club.live.scan')} onPress={() => router.push('/scan')} style={{ marginTop: 12 }} />
      </View>

      <Text style={styles.sectionLabel}>{t('club.live.updates')}</Text>
      <EmptyState message={t('club.comingSoon.live')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', color: TEXT },
  scanCard: { alignItems: 'center', marginHorizontal: 16, marginBottom: 24, padding: 24 },
  scanLabel: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 12 },
  sectionLabel: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 13, letterSpacing: 1, color: TEXT, textTransform: 'uppercase', marginHorizontal: 16, marginBottom: 12 },
})
