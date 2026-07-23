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

public class ApplicantListAdapter extends RecyclerView.Adapter<ApplicantListAdapter.ViewHolder> {
    public interface OnApplicantClickListener {
        void onApplicantClick(ApplicantItem item);
    }

    public static class ApplicantItem {
        public final long id;
        public final String name;
        public final int matchPercent;
        public final int avatarRes;

        public ApplicantItem(String name, int matchPercent, int avatarRes) {
            this.id = (name + matchPercent).hashCode();
            this.name = name;
            this.matchPercent = matchPercent;
            this.avatarRes = avatarRes;
        }
    }

    private final List<ApplicantItem> items = new ArrayList<>();
    private final OnApplicantClickListener clickListener;

    public ApplicantListAdapter(List<ApplicantItem> source, OnApplicantClickListener clickListener) {
        setHasStableIds(true);
        this.clickListener = clickListener;
        items.addAll(source);
    }

    @Override
    public long getItemId(int position) {
        return items.get(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.applicant_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ApplicantItem item = items.get(position);
        holder.name.setText(item.name);
        holder.subtitle.setText("Match score");
        holder.match.setText(item.matchPercent + "%");
        holder.avatar.setImageResource(item.avatarRes);
        holder.itemView.setOnClickListener(v -> clickListener.onApplicantClick(item));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView name;
        final TextView subtitle;
        final TextView match;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.applicant_avatar);
            name = itemView.findViewById(R.id.applicant_name);
            subtitle = itemView.findViewById(R.id.applicant_subtitle);
            match = itemView.findViewById(R.id.applicant_match);
        }
    }
}
