import React from 'react';
import { Play, Calendar, Tag, Tv, Sparkles } from 'lucide-react';
import { getPublishedVideos } from '@/lib/public/get-public-data';

export async function VideoWall() {
  const videos = await getPublishedVideos();

  // Placeholder sample data for realistic showcase if DB has 0 rows currently
  const showcaseItems = videos.length > 0 ? videos : [
    {
      id: 'demo-1',
      title: 'Top 10 AI Tools Automating Modern Workflows in 2026',
      youtube_video_id: 'dQw4w9WgXcQ',
      video_url: null,
      created_at: '2026-08-12',
      seo_tags: ['AI Tools', 'Automation', 'Productivity'],
      channel: { title: 'Tech Trends Daily', thumbnail_url: null },
    },
    {
      id: 'demo-2',
      title: 'Understanding Global Market Inflation & Fed Rate Strategy',
      youtube_video_id: null,
      video_url: null,
      created_at: '2026-08-11',
      seo_tags: ['Finance', 'Economics', 'Markets'],
      channel: { title: 'Finance Fast Facts', thumbnail_url: null },
    },
    {
      id: 'demo-3',
      title: 'Autonomous Robotics Breakthroughs: Humanoid Factories',
      youtube_video_id: null,
      video_url: null,
      created_at: '2026-08-10',
      seo_tags: ['Robotics', 'Future Tech', 'AI'],
      channel: { title: 'AI Insights Weekly', thumbnail_url: null },
    },
  ];

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto space-y-8" id="showcase">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Published Output
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Live Video Wall</h2>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Explore real-world videos auto-scripted, rendered, and published across our channel network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showcaseItems.map((video) => (
          <div
            key={video.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group hover:border-slate-700/80 transition flex flex-col justify-between"
          >
            {/* Video Thumbnail / Embed Preview */}
            <div className="aspect-video bg-slate-950 relative flex items-center justify-center border-b border-slate-800 overflow-hidden">
              {video.youtube_video_id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtube_video_id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center group-hover:bg-slate-900/50 transition">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-3">Rendered Video Preview</span>
                </div>
              )}
            </div>

            {/* Video Details */}
            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                    <Tv className="w-3 h-3 mr-1" /> {video.channel?.title || 'Network Channel'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-white transition">
                  {video.title}
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {/* SEO Tags */}
                {video.seo_tags && video.seo_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {video.seo_tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800">
                        <Tag className="w-2.5 h-2.5 mr-1 text-slate-500" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">
                    Published
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
