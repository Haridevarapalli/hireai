import React from 'react';
import { getAppliedJobs } from '@/actions/jobActions';
import { CheckCircle, Clock, Search, Briefcase, MapPin, ChevronRight, Circle, XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_PIPELINE = [
  'Applied',
  'AI Screened',
  'Shortlisted',
  'Interview Scheduled',
  'Hired'
];

export default async function AppliedJobsPage() {
  const applications = await getAppliedJobs();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Applied Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">Track the status of your job applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No applications yet</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              You haven't applied to any jobs yet. Check out your AI-matched recommendations to get started.
            </p>
            <Link href="/candidate/dashboard">
              <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                View Recommendations
              </button>
            </Link>
          </div>
        ) : (
          applications.map(({ application, job }) => {
            const isHired = application.status === 'Hired' || application.status === 'Selected' || application.status === 'Offered';
            const isRejected = application.status === 'Rejected';
            const currentStatusIndex = isHired 
              ? 4 
              : application.status === 'Interview Scheduled' || application.status === 'Interview'
              ? 3
              : application.status === 'Shortlisted'
              ? 2
              : application.status === 'AI Screened' || application.status === 'Under Review'
              ? 1
              : application.status === 'Applied'
              ? 0
              : STATUS_PIPELINE.indexOf(application.status);

            return (
              <div key={application.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Job Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                      {job?.companyName?.charAt(0) || 'J'}
                    </div>
                    <div>
                      <Link href={`/candidate/jobs/${job?.id}`}>
                        <h3 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors">
                          {job?.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-500 mt-0.5">{job?.companyName}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5" /> {job?.location}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">
                          {application.matchScore}% Match
                        </div>
                        {isHired && (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            🎉 Hired / Offer Received
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Application Tracker (Status Pipeline) */}
                  <div className="flex-1 w-full lg:max-w-xl">
                    <div className="relative">
                      {/* Background connecting line */}
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden sm:block" />
                      
                      <div className="flex justify-between relative z-10">
                        {isRejected ? (
                          <div className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                            <XCircle className="w-4 h-4" /> Application Rejected
                          </div>
                        ) : (
                          STATUS_PIPELINE.map((status, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;
                            
                            return (
                              <div key={status} className="flex flex-col items-center gap-2 group relative cursor-help">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm text-white text-sm
                                  ${isCompleted ? (isHired && index === 4 ? 'bg-emerald-600 border-2 border-emerald-600' : 'bg-green-500 border-2 border-green-500') : 'bg-white border-2 border-slate-200 text-slate-300'}
                                  ${isCurrent ? (isHired ? 'ring-4 ring-emerald-100' : 'ring-4 ring-green-100') : ''}
                                `}>
                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                </div>
                                <span className={`absolute -bottom-6 w-24 text-center text-[10px] font-semibold hidden sm:block ${isCurrent ? (isHired ? 'text-emerald-700 font-bold' : 'text-green-600') : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {status}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="flex-shrink-0 flex justify-end">
                    <Link href={`/candidate/jobs/${job?.id}`}>
                      <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                        View Job <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
