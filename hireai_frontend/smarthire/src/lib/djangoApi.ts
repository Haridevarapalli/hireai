/**
 * SmartHire Django Backend API Client
 * Seamlessly interfaces the Next.js Frontend & Mobile Capacitor App with the Django REST API.
 */

// Base API URL resolver (Android emulator uses 10.0.2.2 to reach host machine, web uses localhost)
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://10.0.2.2:8000/api';
      }
      return `http://${window.location.hostname}:8000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new Error(errorData.detail || errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[Django API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const djangoApi = {
  // ─── Authentication ──────────────────────────────────────────────────────────
  auth: {
    candidateRegister: (data: any) => apiRequest('/auth/candidate/register/', { method: 'POST', body: JSON.stringify(data) }),
    candidateLogin: (data: any) => apiRequest('/auth/candidate/login/', { method: 'POST', body: JSON.stringify(data) }),
    recruiterRegister: (data: any) => apiRequest('/auth/recruiter/register/', { method: 'POST', body: JSON.stringify(data) }),
    recruiterLogin: (data: any) => apiRequest('/auth/recruiter/login/', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: (token: string) => apiRequest('/auth/profile/', { token }),
  },

  // ─── Candidate Features ──────────────────────────────────────────────────────
  candidate: {
    getDashboard: (token: string) => apiRequest('/candidate/dashboard/', { token }),
    getProfile: (token: string) => apiRequest('/candidate/profile/', { token }),
    uploadResume: (formData: FormData, token: string) => 
      apiRequest('/candidate/resume/upload/', { method: 'POST', body: formData, token }),
    getResumeAnalysis: (token: string) => apiRequest('/candidate/resume/', { token }),
  },

  // ─── Public Jobs ─────────────────────────────────────────────────────────────
  jobs: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiRequest(`/jobs/${query}`);
    },
    getDetails: (jobId: string | number) => apiRequest(`/jobs/${jobId}/`),
    getRecommended: (token: string) => apiRequest('/jobs/recommended/', { token }),
  },

  // ─── Applications ────────────────────────────────────────────────────────────
  applications: {
    getAppliedJobs: (token: string) => apiRequest('/applications/', { token }),
    applyForJob: (jobId: string | number, data: any, token: string) => 
      apiRequest(`/applications/${jobId}/apply/`, { method: 'POST', body: JSON.stringify(data), token }),
    getApplicationDetails: (appId: string | number, token: string) => 
      apiRequest(`/applications/${appId}/`, { token }),
    getAssessments: (token: string) => apiRequest('/assessments/', { token }),
  },

  // ─── Recruiter Features ──────────────────────────────────────────────────────
  recruiter: {
    getDashboard: (token: string) => apiRequest('/recruiter/dashboard/', { token }),
    getJobs: (token: string) => apiRequest('/recruiter/jobs/', { token }),
    createJob: (jobData: any, token: string) => 
      apiRequest('/recruiter/jobs/create/', { method: 'POST', body: JSON.stringify(jobData), token }),
    getApplicants: (token: string) => apiRequest('/recruiter/applicants/', { token }),
    updateApplicantStatus: (applicantId: string | number, status: string, token: string) => 
      apiRequest(`/recruiter/applicants/${applicantId}/status/`, { method: 'POST', body: JSON.stringify({ status }), token }),
    getInterviews: (token: string) => apiRequest('/recruiter/interviews/', { token }),
    scheduleInterview: (interviewData: any, token: string) => 
      apiRequest('/recruiter/interviews/schedule/', { method: 'POST', body: JSON.stringify(interviewData), token }),
    getAnalytics: (token: string) => apiRequest('/recruiter/analytics/', { token }),
    getAiScreening: (token: string) => apiRequest('/recruiter/ai-screening/', { token }),
  },

  // ─── Notifications & Devices ─────────────────────────────────────────────────
  notifications: {
    getAll: (token: string) => apiRequest('/notifications/', { token }),
    registerDevice: (deviceData: any, token: string) => 
      apiRequest('/devices/register/', { method: 'POST', body: JSON.stringify(deviceData), token }),
  },
};
