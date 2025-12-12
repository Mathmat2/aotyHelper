'use client';

import AlbumsClientPage from './AlbumsClientPage';
import { useSearchParams } from 'next/navigation';

export default function AlbumsPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || '';
  const limit = Number(searchParams.get('limit')) || 9;
  const includeEPs = searchParams.get('includeEPs') === 'true';

  return (
    <AlbumsClientPage username={username} limit={limit} includeEPs={includeEPs} />
  );
}
