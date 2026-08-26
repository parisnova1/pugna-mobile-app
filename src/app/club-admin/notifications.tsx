import { View, StyleSheet } from 'react-native'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'

// Real notifications land with the notifications table (Slice 4) — see the
// Club Command Center plan.
export default function ClubNotificationsScreen() {
  return <ErrorBoundary><ClubNotificationsInner /></ErrorBoundary>
}

function ClubNotificationsInner() {
  const { t } = useLanguage()
  return (
    <Screen>
      <View style={styles.centerFill}>
        <EmptyState message={t('club.comingSoon.notifications')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
})
