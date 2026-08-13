export interface YouTubeTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface YouTubeChannelMetadata {
  id: string; // YouTube Channel ID
  title: string;
  description: string;
  thumbnail_url: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

export function getYouTubeAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: YOUTUBE_SCOPES.join(' '),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<YouTubeTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || errorData.error || 'Failed to exchange OAuth code for tokens.');
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Failed to refresh YouTube access token.');
  }

  return response.json();
}

export async function fetchChannelMetadata(accessToken: string): Promise<YouTubeChannelMetadata> {
  const url = 'https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet,statistics';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch YouTube channel metadata.');
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel found associated with this Google Account.');
  }

  const channel = data.items[0];
  const snippet = channel.snippet || {};
  const statistics = channel.statistics || {};
  const thumbnails = snippet.thumbnails || {};

  const thumbnailUrl =
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    '';

  return {
    id: channel.id,
    title: snippet.title || 'Untitled Channel',
    description: snippet.description || '',
    thumbnail_url: thumbnailUrl,
    subscriberCount: statistics.subscriberCount || '0',
    viewCount: statistics.viewCount || '0',
    videoCount: statistics.videoCount || '0',
  };
}
