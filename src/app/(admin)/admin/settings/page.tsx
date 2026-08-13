import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Studio Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure global automation parameters, API integrations, and security policies.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Supabase Connection</h2>
          <p className="text-xs text-slate-400 mb-4">Environment settings linked via .env.local</p>
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="block text-xs text-slate-400 mb-1">App URL</label>
              <input
                type="text"
                readOnly
                value="http://localhost:3000"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
