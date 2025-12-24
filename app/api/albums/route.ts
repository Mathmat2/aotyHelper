import { LastClient } from '@musicorum/lastfm'
import { LastfmUserTopAlbum } from '@musicorum/lastfm/dist/types/packages/user';
import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const api_key = "d4a74389a07c99517bf12a4f2f11b991"

// Database paths - now in public/data directory
const ALBUMS_DB_PATH = path.join(process.cwd(), 'public', 'data', 'albums.db');
const EPS_DB_PATH = path.join(process.cwd(), 'public', 'data', 'ep.db');

interface AlbumRecord {
    album_name: string;
    artist: string;
}

/**
 * Check if albums are in a specific AOTY database using batched SQL queries (case-insensitive)
 * SQLite has a max expression tree depth of 1000, so we batch queries to avoid this limit
 * @param albums Array of albums to check
 * @param dbPath Path to the database file
 * @returns Set of album keys (lowercase album_name|artist) that exist in the database
 */
// Global database instances for reuse in serverless environment
let albumsDbInstance: Database.Database | null = null;
let epDbInstance: Database.Database | null = null;

function getDbInstance(path: string, type: 'albums' | 'ep'): Database.Database {
    if (type === 'albums') {
        if (!albumsDbInstance) {
            albumsDbInstance = new Database(path, { readonly: true });
        }
        return albumsDbInstance;
    } else {
        if (!epDbInstance) {
            epDbInstance = new Database(path, { readonly: true });
        }
        return epDbInstance;
    }
}

/**
 * Check if albums are in a specific AOTY database using optimized artist-based lookup
 * @param albums Array of albums to check
 * @param dbPath Path to the database file
 * @param type Type of database ('albums' or 'ep')
 * @returns Set of album keys (lowercase album_name|artist) that exist in the database
 */
function getMatchingAlbumsFromDB(albums: LastfmUserTopAlbum[], dbPath: string, type: 'albums' | 'ep'): Set<string> {
    if (albums.length === 0) {
        return new Set<string>();
    }

    const db = getDbInstance(dbPath, type);
    const matchingSet = new Set<string>();

    // Optimization: Instead of checking (artist=A AND album=B) OR ...
    // We check: artist IN (A, B, C...)
    // Then we filter the results in memory. This drastically simplifies the SQL query plan.

    // Get unique artists to query
    const artists = Array.from(new Set(albums.map(a => a.artist.name)));
    const BATCH_SIZE = 100; // SQLite limit for host variables is usually high, but let's be safe and chunk artists

    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
        const batchArtists = artists.slice(i, i + BATCH_SIZE);
        const placeholders = batchArtists.map(() => '?').join(',');

        // Use LOWER match for artists
        const query = `
            SELECT album_name, artist 
            FROM albums 
            WHERE LOWER(artist) IN (${placeholders.replace(/\?/g, 'LOWER(?)')})
        `;

        const stmt = db.prepare(query);
        const results = stmt.all(...batchArtists) as AlbumRecord[];

        // Store all found albums by these artists in the set
        results.forEach(row => {
            matchingSet.add(`${row.album_name.toLowerCase()}|${row.artist.toLowerCase()}`);
        });
    }

    return matchingSet;
}

async function getAlbumsData(username: string, includeEPs: boolean) {
    const client = new LastClient(api_key);
    const result: any[] = [];
    const MAX_PAGES = 3;

    // Helper to process a batch of albums
    const processBatch = (albums: LastfmUserTopAlbum[]) => {
        if (albums.length === 0) return;

        const matchingAlbums = getMatchingAlbumsFromDB(albums, ALBUMS_DB_PATH, 'albums');
        const matchingEPs = includeEPs ? getMatchingAlbumsFromDB(albums, EPS_DB_PATH, 'ep') : new Set<string>();

        for (const album of albums) {
            const key = `${album.name.toLowerCase()}|${album.artist.name.toLowerCase()}`;
            const matchedType = matchingAlbums.has(key) ? 'lp' : (matchingEPs.has(key) ? 'ep' : null);

            if (matchedType) {
                result.push({
                    name: album.name,
                    artist: { name: album.artist.name },
                    // Keep only the largest image to save bandwidth
                    images: album.images && album.images.length > 0 ? [album.images[album.images.length - 1]] : [],
                    matchedType
                });
            }
        }
    };

    // First fetch to get total pages and process first page
    const firstPage = await client.user.getTopAlbumsPaginated(username, {
        period: "12month",
        limit: 1000,
        page: 1
    });

    // Process page 1 immediately
    processBatch([...firstPage.getPage(1)]);

    // Calculate remaining pages
    const totalPages = Math.min(firstPage.totalPages, MAX_PAGES);

    // Helper for safe fetching with retry
    const fetchPageSafe = async (page: number, retries = 3): Promise<LastfmUserTopAlbum[]> => {
        try {
            const res = await firstPage.fetchPage(page);
            return res;
        } catch (err) {
            if (retries > 0) {
                // Wait 1s before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchPageSafe(page, retries - 1);
            }
            console.error(`Failed to fetch page ${page} after retries:`, err);
            return [];
        }
    };

    if (totalPages > 1) {
        const pagesToFetch = [];
        for (let i = 2; i <= totalPages; i++) {
            pagesToFetch.push(i);
        }

        // Reduced parallel fetching to a smaller batch to conserve memory/connections
        const BATCH_SIZE = 3;
        for (let i = 0; i < pagesToFetch.length; i += BATCH_SIZE) {
            const batch = pagesToFetch.slice(i, i + BATCH_SIZE);
            const promises = batch.map(page => fetchPageSafe(page));

            const results = await Promise.all(promises);

            // Process each page as it comes in
            results.forEach(pageAlbums => {
                processBatch(pageAlbums);
            });


        }
    }

    return result;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        const includeEPs = searchParams.get('includeEPs') === 'true';

        const albums = await getAlbumsData(username, includeEPs);

        return NextResponse.json({ albums }, { status: 200 });
    } catch (error) {
        console.error('Error fetching albums:', error);
        return NextResponse.json(
            { error: 'Failed to fetch albums' },
            { status: 500 }
        );
    }
}
