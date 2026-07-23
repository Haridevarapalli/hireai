package com.simats.hireai;

public class CandidateOnboardingState {
    public final boolean hasSeenOnboarding;
    public final boolean hasSeenCandidateOnboarding;
    public final boolean isLoggedIn;
    public final boolean isTechStackComplete;
    public final boolean techStackSkipped;
    public final boolean hasResumeUploaded;
    public final boolean hasParsedResume;
    public final boolean resumeSkipped;
    public final long lastResumeUpdatedAt;
    public final int applicationCount;
    public final String selectedJobTitle;
    public final String selectedJobId;

    public CandidateOnboardingState(
            boolean hasSeenOnboarding,
            boolean hasSeenCandidateOnboarding,
            boolean isLoggedIn,
            boolean isTechStackComplete,
            boolean techStackSkipped,
            boolean hasResumeUploaded,
            boolean hasParsedResume,
            boolean resumeSkipped,
            long lastResumeUpdatedAt,
            int applicationCount,
            String selectedJobTitle,
            String selectedJobId
    ) {
        this.hasSeenOnboarding = hasSeenOnboarding;
        this.hasSeenCandidateOnboarding = hasSeenCandidateOnboarding;
        this.isLoggedIn = isLoggedIn;
        this.isTechStackComplete = isTechStackComplete;
        this.techStackSkipped = techStackSkipped;
        this.hasResumeUploaded = hasResumeUploaded;
        this.hasParsedResume = hasParsedResume;
        this.resumeSkipped = resumeSkipped;
        this.lastResumeUpdatedAt = lastResumeUpdatedAt;
        this.applicationCount = applicationCount;
        this.selectedJobTitle = selectedJobTitle == null ? "" : selectedJobTitle;
        this.selectedJobId = selectedJobId == null ? "" : selectedJobId;
    }
}
