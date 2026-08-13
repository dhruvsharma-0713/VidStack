export type UserRole = 'owner' | 'partner';
export type VideoStatus = 'draft' | 'generating' | 'rendered' | 'published' | 'failed';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error';

export interface Profile {
  id: string; // UUID references auth.users
  email: string;
  full_name: string | null;
  role: UserRole;
  equity_share: number;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string; // UUID
  channel_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  refresh_token: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string; // UUID
  channel_id: string | null;
  title: string;
  script: string | null;
  seo_tags: string[] | null;
  status: VideoStatus;
  video_url: string | null;
  youtube_video_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationJob {
  id: string; // UUID
  video_id: string;
  status: JobStatus;
  progress: number;
  current_step: string;
  payload: Record<string, unknown>;
  error_message: string | null;
  worker_id: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemLog {
  id: string; // UUID
  level: LogLevel;
  action: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      channels: {
        Row: Channel;
        Insert: Omit<Channel, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Channel, 'id'>>;
      };
      videos: {
        Row: Video;
        Insert: Omit<Video, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Video, 'id'>>;
      };
      generation_jobs: {
        Row: GenerationJob;
        Insert: Omit<GenerationJob, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<GenerationJob, 'id'>>;
      };
      system_logs: {
        Row: SystemLog;
        Insert: Omit<SystemLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SystemLog, 'id'>>;
      };
    };
  };
}
