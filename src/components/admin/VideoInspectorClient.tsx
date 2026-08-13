'use client';

import React, { useState } from 'react';
import { Play, Download, Copy, Check, Sparkles, FileText, Tag, Activity, Tv, ArrowLeft, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { updateVideoMetadataAction } from '@/app/(admin)/admin/videos/actions';
import { PublishVideoModal } from '@/components/admin/PublishVideoModal';

interface VideoInspectorClientProps {
  video: any;
  profileRole: string;
  videoSignedUrl: string | null;
  audioSignedUrl: string | null;
}

export function VideoInspectorClient({ video, profileRole, videoSignedUrl, audioSignedUrl }: VideoInspectorClientProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'seo' | 'metrics'>('script');
  const [title, setTitle] = useState(video.title || '');
  const [tags, setTags] = useState<string[]>(video.seo_tags || []);
  const [tagInput, setTagInput] = useState('');
  const [copiedTags, setCopiedTags] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const wordCount = video.script ? video.script.replace(/\[\d+:\d+\s*-\s*[^\]]+\]/g, '').split(/\s+/).filter(Boolean).length : 0;
  const estDuration = Math.round((wordCount / 150) * 60);

  const handleCopyTags = () => {
    navigator.clipboard.writeText(tags.join(', '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleSaveMetadata = async () => {
    setIsUpdating(true);
    setUpdateMsg(null);
    const res = await updateVideoMetadataAction(video.id, { title, seo_tags: tags });
    setIsUpdating(false);
    if (res.error) setUpdateMsg(res.error);
    else setUpdateMsg('Metadata saved successfully.');
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const mediaSource = videoSignedUrl || video.video_url;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <Link href="/admin/videos">
            <Button size="sm" variant="ghost" className="text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-100">{video.title}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">
                {video.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Channel: {video.channel?.title || 'Unassigned'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button size="sm" variant="outline">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-render
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsPublishModalOpen(true)}
            className="shadow-md shadow-indigo-600/20 font-semibold"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Publish to YouTube
          </Button>
        </div>
      </div>

      {/* Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media Player (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center max-h-[560px] mx-auto">
              {mediaSource ? (
                <video
                  src={mediaSource}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mx-auto">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                  <p className="text-xs text-slate-400">Rendering preview stream pending...</p>
                </div>
              )}
            </div>

            {/* Quick Assets Download Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Asset Downloads</span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={mediaSource || '#'}
                  download={`video_${video.id}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-[11px] text-slate-300 font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>MP4 Video</span>
                </a>
                <a
                  href={audioSignedUrl || video.video_url || '#'}
                  download={`audio_${video.id}.mp3`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-[11px] text-slate-300 font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>MP3 Audio</span>
                </a>
                <button
                  onClick={() => alert('Downloading .ASS subtitle format')}
                  className="px-2.5 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-[11px] text-slate-300 font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3 h-3 text-sky-400" />
                  <span>ASS Subs</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Inspector Panel (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
            {/* Tabs Bar */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              {[
                { id: 'script', label: 'Script & Hook', icon: FileText },
                { id: 'seo', label: 'SEO & Metadata', icon: Tag },
                { id: 'metrics', label: 'Job Metrics', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Script & Hook */}
            {activeTab === 'script' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span>Estimated Pacing: <strong className="text-slate-200">{estDuration}s</strong> (~150 WPM)</span>
                  <span>Word Count: <strong className="text-slate-200">{wordCount} words</strong></span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">Generated Narration Script</label>
                  <textarea
                    rows={14}
                    readOnly
                    value={video.script || 'No script generated.'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: SEO & Metadata */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                {updateMsg && (
                  <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{updateMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">Video Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">Search Tags</label>
                    <button
                      onClick={handleCopyTags}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      {copiedTags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTags ? 'Copied Tags!' : 'Copy All Tags'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type tag and press Enter..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 text-slate-500 hover:text-red-400"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button size="sm" variant="primary" onClick={handleSaveMetadata} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Metadata Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 3: Job Metrics */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-200">Execution Timeline & Logs</h4>
                {video.latestJob ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Job ID:</span>
                      <span className="text-slate-200">{video.latestJob.id}</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Current Step:</span>
                      <span className="text-indigo-400 font-semibold">{video.latestJob.current_step}</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Progress:</span>
                      <span className="text-emerald-400 font-bold">{video.latestJob.progress}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No active or historical render job records logged for this video.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Video Modal */}
      <PublishVideoModal
        videoId={video.id}
        videoTitle={video.title}
        channelTitle={video.channel?.title}
        channelAvatar={video.channel?.thumbnail_url}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />
    </div>
  );
}
