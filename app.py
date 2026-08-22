import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from engine.auth import (
    SUPERUSER_PASSKEY,
    authenticate,
    clear_auth_cookie,
    create_session_token,
    is_authenticated,
    set_auth_cookie,
)
from engine.db import (
    create_channel,
    get_all_videos,
    get_channel,
    get_channel_videos,
    get_video_by_id,
    init_db,
    list_channels,
    save_video_record,
    update_video_status,
)
from engine.youtube_auth import (
    exchange_code_for_tokens,
    get_authorization_url,
    get_channel_credentials,
)
from engine.youtube_uploader import upload_short
from engine.instagram_publisher import (
    exchange_meta_code,
    get_channel_instagram_credentials,
    get_meta_auth_url,
    publish_reel,
)
from engine.script_architect import GitaScriptArchitect, GitaVideoScript, ScriptScene
from engine.gta_script_architect import GTAScriptArchitect, GTAVideoScript, GTAScriptScene
from engine.audio_synthesizer import GitaAudioSynthesizer
from engine.visual_engine import LittleKrishnaVisualManager
from engine.gta_visual_engine import GTAGameplayRenderer
from engine.subtitle_burner import SubtitleBurner
from engine.video_renderer import GitaVideoRenderer
from engine.gita_loader import GitaDatasetManager

from contextlib import asynccontextmanager
from engine.scheduler import scheduler

# Ensure SQLite database is initialized with safe cold-start handling
try:
    init_db()
except Exception as e:
    print(f"[!] DB init warning: {e}")

# Base and template directories resolution
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = Path("/tmp/engine_output") if os.getenv("VERCEL") else BASE_DIR / "engine" / "output"

try:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

try:
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan Context Manager: Starts background scheduler on startup and shuts down gracefully."""
    # Only run background loop if not in short-lived serverless lambda environment
    if not os.getenv("VERCEL"):
        scheduler.start()
    yield
    if not os.getenv("VERCEL"):
        scheduler.stop()


# FastAPI Application
app = FastAPI(
    title="VidStack AI Studio",
    description="Multi-tenant vertical video generation pipeline and operator portal",
    version="2.5.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static video output directory
app.mount("/static/output", StaticFiles(directory=str(OUTPUT_DIR), check_dir=False), name="output")

# Jinja2 Templates Engine (resolves to absolute templates directory)
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    passkey: str = Field(..., description="Security passkey for authentication")


class DraftRequest(BaseModel):
    draft_text: str = Field(..., description="Raw operator notes or topic prompt")


class ScenePayload(BaseModel):
    scene_number: int
    duration_seconds: int = 8
    spoken_hindi: str
    visual_description: Optional[str] = ""
    bgm_mood: Optional[str] = "peaceful"


class GenerateVideoRequest(BaseModel):
    draft_text: Optional[str] = None
    scenes: Optional[List[ScenePayload]] = None
    chapter: Optional[int] = None
    verse: Optional[int] = None


class ScheduleRequest(BaseModel):
    video_id: Optional[int] = None
    scheduled_time: str = Field(..., description="ISO datetime string for scheduled publishing")
    platforms: Optional[List[str]] = Field(default=["youtube", "instagram"])


# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------
def scan_output_videos() -> List[Dict[str, Any]]:
    """Scans physical MP4 video files in output directory."""
    if not OUTPUT_DIR.exists():
        return []

    mp4_files = [f for f in OUTPUT_DIR.glob("*.mp4") if f.is_file()]
    mp4_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)

    results = []
    for f in mp4_files:
        size_mb = round(f.stat().st_size / (1024 * 1024), 2)
        dur = 38.0
        try:
            from mutagen.mp4 import MP4
            dur = round(MP4(str(f)).info.length, 2)
        except Exception:
            pass

        results.append({
            "filename": f.name,
            "stream_url": f"/static/output/{f.name}",
            "duration_seconds": dur,
            "file_size_mb": size_mb,
            "file_size_bytes": f.stat().st_size,
            "modified_time": f.stat().st_mtime
        })
    return results


def format_db_videos(videos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enriches database video records with accessible stream URLs and formatting."""
    formatted = []
    for v in videos:
        item = dict(v)
        if item.get("video_path"):
            filename = Path(item["video_path"]).name
            item["stream_url"] = f"/static/output/{filename}"
            item["filename"] = filename
        else:
            item["stream_url"] = ""
            item["filename"] = ""
        formatted.append(item)
    return formatted


def generate_gta_narrative(draft_text: str) -> GitaVideoScript:
    """Generates a 5-scene high-retention GTA story script."""
    cleaned = draft_text.strip() if draft_text else "Union Depository Secret Subway Escape"
    return GitaVideoScript(
        chapter=0,
        verse=0,
        title_hindi=f"GTA 5 Secret: {cleaned[:40]}",
        youtube_tags=["#GTA5", "#GTAV", "#GamingShorts", "#GTAChronicles", "#Gaming"],
        total_estimated_duration=45,
        scenes=[
            ScriptScene(
                scene_number=1,
                duration_seconds=8,
                spoken_hindi=f"Did you know about this secret in GTA V? Everyone knows about {cleaned[:30]}, but almost nobody uses this trick.",
                visual_description="GTA V cinematic view of Los Santos skyline with fast cut to gameplay.",
                bgm_mood="high_energy_intro"
            ),
            ScriptScene(
                scene_number=2,
                duration_seconds=9,
                spoken_hindi="When the 5-star police chase begins, heading straight into the underground subway tunnels instantly breaks line of sight.",
                visual_description="Michael in a customized Zentorno roaring down the highway with police sirens flashing.",
                bgm_mood="intense_chase"
            ),
            ScriptScene(
                scene_number=3,
                duration_seconds=10,
                spoken_hindi="The police choppers lose tracking as soon as you enter the storm drain sector beneath Pillbox Hill.",
                visual_description="Gameplay stunt drifting into the Los Santos River storm drain at 150 MPH.",
                bgm_mood="action_climax"
            ),
            ScriptScene(
                scene_number=4,
                duration_seconds=10,
                spoken_hindi="Within 30 seconds, all 5 stars disappear and you walk away with the full score untouched.",
                visual_description="Trevor stepping out of the vehicle with sunglasses, counting a stack of cash.",
                bgm_mood="triumphant_synth"
            ),
            ScriptScene(
                scene_number=5,
                duration_seconds=8,
                spoken_hindi="Drop a like if you love GTA V, and subscribe for more legendary Los Santos heist secrets!",
                visual_description="GTA Chronicles end screen with like and subscribe animation.",
                bgm_mood="energetic_outro"
            )
        ]
    )


# ---------------------------------------------------------
# Authentication & API Endpoints
# ---------------------------------------------------------
@app.post("/api/{channel_slug}/login")
async def login_api(channel_slug: str, payload: LoginRequest, response: Response):
    """Verifies channel or superuser passkey and establishes an authenticated session."""
    slug = channel_slug.lower().strip()

    if not authenticate(slug, payload.passkey):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security passkey"
        )

    token = create_session_token(slug)
    set_auth_cookie(response, slug, token)

    return {
        "success": True,
        "channel_slug": slug,
        "message": f"Successfully authenticated for '{slug}'"
    }


@app.post("/api/{channel_slug}/logout")
async def logout_api(channel_slug: str, response: Response):
    """Terminates session and clears authentication cookies."""
    slug = channel_slug.lower().strip()
    clear_auth_cookie(response, slug)
    return {"success": True, "message": f"Logged out from '{slug}'"}


@app.post("/api/channels/create")
async def create_channel_api(request: Request):
    """Provisions a new dynamic channel portal in SQLite."""
    data = await request.json()
    slug = data.get("slug", "").lower().strip()
    name = data.get("name", "").strip()
    niche = data.get("niche", "").strip()
    passkey = data.get("passkey", "").strip()
    engine_type = data.get("engine_type", "gameplay_broll").strip()
    voice_id = data.get("voice_id", "hi-IN-MadhurNeural").strip()

    if not slug or not name or not passkey:
        raise HTTPException(status_code=400, detail="Slug, name, and passkey are required.")

    existing = get_channel(slug)
    if existing:
        raise HTTPException(status_code=400, detail=f"Channel with slug '{slug}' already exists.")

    success = create_channel(
        slug=slug,
        name=name,
        niche=niche or "Gaming / B-Roll",
        passkey=passkey,
        engine_type=engine_type,
        voice_id=voice_id
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create channel in database.")

    return {
        "success": True,
        "slug": slug,
        "portal_url": f"/{slug}",
        "message": f"Channel '{name}' provisioned successfully!"
    }


@app.post("/api/{channel_slug}/refine")
@app.post("/api/{channel_slug}/refine-draft")
async def refine_draft_api(channel_slug: str, payload: DraftRequest):
    """Refines raw operator draft into 5-scene JSON narrative script based on channel engine type."""
    slug = channel_slug.lower().strip()
    channel = get_channel(slug)
    if not channel and slug not in ["geetaverse", "gtachronicles"]:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_slug}' not found")

    is_gaming = (channel and channel.get("engine_type") == "gameplay_broll") or slug == "gtachronicles"
    if is_gaming:
        architect = GTAScriptArchitect()
        script = architect.refine_gaming_draft(payload.draft_text)
    else:
        architect = GitaScriptArchitect()
        script = architect.refine_operator_draft(payload.draft_text)

    return script.model_dump()


@app.post("/api/{channel_slug}/render")
@app.post("/api/{channel_slug}/generate-video")
async def render_video_api(channel_slug: str, payload: GenerateVideoRequest):
    """Executes the Python video pipeline and saves record in SQLite database."""
    slug = channel_slug.lower().strip()
    channel = get_channel(slug)
    if not channel and slug not in ["geetaverse", "gtachronicles"]:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_slug}' not found")

    ch_name = channel["name"] if channel else slug.capitalize()
    is_gaming = (channel and channel.get("engine_type") == "gameplay_broll") or slug == "gtachronicles"

    if is_gaming:
        # GTA Chronicles / Gameplay Pipeline
        gta_architect = GTAScriptArchitect()
        voice_id = channel.get("voice_id", "hi-IN-MadhurNeural") if channel else "hi-IN-MadhurNeural"

        if payload.scenes and len(payload.scenes) > 0:
            gta_scenes = [
                GTAScriptScene(
                    scene_number=s.scene_number,
                    duration_seconds=s.duration_seconds,
                    spoken_hindi=s.spoken_hindi,
                    visual_description=s.visual_description or "",
                    energy_level="high"
                )
                for s in payload.scenes
            ]
            script = GTAVideoScript(
                title_hindi=payload.draft_text or f"{ch_name} Video",
                youtube_tags=["#GTA5", "#GamingShorts", f"#{slug.capitalize()}"],
                scenes=gta_scenes,
                total_estimated_duration=sum(s.duration_seconds for s in gta_scenes)
            )
        elif payload.draft_text:
            script = gta_architect.refine_gaming_draft(payload.draft_text)
        else:
            script = gta_architect.refine_gaming_draft("GTA 5 me sabse unchi jump")

        gta_renderer = GTAGameplayRenderer(output_dir=OUTPUT_DIR)
        render_result = await gta_renderer.render_video(script, voice_id=voice_id)

        filename = render_result["filename"]
        video_path = render_result["video_path"]
        duration = render_result["duration_seconds"]
        file_size_mb = render_result["file_size_mb"]
        stream_url = render_result["stream_url"]
        title = script.title_hindi
    else:
        # Geetaverse / Vedic Script & Video Pipeline
        architect = GitaScriptArchitect()

        if payload.scenes and len(payload.scenes) > 0:
            script_scenes = [
                ScriptScene(
                    scene_number=s.scene_number,
                    duration_seconds=s.duration_seconds,
                    spoken_hindi=s.spoken_hindi,
                    visual_description=s.visual_description or "",
                    bgm_mood=s.bgm_mood or "peaceful"
                )
                for s in payload.scenes
            ]
            script = GitaVideoScript(
                chapter=payload.chapter or 2,
                verse=payload.verse or 63,
                title_hindi=payload.draft_text or f"{ch_name} Video",
                youtube_tags=["#Shorts", f"#{slug.capitalize()}"],
                scenes=script_scenes,
                total_estimated_duration=sum(s.duration_seconds for s in script_scenes)
            )
        elif payload.draft_text:
            script = architect.refine_operator_draft(payload.draft_text)
        elif payload.chapter and payload.verse:
            loader = GitaDatasetManager()
            verse_data = loader.get_verse(payload.chapter, payload.verse)
            script = architect.generate_script(verse_data)
        else:
            script = architect.refine_operator_draft("gusse aur overthinking se kaise bache")

        synthesizer = GitaAudioSynthesizer(output_dir=OUTPUT_DIR / "audio")
        audio_meta = await synthesizer.generate_voiceover(script)

        visual_mgr = LittleKrishnaVisualManager()
        bg_paths = visual_mgr.prepare_all_scenes()

        burner = SubtitleBurner(output_dir=OUTPUT_DIR / "subtitles")
        sub_paths = burner.generate_all_subtitles(script)

        renderer = GitaVideoRenderer(output_dir=OUTPUT_DIR)
        gita_render_result = renderer.assemble_video(script, audio_meta, bg_paths, sub_paths)

        filename = Path(gita_render_result.video_path).name
        video_path = gita_render_result.video_path
        duration = gita_render_result.duration_seconds
        file_size_mb = round(gita_render_result.file_size_bytes / (1024 * 1024), 2)
        stream_url = f"/static/output/{filename}"
        title = script.title_hindi

    # Persist to SQLite Database
    video_id = save_video_record(
        channel_slug=slug,
        title=title,
        draft_text=payload.draft_text or title,
        script_json=script.model_dump(),
        video_path=video_path,
        duration=duration,
        status="rendered"
    )

    return {
        "status": "success",
        "video_id": video_id,
        "video_path": video_path,
        "filename": filename,
        "title": title,
        "stream_url": stream_url,
        "duration_seconds": duration,
        "resolution": "1080x1920",
        "file_size_mb": file_size_mb
    }


@app.post("/api/{channel_slug}/schedule")
async def schedule_video_api(channel_slug: str, payload: ScheduleRequest):
    """Schedules a rendered video for automated social dispatch."""
    slug = channel_slug.lower().strip()

    if payload.video_id:
        success = update_video_status(
            video_id=payload.video_id,
            status="scheduled",
            scheduled_time=payload.scheduled_time
        )
        if not success:
            raise HTTPException(status_code=404, detail="Video record not found in database")
        return {
            "success": True,
            "video_id": payload.video_id,
            "status": "scheduled",
            "scheduled_time": payload.scheduled_time,
            "platforms": payload.platforms
        }

    # If no specific video_id provided, schedule the latest rendered video for the channel
    videos = get_channel_videos(slug, limit=1)
    if not videos:
        raise HTTPException(status_code=400, detail="No video available to schedule")

    vid = videos[0]
    update_video_status(vid["id"], status="scheduled", scheduled_time=payload.scheduled_time)

    return {
        "success": True,
        "video_id": vid["id"],
        "status": "scheduled",
        "scheduled_time": payload.scheduled_time,
        "platforms": payload.platforms
    }


@app.get("/api/{channel_slug}/history")
async def channel_history_api(channel_slug: str):
    """Returns video history from SQLite database for the channel."""
    slug = channel_slug.lower().strip()
    videos = get_channel_videos(slug, limit=50)
    return format_db_videos(videos)


# ---------------------------------------------------------
# YouTube OAuth Linker & Upload Engine
# ---------------------------------------------------------
class PublishYouTubeRequest(BaseModel):
    video_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    privacy_status: Optional[str] = "public"


@app.get("/api/auth/youtube/login")
async def youtube_login_redirect(channel: str = "geetaverse"):
    """Redirects operator or superuser to Google OAuth consent screen to link YouTube."""
    slug = channel.lower().strip()
    auth_url = get_authorization_url(slug)
    return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)


@app.get("/api/auth/youtube/callback")
async def youtube_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Handles OAuth2 redirect from Google and stores persistent refresh token in SQLite."""
    slug = (state or "geetaverse").lower().strip()
    if error:
        return RedirectResponse(url=f"/{slug}?youtube_error={error}", status_code=status.HTTP_302_FOUND)

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code from Google")

    try:
        exchange_code_for_tokens(code=code, channel_slug=slug)
        return RedirectResponse(url=f"/{slug}?youtube_connected=true", status_code=status.HTTP_302_FOUND)
    except Exception as e:
        return RedirectResponse(url=f"/{slug}?youtube_error={str(e)}", status_code=status.HTTP_302_FOUND)


@app.post("/api/{channel_slug}/publish-youtube")
async def publish_youtube_api(channel_slug: str, payload: PublishYouTubeRequest):
    """Uploads rendered MP4 video directly to YouTube as a Vertical Short via YouTube Data API v3."""
    slug = channel_slug.lower().strip()
    channel = get_channel(slug)
    if not channel:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_slug}' not found")

    # Locate video record
    vid = None
    if payload.video_id:
        vid = get_video_by_id(payload.video_id)
    else:
        videos = get_channel_videos(slug, limit=1)
        if videos:
            vid = videos[0]

    if not vid or not vid.get("video_path"):
        raise HTTPException(status_code=400, detail="No rendered video available to publish to YouTube")

    video_path = vid["video_path"]
    title = payload.title or vid.get("title") or f"{channel['name']} Short"
    description = payload.description or f"{title}\n\n#Shorts #{slug.capitalize()} #VidStackAI"
    tags = payload.tags or ["#Shorts", f"#{slug.capitalize()}"]

    try:
        result = upload_short(
            channel_slug=slug,
            video_path=video_path,
            title=title,
            description=description,
            tags=tags,
            privacy_status=payload.privacy_status or "public"
        )
        # Update database record to 'published'
        update_video_status(vid["id"], status="published")
        return {
            "success": True,
            "video_id": vid["id"],
            "youtube_video_id": result["video_id"],
            "shorts_url": result["shorts_url"],
            "watch_url": result["watch_url"],
            "status": "published"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube Upload Failed: {str(e)}")


# ---------------------------------------------------------
# Instagram Reels Meta Graph Integration
# ---------------------------------------------------------
class PublishInstagramRequest(BaseModel):
    video_id: Optional[int] = None
    caption: Optional[str] = None
    video_url: Optional[str] = None


@app.get("/api/auth/instagram/login")
async def instagram_login_redirect(channel: str = "geetaverse"):
    """Redirects operator or superuser to Meta Facebook OAuth dialog for Instagram Reels publishing."""
    slug = channel.lower().strip()
    auth_url = get_meta_auth_url(slug)
    return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)


@app.get("/api/auth/instagram/callback")
async def instagram_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Handles OAuth2 redirect from Meta and stores long-lived Page tokens and IG ID in SQLite."""
    slug = (state or "geetaverse").lower().strip()
    if error:
        return RedirectResponse(url=f"/{slug}?instagram_error={error}", status_code=status.HTTP_302_FOUND)

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code from Meta")

    try:
        exchange_meta_code(code=code, channel_slug=slug)
        return RedirectResponse(url=f"/{slug}?instagram_connected=true", status_code=status.HTTP_302_FOUND)
    except Exception as e:
        return RedirectResponse(url=f"/{slug}?instagram_error={str(e)}", status_code=status.HTTP_302_FOUND)


@app.post("/api/{channel_slug}/publish-instagram")
async def publish_instagram_api(channel_slug: str, payload: PublishInstagramRequest):
    """Uploads rendered MP4 video directly to Instagram Reels via Meta Graph API v20.0."""
    slug = channel_slug.lower().strip()
    channel = get_channel(slug)
    if not channel:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_slug}' not found")

    # Locate video record
    vid = None
    if payload.video_id:
        vid = get_video_by_id(payload.video_id)
    else:
        videos = get_channel_videos(slug, limit=1)
        if videos:
            vid = videos[0]

    if not vid or not vid.get("video_path"):
        raise HTTPException(status_code=400, detail="No rendered video available to publish to Instagram")

    video_path = vid["video_path"]
    caption = payload.caption or vid.get("title") or f"{channel['name']} Video"

    try:
        result = publish_reel(
            channel_slug=slug,
            video_path=video_path,
            caption=caption,
            video_url=payload.video_url
        )
        # Update database record to 'published'
        update_video_status(vid["id"], status="published")
        return {
            "success": True,
            "video_id": vid["id"],
            "instagram_media_id": result["media_id"],
            "container_id": result.get("container_id"),
            "reel_url": result["reel_url"],
            "status": "published"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Instagram Publish Failed: {str(e)}")


# ---------------------------------------------------------
# Background Scheduler Endpoints
# ---------------------------------------------------------
@app.post("/api/scheduler/tick")
@app.get("/api/scheduler/tick")
async def manual_scheduler_tick():
    """Manually triggers an immediate check and dispatch pass of the autonomous scheduler."""
    from datetime import datetime, timezone
    published = await scheduler.tick()
    return {
        "status": "success",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "published_count": len(published),
        "published_items": published
    }


# ---------------------------------------------------------
# Web Portal HTML Views
# ---------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    """Public showcase landing page."""
    channels = list_channels()
    recent_videos = scan_output_videos()[:6]
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"channels": channels, "recent_videos": recent_videos}
    )


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, channel: str = "geetaverse"):
    """Channel passkey authentication login view."""
    slug = channel.lower().strip()
    if is_authenticated(request, slug):
        return RedirectResponse(url=f"/{slug}", status_code=status.HTTP_302_FOUND)

    ch_info = get_channel(slug)
    channel_name = ch_info["name"] if ch_info else ("Core Access Superuser" if slug == "core_access" else slug.capitalize())

    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={
            "channel_slug": slug,
            "channel_name": channel_name
        }
    )


@app.get("/core_access", response_class=HTMLResponse)
async def core_access_dashboard(request: Request):
    """Superuser dashboard protected by superuser passkey."""
    if not is_authenticated(request, "core_access"):
        return RedirectResponse(url="/login?channel=core_access", status_code=status.HTTP_302_FOUND)

    channels = list_channels()
    all_videos = format_db_videos(get_all_videos(limit=100))
    total_mb = round(sum(v.get("file_size_mb", 0) for v in scan_output_videos()), 2)

    return templates.TemplateResponse(
        request=request,
        name="core_access.html",
        context={
            "channels": channels,
            "all_videos": all_videos,
            "total_storage_mb": total_mb
        }
    )


@app.get("/{channel_slug}", response_class=HTMLResponse)
async def operator_portal(request: Request, channel_slug: str):
    """Operator Studio protected by channel passkey authentication."""
    slug = channel_slug.lower().strip()

    # Avoid capturing static assets or special routes
    if slug in ["favicon.ico", "docs", "openapi.json", "redoc", "static"]:
        raise HTTPException(status_code=404, detail="Not found")

    if slug in ["core_access", "admin"]:
        return RedirectResponse(url="/core_access", status_code=status.HTTP_302_FOUND)

    channel = get_channel(slug)
    if not channel:
        raise HTTPException(status_code=404, detail=f"Channel portal '{channel_slug}' not found")

    # Verify passkey session cookie
    if not is_authenticated(request, slug):
        return RedirectResponse(url=f"/login?channel={slug}", status_code=status.HTTP_302_FOUND)

    history_videos = format_db_videos(get_channel_videos(slug, limit=20))
    latest_video = history_videos[0] if history_videos else None

    return templates.TemplateResponse(
        request=request,
        name="portal.html",
        context={
            "channel": channel,
            "history_videos": history_videos,
            "latest_video": latest_video
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
