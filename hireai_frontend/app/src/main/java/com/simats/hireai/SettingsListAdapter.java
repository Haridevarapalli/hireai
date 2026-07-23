package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class SettingsListAdapter extends RecyclerView.Adapter<SettingsListAdapter.ViewHolder> {
    public static class SettingItem {
        public final long id;
        public final String label;
        public final int iconRes;

        public SettingItem(String label, int iconRes) {
            this.id = label.hashCode();
            this.label = label;
            this.iconRes = iconRes;
        }
    }

    public interface OnSettingClickListener {
        void onSettingClick(SettingItem item);
    }

    private final List<SettingItem> items = new ArrayList<>();
    private final OnSettingClickListener listener;

    public SettingsListAdapter(List<SettingItem> source, OnSettingClickListener listener) {
        setHasStableIds(true);
        items.addAll(source);
        this.listener = listener;
    }

    @Override
    public long getItemId(int position) {
        return items.get(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.settings_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SettingItem item = items.get(position);
        holder.label.setText(item.label);
        holder.icon.setImageResource(item.iconRes);
        holder.itemView.setOnClickListener(v -> listener.onSettingClick(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView icon;
        final TextView label;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            icon = itemView.findViewById(R.id.settings_icon);
            label = itemView.findViewById(R.id.settings_label);
        }
    }
}
