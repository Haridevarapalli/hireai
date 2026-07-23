package com.simats.hireai;

public class Job {
    public static final String ROLE_FULL_TIME = "FULL_TIME";
    public static final String ROLE_CONTRACT = "CONTRACT";
    public static final String ROLE_PART_TIME = "PART_TIME";
    public static final String ROLE_REMOTE = "REMOTE";

    public final String id;
    public final String title;
    public final String company;
    public final String location;
    public final boolean isRemote;
    public final String roleType;
    public final Integer salaryMin;
    public final Integer salaryMax;
    public final String currency;
    public final java.util.List<String> skills;
    public final int minMatchScore;
    public final long createdAt;

    public Job(
            String id,
            String title,
            String company,
            String location,
            boolean isRemote,
            String roleType,
            Integer salaryMin,
            Integer salaryMax,
            String currency,
            java.util.List<String> skills,
            int minMatchScore,
            long createdAt
    ) {
        this.id = id == null ? "" : id;
        this.title = title == null ? "" : title;
        this.company = company == null ? "" : company;
        this.location = location == null ? "" : location;
        this.isRemote = isRemote;
        this.roleType = roleType == null ? ROLE_FULL_TIME : roleType;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.currency = currency == null ? "INR" : currency;
        this.skills = skills == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(skills);
        this.minMatchScore = Math.max(0, Math.min(100, minMatchScore));
        this.createdAt = createdAt;
    }
}
