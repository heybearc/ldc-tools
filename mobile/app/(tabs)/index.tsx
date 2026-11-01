import { MyWorkPane } from '@/components/MyWorkPane';
import { WideHome } from '@/components/WideHome';
import { useWideLayout } from '@/lib/useWideLayout';

export default function MyWorkScreen() {
  const wide = useWideLayout();
  if (wide) return <WideHome />;
  return <MyWorkPane />;
}
