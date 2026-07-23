package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class JobsAdapter extends ListAdapter<JobsAdapter.Item, JobsAdapter.ViewHolder> {
    public interface OnJobClickListener {
        void onJobClick(Item item);
    }

    public static class Item {
        public final long id;
        public final String backendId;
        public final String title;
        public final String department;

        public Item(String title, String department) {
            this("", title, department);
        }

        public Item(String backendId, String title, String department) {
            this.id = (title + department).hashCode();
            this.backendId = backendId == null ? "" : backendId;
            this.title = title;
            this.department = department;
        }
    }

    private final List<Item> fullList = new ArrayList<>();
    private final OnJobClickListener onJobClickListener;

    public JobsAdapter(OnJobClickListener onJobClickListener) {
        super(DIFF);
        setHasStableIds(true);
        this.onJobClickListener = onJobClickListener;
    }

    public void setItems(List<Item> items) {
        fullList.clear();
        fullList.addAll(items);
        submitList(new ArrayList<>(items));
    }

    public void filter(String query) {
        if (query == null || query.trim().isEmpty()) {
            submitList(new ArrayList<>(fullList));
            return;
        }
        String lower = query.toLowerCase();
        List<Item> filtered = new ArrayList<>();
        for (Item item : fullList) {
            if (item.title.toLowerCase().contains(lower) || item.department.toLowerCase().contains(lower)) {
                filtered.add(item);
            }
        }
        submitList(filtered);
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_job, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = getItem(position);
        holder.title.setText(item.title);
        holder.department.setText(item.department);
        holder.itemView.setOnClickListener(v -> onJobClickListener.onJobClick(item));
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView department;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.item_job_title);
            department = itemView.findViewById(R.id.item_job_department);
        }
    }

    private static final DiffUtil.ItemCallback<Item> DIFF = new DiffUtil.ItemCallback<Item>() {
        @Override
        public boolean areItemsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.id == newItem.id;
        }

        @Override
        public boolean areContentsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.title.equals(newItem.title) && oldItem.department.equals(newItem.department);
        }
    };
}
