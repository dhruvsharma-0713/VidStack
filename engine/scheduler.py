import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from engine.db import get_channel, get_due_scheduled_videos, mark_video_published
from engine.youtube_uploader import upload_short
from engine.instagram_publisher import publish_reel


async def check_and_publish_scheduled_videos() -> List[Dict[str, Any]]:
    """Scans SQLite database for mature scheduled videos and executes automated publishing."""
    due_videos = get_due_scheduled_videos()
    if not due_videos:
        return []

    published_items = []
    now_utc_str = datetime.now(timezone.utc).isoformat()

    print(f"\n[SCHEDULER {datetime.now().strftime('%H:%M:%S')}] Found {len(due_videos)} due scheduled video(s). Executing auto-dispatch...")

    for vid in due_videos:
        video_id = vid["id"]
        slug = vid["channel_slug"]
        title = vid.get("title") or f"{slug.capitalize()} Video"
        video_path = vid.get("video_path")

        if not video_path or not Path(video_path).exists():
            print(f"[!] [SCHEDULER] Video file not found for ID #{video_id}: {video_path}")
            continue

        channel = get_channel(slug)
        if not channel:
            print(f"[!] [SCHEDULER] Channel profile not found for slug '{slug}'")
            continue

        yt_url = vid.get("youtube_url")
        ig_url = vid.get("reel_url")

        # 1. Dispatch to YouTube Shorts if connected
        if channel.get("youtube_token"):
            try:
                print(f"[+] [SCHEDULER] Uploading #{video_id} to YouTube Shorts for '{slug}'...")
                yt_res = upload_short(
                    channel_slug=slug,
                    video_path=video_path,
                    title=title,
                    description=f"{title}\n\n#Shorts #{slug.capitalize()} #VidStackAI",
                    tags=["#Shorts", f"#{slug.capitalize()}"]
                )
                yt_url = yt_res.get("shorts_url")
                print(f"[OK] [SCHEDULER] YouTube Short Published: {yt_url}")
            except Exception as e:
                print(f"[!] [SCHEDULER] YouTube upload failed for #{video_id}: {e}")

        # 2. Dispatch to Instagram Reels if connected
        if channel.get("instagram_token"):
            try:
                print(f"[+] [SCHEDULER] Publishing #{video_id} to Instagram Reels for '{slug}'...")
                ig_res = publish_reel(
                    channel_slug=slug,
                    video_path=video_path,
                    caption=title
                )
                ig_url = ig_res.get("reel_url")
                print(f"[OK] [SCHEDULER] Instagram Reel Published: {ig_url}")
            except Exception as e:
                print(f"[!] [SCHEDULER] Instagram publish failed for #{video_id}: {e}")

        # 3. Mark Record as Published in SQLite
        mark_video_published(
            video_id=video_id,
            published_at=now_utc_str,
            youtube_url=yt_url,
            reel_url=ig_url
        )

        published_items.append({
            "video_id": video_id,
            "channel_slug": slug,
            "title": title,
            "published_at": now_utc_str,
            "youtube_url": yt_url,
            "reel_url": ig_url
        })
        print(f"[OK] [SCHEDULER] Video #{video_id} successfully marked as 'published' in database.")

    return published_items


class AutonomousScheduler:
    """Manages the background async polling loop for automated video publishing."""

    def __init__(self, interval_seconds: int = 5):
        self.interval_seconds = interval_seconds
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def _loop(self):
        print(f"[+] Autonomous Scheduler loop started (Polling every {self.interval_seconds}s)")
        while self._running:
            try:
                await check_and_publish_scheduled_videos()
            except Exception as e:
                print(f"[!] Error in scheduler loop iteration: {e}")
            await asyncio.sleep(self.interval_seconds)

    def start(self):
        """Starts the scheduler background task."""
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._loop())

    def stop(self):
        """Stops the scheduler background task gracefully."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            print("[-] Autonomous Scheduler loop stopped.")

    async def tick(self) -> List[Dict[str, Any]]:
        """Executes a single on-demand check for scheduled videos."""
        return await check_and_publish_scheduled_videos()


# Global scheduler instance
scheduler = AutonomousScheduler(interval_seconds=5)


if __name__ == "__main__":
    async def main():
        print("Testing scheduler tick...")
        results = await check_and_publish_scheduled_videos()
        print(f"Processed {len(results)} items.")

    asyncio.run(main())
