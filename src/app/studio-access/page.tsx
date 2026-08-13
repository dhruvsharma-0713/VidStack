'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video, Mail, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginWithEmail, loginWithGoogle } from '@/app/auth/actions';

function StudioAccessContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [isEmailPending, startEmailTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const getErrorMessage = (err: string | null) => {
    if (!err) return null;
    switch (err) {
      case 'unauthorized':
        return 'Access restricted. Owner permissions required to access that area.';
      case 'invalid_credentials':
        return 'Invalid credentials. Please verify your email and password.';
      case 'auth_failed':
        return 'Authentication process failed. Please try again.';
      default:
        return err.replace(/_/g, ' ');
    }
  };

  const displayedError = formError || getErrorMessage(rawError);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    startEmailTransition(async () => {
      const result = await loginWithEmail(formData);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  const handleGoogleSignIn = () => {
    setFormError(null);
    startGoogleTransition(async () => {
      const result = await loginWithGoogle();
      if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
          <Video className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Studio Operational Access</h1>
        <p className="text-xs text-slate-400">Private authentication portal for studio personnel</p>
      </div>

      {/* Alert Banner for Errors */}
      {displayedError && (
        <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl flex items-start space-x-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{displayedError}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@vidstack.dev"
              required
              disabled={isEmailPending || isGooglePending}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isEmailPending || isGooglePending}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isEmailPending || isGooglePending}
          className="w-full h-11 text-sm font-semibold rounded-xl"
        >
          {isEmailPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Studio <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider absolute">
          or authenticate with
        </span>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isEmailPending || isGooglePending}
        className="w-full h-11 bg-slate-950 border border-slate-800 hover:bg-slate-800/80 text-slate-200 text-sm font-medium rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
      >
        {isGooglePending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" />
            Connecting to Google...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.6-.8-1-1.7-1-2.7z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Sign In with Google</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function StudioAccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            Loading Studio Portal...
          </div>
        }
      >
        <StudioAccessContent />
      </Suspense>
    </div>
  );
}
