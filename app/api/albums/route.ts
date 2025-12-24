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
function getMatchingAlbumsFromDB(albums: LastfmUserTopAlbum[], dbPath: string): Set<string> {
    if (albums.length === 0) {
        return new Set<string>();
    }

    const db = new Database(dbPath, { readonly: true });
    const matchingSet = new Set<string>();

    try {
        // Process albums in batches to avoid SQLite expression tree depth limit (1000)
        // Using batch size of 500 to stay well under the limit (each album = 2 conditions)
        const BATCH_SIZE = 500;

        for (let i = 0; i < albums.length; i += BATCH_SIZE) {
            const batch = albums.slice(i, i + BATCH_SIZE);

            // Build case-insensitive query for this batch using LOWER()
            const conditions = batch.map(() => '(LOWER(album_name) = LOWER(?) AND LOWER(artist) = LOWER(?))').join(' OR ');

            // Flatten the parameters array for this batch
            const params: string[] = [];
            batch.forEach(album => {
                params.push(album.name, album.artist.name);
            });

            // Query for this batch
            const query = `
        SELECT DISTINCT album_name, artist 
        FROM albums 
        WHERE ${conditions}
      `;

            const stmt = db.prepare(query);
            const results = stmt.all(...params) as AlbumRecord[];

            // Add results to the set using lowercase keys for case-insensitive matching
            results.forEach(row => {
                matchingSet.add(`${row.album_name.toLowerCase()}|${row.artist.toLowerCase()}`);
            });
        }

        return matchingSet;
    } finally {
        db.close();
    }
}

async function getAllListenedAlbums(username: string): Promise<LastfmUserTopAlbum[]> {
    const client = new LastClient(api_key);

    // First fetch to get total pages
    const firstPage = await client.user.getTopAlbumsPaginated(username, {
        period: "12month",
        limit: 1000,
        page: 1
    });

    let allListenedAlbums: LastfmUserTopAlbum[] = [...firstPage.getPage(1)];

    // Safety limit: Max 3000 albums (3 pages) to prevent timeouts for heavy listeners
    // 99.9% of users don't chart albums outside their top 3000
    const MAX_PAGES = 3;
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
            return []; // Return empty array instead of failing entire request
        }
    };

    if (totalPages > 1) {
        const pagesToFetch = [];
        for (let i = 2; i <= totalPages; i++) {
            pagesToFetch.push(i);
        }

        // Reduced BATCH_SIZE to 3 to be safer against rate limits
        const BATCH_SIZE = 3;
        for (let i = 0; i < pagesToFetch.length; i += BATCH_SIZE) {
            const batch = pagesToFetch.slice(i, i + BATCH_SIZE);
            const promises = batch.map(page => fetchPageSafe(page));

            const results = await Promise.all(promises);
            results.forEach(pageAlbums => {
                allListenedAlbums = allListenedAlbums.concat(pageAlbums);
            });

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    return allListenedAlbums;
}

/**
 * Get all albums from Last.fm that are also in the AOTY database(s)
 * Optimized to make minimal SQL queries regardless of the number of albums
 * Uses case-insensitive matching for album names and artists
 * @param username Last.fm username
 */
async function getAlbumsData(username: string, includeEPs: boolean) {
    const allListenedAlbums = await getAllListenedAlbums(username);

    // Query both databases
    const matchingAlbums = getMatchingAlbumsFromDB(allListenedAlbums, ALBUMS_DB_PATH);
    const matchingEPs = includeEPs ? getMatchingAlbumsFromDB(allListenedAlbums, EPS_DB_PATH) : new Set<string>();

    const result: any[] = [];

    for (const album of allListenedAlbums) {
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
