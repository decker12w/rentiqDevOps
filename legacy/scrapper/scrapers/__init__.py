from am2.legacy.scrapper.scrapers.base import BaseScraper, FIELDNAMES, HEADERS, OUTPUT_DIR
from am2.legacy.scrapper.scrapers.abias import AbiasScraper
from am2.legacy.scrapper.scrapers.cardinali import CardinaliScraper
from am2.legacy.scrapper.scrapers.roca import RocaScraper
from am2.legacy.scrapper.scrapers.sape import SapeScraper
from am2.legacy.scrapper.scrapers.center import CenterScraper

SCRAPERS: dict[str, BaseScraper] = {
    "cardinali": CardinaliScraper(),
    "roca": RocaScraper(),
    "abias": AbiasScraper(),
    "sape": SapeScraper(),
    "center": CenterScraper(),
}

__all__ = ["SCRAPERS", "FIELDNAMES", "HEADERS", "OUTPUT_DIR", "BaseScraper"]
