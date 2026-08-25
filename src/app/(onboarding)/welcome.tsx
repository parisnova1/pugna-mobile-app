import { useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useLanguage } from '@/i18n/LanguageContext'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import { ACCENT, BORDER, TEXT, FONT_DISPLAY } from '@/theme'

export default function WelcomeScreen() {
  const { t } = useLanguage()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [page, setPage] = useState(0)

  const slides = [
    { icon: 'shield' as const, text: t('onboarding.welcome1') },
    { icon: 'calendar' as const, text: t('onboarding.welcome2') },
    { icon: 'body' as const, text: t('onboarding.welcome3') },
  ]
  const isLast = page === slides.length - 1

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width)
    if (next !== page) setPage(next)
  }

  const advance = () => {
    if (isLast) {
      router.push('/(onboarding)/role')
    } else {
      // Set page state directly rather than waiting for onMomentumScrollEnd —
      // that event doesn't reliably fire for a programmatic scrollTo on web,
      // which left the button stuck thinking it was still on the first slide.
      const next = page + 1
      scrollRef.current?.scrollTo({ x: next * width, animated: true })
      setPage(next)
    }
  }

  return (
    <Screen>
      <SkipLink />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.pager}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={36} color={ACCENT} />
            </View>
            <Text style={styles.slideText}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={isLast ? t('onboarding.getStarted') : t('onboarding.next')} onPress={advance} style={styles.button} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  slideText: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, textAlign: 'center', lineHeight: 32 },
  footer: { paddingHorizontal: 28, paddingBottom: 32, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  dotActive: { backgroundColor: ACCENT },
  button: { alignSelf: 'stretch' },
})
