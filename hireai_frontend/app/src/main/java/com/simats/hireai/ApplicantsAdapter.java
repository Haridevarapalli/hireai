package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

public class ApplicantsAdapter extends ListAdapter<ApplicantsAdapter.Item, ApplicantsAdapter.ViewHolder> {
    public interface OnApplicantClickListener {
        void onApplicantClick(Item item);
    }

    public static class Item {
        public final long id;
        public final int applicationId;
        public final int candidateId;
        public final String name;
        public final String status;
        public final String subtitleText;
        public final int matchPercent;
        public final int avatarRes;

        public Item(String name, int matchPercent, int avatarRes) {
            this(0, 0, name, "Match score", "", matchPercent, avatarRes);
        }

        public Item(int applicationId, int candidateId, String name, String subtitleText, String status, int matchPercent, int avatarRes) {
            this.id = (String.valueOf(applicationId) + name + matchPercent + status).hashCode();
            this.applicationId = applicationId;
            this.candidateId = candidateId;
            this.name = name;
            this.subtitleText = subtitleText == null ? "Match score" : subtitleText;
            this.status = status == null ? "" : status;
            this.matchPercent = matchPercent;
            this.avatarRes = avatarRes;
        }
    }

    private final OnApplicantClickListener onApplicantClickListener;

    public ApplicantsAdapter(OnApplicantClickListener onApplicantClickListener) {
        super(DIFF);
        setHasStableIds(true);
        this.onApplicantClickListener = onApplicantClickListener;
    }

    @Override
    public long getItemId(int position) {
        return getItem(position).id;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_applicant, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = getItem(position);
        holder.name.setText(item.name);
        holder.subtitle.setText(item.subtitleText);
        holder.match.setText(item.matchPercent + "%");
        holder.avatar.setImageResource(item.avatarRes);
        holder.itemView.setOnClickListener(v -> onApplicantClickListener.onApplicantClick(item));
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView name;
        final TextView subtitle;
        final TextView match;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.item_applicant_avatar);
            name = itemView.findViewById(R.id.item_applicant_name);
            subtitle = itemView.findViewById(R.id.item_applicant_subtitle);
            match = itemView.findViewById(R.id.item_applicant_match);
        }
    }

    private static final DiffUtil.ItemCallback<Item> DIFF = new DiffUtil.ItemCallback<Item>() {
        @Override
        public boolean areItemsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.id == newItem.id;
        }

        @Override
        public boolean areContentsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.name.equals(newItem.name)
                    && oldItem.applicationId == newItem.applicationId
                    && oldItem.candidateId == newItem.candidateId
                    && oldItem.matchPercent == newItem.matchPercent
                    && oldItem.status.equals(newItem.status)
                    && oldItem.subtitleText.equals(newItem.subtitleText)
                    && oldItem.avatarRes == newItem.avatarRes;
        }
    };
}
