'use client';

import React, { useState, useTransition } from 'react';
import { UserPlus, ShieldCheck, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createManagerAccountAction } from '@/app/(admin)/admin/settings/actions';

interface ManagerInviteClientProps {
  existingProfiles: any[];
}

export function ManagerInviteClient({ existingProfiles }: ManagerInviteClientProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [resultMsg, setResultMsg] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await createManagerAccountAction(formData);
      if (res.error) {
        setResultMsg({ error: res.error });
      } else {
        setResultMsg({ success: true });
        setFullName('');
        setEmail('');
        setPassword('');
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">API Credentials & Studio Security</h1>
            <p className="text-xs text-slate-400">Owner-only provisioning of Manager accounts and OAuth credentials.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Manager Account Provisioning Form (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">Provision New Manager Account</h2>
            </div>

            {resultMsg?.error && (
              <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{resultMsg.error}</span>
              </div>
            )}

            {resultMsg?.success && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manager account provisioned successfully! They can now access the studio.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    required
                    disabled={isPending}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@vidstack.dev"
                    required
                    disabled={isPending}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Initial Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isPending}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning Manager...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" /> Provision Manager Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Existing Studio Team Members List (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Studio Personnel Roster</h3>
            </div>

            <div className="space-y-3">
              {existingProfiles.map((prof) => (
                <div
                  key={prof.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-200 truncate">{prof.full_name || 'Studio Personnel'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{prof.email}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      prof.role === 'owner'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-sky-950 text-sky-300 border border-sky-800'
                    }`}
                  >
                    {prof.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
