'use client';

import React, { useState } from 'react';
import { applyForJob } from '@/actions/jobActions';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyButton({ jobId, matchScore, hasApplied }: { jobId: number, matchScore: number, hasApplied: boolean }) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const router = useRouter();

  const handleApply = async () => {
    if (applied) return;
    setLoading(true);
    const result = await applyForJob(jobId, matchScore);
    if (result.success) {
      setApplied(true);
      router.refresh();
    }
    setLoading(false);
  };

  if (applied) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl opacity-90 cursor-not-allowed">
        <CheckCircle className="w-5 h-5" /> Applied ✓
      </button>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      {loading ? "Applying..." : "Apply Now"}
    </button>
  );
}
