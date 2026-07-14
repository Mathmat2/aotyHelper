import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const ALBUMS_DB_PATH = path.join(process.cwd(), 'public', 'data', 'albums.db');
const EPS_DB_PATH = path.join(process.cwd(), 'public', 'data', 'ep.db');

export async function GET() {
    try {
        const years = new Set<string>();

        for (const dbPath of [ALBUMS_DB_PATH, EPS_DB_PATH]) {
            const db = new Database(dbPath, { readonly: true });
            const rows = db.prepare(
                `SELECT DISTINCT substr(release_date, 1, 4) as year FROM albums`
            ).all() as { year: string }[];
            rows.forEach(row => years.add(row.year));
            db.close();
        }

        const sortedYears = Array.from(years).sort((a, b) => Number(b) - Number(a));

        return NextResponse.json({ years: sortedYears }, { status: 200 });
    } catch (error) {
        console.error('Error fetching years:', error);
        return NextResponse.json(
            { error: 'Failed to fetch years' },
            { status: 500 }
        );
    }
}
