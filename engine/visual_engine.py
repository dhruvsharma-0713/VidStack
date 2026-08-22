import math
import random
from pathlib import Path
from typing import Optional
from PIL import Image, ImageDraw


class LittleKrishnaVisualManager:
    """Generates and caches 2D devotional scene background cards (1080x1920 9:16)."""

    WIDTH = 1080
    HEIGHT = 1920

    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path(__file__).parent / "data" / "visual_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _create_gradient(self, top_rgb: tuple[int, int, int], bottom_rgb: tuple[int, int, int]) -> Image.Image:
        top = Image.new("RGBA", (self.WIDTH, self.HEIGHT), top_rgb)
        bottom = Image.new("RGBA", (self.WIDTH, self.HEIGHT), bottom_rgb)
        mask = Image.new("L", (self.WIDTH, self.HEIGHT))
        for y in range(self.HEIGHT):
            mask.paste(int(255 * (y / self.HEIGHT)), (0, y, self.WIDTH, y + 1))
        return Image.composite(bottom, top, mask)

    def _draw_halo(self, draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, rgb: tuple[int, int, int]) -> None:
        for r in range(radius, radius - 120, -15):
            alpha = max(10, int(40 * (1 - (radius - r) / 120)))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*rgb, alpha), width=6)

    def _draw_sparkles(self, draw: ImageDraw.ImageDraw, count: int = 40, seed: int = 42) -> None:
        rng = random.Random(seed)
        for _ in range(count):
            x = rng.randint(50, self.WIDTH - 50)
            y = rng.randint(100, self.HEIGHT - 400)
            sz = rng.randint(3, 8)
            alpha = rng.randint(120, 240)
            draw.ellipse([x - sz, y - sz, x + sz, y + sz], fill=(255, 235, 150, alpha))
            draw.line([x - sz * 2, y, x + sz * 2, y], fill=(255, 245, 200, alpha // 2), width=1)
            draw.line([x, y - sz * 2, x, y + sz * 2], fill=(255, 245, 200, alpha // 2), width=1)

    def generate_scene_1(self, output_path: Path) -> None:
        img = self._create_gradient((20, 30, 70), (10, 70, 95))
        draw = ImageDraw.Draw(img, "RGBA")
        cx, cy = self.WIDTH // 2, 700

        draw.ellipse([cx - 180, cy - 180, cx + 180, cy + 180], fill=(255, 250, 220, 220))
        self._draw_halo(draw, cx, cy, 360, (255, 220, 120))

        draw.ellipse([-100, -100, self.WIDTH + 100, 450], fill=(12, 38, 32, 230))
        draw.polygon([(0, 1920), (0, 1300), (350, 1400), (self.WIDTH, 1250), (self.WIDTH, 1920)], fill=(8, 25, 22, 255))

        draw.ellipse([cx - 40, 450, cx + 40, 560], fill=(0, 160, 180, 200), outline=(255, 215, 0, 255), width=3)
        draw.ellipse([cx - 20, 475, cx + 20, 530], fill=(30, 40, 140, 230))

        draw.rounded_rectangle([cx - 220, 920, cx + 220, 945], radius=10, fill=(230, 180, 60, 240), outline=(255, 240, 150, 255), width=2)
        for fx in range(-150, 180, 50):
            draw.ellipse([cx + fx - 5, 930, cx + fx + 5, 940], fill=(80, 50, 10, 255))

        self._draw_sparkles(draw, count=45, seed=101)
        img.convert("RGB").save(str(output_path), "PNG", quality=95)

    def generate_scene_2(self, output_path: Path) -> None:
        img = self._create_gradient((240, 120, 30), (70, 20, 60))
        draw = ImageDraw.Draw(img, "RGBA")
        cx, cy = self.WIDTH // 2, 750

        draw.ellipse([cx - 220, cy - 220, cx + 220, cy + 220], fill=(255, 245, 180, 240))
        self._draw_halo(draw, cx, cy, 450, (255, 200, 50))

        for deg in range(0, 360, 18):
            rad = math.radians(deg)
            draw.line([cx, cy, cx + int(600 * math.cos(rad)), cy + int(600 * math.sin(rad))], fill=(255, 220, 100, 50), width=4)

        draw.ellipse([cx - 300, 1200, cx + 300, 1450], fill=(220, 80, 120, 180))
        draw.ellipse([cx - 200, 1230, cx + 200, 1420], fill=(255, 140, 170, 220))

        self._draw_sparkles(draw, count=50, seed=102)
        img.convert("RGB").save(str(output_path), "PNG", quality=95)

    def generate_scene_3(self, output_path: Path) -> None:
        img = self._create_gradient((45, 25, 65), (150, 85, 45))
        draw = ImageDraw.Draw(img, "RGBA")
        cx, cy = self.WIDTH // 2, 700

        draw.ellipse([cx - 160, cy - 160, cx + 160, cy + 160], fill=(255, 190, 80, 180))
        self._draw_halo(draw, cx, cy, 320, (255, 160, 60))

        draw.ellipse([cx - 130, cy + 100, cx + 130, cy + 320], fill=(160, 80, 30, 240), outline=(255, 215, 120, 255), width=4)
        draw.rectangle([cx - 80, cy + 80, cx + 80, cy + 120], fill=(190, 100, 40, 240), outline=(255, 215, 120, 255), width=3)

        for y in range(1300, 1700, 60):
            draw.arc([100, y, self.WIDTH - 100, y + 80], start=0, end=180, fill=(255, 220, 140, 90), width=3)

        self._draw_sparkles(draw, count=35, seed=103)
        img.convert("RGB").save(str(output_path), "PNG", quality=95)

    def generate_scene_4(self, output_path: Path) -> None:
        img = self._create_gradient((25, 75, 120), (220, 150, 40))
        draw = ImageDraw.Draw(img, "RGBA")
        cx, cy = self.WIDTH // 2, 680

        draw.ellipse([cx - 200, cy - 200, cx + 200, cy + 200], fill=(255, 235, 170, 220))
        self._draw_halo(draw, cx, cy, 380, (255, 210, 80))

        draw.ellipse([cx - 150, cy + 80, cx + 150, cy + 340], fill=(140, 70, 30, 240), outline=(255, 230, 120, 255), width=4)
        draw.ellipse([cx - 110, cy + 60, cx + 110, cy + 140], fill=(255, 255, 240, 255))
        draw.ellipse([cx - 60, cy + 110, cx + 10, cy + 200], fill=(255, 255, 240, 240))

        draw.ellipse([cx - 35, 380, cx + 35, 480], fill=(0, 170, 180, 230), outline=(255, 215, 0, 255), width=3)
        draw.ellipse([cx - 18, 405, cx + 18, 455], fill=(40, 30, 150, 240))

        self._draw_sparkles(draw, count=50, seed=104)
        img.convert("RGB").save(str(output_path), "PNG", quality=95)

    def generate_scene_5(self, output_path: Path) -> None:
        img = self._create_gradient((110, 25, 40), (230, 160, 30))
        draw = ImageDraw.Draw(img, "RGBA")
        cx, cy = self.WIDTH // 2, 700

        draw.ellipse([cx - 240, cy - 240, cx + 240, cy + 240], fill=(255, 245, 190, 240))
        self._draw_halo(draw, cx, cy, 460, (255, 220, 70))

        draw.arc([150, 200, self.WIDTH - 150, 1200], start=180, end=0, fill=(255, 215, 100, 180), width=8)
        draw.arc([200, 260, self.WIDTH - 200, 1140], start=180, end=0, fill=(255, 235, 150, 120), width=4)
        draw.rounded_rectangle([cx - 200, 950, cx + 200, 975], radius=10, fill=(255, 220, 90, 240), outline=(255, 255, 200, 255), width=2)

        self._draw_sparkles(draw, count=60, seed=105)
        img.convert("RGB").save(str(output_path), "PNG", quality=95)

    def prepare_all_scenes(self) -> list[str]:
        scene_paths: list[str] = []
        generators = [
            self.generate_scene_1,
            self.generate_scene_2,
            self.generate_scene_3,
            self.generate_scene_4,
            self.generate_scene_5
        ]

        for i, gen in enumerate(generators, 1):
            path = self.cache_dir / f"scene_{i}.png"
            if not path.exists():
                gen(path)
            scene_paths.append(str(path))

        return scene_paths


if __name__ == "__main__":
    manager = LittleKrishnaVisualManager()
    paths = manager.prepare_all_scenes()
    print("Visual assets prepared:")
    for p in paths:
        print(f" - {p}")
