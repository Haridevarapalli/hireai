package com.simats.hireai;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import java.util.ArrayList;
import java.util.List;

public class CandidateHomeViewModel extends AndroidViewModel {
    public enum HomeMode {
        MISSING_RESUME,
        RESUME_READY_NO_APPLICATIONS,
        HAS_APPLICATIONS
    }

    public static class HomeUiState {
        public final HomeMode mode;
        public final List<JobsAdapter.Item> recommendedJobs;
        public final List<ActivityAdapter.Item> recentApplications;
        public final int applicationCount;
        public final boolean hasPendingAssessment;

        HomeUiState(HomeMode mode, List<JobsAdapter.Item> recommendedJobs, List<ActivityAdapter.Item> recentApplications, int applicationCount, boolean hasPendingAssessment) {
            this.mode = mode;
            this.recommendedJobs = recommendedJobs;
            this.recentApplications = recentApplications;
            this.applicationCount = applicationCount;
            this.hasPendingAssessment = hasPendingAssessment;
        }
    }

    private final CandidateStateStore stateStore;
    private final MutableLiveData<HomeUiState> homeState = new MutableLiveData<>();

    public CandidateHomeViewModel(@NonNull Application application) {
        super(application);
        stateStore = new CandidateStateStore(application);
        refresh();
    }

    public LiveData<HomeUiState> getHomeState() {
        return homeState;
    }

    public void refresh() {
        CandidateOnboardingState state = stateStore.getState();
        HomeMode mode;
        if (!state.hasResumeUploaded || !state.hasParsedResume) {
            mode = HomeMode.MISSING_RESUME;
        } else if (state.applicationCount <= 0) {
            mode = HomeMode.RESUME_READY_NO_APPLICATIONS;
        } else {
            mode = HomeMode.HAS_APPLICATIONS;
        }

        List<JobsAdapter.Item> recommendedJobs = new ArrayList<>();
        List<ActivityAdapter.Item> recentApplications = new ArrayList<>();

        homeState.postValue(new HomeUiState(mode, recommendedJobs, recentApplications, state.applicationCount, state.applicationCount > 0));
    }
}
