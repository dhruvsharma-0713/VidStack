import argparse
import asyncio
import sys
import time
from pathlib import Path
from typing import Optional

from engine.audio_synthesizer import GitaAudioSynthesizer
from engine.gita_loader import GitaDatasetManager
from engine.script_architect import GitaScriptArchitect
from engine.subtitle_burner import SubtitleBurner
from engine.video_renderer import GitaVideoRenderer
from engine.visual_engine import LittleKrishnaVisualManager


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


async def run(
    draft: Optional[str] = None,
    chapter: int = 2,
    verse: int = 47,
    output_dir: Optional[Path] = None
) -> Path:
    start_total = time.perf_counter()
    out_dir = output_dir or (Path(__file__).parent / "engine" / "output")
    out_dir.mkdir(parents=True, exist_ok=True)

    if draft:
        print(f"\n[+] Starting Geetaverse Pipeline (Operator Draft: \"{draft}\")")
    else:
        print(f"\n[+] Starting Geetaverse Pipeline (Adhyay {chapter}, Shlok {verse})")

    architect = GitaScriptArchitect()

    # 1. NLP Script Processing
    t0 = time.perf_counter()
    if draft:
        script = architect.refine_operator_draft(draft)
        t_script = time.perf_counter() - t0
        print(f"  [1/4] Script generated from operator draft ({len(script.scenes)} scenes, ~{script.total_estimated_duration}s) in {t_script:.2f}s")
    else:
        dataset_mgr = GitaDatasetManager()
        gita_verse = dataset_mgr.get_verse(chapter=chapter, verse=verse)
        script = architect.generate_script(gita_verse)
        t_script = time.perf_counter() - t0
        print(f"  [1/4] Script generated from verse ({len(script.scenes)} scenes, ~{script.total_estimated_duration}s) in {t_script:.2f}s")

    # 2. Audio Narration Synthesis
    t0 = time.perf_counter()
    audio_synthesizer = GitaAudioSynthesizer(output_dir=out_dir / "audio")
    audio_meta = await audio_synthesizer.generate_voiceover(script)
    t_audio = time.perf_counter() - t0
    print(f"  [2/4] Audio synthesized ({audio_meta.total_audio_duration}s) in {t_audio:.2f}s")

    # 3. Visual Backgrounds & Subtitles
    t0 = time.perf_counter()
    visual_mgr = LittleKrishnaVisualManager()
    bg_paths = visual_mgr.prepare_all_scenes()

    burner = SubtitleBurner(output_dir=out_dir / "subtitles")
    sub_paths = burner.generate_all_subtitles(script)
    t_visuals = time.perf_counter() - t0
    print(f"  [3/4] Visuals and subtitles prepared in {t_visuals:.2f}s")

    # 4. Assembly & Direct Single-Pass FFmpeg Render
    t0 = time.perf_counter()
    renderer = GitaVideoRenderer(output_dir=out_dir)
    result = renderer.assemble_video(script, audio_meta, bg_paths, sub_paths)
    t_render = time.perf_counter() - t0
    print(f"  [4/4] FFmpeg video rendered in {t_render:.2f}s")

    total_elapsed = time.perf_counter() - start_total
    file_size_mb = result.file_size_bytes / (1024 * 1024)
    print(f"\n[+] Pipeline Completed Successfully in {total_elapsed:.2f}s")
    print(f"    Output: {result.video_path} ({file_size_mb:.2f} MB, {result.duration_seconds}s)")
    print(f"    Breakdown: Script {t_script:.2f}s | Audio {t_audio:.2f}s | Visuals {t_visuals:.2f}s | FFmpeg Render {t_render:.2f}s")

    return Path(result.video_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Geetaverse AI Video Generation CLI")
    parser.add_argument("--draft", type=str, default=None, help="Freeform operator notes or topic (e.g. 'gusse aur overthinking se kaise bache')")
    parser.add_argument("--chapter", type=int, default=2, help="Bhagavad Gita Chapter (1-18)")
    parser.add_argument("--verse", type=int, default=47, help="Bhagavad Gita Verse / Shlok number")
    parser.add_argument("--output", type=str, default=None, help="Custom output directory")

    args = parser.parse_args()
    out_dir = Path(args.output).resolve() if args.output else None

    try:
        asyncio.run(run(draft=args.draft, chapter=args.chapter, verse=args.verse, output_dir=out_dir))
    except KeyboardInterrupt:
        print("\n[!] Pipeline interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[x] Pipeline failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
