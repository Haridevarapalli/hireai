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

import java.util.ArrayList;
import java.util.List;

public class OffersAdapter extends ListAdapter<OffersAdapter.Item, OffersAdapter.ViewHolder> {
    public enum Status {
        PENDING, NEGOTIATING, SIGNED
    }

    public interface OnOfferClickListener {
        void onOfferClick(Item item);
    }

    public static class Item {
        public final long id;
        public final int offerId;
        public final String candidateName;
        public final String role;
        public final Status status;
        public final int avatarRes;

        public Item(String candidateName, String role, Status status, int avatarRes) {
            this(0, candidateName, role, status, avatarRes);
        }

        public Item(int offerId, String candidateName, String role, Status status, int avatarRes) {
            this.id = (String.valueOf(offerId) + candidateName + role + status.name()).hashCode();
            this.offerId = offerId;
            this.candidateName = candidateName;
            this.role = role;
            this.status = status;
            this.avatarRes = avatarRes;
        }
    }

    private final List<Item> fullList = new ArrayList<>();
    private final OnOfferClickListener onOfferClickListener;
    private Status currentStatusFilter = null;
    private String currentQuery = "";

    public OffersAdapter(OnOfferClickListener onOfferClickListener) {
        super(DIFF);
        setHasStableIds(true);
        this.onOfferClickListener = onOfferClickListener;
    }

    public void setItems(List<Item> items) {
        fullList.clear();
        fullList.addAll(items);
        applyFilters();
    }

    public void setFilter(Status status) {
        currentStatusFilter = status;
        applyFilters();
    }

    public void setQuery(String query) {
        currentQuery = query == null ? "" : query.trim().toLowerCase();
        applyFilters();
    }

    private void applyFilters() {
        List<Item> filtered = new ArrayList<>();
        for (Item item : fullList) {
            if (currentStatusFilter != null && item.status != currentStatusFilter) {
                continue;
            }
            if (!currentQuery.isEmpty()) {
                String title = ("Offer for " + item.candidateName).toLowerCase();
                String role = item.role.toLowerCase();
                String status = item.status.name().toLowerCase();
                if (!title.contains(currentQuery) && !role.contains(currentQuery) && !status.contains(currentQuery)) {
                    continue;
                }
            }
            filtered.add(item);
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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_offer, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Item item = getItem(position);
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
        holder.itemView.setOnClickListener(v -> onOfferClickListener.onOfferClick(item));
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView avatar;
        final TextView title;
        final TextView role;
        final TextView status;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.item_offer_avatar);
            title = itemView.findViewById(R.id.item_offer_title);
            role = itemView.findViewById(R.id.item_offer_role);
            status = itemView.findViewById(R.id.item_offer_status);
        }
    }

    private static final DiffUtil.ItemCallback<Item> DIFF = new DiffUtil.ItemCallback<Item>() {
        @Override
        public boolean areItemsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.id == newItem.id;
        }

        @Override
        public boolean areContentsTheSame(@NonNull Item oldItem, @NonNull Item newItem) {
            return oldItem.candidateName.equals(newItem.candidateName)
                    && oldItem.offerId == newItem.offerId
                    && oldItem.role.equals(newItem.role)
                    && oldItem.status == newItem.status
                    && oldItem.avatarRes == newItem.avatarRes;
        }
    };
}
