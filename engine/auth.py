import hashlib
import hmac
import os
import time
from typing import Optional
from fastapi import Request, Response
from engine.db import verify_channel_passkey

# Configuration
SUPERUSER_PASSKEY = os.getenv("SUPERUSER_PASSKEY", "dhruvii1307")
SECRET_KEY = os.getenv("SESSION_SECRET", "vidstack-secret-auth-key-2026-production").encode("utf-8")
SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600  # 7 days


def create_session_token(slug: str) -> str:
    """Generates an HMAC-SHA256 signed session token for a channel or superuser."""
    ts = str(int(time.time()))
    payload = f"{slug.lower().strip()}:{ts}"
    signature = hmac.new(SECRET_KEY, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"


def verify_session_token(slug: str, token: Optional[str]) -> bool:
    """Validates the integrity and expiration of a session token."""
    if not token or not isinstance(token, str):
        return False

    parts = token.split(":")
    if len(parts) != 3:
        return False

    token_slug, ts_str, signature = parts
    target_slug = slug.lower().strip()

    # Superuser session can access all channel portals
    if token_slug != target_slug and token_slug != "core_access":
        return False

    try:
        ts = int(ts_str)
        # Check token age
        if time.time() - ts > SESSION_MAX_AGE_SECONDS or ts > time.time() + 60:
            return False
    except ValueError:
        return False

    payload = f"{token_slug}:{ts_str}"
    expected_sig = hmac.new(SECRET_KEY, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected_sig)


def authenticate(slug: str, passkey: str) -> bool:
    """Authenticates passkey for a channel or superuser core access."""
    clean_slug = slug.lower().strip()
    clean_passkey = passkey.strip()

    if clean_slug in ["core_access", "admin", "superuser"]:
        return clean_passkey == SUPERUSER_PASSKEY

    return verify_channel_passkey(clean_slug, clean_passkey)


def get_session_cookie_name(slug: str) -> str:
    """Returns the cookie name for session persistence."""
    return f"vidstack_sess_{slug.lower().strip()}"


def set_auth_cookie(response: Response, slug: str, token: str) -> None:
    """Sets a secure, HTTP-only session cookie."""
    cookie_name = get_session_cookie_name(slug)
    response.set_cookie(
        key=cookie_name,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False  # Set True in HTTPS production environments
    )
    # Also set unified fallback session cookie
    response.set_cookie(
        key="vidstack_current_session",
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax"
    )


def clear_auth_cookie(response: Response, slug: str) -> None:
    """Clears the session cookie on logout."""
    cookie_name = get_session_cookie_name(slug)
    response.delete_cookie(key=cookie_name)
    response.delete_cookie(key="vidstack_current_session")


def is_authenticated(request: Request, slug: str) -> bool:
    """Checks if incoming request has a valid session for the given channel or superuser."""
    clean_slug = slug.lower().strip()
    cookie_name = get_session_cookie_name(clean_slug)

    token = request.cookies.get(cookie_name)
    if token and verify_session_token(clean_slug, token):
        return True

    # Check if a superuser session exists
    superuser_cookie = get_session_cookie_name("core_access")
    su_token = request.cookies.get(superuser_cookie)
    if su_token and verify_session_token("core_access", su_token):
        return True

    # Check generic current session cookie
    fallback_token = request.cookies.get("vidstack_current_session")
    if fallback_token and verify_session_token(clean_slug, fallback_token):
        return True

    return False
