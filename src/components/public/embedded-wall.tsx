import React from 'react';
import { Play } from 'lucide-react';

export function EmbeddedWall() {
  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">Featured Videos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg group hover:border-slate-700 transition">
            <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600/80 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-200 text-sm">Automated Video Showcase #{item}</h3>
              <p className="text-slate-400 text-xs mt-1">Generated seamlessly via VidStack pipeline.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
