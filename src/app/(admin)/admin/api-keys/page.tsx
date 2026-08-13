import React from 'react';
import { Key, ShieldAlert } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">API Keys & Credentials</h1>
        <p className="text-xs text-slate-400 mt-1">Manage API keys, secrets, and third-party integrations (Strict Owner Access Only).</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Owner Credentials Vault</span>
        </div>
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-slate-400">YouTube Data API v3 Key:</span>
            <span className="text-slate-300">••••••••••••••••••••••••••••</span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-slate-400">Supabase Service Role Key:</span>
            <span className="text-slate-300">••••••••••••••••••••••••••••</span>
          </div>
        </div>
      </div>
    </div>
  );
}
