import asyncio
from pathlib import Path
from typing import Optional
import edge_tts
from pydantic import BaseModel

try:
    from engine.gita_loader import GitaDatasetManager
    from engine.script_architect import GitaScriptArchitect, GitaVideoScript
except ImportError:
    from gita_loader import GitaDatasetManager
    from script_architect import GitaScriptArchitect, GitaVideoScript


class AudioTrackMetadata(BaseModel):
    total_audio_duration: float
    scene_durations: list[float]
    voiceover_path: str
    mixed_audio_path: str


class GitaAudioSynthesizer:
    """Synthesizes soulful Hindi narration for Gitaverse scenes using Edge-TTS."""

    VOICE_HINDI = "hi-IN-MadhurNeural"

    def __init__(self, output_dir: Optional[Path] = None):
        import os
        if os.getenv("VERCEL"):
            self.output_dir = output_dir or Path("/tmp/engine_output/audio")
            self.assets_dir = Path("/tmp/audio_assets")
        else:
            self.output_dir = output_dir or Path(__file__).resolve().parent / "output" / "audio"
            self.assets_dir = Path(__file__).resolve().parent / "data" / "audio_assets"
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self.assets_dir.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

    async def _synthesize_scene(self, text: str, output_path: Path) -> None:
        communicate = edge_tts.Communicate(text=text, voice=self.VOICE_HINDI, rate="+0%")
        await communicate.save(str(output_path))

    async def generate_voiceover(self, script: GitaVideoScript) -> AudioTrackMetadata:
        scene_files: list[Path] = [self.output_dir / f"scene_{s.scene_number}.mp3" for s in script.scenes]

        # Synthesize all scene voiceovers concurrently for maximum speed
        tasks = [
            self._synthesize_scene(scene.spoken_hindi, path)
            for scene, path in zip(script.scenes, scene_files)
        ]
        await asyncio.gather(*tasks)

        scene_durations: list[float] = []
        for scene_path, scene in zip(scene_files, script.scenes):
            duration = max(3.0, len(scene.spoken_hindi) / 4.5)
            try:
                from mutagen.mp3 import MP3
                duration = MP3(str(scene_path)).info.length
            except Exception:
                pass
            scene_durations.append(round(duration, 2))

        if script.chapter > 0 and script.verse > 0:
            merged_voice_name = f"voice_ch{script.chapter}_v{script.verse}.mp3"
        else:
            merged_voice_name = "voice_draft.mp3"
        merged_voice_path = self.output_dir / merged_voice_name

        with open(merged_voice_path, "wb") as outfile:
            for sf in scene_files:
                if sf.exists():
                    with open(sf, "rb") as infile:
                        outfile.write(infile.read())

        total_duration = round(sum(scene_durations), 2)

        return AudioTrackMetadata(
            total_audio_duration=total_duration,
            scene_durations=scene_durations,
            voiceover_path=str(merged_voice_path),
            mixed_audio_path=str(merged_voice_path)
        )


if __name__ == "__main__":
    loader = GitaDatasetManager()
    verse = loader.get_verse(chapter=2, verse=47)
    architect = GitaScriptArchitect()
    script_data = architect.generate_script(verse)

    synthesizer = GitaAudioSynthesizer()
    meta = asyncio.run(synthesizer.generate_voiceover(script_data))
    print(f"Voiceover generated: {meta.voiceover_path}")
    print(f"Duration: {meta.total_audio_duration}s ({meta.scene_durations})")
