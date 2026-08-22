package com.simats.hireai;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.simats.hireai.network.ApiModels;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CandidateSavedJobsFragment extends Fragment {

    private MaterialToolbar toolbar;
    private RecyclerView recyclerView;
    private View emptyLayout;
    private CandidateJobsAdapter adapter;

    public static CandidateSavedJobsFragment newInstance() {
        return new CandidateSavedJobsFragment();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_candidate_jobs, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        toolbar = view.findViewById(R.id.candidate_jobs_toolbar);
        recyclerView = view.findViewById(R.id.candidate_jobs_list);
        emptyLayout = view.findViewById(R.id.candidate_jobs_empty);

        if (toolbar != null) {
            toolbar.setTitle("Saved Jobs");
            toolbar.setNavigationIcon(R.drawable.ic_back);
            toolbar.setNavigationOnClickListener(v -> {
                if (getActivity() != null) {
                    getActivity().onBackPressed();
                }
            });
        }

        if (recyclerView != null) {
            recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
            adapter = new CandidateJobsAdapter(job -> {
                if (getActivity() instanceof CandidateActivity) {
                    ((CandidateActivity) getActivity()).pushScreen(R.layout.fragment_recruiter_job_details);
                }
            });
            recyclerView.setAdapter(adapter);
        }

        loadSavedJobs();
    }

    private void loadSavedJobs() {
        if (getContext() == null) return;

        JobsRepository.getInstance(getContext()).fetchSavedJobs(getContext(), new Callback<List<ApiModels.ApiJob>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApiJob>> call, Response<List<ApiModels.ApiJob>> response) {
                if (!isAdded() || getContext() == null) return;

                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    List<Job> mapped = new ArrayList<>();
                    for (ApiModels.ApiJob apiJob : response.body()) {
                        mapped.add(new Job(
                                apiJob.id != null ? apiJob.id : "1",
                                apiJob.title != null ? apiJob.title : "Software Engineer",
                                apiJob.company != null ? apiJob.company : "Company",
                                apiJob.location != null ? apiJob.location : "India",
                                apiJob.isRemote,
                                apiJob.roleType != null ? apiJob.roleType : "FULL_TIME",
                                apiJob.salaryMin,
                                apiJob.salaryMax,
                                "INR",
                                apiJob.requiredSkills != null ? apiJob.requiredSkills : new ArrayList<>(),
                                70,
                                System.currentTimeMillis()
                        ));
                    }
                    if (adapter != null) adapter.submitList(mapped);
                    if (recyclerView != null) recyclerView.setVisibility(View.VISIBLE);
                    if (emptyLayout != null) emptyLayout.setVisibility(View.GONE);
                } else {
                    if (adapter != null) adapter.submitList(new ArrayList<>());
                    if (emptyLayout != null) emptyLayout.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApiJob>> call, Throwable t) {
                if (!isAdded() || getContext() == null) return;
                if (adapter != null) adapter.submitList(new ArrayList<>());
                if (emptyLayout != null) emptyLayout.setVisibility(View.VISIBLE);
            }
        });
    }
}
