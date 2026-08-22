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
import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;
import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CandidateNotificationsFragment extends Fragment {

    private RecyclerView recyclerView;
    private View emptyLayout;
    private MaterialButton btnMarkAllRead;
    private MaterialToolbar toolbar;

    public static CandidateNotificationsFragment newInstance() {
        return new CandidateNotificationsFragment();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_candidate_notifications, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        toolbar = view.findViewById(R.id.candidate_notifications_toolbar);
        recyclerView = view.findViewById(R.id.rv_candidate_notifications);
        emptyLayout = view.findViewById(R.id.layout_empty_notifications);
        btnMarkAllRead = view.findViewById(R.id.btn_mark_all_read);

        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> {
                if (getActivity() != null) {
                    getActivity().onBackPressed();
                }
            });
        }

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        btnMarkAllRead.setOnClickListener(v -> markAllRead());

        loadNotifications();
    }

    private void loadNotifications() {
        if (getContext() == null) return;

        ApiClient.getInstance(getContext()).api().getMyNotifications().enqueue(new Callback<List<ApiModels.NotificationDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.NotificationDto>> call, Response<List<ApiModels.NotificationDto>> response) {
                if (!isAdded() || getContext() == null) return;

                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    List<ApiModels.NotificationDto> dtos = response.body();
                    List<NotificationListAdapter.NotificationItem> items = new ArrayList<>();
                    for (ApiModels.NotificationDto dto : dtos) {
                        String timeStr = dto.createdAt != null ? dto.createdAt.split("T")[0] : "Recently";
                        items.add(new NotificationListAdapter.NotificationItem(
                                dto.title != null ? dto.title : "Notification",
                                dto.body != null ? dto.body : "",
                                timeStr
                        ));
                    }
                    recyclerView.setAdapter(new NotificationListAdapter(items));
                    recyclerView.setVisibility(View.VISIBLE);
                    emptyLayout.setVisibility(View.GONE);
                } else {
                    recyclerView.setVisibility(View.GONE);
                    emptyLayout.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.NotificationDto>> call, Throwable t) {
                if (!isAdded() || getContext() == null) return;
                recyclerView.setVisibility(View.GONE);
                emptyLayout.setVisibility(View.VISIBLE);
            }
        });
    }

    private void markAllRead() {
        if (getContext() == null) return;

        ApiClient.getInstance(getContext()).api().markAllNotificationsRead().enqueue(new Callback<ApiModels.GenericSuccessResponse>() {
            @Override
            public void onResponse(Call<ApiModels.GenericSuccessResponse> call, Response<ApiModels.GenericSuccessResponse> response) {
                if (!isAdded() || getView() == null) return;
                Snackbar.make(getView(), "All notifications marked as read", Snackbar.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(Call<ApiModels.GenericSuccessResponse> call, Throwable t) {
                if (!isAdded() || getView() == null) return;
                Snackbar.make(getView(), "Failed to mark notifications read", Snackbar.LENGTH_SHORT).show();
            }
        });
    }
}
