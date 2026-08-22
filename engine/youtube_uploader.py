import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from engine.youtube_auth import get_channel_credentials


def upload_short(
    channel_slug: str,
    video_path: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    category_id: str = "22",
    privacy_status: str = "public"
) -> Dict[str, Any]:
    """Uploads an MP4 video file directly to YouTube as a Vertical Short via YouTube Data API v3.
    
    Args:
        channel_slug: Identifier for the channel tenant (e.g. 'geetaverse')
        video_path: Local filesystem path to the rendered MP4 video
        title: Video title (should include #Shorts if vertical)
        description: Description text and tags
        tags: List of keywords/hashtags
        category_id: YouTube video category ('22' for People & Blogs, '27' for Education, '20' for Gaming)
        privacy_status: 'public', 'unlisted', or 'private'
        
    Returns:
        Dictionary containing YouTube Video ID and watch/shorts URLs.
    """
    path_obj = Path(video_path).resolve()
    if not path_obj.exists():
        raise FileNotFoundError(f"Video file not found at path: {video_path}")

    # 1. Retrieve credentials from SQLite database
    credentials = get_channel_credentials(channel_slug)
    if not credentials:
        raise RuntimeError(
            f"Channel '{channel_slug}' is not connected to YouTube. "
            f"Please authenticate via /api/auth/youtube/login?channel={channel_slug}"
        )

    # 2. Build YouTube Data API v3 Client
    youtube = build("youtube", "v3", credentials=credentials)

    # 3. Format Title & Tags for YouTube Shorts optimization
    clean_title = title.strip()
    if "#Shorts" not in clean_title and "#shorts" not in clean_title:
        clean_title = f"{clean_title} #Shorts"
    clean_title = clean_title[:100]

    video_tags = tags or ["#Shorts", f"#{channel_slug.capitalize()}"]

    body = {
        "snippet": {
            "title": clean_title,
            "description": description,
            "tags": video_tags,
            "categoryId": category_id
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False
        }
    }

    # 4. Prepare Resumable Media File Upload
    media = MediaFileUpload(
        str(path_obj),
        chunksize=-1,
        resumable=True,
        mimetype="video/mp4"
    )

    insert_request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media
    )

    # 5. Execute Upload
    response = None
    while response is None:
        status, response = insert_request.next_chunk()
        if status:
            print(f"[+] Uploading to YouTube: {int(status.progress() * 100)}%")

    video_id = response.get("id")
    shorts_url = f"https://www.youtube.com/shorts/{video_id}"
    watch_url = f"https://youtu.be/{video_id}"

    return {
        "status": "success",
        "video_id": video_id,
        "shorts_url": shorts_url,
        "watch_url": watch_url,
        "title": clean_title,
        "privacy_status": privacy_status,
        "raw_response": response
    }
