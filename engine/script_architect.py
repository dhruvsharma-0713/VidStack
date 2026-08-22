import json
import os
from typing import Optional
from groq import Groq
from pydantic import BaseModel, Field

try:
    from engine.gita_loader import GitaDatasetManager, GitaVerse
except ImportError:
    from gita_loader import GitaDatasetManager, GitaVerse


class ScriptScene(BaseModel):
    scene_number: int
    duration_seconds: int
    spoken_hindi: str
    visual_description: str
    bgm_mood: str


class GitaVideoScript(BaseModel):
    chapter: int = Field(default=0, description="Bhagavad Gita chapter (0 for freeform notes)")
    verse: int = Field(default=0, description="Bhagavad Gita verse (0 for freeform notes)")
    title_hindi: str
    youtube_tags: list[str]
    scenes: list[ScriptScene]
    total_estimated_duration: int


class GitaScriptArchitect:
    """Generates structured, high-retention Hindi video scripts for Gitaverse."""

    VERSE_SYSTEM_PROMPT = (
        "You are an expert devotional scriptwriter for 'Geetaverse'. "
        "Narration style: inspired by Shailendra Bharti — calm, soulful, and simple Hindi. "
        "Format: 40-second YouTube Short / Reel featuring cute 2D Little Krishna talking lovingly to the viewer.\n"
        "Guidelines:\n"
        "1. 4-5 scenes, exactly 35-45s total.\n"
        "2. Structure: Hook (relatable problem) -> Shlok Recitation -> Soulful Meaning -> Practical Takeaway -> Outro (Radhe Radhe).\n"
        "3. Language: Pure, gentle conversational Hindi in Devanagari script.\n"
        "4. Return strict JSON matching the GitaVideoScript schema."
    )

    OPERATOR_DRAFT_SYSTEM_PROMPT = (
        "You are an expert devotional scriptwriter for 'Geetaverse'. "
        "Narration style: inspired by Shailendra Bharti — calm, soulful, and simple Hindi. "
        "Format: 35-40 second vertical video (YouTube Shorts / Reels) featuring cute 2D Little Krishna talking lovingly to the viewer.\n"
        "Guidelines:\n"
        "1. Exactly 5 scenes, total duration 35-40s (individual scene durations ~6-9s each).\n"
        "2. Structure:\n"
        "   - Scene 1: Hook (address the operator's theme or relatable pain point with warmth, e.g. 'मेरे प्यारे मित्र, क्या आप...')\n"
        "   - Scene 2: Gita Wisdom / Shlok context (how Lord Krishna addresses this in Bhagavad Gita)\n"
        "   - Scene 3: Deep Meaning & Perspective Shift (soulful explanation)\n"
        "   - Scene 4: Practical Action / Takeaway (simple step the viewer can take today)\n"
        "   - Scene 5: Outro & Divine Blessing (closing reassurance + 'प्रेम से बोलिए, राधे-राधे!')\n"
        "3. Language: Pure, gentle, conversational Hindi in Devanagari script.\n"
        "4. Return strict JSON matching the GitaVideoScript schema (set chapter and verse to relevant Gita reference if known, else 0)."
    )

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def generate_script(self, verse: GitaVerse) -> GitaVideoScript:
        """Generates a 5-scene script from a structured Gita verse."""
        if not self.client:
            return self._default_script(verse)

        prompt = (
            f"Adhyay: {verse.chapter}, Shlok: {verse.verse}\n"
            f"Sanskrit: {verse.slok_sanskrit}\n"
            f"Hindi Meaning: {verse.hindi_meaning}\n"
            f"Word Meanings: {verse.word_meanings or ''}\n"
            "Generate JSON matching the schema."
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self.VERSE_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            raw = json.loads(response.choices[0].message.content)
            return GitaVideoScript(**raw)
        except Exception:
            return self._default_script(verse)

    def refine_operator_draft(self, raw_input: str) -> GitaVideoScript:
        """Transforms unstructured operator notes/themes into a 5-scene Little Krishna script."""
        if not self.client:
            return self._default_draft_script(raw_input)

        prompt = (
            f"Operator Notes / Raw Theme: {raw_input}\n"
            "Transform these notes into a high-retention 5-scene Little Krishna devotional script. "
            "Enforce Little Krishna's soulful Hindi narrative format across 5 scenes (35-40s total). "
            "Return JSON matching the GitaVideoScript schema."
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self.OPERATOR_DRAFT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            raw = json.loads(response.choices[0].message.content)
            return GitaVideoScript(**raw)
        except Exception:
            return self._default_draft_script(raw_input)

    def _default_script(self, verse: GitaVerse) -> GitaVideoScript:
        return GitaVideoScript(
            chapter=verse.chapter,
            verse=verse.verse,
            title_hindi=f"कर्म करो, फल की चिंता मत करो | गीता अध्याय {verse.chapter} श्लोक {verse.verse}",
            youtube_tags=["#Geetaverse", "#BhagavadGita", "#Krishna", "#Shorts", "#HindiSpiritual"],
            total_estimated_duration=38,
            scenes=[
                ScriptScene(
                    scene_number=1,
                    duration_seconds=7,
                    spoken_hindi="अक्सर हम काम करने से पहले ही उसके परिणाम को लेकर चिंता में डूब जाते हैं, है ना?",
                    visual_description="Cute 2D Little Krishna sitting under a Kadamba tree with a sweet smile, holding a flute.",
                    bgm_mood="gentle_flute_intro"
                ),
                ScriptScene(
                    scene_number=2,
                    duration_seconds=8,
                    spoken_hindi="श्री कृष्ण गीता में अर्जुन से कहते हैं: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'...",
                    visual_description="Little Krishna glowing with soft divine aura, pointing towards a peaceful sunrise.",
                    bgm_mood="divine_tanpura"
                ),
                ScriptScene(
                    scene_number=3,
                    duration_seconds=10,
                    spoken_hindi="इसका सीधा सा अर्थ है—तुम्हारा अधिकार केवल सच्चे मन से कर्म करने पर है, उसके फल पर नहीं।",
                    visual_description="2D animated scene of a young artisan working peacefully on a clay pot, surrounded by golden sparkles.",
                    bgm_mood="peaceful_flute"
                ),
                ScriptScene(
                    scene_number=4,
                    duration_seconds=8,
                    spoken_hindi="जब तुम फल की चिंता छोड़ कर कर्म में 100% मन लगाते हो, तो सफलता खुद तुम्हारे कदम चूमती है।",
                    visual_description="Little Krishna offering a butter pot with loving eyes and warm smile.",
                    bgm_mood="uplifting_bansuri"
                ),
                ScriptScene(
                    scene_number=5,
                    duration_seconds=5,
                    spoken_hindi="आज से चिंता छोड़िए और कर्म कीजिए। प्रेम से बोलिए, राधे-राधे!",
                    visual_description="Little Krishna waving gently, with text 'राधे राधे' appearing in soft golden letters.",
                    bgm_mood="peaceful_outro"
                )
            ]
        )

    def _default_draft_script(self, raw_input: str) -> GitaVideoScript:
        """Deterministic offline fallback for freeform operator notes."""
        lower_input = raw_input.lower()

        # Tailor fallback for anger / overthinking if keywords match
        if any(k in lower_input for k in ["guss", "krodh", "anger", "overthinking", "chinta", "soch", "stress"]):
            return GitaVideoScript(
                chapter=2,
                verse=63,
                title_hindi="गुस्सा और ओवरथिंकिंग से मुक्ति | गीता का दिव्य संदेश",
                youtube_tags=["#Geetaverse", "#Krishna", "#Overthinking", "#AngerControl", "#Shorts", "#GitaWisdom"],
                total_estimated_duration=38,
                scenes=[
                    ScriptScene(
                        scene_number=1,
                        duration_seconds=7,
                        spoken_hindi="क्या कभी-कभी गुस्सा और लगातार चलने वाले विचार आपके मन का सुकून छीन लेते हैं?",
                        visual_description="Cute 2D Little Krishna looking gently at the viewer with compassionate eyes, holding his flute.",
                        bgm_mood="gentle_flute_intro"
                    ),
                    ScriptScene(
                        scene_number=2,
                        duration_seconds=8,
                        spoken_hindi="गीता में श्री कृष्ण कहते हैं—ध्यायतो विषयान्पुंसः... जब हम ज्यादा सोचते हैं, तो मोह और उससे क्रोध जन्म लेता है।",
                        visual_description="Little Krishna standing peacefully with soft divine golden aura, calming the stormy waters.",
                        bgm_mood="divine_tanpura"
                    ),
                    ScriptScene(
                        scene_number=3,
                        duration_seconds=8,
                        spoken_hindi="क्रोध में हमारी बुद्धि काम करना बंद कर देती है, और हम खुद का ही नुकसान कर बैठते हैं।",
                        visual_description="2D scene showing a wandering mind finding solace at the lotus feet of Krishna.",
                        bgm_mood="peaceful_flute"
                    ),
                    ScriptScene(
                        scene_number=4,
                        duration_seconds=9,
                        spoken_hindi="जब भी मन में अशांति या गुस्सा आए, 2 मिनट गहरी सांस लें और सब कुछ कान्हा को समर्पित कर दें।",
                        visual_description="Little Krishna offering soothing golden light and a comforting warm smile.",
                        bgm_mood="uplifting_bansuri"
                    ),
                    ScriptScene(
                        scene_number=5,
                        duration_seconds=6,
                        spoken_hindi="शांत मन ही सबसे बड़ी शक्ति है। सब अच्छा होगा, प्रेम से बोलिए—राधे-राधे!",
                        visual_description="Little Krishna waving lovingly with text 'राधे राधे' shining in soft divine light.",
                        bgm_mood="peaceful_outro"
                    )
                ]
            )

        # General thematic fallback
        cleaned_topic = raw_input.strip()
        return GitaVideoScript(
            chapter=0,
            verse=0,
            title_hindi=f"{cleaned_topic[:40]} | श्री कृष्ण का दिव्य संदेश",
            youtube_tags=["#Geetaverse", "#Krishna", "#GitaWisdom", "#Shorts", "#Spiritual"],
            total_estimated_duration=38,
            scenes=[
                ScriptScene(
                    scene_number=1,
                    duration_seconds=7,
                    spoken_hindi=f"मेरे प्यारे मित्र, क्या आप भी '{cleaned_topic[:30]}' को लेकर परेशान रहते हैं?",
                    visual_description="Cute 2D Little Krishna sitting peacefully, looking warmly at the viewer.",
                    bgm_mood="gentle_flute_intro"
                ),
                ScriptScene(
                    scene_number=2,
                    duration_seconds=8,
                    spoken_hindi="श्री कृष्ण गीता में समझाते हैं कि जीवन की हर मुश्किल का समाधान हमारे शांत मन में छिपा है।",
                    visual_description="Little Krishna with glowing divine aura against a peaceful sunrise background.",
                    bgm_mood="divine_tanpura"
                ),
                ScriptScene(
                    scene_number=3,
                    duration_seconds=9,
                    spoken_hindi="जब हम बाहरी परिस्थितियों से विचलित नहीं होते, तब ईश्वर की असीम कृपा हमें सही मार्ग दिखाती है।",
                    visual_description="Sparkling 2D divine scenery depicting clarity and inner peace.",
                    bgm_mood="peaceful_flute"
                ),
                ScriptScene(
                    scene_number=4,
                    duration_seconds=8,
                    spoken_hindi="आज से ही अपने मन को शांत रखें, सच्चे मन से कर्म करें और परिणाम मुझ पर छोड़ दें।",
                    visual_description="Little Krishna holding out his hand with reassuring smile.",
                    bgm_mood="uplifting_bansuri"
                ),
                ScriptScene(
                    scene_number=5,
                    duration_seconds=6,
                    spoken_hindi="आप कभी अकेले नहीं हैं, मैं हमेशा आपके साथ हूँ। प्रेम से बोलिए, राधे-राधे!",
                    visual_description="Little Krishna waving with golden text 'राधे राधे' glowing warmly.",
                    bgm_mood="peaceful_outro"
                )
            ]
        )


if __name__ == "__main__":
    architect = GitaScriptArchitect()
    sample_draft = architect.refine_operator_draft("gusse aur overthinking se kaise bache")
    print(f"Title: {sample_draft.title_hindi}")
    print(f"Scenes: {len(sample_draft.scenes)} (~{sample_draft.total_estimated_duration}s total)")
