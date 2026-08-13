export interface StockAssetResult {
  sourceUrl: string;
  duration: number;
  dimensions: string;
  provider: 'pexels' | 'unsplash';
}

export async function fetchStockVideos(query: string, count: number = 2): Promise<StockAssetResult[]> {
  const pexelsApiKey = process.env.PEXELS_API_KEY || '';
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || '';

  // 1. Try Pexels Video API
  if (pexelsApiKey && !pexelsApiKey.includes('your_pexels_api_key')) {
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
      const response = await fetch(url, {
        headers: {
          Authorization: pexelsApiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.videos && data.videos.length > 0) {
          return data.videos.map((video: any) => {
            const videoFiles = video.video_files || [];
            // Prefer HD/SD mp4 files
            const bestFile =
              videoFiles.find((f: any) => f.quality === 'hd' && f.file_type === 'video/mp4') ||
              videoFiles.find((f: any) => f.file_type === 'video/mp4') ||
              videoFiles[0];

            return {
              sourceUrl: bestFile?.link || '',
              duration: video.duration || 10,
              dimensions: `${video.width || 1080}x${video.height || 1920}`,
              provider: 'pexels' as const,
            };
          }).filter((asset: StockAssetResult) => Boolean(asset.sourceUrl));
        }
      }
    } catch (err) {
      console.warn('Pexels API fetch failed:', err);
    }
  }

  // 2. Fallback to Unsplash Image API
  if (unsplashAccessKey && !unsplashAccessKey.includes('your_unsplash_access_key')) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((photo: any) => ({
            sourceUrl: photo.urls?.regular || photo.urls?.full || '',
            duration: 5,
            dimensions: `${photo.width || 1080}x${photo.height || 1920}`,
            provider: 'unsplash' as const,
          })).filter((asset: StockAssetResult) => Boolean(asset.sourceUrl));
        }
      }
    } catch (err) {
      console.warn('Unsplash API fetch failed:', err);
    }
  }

  // 3. Fallback High-Quality CDN Stock Assets if API keys are unconfigured
  const fallbackAssets: StockAssetResult[] = [
    {
      sourceUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop`,
      duration: 5,
      dimensions: '1080x1920',
      provider: 'unsplash',
    },
    {
      sourceUrl: `https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1080&auto=format&fit=crop`,
      duration: 5,
      dimensions: '1080x1920',
      provider: 'unsplash',
    },
  ];

  return fallbackAssets.slice(0, count);
}
