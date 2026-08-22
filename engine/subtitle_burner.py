from pathlib import Path
from typing import Optional
from PIL import Image, ImageDraw, ImageFont

try:
    from engine.gita_loader import GitaDatasetManager
    from engine.script_architect import GitaScriptArchitect, GitaVideoScript, ScriptScene
except ImportError:
    from gita_loader import GitaDatasetManager
    from script_architect import GitaScriptArchitect, GitaVideoScript, ScriptScene


class SubtitleBurner:
    """Renders high-contrast Devanagari Hindi text overlays for vertical video (1080x1920)."""

    WIDTH = 1080
    HEIGHT = 1920

    def __init__(self, output_dir: Optional[Path] = None):
        import os
        if os.getenv("VERCEL"):
            self.output_dir = output_dir or Path("/tmp/engine_output/subtitles")
        else:
            self.output_dir = output_dir or Path(__file__).resolve().parent / "output" / "subtitles"
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass
        self.font_path = self._locate_font()

    def _locate_font(self) -> str:
        candidates = [
            "C:/Windows/Fonts/Nirmala.ttc",
            "C:/Windows/Fonts/NirmalaB.ttf",
            "C:/Windows/Fonts/APARAJB.TTF",
            "C:/Windows/Fonts/mangal.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        ]
        for font in candidates:
            if Path(font).exists():
                return font
        return "arial.ttf"

    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
        words = text.split()
        lines: list[str] = []
        current: list[str] = []

        for word in words:
            test_line = " ".join(current + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if (bbox[2] - bbox[0]) <= max_width:
                current.append(word)
            else:
                if current:
                    lines.append(" ".join(current))
                current = [word]

        if current:
            lines.append(" ".join(current))

        return lines

    def render_scene_subtitle(self, scene: ScriptScene, output_path: Path, header_text: str = "") -> str:
        overlay = Image.new("RGBA", (self.WIDTH, self.HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")

        font_subtitle = ImageFont.truetype(self.font_path, 52)
        font_header = ImageFont.truetype(self.font_path, 34)

        if header_text:
            badge_text = f"✨ {header_text} ✨"
            bbox_h = draw.textbbox((0, 0), badge_text, font=font_header)
            bw = (bbox_h[2] - bbox_h[0]) + 60
            bh = (bbox_h[3] - bbox_h[1]) + 24
            bx = (self.WIDTH - bw) // 2
            by = 160
            draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=20, fill=(0, 0, 0, 160), outline=(255, 215, 0, 200), width=2)
            draw.text(((self.WIDTH - (bbox_h[2] - bbox_h[0])) // 2, by + 10), badge_text, font=font_header, fill=(255, 235, 140, 255))

        lines = self._wrap_text(scene.spoken_hindi, font_subtitle, 880, draw)
        line_height = 72
        box_width = 960
        box_height = (len(lines) * line_height) + 60
        box_x0 = (self.WIDTH - box_width) // 2
        box_y0 = 1450 - (box_height // 2)

        draw.rounded_rectangle(
            [box_x0, box_y0, box_x0 + box_width, box_y0 + box_height],
            radius=24,
            fill=(10, 10, 20, 200),
            outline=(255, 200, 50, 220),
            width=3
        )

        for idx, line in enumerate(lines):
            line_bbox = draw.textbbox((0, 0), line, font=font_subtitle)
            tx = (self.WIDTH - (line_bbox[2] - line_bbox[0])) // 2
            ty = box_y0 + 30 + (idx * line_height)
            draw.text(
                (tx, ty),
                line,
                font=font_subtitle,
                fill=(255, 255, 255, 255) if idx % 2 == 0 else (255, 235, 80, 255),
                stroke_width=4,
                stroke_fill=(0, 0, 0, 255)
            )

        overlay.save(str(output_path), "PNG")
        return str(output_path)

    def generate_all_subtitles(self, script: GitaVideoScript) -> list[str]:
        if script.chapter > 0 and script.verse > 0:
            header = f"गीता ज्ञान • अध्याय {script.chapter} श्लोक {script.verse}"
        else:
            header = "गीता ज्ञान • दिव्य मार्गदर्शन"
        subtitle_paths: list[str] = []

        for scene in script.scenes:
            out_file = self.output_dir / f"sub_scene_{scene.scene_number}.png"
            self.render_scene_subtitle(scene, out_file, header_text=header)
            subtitle_paths.append(str(out_file))

        return subtitle_paths


if __name__ == "__main__":
    loader = GitaDatasetManager()
    verse = loader.get_verse(chapter=2, verse=47)
    architect = GitaScriptArchitect()
    script = architect.generate_script(verse)

    burner = SubtitleBurner()
    sub_paths = burner.generate_all_subtitles(script)
    print("Subtitle overlay PNGs generated:")
    for sp in sub_paths:
        print(f" - {sp}")

