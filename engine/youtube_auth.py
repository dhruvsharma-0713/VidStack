import json
import os
from typing import Any, Dict, Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from engine.db import get_channel, update_channel_youtube_token

# Scopes required for YouTube video upload and management
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
]


def get_oauth_client_config() -> Dict[str, Any]:
    """Builds standard Google OAuth2 client configuration from environment variables."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "mock-client-id.apps.googleusercontent.com")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "mock-client-secret")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/youtube/callback")

    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri]
        }
    }


def get_authorization_url(channel_slug: str) -> str:
    """Generates the Google OAuth2 consent URL for linking YouTube channel credentials.
    
    Enforces access_type='offline' and prompt='consent' to guarantee a refresh_token.
    """
    client_config = get_oauth_client_config()
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/youtube/callback")

    flow = Flow.from_client_config(
        client_config=client_config,
        scopes=YOUTUBE_SCOPES,
        redirect_uri=redirect_uri
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
        state=channel_slug.lower().strip()
    )
    return auth_url


def exchange_code_for_tokens(code: str, channel_slug: str) -> Dict[str, Any]:
    """Exchanges authorization code for access and refresh tokens and stores in vidstack.db."""
    client_config = get_oauth_client_config()
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/youtube/callback")

    flow = Flow.from_client_config(
        client_config=client_config,
        scopes=YOUTUBE_SCOPES,
        redirect_uri=redirect_uri
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes) if credentials.scopes else YOUTUBE_SCOPES
    }

    # Store refresh_token in SQLite channels table for persistent offline publishing
    token_to_store = credentials.refresh_token or json.dumps(token_data)
    update_channel_youtube_token(channel_slug, token_to_store)

    return token_data


def get_channel_credentials(channel_slug: str) -> Optional[Credentials]:
    """Retrieves and constructs valid Google OAuth2 credentials for a specific channel from vidstack.db."""
    channel = get_channel(channel_slug)
    if not channel or not channel.get("youtube_token"):
        return None

    token_raw = channel["youtube_token"]
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")

    try:
        data = json.loads(token_raw)
        creds = Credentials(
            token=data.get("token"),
            refresh_token=data.get("refresh_token"),
            token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=data.get("client_id", client_id),
            client_secret=data.get("client_secret", client_secret),
            scopes=data.get("scopes", YOUTUBE_SCOPES)
        )
    except Exception:
        # Direct refresh_token string
        creds = Credentials(
            token=None,
            refresh_token=token_raw,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=YOUTUBE_SCOPES
        )

    # Refresh expired access token using the stored refresh_token
    if creds and creds.refresh_token:
        try:
            if not creds.valid:
                creds.refresh(Request())
        except Exception as e:
            print(f"[!] Warning: Token refresh failed for '{channel_slug}': {e}")

    return creds


if __name__ == "__main__":
    url = get_authorization_url("geetaverse")
    print(f"Sample YouTube OAuth URL:\n{url}")
