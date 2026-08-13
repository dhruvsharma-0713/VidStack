import React from 'react';

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">VidStack Engineering & Insights</h1>
        <p className="text-slate-400 text-sm mt-2">Latest updates, tutorials, and deep dives into automated video pipelines.</p>
      </div>

      <div className="space-y-6">
        {[
          {
            title: 'Scaling Multi-Channel YouTube Publishing with Next.js 14 and Supabase',
            date: 'August 12, 2026',
            excerpt: 'How we built a robust RLS security architecture and seamless OAuth refresh workflow for channels.',
          },
          {
            title: 'Automating Video Rendering with WebGL & Serverless Queue',
            date: 'August 05, 2026',
            excerpt: 'Optimizing background jobs for fast video processing and automated YouTube uploads.',
          },
        ].map((post, idx) => (
          <article key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
            <span className="text-xs text-indigo-400 font-medium">{post.date}</span>
            <h2 className="text-xl font-semibold text-slate-200 mt-1">{post.title}</h2>
            <p className="text-slate-400 text-sm mt-2">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
