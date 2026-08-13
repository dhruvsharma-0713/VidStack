import React from 'react';
import { EmbeddedWall } from '@/components/public/embedded-wall';

export default function ShowcasePage() {
  return (
    <div className="py-12 px-4 space-y-6">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-100">VidStack Video Showcase</h1>
        <p className="text-slate-400 text-sm">Explore real-world videos generated and published automatically by VidStack.</p>
      </div>
      <EmbeddedWall />
    </div>
  );
}
