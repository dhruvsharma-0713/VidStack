'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GenerationJob, JobStatus } from '@/types/database';

export function useJobStatus(jobId: string | null) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('Initializing...');
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(jobId));

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Initial Fetch
    const fetchJob = async () => {
      const { data, error: fetchErr } = await (supabase.from('generation_jobs') as any)
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchErr) {
        setError(fetchErr.message);
      } else if (data) {
        const fetchedJob = data as GenerationJob;
        setJob(fetchedJob);
        setProgress(fetchedJob.progress ?? 0);
        setCurrentStep(fetchedJob.current_step || 'Processing');
        setStatus(fetchedJob.status);
        if (fetchedJob.error_message) setError(fetchedJob.error_message);
      }
      setIsLoading(false);
    };

    fetchJob();

    // 2. Realtime Channel Subscription
    const channel = supabase
      .channel(`job-status-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as GenerationJob;
          setJob(updated);
          setProgress(updated.progress ?? 0);
          setCurrentStep(updated.current_step || 'Processing');
          setStatus(updated.status);
          if (updated.error_message) setError(updated.error_message);
        }
      )
      .subscribe();

    // 3. Fallback Polling Interval (Every 3 seconds)
    const pollInterval = setInterval(() => {
      fetchJob();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [jobId]);

  return {
    job,
    progress,
    currentStep,
    status,
    error,
    isLoading,
  };
}
