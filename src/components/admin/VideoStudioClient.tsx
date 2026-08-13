'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Video, Plus, Sparkles, Filter, Play, CheckCircle2, Clock, AlertTriangle, Eye, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createVideoDraftAction, deleteVideoAction } from '@/app/(admin)/admin/videos/actions';

interface VideoStudioClientProps {
  videos: any[];
  channels: any[];
  userRole: string;
}

export function VideoStudioClient({ videos, channels, userRole }: VideoStudioClientProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, startGeneration] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);

  // Form State
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('Technology & AI');
  const [tone, setTone] = useState('engaging and analytical');
  const [duration, setDuration] = useState('60');
  const [channelId, setChannelId] = useState('none');

  const filteredVideos = selectedChannel === 'all'
    ? videos
    : videos.filter((v) => v.channel_id === selectedChannel);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);

    const formData = new FormData();
    formData.append('topic', topic);
    formData.append('niche', niche);
    formData.append('tone', tone);
    formData.append('duration', duration);
    formData.append('channelId', channelId);

    startGeneration(async () => {
      const res = await createVideoDraftAction(formData);
      if (res.error) {
        setGenError(res.error);
      } else {
        setIsModalOpen(false);
        setTopic('');
      }
    });
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Delete video "${title}"?`)) return;
    await deleteVideoAction(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'rendered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {status}
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
            <Clock className="w-3 h-3 mr-1 animate-spin" /> {status}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Bar & Create Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Video Factory & Queue</h1>
          <p className="text-xs text-slate-400 mt-1">Manage AI script creation, rendering queue, and YouTube publishing.</p>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="shadow-lg shadow-indigo-600/20 font-semibold"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Create New AI Video
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Channel:</span>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Connected Channels ({videos.length})</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing <strong className="text-slate-200">{filteredVideos.length}</strong> videos
        </span>
      </div>

      {/* Video Studio Table / Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Videos Found</h3>
            <p className="text-xs text-slate-400">Generate your first AI script and video draft to populate the studio queue.</p>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Generate Video Draft
          </Button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-semibold">Video Title</th>
                  <th className="px-5 py-4 font-semibold">Target Channel</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created Date</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredVideos.map((vid) => (
                  <tr key={vid.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-bold text-slate-200 max-w-xs truncate">
                      <Link href={`/admin/videos/${vid.id}`} className="hover:text-indigo-400 transition">
                        {vid.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {vid.channel?.title || 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(vid.status)}</td>
                    <td className="px-5 py-4 text-slate-500 font-mono">
                      {new Date(vid.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/admin/videos/${vid.id}`}>
                          <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]">
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </Button>
                        </Link>
                        {userRole === 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVideo(vid.id, vid.title)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create AI Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">Create New AI Video Draft</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {genError && (
              <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-300">
                {genError}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Video Topic / Prompt</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 5 Breakthrough AI Productivity Tools in 2026"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Niche Category</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Channel</label>
                  <select
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="none">Unassigned / General</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Narration Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="engaging and analytical">Engaging & Analytical</option>
                    <option value="high energy and viral">High Energy & Viral</option>
                    <option value="storytelling and deep">Storytelling & Deep</option>
                    <option value="professional and educational">Professional & Educational</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Duration (Sec)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="30">30 Seconds (Short)</option>
                    <option value="60">60 Seconds (Standard Short)</option>
                    <option value="180">180 Seconds (3 Mins)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating AI Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" /> Generate Video Draft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
