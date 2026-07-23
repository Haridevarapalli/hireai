import React from 'react';
import { getJobDetails, applyForJob } from '@/actions/jobActions';
import { parseArray } from '@/utils/scoring';
import { notFound } from 'next/navigation';
import { MapPin, DollarSign, Clock, CheckCircle, XCircle, Briefcase, Calendar } from 'lucide-react';
import ApplyButton from './ApplyButton';

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await getJobDetails(parseInt(params.id));
  
  if (!job) {
    notFound();
  }

  const requirements = parseArray(job.requirements);
  const responsibilities = parseArray(job.responsibilities);
  const benefits = parseArray(job.benefits);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
              {job.companyName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
              <p className="text-lg text-slate-500 mt-1">{job.companyName}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" /> {job.location}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <DollarSign className="w-4 h-4" /> {job.salary}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Briefcase className="w-4 h-4" /> {job.type}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="w-4 h-4" /> {job.experience}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
            <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100 w-full text-center">
              <span className="text-green-600 font-bold text-lg">{job.matchScore}% Match</span>
            </div>
            <ApplyButton jobId={job.id} matchScore={job.matchScore} hasApplied={job.hasApplied} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Job Description</h2>
            <p className="text-slate-600 leading-relaxed text-sm">{job.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Required Skills</h2>
            <ul className="flex flex-wrap gap-2">
              {requirements.map((req: string, i: number) => (
                <li key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-100">
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Responsibilities</h2>
            <ul className="space-y-3">
              {responsibilities.map((res: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{res}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Benefits</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((ben: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Match Analysis Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Match Analysis</h2>
            
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.matchedSkills?.length > 0 ? job.matchedSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100">
                    {skill}
                  </span>
                )) : (
                  <span className="text-xs text-slate-400">No matched skills</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500" /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.missingSkills?.length > 0 ? job.missingSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
                    {skill}
                  </span>
                )) : (
                  <span className="text-xs text-slate-400">No missing skills</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Application Deadline</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{job.deadline}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
