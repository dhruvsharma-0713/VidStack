import asyncio
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Optional
from PIL import Image
from pydantic import BaseModel

try:
    from engine.gita_loader import GitaDatasetManager, GitaVerse
    from engine.script_architect import GitaScriptArchitect, GitaVideoScript
    from engine.audio_synthesizer import GitaAudioSynthesizer, AudioTrackMetadata
    from engine.visual_engine import LittleKrishnaVisualManager
    from engine.subtitle_burner import SubtitleBurner
except ImportError:
    from gita_loader import GitaDatasetManager, GitaVerse
    from script_architect import GitaScriptArchitect, GitaVideoScript
    from audio_synthesizer import GitaAudioSynthesizer, AudioTrackMetadata
    from visual_engine import LittleKrishnaVisualManager
    from subtitle_burner import SubtitleBurner


class VideoRenderResult(BaseModel):
    video_path: str
    duration_seconds: float
    resolution: str
    file_size_bytes: int
    chapter: int
    verse: int


class GitaVideoRenderer:
    """Assembles scene backgrounds, zoom motion, subtitles, and audio into final 9:16 video in a single FFmpeg pass."""

    WIDTH = 1080
    HEIGHT = 1920
    FPS = 30

    def __init__(self, output_dir: Optional[Path] = None):
        if os.getenv("VERCEL"):
            self.output_dir = output_dir or Path("/tmp/engine_output")
        else:
            self.output_dir = output_dir or Path(__file__).resolve().parent / "output"
        self.temp_dir = self.output_dir / "temp_render"
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self.temp_dir.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
        self._ffmpeg_bin: Optional[str] = None

    @property
    def ffmpeg_bin(self) -> str:
        """Lazy-loads and checks for ffmpeg binary on demand, falling back to imageio-ffmpeg."""
        if not self._ffmpeg_bin:
            self._ffmpeg_bin = shutil.which("ffmpeg")
            if not self._ffmpeg_bin:
                try:
                    import imageio_ffmpeg
                    self._ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
                except Exception:
                    self._ffmpeg_bin = "ffmpeg"
        return self._ffmpeg_bin

    def _prepare_scene_cards(self, bg_paths: list[str], sub_paths: list[str]) -> list[Path]:
        """Pre-composites background images with subtitle overlays into scene cards."""
        card_paths: list[Path] = []
        for idx, (bg_p, sub_p) in enumerate(zip(bg_paths, sub_paths), 1):
            bg_img = Image.open(bg_p).convert("RGBA")
            sub_img = Image.open(sub_p).convert("RGBA")
            composite = Image.alpha_composite(bg_img, sub_img)
            
            card_path = self.temp_dir / f"scene_card_{idx}.png"
            composite.convert("RGB").save(str(card_path), "PNG")
            card_paths.append(card_path)
        return card_paths

    def _write_concat_manifest(self, card_paths: list[Path], scene_durations: list[float]) -> Path:
        """Writes an FFmpeg concat script manifest containing scene cards and duration flags."""
        manifest_path = self.temp_dir / "concat_manifest.txt"
        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write("ffconcat version 1.0\n")
            for card, dur in zip(card_paths, scene_durations):
                safe_path = str(card.resolve()).replace("\\", "/")
                f.write(f"file '{safe_path}'\n")
                f.write(f"duration {dur}\n")
            if card_paths:
                safe_last = str(card_paths[-1].resolve()).replace("\\", "/")
                f.write(f"file '{safe_last}'\n")
        return manifest_path

    def assemble_video(
        self,
        script: GitaVideoScript,
        audio_meta: AudioTrackMetadata,
        bg_paths: list[str],
        sub_paths: list[str]
    ) -> VideoRenderResult:
        """Executes direct single-pass FFmpeg rendering with subtle zoom motion and audio muxing."""
        # 1. Pre-composite 5 scene image cards
        card_paths = self._prepare_scene_cards(bg_paths, sub_paths)

        # 2. Write concat manifest script
        self._write_concat_manifest(card_paths, audio_meta.scene_durations)

        # 3. Output naming (supports chapter/verse or freeform draft)
        if script.chapter > 0 and script.verse > 0:
            output_name = f"geetaverse_ch{script.chapter}_v{script.verse}.mp4"
        else:
            output_name = "geetaverse_draft_reel.mp4"
        final_output_path = self.output_dir / output_name

        # 4. Build single-pass FFmpeg command
        cmd = [self.ffmpeg_bin, "-y", "-threads", "0", "-filter_complex_threads", "0"]

        for card in card_paths:
            cmd.extend(["-i", str(card.resolve())])

        cmd.extend(["-i", str(Path(audio_meta.voiceover_path).resolve())])

        # Filter complex: apply zoompan per card with exact duration, then concat
        filter_parts: list[str] = []
        concat_inputs: list[str] = []
        for i, dur in enumerate(audio_meta.scene_durations):
            frames = max(30, int(dur * self.FPS))
            # Subtle zoom motion matching operator spec
            filter_parts.append(
                f"[{i}:v]zoompan=z='min(zoom+0.0015,1.15)':d={frames}:s={self.WIDTH}x{self.HEIGHT}:fps={self.FPS}[v{i}]"
            )
            concat_inputs.append(f"[v{i}]")

        audio_idx = len(card_paths)
        filter_parts.append(f"{''.join(concat_inputs)}concat=n={len(card_paths)}:v=1:a=0,format=yuv420p[outv]")
        filter_complex = ";".join(filter_parts)

        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", f"{audio_idx}:a",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "stillimage",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(final_output_path.resolve())
        ])

        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg single-pass render failed: {result.stderr}")

        file_size = final_output_path.stat().st_size

        return VideoRenderResult(
            video_path=str(final_output_path),
            duration_seconds=audio_meta.total_audio_duration,
            resolution=f"{self.WIDTH}x{self.HEIGHT}",
            file_size_bytes=file_size,
            chapter=script.chapter,
            verse=script.verse
        )


async def run_full_pipeline(
    chapter: int = 2,
    verse: int = 47,
    output_dir: Optional[Path] = None
) -> VideoRenderResult:
    """Executes the full automated video generation pipeline for a given Gita verse."""
    dataset_mgr = GitaDatasetManager()
    gita_verse = dataset_mgr.get_verse(chapter=chapter, verse=verse)

    architect = GitaScriptArchitect()
    script = architect.generate_script(gita_verse)

    audio_synthesizer = GitaAudioSynthesizer(output_dir=output_dir / "audio" if output_dir else None)
    audio_meta = await audio_synthesizer.generate_voiceover(script)

    visual_mgr = LittleKrishnaVisualManager()
    bg_paths = visual_mgr.prepare_all_scenes()

    burner = SubtitleBurner(output_dir=output_dir / "subtitles" if output_dir else None)
    sub_paths = burner.generate_all_subtitles(script)

    renderer = GitaVideoRenderer(output_dir=output_dir)
    return renderer.assemble_video(script, audio_meta, bg_paths, sub_paths)


if __name__ == "__main__":
    result = asyncio.run(run_full_pipeline(chapter=2, verse=47))
    print(f"Video generated: {result.video_path} ({result.duration_seconds}s, {result.file_size_bytes} bytes)")
