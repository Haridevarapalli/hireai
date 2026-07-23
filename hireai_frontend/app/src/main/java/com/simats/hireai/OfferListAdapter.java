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

public class OfferListAdapter extends RecyclerView.Adapter<OfferListAdapter.ViewHolder> {
    public enum Status {
        PENDING, NEGOTIATING, SIGNED
    }

    public static class OfferItem {
        public final long id;
        public final String candidateName;
        public final String role;
        public final Status status;
        public final int avatarRes;

        public OfferItem(String candidateName, String role, Status status, int avatarRes) {
            this.id = (candidateName + role + status.name()).hashCode();
            this.candidateName = candidateName;
            this.role = role;
            this.status = status;
            this.avatarRes = avatarRes;
        }
    }

    public interface OnOfferClickListener {
        void onOfferClick(OfferItem item);
    }

    private final List<OfferItem> allItems = new ArrayList<>();
    private final List<OfferItem> visibleItems = new ArrayList<>();
    private final OnOfferClickListener clickListener;

    public OfferListAdapter(List<OfferItem> source, OnOfferClickListener clickListener) {
        setHasStableIds(true);
        this.clickListener = clickListener;
        allItems.addAll(source);
        visibleItems.addAll(source);
    }

    public void setFilter(Status status) {
        visibleItems.clear();
        if (status == null) {
            visibleItems.addAll(allItems);
        } else {
            for (OfferItem item : allItems) {
                if (item.status == status) {
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.offer_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        OfferItem item = visibleItems.get(position);
        holder.title.setText("Offer for " + item.candidateName);
        holder.role.setText(item.role);
        holder.avatar.setImageResource(item.avatarRes);
        if (item.status == Status.PENDING) {
            holder.status.setText("Pending Signature");
            holder.status.setBackgroundResource(R.drawable.bg_chip_pending);
            holder.status.setTextColor(holder.status.getContext().getColor(R.color.chip_pending_text));
        } else if (item.status == Status.NEGOTIATING) {
            holder.status.setText("Negotiating");
            holder.status.setBackgroundResource(R.drawable.bg_chip_negotiating);
            holder.status.setTextColor(holder.status.getContext().getColor(R.color.chip_negotiating_text));
        } else {
            holder.status.setText("Signed/Accepted");
            holder.status.setBackgroundResource(R.drawable.bg_chip_signed);
            holder.status.setTextColor(holder.status.getContext().getColor(R.color.chip_signed_text));
        }
        holder.itemView.setOnClickListener(v -> clickListener.onOfferClick(item));
    }

    @Override
    public int getItemCount() {
        return visibleItems.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView title;
        final TextView role;
        final TextView status;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.offer_avatar);
            title = itemView.findViewById(R.id.offer_title);
            role = itemView.findViewById(R.id.offer_role);
            status = itemView.findViewById(R.id.offer_status_chip);
        }
    }
}
