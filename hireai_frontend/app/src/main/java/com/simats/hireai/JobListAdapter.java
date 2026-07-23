package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class JobListAdapter extends RecyclerView.Adapter<JobListAdapter.ViewHolder> {
    public interface OnJobClickListener {
        void onJobClick(JobItem item);
    }

    public static class JobItem {
        public final long id;
        public final String title;
        public final String department;

        public JobItem(String title, String department) {
            this.id = (title + department).hashCode();
            this.title = title;
            this.department = department;
        }
    }

    private final List<JobItem> allItems = new ArrayList<>();
    private final List<JobItem> visibleItems = new ArrayList<>();
    private final OnJobClickListener clickListener;

    public JobListAdapter(List<JobItem> source, OnJobClickListener clickListener) {
        setHasStableIds(true);
        this.clickListener = clickListener;
        allItems.addAll(source);
        visibleItems.addAll(source);
    }

    public void filter(String query) {
        visibleItems.clear();
        if (query == null || query.trim().isEmpty()) {
            visibleItems.addAll(allItems);
        } else {
            String lower = query.toLowerCase();
            for (JobItem item : allItems) {
                if (item.title.toLowerCase().contains(lower) || item.department.toLowerCase().contains(lower)) {
                    visibleItems.add(item);
                }
            }
        }
        notifyDataSetChanged();
    }

    @Override
    public long getItemId(int position) {
        return visibleItems.get(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.job_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        JobItem item = visibleItems.get(position);
        holder.title.setText(item.title);
        holder.department.setText(item.department);
        holder.itemView.setOnClickListener(v -> clickListener.onJobClick(item));
    }

    @Override
    public int getItemCount() {
        return visibleItems.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView department;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.job_title);
            department = itemView.findViewById(R.id.job_department);
        }
    }
}
