import { DirectoryPane } from '@/components/DirectoryPane';
import { WideHome } from '@/components/WideHome';
import { useWideLayout } from '@/lib/useWideLayout';

export default function DirectoryScreen() {
  const wide = useWideLayout();
  if (wide) return <WideHome />;
  return <DirectoryPane />;
}
