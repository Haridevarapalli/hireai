package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class NotificationListAdapter extends RecyclerView.Adapter<NotificationListAdapter.ViewHolder> {
    public static class NotificationItem {
        public final long id;
        public final String title;
        public final String subtitle;
        public final String time;

        public NotificationItem(String title, String subtitle, String time) {
            this.id = (title + subtitle + time).hashCode();
            this.title = title;
            this.subtitle = subtitle;
            this.time = time;
        }
    }

    private final List<NotificationItem> items = new ArrayList<>();

    public NotificationListAdapter(List<NotificationItem> source) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.notification_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        NotificationItem item = items.get(position);
        holder.title.setText(item.title);
        holder.subtitle.setText(item.subtitle);
        holder.time.setText(item.time);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView title;
        final TextView subtitle;
        final TextView time;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.notification_title);
            subtitle = itemView.findViewById(R.id.notification_subtitle);
            time = itemView.findViewById(R.id.notification_time);
        }
    }
}
