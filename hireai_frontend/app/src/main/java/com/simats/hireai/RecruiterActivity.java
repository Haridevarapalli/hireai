package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationView;
import com.simats.hireai.network.TokenStore;

import java.util.HashMap;
import java.util.Map;

public class RecruiterActivity extends AppCompatActivity {
    private static final String KEY_SELECTED_TAB = "selected_tab";
    public static final String EXTRA_START_TAB = "extra_start_tab";

    private final Map<Integer, String> tabTags = new HashMap<>();
    private int selectedTabId = R.id.nav_dashboard;
    private DrawerLayout drawerLayout;
    private NavigationView drawerNav;

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

        drawerLayout = findViewById(R.id.recruiter_drawer_layout);
        drawerNav = findViewById(R.id.recruiter_drawer_nav);

        ImageButton drawerBtn = findViewById(R.id.recruiter_btn_drawer);
        if (drawerBtn != null) {
            drawerBtn.setOnClickListener(v -> {
                if (drawerLayout != null) {
                    drawerLayout.openDrawer(GravityCompat.START);
                }
            });
        }

        ImageButton notificationsBtn = findViewById(R.id.recruiter_btn_notifications);
        if (notificationsBtn != null) {
            notificationsBtn.setOnClickListener(v -> pushScreen(R.layout.fragment_recruiter_notifications));
        }

        setupDrawerNav();

        BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
        if (bottomNav != null) {
            bottomNav.setItemHorizontalTranslationEnabled(false);
            bottomNav.setOnItemSelectedListener(item -> {
                if (item.getItemId() == selectedTabId) {
                    return true;
                }
                switchToTab(item.getItemId());
                return true;
            });
            bottomNav.setSelectedItemId(selectedTabId);
        }

        if (savedInstanceState == null) {
            switchToTab(selectedTabId);
        }
    }

    private void setupDrawerNav() {
        if (drawerNav == null) return;
        drawerNav.setNavigationItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (drawerLayout != null) {
                drawerLayout.closeDrawer(GravityCompat.START);
            }
            if (itemId == R.id.nav_logout) {
                performLogout();
                return true;
            }
            if (itemId == R.id.nav_dashboard) {
                navigateToRootTab(R.id.nav_dashboard);
            } else if (itemId == R.id.nav_post_job) {
                pushScreen(R.layout.fragment_recruiter_post_job);
            } else if (itemId == R.id.nav_manage_jobs) {
                navigateToRootTab(R.id.nav_jobs);
            } else if (itemId == R.id.nav_candidates) {
                pushScreen(R.layout.fragment_recruiter_candidates);
            } else if (itemId == R.id.nav_ai_screening) {
                pushScreen(R.layout.fragment_recruiter_ai_screening);
            } else if (itemId == R.id.nav_applications) {
                navigateToRootTab(R.id.nav_applicants);
            } else if (itemId == R.id.nav_interviews) {
                pushScreen(R.layout.fragment_recruiter_interviews);
            } else if (itemId == R.id.nav_offers) {
                navigateToRootTab(R.id.nav_offers);
            } else if (itemId == R.id.nav_hiring_analytics) {
                pushScreen(R.layout.fragment_recruiter_analytics);
            } else if (itemId == R.id.nav_profile) {
                navigateToRootTab(R.id.nav_profile);
            } else if (itemId == R.id.nav_settings) {
                pushScreen(R.layout.fragment_recruiter_settings);
            }
            return true;
        });
    }

    private void performLogout() {
        TokenStore.getInstance(this).clear();
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        if (drawerLayout != null && drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
            return;
        }
        if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
            getSupportFragmentManager().popBackStack();
            return;
        }
        if (selectedTabId != R.id.nav_dashboard) {
            selectedTabId = R.id.nav_dashboard;
            BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
            if (bottomNav != null) bottomNav.setSelectedItemId(R.id.nav_dashboard);
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
        Fragment fragment = StaticLayoutFragment.newInstance(layoutResId);
        getSupportFragmentManager().beginTransaction()
                .replace(R.id.recruiter_nav_host, fragment)
                .addToBackStack(null)
                .commit();
    }

    public void navigateToRootTab(int tabId) {
        getSupportFragmentManager().popBackStack(
                null,
                androidx.fragment.app.FragmentManager.POP_BACK_STACK_INCLUSIVE
        );
        BottomNavigationView bottomNav = findViewById(R.id.recruiter_bottom_nav);
        if (bottomNav != null) bottomNav.setSelectedItemId(tabId);
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
