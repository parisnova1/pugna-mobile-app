import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import ErrorBoundary from '@/components/ErrorBoundary'
import Button from '@/components/Button'
import { TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

export default function OrganizerAccountScreen() {
  return <ErrorBoundary><OrganizerAccountInner /></ErrorBoundary>
}

function OrganizerAccountInner() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{t('role.organizer')}</Text>
        <Button label={t('header.logOut')} variant="outline" onPress={() => { logout(); router.replace('/') }} style={{ marginTop: 24 }} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  name: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, marginBottom: 4 },
  email: { fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 4 },
  role: { fontFamily: FONT_BODY, fontSize: 12, color: MUTED, textTransform: 'uppercase' },
})
