package com.simats.hireai;

import android.os.Bundle;
import android.content.Intent;
import android.util.Log;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CandidateActivity extends AppCompatActivity {
    private static final String KEY_SELECTED_TAB = "selected_tab";
    private static final String TAG_TECH_STACK_GATE = "candidate_tech_stack_gate";
    private static final String TAG = "CandidateActivity";
    public static final String EXTRA_START_TAB = "extra_start_tab";

    private final Map<Integer, String> tabTags = new HashMap<>();
    private int selectedTabId = R.id.nav_home;
    private CandidateStateStore stateStore;
    private BottomNavigationView bottomNav;
    private boolean gateActive;
    private boolean entryResolved;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_candidate);
        stateStore = new CandidateStateStore(this);
        if (!stateStore.getState().isLoggedIn) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        tabTags.put(R.id.nav_home, "candidate_home");
        tabTags.put(R.id.nav_jobs, "candidate_jobs");
        tabTags.put(R.id.nav_applications, "candidate_applications");
        tabTags.put(R.id.nav_profile, "candidate_profile");

        if (savedInstanceState != null) {
            selectedTabId = savedInstanceState.getInt(KEY_SELECTED_TAB, R.id.nav_home);
        } else {
            selectedTabId = getIntent().getIntExtra(EXTRA_START_TAB, R.id.nav_home);
        }

        setupBottomNav();
        getSupportFragmentManager().addOnBackStackChangedListener(this::updateBottomNavVisibilityForCurrentScreen);
        resolveEntryWithServerProfile(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        if (gateActive) {
            if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
                getSupportFragmentManager().popBackStack();
                return;
            }
            super.onBackPressed();
            return;
        }
        if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
            getSupportFragmentManager().popBackStack();
            return;
        }
        finishAffinity();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (entryResolved) {
            updateBottomNavVisibilityForCurrentScreen();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putInt(KEY_SELECTED_TAB, selectedTabId);
    }

    public void pushScreen(int layoutResId) {
        pushFragment(StaticLayoutFragment.newInstance(layoutResId));
    }

    public void pushFragment(Fragment fragment) {
        Fragment current = getVisibleFragment();
        androidx.fragment.app.FragmentTransaction tx = getSupportFragmentManager().beginTransaction();
        if (current != null) {
            tx.hide(current);
        }
        tx.add(R.id.candidate_nav_host, fragment, "candidate_detail_" + System.currentTimeMillis())
                .addToBackStack("candidate_stack_" + selectedTabId)
                .commit();
    }

    public void setBottomNavVisible(boolean visible) {
        if (bottomNav == null) {
            return;
        }
        bottomNav.setVisibility((visible && !gateActive) ? View.VISIBLE : View.GONE);
    }

    public void onTechStackCompleted() {
        stateStore.setTechStackComplete(true);
        stateStore.setTechStackSkipped(false);
        stateStore.setCandidateOnboardingSeen(true);
        Log.d(TAG, "Tech stack completed, entering candidate shell");
        finishOnboardingToHome();
    }

    public void onTechStackSkipped() {
        stateStore.setTechStackSkipped(true);
        stateStore.setCandidateOnboardingSeen(true);
        finishOnboardingToHome();
    }

    public void onResumeSkipped() {
        stateStore.setResumeSkipped(true);
        stateStore.setCandidateOnboardingSeen(true);
        finishOnboardingToHome();
    }

    public void onResumeOnboardingCompleted() {
        stateStore.setResumeSkipped(false);
        stateStore.setCandidateOnboardingSeen(true);
        finishOnboardingToHome();
    }

    public void navigateToRootTab(int tabId) {
        getSupportFragmentManager().popBackStack(null, androidx.fragment.app.FragmentManager.POP_BACK_STACK_INCLUSIVE);
        if (bottomNav != null && bottomNav.getSelectedItemId() != tabId) {
            // Listener will call switchToTab().
            bottomNav.setSelectedItemId(tabId);
            return;
        }
        switchToTab(tabId);
    }

    public void selectTab(int tabId) {
        navigateToRootTab(tabId);
    }

    public CandidateOnboardingState getCandidateState() {
        return stateStore.getState();
    }

    public boolean isOnboardingGateActive() {
        return gateActive;
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
        androidx.fragment.app.FragmentTransaction tx = getSupportFragmentManager().beginTransaction();
        Fragment gateFragment = getSupportFragmentManager().findFragmentByTag(TAG_TECH_STACK_GATE);
        if (gateFragment != null && gateFragment.isAdded()) {
            tx.hide(gateFragment);
        }
        for (String rootTag : tabTags.values()) {
            Fragment root = getSupportFragmentManager().findFragmentByTag(rootTag);
            if (root != null && root.isAdded()) {
                tx.hide(root);
            }
        }
        if (existing == null) {
            existing = StaticLayoutFragment.newInstance(getRootLayoutForTab(tabId));
            tx.add(R.id.candidate_nav_host, existing, tag);
        } else {
            tx.show(existing);
        }
        selectedTabId = tabId;
        // Apply root tab switch synchronously so visibility checks run against the actual visible tab fragment.
        tx.commitNowAllowingStateLoss();
        updateBottomNavVisibilityForCurrentScreen();
    }

    private void showTechStackGate(Bundle savedInstanceState) {
        if (isFinishing() || isDestroyed()) {
            return;
        }
        setBottomNavVisible(false);
        if (savedInstanceState != null && getSupportFragmentManager().findFragmentByTag(TAG_TECH_STACK_GATE) != null) {
            return;
        }
        Fragment gate = StaticLayoutFragment.newInstance(R.layout.fragment_select_tech_stack);
        androidx.fragment.app.FragmentManager fm = getSupportFragmentManager();
        androidx.fragment.app.FragmentTransaction tx = fm.beginTransaction()
                .replace(R.id.candidate_nav_host, gate, TAG_TECH_STACK_GATE);
        // Profile fetch callback may return after onSaveInstanceState (rotation/background).
        // Allow state loss here to prevent a fatal crash; entry will be resolved again on resume/recreate.
        if (fm.isStateSaved()) {
            tx.commitAllowingStateLoss();
        } else {
            tx.commit();
        }
    }

    private void finishOnboardingToHome() {
        gateActive = false;
        getSupportFragmentManager().popBackStackImmediate(null, androidx.fragment.app.FragmentManager.POP_BACK_STACK_INCLUSIVE);
        Fragment gateFragment = getSupportFragmentManager().findFragmentByTag(TAG_TECH_STACK_GATE);
        if (gateFragment != null && gateFragment.isAdded()) {
            getSupportFragmentManager()
                    .beginTransaction()
                    .remove(gateFragment)
                    .commitNowAllowingStateLoss();
        }
        selectedTabId = R.id.nav_home;
        bottomNav.setSelectedItemId(R.id.nav_home);
        switchToTab(R.id.nav_home);
        setBottomNavVisible(true);
    }

    private void updateBottomNavVisibilityForCurrentScreen() {
        Fragment visible = getVisibleFragment();
        if (visible instanceof HrPrepPreloaderFragment) {
            setBottomNavVisible(false);
            return;
        }
        if (visible instanceof StaticLayoutFragment) {
            updateBottomNavVisibilityForLayout(((StaticLayoutFragment) visible).getLayoutId());
        } else if (!gateActive && bottomNav != null) {
            setBottomNavVisible(true);
        }
    }

    private void setupBottomNav() {
        bottomNav = findViewById(R.id.bottom_nav);
        bottomNav.setItemHorizontalTranslationEnabled(false);
        bottomNav.setOnItemSelectedListener(item -> {
            if (gateActive) {
                return false;
            }
            if (item.getItemId() == selectedTabId) {
                return true;
            }
            switchToTab(item.getItemId());
            return true;
        });
    }

    private void updateBottomNavVisibilityForLayout(int layoutId) {
        if (bottomNav == null) {
            return;
        }
        if (gateActive) {
            setBottomNavVisible(false);
            return;
        }
        boolean hide = layoutId == R.layout.fragment_select_tech_stack
                || layoutId == R.layout.fragment_upload_resume
                || layoutId == R.layout.fragment_ai_parsing
                || layoutId == R.layout.fragment_resume_analysis
                || layoutId == R.layout.fragment_match_score_success
                || layoutId == R.layout.fragment_match_score_fail
                || layoutId == R.layout.fragment_candidate_edit_profile
                || layoutId == R.layout.fragment_step1_synthesizing
                || layoutId == R.layout.fragment_step2_question_bank
                || layoutId == R.layout.fragment_step3_optimizing
                || layoutId == R.layout.fragment_finalizing_assessment
                || layoutId == R.layout.fragment_hr_intro
                || layoutId == R.layout.fragment_hr_question
                || layoutId == R.layout.fragment_hr_mcq
                || layoutId == R.layout.fragment_hr_round_cleared
                || layoutId == R.layout.fragment_assessment_review
                || layoutId == R.layout.fragment_select_technical_language
                || layoutId == R.layout.fragment_technical_question
                || layoutId == R.layout.fragment_synth_results
                || layoutId == R.layout.fragment_final_score
                || layoutId == R.layout.fragment_offer_letter
                || layoutId == R.layout.fragment_e_signature
                || layoutId == R.layout.fragment_offer_accepted;
        setBottomNavVisible(!hide);
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
            return R.layout.fragment_candidate_jobs;
        }
        if (tabId == R.id.nav_applications) {
            return R.layout.fragment_candidate_applications;
        }
        if (tabId == R.id.nav_profile) {
            return R.layout.fragment_profile;
        }
        return R.layout.fragment_home;
    }

    private void resolveEntryWithServerProfile(Bundle savedInstanceState) {
        setBottomNavVisible(false);
        ApiClient.getInstance(this).api().getCandidateProfile().enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                if (isFinishing() || isDestroyed()) {
                    return;
                }
                if (!response.isSuccessful() || response.body() == null) {
                    applyLocalEntry(savedInstanceState);
                    return;
                }
                ApiModels.CandidateProfileResponse profile = response.body();
                applyServerProfile(profile);
                boolean serverHasTechStacks = profile.techStacks != null && !profile.techStacks.isEmpty();
                gateActive = !serverHasTechStacks && !stateStore.getState().techStackSkipped;
                entryResolved = true;
                if (gateActive) {
                    showTechStackGate(savedInstanceState);
                    return;
                }
                bottomNav.setSelectedItemId(selectedTabId);
                switchToTab(selectedTabId);
                setBottomNavVisible(true);
            }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                if (isFinishing() || isDestroyed()) {
                    return;
                }
                applyLocalEntry(savedInstanceState);
            }
        });
    }

    private void applyLocalEntry(Bundle savedInstanceState) {
        CandidateOnboardingState state = stateStore.getState();
        gateActive = !state.isTechStackComplete && !state.techStackSkipped;
        entryResolved = true;
        if (gateActive) {
            showTechStackGate(savedInstanceState);
            return;
        }
        bottomNav.setSelectedItemId(selectedTabId);
        switchToTab(selectedTabId);
        setBottomNavVisible(true);
    }

    private void applyServerProfile(ApiModels.CandidateProfileResponse profile) {
        String fullName = profile.fullName == null ? "" : profile.fullName.trim();
        String email = profile.email == null ? "" : profile.email.trim();
        stateStore.setCandidateIdentity(fullName, email);

        boolean hasTech = profile.techStacks != null && !profile.techStacks.isEmpty();
        stateStore.setTechStackComplete(hasTech);
        if (hasTech) {
            stateStore.setTechStackSkipped(false);
            stateStore.setTechStacks(new HashSet<>(profile.techStacks));
            stateStore.setCandidateOnboardingSeen(true);
        }

        boolean hasResume = profile.resumeFileUrl != null && !profile.resumeFileUrl.trim().isEmpty();
        stateStore.setResumeUploaded(hasResume);
        if (hasResume) {
            int idx = profile.resumeFileUrl.lastIndexOf('/');
            stateStore.setResumeFileName(idx >= 0 ? profile.resumeFileUrl.substring(idx + 1) : profile.resumeFileUrl);
        } else {
            stateStore.setResumeFileName("");
        }

        boolean parsed = profile.parsedResumeJson != null && !profile.parsedResumeJson.isEmpty();
        stateStore.setParsedResume(hasResume && parsed);
        CandidateUserStateRepository.getInstance(this).notifyStateChanged();
    }
}
