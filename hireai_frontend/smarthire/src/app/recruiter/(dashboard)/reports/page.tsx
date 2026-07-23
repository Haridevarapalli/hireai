"use client";

import React, { useState } from "react";
import { FileBarChart, Download, FileText, LayoutList, PieChart, Loader2, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (reportName: string) => {
    setGenerating(reportName);
    setTimeout(() => {
      setGenerating(null);
      alert(`${reportName} has been downloaded successfully.`);
    }, 1500);
  };

  const reports = [
    {
      id: "candidate-report",
      title: "Candidate Demographics & Quality",
      description: "Detailed report on candidate backgrounds, education levels, and average ATS match scores.",
      icon: LayoutList,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      id: "hiring-report",
      title: "Hiring Funnel & Velocity",
      description: "Analysis of conversion rates between stages and time-to-hire metrics for all open positions.",
      icon: PieChart,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      id: "ats-report",
      title: "ATS System Performance",
      description: "Metrics on AI screening accuracy, parsing errors, and automated rejection statistics.",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-indigo-500" />
            Reporting & Exports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Generate and download comprehensive hiring reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.bgColor} ${report.color}`}>
              <report.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{report.title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">{report.description}</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleGenerate(`${report.title} (PDF)`)}
                disabled={generating !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
              >
                {generating === `${report.title} (PDF)` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export as PDF
              </button>
              <button 
                onClick={() => handleGenerate(`${report.title} (Excel)`)}
                disabled={generating !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-xl border border-green-200 transition-colors disabled:opacity-50"
              >
                {generating === `${report.title} (Excel)` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export as Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mt-6 flex items-start gap-4">
        <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-indigo-900 mb-1">Automated Weekly Reports</h4>
          <p className="text-sm text-indigo-700 mb-4">You can configure automated reports to be sent directly to your inbox every Monday morning.</p>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Configure Automation
          </button>
        </div>
      </div>
    </div>
  );
}
