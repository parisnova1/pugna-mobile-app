import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import { Icon } from '@/components/icons/Icon'
import { apiFetch } from '@/lib/api'
import { extractEventIdentifier } from '@/lib/parsePugnaUrl'
import { useLanguage } from '@/i18n/LanguageContext'
import Button from '@/components/Button'
import { TEXT, BORDER, MUTED, BG, INPUT_BG, FONT_DISPLAY, FONT_BODY } from '@/theme'

export default function ScanScreen() {
  const { t } = useLanguage()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanError, setScanError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [decoded, setDecoded] = useState(false)

  const handleDecode = async (raw: string) => {
    if (decoded) return
    setDecoded(true)
    const identifier = extractEventIdentifier(raw)
    try {
      const { event } = await apiFetch<{ event: { id: number } }>(`/api/public/events/${encodeURIComponent(identifier)}`)
      router.replace(`/events/${event.id}`)
    } catch {
      setScanError(t('viewerHome.unrecognizedBody'))
      setDecoded(false)
    }
  }

  const submitManual = () => {
    if (manualValue.trim()) handleDecode(manualValue.trim())
  }

  const showingCamera = Boolean(permission?.granted) && !scanError

  return (
    <View style={[styles.flex, !showingCamera && { backgroundColor: BG }]}>
      <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12}>
        <Icon name="close" size={24} color={TEXT} />
      </Pressable>

      {!permission ? null : !permission.granted ? (
        <View style={styles.centerFill}>
          <Text style={styles.title}>{t('viewerHome.scanTitle')}</Text>
          <Text style={styles.errorText}>{t('viewerHome.cameraError')}</Text>
          <Button label="Grant Camera Access" onPress={requestPermission} style={{ marginTop: 16 }} />
          <ManualEntry value={manualValue} onChange={setManualValue} onSubmit={submitManual} t={t} />
        </View>
      ) : scanError ? (
        <View style={styles.centerFill}>
          <Text style={styles.title}>{t('viewerHome.unrecognizedCode')}</Text>
          <Text style={styles.errorText}>{scanError}</Text>
          <ManualEntry value={manualValue} onChange={setManualValue} onSubmit={submitManual} t={t} />
        </View>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleDecode(data)}
          />
          <View style={styles.overlay}>
            <Text style={styles.scanHint}>{t('viewerHome.scanPointCamera')}</Text>
          </View>
        </>
      )}
    </View>
  )
}

function ManualEntry({ value, onChange, onSubmit, t }: { value: string; onChange: (v: string) => void; onSubmit: () => void; t: (k: any) => string }) {
  return (
    <View style={styles.manualForm}>
      <Text style={styles.label}>{t('viewerHome.eventCodeLabel')}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="pugna.app/events/14 or event code"
        placeholderTextColor={MUTED}
        autoCapitalize="none"
      />
      <Button label={t('viewerHome.goToEvent')} onPress={onSubmit} style={{ marginTop: 12 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  close: { position: 'absolute', top: 56, right: 20, zIndex: 2, padding: 6 },
  camera: { flex: 1 },
  overlay: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  scanHint: { fontFamily: FONT_DISPLAY, fontSize: 13, color: '#fff', textTransform: 'uppercase', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { fontFamily: FONT_DISPLAY, fontSize: 22, textTransform: 'uppercase', color: TEXT, marginBottom: 12, textAlign: 'center' },
  errorText: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 8 },
  manualForm: { width: '100%', marginTop: 24 },
  label: { fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER, color: TEXT, padding: 14, fontFamily: FONT_BODY, fontSize: 14, borderRadius: 4 },
})
