import { Component, type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import Button from './Button'
import { BG, TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '@/theme'

type BoundaryProps = {
  children: ReactNode
  title: string
  body: string
  retryLabel: string
  homeLabel: string
  onGoHome: () => void
}
type BoundaryState = { error: Error | null }

// Class component because getDerivedStateFromError/componentDidCatch have no
// hook equivalent — without this, a crash in any single screen (as seen with
// the RED bug) takes down the whole navigator instead of just that screen.
class ErrorBoundaryClass extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary] screen crashed:', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{this.props.title}</Text>
        <Text style={styles.body}>{this.props.body}</Text>
        <Text style={styles.detail} numberOfLines={3}>{error.message}</Text>
        <Button label={this.props.retryLabel} onPress={this.reset} style={{ marginTop: 20 }} />
        <Button label={this.props.homeLabel} variant="outline" onPress={() => { this.reset(); this.props.onGoHome() }} style={{ marginTop: 12 }} />
      </View>
    )
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  return (
    <ErrorBoundaryClass
      title={t('errorBoundary.title')}
      body={t('errorBoundary.body')}
      retryLabel={t('common.tryAgain')}
      homeLabel={t('errorBoundary.goHome')}
      onGoHome={() => router.replace('/')}
    >
      {children}
    </ErrorBoundaryClass>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', color: TEXT, textAlign: 'center', marginBottom: 12 },
  body: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 12 },
  detail: { fontFamily: FONT_BODY, fontSize: 11, color: MUTED, textAlign: 'center', opacity: 0.7 },
})
