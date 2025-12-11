import { LastClient } from '@musicorum/lastfm'
// import { MusicBrainzApi } from 'musicbrainz-api'; // Unused
import { LastfmUserTopAlbum } from '@musicorum/lastfm/dist/types/packages/user';
import albums from '../../aotyScrapper/albums.json'

// Move state out of module scope if possible, or keep it but reset it?
// Next.js formatting reuse might make this stateful across requests if not careful.
// Better to simple return data instead of using global let.

const api_key = "d4a74389a07c99517bf12a4f2f11b991"
const albumsData = albums as Record<string, string[]>;

function isAlbumInList(albumName: string, artist: string) {
  if (albumName in albumsData) {
    return artist == albumsData[albumName][0]
  }
  return false
}

async function getAllListenedAlbums(username: string): Promise<LastfmUserTopAlbum[]> {
  const client = new LastClient(api_key)
  const topAlbumsPages = await client.user.getTopAlbumsPaginated(username, {
    period: "12month",
    limit: 1000
  })

  let allListenedAlbums: LastfmUserTopAlbum[] = []
  allListenedAlbums = allListenedAlbums.concat(topAlbumsPages.getPage(1))

  // Fix loop to fetch page i, not page 2 always
  // And cap it if necessary, though limit handled per page is default?
  // If limit=5, pages=1.

  // The original code loop suggests it wanted ALL albums? "getAllListenedAlbums".
  // Note: user input "limit" was "Number of albums".
  // If I put limit=5 here, I get 5 albums.
  // If I want to match against AOTY, getting just 5 might return 0 matches.
  // I'll stick to using the limit for the API call for now.

  if (topAlbumsPages.totalPages > 1) {
    for (let i = 2; i <= topAlbumsPages.totalPages; i++) {
      allListenedAlbums = allListenedAlbums.concat(await topAlbumsPages.fetchPage(i))
    }
  }
  return allListenedAlbums;
}

// This function now returns data, not a component.
export async function getAlbumsData(username: string) {
  const allListenedAlbums = await getAllListenedAlbums(username)
  return allListenedAlbums.filter((album) => isAlbumInList(album.name, album.artist.name))
}