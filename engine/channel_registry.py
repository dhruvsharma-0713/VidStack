from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ChannelConfig(BaseModel):
    """Configuration schema for a multi-tenant content channel."""
    slug: str = Field(..., description="Unique URL-safe identifier for the channel (e.g. 'geetaverse')")
    name: str = Field(..., description="Display name of the channel")
    niche: str = Field(..., description="Target content niche or domain")
    target_duration: int = Field(default=40, description="Target video duration in seconds")
    voice_id: str = Field(default="hi-IN-MadhurNeural", description="TTS Voice identifier")
    status: str = Field(default="active", description="Status: 'active' or 'staging'")
    description: Optional[str] = Field(default=None, description="Brief channel description")
    icon: Optional[str] = Field(default="video", description="Lucide icon identifier")
    tags: List[str] = Field(default_factory=list, description="Default hashtag keywords")
    total_renders: int = Field(default=0, description="Total video renders completed")


class ChannelRegistry:
    """Manages channel profiles, multi-tenant configs, and lifecycle states."""

    _DEFAULT_CHANNELS: Dict[str, ChannelConfig] = {
        "geetaverse": ChannelConfig(
            slug="geetaverse",
            name="Geetaverse AI",
            niche="Spiritual / Bhagavad Gita 2D Shorts",
            target_duration=38,
            voice_id="hi-IN-MadhurNeural",
            status="active",
            description="Soulful Little Krishna wisdom in conversational Hindi (35-40s vertical shorts)",
            icon="sparkles",
            tags=["#Geetaverse", "#Krishna", "#BhagavadGita", "#Shorts", "#Spiritual"],
            total_renders=12
        ),
        "gtachronicles": ChannelConfig(
            slug="gtachronicles",
            name="GTA Chronicles",
            niche="GTA Gameplay & Lore Storytelling",
            target_duration=45,
            voice_id="en-US-ChristopherNeural",
            status="active",
            description="High-octane GTA V action narratives, heist breakdowns, and character lore",
            icon="gamepad-2",
            tags=["#GTA5", "#GTAV", "#GamingShorts", "#GTAChronicles"],
            total_renders=5
        )
    }

    def __init__(self):
        self._channels: Dict[str, ChannelConfig] = dict(self._DEFAULT_CHANNELS)

    def get_channel(self, slug: str) -> Optional[ChannelConfig]:
        """Fetches channel profile by slug."""
        return self._channels.get(slug.lower().strip())

    def list_channels(self, status: Optional[str] = None) -> List[ChannelConfig]:
        """Lists all registered channels, optionally filtered by status."""
        channels = list(self._channels.values())
        if status:
            channels = [c for c in channels if c.status.lower() == status.lower()]
        return channels

    def register_channel(self, config: ChannelConfig) -> ChannelConfig:
        """Registers or updates a channel configuration."""
        self._channels[config.slug.lower().strip()] = config
        return config

    def update_status(self, slug: str, status: str) -> Optional[ChannelConfig]:
        """Updates channel lifecycle status."""
        channel = self.get_channel(slug)
        if channel:
            channel.status = status
            return channel
        return None

    def increment_renders(self, slug: str) -> None:
        """Increments the total render counter for a channel."""
        channel = self.get_channel(slug)
        if channel:
            channel.total_renders += 1


# Global singleton instance for easy import across modules
channel_registry = ChannelRegistry()
