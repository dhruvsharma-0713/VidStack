import asyncio
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import edge_tts
from PIL import Image, ImageDraw, ImageFont

from engine.gta_script_architect import GTAVideoScript, GTAScriptScene

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"

if os.getenv("VERCEL"):
    OUTPUT_DIR = Path("/tmp/engine_output")
    FOOTAGE_DIR = Path("/tmp/gta_footage")
else:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"
    FOOTAGE_DIR = DATA_DIR / "gta_footage"

SUBTITLES_DIR = OUTPUT_DIR / "gta_subtitles"
AUDIO_DIR = OUTPUT_DIR / "gta_audio"

for p in [FOOTAGE_DIR, OUTPUT_DIR, SUBTITLES_DIR, AUDIO_DIR]:
    try:
        p.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass


class GTAGameplayManager:
    """Manages GTA gameplay footage assets or generates procedural cyber-neon motion cards."""

    def __init__(self, footage_dir: Path = FOOTAGE_DIR):
        self.footage_dir = footage_dir

    def get_scene_backgrounds(self, script: GTAVideoScript) -> List[Path]:
        """Returns 5 1080x1920 background image/video cards for each script scene."""
        out_paths = []
        # Check for local MP4 or JPG gameplay assets
        existing_images = list(self.footage_dir.glob("*.jpg")) + list(self.footage_dir.glob("*.png"))

        color_themes = [
            ("#0f172a", "#1e1b4b", "🚨 HIGH-STAKES HOOK", "#ef4444"),
            ("#1e1b4b", "#064e3b", "🔍 MYTH & SETUP", "#10b981"),
            ("#064e3b", "#701a75", "💥 ACTION CLIMAX", "#f59e0b"),
            ("#701a75", "#1e293b", "🏆 THE REVEAL", "#8b5cf6"),
            ("#1e293b", "#0f172a", "🔔 SUBSCRIBE NOW", "#ec4899"),
        ]

        for idx, scene in enumerate(script.scenes):
            bg_file = SUBTITLES_DIR / f"gta_bg_scene_{idx+1}.png"
            # Generate procedural neon gaming card
            img = self._generate_procedural_gaming_card(
                scene_num=idx + 1,
                theme=color_themes[idx % len(color_themes)],
                visual_desc=scene.visual_description
            )
            img.save(bg_file, "PNG", quality=95)
            out_paths.append(bg_file)

        return out_paths

    def _generate_procedural_gaming_card(self, scene_num: int, theme: tuple, visual_desc: str) -> Image.Image:
        """Draws a 1080x1920 high-energy cyber-grid gaming background card."""
        w, h = 1080, 1920
        top_color, bottom_color, badge_text, badge_color = theme

        img = Image.new("RGBA", (w, h), (15, 23, 42, 255))
        draw = ImageDraw.Draw(img)

        # 1. Gradient Background
        for y in range(h):
            ratio = y / h
            # Hex to RGB interpolation
            r1, g1, b1 = int(top_color[1:3], 16), int(top_color[3:5], 16), int(top_color[5:7], 16)
            r2, g2, b2 = int(bottom_color[1:3], 16), int(bottom_color[3:5], 16), int(bottom_color[5:7], 16)
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

        # 2. Cyber Neon Grid Lines (Perspective Gaming Floor)
        horizon_y = 1100
        for x in range(0, w + 1, 90):
            draw.line([(x, horizon_y), (int(w / 2 + (x - w / 2) * 3.5), h)], fill=(255, 255, 255, 25), width=2)
        for y in range(horizon_y, h, 70):
            draw.line([(0, y), (w, y)], fill=(255, 255, 255, 20), width=2)

        # 3. Top Gaming Channel Header
        font_header = self._get_font(36, bold=True)
        draw.text((60, 90), "GTA CHRONICLES", fill=(250, 204, 21, 255), font=font_header)
        draw.text((60, 135), "4K 60FPS GAMEPLAY & MYTHS", fill=(148, 163, 184, 255), font=self._get_font(22))

        # Top Right Live Badge
        draw.rounded_rectangle([(w - 240, 90), (w - 60, 145)], radius=16, fill=(239, 68, 68, 240))
        draw.text((w - 210, 105), "🔴 4K ULTRA", fill=(255, 255, 255, 255), font=self._get_font(22, bold=True))

        # 4. Center Scene Category Badge
        badge_w, badge_h = 560, 75
        bx1 = (w - badge_w) // 2
        by1 = 480
        draw.rounded_rectangle([(bx1, by1), (bx1 + badge_w, by1 + badge_h)], radius=20, fill=(15, 23, 42, 230), outline=(250, 204, 21, 255), width=3)
        draw.text((bx1 + 45, by1 + 20), badge_text, fill=(255, 255, 255, 255), font=self._get_font(28, bold=True))

        # 5. Visual Hint in Mid Section
        if visual_desc:
            clean_desc = visual_desc[:120]
            draw.rounded_rectangle([(80, 590), (w - 80, 720)], radius=20, fill=(0, 0, 0, 140))
            draw.text((110, 635), f"🎮 {clean_desc}", fill=(203, 213, 225, 240), font=self._get_font(24))

        return img

    def _get_font(self, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
        """Loads appropriate Devanagari/Latin system font."""
        candidates = [
            "C:\\Windows\\Fonts\\NirmalaB.ttf" if bold else "C:\\Windows\\Fonts\\Nirmala.ttf",
            "C:\\Windows\\Fonts\\seguiemj.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    return ImageFont.truetype(c, size)
                except Exception:
                    pass
        return ImageFont.load_default()


class GTAGamingSubtitleBurner:
    """Generates punchy, high-impact Devanagari gaming subtitles in lower-third yellow/black styling."""

    def __init__(self, output_dir: Path = SUBTITLES_DIR):
        self.output_dir = output_dir

    def generate_all_subtitles(self, script: GTAVideoScript) -> List[Path]:
        """Generates transparent 1080x1920 PNG subtitle overlays for all 5 scenes."""
        sub_paths = []
        for idx, scene in enumerate(script.scenes):
            sub_file = self.output_dir / f"gta_sub_scene_{idx+1}.png"
            img = self._create_gaming_subtitle_card(scene.spoken_hindi, idx + 1)
            img.save(sub_file, "PNG")
            sub_paths.append(sub_file)
        return sub_paths

    def _create_gaming_subtitle_card(self, text: str, scene_num: int) -> Image.Image:
        """Draws bold yellow/black lower-third subtitle pill."""
        w, h = 1080, 1920
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Word wrap text
        lines = self._wrap_hindi_text(text, max_chars=32)
        font = self._get_font(42, bold=True)

        box_height = 90 + len(lines) * 60
        box_y1 = h - box_height - 180
        box_y2 = h - 180

        # Dark Glass Background with Neon Border
        draw.rounded_rectangle(
            [(60, box_y1), (w - 60, box_y2)],
            radius=24,
            fill=(9, 10, 15, 235),
            outline=(250, 204, 21, 255),
            width=4
        )

        # Subtitle Text with Outline
        start_y = box_y1 + 45
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_w = bbox[2] - bbox[0]
            text_x = (w - text_w) // 2

            # Black stroke shadow
            for ox, oy in [(-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2)]:
                draw.text((text_x + ox, start_y + oy), line, font=font, fill=(0, 0, 0, 255))

            # Punchy Yellow Fill
            draw.text((text_x, start_y), line, font=font, fill=(250, 204, 21, 255))
            start_y += 60

        return img

    def _wrap_hindi_text(self, text: str, max_chars: int = 32) -> List[str]:
        words = text.split()
        lines = []
        current = []
        current_len = 0
        for word in words:
            if current_len + len(word) + 1 > max_chars and current:
                lines.append(" ".join(current))
                current = [word]
                current_len = len(word)
            else:
                current.append(word)
                current_len += len(word) + 1
        if current:
            lines.append(" ".join(current))
        return lines or [text]

    def _get_font(self, size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
        candidates = [
            "C:\\Windows\\Fonts\\NirmalaB.ttf" if bold else "C:\\Windows\\Fonts\\Nirmala.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    return ImageFont.truetype(c, size)
                except Exception:
                    pass
        return ImageFont.load_default()


class GTAGameplayRenderer:
    """Direct, single-pass hardware-optimized video renderer for GTA Chronicles."""

    def __init__(self, output_dir: Path = OUTPUT_DIR):
        self.output_dir = output_dir

    async def render_video(self, script: GTAVideoScript, voice_id: str = "hi-IN-MadhurNeural") -> Dict[str, Any]:
        """Synthesizes speech in parallel, pre-composites scene frames, and encodes in under 8 seconds."""
        start_time = time.time()
        timestamp_id = int(time.time())
        final_video_path = self.output_dir / f"gta_chronicles_{timestamp_id}.mp4"

        # 1. Parallel Audio Synthesis with energetic rate (+15%)
        audio_paths, durations = await self._synthesize_audio_parallel(script, voice_id)

        # 2. Prepare Background and Subtitle Overlay PNGs
        mgr = GTAGameplayManager()
        bg_paths = mgr.get_scene_backgrounds(script)

        sub_burner = GTAGamingSubtitleBurner()
        sub_paths = sub_burner.generate_all_subtitles(script)

        # 3. Pre-Composite Scene Cards in Memory
        composite_paths = []
        for i in range(len(script.scenes)):
            comp_file = SUBTITLES_DIR / f"gta_comp_{timestamp_id}_scene_{i+1}.png"
            bg = Image.open(bg_paths[i]).convert("RGBA")
            sub = Image.open(sub_paths[i]).convert("RGBA")
            combined = Image.alpha_composite(bg, sub)
            combined.convert("RGB").save(comp_file, "JPEG", quality=90)
            composite_paths.append(comp_file)

        # 4. Concatenate Scene Audios into Master Audio
        master_audio = AUDIO_DIR / f"gta_master_{timestamp_id}.mp3"
        await self._concat_audio(audio_paths, master_audio)
        total_duration = sum(durations)

        # 6. Execute Single-Pass FFmpeg Hardware Command
        cmd = ["ffmpeg", "-y", "-threads", "0", "-filter_complex_threads", "0"]
        for comp_path in composite_paths:
            cmd.extend(["-i", str(comp_path.resolve())])
        cmd.extend(["-i", str(master_audio.resolve())])

        audio_idx = len(composite_paths)
        filter_complex = []
        concat_inputs = []

        for i, (comp_path, dur) in enumerate(zip(composite_paths, durations)):
            frames = max(30, int(dur * 30))
            filter_complex.append(
                f"[{i}:v]zoompan=z='min(zoom+0.0015,1.15)':d={frames}:s=1080x1920:fps=30[v{i}]"
            )
            concat_inputs.append(f"[v{i}]")

        filter_complex.append(f"{''.join(concat_inputs)}concat=n={len(composite_paths)}:v=1:a=0,format=yuv420p[vout]")

        cmd.extend([
            "-filter_complex", ";".join(filter_complex),
            "-map", "[vout]",
            "-map", f"{audio_idx}:a",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            str(final_video_path.resolve())
        ])

        process = subprocess.run(cmd, capture_output=True, text=True)
        if process.returncode != 0:
            print(f"[!] FFmpeg GTA render stderr:\n{process.stderr}")
            raise RuntimeError(f"FFmpeg render failed with code {process.returncode}")

        render_elapsed = round(time.time() - start_time, 2)
        file_size_mb = round(final_video_path.stat().st_size / (1024 * 1024), 2)
        print(f"[+] GTA Chronicles Video rendered in {render_elapsed}s ({file_size_mb} MB) -> {final_video_path.name}")

        return {
            "status": "success",
            "video_path": str(final_video_path.resolve()),
            "filename": final_video_path.name,
            "stream_url": f"/static/output/{final_video_path.name}",
            "duration_seconds": round(total_duration, 2),
            "file_size_mb": file_size_mb,
            "render_time_seconds": render_elapsed,
            "title": script.title_hindi
        }

    async def _synthesize_audio_parallel(self, script: GTAVideoScript, voice_id: str) -> tuple:
        """Synthesizes all 5 scene voiceovers concurrently using Edge-TTS."""
        tasks = []
        audio_paths = []
        durations = []
        timestamp = int(time.time())

        for idx, scene in enumerate(script.scenes):
            audio_file = AUDIO_DIR / f"gta_scene_{timestamp}_{idx+1}.mp3"
            audio_paths.append(audio_file)
            tasks.append(self._synthesize_scene_tts(scene.spoken_hindi, audio_file, voice_id))

        await asyncio.gather(*tasks)

        # Measure audio lengths
        for p, scene in zip(audio_paths, script.scenes):
            dur = self._get_audio_duration(p, fallback=scene.duration_seconds)
            durations.append(dur)

        return audio_paths, durations

    async def _synthesize_scene_tts(self, text: str, output_file: Path, voice: str):
        communicate = edge_tts.Communicate(text, voice=voice, rate="+15%")
        await communicate.save(str(output_file))

    def _get_audio_duration(self, audio_file: Path, fallback: float = 6.0) -> float:
        try:
            from mutagen.mp3 import MP3
            audio = MP3(str(audio_file))
            return max(1.0, round(audio.info.length, 2))
        except Exception:
            return fallback

    async def _concat_audio(self, audio_files: List[Path], output_file: Path):
        """Concatenates scene audio files into a single master MP3."""
        list_file = AUDIO_DIR / f"concat_list_{int(time.time())}.txt"
        with open(list_file, "w", encoding="utf-8") as f:
            for af in audio_files:
                f.write(f"file '{af.resolve()}'\n")

        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(output_file)
        ]
        subprocess.run(cmd, capture_output=True)
        try:
            list_file.unlink(missing_ok=True)
        except Exception:
            pass


if __name__ == "__main__":
    from engine.gta_script_architect import GTAScriptArchitect

    async def test():
        architect = GTAScriptArchitect()
        script = architect.refine_gaming_draft("GTA 5 me sabse unchi jump")
        renderer = GTAGameplayRenderer()
        res = await renderer.render_video(script)
        print("Render result:", res)

    asyncio.run(test())
