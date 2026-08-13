import { createClient } from '@/lib/supabase/server';

export async function logInfo(action: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action,
      metadata,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('logInfo execution failed:', err);
  }
}

export async function logWarning(action: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await (supabase.from('system_logs') as any).insert({
      level: 'warn',
      action,
      metadata,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('logWarning execution failed:', err);
  }
}

export async function logError(action: string, error: Error | string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown Error';
    const errorStack = typeof error === 'object' && error?.stack ? error.stack : undefined;

    await (supabase.from('system_logs') as any).insert({
      level: 'error',
      action,
      metadata: {
        ...metadata,
        error: errorMessage,
        stack: errorStack,
      },
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('logError execution failed:', err);
  }
}
