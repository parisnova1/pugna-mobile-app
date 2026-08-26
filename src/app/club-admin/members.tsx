import { View, StyleSheet } from 'react-native'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'

// Real roster CRUD lands with the club_roster table (Slice 2) — see the
// Club Command Center plan.
export default function ClubMembersScreen() {
  return <ErrorBoundary><ClubMembersInner /></ErrorBoundary>
}

function ClubMembersInner() {
  const { t } = useLanguage()
  return (
    <Screen>
      <View style={styles.centerFill}>
        <EmptyState message={t('club.comingSoon.members')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
})
