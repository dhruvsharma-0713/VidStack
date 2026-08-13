import { createClient } from '@/lib/supabase/server';
import { SystemLog } from '@/types/database';

export interface SystemLogWithUser extends SystemLog {
  user?: {
    email: string;
    full_name: string | null;
  } | null;
}

export async function getSystemLogs(params: {
  level?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ logs: SystemLogWithUser[]; totalCount: number }> {
  try {
    const { level, limit = 50, offset = 0 } = params;
    const supabase = await createClient();

    // Verify user authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { logs: [], totalCount: 0 };
    }

    let query = (supabase.from('system_logs') as any)
      .select('*, profiles(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    const { data: logs, count, error } = await query;

    if (error || !logs) {
      console.error('Error fetching system logs:', error);
      return { logs: [], totalCount: 0 };
    }

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      level: log.level,
      action: log.action,
      metadata: log.metadata || {},
      created_by: log.created_by,
      created_at: log.created_at,
      user: Array.isArray(log.profiles) ? log.profiles[0] : log.profiles,
    }));

    return {
      logs: formattedLogs,
      totalCount: count ?? formattedLogs.length,
    };
  } catch (err) {
    console.error('Exception in getSystemLogs:', err);
    return { logs: [], totalCount: 0 };
  }
}

export async function getLogMetrics() {
  try {
    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, errorsRes, lastUploadRes] = await Promise.all([
      (supabase.from('system_logs') as any)
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),
      (supabase.from('system_logs') as any)
        .select('id', { count: 'exact', head: true })
        .eq('level', 'error')
        .gte('created_at', twentyFourHoursAgo),
      (supabase.from('system_logs') as any)
        .select('created_at')
        .eq('action', 'YOUTUBE_PUBLISH_SUCCESS')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const totalEvents = totalRes.count ?? 0;
    const errorEvents = errorsRes.count ?? 0;
    const errorRate = totalEvents > 0 ? ((errorEvents / totalEvents) * 100).toFixed(1) : '0.0';
    const lastUploadTime = lastUploadRes.data && lastUploadRes.data.length > 0 ? lastUploadRes.data[0].created_at : null;

    return {
      totalEvents24h: totalEvents,
      errorRate,
      lastUploadTime,
    };
  } catch (err) {
    console.error('Error fetching log metrics:', err);
    return {
      totalEvents24h: 0,
      errorRate: '0.0',
      lastUploadTime: null,
    };
  }
}
