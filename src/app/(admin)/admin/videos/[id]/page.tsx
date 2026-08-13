import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { getVideoById, getSignedAssetUrls } from '@/app/(admin)/admin/videos/actions';
import { VideoInspectorClient } from '@/components/admin/VideoInspectorClient';

export const dynamic = 'force-dynamic';

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/studio-access');
  }

  const { id } = await params;
  const video = await getVideoById(id);

  if (!video) {
    notFound();
  }

  const { videoSignedUrl, audioSignedUrl } = await getSignedAssetUrls(id);

  return (
    <VideoInspectorClient
      video={video}
      profileRole={profile.role}
      videoSignedUrl={videoSignedUrl}
      audioSignedUrl={audioSignedUrl}
    />
  );
}
