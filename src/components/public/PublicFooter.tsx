import React from 'react';
import Link from 'next/link';
import { Video } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Video className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-200 text-sm">VidStack Platform</span>
        </div>

        <p className="text-xs text-slate-500 text-center md:text-left">
          &copy; {new Date().getFullYear()} VidStack. Autonomous Multi-Channel Video Production & Publishing.
        </p>

        <div className="flex items-center space-x-6 text-xs text-slate-400 font-medium">
          <Link href="/" className="hover:text-slate-200 transition">Showcase</Link>
          <Link href="/#channels" className="hover:text-slate-200 transition">Network Channels</Link>
        </div>
      </div>
    </footer>
  );
}
