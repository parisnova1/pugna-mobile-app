import { useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { router } from 'expo-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { Icon } from '@/components/icons/Icon'
import Screen from '@/components/Screen'
import Button from '@/components/Button'
import SkipLink from '@/onboarding/SkipLink'
import BackLink from '@/onboarding/BackLink'
import { ACCENT, BORDER, MUTED, TEXT, FONT_DISPLAY, FONT_DISPLAY_BOLD, FONT_BODY } from '@/theme'

export default function WelcomeScreen() {
  const { t } = useLanguage()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [page, setPage] = useState(0)

  // Slide 1 carries the hero mark and the primary headline/subtext; slides 2
  // and 3 keep the existing one-liners covering the other two pillars
  // (events, sparring) referenced by that same headline's supporting line.
  const slides = [
    { hero: true as const, icon: undefined, text: t('onboarding.welcome1'), subtext: t('onboarding.welcome1Sub') },
    { hero: false as const, icon: 'calendarMark' as const, text: t('onboarding.welcome2') },
    { hero: false as const, icon: 'clinch' as const, text: t('onboarding.welcome3') },
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

  const retreat = () => {
    const prev = page - 1
    scrollRef.current?.scrollTo({ x: prev * width, animated: true })
    setPage(prev)
  }

  return (
    <Screen>
      {page > 0 && <BackLink onPress={retreat} />}
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
            {slide.hero ? (
              <Icon name="hero" size={120} color={TEXT} />
            ) : (
              <View style={styles.iconCircle}>
                <Icon name={slide.icon} size={36} color={ACCENT} />
              </View>
            )}
            <Text style={styles.slideText}>{slide.text}</Text>
            {slide.subtext && <Text style={styles.slideSubtext}>{slide.subtext}</Text>}
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
        {isLast && (
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginLink} hitSlop={8}>
            <Text style={styles.loginLinkText}>{t('onboarding.alreadyHaveAccount')}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  slideText: { fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', color: TEXT, textAlign: 'center', lineHeight: 32, marginTop: 32 },
  slideSubtext: { fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  footer: { paddingHorizontal: 28, paddingBottom: 32, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  dotActive: { backgroundColor: ACCENT },
  button: { alignSelf: 'stretch' },
  loginLink: { marginTop: 16, padding: 4 },
  loginLinkText: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 12, letterSpacing: 1, color: MUTED, textTransform: 'uppercase', textDecorationLine: 'underline' },
})
