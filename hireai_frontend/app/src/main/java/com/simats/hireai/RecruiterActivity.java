package com.simats.hireai;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.HashMap;
import java.util.Map;

public class RecruiterActivity extends AppCompatActivity {
    private static final String KEY_SELECTED_TAB = "selected_tab";
    public static final String EXTRA_START_TAB = "extra_start_tab";

    private final Map<Integer, String> tabTags = new HashMap<>();
    private int selectedTabId = R.id.nav_dashboard;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_recruiter);
        WindowInsetHelper.applyShellInsets(this, R.id.recruiter_nav_host, R.id.recruiter_bottom_nav);

        tabTags.put(R.id.nav_dashboard, "recruiter_dashboard");
        tabTags.put(R.id.nav_jobs, "recruiter_jobs");
        tabTags.put(R.id.nav_applicants, "recruiter_applicants");
        tabTags.put(R.id.nav_offers, "recruiter_offers");
        tabTags.put(R.id.nav_profile, "recruiter_profile");

        if (savedInstanceState != null) {
            selectedTabId = savedInstanceState.getInt(KEY_SELECTED_TAB, R.id.nav_dashboard);
        } else {
            selectedTabId = getIntent().getIntExtra(EXTRA_START_TAB, R.id.nav_dashboard);
        }

        BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
        bottomNav.setItemHorizontalTranslationEnabled(false);
        bottomNav.setOnItemSelectedListener(item -> {
            if (item.getItemId() == selectedTabId) {
                return true;
            }
            switchToTab(item.getItemId());
            return true;
        });

        if (savedInstanceState == null) {
            switchToTab(selectedTabId);
        } else {
            bottomNav.setSelectedItemId(selectedTabId);
            switchToTab(selectedTabId);
        }
    }

    @Override
    public void onBackPressed() {
        if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
            getSupportFragmentManager().popBackStack();
            return;
        }
        if (selectedTabId != R.id.nav_dashboard) {
            selectedTabId = R.id.nav_dashboard;
            BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
            bottomNav.setSelectedItemId(R.id.nav_dashboard);
            switchToTab(R.id.nav_dashboard);
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putInt(KEY_SELECTED_TAB, selectedTabId);
    }

    public void pushScreen(int layoutResId) {
        startActivity(RecruiterDetailActivity.createIntent(this, layoutResId));
    }

    public void navigateToRootTab(int tabId) {
        getSupportFragmentManager().popBackStack(
                null,
                androidx.fragment.app.FragmentManager.POP_BACK_STACK_INCLUSIVE
        );
        BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
        bottomNav.setSelectedItemId(tabId);
        switchToTab(tabId);
    }

    private void switchToTab(int tabId) {
        getSupportFragmentManager().executePendingTransactions();
        String tag = tabTags.get(tabId);
        if (tag == null) {
            return;
        }

        if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
            getSupportFragmentManager().popBackStackImmediate(
                    null,
                    androidx.fragment.app.FragmentManager.POP_BACK_STACK_INCLUSIVE
            );
        }

        Fragment existing = getSupportFragmentManager().findFragmentByTag(tag);
        if (existing == null) {
            existing = StaticLayoutFragment.newInstance(getRootLayoutForTab(tabId));
        }

        androidx.fragment.app.FragmentTransaction tx = getSupportFragmentManager().beginTransaction();
        for (String rootTag : tabTags.values()) {
            Fragment root = getSupportFragmentManager().findFragmentByTag(rootTag);
            if (root != null && root.isAdded()) {
                tx.hide(root);
            }
        }
        if (existing.isAdded()) {
            tx.show(existing);
        } else {
            tx.add(R.id.recruiter_nav_host, existing, tag);
        }
        tx.commit();
        selectedTabId = tabId;
    }

    private Fragment getVisibleFragment() {
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            if (fragment != null && fragment.isVisible() && !fragment.isDetached()) {
                return fragment;
            }
        }
        return null;
    }

    private int getRootLayoutForTab(int tabId) {
        if (tabId == R.id.nav_jobs) {
            return R.layout.fragment_recruiter_active_jobs;
        }
        if (tabId == R.id.nav_applicants) {
            return R.layout.fragment_recruiter_applicants;
        }
        if (tabId == R.id.nav_offers) {
            return R.layout.fragment_recruiter_offers;
        }
        if (tabId == R.id.nav_profile) {
            return R.layout.fragment_recruiter_profile;
        }
        return R.layout.fragment_recruiter_dashboard;
    }
}
