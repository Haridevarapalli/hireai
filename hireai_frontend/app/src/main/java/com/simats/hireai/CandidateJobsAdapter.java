package com.simats.hireai;

import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import java.util.Locale;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CandidateJobsAdapter extends ListAdapter<Job, CandidateJobsAdapter.ViewHolder> {
    public interface OnJobClickListener {
        void onJobClick(Job job);
    }

    private final OnJobClickListener listener;
    private final Map<String, AppSummary> appByJobId = new HashMap<>();

    public CandidateJobsAdapter(OnJobClickListener listener) {
        super(DIFF);
        setHasStableIds(true);
        this.listener = listener;
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).id.hashCode();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_job_card, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Job item = getItem(position);
        holder.initials.setText(getInitials(item.company));
        holder.initials.setBackgroundTintList(ColorStateList.valueOf(getLogoColor(item.company)));
        holder.title.setText(item.title);
        holder.company.setText(item.company);
        holder.posted.setText(getPostedAgo(item.createdAt));
        holder.location.setText(item.isRemote ? "Remote" : item.location);
        holder.salary.setText(getSalaryText(item));
        holder.typePill.setText(CandidateJobsViewModel.readableRole(item.roleType));
        bindApplicationState(holder, item);
        holder.itemView.setOnClickListener(v -> listener.onJobClick(item));
    }

    public void setApplicationSummaries(List<com.simats.hireai.network.ApiModels.ApplicationDto> apps) {
        appByJobId.clear();
        if (apps != null) {
            for (com.simats.hireai.network.ApiModels.ApplicationDto a : apps) {
                if (a == null) continue;
                appByJobId.put(String.valueOf(a.job), new AppSummary(
                        a.status, a.nextAction, a.retryEligibleAt,
                        a.matchScore, a.hrScore, a.techScore
                ));
            }
        }
        notifyDataSetChanged();
    }

    private void bindApplicationState(@NonNull ViewHolder holder, @NonNull Job item) {
        AppSummary app = appByJobId.get(item.id);
        holder.statusPill.setVisibility(View.GONE);
        holder.actionHint.setVisibility(View.GONE);
        holder.itemView.setAlpha(1f);
        if (app == null || app.status == null || app.status.trim().isEmpty()) {
            return;
        }
        String status = app.status;
        holder.statusPill.setVisibility(View.VISIBLE);
        holder.statusPill.setText(readableStatus(status, app.retryEligibleAt));
        String hint = buildHint(status, app.nextAction, app.retryEligibleAt, app);
        if (!hint.isEmpty()) {
            holder.actionHint.setVisibility(View.VISIBLE);
            holder.actionHint.setText(hint);
        }
        if (isBlocked(status, app.retryEligibleAt)) {
            holder.itemView.setAlpha(0.84f);
        }
    }

    private boolean isBlocked(String status, String retryEligibleAt) {
        if (status == null) return false;
        if ("TECH_FAIL".equals(status) || "HR_FAIL".equals(status)) return true;
        return "MATCH_FAIL".equals(status) && retryEligibleAt != null && !retryEligibleAt.trim().isEmpty();
    }

    private String readableStatus(String status, String retryEligibleAt) {
        if (status == null) return "";
        if ("MATCH_FAIL".equals(status) && retryEligibleAt != null && !retryEligibleAt.trim().isEmpty()) {
            return "Cooldown";
        }
        if ("HR_READY".equals(status) || "HR_STARTED".equals(status) || "TECH_READY".equals(status) || "TECH_STARTED".equals(status)) {
            return "In Progress";
        }
        if ("TECH_PASS".equals(status) || "HR_PASS".equals(status) || "MATCH_PASS".equals(status)) {
            return "Passed";
        }
        return status.replace('_', ' ');
    }

    private String buildHint(String status, String nextAction, String retryEligibleAt, AppSummary app) {
        if ("MATCH_FAIL".equals(status) && retryEligibleAt != null && !retryEligibleAt.trim().isEmpty()) {
            return "Retry on " + shortDate(retryEligibleAt) + " • View details";
        }
        if ("HR_FAIL".equals(status) || "TECH_FAIL".equals(status)) {
            return "Progression locked • View details";
        }
        if ("OFFER_SENT".equals(status) || "OFFER_ACCEPTED".equals(status)) {
            return "Open application details";
        }
        if (nextAction != null && !nextAction.trim().isEmpty()) {
            return "Tap to " + nextAction.replace('_', ' ').toLowerCase(Locale.US);
        }
        if (app.matchScore != null || app.hrScore != null || app.techScore != null) {
            StringBuilder sb = new StringBuilder("View details");
            return sb.toString();
        }
        return "";
    }

    private String shortDate(String iso) {
        try {
            java.text.SimpleDateFormat in = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            in.setLenient(true);
            java.util.Date d = in.parse(iso.replace("Z", ""));
            if (d == null) return "later";
            return new java.text.SimpleDateFormat("dd MMM", Locale.US).format(d);
        } catch (Exception e) {
            return "later";
        }
    }

    private static String getInitials(String company) {
        if (company == null || company.trim().isEmpty()) {
            return "NA";
        }
        String[] parts = company.trim().split("\\s+");
        if (parts.length == 1) {
            String word = parts[0];
            return word.length() >= 2
                    ? word.substring(0, 2).toUpperCase(Locale.US)
                    : word.toUpperCase(Locale.US);
        }
        return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase(Locale.US);
    }

    private static String getSalaryText(Job item) {
        if (item.salaryMin == null && item.salaryMax == null) {
            return "Not disclosed";
        }
        String symbol = "INR".equalsIgnoreCase(item.currency) ? "\u20B9" : "$";
        if (item.salaryMin != null && item.salaryMax != null) {
            return symbol + formatCompact(item.salaryMin, item.currency) + " - " + symbol + formatCompact(item.salaryMax, item.currency);
        }
        Integer value = item.salaryMin != null ? item.salaryMin : item.salaryMax;
        return symbol + formatCompact(value, item.currency);
    }

    private static String formatCompact(int value, String currency) {
        if ("INR".equalsIgnoreCase(currency)) {
            if (value >= 100000) {
                float lpa = value / 100000f;
                if (Math.abs(lpa - Math.round(lpa)) < 0.05f) {
                    return Math.round(lpa) + "L";
                }
                return String.format(Locale.US, "%.1fL", lpa);
            }
            return String.valueOf(value);
        }
        if (value >= 1000) {
            return (value / 1000) + "k";
        }
        return String.valueOf(value);
    }

    private static String getPostedAgo(long createdAt) {
        long diff = Math.max(0, System.currentTimeMillis() - createdAt);
        long day = 24L * 60L * 60L * 1000L;
        long days = diff / day;
        if (days <= 0) {
            return "Today";
        }
        if (days == 1) {
            return "1 day ago";
        }
        return days + " days ago";
    }


    private static int getLogoColor(String company) {
        final int[] palette = new int[]{
                0xFF0F766E, 0xFF1D4ED8, 0xFF7C3AED, 0xFFBE185D,
                0xFFB45309, 0xFF166534, 0xFF334155, 0xFFC2410C
        };
        if (company == null || company.trim().isEmpty()) {
            return palette[0];
        }
        int idx = Math.abs(company.trim().toLowerCase(Locale.US).hashCode()) % palette.length;
        return palette[idx];
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView initials;
        final TextView title;
        final TextView company;
        final TextView posted;
        final TextView location;
        final TextView salary;
        final TextView typePill;
        final TextView statusPill;
        final TextView actionHint;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            initials = itemView.findViewById(R.id.job_card_company_initials);
            title = itemView.findViewById(R.id.job_card_title);
            company = itemView.findViewById(R.id.job_card_company);
            posted = itemView.findViewById(R.id.job_card_posted_time);
            location = itemView.findViewById(R.id.job_card_location);
            salary = itemView.findViewById(R.id.job_card_salary);
            typePill = itemView.findViewById(R.id.job_card_type_pill);
            statusPill = itemView.findViewById(R.id.job_card_status_pill);
            actionHint = itemView.findViewById(R.id.job_card_action_hint);
        }
    }

    private static final class AppSummary {
        final String status;
        final String nextAction;
        final String retryEligibleAt;
        final Integer matchScore;
        final Float hrScore;
        final Float techScore;
        AppSummary(String status, String nextAction, String retryEligibleAt, Integer matchScore, Float hrScore, Float techScore) {
            this.status = status;
            this.nextAction = nextAction;
            this.retryEligibleAt = retryEligibleAt;
            this.matchScore = matchScore;
            this.hrScore = hrScore;
            this.techScore = techScore;
        }
    }

    private static final DiffUtil.ItemCallback<Job> DIFF = new DiffUtil.ItemCallback<Job>() {
        @Override
        public boolean areItemsTheSame(@NonNull Job oldItem, @NonNull Job newItem) {
            return oldItem.id.equals(newItem.id);
        }

        @Override
        public boolean areContentsTheSame(@NonNull Job oldItem, @NonNull Job newItem) {
            return oldItem.title.equals(newItem.title)
                    && oldItem.company.equals(newItem.company)
                    && oldItem.roleType.equals(newItem.roleType)
                    && oldItem.location.equals(newItem.location)
                    && oldItem.isRemote == newItem.isRemote
                    && ((oldItem.salaryMin == null && newItem.salaryMin == null) || (oldItem.salaryMin != null && oldItem.salaryMin.equals(newItem.salaryMin)))
                    && ((oldItem.salaryMax == null && newItem.salaryMax == null) || (oldItem.salaryMax != null && oldItem.salaryMax.equals(newItem.salaryMax)))
                    && oldItem.createdAt == newItem.createdAt;
        }
    };
}
