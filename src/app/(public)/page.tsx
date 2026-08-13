import React from 'react';
import { HeroSection } from '@/components/public/HeroSection';
import { VideoWall } from '@/components/public/VideoWall';

export const dynamic = 'force-dynamic';

export default function PublicPage() {
  return (
    <div className="space-y-4">
      <HeroSection />
      <VideoWall />
    </div>
  );
}
