package com.simats.hireai;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

public class CandidateStateStore {
    private static final String PREFS = "hireai_candidate_state";
    private static final String KEY_ONBOARDING_SEEN = "candidate_onboarding_seen";
    private static final String KEY_LOGGED_IN = "candidate_logged_in";
    private static final String KEY_CANDIDATE_ONBOARDING_SEEN = "candidate_flow_onboarding_seen";
    private static final String KEY_TECH_STACK_COMPLETE = "candidate_tech_stack_complete";
    private static final String KEY_TECH_STACK_SKIPPED = "candidate_tech_stack_skipped";
    private static final String KEY_TECH_STACKS = "candidate_tech_stacks_csv";
    private static final String KEY_RESUME_UPLOADED = "candidate_resume_uploaded";
    private static final String KEY_RESUME_PARSED = "candidate_resume_parsed";
    private static final String KEY_RESUME_SKIPPED = "candidate_resume_skipped";
    private static final String KEY_RESUME_UPDATED_AT = "candidate_resume_updated_at";
    private static final String KEY_APPLICATION_COUNT = "candidate_application_count";
    private static final String KEY_SELECTED_JOB_TITLE = "candidate_selected_job_title";
    private static final String KEY_SELECTED_JOB_ID = "candidate_selected_job_id";
    private static final String KEY_PER_JOB_PIPELINE = "candidate_per_job_pipeline_json";
    private static final String KEY_PARSED_SKILLS = "candidate_parsed_skills";
    private static final String KEY_PARSED_EXPERIENCE = "candidate_parsed_experience";
    private static final String KEY_PARSED_EDUCATION = "candidate_parsed_education";
    private static final String KEY_LAST_MATCH_SCORE = "candidate_last_match_score";
    private static final String KEY_PER_JOB_APPLICATION_ID = "candidate_per_job_application_id_json";
    private static final String KEY_CANDIDATE_NAME = "candidate_name";
    private static final String KEY_CANDIDATE_EMAIL = "candidate_email";
    private static final String KEY_TOP_STRENGTHS = "candidate_top_strengths_csv";
    private static final String KEY_SUGGESTED_IMPROVEMENTS = "candidate_suggested_improvements_csv";
    private static final String KEY_RESUME_FILE_NAME = "candidate_resume_file_name";
    private static final String KEY_RESUME_PARSE_JOB_ID = "candidate_resume_parse_job_id";
    private static final String KEY_RESUME_ID = "candidate_resume_id";
    private static final String KEY_PROGRESS_MODE = "candidate_progress_mode";
    private static final String KEY_LAST_MATCH_THRESHOLD = "candidate_last_match_threshold";
    private static final String KEY_LAST_MATCH_RETRY_AT = "candidate_last_match_retry_at";
    private static final String KEY_ACTIVE_ASSESSMENT_JSON = "candidate_active_assessment_json";
    private static final String KEY_ACTIVE_ASSESSMENT_QUESTIONS_JSON = "candidate_active_assessment_questions_json";
    private static final String KEY_ACTIVE_ASSESSMENT_REVIEW_JSON = "candidate_active_assessment_review_json";
    private static final String KEY_ACTIVE_ASSESSMENT_RESULT_JSON = "candidate_active_assessment_result_json";

    private final SharedPreferences prefs;

    public CandidateStateStore(Context context) {
        this.prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public CandidateOnboardingState getState() {
        return new CandidateOnboardingState(
                prefs.getBoolean(KEY_ONBOARDING_SEEN, false),
                prefs.getBoolean(KEY_CANDIDATE_ONBOARDING_SEEN, false),
                prefs.getBoolean(KEY_LOGGED_IN, false),
                prefs.getBoolean(KEY_TECH_STACK_COMPLETE, false),
                prefs.getBoolean(KEY_TECH_STACK_SKIPPED, false),
                prefs.getBoolean(KEY_RESUME_UPLOADED, false),
                prefs.getBoolean(KEY_RESUME_PARSED, false),
                prefs.getBoolean(KEY_RESUME_SKIPPED, false),
                prefs.getLong(KEY_RESUME_UPDATED_AT, 0L),
                prefs.getInt(KEY_APPLICATION_COUNT, 0),
                prefs.getString(KEY_SELECTED_JOB_TITLE, ""),
                prefs.getString(KEY_SELECTED_JOB_ID, "")
        );
    }

    public String getSelectedJobId() {
        return prefs.getString(KEY_SELECTED_JOB_ID, "");
    }

    public int getLastMatchScore() {
        return prefs.getInt(KEY_LAST_MATCH_SCORE, 0);
    }

    public String getParsedSkillsCsv() {
        return prefs.getString(KEY_PARSED_SKILLS, "Java,Python,React,SQL");
    }

    public String getParsedExperience() {
        return prefs.getString(KEY_PARSED_EXPERIENCE, "Mid Level");
    }

    public String getParsedEducation() {
        return prefs.getString(KEY_PARSED_EDUCATION, "Bachelor of Science in Computer Science");
    }

    public String getCandidateDisplayName() {
        return prefs.getString(KEY_CANDIDATE_NAME, "");
    }

    public String getCandidateEmail() {
        return prefs.getString(KEY_CANDIDATE_EMAIL, "");
    }

    public String getTopStrengthsCsv() {
        return prefs.getString(KEY_TOP_STRENGTHS, "");
    }

    public String getSuggestedImprovementsCsv() {
        return prefs.getString(KEY_SUGGESTED_IMPROVEMENTS, "");
    }

    public String getResumeFileName() {
        return prefs.getString(KEY_RESUME_FILE_NAME, "");
    }

    public String getResumeParseJobId() {
        return prefs.getString(KEY_RESUME_PARSE_JOB_ID, "");
    }

    public String getResumeId() {
        return prefs.getString(KEY_RESUME_ID, "");
    }

    public String getProgressMode() {
        return prefs.getString(KEY_PROGRESS_MODE, "RESUME_PARSE");
    }

    public int getLastMatchThreshold() {
        return prefs.getInt(KEY_LAST_MATCH_THRESHOLD, 0);
    }

    public String getLastMatchRetryAt() {
        return prefs.getString(KEY_LAST_MATCH_RETRY_AT, "");
    }

    public void setLoggedIn(boolean value) {
        prefs.edit().putBoolean(KEY_LOGGED_IN, value).apply();
    }

    public void setTechStackComplete(boolean value) {
        prefs.edit().putBoolean(KEY_TECH_STACK_COMPLETE, value).apply();
    }

    public void setCandidateOnboardingSeen(boolean value) {
        prefs.edit().putBoolean(KEY_CANDIDATE_ONBOARDING_SEEN, value).apply();
    }

    public void setTechStackSkipped(boolean value) {
        prefs.edit().putBoolean(KEY_TECH_STACK_SKIPPED, value).apply();
    }

    public Set<String> getTechStacks() {
        String csv = prefs.getString(KEY_TECH_STACKS, "");
        Set<String> out = new HashSet<>();
        if (csv == null || csv.trim().isEmpty()) {
            return out;
        }
        String[] parts = csv.split(",");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                out.add(trimmed);
            }
        }
        return out;
    }

    public void setTechStacks(Set<String> stacks) {
        StringBuilder builder = new StringBuilder();
        if (stacks != null) {
            for (String stack : stacks) {
                if (stack == null || stack.trim().isEmpty()) {
                    continue;
                }
                if (builder.length() > 0) {
                    builder.append(",");
                }
                builder.append(stack.trim());
            }
        }
        prefs.edit().putString(KEY_TECH_STACKS, builder.toString()).apply();
    }

    public void setResumeUploaded(boolean value) {
        prefs.edit().putBoolean(KEY_RESUME_UPLOADED, value).apply();
    }

    public void setParsedResume(boolean value) {
        prefs.edit().putBoolean(KEY_RESUME_PARSED, value).apply();
    }

    public void setResumeSkipped(boolean value) {
        prefs.edit().putBoolean(KEY_RESUME_SKIPPED, value).apply();
    }

    public void setLastResumeUpdatedAt(long timestamp) {
        prefs.edit().putLong(KEY_RESUME_UPDATED_AT, timestamp).apply();
    }

    public void setApplicationCount(int count) {
        prefs.edit().putInt(KEY_APPLICATION_COUNT, Math.max(0, count)).apply();
    }

    public void incrementApplicationCount() {
        setApplicationCount(getState().applicationCount + 1);
    }

    public void setSelectedJobTitle(String title) {
        prefs.edit().putString(KEY_SELECTED_JOB_TITLE, title == null ? "" : title).apply();
    }

    public void setSelectedJobId(String jobId) {
        prefs.edit().putString(KEY_SELECTED_JOB_ID, jobId == null ? "" : jobId).apply();
    }

    public void setSelectedJob(String jobId, String jobTitle) {
        prefs.edit()
                .putString(KEY_SELECTED_JOB_ID, jobId == null ? "" : jobId)
                .putString(KEY_SELECTED_JOB_TITLE, jobTitle == null ? "" : jobTitle)
                .apply();
    }

    public void setCandidateIdentity(String fullName, String email) {
        prefs.edit()
                .putString(KEY_CANDIDATE_NAME, fullName == null ? "" : fullName.trim())
                .putString(KEY_CANDIDATE_EMAIL, email == null ? "" : email.trim())
                .apply();
    }

    public void setResumeFileName(String fileName) {
        prefs.edit().putString(KEY_RESUME_FILE_NAME, fileName == null ? "" : fileName.trim()).apply();
    }

    public void setResumeParseJobId(String jobId) {
        prefs.edit().putString(KEY_RESUME_PARSE_JOB_ID, jobId == null ? "" : jobId.trim()).apply();
    }

    public void setResumeId(String resumeId) {
        prefs.edit().putString(KEY_RESUME_ID, resumeId == null ? "" : resumeId.trim()).apply();
    }

    public void setProgressMode(String mode) {
        prefs.edit().putString(KEY_PROGRESS_MODE, mode == null ? "RESUME_PARSE" : mode.trim()).apply();
    }

    public void setParsedSummary(String skillsCsv, String experience, String education) {
        prefs.edit()
                .putString(KEY_PARSED_SKILLS, skillsCsv == null ? "" : skillsCsv)
                .putString(KEY_PARSED_EXPERIENCE, experience == null ? "" : experience)
                .putString(KEY_PARSED_EDUCATION, education == null ? "" : education)
                .apply();
    }

    public void setInsights(String topStrengthsCsv, String suggestedImprovementsCsv) {
        prefs.edit()
                .putString(KEY_TOP_STRENGTHS, topStrengthsCsv == null ? "" : topStrengthsCsv)
                .putString(KEY_SUGGESTED_IMPROVEMENTS, suggestedImprovementsCsv == null ? "" : suggestedImprovementsCsv)
                .apply();
    }

    public void setLastMatchScore(int score) {
        prefs.edit().putInt(KEY_LAST_MATCH_SCORE, Math.max(0, Math.min(100, score))).apply();
    }

    public void setLastMatchMeta(int score, int threshold, String retryAt) {
        prefs.edit()
                .putInt(KEY_LAST_MATCH_SCORE, Math.max(0, Math.min(100, score)))
                .putInt(KEY_LAST_MATCH_THRESHOLD, Math.max(0, threshold))
                .putString(KEY_LAST_MATCH_RETRY_AT, retryAt == null ? "" : retryAt.trim())
                .apply();
    }

    public void setActiveAssessmentSession(
            String stage,
            int applicationId,
            int sessionId,
            String language,
            String endsAt,
            int currentIndex
    ) {
        try {
            JSONObject obj = new JSONObject();
            obj.put("stage", stage == null ? "" : stage);
            obj.put("application_id", applicationId);
            obj.put("session_id", sessionId);
            obj.put("language", language == null ? "" : language);
            obj.put("ends_at", endsAt == null ? "" : endsAt);
            obj.put("current_index", currentIndex);
            prefs.edit().putString(KEY_ACTIVE_ASSESSMENT_JSON, obj.toString()).apply();
        } catch (Exception ignored) { }
    }

    public void clearActiveAssessmentSession() {
        prefs.edit()
                .remove(KEY_ACTIVE_ASSESSMENT_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_QUESTIONS_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_REVIEW_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_RESULT_JSON)
                .apply();
    }

    public JSONObject getActiveAssessmentSession() {
        String raw = prefs.getString(KEY_ACTIVE_ASSESSMENT_JSON, "");
        if (raw == null || raw.trim().isEmpty()) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    public void setActiveAssessmentQuestionsJson(String rawJson) {
        prefs.edit().putString(KEY_ACTIVE_ASSESSMENT_QUESTIONS_JSON, rawJson == null ? "" : rawJson).apply();
    }

    public String getActiveAssessmentQuestionsJson() {
        return prefs.getString(KEY_ACTIVE_ASSESSMENT_QUESTIONS_JSON, "");
    }

    public void setActiveAssessmentReviewJson(String rawJson) {
        prefs.edit().putString(KEY_ACTIVE_ASSESSMENT_REVIEW_JSON, rawJson == null ? "" : rawJson).apply();
    }

    public String getActiveAssessmentReviewJson() {
        return prefs.getString(KEY_ACTIVE_ASSESSMENT_REVIEW_JSON, "");
    }

    public void setActiveAssessmentResultJson(String rawJson) {
        prefs.edit().putString(KEY_ACTIVE_ASSESSMENT_RESULT_JSON, rawJson == null ? "" : rawJson).apply();
    }

    public String getActiveAssessmentResultJson() {
        return prefs.getString(KEY_ACTIVE_ASSESSMENT_RESULT_JSON, "");
    }

    public void setPipelineState(String jobId, String state) {
        if (jobId == null || jobId.trim().isEmpty() || state == null || state.trim().isEmpty()) {
            return;
        }
        JSONObject root = getPipelineJson();
        try {
            root.put(jobId, state);
        } catch (JSONException ignored) {
        }
        prefs.edit().putString(KEY_PER_JOB_PIPELINE, root.toString()).apply();
    }

    public void setApplicationIdForJob(String jobId, int applicationId) {
        if (jobId == null || jobId.trim().isEmpty() || applicationId <= 0) {
            return;
        }
        JSONObject root = getApplicationIdJson();
        try {
            root.put(jobId, applicationId);
        } catch (JSONException ignored) {
        }
        prefs.edit().putString(KEY_PER_JOB_APPLICATION_ID, root.toString()).apply();
    }

    public int getApplicationIdForJob(String jobId) {
        if (jobId == null || jobId.trim().isEmpty()) {
            return -1;
        }
        return getApplicationIdJson().optInt(jobId, -1);
    }

    public String getPipelineState(String jobId) {
        if (jobId == null || jobId.trim().isEmpty()) {
            return "APPLIED";
        }
        JSONObject root = getPipelineJson();
        return root.optString(jobId, "APPLIED");
    }

    public Map<String, String> getAllPipelineStates() {
        Map<String, String> states = new HashMap<>();
        JSONObject root = getPipelineJson();
        Iterator<String> keys = root.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            states.put(key, root.optString(key, "APPLIED"));
        }
        return states;
    }

    public void markOnboardingSeen() {
        prefs.edit().putBoolean(KEY_ONBOARDING_SEEN, true).apply();
    }

    public void clearCandidateSession() {
        prefs.edit()
                .putBoolean(KEY_LOGGED_IN, false)
                .putBoolean(KEY_CANDIDATE_ONBOARDING_SEEN, false)
                .putBoolean(KEY_TECH_STACK_COMPLETE, false)
                .putBoolean(KEY_TECH_STACK_SKIPPED, false)
                .putString(KEY_TECH_STACKS, "")
                .putBoolean(KEY_RESUME_UPLOADED, false)
                .putBoolean(KEY_RESUME_PARSED, false)
                .putBoolean(KEY_RESUME_SKIPPED, false)
                .putLong(KEY_RESUME_UPDATED_AT, 0L)
                .putInt(KEY_APPLICATION_COUNT, 0)
                .putString(KEY_SELECTED_JOB_TITLE, "")
                .putString(KEY_SELECTED_JOB_ID, "")
                .putString(KEY_PER_JOB_PIPELINE, "{}")
                .putString(KEY_PARSED_SKILLS, "")
                .putString(KEY_PARSED_EXPERIENCE, "")
                .putString(KEY_PARSED_EDUCATION, "")
                .putInt(KEY_LAST_MATCH_SCORE, 0)
                .putString(KEY_PER_JOB_APPLICATION_ID, "{}")
                .putString(KEY_CANDIDATE_NAME, "")
                .putString(KEY_CANDIDATE_EMAIL, "")
                .putString(KEY_TOP_STRENGTHS, "")
                .putString(KEY_SUGGESTED_IMPROVEMENTS, "")
                .putString(KEY_RESUME_FILE_NAME, "")
                .putString(KEY_RESUME_PARSE_JOB_ID, "")
                .putString(KEY_RESUME_ID, "")
                .putString(KEY_PROGRESS_MODE, "RESUME_PARSE")
                .putInt(KEY_LAST_MATCH_THRESHOLD, 0)
                .putString(KEY_LAST_MATCH_RETRY_AT, "")
                .remove(KEY_ACTIVE_ASSESSMENT_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_QUESTIONS_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_REVIEW_JSON)
                .remove(KEY_ACTIVE_ASSESSMENT_RESULT_JSON)
                .apply();
    }

    private JSONObject getPipelineJson() {
        String raw = prefs.getString(KEY_PER_JOB_PIPELINE, "{}");
        try {
            return new JSONObject(raw);
        } catch (JSONException ignored) {
            return new JSONObject();
        }
    }

    private JSONObject getApplicationIdJson() {
        String raw = prefs.getString(KEY_PER_JOB_APPLICATION_ID, "{}");
        try {
            return new JSONObject(raw);
        } catch (JSONException ignored) {
            return new JSONObject();
        }
    }
}
