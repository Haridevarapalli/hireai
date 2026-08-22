'use client';

import React, { useState } from 'react';
import { applyForJob } from '@/actions/jobActions';
import { CheckCircle, Loader2, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApplyButton({
  jobId,
  matchScore,
  hasApplied,
}: {
  jobId: number;
  matchScore: number;
  hasApplied: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleApply = async () => {
    if (applied || loading) return;
    setLoading(true);
    const result = await applyForJob(jobId, matchScore);
    if (result.success) {
      setApplied(true);
      setToastMsg('Application submitted successfully to company!');
      setTimeout(() => setToastMsg(null), 3500);
      router.refresh();
    } else {
      setToastMsg(result.error || 'Failed to submit application.');
      setTimeout(() => setToastMsg(null), 3500);
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {applied ? (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl cursor-not-allowed shadow-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Already Applied ✓
        </button>
      ) : (
        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Application...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Apply Now
            </>
          )}
        </button>
      )}
    </div>
  );
}
