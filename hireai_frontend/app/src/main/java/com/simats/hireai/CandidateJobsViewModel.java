package com.simats.hireai;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MediatorLiveData;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class CandidateJobsViewModel extends AndroidViewModel {
    public enum Filter {
        ALL,
        FULL_TIME,
        CONTRACT,
        PART_TIME,
        REMOTE
    }

    private final JobsRepository jobsRepository;
    private final MediatorLiveData<List<Job>> jobs = new MediatorLiveData<>();
    private List<Job> sourceJobs = new ArrayList<>();
    private Filter selectedFilter = Filter.ALL;
    private String query = "";

    public CandidateJobsViewModel(@NonNull Application application) {
        super(application);
        jobsRepository = JobsRepository.getInstance(application);
        jobs.addSource(jobsRepository.observeJobs(), incoming -> {
            sourceJobs = incoming == null ? new ArrayList<>() : new ArrayList<>(incoming);
            apply();
        });
    }

    public LiveData<List<Job>> getJobs() {
        return jobs;
    }

    public Filter getSelectedFilter() {
        return selectedFilter;
    }

    public void setSelectedFilter(@NonNull Filter filter) {
        selectedFilter = filter;
        apply();
    }

    public void setQuery(String q) {
        query = q == null ? "" : q.trim().toLowerCase(Locale.US);
        apply();
    }

    public void refreshFromBackend() {
        jobsRepository.syncFromBackend(getApplication());
    }

    private void apply() {
        List<Job> out = new ArrayList<>();
        for (Job job : sourceJobs) {
            if (!matchesFilter(job) || !matchesQuery(job)) {
                continue;
            }
            out.add(job);
        }
        jobs.setValue(out);
    }

    private boolean matchesFilter(Job job) {
        if (selectedFilter == Filter.ALL) {
            return true;
        }
        if (selectedFilter == Filter.FULL_TIME) {
            return Job.ROLE_FULL_TIME.equals(job.roleType);
        }
        if (selectedFilter == Filter.CONTRACT) {
            return Job.ROLE_CONTRACT.equals(job.roleType);
        }
        if (selectedFilter == Filter.PART_TIME) {
            return Job.ROLE_PART_TIME.equals(job.roleType);
        }
        return Job.ROLE_REMOTE.equals(job.roleType) || job.isRemote;
    }

    private boolean matchesQuery(Job job) {
        if (query.isEmpty()) {
            return true;
        }
        return job.title.toLowerCase(Locale.US).contains(query)
                || job.company.toLowerCase(Locale.US).contains(query)
                || job.location.toLowerCase(Locale.US).contains(query)
                || readableRole(job.roleType).toLowerCase(Locale.US).contains(query);
    }

    public static String readableRole(String roleType) {
        if (Job.ROLE_FULL_TIME.equals(roleType)) {
            return "Full-time";
        }
        if (Job.ROLE_CONTRACT.equals(roleType)) {
            return "Contract";
        }
        if (Job.ROLE_PART_TIME.equals(roleType)) {
            return "Part-time";
        }
        return "Remote";
    }
}
