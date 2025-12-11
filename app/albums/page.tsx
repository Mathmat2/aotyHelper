import { getAlbumsData } from './getAlbums';
import AlbumsClientPage from './AlbumsClientPage';

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { username, limit } = await searchParams;
  const parsedLimit = Number(limit) || 5;
  const albums = await getAlbumsData(username as string);

  return (
    <AlbumsClientPage initialAlbums={albums} limit={parsedLimit} />
  );
}
