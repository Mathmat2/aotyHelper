from datetime import datetime
from bs4 import BeautifulSoup
import cloudscraper
import sqlite3
import os
from random import randint
from time import sleep
from tqdm import tqdm

scraper = cloudscraper.create_scraper()
months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
]

# Initialize SQLite database for EPs
db_path = "ep.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create table if it doesn't exist with unique constraint
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

def pageScrapper(soup, month, year, cursor, conn):
    albums = soup.find_all('div', class_='albumBlock')

    for album in albums:
        artist_name = album.find('div', class_='artistTitle').text
        album_title = album.find('div', class_='albumTitle').text
        
        # Create release_date in YYYY-MM format
        month_number = months.index(month) + 1
        release_date = f"{year}-{month_number:02}"
        
        # Insert into database (ignore duplicates)
        cursor.execute('''
            INSERT OR IGNORE INTO albums (album_name, artist, release_date, month)
            VALUES (?, ?, ?, ?)
        ''', (album_title, artist_name, release_date, month))
    
    conn.commit()

def monthScrapper(baseUrl, month, year, cursor, conn):
    page_count = 1
    month_number = months.index(month) + 1
    month_string = f"{month}-{month_number:02}"
    url = baseUrl + f"/{month_string}/{page_count}/?type=ep"
    
    page = scraper.get(url)
    soup = BeautifulSoup(page.content.decode('utf-8'), 'html.parser')
    pageScrapper(soup, month, year, cursor, conn)
    page_count += 1

    while True:
        # Wait for a random number of time (between 1 and 10 seconds)
        sleep(randint(1,10))
        print(f"Scraping page {page_count} of {month}...")

        page = scraper.get(url)
        soup = BeautifulSoup(page.content.decode('utf-8'), 'html.parser')

        no_more_page = soup.find('div', class_='large-font')

        if no_more_page:
            print("Finished scrapping " + month)
            break

        url = baseUrl + f"/{month_string}/{page_count}/?type=ep"
        pageScrapper(soup, month, year, cursor, conn)
        page_count += 1

def yearScrapper(baseUrl, year, cursor, conn):
    url = baseUrl + f"/{year}/releases"
    current_month = datetime.now().strftime("%B").casefold()
    print(current_month)

    for month in months:
        monthScrapper(url, month, year, cursor, conn)
        if month == current_month:
            break

url = f"https://www.albumoftheyear.org"

try:
    yearScrapper(url, "2025", cursor, conn)
    print(f"\nSuccessfully scraped EPs to {db_path}")
    
    # Print summary
    cursor.execute("SELECT COUNT(*) FROM albums")
    count = cursor.fetchone()[0]
    print(f"Total EPs in database: {count}")
finally:
    # Close database connection
    conn.close()

