package com.simats.hireai.network;

import com.google.gson.annotations.SerializedName;

import java.util.List;
import java.util.Map;

public class ApiModels {
    public static class AuthUser {
        public String id;
        @SerializedName("full_name")
        public String fullName;
        public String email;
        public String role;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class SignupRequest {
        @SerializedName("full_name")
        public String fullName;
        public String email;
        public String password;
        public String role;
        public String phone;
    }

    public static class OtpVerifyRequest {
        public String email;
        public String otp;
    }

    public static class OtpResendRequest {
        public String email;
    }

    public static class TokenRefreshRequest {
        public String refresh;
    }

    public static class AuthResponse {
        public AuthUser user;
        public String access;
        public String refresh;
    }

    public static class RefreshResponse {
        public String access;
        public String refresh;
    }

    public static class OtpStartResponse {
        @SerializedName("user_id")
        public String userId;
        public String email;
        public String role;
        @SerializedName("otp_sent")
        public boolean otpSent;
    }

    public static class ApiJob {
        public String id;
        public String title;
        public String company;
        public String location;
        @SerializedName("is_remote")
        public boolean isRemote;
        @SerializedName("role_type")
        public String roleType;
        @SerializedName("salary_min")
        public Integer salaryMin;
        @SerializedName("salary_max")
        public Integer salaryMax;
        public String currency;
        @SerializedName("required_skills")
        public List<String> requiredSkills;
        @SerializedName("min_match_score")
        public int minMatchScore;
        public String status;
        @SerializedName("created_at")
        public String createdAt;
    }

    public static class PublishJobRequest {
        public String title;
        public String company;
        public String location;
        @SerializedName("is_remote")
        public boolean isRemote;
        @SerializedName("role_type")
        public String roleType;
        @SerializedName("salary_min")
        public Integer salaryMin;
        @SerializedName("salary_max")
        public Integer salaryMax;
        public String currency;
        @SerializedName("required_skills")
        public List<String> requiredSkills;
        @SerializedName("min_match_score")
        public int minMatchScore;
    }

    public static class MatchScoreResponse {
        @SerializedName("job_id")
        public int jobId;
        public int score;
        @SerializedName("pass_status")
        public boolean passStatus;
        @SerializedName("missing_keywords")
        public List<String> missingKeywords;
        public int threshold;
        @SerializedName("cooldown_active")
        public Boolean cooldownActive;
        @SerializedName("retry_after_at")
        public String retryAfterAt;
        @SerializedName("top_strengths")
        public List<String> topStrengths;
        @SerializedName("suggested_improvements")
        public List<String> suggestedImprovements;
    }

    public static class ApplyRequest {
        @SerializedName("job_id")
        public int jobId;
    }

    public static class ApplicationDto {
        public int id;
        public int job;
        @SerializedName("candidate_id")
        public Integer candidateId;
        @SerializedName("job_title")
        public String jobTitle;
        public String company;
        @SerializedName("candidate_name")
        public String candidateName;
        @SerializedName("candidate_email")
        public String candidateEmail;
        @SerializedName("match_score")
        public Integer matchScore;
        @SerializedName("hr_score")
        public Float hrScore;
        @SerializedName("tech_score")
        public Float techScore;
        public String status;
        public String location;
        @SerializedName("applied_at")
        public String appliedAt;
        @SerializedName("last_updated")
        public String lastUpdated;
        @SerializedName("next_action")
        public String nextAction;
        @SerializedName("retry_eligible_at")
        public String retryEligibleAt;
        @SerializedName("updated_at")
        public String updatedAt;
        @SerializedName("tech_language")
        public String techLanguage;
        @SerializedName("last_failure_reason")
        public String lastFailureReason;
    }

    public static class ApplicationDetailResponse extends ApplicationDto {
        public List<ApplicationTimelineItem> timeline;
    }

    public static class ApplicationTimelineItem {
        public String stage;
        public String status;
        public Float score;
        public Integer threshold;
        public String language;
        public String at;
    }

    public static class AssessmentSubmitRequest {
        public Float score;
        public java.util.List<AssessmentAnswerRequest> responses;
    }

    public static class SelectLanguageRequest {
        public String language;
    }

    public static class AssessmentStartResponse {
        @SerializedName("session_id")
        public int sessionId;
        @SerializedName("application_id")
        public int applicationId;
        public String stage;
        public String language;
        public String status;
        @SerializedName("ends_at")
        public String endsAt;
        @SerializedName("duration_secs")
        public int durationSecs;
        @SerializedName("total_questions")
        public int totalQuestions;
        @SerializedName("answered_questions")
        public int answeredQuestions;
        @SerializedName("exam_mode")
        public String examMode;
        public java.util.List<AssessmentQuestionDto> questions;
    }

    public static class AssessmentQuestionDto {
        public int id;
        public String prompt;
        public java.util.List<String> options;
        public java.util.List<String> tags;
        @SerializedName("selected_option_index")
        public Integer selectedOptionIndex;
        @SerializedName("is_correct")
        public Boolean isCorrect;
        public String explanation;
        @SerializedName("correct_option")
        public Integer correctOption;
    }

    public static class AssessmentQuestionsPageResponse {
        public java.util.List<AssessmentQuestionDto> questions;
        public AssessmentProgress progress;
        @SerializedName("ends_at")
        public String endsAt;
        public String status;
    }

    public static class AssessmentProgress {
        public int page;
        @SerializedName("page_size")
        public int pageSize;
        @SerializedName("total_questions")
        public int totalQuestions;
        @SerializedName("answered_questions")
        public int answeredQuestions;
    }

    public static class AssessmentAnswerRequest {
        @SerializedName("question_id")
        public int questionId;
        @SerializedName("selected_option_index")
        public int selectedOptionIndex;
        @SerializedName("time_spent_ms")
        public long timeSpentMs;
    }

    public static class AssessmentAnswerResponse {
        public boolean saved;
        @SerializedName("session_id")
        public int sessionId;
        @SerializedName("question_id")
        public int questionId;
    }

    public static class AssessmentSubmitResult {
        public float score;
        public boolean pass;
        public int threshold;
        public AssessmentBreakdown breakdown;
        public java.util.List<AssessmentReviewItem> review;
        @SerializedName("exam_mode")
        public String examMode;
    }

    public static class AssessmentBreakdown {
        @SerializedName("total_questions")
        public int totalQuestions;
        @SerializedName("correct_answers")
        public int correctAnswers;
    }

    public static class AssessmentReviewItem {
        @SerializedName("question_id")
        public int questionId;
        public String prompt;
        public java.util.List<String> options;
        @SerializedName("selected_option")
        public Integer selectedOption;
        @SerializedName("correct_option")
        public Integer correctOption;
        @SerializedName("is_correct")
        public boolean isCorrect;
        public String explanation;
    }

    public static class AssessmentStatusResponse extends AssessmentStartResponse {
        @SerializedName("remaining_secs")
        public Integer remainingSecs;
        public java.util.List<AssessmentAnswerState> answers;
    }

    public static class AssessmentAnswerState {
        @SerializedName("question_id")
        public int questionId;
        @SerializedName("selected_option_index")
        public Integer selectedOptionIndex;
        @SerializedName("is_correct")
        public Boolean isCorrect;
        @SerializedName("time_spent_ms")
        public long timeSpentMs;
    }

    public static class OfferDto {
        public int id;
        public int application;
        public String status;
        @SerializedName("offer_pdf_url")
        public String offerPdfUrl;
        @SerializedName("signed_pdf_url")
        public String signedPdfUrl;
    }

    public static class RecruiterOfferDto {
        public int id;
        public int application;
        @SerializedName("candidate_name")
        public String candidateName;
        public String role;
        @SerializedName("candidate_email")
        public String candidateEmail;
        @SerializedName("job_title")
        public String jobTitle;
        public String company;
        @SerializedName("application_status")
        public String applicationStatus;
        public String status;
        @SerializedName("created_at")
        public String createdAt;
    }

    public static class RecruiterProfileResponse {
        @SerializedName("full_name")
        public String fullName;
        public String email;
        @SerializedName("company_name")
        public String companyName;
        public String title;
        public String phone;
        @SerializedName("linkedin_url")
        public String linkedinUrl;
        public String bio;
    }

    public static class RecruiterProfileUpdateRequest {
        @SerializedName("full_name")
        public String fullName;
        @SerializedName("company_name")
        public String companyName;
        public String title;
        public String phone;
        @SerializedName("linkedin_url")
        public String linkedinUrl;
        public String bio;
    }

    public static class RecruiterCandidateProfileResponse {
        @SerializedName("application_id")
        public int applicationId;
        @SerializedName("job_id")
        public int jobId;
        @SerializedName("job_title")
        public String jobTitle;
        @SerializedName("application_status")
        public String applicationStatus;
        public CandidateInfo candidate;
        public ScoreBundle scores;
        @SerializedName("parsed_resume_json")
        public Map<String, Object> parsedResumeJson;
    }

    public static class CandidateInfo {
        public int id;
        @SerializedName("full_name")
        public String fullName;
        public String email;
        public String phone;
        public String role;
        public String location;
    }

    public static class ScoreBundle {
        public AssessmentScore hr;
        public AssessmentScore tech;
    }

    public static class AssessmentScore {
        public Float score;
        public Boolean pass;
        public String status;
        public Integer threshold;
    }

    public static class DashboardActivityItem {
        public String id;
        public String type;
        public String title;
        public String body;
        @SerializedName("created_at")
        public String createdAt;
        public Map<String, Object> metadata;
    }

    public static class RecruiterDashboardResponse {
        @SerializedName("live_jobs_count")
        public int liveJobsCount;
        @SerializedName("new_applicants_count")
        public int newApplicantsCount;
        @SerializedName("offers_sent_count")
        public int offersSentCount;
        @SerializedName("interviews_count")
        public int interviewsCount;
        @SerializedName("recent_activity")
        public List<DashboardActivityItem> recentActivity;
    }

    public static class NotificationDto {
        public long id;
        public String type;
        public String title;
        public String body;
        @SerializedName("created_at")
        public String createdAt;
        public boolean read;
        public Map<String, Object> payload;
    }

    public static class DeviceRegisterRequest {
        public String token;
        public String platform;
    }

    public static class DeviceRegisterResponse {
        public boolean registered;
        public long id;
    }

    public static class SignOfferRequest {
        @SerializedName("signature_image_url")
        public String signatureImageUrl;
        @SerializedName("accepted_terms")
        public boolean acceptedTerms;
    }

    public static class AcceptOfferRequest {
        public boolean accepted = true;
    }

    public static class ResumeUploadResponse {
        @SerializedName("resume_file_url")
        public String resumeFileUrl;
        @SerializedName("resume_id")
        public String resumeId;
        public String filename;
        @SerializedName("parse_job_id")
        public String parseJobId;
    }

    public static class ResumeParseRequest {
        @SerializedName("resume_text")
        public String resumeText;
        @SerializedName("parsed_resume_json")
        public Map<String, Object> parsedResumeJson;
    }

    public static class ResumeParseResponse {
        @SerializedName("parsed_resume_json")
        public Map<String, Object> parsedResumeJson;
        public boolean parsed;
    }

    public static class ResumeParseStatusResponse {
        @SerializedName("job_id")
        public String jobId;
        public String status;
        public int progress;
        public String stage;
        public String message;
    }

    public static class CandidateProfileResponse {
        @SerializedName("full_name")
        public String fullName;
        public String email;
        public String phone;
        public String role;
        @SerializedName("tech_stacks")
        public List<String> techStacks;
        @SerializedName("resume_file_url")
        public String resumeFileUrl;
        @SerializedName("resume_id")
        public String resumeId;
        @SerializedName("resume_hash")
        public String resumeHash;
        @SerializedName("parse_status")
        public String parseStatus;
        @SerializedName("parsed_resume_json")
        public Map<String, Object> parsedResumeJson;
        @SerializedName("updated_at")
        public String updatedAt;
    }

    public static class CandidateProfileUpdateRequest {
        @SerializedName("full_name")
        public String fullName;
        public String phone;
        @SerializedName("tech_stacks")
        public List<String> techStacks;
        @SerializedName("parsed_resume_json")
        public Map<String, Object> parsedResumeJson;
    }

    public static class GenericSuccessResponse {
        public boolean removed;
    }
}
