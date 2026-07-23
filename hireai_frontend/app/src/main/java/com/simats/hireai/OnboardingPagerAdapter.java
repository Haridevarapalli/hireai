package com.simats.hireai;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class OnboardingPagerAdapter extends RecyclerView.Adapter<OnboardingPagerAdapter.OnboardingViewHolder> {
    private final List<OnboardingPage> pages;

    public OnboardingPagerAdapter(List<OnboardingPage> pages) {
        this.pages = pages;
    }

    @NonNull
    @Override
    public OnboardingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_onboarding_page, parent, false);
        return new OnboardingViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull OnboardingViewHolder holder, int position) {
        OnboardingPage page = pages.get(position);
        holder.image.setImageResource(page.imageRes);
        holder.title.setText(page.title);
        holder.description.setText(page.description);
        holder.description.setVisibility(page.description == null || page.description.isEmpty() ? View.GONE : View.VISIBLE);
    }

    @Override
    public int getItemCount() {
        return pages.size();
    }

    static class OnboardingViewHolder extends RecyclerView.ViewHolder {
        final ImageView image;
        final TextView title;
        final TextView description;

        OnboardingViewHolder(@NonNull View itemView) {
            super(itemView);
            image = itemView.findViewById(R.id.onboarding_page_image);
            title = itemView.findViewById(R.id.onboarding_page_title);
            description = itemView.findViewById(R.id.onboarding_page_description);
        }
    }
}
