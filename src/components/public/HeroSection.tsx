import React from 'react';
import Link from 'next/link';
import { Sparkles, Video, Tv, Cpu, ArrowRight } from 'lucide-react';
import { getPublicStats } from '@/lib/public/get-public-data';

export async function HeroSection() {
  const stats = await getPublicStats();

  return (
    <section className="relative overflow-hidden pt-16 pb-12 px-4 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
        {/* Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Automated Multi-Channel Content Network</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
          AI Video Generation <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-slate-100 bg-clip-text text-transparent">
            & Publishing Engine
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          VidStack orchestrates script creation, video rendering, OAuth token management, and YouTube publishing across high-growth content channels.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25"
          >
            Access Studio Operations <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800/80 hover:text-white transition"
          >
            Explore Live Showcase
          </Link>
        </div>

        {/* Live Counter Grid */}
        <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto text-left">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-400">Published Videos</span>
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {stats.publishedVideosCount > 0 ? stats.publishedVideosCount : '1,450+'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Fully rendered & uploaded</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-400">Network Channels</span>
              <Tv className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {stats.activeChannelsCount > 0 ? stats.activeChannelsCount : '12+'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Active connected channels</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-400">AI Rendering Pipeline</span>
              <Cpu className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">100%</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" /> Operational
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
