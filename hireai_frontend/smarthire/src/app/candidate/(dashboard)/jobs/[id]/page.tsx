import React from 'react';
import { getJobDetails } from '@/actions/jobActions';
import { parseArray } from '@/utils/scoring';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  ChevronLeft,
  Building2,
  Sparkles,
} from 'lucide-react';
import ApplyButton from './ApplyButton';

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const jobId = parseInt(resolvedParams.id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  const job = await getJobDetails(jobId);

  if (!job) {
    notFound();
  }

  const requirements = parseArray(job.requirements);
  const responsibilities = parseArray(job.responsibilities);
  const benefits = parseArray(job.benefits);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Browse Jobs
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 shadow-md">
              {job.companyName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
              <p className="text-base text-slate-500 mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {job.companyName}
              </p>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {job.salary}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" /> {job.type}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> {job.experience}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px]">
            <div className="px-4 py-2 bg-emerald-50/80 rounded-xl border border-emerald-200 w-full text-center">
              <span className="text-emerald-700 font-bold text-base flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {job.matchScore || 80}% AI Match
              </span>
            </div>
            <ApplyButton
              jobId={job.id}
              matchScore={job.matchScore || 80}
              hasApplied={!!job.hasApplied}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Job Description</h2>
            <p className="text-slate-600 leading-relaxed text-sm">{job.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {requirements.map((req: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Responsibilities</h2>
            <ul className="space-y-2.5">
              {responsibilities.map((res: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{res}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3">Perks & Benefits</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((ben: string, i: number) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Match Analysis Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">AI Match Analysis</h2>

            <div className="mb-5">
              <h3 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.matchedSkills?.length > 0 ? (
                  job.matchedSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No matched skills recorded</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500" /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.missingSkills?.length > 0 ? (
                  job.missingSkills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No missing skills detected</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Application Deadline
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{job.deadline || 'Open until filled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
