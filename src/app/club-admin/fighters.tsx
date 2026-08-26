import { View, StyleSheet } from 'react-native'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'

// Read-only "My Fighters" list lands once fighters.club_id exists (Slice 3)
// — see the Club Command Center plan.
export default function ClubMyFightersScreen() {
  return <ErrorBoundary><ClubMyFightersInner /></ErrorBoundary>
}

function ClubMyFightersInner() {
  const { t } = useLanguage()
  return (
    <Screen>
      <View style={styles.centerFill}>
        <EmptyState message={t('club.comingSoon.myFighters')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
})
