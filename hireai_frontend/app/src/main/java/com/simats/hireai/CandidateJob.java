package com.simats.hireai;

public class CandidateJob {
    public enum JobType {
        FULL_TIME("Full-time"),
        CONTRACT("Contract"),
        PART_TIME("Part-time"),
        REMOTE("Remote");

        public final String label;

        JobType(String label) {
            this.label = label;
        }
    }

    public final String id;
    public final String title;
    public final String companyName;
    public final String companyInitials;
    public final JobType jobType;
    public final String locationText;
    public final String salaryText;
    public final String postedAgo;

    public CandidateJob(
            String id,
            String title,
            String companyName,
            String companyInitials,
            JobType jobType,
            String locationText,
            String salaryText,
            String postedAgo
    ) {
        this.id = id;
        this.title = title;
        this.companyName = companyName;
        this.companyInitials = companyInitials;
        this.jobType = jobType;
        this.locationText = locationText;
        this.salaryText = salaryText;
        this.postedAgo = postedAgo;
    }
}

