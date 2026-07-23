"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Brain,
  Sparkles,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Download,
  RotateCw,
  X,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { analyzeResume, ATSResult, jobRoles } from "@/lib/atsScoring";
import { saveATSResult } from "@/actions/resumeActions";

export default function ResumeAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadExistingResume() {
      const { getResume } = await import('@/actions/resumeActions');
      const { parseArray } = await import('@/utils/scoring');
      const existingResume = await getResume();
      if (existingResume && existingResume.overallScore && existingResume.scoreBreakdown) {
        
        const safeParseObj = (val: any, fallback: any) => {
          if (!val) return fallback;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return fallback; }
          }
          return val;
        };

        setResult({
          overallScore: existingResume.overallScore,
          breakdown: safeParseObj(existingResume.scoreBreakdown, {}),
          extracted: {
            name: existingResume.extractedName === "Not Found" || !existingResume.extractedName 
                    ? existingResume.fileName 
                    : existingResume.extractedName,
            email: existingResume.extractedEmail,
            phone: existingResume.extractedPhone,
            skills: parseArray(existingResume.skills),
            education: parseArray(existingResume.education),
            projects: parseArray(existingResume.projects),
            certifications: parseArray(existingResume.certifications),
          },
          feedback: safeParseObj(existingResume.feedback, { missingSkills: [], weakSections: [], strengths: [], suggestions: [] })
        });
      }
    }
    loadExistingResume();
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      throw new Error("Failed to parse PDF. Please ensure the file is a valid text-based PDF (not scanned images).");
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (uploadedFile.type !== "application/pdf" && uploadedFile.type !== "text/plain") {
      setError("Please upload a PDF or TXT file.");
      return;
    }
    setFile(uploadedFile);
    setError(null);
    setResult(null);
  };

  const processResume = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error("No text found in the document.");
      }

      // Simulate a slightly longer processing time for UX
      await new Promise((r) => setTimeout(r, 1200));

      const analysisResult = analyzeResume(text, targetRole);
      
      if (analysisResult.extracted.name === "Not Found" || !analysisResult.extracted.name) {
        analysisResult.extracted.name = file.name;
      }

      // Save it to the database so it updates everywhere
      await saveATSResult(file.name, text, analysisResult);

      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const safeScore = (categoryData: any) => {
    if (!categoryData || typeof categoryData.score !== 'number' || typeof categoryData.max !== 'number') return 0;
    return (categoryData.score / categoryData.max) * 100;
  };

  const radarData = result && result.breakdown ? [
    { category: "Contact Info", score: safeScore(result.breakdown.contact) },
    { category: "Structure", score: safeScore(result.breakdown.structure) },
    { category: "Education", score: safeScore(result.breakdown.education) },
    { category: "Tech Skills", score: safeScore(result.breakdown.skills) },
    { category: "Projects", score: safeScore(result.breakdown.projects) },
    { category: "Experience", score: safeScore(result.breakdown.experience) },
    { category: "Keywords", score: safeScore(result.breakdown.keywordMatch) },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resume Analyzer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Calculate your actual ATS score using transparent algorithmic scanning.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {Object.keys(jobRoles).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          
          {result && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setResult(null);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload New
            </motion.button>
          )}

          {!result && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={processResume}
              disabled={!file || isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              Analyze Now
            </motion.button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      {!result && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center relative"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            accept=".pdf,.txt"
            className="hidden"
          />
          
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                <FileText className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">{file.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                onClick={() => setFile(null)}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer group">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                <Upload className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">Upload Your Resume</h3>
              <p className="text-sm text-slate-400 mb-4">Drag and drop your PDF or TXT file, or click to browse</p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 font-medium text-sm rounded-xl border border-blue-200 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-4 h-4" />
                Select File
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500 mt-4 font-medium">{error}</p>}
        </motion.div>
      )}

      {/* Analyzing State */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center min-h-[300px]"
        >
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
            ></motion.div>
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzing Resume...</h3>
          <p className="text-sm text-slate-500">Scanning structure, keywords, and skills</p>
        </motion.div>
      )}

      {/* Results Section */}
      {result && !isAnalyzing && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-semibold text-white">Analysis Complete</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Overall ATS Score</h2>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                    This score is calculated based on our 100-point algorithmic rubric. A score above 75 indicates a strong, well-structured resume that is highly compatible with ATS software.
                  </p>
                </div>
                
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                    <motion.circle
                      cx="32" cy="32" r="28" stroke="#3b82f6" strokeWidth="6" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - result.overallScore / 100) }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{result.overallScore}</span>
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Breakdown & Radar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Score Breakdown List */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Score Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(result.breakdown || {})
                      .filter(([_, data]: [string, any]) => data && typeof data.score === 'number' && typeof data.max === 'number')
                      .map(([key, data]: [string, any]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-600 capitalize">
                            {key === 'keywordMatch' ? 'Keyword Match' : key}
                          </span>
                          <span className="font-bold text-slate-800">{data.score}/{data.max}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.score / data.max) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${
                              (data.score / data.max) >= 0.8 ? 'bg-green-500' :
                              (data.score / data.max) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Category Analysis</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: Extracted Info & Feedback */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Extracted Details */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    Extracted Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Candidate Details</p>
                      <p className="text-sm font-medium text-slate-700">{result.extracted.name}</p>
                      {result.extracted.email && <p className="text-sm text-slate-500">{result.extracted.email}</p>}
                      {result.extracted.phone && <p className="text-sm text-slate-500">{result.extracted.phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Education & Certs</p>
                      {result.extracted.education.length > 0 ? (
                        result.extracted.education.map((e: any, i: number) => {
                          const displayText = typeof e === 'string' ? e : (e.degree ? `${e.degree} at ${e.college}` : JSON.stringify(e));
                          return <p key={i} className="text-sm text-slate-600 mb-1">{displayText}</p>;
                        })
                      ) : <p className="text-sm text-red-500">No education found</p>}
                      {result.extracted.certifications.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Certifications</p>
                          {result.extracted.certifications.map((c: any, i: number) => {
                            const displayText = typeof c === 'string' ? c : (c.name ? c.name : JSON.stringify(c));
                            return <p key={i} className="text-sm text-slate-600">{displayText}</p>;
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical Skills Detected</p>
                    {result.extracted.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.extracted.skills.map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500">No recognizable skills found</p>
                    )}
                  </div>
                </div>

                {/* Feedback Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Missing Skills */}
                  <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6">
                    <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Missing Keywords for {targetRole}
                    </h3>
                    {result.feedback.missingSkills.length > 0 ? (
                      <ul className="space-y-2">
                        {result.feedback.missingSkills.map((s, i) => (
                          <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600">Great job! You matched all target keywords.</p>
                    )}
                  </div>

                  {/* Strengths */}
                  <div className="bg-green-50/50 rounded-2xl border border-green-100 p-6">
                    <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.feedback.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Suggestions */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Improvement Suggestions
                  </h3>
                  {result.feedback.suggestions.length > 0 ? (
                    <ul className="space-y-3">
                      {result.feedback.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                            !
                          </div>
                          <span className="text-sm text-slate-600">{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Your resume looks excellent. No major suggestions.</p>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
