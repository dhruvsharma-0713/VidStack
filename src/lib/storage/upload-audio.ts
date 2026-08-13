import { createClient } from '@/lib/supabase/server';

export async function uploadAudioToStorage(videoId: string, audioBuffer: Buffer): Promise<string> {
  const supabase = await createClient();

  const filePath = `voiceovers/${videoId}.mp3`;

  // 1. Upload audio buffer to 'audio-assets' bucket
  const { error: uploadError } = await supabase.storage
    .from('audio-assets')
    .upload(filePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage audio upload error:', uploadError);
    throw new Error(`Failed to upload audio asset: ${uploadError.message}`);
  }

  // 2. Retrieve public URL
  const { data } = supabase.storage
    .from('audio-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
