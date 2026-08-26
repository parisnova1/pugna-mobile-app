import { View, StyleSheet } from 'react-native'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'

// Real messaging lands with the messages table (Slice 4) — see the Club
// Command Center plan.
export default function ClubMessagesScreen() {
  return <ErrorBoundary><ClubMessagesInner /></ErrorBoundary>
}

function ClubMessagesInner() {
  const { t } = useLanguage()
  return (
    <Screen>
      <View style={styles.centerFill}>
        <EmptyState message={t('club.comingSoon.messages')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
})
