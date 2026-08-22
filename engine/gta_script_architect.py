import json
import os
import re
from typing import List, Optional
from pydantic import BaseModel, Field


class GTAScriptScene(BaseModel):
    scene_number: int = Field(..., description="Scene index 1 to 5")
    duration_seconds: int = Field(default=6, description="Scene duration in seconds")
    spoken_hindi: str = Field(..., description="Fast-paced, energetic spoken Hindi gaming commentary")
    visual_description: str = Field(default="", description="Description of the GTA V gameplay footage")
    energy_level: str = Field(default="high", description="Energy level: suspense, high, extreme")


class GTAVideoScript(BaseModel):
    title_hindi: str = Field(..., description="Punchy, viral Hindi video title")
    youtube_tags: List[str] = Field(default_factory=list, description="Trending hashtags for YouTube & Instagram Reels")
    total_estimated_duration: int = Field(default=32, description="Target total duration (30-35s)")
    scenes: List[GTAScriptScene] = Field(..., description="5 sequential high-retention gaming narrative scenes")


GTA_SYSTEM_PROMPT = """You are the lead viral scriptwriter for 'GTA Chronicles', a top-tier gaming channel creating fast-paced 30-35s vertical Shorts & Reels in Hindi.

Your Style & Persona:
1. Tone: Super energetic, engaging, punchy Hindi gamer slang (e.g. 'Bhai suno!', 'GTA 5 ka sabse bada secret!', 'Ye trick kisi ko nahi pata', 'Ruk jao!').
2. Format: Exactly 5 Scenes totaling 30-35 seconds:
   - Scene 1 (Hook, 6s): Shocking question or impossible claim that stops scrolling instantly.
   - Scene 2 (The Setup / Myth, 7s): Context, location in Los Santos (Mount Chiliad, Maze Bank, Subway, Military Base).
   - Scene 3 (The Action / Climax, 8s): High-octane gameplay moment, stunt, or shocking discovery.
   - Scene 4 (The Reveal / Result, 7s): What actually happened, myth busted or epic score achieved.
   - Scene 5 (CTA & Outro, 5s): Like, subscribe challenge with high gamer energy.
3. Language: Pure spoken Hindi in Devanagari script (e.g., 'क्या आपने कभी GTA 5 में ये सीक्रेट लोकेशन देखी है?').

Return ONLY valid JSON matching this schema:
{
  "title_hindi": "...",
  "youtube_tags": ["#GTA5", "#GamingShorts", "#GTAChronicles", "#GTAV", "#Gaming"],
  "total_estimated_duration": 33,
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 6,
      "spoken_hindi": "...",
      "visual_description": "...",
      "energy_level": "extreme"
    },
    ... (5 scenes total)
  ]
}
"""


class GTAScriptArchitect:
    """Generates high-retention GTA V gaming commentary and myth-busting vertical short scripts."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception:
                self.client = None

    def refine_gaming_draft(self, raw_input: str) -> GTAVideoScript:
        """Transforms raw operator notes into a 5-scene viral Hindi gaming narrative."""
        cleaned = raw_input.strip() if raw_input else "GTA 5 Secret Subway Heist Escape"

        if self.client:
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": GTA_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": f"Create a fast-paced 5-scene Hindi gaming short script based on these operator notes:\n{cleaned}"
                        }
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                response_text = chat_completion.choices[0].message.content
                data = json.loads(response_text)
                return GTAVideoScript(**data)
            except Exception as e:
                print(f"[!] Groq GTA script generation failed: {e}. Using deterministic fallback.")

        return self._get_fallback_gaming_script(cleaned)

    def generate_gaming_script(self, topic: str) -> GTAVideoScript:
        """Alias for refine_gaming_draft."""
        return self.refine_gaming_draft(topic)

    def _get_fallback_gaming_script(self, raw_input: str) -> GTAVideoScript:
        """Provides deterministic, high-energy gaming short scripts when offline."""
        lowered = raw_input.lower()

        if any(w in lowered for w in ["jump", "stunt", "unchi", "highest", "ramp", "car"]):
            return GTAVideoScript(
                title_hindi="GTA 5 की सबसे ऊंची Jump! | Impossible Ramp Stunt",
                youtube_tags=["#GTA5", "#GTAStunts", "#GamingShorts", "#GTAChronicles", "#GTAV"],
                total_estimated_duration=33,
                scenes=[
                    GTAScriptScene(
                        scene_number=1,
                        duration_seconds=6,
                        spoken_hindi="क्या GTA 5 में Maze Bank Tower से बिना Parachute के Rocket Voltic को लैंड कराया जा सकता है?",
                        visual_description="Cinematic slow-motion shot of Rocket Voltic parked atop Maze Bank with Los Santos background.",
                        energy_level="extreme"
                    ),
                    GTAScriptScene(
                        scene_number=2,
                        duration_seconds=7,
                        spoken_hindi="आज हम ट्राई करने वाले हैं लॉस सैंटोस का सबसे खतरनाक स्टंट। हमने लगाई 1000 फीट ऊंची रैंप!",
                        visual_description="Franklin revving the rocket engine at full throttle with tire smoke.",
                        energy_level="high"
                    ),
                    GTAScriptScene(
                        scene_number=3,
                        duration_seconds=8,
                        spoken_hindi="बूस्ट ऑन करते ही गाड़ी 250 की स्पीड से हवा में उड़ गई! देखिए कैसे हवा में 3 बार 360 डिग्री फ्लिप किया!",
                        visual_description="Vehicle flying over skyscrapers with camera tracking the mid-air barrel roll.",
                        energy_level="extreme"
                    ),
                    GTAScriptScene(
                        scene_number=4,
                        duration_seconds=7,
                        spoken_hindi="और भाई साहब! ठीक स्विमिंग पूल के बीच में परफेक्ट स्मूथ लैंडिंग! 0% डैमेज!",
                        visual_description="Car splashing smoothly into the rooftop pool with triumph horn sound.",
                        energy_level="high"
                    ),
                    GTAScriptScene(
                        scene_number=5,
                        duration_seconds=5,
                        spoken_hindi="अगर आपको ये स्टंट पसंद आया तो वीडियो को तुरंत लाइक करो और GTA क्रॉनिकल्स को सब्सक्राइब करो!",
                        visual_description="GTA Chronicles end screen with animated like button and subscribe notification.",
                        energy_level="high"
                    )
                ]
            )

        if any(w in lowered for w in ["chiliad", "mystery", "alien", "ufo", "raaz", "secret"]):
            return GTAVideoScript(
                title_hindi="Mount Chiliad का सबसे बड़ा रहस्य! | GTA 5 Alien Secret",
                youtube_tags=["#GTA5Secrets", "#MountChiliad", "#GamingShorts", "#GTAChronicles"],
                total_estimated_duration=32,
                scenes=[
                    GTAScriptScene(
                        scene_number=1,
                        duration_seconds=6,
                        spoken_hindi="क्या आपने कभी रात के ठीक 3 बजे माउंट चिलियाड के टॉप पर जाकर देखा है?",
                        visual_description="Dark stormy weather over Mount Chiliad with lightning strikes.",
                        energy_level="suspense"
                    ),
                    GTAScriptScene(
                        scene_number=2,
                        duration_seconds=7,
                        spoken_hindi="रॉकस्टार गेम्स ने 10 साल पहले ये सीक्रेट छिपाया था, जिसे 99% प्लेयर्स आज भी नहीं जानते!",
                        visual_description="Michael scanning the mysterious wall glyphs inside the cable car station.",
                        energy_level="high"
                    ),
                    GTAScriptScene(
                        scene_number=3,
                        duration_seconds=7,
                        spoken_hindi="जैसे ही घड़ी में 3 बजते हैं और बारिश शुरू होती है, बादलों के बीच से एक असली एलियन UFO प्रकट होता है!",
                        visual_description="Glowing green beam of light appearing in the dark sky revealing the UFO.",
                        energy_level="extreme"
                    ),
                    GTAScriptScene(
                        scene_number=4,
                        duration_seconds=7,
                        spoken_hindi="इस UFO पर FIB का लोगो लगा है, जिसका मतलब सरकार और एलियंस का कुछ गहरा कनेक्शन है!",
                        visual_description="Sniper zoom-in highlighting the FIB markings on the alien craft hull.",
                        energy_level="suspense"
                    ),
                    GTAScriptScene(
                        scene_number=5,
                        duration_seconds=5,
                        spoken_hindi="क्या आपने ये UFO खुद देखा है? कमेंट्स में बताओ और चैनल को सब्सक्राइब करो!",
                        visual_description="GTA Chronicles logo with high energy subscribe animation.",
                        energy_level="high"
                    )
                ]
            )

        # Default General GTA Heist & Gameplay Narrative
        return GTAVideoScript(
            title_hindi=f"GTA 5 Secret: {raw_input[:35]} | Unbelievable Myth",
            youtube_tags=["#GTA5", "#GTAV", "#GamingShorts", "#GTAChronicles", "#Gaming"],
            total_estimated_duration=32,
            scenes=[
                GTAScriptScene(
                    scene_number=1,
                    duration_seconds=6,
                    spoken_hindi=f"क्या आपको GTA 5 का ये क्रेज़ी सीक्रेट पता है? आज हम टेस्ट करने वाले हैं {raw_input[:30]}!",
                    visual_description="Fast cinematic camera pan across downtown Los Santos with police sirens.",
                    energy_level="high"
                ),
                GTAScriptScene(
                    scene_number=2,
                    duration_seconds=7,
                    spoken_hindi="जब 5-स्टार पुलिस आपके पीछे पड़ जाए, तो लॉस सैंटोस के इस सीक्रेट सबवे टनल में घुस जाओ।",
                    visual_description="Trevor drifting at high speed into the dark subway entrance under Pillbox Hill.",
                    energy_level="extreme"
                ),
                GTAScriptScene(
                    scene_number=3,
                    duration_seconds=7,
                    spoken_hindi="अंदर जाते ही पुलिस हेलीकॉप्टर्स का सिग्नल टूट जाता है और स्वाट टीम पूरी तरह कंफ्यूज हो जाती है!",
                    visual_description="Police sirens fading in distance as car speeds through underground train tracks.",
                    energy_level="high"
                ),
                GTAScriptScene(
                    scene_number=4,
                    duration_seconds=7,
                    spoken_hindi="सिर्फ 20 सेकंड में सारे 5 स्टार गायब, और 200 मिलियन डॉलर का हीस्ट कैश एकदम सेफ!",
                    visual_description="Michael stepping out counting a stack of heist cash with custom sunglasses.",
                    energy_level="high"
                ),
                GTAScriptScene(
                    scene_number=5,
                    duration_seconds=5,
                    spoken_hindi="ऐसे ही धांसू GTA 5 सीक्रेट्स के लिए वीडियो को लाइक और सब्सक्राइब जरूर करें!",
                    visual_description="GTA Chronicles end screen with pulsing subscriber counter.",
                    energy_level="high"
                )
            ]
        )


if __name__ == "__main__":
    architect = GTAScriptArchitect()
    res = architect.refine_gaming_draft("GTA 5 me sabse unchi jump")
    print(f"Title: {res.title_hindi}")
    print(f"Scenes ({len(res.scenes)}):")
    for s in res.scenes:
        print(f"  #{s.scene_number} ({s.duration_seconds}s): {s.spoken_hindi}")
