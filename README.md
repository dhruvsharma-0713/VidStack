# VidStack AI — Python-First Autonomous Vertical Video Pipeline & Multi-Tenant Studio

VidStack is a high-performance, Python-first autonomous media production engine and multi-tenant operator studio. It transforms raw operator notes, Bhagavad Gita wisdom, and gaming storylines into 9:16 vertical videos (YouTube Shorts & Instagram Reels) with sub-8-second single-pass rendering and automated social publishing.

---

## Key Features

- **Multi-Tenant Channel Portals**: Isolated operator studios with passkey authentication and separate SQLite video queues (`/geetaverse`, `/gtachronicles`, and dynamic custom channels).
- **Fast-Paced Script Engines**:
  - **Vedic / Devotional Engine** (`GitaScriptArchitect`): 5-scene high-retention Little Krishna wisdom narratives with Devanagari burned subtitles.
  - **Gaming / Gameplay Engine** (`GTAScriptArchitect`): High-energy Hindi stunt, myth-busting, and heist lore narratives.
- **Sub-8s Hardware-Accelerated Rendering**: Single-pass FFmpeg pipeline (`libx264 -preset ultrafast -tune stillimage`) with subtle zoom pan motion, parallel Edge-TTS audio synthesis, and Devanagari caption overlays.
- **Autonomous Background Scheduler**: Async polling loop managed by FastAPI's `lifespan` context manager that automatically picks up mature scheduled videos and dispatches them to social platforms.
- **Direct Social Publishing Hub**:
  - **YouTube Shorts**: Resumable OAuth2 chunked uploader via Google YouTube Data API v3.
  - **Instagram Reels**: 2-step container creation and publishing via Meta Graph API v20.0.
- **Dynamic Portal Provisioning**: Superuser dashboard (`/core_access`) for real-time telemetry, video records inspection, and 1-click provisioning of new channel portals.

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, Jinja2, Pydantic
- **Video & Audio**: FFmpeg, Edge-TTS, Pillow, Mutagen
- **NLP & AI**: Groq SDK (`llama-3.3-70b-versatile` / `llama3-8b-8192`)
- **Database & Auth**: SQLite3, HMAC-SHA256 Signed Cookies
- **Social APIs**: Google OAuth2 / YouTube Data API v3, Meta Graph API v20.0

---

## Directory Structure

```
VidStack/
├── app.py                     # FastAPI server, lifespan scheduler, and route handlers
├── requirements.txt           # Python dependencies
├── run_pipeline.py            # CLI pipeline runner
├── vidstack.db                # SQLite database (ignored by Git)
├── engine/
│   ├── db.py                  # SQLite schema, channels, and video records queue
│   ├── auth.py                # Passkey authentication and signed session cookies
│   ├── scheduler.py           # Autonomous background publishing loop
│   ├── youtube_auth.py        # Google OAuth2 authorization & token exchange
│   ├── youtube_uploader.py    # YouTube Shorts resumable upload engine
│   ├── instagram_publisher.py # Meta Graph OAuth2 & Instagram Reels publisher
│   ├── script_architect.py    # Gita Vedic script generator (Groq / offline)
│   ├── gta_script_architect.py# GTA Hindi gaming script architect
│   ├── audio_synthesizer.py   # Concurrent Edge-TTS audio synthesizer
│   ├── visual_engine.py       # Little Krishna visual card compositor
│   ├── gta_visual_engine.py   # GTA gameplay visualizer and single-pass renderer
│   ├── subtitle_burner.py     # Devanagari subtitle burner
│   ├── video_renderer.py      # Direct single-pass FFmpeg renderer
│   └── gita_loader.py         # Bhagavad Gita JSON dataset manager
└── templates/
    ├── index.html             # Public showcase & active portals grid
    ├── portal.html            # Unified multi-tenant operator studio
    ├── core_access.html       # Superuser telemetry & portal provisioner
    └── login.html             # Passkey authentication modal
```

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env` and set your API keys:
```env
GROQ_API_KEY=your_groq_api_key
SUPERUSER_PASSKEY=dhruvii1307

# YouTube OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/youtube/callback

# Instagram Reels (Meta for Developers)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:8000/api/auth/instagram/callback
```

### 3. Launch Development Server
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

## Default Access Credentials

| Portal / View | Route | Passkey | Description |
| :--- | :--- | :--- | :--- |
| **Public Showcase** | `/` | *None* | Active portals, recent renders, architecture |
| **Geetaverse Studio** | `/geetaverse` | `radhe108` | Little Krishna devotional video studio |
| **GTA Chronicles** | `/gtachronicles` | `gta5pro` | Hindi gaming & stunt video studio |
| **Core Access Hub** | `/core_access` | `dhruvii1307` | Superuser telemetry & portal provisioning |
