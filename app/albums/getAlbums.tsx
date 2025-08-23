import { LastClient } from '@musicorum/lastfm'
import { MusicBrainzApi } from 'musicbrainz-api';
import {Dictionary} from "dictionaryjs";
import { LastfmUserTopAlbum } from '@musicorum/lastfm/dist/types/packages/user';
import albums from '../../aotyScrapper/albums.json' assert { type: 'json' }

let albumsSaved : Dictionary<string, any> = new Dictionary<string, any>()
let allListenedAlbums : LastfmUserTopAlbum[] = []
const api_key = "d4a74389a07c99517bf12a4f2f11b991"

function isAlbumInList(albumName : string, artist : string) {
   if (albumName in albums) {
    console.log(`${albums[albumName][0]} compared to ${artist}`)
    return artist == albums[albumName][0]
   }
   return false
}

async function getAllListenedAlbums(username : string) : Promise<void> {
  

  const client = new LastClient(api_key)
  const topAlbumsPages = await client.user.getTopAlbumsPaginated(username, {
    period: "12month",
    limit: 1000
  })

  allListenedAlbums = allListenedAlbums.concat(topAlbumsPages.getPage(1))
  
  for (let i = 2; i <= topAlbumsPages.totalPages; i++) {
    allListenedAlbums = allListenedAlbums.concat(await topAlbumsPages.fetchPage(2))
  }
}
 
export default async function Albums(username: any) {
  const mbApi = new MusicBrainzApi({
    appName: 'aotyhelper',
    appVersion: '0.0.1',
    appContactInfo: 'matromino91@gmail.com',
  });
  
  await getAllListenedAlbums(username.username)
 
  return (<ul>
            {allListenedAlbums.filter((album) => isAlbumInList(album.name, album.artist.name)).map((album) => <li key={album.rank}>{album.name} : {album.artist.name}</li>)}
        </ul>)
}