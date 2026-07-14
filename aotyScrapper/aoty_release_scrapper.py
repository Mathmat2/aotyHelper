from aoty_scrapper_common import run

if __name__ == "__main__":
    run(
        release_type="lp",
        db_path="albums.db",
        description="Scrape AOTY album (LP) releases for one or more years.",
    )
