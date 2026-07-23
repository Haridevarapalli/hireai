package com.simats.hireai;

import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.simats.hireai.network.ApiModels;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

public class HomeRecentApplicationsAdapter extends ListAdapter<ApiModels.ApplicationDto, HomeRecentApplicationsAdapter.ViewHolder> {
    interface OnItemClickListener {
        void onItemClick(ApiModels.ApplicationDto item);
    }

    private final OnItemClickListener listener;

    public HomeRecentApplicationsAdapter(@NonNull OnItemClickListener listener) {
        super(DIFF);
        this.listener = listener;
        setHasStableIds(true);
    }

    @Override
    public long getItemId(int position) {
        ApiModels.ApplicationDto item = getItem(position);
        return item == null ? position : item.id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_home_recent_application, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ApiModels.ApplicationDto item = getItem(position);
        if (item == null) return;

        String title = safe(item.jobTitle, "Application");
        String company = safe(item.company, "");
        String location = safe(item.location, "");
        String subtitle = joinNonEmpty(" - ", company, location);
        String status = formatStatus(item.status);
        String timeText = buildTimeText(item);
        String scores = buildScoresText(item);

        holder.title.setText(title);
        holder.subtitle.setText(TextUtils.isEmpty(subtitle) ? "Application in progress" : subtitle);
        holder.statusChip.setText(status);
        holder.meta.setText(timeText);
        holder.scores.setText(scores);
        holder.scores.setVisibility(TextUtils.isEmpty(scores) ? View.GONE : View.VISIBLE);
        bindMonogram(holder.monogram, company, title);
        tintStatusChip(holder.statusChip, item.status, item.retryEligibleAt);

        holder.itemView.setOnClickListener(v -> listener.onItemClick(item));
    }

    private static void bindMonogram(@NonNull TextView view, String company, String title) {
        String source = !TextUtils.isEmpty(company) ? company : title;
        String initials = initials(source);
        view.setText(initials);
        int[] pair = colorPair(source);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(pair[0]);
        view.setBackground(bg);
        view.setTextColor(pair[1]);
    }

    private static void tintStatusChip(@NonNull TextView chip, String rawStatus, String retryEligibleAt) {
        String status = safe(rawStatus, "").toUpperCase(Locale.US);
        int bg;
        int fg;
        if (!TextUtils.isEmpty(retryEligibleAt) || status.contains("FAIL")) {
            bg = 0xFFFFF1F1;
            fg = 0xFFC62828;
        } else if (status.contains("READY") || status.contains("STARTED")) {
            bg = 0xFFEAF2FF;
            fg = 0xFF1E5EFF;
        } else if (status.contains("PASS") || status.contains("ACCEPTED")) {
            bg = 0xFFEAF7EF;
            fg = 0xFF0F7A3A;
        } else {
            bg = 0xFFF2F4F7;
            fg = 0xFF4B5563;
        }
        GradientDrawable d = new GradientDrawable();
        d.setCornerRadius(999f);
        d.setColor(bg);
        chip.setBackground(d);
        chip.setTextColor(fg);
    }

    private static String buildTimeText(ApiModels.ApplicationDto item) {
        List<String> parts = new ArrayList<>();
        if (!TextUtils.isEmpty(item.appliedAt)) {
            parts.add("Applied");
        }
        if (!TextUtils.isEmpty(item.lastUpdated)) {
            parts.add("Updated");
        } else if (!TextUtils.isEmpty(item.updatedAt)) {
            parts.add("Updated");
        }
        if (!TextUtils.isEmpty(item.retryEligibleAt)) {
            parts.add("Retry later");
        }
        return parts.isEmpty() ? "Tap to view details" : TextUtils.join(" - ", parts);
    }

    private static String buildScoresText(ApiModels.ApplicationDto item) {
        List<String> parts = new ArrayList<>();
        if (item.matchScore != null) {
            parts.add("Match " + item.matchScore + "%");
        }
        if (item.hrScore != null) {
            parts.add("HR " + Math.round(item.hrScore) + "%");
        }
        if (item.techScore != null) {
            parts.add("Tech " + Math.round(item.techScore) + "%");
        }
        if (!TextUtils.isEmpty(item.retryEligibleAt)) {
            parts.add("Retry scheduled");
        }
        return parts.isEmpty() ? "" : TextUtils.join(" - ", parts);
    }

    private static String formatStatus(String status) {
        String s = safe(status, "APPLIED").replace('_', ' ').trim();
        if (s.isEmpty()) return "Applied";
        String[] words = s.toLowerCase(Locale.US).split("\\s+");
        StringBuilder out = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            if (out.length() > 0) out.append(' ');
            out.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
        }
        return out.toString();
    }

    private static String initials(String source) {
        if (TextUtils.isEmpty(source)) return "AP";
        String[] parts = source.trim().split("\\s+");
        if (parts.length == 1) {
            String s = parts[0];
            return s.length() >= 2 ? s.substring(0, 2).toUpperCase(Locale.US) : s.toUpperCase(Locale.US);
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase(Locale.US);
    }

    private static int[] colorPair(String key) {
        int[][] palette = new int[][]{
                {0xFFE8F1FF, 0xFF0B57D0},
                {0xFFEAF7EF, 0xFF116B3A},
                {0xFFFFF2E2, 0xFFA55A00},
                {0xFFF3EEFF, 0xFF5A35B6},
                {0xFFFFECEE, 0xFFB42318}
        };
        int idx = Math.abs(Objects.hashCode(key)) % palette.length;
        return palette[idx];
    }

    private static String safe(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private static String joinNonEmpty(String sep, String... values) {
        List<String> parts = new ArrayList<>();
        for (String value : values) {
            if (value != null) {
                String trimmed = value.trim();
                if (!trimmed.isEmpty()) parts.add(trimmed);
            }
        }
        return TextUtils.join(sep, parts);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView monogram;
        final TextView title;
        final TextView subtitle;
        final TextView statusChip;
        final TextView meta;
        final TextView scores;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            monogram = itemView.findViewById(R.id.home_app_item_monogram);
            title = itemView.findViewById(R.id.home_app_item_title);
            subtitle = itemView.findViewById(R.id.home_app_item_subtitle);
            statusChip = itemView.findViewById(R.id.home_app_item_status_chip);
            meta = itemView.findViewById(R.id.home_app_item_meta);
            scores = itemView.findViewById(R.id.home_app_item_scores);
        }
    }

    private static final DiffUtil.ItemCallback<ApiModels.ApplicationDto> DIFF =
            new DiffUtil.ItemCallback<ApiModels.ApplicationDto>() {
                @Override
                public boolean areItemsTheSame(@NonNull ApiModels.ApplicationDto oldItem, @NonNull ApiModels.ApplicationDto newItem) {
                    return oldItem.id == newItem.id;
                }

                @Override
                public boolean areContentsTheSame(@NonNull ApiModels.ApplicationDto oldItem, @NonNull ApiModels.ApplicationDto newItem) {
                    return oldItem.id == newItem.id
                            && Objects.equals(oldItem.jobTitle, newItem.jobTitle)
                            && Objects.equals(oldItem.company, newItem.company)
                            && Objects.equals(oldItem.location, newItem.location)
                            && Objects.equals(oldItem.status, newItem.status)
                            && Objects.equals(oldItem.matchScore, newItem.matchScore)
                            && Objects.equals(oldItem.hrScore, newItem.hrScore)
                            && Objects.equals(oldItem.techScore, newItem.techScore)
                            && Objects.equals(oldItem.lastUpdated, newItem.lastUpdated)
                            && Objects.equals(oldItem.updatedAt, newItem.updatedAt)
                            && Objects.equals(oldItem.retryEligibleAt, newItem.retryEligibleAt);
                }
            };
}
