import React from 'react';
import Link from 'next/link';
import { Video, Shield, ArrowRight } from 'lucide-react';

export function PublicNavbar() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center space-x-3 font-bold text-slate-100 tracking-tight group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold leading-none text-slate-100">VidStack</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden sm:inline">
              Internal AI Video & Multi-Channel OS
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-400">
          <Link href="/showcase" className="hover:text-slate-100 transition">Showcase</Link>
          <Link href="/showcase#channels" className="hover:text-slate-100 transition">Network Channels</Link>
          <Link href="/blog" className="hover:text-slate-100 transition">Daily Log</Link>
        </nav>

        {/* Action CTA */}
        <div className="flex items-center space-x-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" /> Enter Studio <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </header>
  );
}
