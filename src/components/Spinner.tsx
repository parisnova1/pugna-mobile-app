import { ActivityIndicator } from 'react-native'
import { ACCENT } from '@/theme'

export default function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  return <ActivityIndicator size={size} color={ACCENT} />
}
