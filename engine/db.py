import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

# Database path in workspace root
DB_PATH = Path(__file__).parent.parent / "vidstack.db"


def get_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite database with dict row factory."""
    conn = sqlite3.connect(str(DB_PATH.resolve()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes the database tables and seeds default channel profiles."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS channels (
            slug TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            niche TEXT NOT NULL,
            passkey TEXT NOT NULL,
            youtube_token TEXT,
            instagram_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_slug TEXT NOT NULL,
            title TEXT,
            draft_text TEXT,
            script_json TEXT,
            video_path TEXT,
            duration REAL,
            status TEXT DEFAULT 'rendered',
            scheduled_time TEXT,
            published_at TEXT,
            youtube_url TEXT,
            reel_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_slug) REFERENCES channels(slug)
        );
    """)

    # Lightweight column migrations for existing SQLite databases
    try:
        cursor.execute("ALTER TABLE videos ADD COLUMN published_at TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE videos ADD COLUMN youtube_url TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE videos ADD COLUMN reel_url TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE channels ADD COLUMN engine_type TEXT DEFAULT 'gameplay_broll';")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE channels ADD COLUMN voice_id TEXT DEFAULT 'hi-IN-MadhurNeural';")
    except Exception:
        pass

    # Seed default channels
    default_channels = [
        ("geetaverse", "Geetaverse Hindi", "Spiritual / Devotional", "radhe108", None, None),
        ("gtachronicles", "GTA Chronicles", "Gaming / Stunts", "gta5pro", None, None)
    ]

    cursor.executemany("""
        INSERT OR IGNORE INTO channels (slug, name, niche, passkey, youtube_token, instagram_token)
        VALUES (?, ?, ?, ?, ?, ?);
    """, default_channels)

    # Ensure engine types for seed channels
    cursor.execute("UPDATE channels SET engine_type = 'gita_vedic' WHERE slug = 'geetaverse' AND (engine_type IS NULL OR engine_type = 'gameplay_broll');")
    cursor.execute("UPDATE channels SET engine_type = 'gameplay_broll' WHERE slug = 'gtachronicles' AND engine_type IS NULL;")

    conn.commit()
    conn.close()
    print(f"[+] SQLite database initialized at {DB_PATH.resolve()}")


def create_channel(
    slug: str,
    name: str,
    niche: str,
    passkey: str,
    engine_type: str = "gameplay_broll",
    voice_id: str = "hi-IN-MadhurNeural"
) -> bool:
    """Provisions a new dynamic channel portal in vidstack.db."""
    clean_slug = slug.lower().strip()
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO channels (slug, name, niche, passkey, engine_type, voice_id)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (clean_slug, name.strip(), niche.strip(), passkey.strip(), engine_type.strip(), voice_id.strip()))
        conn.commit()
        success = cursor.rowcount > 0
    except Exception as e:
        print(f"[!] Error provisioning channel '{slug}': {e}")
        success = False
    finally:
        conn.close()
    return success


def get_channel(slug: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single channel profile by slug."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM channels WHERE slug = ?;", (slug.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def list_channels() -> List[Dict[str, Any]]:
    """Retrieves all registered channels."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM channels ORDER BY created_at ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def verify_channel_passkey(slug: str, passkey: str) -> bool:
    """Verifies that the provided passkey matches the channel's passkey."""
    ch = get_channel(slug)
    if not ch:
        return False
    return ch["passkey"] == passkey.strip()


def save_video_record(
    channel_slug: str,
    title: str,
    draft_text: str,
    script_json: str,
    video_path: str,
    duration: float,
    status: str = "rendered",
    scheduled_time: Optional[str] = None
) -> int:
    """Saves a rendered or drafted video record and returns the generated video ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO videos (channel_slug, title, draft_text, script_json, video_path, duration, status, scheduled_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        channel_slug.lower().strip(),
        title,
        draft_text,
        script_json if isinstance(script_json, str) else json.dumps(script_json, ensure_ascii=False),
        video_path,
        duration,
        status,
        scheduled_time
    ))
    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return video_id


def update_video_status(video_id: int, status: str, scheduled_time: Optional[str] = None) -> bool:
    """Updates the status and optional scheduled time of an existing video record."""
    conn = get_connection()
    cursor = conn.cursor()
    if scheduled_time:
        cursor.execute("""
            UPDATE videos SET status = ?, scheduled_time = ? WHERE id = ?;
        """, (status, scheduled_time, video_id))
    else:
        cursor.execute("""
            UPDATE videos SET status = ? WHERE id = ?;
        """, (status, video_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0


def get_channel_videos(channel_slug: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves all videos associated with a specific channel slug."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM videos WHERE channel_slug = ? ORDER BY id DESC LIMIT ?;
    """, (channel_slug.lower().strip(), limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_videos(limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves all video records across all channels for superuser monitoring."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT v.*, c.name as channel_name 
        FROM videos v 
        LEFT JOIN channels c ON v.channel_slug = c.slug 
        ORDER BY v.id DESC LIMIT ?;
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_channel_youtube_token(channel_slug: str, token_str: str) -> bool:
    """Updates the OAuth token for a given channel in the channels table."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE channels SET youtube_token = ? WHERE slug = ?;
    """, (token_str, channel_slug.lower().strip()))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0


def update_channel_instagram_token(channel_slug: str, token_str: str) -> bool:
    """Updates the Instagram Meta token for a given channel in the channels table."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE channels SET instagram_token = ? WHERE slug = ?;
    """, (token_str, channel_slug.lower().strip()))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0


def get_video_by_id(video_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single video record by its primary key ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos WHERE id = ?;", (video_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_due_scheduled_videos(current_time_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all videos with status 'scheduled' whose scheduled_time <= current_time."""
    from datetime import datetime, timezone
    now_iso = current_time_iso or datetime.now(timezone.utc).isoformat()
    now_local = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    now_local_short = datetime.now().strftime("%Y-%m-%dT%H:%M")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM videos 
        WHERE status = 'scheduled' 
        AND scheduled_time IS NOT NULL 
        AND (scheduled_time <= ? OR scheduled_time <= ? OR scheduled_time <= ?)
        ORDER BY scheduled_time ASC;
    """, (now_iso, now_local, now_local_short))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_video_published(
    video_id: int,
    published_at: str,
    youtube_url: Optional[str] = None,
    reel_url: Optional[str] = None
) -> bool:
    """Updates a video record to 'published' with timestamp and live media URLs."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE videos 
        SET status = 'published', published_at = ?, youtube_url = COALESCE(?, youtube_url), reel_url = COALESCE(?, reel_url)
        WHERE id = ?;
    """, (published_at, youtube_url, reel_url, video_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0


if __name__ == "__main__":
    init_db()
