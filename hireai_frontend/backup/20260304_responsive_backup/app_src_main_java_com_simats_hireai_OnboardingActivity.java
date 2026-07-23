package com.simats.hireai;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import java.util.ArrayList;
import java.util.List;

public class OnboardingActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "hireai_prefs";
    private static final String KEY_ONBOARDING_DONE = "onboarding_done";

    private ViewPager2 viewPager;
    private Button singleNextButton;
    private Button dualNextButton;
    private Button backButton;
    private Button skipButton;
    private LinearLayout dotsContainer;
    private LinearLayout actionsContainer;
    private final List<OnboardingPage> pages = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);

        viewPager = findViewById(R.id.onboarding_view_pager);
        singleNextButton = findViewById(R.id.onboarding_next_button_single);
        dualNextButton = findViewById(R.id.onboarding_next_button_dual);
        backButton = findViewById(R.id.onboarding_back_button);
        skipButton = findViewById(R.id.onboarding_skip_button);
        dotsContainer = findViewById(R.id.onboarding_dots_container);
        actionsContainer = findViewById(R.id.onboarding_actions_container);

        buildPages();
        if (pages.isEmpty()) {
            completeOnboarding();
            return;
        }
        viewPager.setAdapter(new OnboardingPagerAdapter(pages));
        setupDots();
        updateControls(0);
        viewPager.setCurrentItem(0, false);

        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                updateControls(position);
                updateDots(position);
            }
        });

        singleNextButton.setOnClickListener(v -> {
            int current = viewPager.getCurrentItem();
            if (current < pages.size() - 1) {
                viewPager.setCurrentItem(current + 1, true);
            } else {
                completeOnboarding();
            }
        });

        dualNextButton.setOnClickListener(v -> {
            int current = viewPager.getCurrentItem();
            if (current < pages.size() - 1) {
                viewPager.setCurrentItem(current + 1, true);
            } else {
                completeOnboarding();
            }
        });

        backButton.setOnClickListener(v -> {
            int current = viewPager.getCurrentItem();
            if (current > 0) {
                viewPager.setCurrentItem(current - 1, true);
            }
        });

        skipButton.setOnClickListener(v -> completeOnboarding());
    }

    private void buildPages() {
        pages.add(new OnboardingPage(
                R.drawable.ic_robot,
                "HireAI: The Future of Hiring",
                "The only ATS built specifically for the next generation of CSE talent."
        ));
        pages.add(new OnboardingPage(
                R.drawable.ic_pdf_large,
                "Smart AI Resume Matching",
                "Instantly identify top-tier talent with our advanced parsing engine."
        ));
        pages.add(new OnboardingPage(
                R.drawable.ic_analysis,
                "Automated Technical Rounds",
                "Evaluate coding skills instantly with real-time proctoring and scorecards."
        ));
        pages.add(new OnboardingPage(
                R.drawable.ic_assessments,
                "One-tap Offer Letters",
                "Close deals faster with automated offer generation and e-signatures."
        ));
        pages.add(new OnboardingPage(
                R.drawable.ic_home,
                "Ready to Level Up?",
                ""
        ));
    }

    private void setupDots() {
        dotsContainer.removeAllViews();
        for (int i = 0; i < pages.size(); i++) {
            View dot = new View(this);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(14, 14);
            params.setMargins(6, 0, 6, 0);
            dot.setLayoutParams(params);
            dot.setBackgroundResource(R.drawable.bg_onboarding_dot_inactive);
            dotsContainer.addView(dot);
        }
        updateDots(0);
    }

    private void updateDots(int selectedIndex) {
        for (int i = 0; i < dotsContainer.getChildCount(); i++) {
            View dot = dotsContainer.getChildAt(i);
            dot.setBackgroundResource(i == selectedIndex
                    ? R.drawable.bg_onboarding_dot_active
                    : R.drawable.bg_onboarding_dot_inactive);
        }
    }

    private void updateControls(int position) {
        if (pages.isEmpty()) {
            return;
        }
        boolean isLast = position == pages.size() - 1;
        boolean isFirst = position == 0;

        skipButton.setVisibility(isLast ? View.GONE : View.VISIBLE);

        if (isFirst || isLast) {
            actionsContainer.setVisibility(View.GONE);
            singleNextButton.setVisibility(View.VISIBLE);
            singleNextButton.setText(isLast ? "Get Started" : "Next");
        } else {
            actionsContainer.setVisibility(View.VISIBLE);
            singleNextButton.setVisibility(View.GONE);
            dualNextButton.setText("Next");
        }
    }

    private void completeOnboarding() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_ONBOARDING_DONE, true).apply();
        new CandidateStateStore(this).markOnboardingSeen();

        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}
