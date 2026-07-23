package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ActivityFeedAdapter extends RecyclerView.Adapter<ActivityFeedAdapter.ViewHolder> {
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

    private final List<Item> items = new ArrayList<>();

    public ActivityFeedAdapter(List<Item> source) {
        setHasStableIds(true);
        items.addAll(source);
    }

    @Override
    public long getItemId(int position) {
        return items.get(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.activity_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = items.get(position);
        holder.primary.setText(item.primary);
        holder.secondary.setText(item.secondary);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView primary;
        final TextView secondary;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            primary = itemView.findViewById(R.id.activity_primary);
            secondary = itemView.findViewById(R.id.activity_secondary);
        }
    }
}
