import { createClient } from '@/lib/supabase/server';
import { GenerationJob } from '@/types/database';

export async function enqueueJob(videoId: string, payload: Record<string, unknown> = {}): Promise<GenerationJob | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: job, error } = await (supabase.from('generation_jobs') as any)
      .insert({
        video_id: videoId,
        status: 'queued',
        progress: 0,
        current_step: 'Queued for rendering',
        payload,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error enqueueing job:', error);
      return null;
    }

    return job as GenerationJob;
  } catch (err) {
    console.error('Exception enqueueing job:', err);
    return null;
  }
}

export async function claimNextJob(workerId: string): Promise<GenerationJob | null> {
  try {
    const supabase = await createClient();

    // Fetch oldest queued job
    const { data: jobs, error: selectError } = await (supabase.from('generation_jobs') as any)
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    if (selectError || !jobs || jobs.length === 0) {
      return null;
    }

    const jobToClaim = jobs[0];

    // Lock and update job status to processing
    const { data: updatedJob, error: updateError } = await (supabase.from('generation_jobs') as any)
      .update({
        status: 'processing',
        worker_id: workerId,
        started_at: new Date().toISOString(),
        current_step: 'Starting pipeline execution',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobToClaim.id)
      .eq('status', 'queued') // Optimistic locking check
      .select('*')
      .single();

    if (updateError || !updatedJob) {
      return null;
    }

    return updatedJob as GenerationJob;
  } catch (err) {
    console.error('Exception claiming next job:', err);
    return null;
  }
}

export async function updateJobProgress(jobId: string, progress: number, currentStep: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await (supabase.from('generation_jobs') as any)
      .update({
        progress: Math.min(100, Math.max(0, progress)),
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job progress:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception updating job progress:', err);
    return false;
  }
}

export async function completeJob(jobId: string, outputUrl: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // 1. Fetch job to get video_id
    const { data: job } = await (supabase.from('generation_jobs') as any)
      .select('video_id, created_by')
      .eq('id', jobId)
      .single();

    if (!job) return false;

    const completedAt = new Date().toISOString();

    // 2. Mark job completed
    await (supabase.from('generation_jobs') as any)
      .update({
        status: 'completed',
        progress: 100,
        current_step: 'Rendering complete',
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', jobId);

    // 3. Update video record status to 'rendered' and attach video output URL
    await (supabase.from('videos') as any)
      .update({
        status: 'rendered',
        video_url: outputUrl,
        updated_at: completedAt,
      })
      .eq('id', job.video_id);

    // 4. Log completion event
    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'JOB_RENDER_COMPLETED',
      metadata: {
        jobId,
        videoId: job.video_id,
        outputUrl,
      },
      created_by: job.created_by,
    });

    return true;
  } catch (err) {
    console.error('Exception completing job:', err);
    return false;
  }
}

export async function failJob(jobId: string, errorMessage: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Fetch job to get video_id
    const { data: job } = await (supabase.from('generation_jobs') as any)
      .select('video_id, created_by')
      .eq('id', jobId)
      .single();

    if (!job) return false;

    const now = new Date().toISOString();

    // Mark job failed
    await (supabase.from('generation_jobs') as any)
      .update({
        status: 'failed',
        error_message: errorMessage,
        current_step: 'Execution failed',
        updated_at: now,
      })
      .eq('id', jobId);

    // Update video record status to 'failed'
    await (supabase.from('videos') as any)
      .update({
        status: 'failed',
        updated_at: now,
      })
      .eq('id', job.video_id);

    // Log failure event
    await (supabase.from('system_logs') as any).insert({
      level: 'error',
      action: 'JOB_RENDER_FAILED',
      metadata: {
        jobId,
        videoId: job.video_id,
        error: errorMessage,
      },
      created_by: job.created_by,
    });

    return true;
  } catch (err) {
    console.error('Exception failing job:', err);
    return false;
  }
}
