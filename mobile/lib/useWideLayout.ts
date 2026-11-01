import { useWindowDimensions } from 'react-native';
import { isWideLayout } from './layout';

export function useWideLayout() {
  const { width, height } = useWindowDimensions();
  return isWideLayout(width, height);
}
