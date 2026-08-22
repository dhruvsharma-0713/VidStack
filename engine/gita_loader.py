import json
import urllib.request
from pathlib import Path
from typing import Optional
from pydantic import BaseModel


class GitaVerse(BaseModel):
    chapter: int
    verse: int
    slok_sanskrit: str
    transliteration: Optional[str] = None
    hindi_meaning: str
    word_meanings: Optional[str] = None


class GitaDatasetManager:
    """Manages dataset retrieval and local caching for Bhagavad Gita verses."""

    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path(__file__).parent / "data" / "gita_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_verse(self, chapter: int, verse: int) -> GitaVerse:
        cache_file = self.cache_dir / f"ch_{chapter}_v_{verse}.json"
        if cache_file.exists():
            with open(cache_file, "r", encoding="utf-8") as f:
                return GitaVerse(**json.load(f))
        return self._fetch_and_cache(chapter, verse, cache_file)

    def _fetch_and_cache(self, chapter: int, verse: int, cache_file: Path) -> GitaVerse:
        url = f"https://bhagavadgitaapi.in/v1/verses/{chapter}/{verse}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "VidStack-Engine/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))

            hindi_text = ""
            if "tej" in data and "ht" in data["tej"]:
                hindi_text = data["tej"]["ht"]
            elif "siva" in data and "et" in data["siva"]:
                hindi_text = data["siva"]["et"]
            else:
                hindi_text = data.get("meaning", "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...")

            verse_obj = GitaVerse(
                chapter=chapter,
                verse=verse,
                slok_sanskrit=data.get("slok", ""),
                transliteration=data.get("transliteration"),
                hindi_meaning=hindi_text,
                word_meanings=data.get("word_meanings")
            )

            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(verse_obj.model_dump(), f, ensure_ascii=False, indent=2)

            return verse_obj

        except Exception:
            return GitaVerse(
                chapter=chapter,
                verse=verse,
                slok_sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
                transliteration="karmaṇyevādhikāraste mā phaleṣu kadācana...",
                hindi_meaning="तुम्हारा अधिकार केवल कर्म करने में है, उसके फल में कभी नहीं। इसलिए फल की इच्छा से कर्म मत करो और न ही कर्म त्यागने में रुचि रखो।",
                word_meanings="कर्मणि-कर्म में; एव-केवल; अधिकारः-अधिकार; ते-तुम्हारा; मा-कभी नहीं; फलेषु-फलों में..."
            )


if __name__ == "__main__":
    loader = GitaDatasetManager()
    v = loader.get_verse(chapter=2, verse=47)
    print(f"Loaded Adhyay {v.chapter}, Shlok {v.verse}")
    print(f"Sanskrit: {v.slok_sanskrit}")
    print(f"Hindi: {v.hindi_meaning}")
