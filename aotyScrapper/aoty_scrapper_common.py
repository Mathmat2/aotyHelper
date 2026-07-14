import argparse
import sqlite3
from datetime import datetime
from random import randint
from time import sleep

import cloudscraper
from bs4 import BeautifulSoup

MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]

BASE_URL = "https://www.albumoftheyear.org"

scraper = cloudscraper.create_scraper()


def init_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_name TEXT NOT NULL,
            artist TEXT NOT NULL,
            release_date TEXT NOT NULL,
            month TEXT NOT NULL,
            UNIQUE(album_name, artist, release_date)
        )
    ''')
    conn.commit()
    return conn, cursor


def page_scrapper(soup, month, year, cursor, conn):
    albums = soup.find_all('div', class_='albumBlock')
    month_number = MONTHS.index(month) + 1
    release_date = f"{year}-{month_number:02}"

    for album in albums:
        artist_name = album.find('div', class_='artistTitle').text
        album_title = album.find('div', class_='albumTitle').text

        cursor.execute('''
            INSERT OR IGNORE INTO albums (album_name, artist, release_date, month)
            VALUES (?, ?, ?, ?)
        ''', (album_title, artist_name, release_date, month))

    conn.commit()


def month_scrapper(month, year, release_type, cursor, conn, start_page=1):
    month_number = MONTHS.index(month) + 1
    month_string = f"{month}-{month_number:02}"
    page_count = start_page

    while True:
        url = f"{BASE_URL}/{year}/releases/{month_string}/{page_count}/?type={release_type}"
        if page_count > 1:
            # Be polite between page requests; no need to wait before the first one.
            sleep(randint(1, 10))
        print(f"Scraping page {page_count} of {month} {year}...")

        page = scraper.get(url)
        soup = BeautifulSoup(page.content, 'html.parser')

        if soup.find('div', class_='large-font'):
            print(f"Finished scraping {month} {year}")
            break

        page_scrapper(soup, month, year, cursor, conn)
        page_count += 1


def year_scrapper(year, release_type, cursor, conn, start_month=None, start_page=1):
    now = datetime.now()
    # Only cap at the current month when scraping the current year; past years
    # have no "future" months to skip.
    last_month_index = now.month if year == now.year else 12

    months = MONTHS[:last_month_index]
    if start_month:
        months = months[MONTHS.index(start_month):]

    for i, month in enumerate(months):
        page = start_page if i == 0 else 1
        month_scrapper(month, year, release_type, cursor, conn, start_page=page)


def resolve_years(args, current_year):
    if args.start_year or args.end_year:
        start = args.start_year or current_year
        end = args.end_year or current_year
        years = list(range(start, end + 1))
    elif args.years:
        years = args.years
    else:
        years = [current_year]

    valid_years = []
    for year in years:
        if year > current_year:
            print(f"Skipping {year}: no releases yet.")
            continue
        valid_years.append(year)

    return valid_years


def run(release_type, db_path, description):
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "years", nargs="*", type=int,
        help="One or more specific years to scrape (default: current year)",
    )
    parser.add_argument("--start-year", type=int, help="Start of a year range (inclusive)")
    parser.add_argument("--end-year", type=int, help="End of a year range (inclusive)")
    parser.add_argument(
        "--start-month", choices=MONTHS,
        help="Resume scraping from this month of the first year scraped",
    )
    parser.add_argument(
        "--start-page", type=int, default=1,
        help="Resume scraping from this page of --start-month (requires --start-month)",
    )
    args = parser.parse_args()

    if args.start_page != 1 and not args.start_month:
        parser.error("--start-page requires --start-month")

    years = resolve_years(args, datetime.now().year)
    if not years:
        print("No valid years to scrape.")
        return

    conn, cursor = init_db(db_path)
    try:
        for i, year in enumerate(years):
            print(f"\n=== Scraping {year} ({release_type}) ===")
            if i == 0:
                year_scrapper(
                    year, release_type, cursor, conn,
                    start_month=args.start_month, start_page=args.start_page,
                )
            else:
                year_scrapper(year, release_type, cursor, conn)

        cursor.execute("SELECT COUNT(*) FROM albums")
        count = cursor.fetchone()[0]
        print(f"\nSuccessfully scraped {', '.join(str(y) for y in years)} to {db_path}")
        print(f"Total rows in database: {count}")
    finally:
        conn.close()
