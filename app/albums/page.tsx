import dynamic from 'next/dynamic'
import LoadingPage from './LoadingPage';
import { useSearchParams } from 'next/navigation'

const DynamicAlbums = dynamic(() => import('./getAlbums'), {
  loading: () => <LoadingPage />
})


export default async function AlbumsPage({
  searchParams,
} : {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const username = (await searchParams).username
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {<DynamicAlbums username={username} />}
      </main>
    </div>
  );
}
