package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

public class ActivityAdapter extends ListAdapter<ActivityAdapter.Item, ActivityAdapter.ViewHolder> {
    public static class Item {
        public final long id;
        public final String primary;
        public final String secondary;

        public Item(String primary, String secondary) {
            this.id = (primary + secondary).hashCode();
            this.primary = primary;
            this.secondary = secondary;
        }
    }

    public ActivityAdapter() {
        super(DIFF);
        setHasStableIds(true);
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_activity, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = getItem(position);
        holder.primary.setText(item.primary);
        holder.secondary.setText(item.secondary);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView primary;
        final TextView secondary;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            primary = itemView.findViewById(R.id.item_activity_primary);
            secondary = itemView.findViewById(R.id.item_activity_secondary);
        }
    }

    private static final DiffUtil.ItemCallback<Item> DIFF = new DiffUtil.ItemCallback<Item>() {
        @Override
        public boolean areItemsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.id == newItem.id;
        }

        @Override
        public boolean areContentsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.primary.equals(newItem.primary) && oldItem.secondary.equals(newItem.secondary);
        }
    };
}
