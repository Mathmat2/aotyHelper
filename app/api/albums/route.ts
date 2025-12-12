import { LastClient } from '@musicorum/lastfm'
import { LastfmUserTopAlbum } from '@musicorum/lastfm/dist/types/packages/user';
import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const api_key = "d4a74389a07c99517bf12a4f2f11b991"

// Database path - now in public/data directory
const DB_PATH = path.join(process.cwd(), 'public', 'data', 'albums.db');

interface AlbumRecord {
    album_name: string;
    artist: string;
}

/**
 * Check if albums are in the AOTY database using batched SQL queries (case-insensitive)
 * SQLite has a max expression tree depth of 1000, so we batch queries to avoid this limit
 * @param albums Array of albums to check
 * @returns Set of album keys (lowercase album_name|artist) that exist in the database
 */
function getMatchingAlbumsFromDB(albums: LastfmUserTopAlbum[]): Set<string> {
    if (albums.length === 0) {
        return new Set<string>();
    }

    const db = new Database(DB_PATH, { readonly: true });
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
    const client = new LastClient(api_key)
    const topAlbumsPages = await client.user.getTopAlbumsPaginated(username, {
        period: "12month",
        limit: 1000
    })

    let allListenedAlbums: LastfmUserTopAlbum[] = []
    allListenedAlbums = allListenedAlbums.concat(topAlbumsPages.getPage(1))

    if (topAlbumsPages.totalPages > 1) {
        for (let i = 2; i <= topAlbumsPages.totalPages; i++) {
            allListenedAlbums = allListenedAlbums.concat(await topAlbumsPages.fetchPage(i))
        }
    }
    return allListenedAlbums;
}

/**
 * Get all albums from Last.fm that are also in the AOTY database
 * Optimized to make only ONE SQL query regardless of the number of albums
 * Uses case-insensitive matching for album names and artists
 */
async function getAlbumsData(username: string) {
    const allListenedAlbums = await getAllListenedAlbums(username);

    // Single database call to check all albums at once (case-insensitive)
    const matchingAlbums = getMatchingAlbumsFromDB(allListenedAlbums);

    // Filter the albums based on the matching set (O(1) lookup per album)
    // Use lowercase keys for case-insensitive matching
    return allListenedAlbums.filter((album) =>
        matchingAlbums.has(`${album.name.toLowerCase()}|${album.artist.name.toLowerCase()}`)
    );
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

        const albums = await getAlbumsData(username);

        return NextResponse.json({ albums }, { status: 200 });
    } catch (error) {
        console.error('Error fetching albums:', error);
        return NextResponse.json(
            { error: 'Failed to fetch albums' },
            { status: 500 }
        );
    }
}
