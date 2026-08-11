# AOTY Scrapper

Scrapes [albumoftheyear.org](https://www.albumoftheyear.org) release-calendar pages into
SQLite databases. Both scrapers share the same crawling logic in
`aoty_scrapper_common.py` and only differ in the AOTY `type` filter and output DB:

- `aoty_release_scrapper.py` — LP releases → `albums.db`
- `aoty_ep_scrapper.py` — EP releases → `ep.db`

## Setup

```bash
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

## Usage

A year (or year range) is required — the scrapers refuse to run without one, since
scraping every year by accident is expensive and slow.

```bash
# One or more specific years
python3 aoty_release_scrapper.py 2023 2024

# Inclusive year range
python3 aoty_ep_scrapper.py --start-year 2020 --end-year 2024

# Open-ended range (defaults the missing end to the current year)
python3 aoty_release_scrapper.py --start-year 2022
```

### Resuming a partial scrape

If a run is interrupted, resume it with `--start-month`/`--start-page`. These only
apply to the *first* year passed — any additional years are scraped from scratch
(month 1, page 1):

```bash
python3 aoty_release_scrapper.py 2024 --start-month june --start-page 3
```

`--start-page` requires `--start-month`.

## Notes

- Requests are polite: a random 1-10s delay is inserted between page requests
  (not before the first page of a month).
- Rows are deduped in SQLite via `UNIQUE(album_name, artist, release_date)`, so
  re-running a scrape for a year you've already scraped is safe and just fills in
  gaps (`INSERT OR IGNORE`).
- A year in the future (relative to today) is skipped with a warning instead of
  erroring.
