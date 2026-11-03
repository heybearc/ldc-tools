import { useLocalSearchParams } from 'expo-router';
import { WorkDetail } from '@/components/WorkDetail';

export default function WorkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkDetail id={id || ''} />;
}
