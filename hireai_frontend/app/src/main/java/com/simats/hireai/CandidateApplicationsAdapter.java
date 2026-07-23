package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

public class CandidateApplicationsAdapter extends ListAdapter<CandidateApplicationsAdapter.Item, CandidateApplicationsAdapter.ViewHolder> {
    interface OnItemClickListener {
        void onItemClick(Item item);
    }

    static class Item {
        final String jobId;
        final int applicationId;
        final String title;
        final String company;
        final String location;
        final String status;
        final String date;
        final String updated;
        final Integer matchScore;
        final Float hrScore;
        final Float techScore;
        final String nextAction;
        final String retryEligibleAt;

        Item(String jobId, int applicationId, String title, String company, String location, String status, String date, String updated,
             Integer matchScore, Float hrScore, Float techScore, String nextAction, String retryEligibleAt) {
            this.jobId = jobId;
            this.applicationId = applicationId;
            this.title = title;
            this.company = company;
            this.location = location;
            this.status = status;
            this.date = date;
            this.updated = updated;
            this.matchScore = matchScore;
            this.hrScore = hrScore;
            this.techScore = techScore;
            this.nextAction = nextAction;
            this.retryEligibleAt = retryEligibleAt;
        }
    }

    private final OnItemClickListener onItemClickListener;

    public CandidateApplicationsAdapter(OnItemClickListener listener) {
        super(DIFF);
        setHasStableIds(true);
        this.onItemClickListener = listener;
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).jobId.hashCode();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_candidate_application, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = getItem(position);
        holder.title.setText(item.title);
        holder.subtitle.setText(composeSubtitle(item));
        holder.status.setText(formatStatus(item.status));
        holder.date.setText(item.date + (item.updated == null || item.updated.isEmpty() ? "" : "  •  " + item.updated));
        holder.score.setText(composeScores(item));
        holder.itemView.setOnClickListener(v -> onItemClickListener.onItemClick(item));
    }

    private static String composeSubtitle(Item item) {
        String company = item.company == null ? "" : item.company;
        String location = item.location == null ? "" : item.location;
        if (company.isEmpty()) return location;
        if (location.isEmpty()) return company;
        return company + " • " + location;
    }

    private static String formatStatus(String status) {
        if (status == null || status.trim().isEmpty()) return "Applied";
        return status.replace('_', ' ');
    }

    private static String composeScores(Item item) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        if (item.matchScore != null) parts.add("Match " + item.matchScore + "%");
        if (item.hrScore != null) parts.add("HR " + Math.round(item.hrScore) + "%");
        if (item.techScore != null) parts.add("Tech " + Math.round(item.techScore) + "%");
        return parts.isEmpty() ? "Tap to view status timeline" : android.text.TextUtils.join("  •  ", parts);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView status;
        final TextView subtitle;
        final TextView date;
        final TextView score;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.app_item_title);
            status = itemView.findViewById(R.id.app_item_status);
            subtitle = itemView.findViewById(R.id.app_item_subtitle);
            date = itemView.findViewById(R.id.app_item_date);
            score = itemView.findViewById(R.id.app_item_score);
        }
    }

    private static final DiffUtil.ItemCallback<Item> DIFF = new DiffUtil.ItemCallback<Item>() {
        @Override
        public boolean areItemsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.jobId.equals(newItem.jobId);
        }

        @Override
        public boolean areContentsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.title.equals(newItem.title)
                    && oldItem.status.equals(newItem.status)
                    && java.util.Objects.equals(oldItem.company, newItem.company)
                    && java.util.Objects.equals(oldItem.location, newItem.location)
                    && oldItem.date.equals(newItem.date)
                    && java.util.Objects.equals(oldItem.updated, newItem.updated)
                    && java.util.Objects.equals(oldItem.matchScore, newItem.matchScore)
                    && java.util.Objects.equals(oldItem.hrScore, newItem.hrScore)
                    && java.util.Objects.equals(oldItem.techScore, newItem.techScore);
        }
    };
}
