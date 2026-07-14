from aoty_scrapper_common import run

if __name__ == "__main__":
    run(
        release_type="ep",
        db_path="ep.db",
        description="Scrape AOTY EP releases for one or more years.",
    )
