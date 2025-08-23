from datetime import datetime
from bs4 import BeautifulSoup
import cloudscraper
import re
import os
import json
from random import randint
from time import sleep
from tqdm import tqdm

scraper = cloudscraper.create_scraper()
albums_json = {}
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

def pageScrapper(soup, month, albums_json):
    albums = soup.find_all('div', class_='albumBlock')

    for album in albums:
        artist_name = album.find('div', class_='artistTitle').text
        album_title = album.find('div', class_='albumTitle').text

        albums_json[album_title] = [artist_name, month]

def monthScrapper(baseUrl, month, albums_json):
    page_count = 1
    month_number = months.index(month) + 1
    month_string = f"{month}-{month_number:02}"
    url = baseUrl + f"/{month_string}/{page_count}/?type=lp"
    
    page = scraper.get(url)
    soup = BeautifulSoup(page.content.decode('utf-8'), 'html.parser')
    pageScrapper(soup, month, albums_json)
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

        url = baseUrl + f"/{month_string}/{page_count}/?type=lp"
        pageScrapper(soup, month, albums_json)
        page_count += 1

def yearScrapper(baseUrl, year, albums_json):
    url = baseUrl + f"/{year}/releases"
    current_month = datetime.now().strftime("%B").casefold()
    print(current_month)

    for month in months:
        monthScrapper(url, month, albums_json)
        if month == current_month:
            break

url = f"https://www.albumoftheyear.org"

yearScrapper(url, "2025", albums_json)

with open("albums.json", 'w', encoding='utf8') as outfile:
    json.dump(albums_json, outfile, indent=2, ensure_ascii=False)

