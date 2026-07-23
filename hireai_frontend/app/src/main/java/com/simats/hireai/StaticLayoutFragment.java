package com.simats.hireai;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.animation.ObjectAnimator;
import android.animation.AnimatorSet;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Space;
import android.widget.TextView;
import android.widget.Toast;
import android.provider.OpenableColumns;
import android.os.CountDownTimer;
import android.os.Build;
import android.provider.MediaStore;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.LayoutRes;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.RecyclerView;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.transition.MaterialFadeThrough;
import com.google.android.material.transition.MaterialSharedAxis;
import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.Map;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import okhttp3.ResponseBody;

public class StaticLayoutFragment extends Fragment {
    private static final String ARG_LAYOUT_ID = "arg_layout_id";
    private int layoutId = R.layout.fragment_home;
    private Runnable autoAdvanceRunnable;
    private ActivityResultLauncher<String[]> resumePickerLauncher;
    @Nullable private Uri pendingResumeUri;
    @Nullable private String pendingResumeName;
    private volatile boolean parseCompleted = false;
    private volatile boolean parseInFlight = false;
    private volatile boolean parseFailed = false;
    private int parsingVisualProgress = 0;
    private Runnable parseStatusPollRunnable;
    private final Handler parsingHandler = new Handler(Looper.getMainLooper());
    private final List<String> profileSkills = new ArrayList<>();
    private final List<String> profileCertifications = new ArrayList<>();
    private final Map<String, Object> profileParsedJson = new HashMap<>();
    private String profileFullName = "";
    private String profileEmail = "";
    private String profilePhone = "";
    @Nullable private ApiModels.ApiJob recruiterSelectedJob;
    @Nullable private ApiModels.ApplicationDto recruiterSelectedApplicant;
    @Nullable private ApiModels.RecruiterOfferDto recruiterSelectedOffer;
    @Nullable private ApiModels.RecruiterCandidateProfileResponse recruiterSelectedCandidateProfile;
    private final List<ApiModels.ApiJob> recruiterJobsCache = new ArrayList<>();
    private final List<ApiModels.RecruiterOfferDto> recruiterOfferCache = new ArrayList<>();
    private final List<ApiModels.ApplicationDto> recruiterApplicantsCache = new ArrayList<>();
    private final List<ApiModels.ApplicationDto> candidateApplicationsCache = new ArrayList<>();
    @Nullable private ApiModels.ApplicationDto candidateActionableApplication;
    private final List<ApiModels.AssessmentQuestionDto> activeAssessmentQuestions = new ArrayList<>();
    private final Map<Integer, Integer> activeAssessmentAnswers = new HashMap<>();
    private @Nullable ApiModels.AssessmentSubmitResult lastAssessmentResult;
    private @Nullable CountDownTimer assessmentCountdown;
    private final Handler assessmentStartHandler = new Handler(Looper.getMainLooper());
    private @Nullable Runnable assessmentStartRetryRunnable;
    private boolean assessmentStartInFlight = false;
    private boolean assessmentStartToastShown = false;
    private int assessmentStartAttempt = 0;
    private String assessmentStartStage = "";
    private int assessmentStartAppId = 0;
    private static final String RECRUITER_UI_PREFS = "hireai_recruiter_ui_state";
    private static final String CANDIDATE_UI_PREFS = "hireai_candidate_ui_state";
    private static final String KEY_RECRUITER_SELECTED_JOB_ID = "selected_job_id";
    private static final String KEY_RECRUITER_SELECTED_APPLICATION_ID = "selected_application_id";
    private static final String KEY_RECRUITER_SELECTED_OFFER_ID = "selected_offer_id";
    private static final String KEY_RECRUITER_SETTING_HIRING_NOTIFS = "setting_hiring_notifications";
    private static final String KEY_RECRUITER_SETTING_AI_SENSITIVITY = "setting_ai_sensitivity";
    private static final String KEY_RECRUITER_SETTING_TEAM_ACCESS = "setting_team_access";

    public static StaticLayoutFragment newInstance(@LayoutRes int layoutId) {
        StaticLayoutFragment fragment = new StaticLayoutFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_LAYOUT_ID, layoutId);
        fragment.setArguments(args);
        return fragment;
    }

    public int getLayoutId() {
        return layoutId;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        Bundle args = getArguments();
        if (args != null) {
            layoutId = args.getInt(ARG_LAYOUT_ID, R.layout.fragment_home);
        }
        applyFlowTransitions(layoutId);
        return inflater.inflate(layoutId, container, false);
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        resumePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.OpenDocument(),
                this::onResumeFilePicked
        );
    }

    private void applyFlowTransitions(int currentLayoutId) {
        if (currentLayoutId == R.layout.fragment_ai_parsing) {
            setEnterTransition(new MaterialFadeThrough());
            setReturnTransition(new MaterialFadeThrough());
        } else if (currentLayoutId == R.layout.fragment_resume_analysis) {
            setEnterTransition(new MaterialSharedAxis(MaterialSharedAxis.X, true));
            setReturnTransition(new MaterialSharedAxis(MaterialSharedAxis.X, false));
        } else if (currentLayoutId == R.layout.fragment_step1_synthesizing
                || currentLayoutId == R.layout.fragment_step2_question_bank
                || currentLayoutId == R.layout.fragment_step3_optimizing
                || currentLayoutId == R.layout.fragment_finalizing_assessment
                || currentLayoutId == R.layout.fragment_hr_intro
                || currentLayoutId == R.layout.fragment_hr_question
                || currentLayoutId == R.layout.fragment_hr_mcq
                || currentLayoutId == R.layout.fragment_hr_round_cleared
                || currentLayoutId == R.layout.fragment_assessment_review
                || currentLayoutId == R.layout.fragment_select_technical_language
                || currentLayoutId == R.layout.fragment_technical_question
                || currentLayoutId == R.layout.fragment_synth_results
                || currentLayoutId == R.layout.fragment_final_score
                || currentLayoutId == R.layout.fragment_offer_letter
                || currentLayoutId == R.layout.fragment_e_signature
                || currentLayoutId == R.layout.fragment_offer_accepted
                || currentLayoutId == R.layout.fragment_candidate_application_details) {
            setEnterTransition(new MaterialSharedAxis(MaterialSharedAxis.X, true));
            setReturnTransition(new MaterialSharedAxis(MaterialSharedAxis.X, false));
        } else if (currentLayoutId == R.layout.fragment_match_score_success
                || currentLayoutId == R.layout.fragment_match_score_fail) {
            setEnterTransition(new MaterialSharedAxis(MaterialSharedAxis.Z, true));
            setReturnTransition(new MaterialSharedAxis(MaterialSharedAxis.Z, false));
        } else if (currentLayoutId == R.layout.fragment_recruiter_post_job
                || currentLayoutId == R.layout.fragment_recruiter_candidate_profile
                || currentLayoutId == R.layout.fragment_recruiter_candidate_action
                || currentLayoutId == R.layout.fragment_recruiter_job_details
                || currentLayoutId == R.layout.fragment_recruiter_applicants_list
                || currentLayoutId == R.layout.fragment_recruiter_offer_details
                || currentLayoutId == R.layout.fragment_recruiter_notifications
                || currentLayoutId == R.layout.fragment_recruiter_settings
                || currentLayoutId == R.layout.fragment_recruiter_help_center
                || currentLayoutId == R.layout.fragment_edit_profile) {
            setEnterTransition(new MaterialSharedAxis(MaterialSharedAxis.X, true));
            setReturnTransition(new MaterialSharedAxis(MaterialSharedAxis.X, false));
        }
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        if (layoutId == R.layout.fragment_home) {
            bindCandidateHome(view);
        } else if (layoutId == R.layout.fragment_candidate_jobs) {
            bindCandidateJobs(view);
        } else if (layoutId == R.layout.fragment_select_tech_stack) {
            bindCandidateTechStack(view);
        } else if (layoutId == R.layout.fragment_upload_resume) {
            bindUploadResume(view);
        } else if (layoutId == R.layout.fragment_ai_parsing) {
            bindAiParsing(view);
        } else if (layoutId == R.layout.fragment_resume_analysis) {
            bindResumeAnalysis(view);
        } else if (layoutId == R.layout.fragment_match_score_success) {
            bindMatchScoreSuccess(view);
        } else if (layoutId == R.layout.fragment_match_score_fail) {
            bindMatchScoreFail(view);
        } else if (layoutId == R.layout.fragment_candidate_applications) {
            bindCandidateApplications(view);
        } else if (layoutId == R.layout.fragment_candidate_application_details) {
            bindCandidateApplicationDetails(view);
        } else if (layoutId == R.layout.fragment_profile) {
            bindCandidateProfile(view);
        } else if (layoutId == R.layout.fragment_candidate_edit_profile) {
            bindCandidateEditProfile(view);
        } else if (layoutId == R.layout.fragment_step1_synthesizing) {
            bindAutoAdvance(view, R.layout.fragment_step2_question_bank, 1100L);
        } else if (layoutId == R.layout.fragment_step2_question_bank) {
            bindAutoAdvance(view, R.layout.fragment_step3_optimizing, 1100L);
        } else if (layoutId == R.layout.fragment_step3_optimizing) {
            view.findViewById(R.id.step3_next).setOnClickListener(v -> pushCandidate(R.layout.fragment_finalizing_assessment));
        } else if (layoutId == R.layout.fragment_finalizing_assessment) {
            bindFinalizingAssessment(view);
        } else if (layoutId == R.layout.fragment_hr_intro) {
            bindHrIntro(view);
        } else if (layoutId == R.layout.fragment_hr_question) {
            bindHrQuestion(view);
        } else if (layoutId == R.layout.fragment_hr_mcq) {
            bindHrMcq(view);
        } else if (layoutId == R.layout.fragment_hr_round_cleared) {
            bindHrCleared(view);
        } else if (layoutId == R.layout.fragment_select_technical_language) {
            bindTechnicalLanguage(view);
        } else if (layoutId == R.layout.fragment_technical_question) {
            bindTechnicalQuestion(view);
        } else if (layoutId == R.layout.fragment_assessment_review) {
            bindAssessmentReview(view);
        } else if (layoutId == R.layout.fragment_synth_results) {
            bindSynthResults(view);
        } else if (layoutId == R.layout.fragment_final_score) {
            bindFinalScore(view);
        } else if (layoutId == R.layout.fragment_offer_letter) {
            bindOfferLetter(view);
        } else if (layoutId == R.layout.fragment_e_signature) {
            bindESignature(view);
        } else if (layoutId == R.layout.fragment_offer_accepted) {
            bindOfferAccepted(view);
        } else if (layoutId == R.layout.fragment_recruiter_dashboard) {
            bindRecruiterDashboard(view);
        } else if (layoutId == R.layout.fragment_recruiter_active_jobs) {
            bindRecruiterJobs(view);
        } else if (layoutId == R.layout.fragment_recruiter_applicants) {
            bindRecruiterApplicants(view);
        } else if (layoutId == R.layout.fragment_recruiter_offers) {
            bindRecruiterOffers(view);
        } else if (layoutId == R.layout.fragment_recruiter_profile) {
            bindRecruiterProfile(view);
        } else if (layoutId == R.layout.fragment_recruiter_candidate_profile) {
            bindRecruiterCandidateProfile(view);
        } else if (layoutId == R.layout.fragment_recruiter_candidate_action) {
            bindRecruiterCandidateAction(view);
        } else if (layoutId == R.layout.fragment_recruiter_notifications) {
            bindRecruiterNotifications(view);
        } else if (layoutId == R.layout.fragment_recruiter_application_history) {
            bindRecruiterHistory(view);
        } else if (layoutId == R.layout.fragment_recruiter_settings) {
            bindRecruiterSettings(view);
        } else if (layoutId == R.layout.fragment_recruiter_help_center) {
            bindRecruiterHelpCenter(view);
        } else if (layoutId == R.layout.fragment_recruiter_post_job) {
            bindRecruiterPostJob(view);
        } else if (layoutId == R.layout.fragment_recruiter_job_details) {
            bindRecruiterJobDetails(view);
        } else if (layoutId == R.layout.fragment_recruiter_applicants_list) {
            bindRecruiterApplicantsList(view);
        } else if (layoutId == R.layout.fragment_recruiter_offer_details) {
            bindRecruiterOfferDetails(view);
        } else if (layoutId == R.layout.fragment_edit_profile) {
            bindEditProfile(view);
        }
        ensureBackOnDetailToolbar(view);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStatusBarForCurrentLayout();
        View root = getView();
        if (root == null) {
            return;
        }
        if (layoutId == R.layout.fragment_home) {
            refreshCandidateStateFromBackend(root, () -> renderCandidateHome(root));
        } else if (layoutId == R.layout.fragment_candidate_jobs) {
            refreshCandidateStateFromBackend(root, () -> updateJobsResumeBanner(root));
        } else if (layoutId == R.layout.fragment_candidate_applications) {
            bindCandidateApplications(root);
        } else if (layoutId == R.layout.fragment_candidate_application_details) {
            bindCandidateApplicationDetails(root);
        } else if (layoutId == R.layout.fragment_profile) {
            fetchCandidateProfile(root, false);
        } else if (layoutId == R.layout.fragment_recruiter_dashboard) {
            bindRecruiterDashboard(root);
        } else if (layoutId == R.layout.fragment_recruiter_active_jobs) {
            bindRecruiterJobs(root);
        } else if (layoutId == R.layout.fragment_recruiter_applicants) {
            bindRecruiterApplicants(root);
        } else if (layoutId == R.layout.fragment_recruiter_applicants_list) {
            bindRecruiterApplicantsList(root);
        } else if (layoutId == R.layout.fragment_recruiter_offers) {
            bindRecruiterOffers(root);
        } else if (layoutId == R.layout.fragment_recruiter_job_details) {
            bindRecruiterJobDetails(root);
        } else if (layoutId == R.layout.fragment_recruiter_offer_details) {
            bindRecruiterOfferDetails(root);
        }
    }

    @Override
    public void onDestroyView() {
        if (autoAdvanceRunnable != null && getView() != null) {
            getView().removeCallbacks(autoAdvanceRunnable);
        }
        if (assessmentCountdown != null) {
            assessmentCountdown.cancel();
            assessmentCountdown = null;
        }
        cancelAssessmentStartRetry();
        parsingHandler.removeCallbacksAndMessages(null);
        autoAdvanceRunnable = null;
        super.onDestroyView();
    }

    private void bindCandidateTechStack(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        observeSharedCandidateState(view);
        Set<Integer> selected = new HashSet<>();
        java.util.Map<Integer, String> techByCardId = new java.util.HashMap<>();
        techByCardId.put(R.id.card_web, "Web Development");
        techByCardId.put(R.id.card_ai, "AI/ML");
        techByCardId.put(R.id.card_data, "Data Science");
        techByCardId.put(R.id.card_backend, "Backend");
        techByCardId.put(R.id.card_fullstack, "Full Stack");
        techByCardId.put(R.id.card_analysis, "Data Analysis");
        List<Integer> cardIds = Arrays.asList(
                R.id.card_web, R.id.card_ai, R.id.card_data, R.id.card_backend, R.id.card_fullstack, R.id.card_analysis
        );
        View continueButton = view.findViewById(R.id.stack_continue);

        for (Integer cardId : cardIds) {
            View card = view.findViewById(cardId);
            if (card == null) {
                continue;
            }
            card.setActivated(false);
            card.setOnClickListener(v -> {
                if (selected.contains(cardId)) {
                    selected.remove(cardId);
                    card.setActivated(false);
                } else {
                    selected.add(cardId);
                    card.setActivated(true);
                }
                continueButton.setEnabled(!selected.isEmpty());
                continueButton.setAlpha(selected.isEmpty() ? 0.5f : 1f);
            });
        }

        continueButton.setEnabled(false);
        continueButton.setAlpha(0.5f);
        View skipButton = view.findViewById(R.id.stack_skip);
        if (skipButton != null) {
            skipButton.setOnClickListener(v -> {
                stateStore.setTechStackSkipped(true);
                if (getActivity() instanceof CandidateActivity) {
                    ((CandidateActivity) getActivity()).onTechStackSkipped();
                } else {
                    openCandidateTab(R.id.nav_jobs);
                }
            });
        }
        continueButton.setOnClickListener(v -> {
            if (selected.isEmpty()) {
                return;
            }
            Set<String> selectedStacks = new HashSet<>();
            for (Integer id : selected) {
                String stack = techByCardId.get(id);
                if (stack != null) {
                    selectedStacks.add(stack);
                }
            }
            ApiModels.CandidateProfileUpdateRequest request = new ApiModels.CandidateProfileUpdateRequest();
            request.techStacks = new ArrayList<>(selectedStacks);
            ApiClient.getInstance(requireContext()).api().updateCandidateProfile(request)
                    .enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
                        @Override
                        public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                            if (!isAdded()) {
                                return;
                            }
                            if (!response.isSuccessful() || response.body() == null) {
                                Snackbar.make(view, "Could not save tech stack. Please retry.", Snackbar.LENGTH_SHORT).show();
                                return;
                            }
                            syncCandidateStateFromProfile(response.body());
                            stateStore.setTechStackSkipped(false);
                            notifyCandidateStateChanged();
                            refreshCandidateStateFromBackend(view, null);
                            continueAfterTechStackSaved();
                        }

                        @Override
                        public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                            if (!isAdded()) {
                                return;
                            }
                            Snackbar.make(view, "Network error while saving tech stack.", Snackbar.LENGTH_SHORT).show();
                        }

                        private void continueAfterTechStackSaved() {
                            if (!isAdded()) {
                                return;
                            }
                            if (getActivity() instanceof CandidateActivity) {
                                CandidateActivity activity = (CandidateActivity) getActivity();
                                if (activity.isOnboardingGateActive()) {
                                    activity.onTechStackCompleted();
                                } else {
                                    openCandidateTab(R.id.nav_jobs);
                                }
                            } else {
                                pushCandidate(R.layout.fragment_upload_resume);
                            }
                        }
                    });
        });
    }

    private void applyStatusBarForCurrentLayout() {
        if (getActivity() == null) {
            return;
        }
        boolean darkSurface = layoutId == R.layout.fragment_hr_intro
                || layoutId == R.layout.fragment_hr_question
                || layoutId == R.layout.fragment_hr_mcq
                || layoutId == R.layout.fragment_hr_round_cleared
                || layoutId == R.layout.fragment_assessment_review
                || layoutId == R.layout.fragment_select_technical_language
                || layoutId == R.layout.fragment_technical_question
                || layoutId == R.layout.fragment_ai_parsing
                || layoutId == R.layout.fragment_match_score_fail;

        int statusColor = ContextCompat.getColor(requireContext(), darkSurface ? R.color.bg_dark : R.color.bg_light);
        getActivity().getWindow().setStatusBarColor(statusColor);
        getActivity().getWindow().setNavigationBarColor(statusColor);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getActivity().getWindow(), getActivity().getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(!darkSurface);
            controller.setAppearanceLightNavigationBars(!darkSurface);
        }
    }

    private void bindCandidateHome(View view) {
        observeSharedCandidateState(view);
        CandidateHomeViewModel vm = new ViewModelProvider(this).get(CandidateHomeViewModel.class);
        vm.getHomeState().observe(getViewLifecycleOwner(), state -> renderCandidateHome(view));

        RecyclerView recommendedList = view.findViewById(R.id.home_recommended_list);
        JobsAdapter recommendedAdapter = new JobsAdapter(item -> {
            openCandidateTab(R.id.nav_jobs);
        });
        recommendedList.setAdapter(recommendedAdapter);

        RecyclerView recentList = view.findViewById(R.id.home_recent_applications_list);
        HomeRecentApplicationsAdapter recentAdapter = new HomeRecentApplicationsAdapter(app -> {
            if (app == null) {
                return;
            }
            CandidateStateStore store = new CandidateStateStore(requireContext());
            store.setSelectedJob(String.valueOf(app.job), safeOr(app.jobTitle, "Application"));
            store.setApplicationIdForJob(String.valueOf(app.job), app.id);
            pushCandidate(R.layout.fragment_candidate_application_details);
        });
        recentList.setAdapter(recentAdapter);

        view.findViewById(R.id.home_upload_button).setOnClickListener(v -> pushCandidate(R.layout.fragment_upload_resume));
        view.findViewById(R.id.home_view_recommended_button).setOnClickListener(v -> {
            openCandidateTab(R.id.nav_jobs);
        });
        view.findViewById(R.id.home_continue_assessment_button).setOnClickListener(v -> {
            CandidateStateStore store = new CandidateStateStore(requireContext());
            JSONObject activeSession = store.getActiveAssessmentSession();
            ApiModels.ApplicationDto activeSessionApp = findCandidateApplicationForActiveSession(activeSession);
            if (activeSession != null && activeSession.optInt("session_id", 0) > 0 && activeSessionApp != null) {
                String stage = activeSession.optString("stage", "");
                String nextAction = resolveNextAction(activeSessionApp);
                if ("HR".equalsIgnoreCase(stage) && "CONTINUE_HR".equals(nextAction)) {
                    pushCandidate(R.layout.fragment_hr_question);
                    return;
                } else if ("TECH".equalsIgnoreCase(stage) && "CONTINUE_TECH".equals(nextAction)) {
                    pushCandidate(R.layout.fragment_technical_question);
                    return;
                } else {
                    store.clearActiveAssessmentSession();
                }
            }
            if (candidateActionableApplication != null) {
                handleCandidateApplicationAction(candidateActionableApplication);
                return;
            }
            openCandidateTab(R.id.nav_jobs);
        });
        refreshCandidateApplicationsCacheAsync();
        refreshCandidateStateFromBackend(view, () -> renderCandidateHome(view));
    }

    private void renderCandidateHome(View view) {
        if (getContext() == null) {
            return;
        }
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        CandidateOnboardingState state = stateStore.getState();
        android.widget.TextView welcome = view.findViewById(R.id.home_welcome);
        if (welcome != null) {
            String displayName = stateStore.getCandidateDisplayName();
            String firstName = firstName(displayName);
            welcome.setText("Welcome, " + (firstName.isEmpty() ? "Candidate" : firstName) + "!");
        }
        View completionStrip = view.findViewById(R.id.home_completion_strip);
        android.widget.TextView completionText = view.findViewById(R.id.home_completion_strip_text);
        List<String> missing = new ArrayList<>();
        if (!state.isTechStackComplete) {
            missing.add("tech stack");
        }
        if (!state.hasResumeUploaded || !state.hasParsedResume) {
            missing.add("resume");
        }
        if (completionStrip != null) {
            completionStrip.setVisibility(missing.isEmpty() ? View.GONE : View.VISIBLE);
        }
        if (completionText != null && !missing.isEmpty()) {
            completionText.setText("Complete profile setup: add " + String.join(" and ", missing) + ".");
        }
        bindAiInsightsCard(
                view,
                csvToList(stateStore.getTopStrengthsCsv()),
                csvToList(stateStore.getSuggestedImprovementsCsv()),
                false
        );
        CandidateHomeViewModel.HomeMode mode;
        if (!state.hasResumeUploaded || !state.hasParsedResume) {
            mode = CandidateHomeViewModel.HomeMode.MISSING_RESUME;
        } else if (state.applicationCount <= 0) {
            mode = CandidateHomeViewModel.HomeMode.RESUME_READY_NO_APPLICATIONS;
        } else {
            mode = CandidateHomeViewModel.HomeMode.HAS_APPLICATIONS;
        }

        View uploadState = view.findViewById(R.id.home_upload_state);
        View readyState = view.findViewById(R.id.home_ready_state);
        View appState = view.findViewById(R.id.home_applications_state);
        uploadState.setVisibility(mode == CandidateHomeViewModel.HomeMode.MISSING_RESUME ? View.VISIBLE : View.GONE);
        readyState.setVisibility(mode == CandidateHomeViewModel.HomeMode.RESUME_READY_NO_APPLICATIONS ? View.VISIBLE : View.GONE);
        appState.setVisibility(mode == CandidateHomeViewModel.HomeMode.HAS_APPLICATIONS ? View.VISIBLE : View.GONE);

        RecyclerView recommendedList = view.findViewById(R.id.home_recommended_list);
        if (recommendedList.getAdapter() instanceof JobsAdapter) {
            List<Job> jobs = JobsRepository.getInstance(requireContext()).getJobs();
            List<JobsAdapter.Item> recommended = new ArrayList<>();
            int limit = Math.min(3, jobs.size());
            for (int i = 0; i < limit; i++) {
                Job job = jobs.get(i);
                recommended.add(new JobsAdapter.Item(job.title, job.company));
            }
            ((JobsAdapter) recommendedList.getAdapter()).setItems(recommended);
        }

        RecyclerView recentList = view.findViewById(R.id.home_recent_applications_list);
        if (recentList.getAdapter() instanceof HomeRecentApplicationsAdapter) {
            List<ApiModels.ApplicationDto> history = new ArrayList<>();
            int limit = Math.min(3, candidateApplicationsCache.size());
            for (int i = 0; i < limit; i++) {
                ApiModels.ApplicationDto app = candidateApplicationsCache.get(i);
                if (app != null) {
                    history.add(app);
                }
            }
            ((HomeRecentApplicationsAdapter) recentList.getAdapter()).submitList(history);
            if (candidateApplicationsCache.isEmpty()) {
                ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
                    @Override
                    public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                        if (!isAdded() || !response.isSuccessful() || response.body() == null) {
                            return;
                        }
                        List<ApiModels.ApplicationDto> apps = response.body();
                        stateStore.setApplicationCount(apps.size());
                        candidateApplicationsCache.clear();
                        candidateApplicationsCache.addAll(apps);
                        candidateActionableApplication = findFirstActionableApplication(apps);
                        RecyclerView rv = getView() == null ? null : getView().findViewById(R.id.home_recent_applications_list);
                        if (rv != null && rv.getAdapter() instanceof HomeRecentApplicationsAdapter) {
                            List<ApiModels.ApplicationDto> refreshed = new ArrayList<>();
                            for (int i = 0; i < Math.min(3, apps.size()); i++) {
                                ApiModels.ApplicationDto app = apps.get(i);
                                if (app != null) {
                                    refreshed.add(app);
                                }
                            }
                            ((HomeRecentApplicationsAdapter) rv.getAdapter()).submitList(refreshed);
                        }
                        android.widget.TextView appCountText = getView() == null ? null : getView().findViewById(R.id.home_app_count);
                        if (appCountText != null) {
                            appCountText.setText(apps.size() + " active application" + (apps.size() == 1 ? "" : "s"));
                        }
                        notifyCandidateStateChanged();
                    }

                    @Override
                    public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) { }
                });
            }
        }

        android.widget.TextView appCount = view.findViewById(R.id.home_app_count);
        appCount.setText(state.applicationCount + " active application" + (state.applicationCount == 1 ? "" : "s"));

        View continueButton = view.findViewById(R.id.home_continue_assessment_button);
        if (continueButton != null && mode == CandidateHomeViewModel.HomeMode.HAS_APPLICATIONS) {
            JSONObject activeSession = stateStore.getActiveAssessmentSession();
            ApiModels.ApplicationDto activeSessionApp = findCandidateApplicationForActiveSession(activeSession);
            boolean hasActiveSession = activeSession != null
                    && activeSession.optInt("session_id", 0) > 0
                    && activeSessionApp != null
                    && (("HR".equalsIgnoreCase(activeSession.optString("stage", "")) && "CONTINUE_HR".equals(resolveNextAction(activeSessionApp)))
                    || ("TECH".equalsIgnoreCase(activeSession.optString("stage", "")) && "CONTINUE_TECH".equals(resolveNextAction(activeSessionApp))));
            if (activeSession != null && activeSession.optInt("session_id", 0) > 0 && !hasActiveSession) {
                stateStore.clearActiveAssessmentSession();
            }
            boolean hasNextStep = candidateActionableApplication != null;
            continueButton.setVisibility((hasActiveSession || hasNextStep) ? View.VISIBLE : View.GONE);
            if (continueButton instanceof android.widget.Button) {
                android.widget.Button btn = (android.widget.Button) continueButton;
                String title = candidateActionableApplication != null && candidateActionableApplication.jobTitle != null
                        ? candidateActionableApplication.jobTitle.trim()
                        : (activeSessionApp != null && activeSessionApp.jobTitle != null ? activeSessionApp.jobTitle.trim()
                        : (state.selectedJobTitle == null ? "" : state.selectedJobTitle.trim()));
                if (hasActiveSession) {
                    String stage = activeSession.optString("stage", "");
                    btn.setText(("TECH".equalsIgnoreCase(stage) ? "Resume Technical Round" : "Resume HR Round")
                            + (title.isEmpty() ? "" : " - " + title));
                } else if (candidateActionableApplication != null) {
                    btn.setText(readableNextAction(resolveNextAction(candidateActionableApplication))
                            + (title.isEmpty() ? "" : " - " + title));
                } else {
                    btn.setText("");
                }
            }
        }
    }

    private void bindCandidateJobs(View view) {
        observeSharedCandidateState(view);
        RecyclerView list = view.findViewById(R.id.candidate_jobs_list);
        if (list == null) {
            return;
        }
        CandidateJobsViewModel vm = new ViewModelProvider(this).get(CandidateJobsViewModel.class);
        vm.refreshFromBackend();
        CandidateJobsAdapter adapter = new CandidateJobsAdapter(this::onCandidateJobClicked);
        list.setAdapter(adapter);
        adapter.setApplicationSummaries(candidateApplicationsCache);

        android.widget.ProgressBar loading = view.findViewById(R.id.candidate_jobs_loading);
        android.widget.TextView empty = view.findViewById(R.id.candidate_jobs_empty);
        if (loading != null) {
            loading.setVisibility(View.VISIBLE);
        }
        vm.getJobs().observe(getViewLifecycleOwner(), jobs -> {
            adapter.submitList(new ArrayList<>(jobs));
            if (loading != null) {
                loading.setVisibility(View.GONE);
            }
            if (empty != null) {
                empty.setVisibility(jobs.isEmpty() ? View.VISIBLE : View.GONE);
            }
        });
        ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                candidateApplicationsCache.clear();
                candidateApplicationsCache.addAll(response.body());
                candidateActionableApplication = findFirstActionableApplication(response.body());
                adapter.setApplicationSummaries(response.body());
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) { }
        });

        EditText searchInput = view.findViewById(R.id.candidate_jobs_search_input);
        ImageButton clear = view.findViewById(R.id.candidate_jobs_search_clear);
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.candidate_jobs_toolbar);
        View searchCard = view.findViewById(R.id.candidate_jobs_search_card);
        if (searchInput != null && clear != null) {
            clear.setOnClickListener(v -> searchInput.setText(""));
            searchInput.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    String query = s == null ? "" : s.toString();
                    vm.setQuery(query);
                    clear.setVisibility(query.isEmpty() ? View.GONE : View.VISIBLE);
                }

                @Override
                public void afterTextChanged(Editable s) {
                }
            });
        }
        if (toolbar != null && searchCard != null && searchInput != null) {
            toolbar.setOnMenuItemClickListener(item -> {
                if (item.getItemId() != R.id.action_search_jobs) {
                    return false;
                }
                boolean showing = searchCard.getVisibility() == View.VISIBLE;
                if (showing) {
                    searchInput.setText("");
                    vm.setQuery("");
                    searchCard.setVisibility(View.GONE);
                    hideKeyboard(searchInput);
                } else {
                    searchCard.setVisibility(View.VISIBLE);
                    searchInput.requestFocus();
                    showKeyboard(searchInput);
                }
                return true;
            });
        }

        ChipGroup filterGroup = view.findViewById(R.id.candidate_jobs_filter_group);
        if (filterGroup != null) {
            filterGroup.setOnCheckedChangeListener((group, checkedId) -> {
                if (checkedId == R.id.filter_full_time) {
                    vm.setSelectedFilter(CandidateJobsViewModel.Filter.FULL_TIME);
                } else if (checkedId == R.id.filter_contract) {
                    vm.setSelectedFilter(CandidateJobsViewModel.Filter.CONTRACT);
                } else if (checkedId == R.id.filter_part_time) {
                    vm.setSelectedFilter(CandidateJobsViewModel.Filter.PART_TIME);
                } else if (checkedId == R.id.filter_remote) {
                    vm.setSelectedFilter(CandidateJobsViewModel.Filter.REMOTE);
                } else {
                    vm.setSelectedFilter(CandidateJobsViewModel.Filter.ALL);
                }
            });
            switch (vm.getSelectedFilter()) {
                case FULL_TIME:
                    filterGroup.check(R.id.filter_full_time);
                    break;
                case CONTRACT:
                    filterGroup.check(R.id.filter_contract);
                    break;
                case PART_TIME:
                    filterGroup.check(R.id.filter_part_time);
                    break;
                case REMOTE:
                    filterGroup.check(R.id.filter_remote);
                    break;
                default:
                    filterGroup.check(R.id.filter_all);
            }
        }

        view.findViewById(R.id.candidate_jobs_banner_cta).setOnClickListener(v -> pushCandidate(R.layout.fragment_upload_resume));
        View techCta = view.findViewById(R.id.candidate_jobs_tech_banner_cta);
        if (techCta != null) {
            techCta.setOnClickListener(v -> pushCandidate(R.layout.fragment_select_tech_stack));
        }
        updateJobsResumeBanner(view);
    }

    private void updateJobsResumeBanner(View view) {
        if (getContext() == null) {
            return;
        }
        CandidateOnboardingState state = new CandidateStateStore(requireContext()).getState();
        View resumeBanner = view.findViewById(R.id.candidate_jobs_resume_banner);
        View techBanner = view.findViewById(R.id.candidate_jobs_tech_banner);
        boolean resumeReady = state.hasResumeUploaded && state.hasParsedResume;
        boolean techReady = state.isTechStackComplete && !state.techStackSkipped;
        if (resumeBanner != null) {
            resumeBanner.setVisibility(resumeReady ? View.GONE : View.VISIBLE);
        }
        if (techBanner != null) {
            techBanner.setVisibility(techReady ? View.GONE : View.VISIBLE);
        }
    }

    private void refreshCandidateStateFromBackend(@NonNull View root, @Nullable Runnable onDone) {
        if (!isAdded()) {
            if (onDone != null) onDone.run();
            return;
        }
        ApiClient.getInstance(requireContext()).api().getCandidateProfile().enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    syncCandidateStateFromProfile(response.body());
                }
                if (onDone != null) onDone.run();
            }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (onDone != null) onDone.run();
            }
        });
    }

    private void syncCandidateStateFromProfile(@NonNull ApiModels.CandidateProfileResponse profile) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        String fullName = profile.fullName == null ? "" : profile.fullName.trim();
        String email = profile.email == null ? "" : profile.email.trim();
        stateStore.setCandidateIdentity(fullName, email);

        boolean techComplete = profile.techStacks != null && !profile.techStacks.isEmpty();
        stateStore.setTechStackComplete(techComplete);
        if (techComplete) {
            stateStore.setTechStackSkipped(false);
            stateStore.setTechStacks(new HashSet<>(profile.techStacks));
        }

        boolean hasResume = profile.resumeFileUrl != null && !profile.resumeFileUrl.trim().isEmpty();
        if (profile.resumeId != null && !profile.resumeId.trim().isEmpty()) {
            stateStore.setResumeId(profile.resumeId);
        }
        if (hasResume) {
            int idx = profile.resumeFileUrl.lastIndexOf('/');
            stateStore.setResumeFileName(idx >= 0 ? profile.resumeFileUrl.substring(idx + 1) : profile.resumeFileUrl);
        } else {
            stateStore.setResumeFileName("");
        }
        List<String> skills = profile.parsedResumeJson == null
                ? new ArrayList<>()
                : sanitizeSkillList(toStringList(profile.parsedResumeJson.get("skills")));
        List<String> strengths = profile.parsedResumeJson == null
                ? new ArrayList<>()
                : sanitizeSkillList(toStringList(profile.parsedResumeJson.get("top_strengths")));
        List<String> improvements = profile.parsedResumeJson == null
                ? new ArrayList<>()
                : sanitizeSkillList(toStringList(profile.parsedResumeJson.get("suggested_improvements")));
        if (strengths.isEmpty()) {
            strengths.addAll(skills.subList(0, Math.min(5, skills.size())));
        }
        String education = profile.parsedResumeJson == null
                ? stateStore.getParsedEducation()
                : extractEducationForUi(profile.parsedResumeJson, stateStore.getParsedEducation());
        String experience = profile.parsedResumeJson == null
                ? stateStore.getParsedExperience()
                : extractExperienceLevelForUi(profile.parsedResumeJson, stateStore.getParsedExperience());

        stateStore.setResumeUploaded(hasResume);
        String parseStatus = profile.parseStatus == null ? "" : profile.parseStatus.trim();
        boolean parsedReady = hasResume && ("PARSED".equalsIgnoreCase(parseStatus)
                || "SUCCEEDED".equalsIgnoreCase(parseStatus)
                || (!skills.isEmpty() || !education.isEmpty()));
        stateStore.setParsedResume(parsedReady);
        stateStore.setParsedSummary(csvFromList(skills, 60), experience, education);
        stateStore.setInsights(csvFromList(strengths, 8), csvFromList(improvements, 8));
        notifyCandidateStateChanged();
    }

    @NonNull
    private String firstName(@Nullable String fullName) {
        if (fullName == null) return "";
        String trimmed = fullName.trim();
        if (trimmed.isEmpty()) return "";
        int idx = trimmed.indexOf(' ');
        return idx > 0 ? trimmed.substring(0, idx) : trimmed;
    }

    private void onCandidateJobClicked(Job job) {
        if (getContext() == null) {
            return;
        }
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        CandidateOnboardingState state = stateStore.getState();
        stateStore.setSelectedJob(job.id, job.title);
        ApiModels.ApplicationDto existing = findCandidateApplicationForJob(job.id);
        if (existing == null) {
            int localAppId = stateStore.getApplicationIdForJob(job.id);
            String localStatus = stateStore.getPipelineState(job.id);
            if (localAppId > 0 && localStatus != null && !localStatus.trim().isEmpty()) {
                existing = new ApiModels.ApplicationDto();
                existing.id = localAppId;
                existing.job = parseBackendId(job.id);
                existing.jobTitle = job.title;
                existing.company = job.company;
                existing.location = job.location;
                existing.status = localStatus;
            }
        }
        if (existing != null && existing.id > 0) {
            stateStore.setApplicationIdForJob(job.id, existing.id);
            stateStore.setPipelineState(job.id, safeOr(existing.status, "APPLIED"));
            pushCandidate(R.layout.fragment_candidate_application_details);
            return;
        }
        if (candidateApplicationsCache.isEmpty()) {
            ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
                @Override public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                    if (!isAdded()) return;
                    if (response.isSuccessful() && response.body() != null) {
                        candidateApplicationsCache.clear();
                        candidateApplicationsCache.addAll(response.body());
                        candidateActionableApplication = findFirstActionableApplication(candidateApplicationsCache);
                        ApiModels.ApplicationDto found = findCandidateApplicationForJob(job.id);
                        if (found != null) {
                            stateStore.setApplicationIdForJob(job.id, found.id);
                            stateStore.setPipelineState(job.id, safeOr(found.status, "APPLIED"));
                            pushCandidate(R.layout.fragment_candidate_application_details);
                            return;
                        }
                    }
                    continueCandidateJobMatchFlow(job, stateStore, state);
                }
                @Override public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) {
                    if (!isAdded()) return;
                    continueCandidateJobMatchFlow(job, stateStore, state);
                }
            });
            return;
        }
        continueCandidateJobMatchFlow(job, stateStore, state);
    }

    private void continueCandidateJobMatchFlow(@NonNull Job job, @NonNull CandidateStateStore stateStore, @NonNull CandidateOnboardingState state) {
        int backendJobId = parseBackendId(job.id);
        if (backendJobId > 0) prefetchOrCreateApplicationId(job.id, backendJobId, stateStore);
        if (!state.hasResumeUploaded || !state.hasParsedResume) {
            new AlertDialog.Builder(requireContext())
                    .setTitle("Upload resume required")
                    .setMessage("To calculate match score and start screening, upload your resume.")
                    .setNegativeButton("Not now", null)
                    .setPositiveButton("Upload Resume", (dialog, which) -> pushCandidate(R.layout.fragment_upload_resume))
                    .show();
            return;
        }
        stateStore.setProgressMode("MATCH_SCORE");
        pushCandidate(R.layout.fragment_ai_parsing);
    }

    @Nullable
    private ApiModels.ApplicationDto findCandidateApplicationForJob(@Nullable String jobId) {
        if (jobId == null || jobId.trim().isEmpty()) return null;
        for (ApiModels.ApplicationDto dto : candidateApplicationsCache) {
            if (dto == null) continue;
            if (jobId.equals(String.valueOf(dto.job))) return dto;
        }
        return null;
    }

    private void prefetchOrCreateApplicationId(@NonNull String localJobId, int backendJobId, @NonNull CandidateStateStore stateStore) {
        ApiModels.ApplyRequest request = new ApiModels.ApplyRequest();
        request.jobId = backendJobId;
        ApiClient.getInstance(requireContext()).api().apply(request).enqueue(new Callback<ApiModels.ApplicationDto>() {
            @Override
            public void onResponse(Call<ApiModels.ApplicationDto> call, Response<ApiModels.ApplicationDto> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    stateStore.setApplicationIdForJob(localJobId, response.body().id);
                    mergeCandidateApplication(response.body());
                }
            }

            @Override
            public void onFailure(Call<ApiModels.ApplicationDto> call, Throwable t) { }
        });
    }

    private void mergeCandidateApplication(@NonNull ApiModels.ApplicationDto dto) {
        boolean replaced = false;
        for (int i = 0; i < candidateApplicationsCache.size(); i++) {
            if (candidateApplicationsCache.get(i) != null && candidateApplicationsCache.get(i).id == dto.id) {
                candidateApplicationsCache.set(i, dto);
                replaced = true;
                break;
            }
        }
        if (!replaced) candidateApplicationsCache.add(0, dto);
        candidateActionableApplication = findFirstActionableApplication(candidateApplicationsCache);
    }

    @Nullable
    private ApiModels.ApplicationDto findCandidateApplicationById(int applicationId) {
        if (applicationId <= 0) return null;
        for (ApiModels.ApplicationDto dto : candidateApplicationsCache) {
            if (dto != null && dto.id == applicationId) return dto;
        }
        return null;
    }

    @Nullable
    private ApiModels.ApplicationDto findCandidateApplicationForActiveSession(@Nullable JSONObject activeSession) {
        if (activeSession == null) return null;
        return findCandidateApplicationById(activeSession.optInt("application_id", 0));
    }

    @Nullable
    private ApiModels.ApplicationDto findFirstActionableApplication(@Nullable List<ApiModels.ApplicationDto> apps) {
        if (apps == null) return null;
        ApiModels.ApplicationDto best = null;
        int bestPriority = Integer.MAX_VALUE;
        for (ApiModels.ApplicationDto dto : apps) {
            if (dto == null) continue;
            String action = resolveNextAction(dto);
            int priority = candidateActionPriority(action);
            if (priority < bestPriority) { bestPriority = priority; best = dto; }
        }
        return best;
    }

    @NonNull
    private String resolveNextAction(@Nullable ApiModels.ApplicationDto app) {
        if (app == null) return "NONE";
        String action = safeOr(app.nextAction, "");
        if (!action.isEmpty() && !"NONE".equals(action)) return action;
        String status = safeOr(app.status, "").toUpperCase(Locale.US);
        if ("MATCH_PASS".equals(status) || "HR_READY".equals(status) || "HR_STARTED".equals(status)) return "CONTINUE_HR";
        if ("HR_PASS".equals(status) || "TECH_READY".equals(status) || "TECH_STARTED".equals(status)) return "CONTINUE_TECH";
        if ("OFFER_SENT".equals(status)) return "VIEW_OFFER";
        if ("MATCH_FAIL".equals(status) || "HR_FAIL".equals(status) || "TECH_FAIL".equals(status)) {
            return TextUtils.isEmpty(app.retryEligibleAt) ? "VIEW_FEEDBACK" : "RETRY_LATER";
        }
        return "NONE";
    }

    private int candidateActionPriority(@Nullable String nextAction) {
        String action = safeOr(nextAction, "");
        if ("VIEW_OFFER".equals(action)) return 1;
        if ("CONTINUE_TECH".equals(action)) return 2;
        if ("CONTINUE_HR".equals(action)) return 3;
        return Integer.MAX_VALUE;
    }

    private String readableNextAction(@Nullable String nextAction) {
        if (nextAction == null) return "";
        switch (nextAction) {
            case "CONTINUE_HR": return "Continue HR Round";
            case "CONTINUE_TECH": return "Continue Technical Round";
            case "VIEW_OFFER": return "View Offer";
            case "RETRY_LATER":
            case "RETRY_AFTER_30_DAYS": return "View Retry Details";
            case "VIEW_FEEDBACK": return "View Feedback";
            case "NONE": return "";
            default: return "Open Application";
        }
    }

    private String readableApplicationStatus(@Nullable String status) {
        String s = safeOr(status, "APPLIED");
        switch (s) {
            case "MATCH_FAIL": return "Match criteria not met";
            case "MATCH_PASS": return "Match cleared";
            case "HR_READY": return "HR round ready";
            case "HR_STARTED": return "HR round in progress";
            case "HR_PASS": return "HR round cleared";
            case "HR_FAIL": return "HR round not cleared";
            case "TECH_READY": return "Technical round ready";
            case "TECH_STARTED": return "Technical round in progress";
            case "TECH_PASS": return "Technical round cleared";
            case "TECH_FAIL": return "Technical round not cleared";
            case "OFFER_SENT": return "Offer sent";
            case "OFFER_ACCEPTED": return "Offer accepted";
            default: return s.replace('_', ' ');
        }
    }

    private String buildApplicationDetailsActionLabel(@NonNull ApiModels.ApplicationDetailResponse dto) {
        String action = resolveNextAction(dto);
        switch (action) {
            case "CONTINUE_HR": return "Continue HR Round";
            case "CONTINUE_TECH": return "Continue Technical Round";
            case "VIEW_OFFER": return "View / Sign Offer";
            case "RETRY_LATER":
            case "RETRY_AFTER_30_DAYS": return TextUtils.isEmpty(dto.retryEligibleAt) ? "" : "View Retry Details";
            case "VIEW_FEEDBACK":
                if ("TECH_FAIL".equalsIgnoreCase(safeOr(dto.status, ""))) return "View Technical Feedback";
                if ("HR_FAIL".equalsIgnoreCase(safeOr(dto.status, ""))) return "View HR Feedback";
                return "View Feedback";
            default: return "";
        }
    }

    private void showRetryDetailsBottomSheet(@NonNull ApiModels.ApplicationDetailResponse dto) {
        if (getContext() == null) return;
        BottomSheetDialog sheet = new BottomSheetDialog(requireContext());
        LinearLayout root = new LinearLayout(requireContext());
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(20), dp(20), dp(20));

        TextView title = new TextView(requireContext());
        title.setText("Retry Details");
        title.setTextSize(18);
        title.setTypeface(title.getTypeface(), android.graphics.Typeface.BOLD);
        title.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary));
        root.addView(title);

        TextView subtitle = new TextView(requireContext());
        subtitle.setPadding(0, dp(10), 0, 0);
        subtitle.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary));
        subtitle.setText(TextUtils.isEmpty(dto.retryEligibleAt)
                ? "Retry date is not available yet."
                : "Next eligible attempt: " + toFriendlyDateTime(dto.retryEligibleAt));
        root.addView(subtitle);

        TextView detail = new TextView(requireContext());
        detail.setPadding(0, dp(10), 0, 0);
        detail.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary));
        String reason = TextUtils.isEmpty(dto.lastFailureReason) ? "Please review your feedback before retrying." : dto.lastFailureReason;
        detail.setText(reason + " Open Application Details to review stage scores and previous results.");
        root.addView(detail);

        com.google.android.material.button.MaterialButton close = new com.google.android.material.button.MaterialButton(requireContext());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(16);
        close.setLayoutParams(lp);
        close.setText("Close");
        close.setOnClickListener(v -> sheet.dismiss());
        root.addView(close);

        sheet.setContentView(root);
        sheet.show();
    }

    private void showApplicationFeedbackDialog(@NonNull ApiModels.ApplicationDetailResponse dto) {
        String status = safeOr(dto.status, "");
        String title = "Assessment Feedback";
        if ("TECH_FAIL".equalsIgnoreCase(status)) title = "Technical Feedback";
        else if ("HR_FAIL".equalsIgnoreCase(status)) title = "HR Feedback";

        StringBuilder message = new StringBuilder();
        if (!TextUtils.isEmpty(dto.lastFailureReason)) {
            message.append(dto.lastFailureReason);
        } else {
            message.append("This stage was not cleared.");
        }
        if (dto.hrScore != null) message.append("\nHR score: ").append(Math.round(dto.hrScore)).append('%');
        if (dto.techScore != null) message.append("\nTechnical score: ").append(Math.round(dto.techScore)).append('%');
        if (!TextUtils.isEmpty(dto.retryEligibleAt)) message.append("\nRetry eligible: ").append(toFriendlyDateTime(dto.retryEligibleAt));

        new AlertDialog.Builder(requireContext())
                .setTitle(title)
                .setMessage(message.toString())
                .setPositiveButton("OK", null)
                .show();
    }

    private void handleCandidateApplicationAction(@NonNull ApiModels.ApplicationDto app) {
        if (getContext() == null) return;
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        stateStore.setSelectedJob(String.valueOf(app.job), safeOr(app.jobTitle, "Application"));
        stateStore.setApplicationIdForJob(String.valueOf(app.job), app.id);
        stateStore.setPipelineState(String.valueOf(app.job), safeOr(app.status, "APPLIED"));
        String action = resolveNextAction(app);
        if ("CONTINUE_HR".equals(action)) {
            pushHrPrepPreloader();
        } else if ("CONTINUE_TECH".equals(action)) {
            pushCandidate(R.layout.fragment_select_technical_language);
        } else if ("VIEW_OFFER".equals(action)) {
            pushCandidate(R.layout.fragment_offer_letter);
        } else {
            pushCandidate(R.layout.fragment_candidate_application_details);
        }
    }

    private void bindUploadResume(View view) {
        View skipButton = view.findViewById(R.id.upload_skip);
        View backButton = view.findViewById(R.id.upload_back);
        boolean allowSkip = getActivity() instanceof CandidateActivity
                && ((CandidateActivity) getActivity()).isOnboardingGateActive();
        if (skipButton != null) {
            skipButton.setVisibility(allowSkip ? View.VISIBLE : View.GONE);
        }
        if (backButton != null) {
            backButton.setVisibility(allowSkip ? View.GONE : View.VISIBLE);
            backButton.setOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());
        }
        if (skipButton != null) {
            skipButton.setOnClickListener(v -> {
                CandidateStateStore store = new CandidateStateStore(requireContext());
                store.setResumeSkipped(true);
                store.setCandidateOnboardingSeen(true);
                if (allowSkip) {
                    ((CandidateActivity) getActivity()).onResumeSkipped();
                } else {
                    openCandidateTab(R.id.nav_jobs);
                }
            });
        }
        View uploadCard = view.findViewById(R.id.upload_card);
        View scanButton = view.findViewById(R.id.upload_scan);
        scanButton.setEnabled(false);
        scanButton.setAlpha(0.5f);

        View.OnClickListener pickFileClick = v -> {
            if (resumePickerLauncher == null) {
                Snackbar.make(v, "File picker unavailable. Please retry.", Snackbar.LENGTH_LONG).show();
                return;
            }
            resumePickerLauncher.launch(new String[]{
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword",
                    "image/*"
            });
        };
        if (uploadCard != null) {
            uploadCard.setOnClickListener(pickFileClick);
        }
        View hint = view.findViewById(R.id.upload_hint);
        if (hint != null) {
            hint.setOnClickListener(pickFileClick);
        }
        scanButton.setOnClickListener(v -> {
            if (pendingResumeUri == null) {
                Snackbar.make(v, "Please upload a resume first.", Snackbar.LENGTH_SHORT).show();
                return;
            }
            uploadResume(pendingResumeUri, view);
        });
    }

    private void bindCandidateProfile(@NonNull View view) {
        observeSharedCandidateState(view);
        MaterialToolbar toolbar = view.findViewById(R.id.candidate_profile_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationIcon(null);
        }
        View logout = view.findViewById(R.id.profile_logout_button);
        if (logout != null) {
            logout.setOnClickListener(v -> logoutToLogin());
        }
        View uploadResume = view.findViewById(R.id.profile_resume_upload_btn);
        if (uploadResume != null) {
            uploadResume.setOnClickListener(v -> pushCandidate(R.layout.fragment_upload_resume));
        }
        View saveProfile = view.findViewById(R.id.profile_edit_button);
        if (saveProfile != null) {
            saveProfile.setOnClickListener(v -> pushCandidate(R.layout.fragment_candidate_edit_profile));
        }
        View techRow = view.findViewById(R.id.profile_completion_tech_row);
        if (techRow != null) {
            techRow.setOnClickListener(v -> pushCandidate(R.layout.fragment_select_tech_stack));
        }
        View resumeRow = view.findViewById(R.id.profile_completion_resume_row);
        if (resumeRow != null) {
            resumeRow.setOnClickListener(v -> pushCandidate(R.layout.fragment_upload_resume));
        }

        View addSkill = view.findViewById(R.id.profile_add_skill);
        if (addSkill != null) {
            addSkill.setOnClickListener(v -> showAddChipDialog(view, "Add skill", true));
        }
        View addCert = view.findViewById(R.id.profile_add_cert);
        if (addCert != null) {
            addCert.setOnClickListener(v -> showAddChipDialog(view, "Add certification", false));
        }
        fetchCandidateProfile(view, true);
    }

    private void fetchCandidateProfile(@NonNull View root, boolean showMessageOnError) {
        if (!isAdded()) return;
        ApiClient.getInstance(requireContext()).api().getCandidateProfile().enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    if (showMessageOnError) {
                        Snackbar.make(root, "Unable to load profile now.", Snackbar.LENGTH_SHORT).show();
                    }
                    return;
                }
                bindCandidateProfileData(root, response.body());
            }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                if (!isAdded() || !showMessageOnError) return;
                Snackbar.make(root, "Profile sync failed. Showing local state.", Snackbar.LENGTH_SHORT).show();
                bindCandidateProfileFromLocal(root);
            }
        });
    }

    private void bindCandidateProfileData(@NonNull View root, @NonNull ApiModels.CandidateProfileResponse profile) {
        profileFullName = profile.fullName == null ? "" : profile.fullName;
        profileEmail = profile.email == null ? "" : profile.email;
        profilePhone = profile.phone == null ? "" : profile.phone;
        new CandidateStateStore(requireContext()).setCandidateIdentity(profileFullName, profileEmail);

        android.widget.TextView name = root.findViewById(R.id.profile_name);
        android.widget.TextView role = root.findViewById(R.id.profile_role);
        android.widget.TextView city = root.findViewById(R.id.profile_city);
        android.widget.TextView email = root.findViewById(R.id.profile_email);
        android.widget.TextView techStatus = root.findViewById(R.id.profile_completion_tech_status);
        android.widget.TextView resumeCompletionStatus = root.findViewById(R.id.profile_completion_resume_status);

        if (name != null) name.setText(profileFullName.isEmpty() ? "Candidate" : profileFullName);
        if (role != null) role.setText(profile.role == null || profile.role.trim().isEmpty() ? "Software Engineer" : profile.role);
        if (city != null) city.setText("India");
        if (email != null) email.setText(profileEmail);
        boolean hasResume = profile.resumeFileUrl != null && !profile.resumeFileUrl.trim().isEmpty();
        String fileName = hasResume ? profile.resumeFileUrl.substring(profile.resumeFileUrl.lastIndexOf('/') + 1) : "";
        boolean parsed = profile.parsedResumeJson != null
                && (
                !sanitizeSkillList(toStringList(profile.parsedResumeJson.get("skills"))).isEmpty()
                        || !extractEducationForUi(profile.parsedResumeJson, "").isEmpty()
                        || !sanitizeReadableText(String.valueOf(profile.parsedResumeJson.get("summary")), "").isEmpty()
        );
        bindProfileResumeSection(root, hasResume, parsed, fileName, profile.updatedAt);
        if (techStatus != null) {
            boolean techComplete = profile.techStacks != null && !profile.techStacks.isEmpty();
            techStatus.setText(techComplete ? "Complete" : "Missing");
            techStatus.setTextColor(ContextCompat.getColor(requireContext(), techComplete ? R.color.soft_green : R.color.text_secondary));
        }
        if (resumeCompletionStatus != null) {
            boolean resumeComplete = profile.resumeFileUrl != null && !profile.resumeFileUrl.trim().isEmpty();
            resumeCompletionStatus.setText(resumeComplete ? "Complete" : "Missing");
            resumeCompletionStatus.setTextColor(ContextCompat.getColor(requireContext(), resumeComplete ? R.color.soft_green : R.color.text_secondary));
        }

        profileParsedJson.clear();
        if (profile.parsedResumeJson != null) {
            profileParsedJson.putAll(profile.parsedResumeJson);
        }
        profileSkills.clear();
        profileSkills.addAll(sanitizeSkillList(toStringList(profileParsedJson.get("skills"))));
        profileCertifications.clear();
        profileCertifications.addAll(extractCertificationNames(profileParsedJson.get("certifications")));
        List<String> topStrengths = sanitizeSkillList(toStringList(profileParsedJson.get("top_strengths")));
        List<String> suggestedImprovements = sanitizeSkillList(toStringList(profileParsedJson.get("suggested_improvements")));

        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        boolean techComplete = profile.techStacks != null && !profile.techStacks.isEmpty();
        stateStore.setTechStackComplete(techComplete);
        if (techComplete) {
            stateStore.setTechStackSkipped(false);
            stateStore.setTechStacks(new HashSet<>(profile.techStacks));
        }
        stateStore.setResumeUploaded(profile.resumeFileUrl != null && !profile.resumeFileUrl.trim().isEmpty());
        stateStore.setResumeFileName(fileName);
        stateStore.setParsedResume(hasResume && (!profileSkills.isEmpty() || !extractEducationForUi(profileParsedJson, "").isEmpty()));
        String education = extractEducationForUi(profileParsedJson, stateStore.getParsedEducation());
        String experience = extractExperienceLevelForUi(profileParsedJson, stateStore.getParsedExperience());
        stateStore.setParsedSummary(csvFromList(profileSkills, 60), experience, education);
        stateStore.setInsights(csvFromList(topStrengths, 8), csvFromList(suggestedImprovements, 8));
        notifyCandidateStateChanged();

        bindAiInsightsCard(root, topStrengths, suggestedImprovements, true);
        renderProfileChips(root);
    }

    private void bindCandidateProfileFromLocal(@NonNull View root) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        android.widget.TextView name = root.findViewById(R.id.profile_name);
        android.widget.TextView role = root.findViewById(R.id.profile_role);
        android.widget.TextView city = root.findViewById(R.id.profile_city);
        android.widget.TextView email = root.findViewById(R.id.profile_email);
        android.widget.TextView techStatus = root.findViewById(R.id.profile_completion_tech_status);
        android.widget.TextView resumeCompletionStatus = root.findViewById(R.id.profile_completion_resume_status);
        if (name != null) {
            String display = stateStore.getCandidateDisplayName();
            name.setText(display == null || display.trim().isEmpty() ? "Candidate" : display.trim());
        }
        if (role != null) role.setText("Software Engineer");
        if (city != null) city.setText("India");
        if (email != null) email.setText(stateStore.getCandidateEmail());
        boolean hasResume = stateStore.getState().hasResumeUploaded;
        bindProfileResumeSection(root, hasResume, stateStore.getState().hasParsedResume, stateStore.getResumeFileName(), null);
        if (techStatus != null) {
            boolean techComplete = stateStore.getState().isTechStackComplete;
            techStatus.setText(techComplete ? "Complete" : "Missing");
            techStatus.setTextColor(ContextCompat.getColor(requireContext(), techComplete ? R.color.soft_green : R.color.text_secondary));
        }
        if (resumeCompletionStatus != null) {
            boolean resumeComplete = stateStore.getState().hasResumeUploaded && stateStore.getState().hasParsedResume;
            resumeCompletionStatus.setText(resumeComplete ? "Complete" : "Missing");
            resumeCompletionStatus.setTextColor(ContextCompat.getColor(requireContext(), resumeComplete ? R.color.soft_green : R.color.text_secondary));
        }
        profileSkills.clear();
        profileSkills.addAll(sanitizeSkillList(toStringList(Arrays.asList(stateStore.getParsedSkillsCsv().split(",")))));
        bindAiInsightsCard(root, csvToList(stateStore.getTopStrengthsCsv()), csvToList(stateStore.getSuggestedImprovementsCsv()), true);
        renderProfileChips(root);
    }

    private void renderProfileChips(@NonNull View root) {
        ChipGroup skillsGroup = root.findViewById(R.id.profile_skills_group);
        ChipGroup certGroup = root.findViewById(R.id.profile_cert_group);
        TextView certEmpty = root.findViewById(R.id.profile_cert_empty);
        if (skillsGroup != null) {
            skillsGroup.removeAllViews();
            for (String skill : profileSkills) {
                Chip chip = new Chip(requireContext());
                chip.setText(skill);
                chip.setCloseIconVisible(true);
                chip.setEnsureMinTouchTargetSize(true);
                chip.setOnCloseIconClickListener(v -> {
                    profileSkills.remove(skill);
                    renderProfileChips(root);
                    saveProfileParsedDataOnly(root);
                });
                skillsGroup.addView(chip);
            }
        }
        if (certGroup != null) {
            certGroup.removeAllViews();
            for (String cert : profileCertifications) {
                Chip chip = new Chip(requireContext());
                chip.setText(cert);
                chip.setCloseIconVisible(true);
                chip.setEnsureMinTouchTargetSize(true);
                chip.setOnCloseIconClickListener(v -> {
                    profileCertifications.remove(cert);
                    renderProfileChips(root);
                    saveProfileParsedDataOnly(root);
                });
                certGroup.addView(chip);
            }
        }
        if (certEmpty != null) {
            CandidateStateStore stateStore = new CandidateStateStore(requireContext());
            boolean parsedResume = stateStore.getState().hasParsedResume;
            certEmpty.setVisibility(parsedResume && profileCertifications.isEmpty() ? View.VISIBLE : View.GONE);
        }
    }

    private void showAddChipDialog(@NonNull View root, @NonNull String title, boolean skills) {
        if (!isAdded()) return;
        final com.google.android.material.textfield.TextInputEditText input = new com.google.android.material.textfield.TextInputEditText(requireContext());
        input.setHint(skills ? "Skill" : "Certification");
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle(title)
                .setView(input)
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Add", (dialog, which) -> {
                    String raw = input.getText() == null ? "" : input.getText().toString().trim();
                    if (raw.isEmpty()) return;
                    List<String> target = skills ? profileSkills : profileCertifications;
                    String normalized = raw.substring(0, 1).toUpperCase(Locale.US) + raw.substring(1);
                    if (!target.contains(normalized)) {
                        target.add(normalized);
                        renderProfileChips(root);
                        saveProfileParsedDataOnly(root);
                    }
                })
                .show();
    }

    private void bindCandidateEditProfile(@NonNull View view) {
        MaterialToolbar toolbar = view.findViewById(R.id.candidate_edit_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        }
        com.google.android.material.textfield.TextInputEditText name = view.findViewById(R.id.candidate_edit_name);
        com.google.android.material.textfield.TextInputEditText phone = view.findViewById(R.id.candidate_edit_phone);
        com.google.android.material.textfield.TextInputEditText bio = view.findViewById(R.id.candidate_edit_bio);
        com.google.android.material.textfield.TextInputEditText linkedin = view.findViewById(R.id.candidate_edit_linkedin);

        ApiClient.getInstance(requireContext()).api().getCandidateProfile().enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                ApiModels.CandidateProfileResponse p = response.body();
                if (name != null) name.setText(p.fullName == null ? "" : p.fullName);
                if (phone != null) phone.setText(p.phone == null ? "" : p.phone);
                if (p.parsedResumeJson != null) {
                    profileParsedJson.clear();
                    profileParsedJson.putAll(p.parsedResumeJson);
                    profileSkills.clear();
                    profileSkills.addAll(sanitizeSkillList(toStringList(p.parsedResumeJson.get("skills"))));
                    profileCertifications.clear();
                    profileCertifications.addAll(extractCertificationNames(p.parsedResumeJson.get("certifications")));
                    Object summary = p.parsedResumeJson.get("summary");
                    Object linked = p.parsedResumeJson.get("linkedin");
                    if (bio != null && summary != null) bio.setText(sanitizeReadableText(String.valueOf(summary), ""));
                    if (linkedin != null && linked != null) linkedin.setText(String.valueOf(linked));
                }
            }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) { }
        });

        View save = view.findViewById(R.id.candidate_edit_save);
        if (save != null) {
            save.setOnClickListener(v -> {
                ApiModels.CandidateProfileUpdateRequest request = new ApiModels.CandidateProfileUpdateRequest();
                request.fullName = name != null && name.getText() != null ? name.getText().toString().trim() : "";
                request.phone = phone != null && phone.getText() != null ? phone.getText().toString().trim() : "";
                request.techStacks = new ArrayList<>(new CandidateStateStore(requireContext()).getTechStacks());
                HashMap<String, Object> parsed = new HashMap<>(profileParsedJson);
                parsed.put("skills", new ArrayList<>(profileSkills));
                parsed.put("certifications", new ArrayList<>(profileCertifications));
                if (bio != null && bio.getText() != null) parsed.put("summary", bio.getText().toString().trim());
                if (linkedin != null && linkedin.getText() != null) parsed.put("linkedin", linkedin.getText().toString().trim());
                request.parsedResumeJson = parsed;
                ApiClient.getInstance(requireContext()).api().updateCandidateProfile(request).enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
                    @Override
                    public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                        if (!isAdded()) return;
                        if (!response.isSuccessful()) {
                            Snackbar.make(view, "Failed to save profile.", Snackbar.LENGTH_SHORT).show();
                            return;
                        }
                        Snackbar.make(view, "Profile updated.", Snackbar.LENGTH_SHORT).show();
                        requireActivity().onBackPressed();
                    }

                    @Override
                    public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                        if (!isAdded()) return;
                        Snackbar.make(view, "Network error while saving profile.", Snackbar.LENGTH_SHORT).show();
                    }
                });
            });
        }
    }

    private void saveProfileParsedDataOnly(@NonNull View root) {
        ApiModels.CandidateProfileUpdateRequest request = new ApiModels.CandidateProfileUpdateRequest();
        request.fullName = profileFullName;
        request.phone = profilePhone;
        request.techStacks = new ArrayList<>(new CandidateStateStore(requireContext()).getTechStacks());
        HashMap<String, Object> parsed = new HashMap<>(profileParsedJson);
        parsed.put("skills", new ArrayList<>(profileSkills));
        parsed.put("certifications", new ArrayList<>(profileCertifications));
        request.parsedResumeJson = parsed;
        ApiClient.getInstance(requireContext()).api().updateCandidateProfile(request).enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) { }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) { }
        });
    }

    private void parseResumeFromProfile(@NonNull View root) {
        View uploadBtn = root.findViewById(R.id.profile_resume_upload_btn);
        if (uploadBtn != null) uploadBtn.setEnabled(false);
        ApiModels.ResumeParseRequest request = new ApiModels.ResumeParseRequest();
        request.resumeText = "";
        request.parsedResumeJson = profileParsedJson;
        ApiClient.getInstance(requireContext()).api().parseCandidateResume(request).enqueue(new Callback<ApiModels.ResumeParseResponse>() {
            @Override
            public void onResponse(Call<ApiModels.ResumeParseResponse> call, Response<ApiModels.ResumeParseResponse> response) {
                if (!isAdded()) return;
                if (uploadBtn != null) uploadBtn.setEnabled(true);
                if (!response.isSuccessful() || response.body() == null || response.body().parsedResumeJson == null) {
                    Snackbar.make(root, "AI parsing failed. Please retry.", Snackbar.LENGTH_SHORT).show();
                    return;
                }
                profileParsedJson.clear();
                profileParsedJson.putAll(response.body().parsedResumeJson);
                profileSkills.clear();
                profileSkills.addAll(sanitizeSkillList(toStringList(profileParsedJson.get("skills"))));
                List<String> certs = extractCertificationNames(profileParsedJson.get("certifications"));
                if (!certs.isEmpty()) {
                    profileCertifications.clear();
                    profileCertifications.addAll(certs);
                }
                renderProfileChips(root);
                CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                stateStore.setParsedResume(true);
                stateStore.setResumeUploaded(true);
                stateStore.setLastResumeUpdatedAt(System.currentTimeMillis());
                if (!profileSkills.isEmpty()) {
                    String education = extractEducationForUi(profileParsedJson, stateStore.getParsedEducation());
                    String experience = extractExperienceLevelForUi(profileParsedJson, stateStore.getParsedExperience());
                    stateStore.setParsedSummary(String.join(",", profileSkills), experience, education);
                }
                android.widget.TextView status = root.findViewById(R.id.profile_resume_status);
                bindProfileResumeSection(root, true, true, pendingResumeName == null ? "" : pendingResumeName, null);
                Snackbar.make(root, "Resume parsed and profile updated.", Snackbar.LENGTH_SHORT).show();
                fetchCandidateProfile(root, false);
            }

            @Override
            public void onFailure(Call<ApiModels.ResumeParseResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (uploadBtn != null) uploadBtn.setEnabled(true);
                Snackbar.make(root, "Unable to parse resume now.", Snackbar.LENGTH_SHORT).show();
            }
        });
    }

    private void removeResumeFromProfile(@NonNull View root) {
        ApiClient.getInstance(requireContext()).api().removeCandidateResume().enqueue(new Callback<ApiModels.GenericSuccessResponse>() {
            @Override
            public void onResponse(Call<ApiModels.GenericSuccessResponse> call, Response<ApiModels.GenericSuccessResponse> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful()) {
                    Snackbar.make(root, "Could not remove resume.", Snackbar.LENGTH_SHORT).show();
                    return;
                }
                CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                stateStore.setResumeUploaded(false);
                stateStore.setParsedResume(false);
                stateStore.setParsedSummary("", "", "");
                stateStore.setInsights("", "");
                stateStore.setResumeFileName("");
                profileParsedJson.clear();
                profileSkills.clear();
                profileCertifications.clear();
                notifyCandidateStateChanged();
                bindAiInsightsCard(root, new ArrayList<>(), new ArrayList<>(), true);
                renderProfileChips(root);
                bindProfileResumeSection(root, false, false, "", null);
                Snackbar.make(root, "Resume removed.", Snackbar.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(Call<ApiModels.GenericSuccessResponse> call, Throwable t) {
                if (!isAdded()) return;
                Snackbar.make(root, "Network error while removing resume.", Snackbar.LENGTH_SHORT).show();
            }
        });
    }

    private void saveCandidateProfile(@NonNull View root) {
        pushCandidate(R.layout.fragment_candidate_edit_profile);
    }

    private void bindProfileResumeSection(
            @NonNull View root,
            boolean hasResume,
            boolean isParsed,
            @Nullable String fileName,
            @Nullable String updatedAtIso
    ) {
        android.widget.TextView resumeStatus = root.findViewById(R.id.profile_resume_status);
        android.widget.TextView resumeFileName = root.findViewById(R.id.profile_resume_filename);
        android.widget.TextView resumeUpdatedAt = root.findViewById(R.id.profile_resume_updated_at);
        android.widget.TextView resumeCompletionStatus = root.findViewById(R.id.profile_completion_resume_status);
        com.google.android.material.button.MaterialButton uploadBtn = root.findViewById(R.id.profile_resume_upload_btn);

        if (uploadBtn != null) {
            uploadBtn.setText(hasResume ? "Replace Resume" : "Upload Resume");
        }

        if (resumeStatus != null) {
            if (!hasResume) {
                resumeStatus.setText("No resume uploaded");
            } else if (isParsed) {
                resumeStatus.setText("Resume parsed and ready");
            } else {
                resumeStatus.setText("Resume uploaded · parsing in progress");
            }
        }

        if (resumeFileName != null) {
            if (hasResume && fileName != null && !fileName.trim().isEmpty()) {
                resumeFileName.setText(fileName.trim());
                resumeFileName.setVisibility(View.VISIBLE);
            } else {
                resumeFileName.setText("");
                resumeFileName.setVisibility(View.GONE);
            }
        }

        if (resumeUpdatedAt != null) {
            String formatted = formatFriendlyDateTime(updatedAtIso);
            if (hasResume && !formatted.isEmpty()) {
                resumeUpdatedAt.setText(formatted);
                resumeUpdatedAt.setVisibility(View.VISIBLE);
            } else {
                resumeUpdatedAt.setText("");
                resumeUpdatedAt.setVisibility(View.GONE);
            }
        }

        if (resumeCompletionStatus != null) {
            resumeCompletionStatus.setText(hasResume && isParsed ? "Complete" : "Missing");
            resumeCompletionStatus.setTextColor(ContextCompat.getColor(requireContext(),
                    hasResume && isParsed ? R.color.soft_green : R.color.text_secondary));
        }
    }

    @NonNull
    private List<String> toStringList(@Nullable Object value) {
        List<String> out = new ArrayList<>();
        if (value instanceof List) {
            for (Object item : (List<?>) value) {
                if (item == null) continue;
                String text = sanitizeReadableText(item.toString().trim(), "");
                if (!text.isEmpty()) out.add(text);
            }
            return out;
        }
        if (value instanceof String) {
            String raw = ((String) value).trim();
            if (raw.isEmpty()) return out;
            String[] parts = raw.split(",");
            for (String part : parts) {
                String text = sanitizeReadableText(part.trim(), "");
                if (!text.isEmpty()) out.add(text);
            }
        }
        return out;
    }

    @NonNull
    private String csvFromList(@Nullable List<String> values, int maxItems) {
        if (values == null || values.isEmpty()) return "";
        List<String> clean = new ArrayList<>();
        for (String value : values) {
            String text = sanitizeReadableText(value, "");
            if (text.isEmpty()) continue;
            clean.add(text);
            if (clean.size() >= maxItems) break;
        }
        return String.join(",", clean);
    }

    @NonNull
    private List<String> csvToList(@Nullable String csv) {
        if (csv == null || csv.trim().isEmpty()) return new ArrayList<>();
        List<String> out = new ArrayList<>();
        String[] parts = csv.split(",");
        for (String part : parts) {
            String value = sanitizeReadableText(part, "");
            if (!value.isEmpty()) out.add(value);
        }
        return out;
    }

    @NonNull
    private List<String> extractCertificationNames(@Nullable Object rawCerts) {
        List<String> out = new ArrayList<>();
        if (rawCerts instanceof List) {
            for (Object item : (List<?>) rawCerts) {
                String label = "";
                if (item instanceof Map) {
                    Object name = ((Map<?, ?>) item).get("name");
                    Object issuer = ((Map<?, ?>) item).get("issuer");
                    label = sanitizeReadableText(name == null ? "" : String.valueOf(name), "");
                    String issuerText = sanitizeReadableText(issuer == null ? "" : String.valueOf(issuer), "");
                    if (!issuerText.isEmpty() && !label.toLowerCase(Locale.US).contains(issuerText.toLowerCase(Locale.US))) {
                        label = label + " - " + issuerText;
                    }
                } else {
                    label = sanitizeReadableText(String.valueOf(item), "");
                }
                if (!label.isEmpty()) out.add(label);
            }
        } else {
            out.addAll(sanitizeReadableList(toStringList(rawCerts), 80));
        }
        ArrayList<String> dedup = new ArrayList<>();
        for (String s : out) {
            if (!dedup.contains(s)) dedup.add(s);
        }
        return dedup;
    }

    private void bindAiInsightsCard(@NonNull View root, @NonNull List<String> strengths, @NonNull List<String> improvements, boolean profileCard) {
        int cardId = profileCard ? R.id.profile_ai_insights_card : R.id.home_ai_insights_card;
        int strongId = profileCard ? R.id.profile_ai_strengths : R.id.home_ai_strengths;
        int improveId = profileCard ? R.id.profile_ai_improvements : R.id.home_ai_improvements;
        View card = root.findViewById(cardId);
        TextView strongText = root.findViewById(strongId);
        TextView improveText = root.findViewById(improveId);

        List<String> cleanStrengths = sanitizeSkillList(strengths);
        List<String> cleanImprovements = sanitizeSkillList(improvements);
        boolean visible = !cleanStrengths.isEmpty() || !cleanImprovements.isEmpty();
        if (card != null) card.setVisibility(visible ? View.VISIBLE : View.GONE);
        if (!visible) return;

        if (strongText != null) {
            strongText.setText(cleanStrengths.isEmpty()
                    ? "Strong in: profile summary not available yet"
                    : "Strong in: " + TextUtils.join(", ", cleanStrengths.subList(0, Math.min(5, cleanStrengths.size()))));
        }
        if (improveText != null) {
            improveText.setText(cleanImprovements.isEmpty()
                    ? "Suggested improvement: add resume details to unlock tailored recommendations"
                    : "Suggested improvement: " + TextUtils.join(", ", cleanImprovements.subList(0, Math.min(4, cleanImprovements.size()))));
        }
    }

    private void bindAiParsing(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        View next = view.findViewById(R.id.parsing_next);
        View cancel = view.findViewById(R.id.parsing_cancel);
        View back = view.findViewById(R.id.parsing_back);
        android.widget.TextView statusLabel = view.findViewById(R.id.parsing_status);
        android.widget.TextView percent = view.findViewById(R.id.parsing_percent);
        android.widget.ProgressBar bar = view.findViewById(R.id.parsing_progress);
        if (next != null) {
            next.setEnabled(false);
            next.setAlpha(0.5f);
        }
        if (cancel != null) {
            cancel.setEnabled(false);
            cancel.setAlpha(0.45f);
            if (cancel instanceof android.widget.Button) {
                ((android.widget.Button) cancel).setText("Cancel");
            }
        }
        if (back != null) {
            back.setOnClickListener(v -> {
                CandidateStateStore localStore = new CandidateStateStore(requireContext());
                String selectedJobId = localStore.getSelectedJobId();
                if (selectedJobId == null || selectedJobId.trim().isEmpty()) {
                    pushCandidate(R.layout.fragment_upload_resume);
                } else {
                    requireActivity().onBackPressed();
                }
            });
        }
        if (percent != null) {
            percent.setText("0%");
        }
        if (bar != null) {
            bar.setProgress(0);
        }

        parsingVisualProgress = 0;
        parseCompleted = false;
        parseInFlight = false;
        parseFailed = false;
        if ("MATCH_SCORE".equalsIgnoreCase(stateStore.getProgressMode())) {
            startMatchScoreCalculationFlow(view);
        } else {
            startResumeParseWithPolling(view);
        }

        view.findViewById(R.id.parsing_next).setOnClickListener(v -> {
            if (parseCompleted && parsingVisualProgress >= 100 && !"MATCH_SCORE".equalsIgnoreCase(new CandidateStateStore(requireContext()).getProgressMode())) {
                pushCandidate(R.layout.fragment_resume_analysis);
            }
        });
        if (cancel != null) {
            cancel.setOnClickListener(v -> {
                if (parseFailed) {
                    if (statusLabel != null) statusLabel.setText("Retrying resume parsing...");
                    CandidateStateStore localStore = new CandidateStateStore(requireContext());
                    ApiClient.getInstance(requireContext()).api().retryCandidateResumeParse(localStore.getResumeId(), "true").enqueue(new Callback<ApiModels.ResumeParseStatusResponse>() {
                        @Override
                        public void onResponse(Call<ApiModels.ResumeParseStatusResponse> call, Response<ApiModels.ResumeParseStatusResponse> response) {
                            if (!isAdded()) return;
                            if (response.isSuccessful() && response.body() != null && response.body().jobId != null) {
                                localStore.setResumeParseJobId(response.body().jobId);
                            }
                            startResumeParseWithPolling(view);
                        }

                        @Override
                        public void onFailure(Call<ApiModels.ResumeParseStatusResponse> call, Throwable t) {
                            if (!isAdded()) return;
                            startResumeParseWithPolling(view);
                        }
                    });
                }
            });
        }
    }

    private void onResumeFilePicked(@Nullable Uri uri) {
        View root = getView();
        if (uri == null || root == null || getContext() == null) {
            return;
        }
        if (layoutId == R.layout.fragment_profile) {
            uploadResumeFromProfile(uri, root);
            return;
        }
        pendingResumeUri = uri;
        pendingResumeName = queryDisplayName(uri);
        View scanButton = root.findViewById(R.id.upload_scan);
        if (scanButton != null) {
            scanButton.setEnabled(true);
            scanButton.setAlpha(1f);
        }
        String label = pendingResumeName == null || pendingResumeName.trim().isEmpty()
                ? "Resume selected. Tap Scan with AI."
                : ("Selected: " + pendingResumeName);
        Snackbar.make(root, label, Snackbar.LENGTH_SHORT).show();
    }

    private void uploadResumeFromProfile(@NonNull Uri uri, @NonNull View root) {
        View uploadButton = root.findViewById(R.id.profile_resume_upload_btn);
        if (uploadButton != null) {
            uploadButton.setEnabled(false);
        }
        new Thread(() -> {
            try {
                String fileName = queryDisplayName(uri);
                if (fileName == null || fileName.trim().isEmpty()) {
                    fileName = "resume_" + System.currentTimeMillis() + ".pdf";
                }
                String mimeType = requireContext().getContentResolver().getType(uri);
                if (mimeType == null || mimeType.trim().isEmpty()) {
                    mimeType = "application/octet-stream";
                }
                byte[] bytes;
                try (InputStream inputStream = requireContext().getContentResolver().openInputStream(uri);
                     ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                    if (inputStream == null) throw new IllegalStateException("Unable to open file.");
                    byte[] data = new byte[8192];
                    int nRead;
                    while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, nRead);
                    }
                    bytes = buffer.toByteArray();
                }
                RequestBody requestBody = RequestBody.create(MediaType.parse(mimeType), bytes);
                MultipartBody.Part filePart = MultipartBody.Part.createFormData("resume", fileName, requestBody);
                requireActivity().runOnUiThread(() ->
                        ApiClient.getInstance(requireContext()).api().uploadCandidateResume(filePart).enqueue(new Callback<ApiModels.ResumeUploadResponse>() {
                            @Override
                            public void onResponse(Call<ApiModels.ResumeUploadResponse> call, Response<ApiModels.ResumeUploadResponse> response) {
                                if (!isAdded()) return;
                                if (uploadButton != null) uploadButton.setEnabled(true);
                                if (!response.isSuccessful()) {
                                    Snackbar.make(root, "Resume upload failed.", Snackbar.LENGTH_SHORT).show();
                                    return;
                                }
                                CandidateStateStore store = new CandidateStateStore(requireContext());
                                store.setProgressMode("RESUME_PARSE");
                                store.setResumeUploaded(true);
                                store.setParsedResume(false);
                                store.setLastResumeUpdatedAt(System.currentTimeMillis());
                                if (response.body() != null) {
                                    store.setResumeParseJobId(response.body().parseJobId);
                                    store.setResumeId(response.body().resumeId);
                                    if (response.body().filename != null && !response.body().filename.trim().isEmpty()) {
                                        store.setResumeFileName(response.body().filename);
                                    }
                                }
                                android.widget.TextView status = root.findViewById(R.id.profile_resume_status);
                                if (status != null) status.setText("Resume uploaded. Parsing started...");
                                android.widget.TextView completionStatus = root.findViewById(R.id.profile_completion_resume_status);
                                if (completionStatus != null) {
                                    completionStatus.setText("Missing");
                                    completionStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary));
                                }
                                notifyCandidateStateChanged();
                                pushCandidate(R.layout.fragment_ai_parsing);
                            }

                            @Override
                            public void onFailure(Call<ApiModels.ResumeUploadResponse> call, Throwable t) {
                                if (!isAdded()) return;
                                if (uploadButton != null) uploadButton.setEnabled(true);
                                Snackbar.make(root, "Network error while uploading resume.", Snackbar.LENGTH_SHORT).show();
                            }
                        })
                );
            } catch (Exception ignored) {
                if (!isAdded()) return;
                requireActivity().runOnUiThread(() -> {
                    if (uploadButton != null) uploadButton.setEnabled(true);
                    Snackbar.make(root, "Unable to read selected file.", Snackbar.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void uploadResume(@NonNull Uri uri, @NonNull View root) {
        new Thread(() -> {
            try {
                String fileName = queryDisplayName(uri);
                if (fileName == null || fileName.trim().isEmpty()) {
                    fileName = "resume_" + System.currentTimeMillis() + ".pdf";
                }
                String mimeType = requireContext().getContentResolver().getType(uri);
                if (mimeType == null || mimeType.trim().isEmpty()) {
                    mimeType = "application/octet-stream";
                }
                byte[] bytes;
                try (InputStream inputStream = requireContext().getContentResolver().openInputStream(uri);
                     ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                    if (inputStream == null) {
                        throw new IllegalStateException("Unable to open selected file.");
                    }
                    byte[] data = new byte[8192];
                    int nRead;
                    while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, nRead);
                    }
                    bytes = buffer.toByteArray();
                }
                RequestBody requestBody = RequestBody.create(MediaType.parse(mimeType), bytes);
                MultipartBody.Part filePart = MultipartBody.Part.createFormData("resume", fileName, requestBody);
                requireActivity().runOnUiThread(() ->
                        ApiClient.getInstance(requireContext()).api().uploadCandidateResume(filePart).enqueue(new Callback<ApiModels.ResumeUploadResponse>() {
                            @Override
                            public void onResponse(Call<ApiModels.ResumeUploadResponse> call, Response<ApiModels.ResumeUploadResponse> response) {
                                if (!isAdded()) return;
                                View btn = root.findViewById(R.id.upload_scan);
                                if (btn != null) {
                                    btn.setEnabled(true);
                                    btn.setAlpha(1f);
                                }
                                if (response.isSuccessful()) {
                                    CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                                    stateStore.setProgressMode("RESUME_PARSE");
                                    stateStore.setResumeUploaded(true);
                                    stateStore.setParsedResume(false);
                                    stateStore.setResumeSkipped(false);
                                    stateStore.setLastResumeUpdatedAt(System.currentTimeMillis());
                                    if (response.body() != null) {
                                        stateStore.setResumeParseJobId(response.body().parseJobId);
                                        stateStore.setResumeId(response.body().resumeId);
                                    }
                                    if (response.body() != null && response.body().resumeFileUrl != null) {
                                        String uploaded = response.body().resumeFileUrl;
                                        int idx = uploaded.lastIndexOf('/');
                                        stateStore.setResumeFileName(idx >= 0 ? uploaded.substring(idx + 1) : uploaded);
                                    }
                                    pendingResumeUri = null;
                                    pendingResumeName = null;
                                    pushCandidate(R.layout.fragment_ai_parsing);
                                    return;
                                }
                                Snackbar.make(root, "Upload failed. Try again.", Snackbar.LENGTH_LONG).show();
                            }

                            @Override
                            public void onFailure(Call<ApiModels.ResumeUploadResponse> call, Throwable t) {
                                if (!isAdded()) return;
                                View btn = root.findViewById(R.id.upload_scan);
                                if (btn != null) {
                                    btn.setEnabled(true);
                                    btn.setAlpha(1f);
                                }
                                Snackbar.make(root, "Upload failed. Check network and retry.", Snackbar.LENGTH_LONG).show();
                            }
                        })
                );
            } catch (Exception ex) {
                if (!isAdded()) return;
                requireActivity().runOnUiThread(() -> {
                    View btn = root.findViewById(R.id.upload_scan);
                    if (btn != null) {
                        btn.setEnabled(true);
                        btn.setAlpha(1f);
                    }
                    Snackbar.make(root, "Could not read selected file.", Snackbar.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void startMatchScoreCalculationFlow(@NonNull View root) {
        if (!isAdded()) return;
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        parseCompleted = false;
        parseFailed = false;
        parseInFlight = true;
        parsingVisualProgress = 8;
        updateParsingUi(root, 8, "LLM", "Calculating match score...", false, false);
        parsingHandler.removeCallbacksAndMessages(null);

        String selectedJobId = stateStore.getSelectedJobId();
        int backendJobId = parseBackendId(selectedJobId);
        if (backendJobId <= 0) {
            parseInFlight = false;
            onParseFailed(root, "Unable to identify selected job.");
            return;
        }

        Runnable visual = new Runnable() {
            @Override
            public void run() {
                if (!isAdded() || parseCompleted || parseFailed) return;
                parsingVisualProgress = Math.min(86, parsingVisualProgress + 9);
                updateParsingUi(root, parsingVisualProgress, "LLM", "Comparing your resume to job requirements...", false, false);
                parsingHandler.postDelayed(this, 180L);
            }
        };
        parsingHandler.postDelayed(visual, 120L);

        ApiClient.getInstance(requireContext()).api().getMatchScore(String.valueOf(backendJobId)).enqueue(new Callback<ApiModels.MatchScoreResponse>() {
            @Override
            public void onResponse(Call<ApiModels.MatchScoreResponse> call, Response<ApiModels.MatchScoreResponse> response) {
                if (!isAdded()) return;
                parseInFlight = false;
                if (response.isSuccessful() && response.body() != null) {
                    parsingHandler.removeCallbacksAndMessages(null);
                    handleBackendMatchScoreResponse(stateStore, selectedJobId, response.body(), root);
                    return;
                }
                parsingHandler.removeCallbacksAndMessages(null);
                fallbackLocalMatch(stateStore, selectedJobId);
            }

            @Override
            public void onFailure(Call<ApiModels.MatchScoreResponse> call, Throwable t) {
                if (!isAdded()) return;
                parseInFlight = false;
                parsingHandler.removeCallbacksAndMessages(null);
                fallbackLocalMatch(stateStore, selectedJobId);
            }
        });
    }

    private void handleBackendMatchScoreResponse(@NonNull CandidateStateStore stateStore, @NonNull String selectedJobId, @NonNull ApiModels.MatchScoreResponse body, @Nullable View parsingRoot) {
        stateStore.setProgressMode("MATCH_SCORE");
        stateStore.setLastMatchMeta(body.score, body.threshold, body.retryAfterAt);
        if (body.topStrengths != null || body.suggestedImprovements != null) {
            List<String> strengths = body.topStrengths == null ? new ArrayList<>() : sanitizeSkillList(body.topStrengths);
            List<String> improvements = body.suggestedImprovements == null ? new ArrayList<>() : sanitizeSkillList(body.suggestedImprovements);
            if (!strengths.isEmpty() || !improvements.isEmpty()) {
                stateStore.setInsights(csvFromList(strengths, 8), csvFromList(improvements, 8));
                notifyCandidateStateChanged();
            }
        }
        if (parsingRoot != null) {
            updateParsingUi(parsingRoot, 100, "SAVE", body.passStatus ? "Match score ready." : "Match score complete.", false, false);
        }
        refreshCandidateApplicationsCacheAsync();
        if (Boolean.TRUE.equals(body.cooldownActive)) {
            stateStore.setPipelineState(selectedJobId, "MATCH_FAIL");
            pushCandidate(R.layout.fragment_match_score_fail);
            return;
        }
        if (body.passStatus) {
            stateStore.setPipelineState(selectedJobId, "MATCH_PASS");
            pushCandidate(R.layout.fragment_match_score_success);
        } else {
            stateStore.setPipelineState(selectedJobId, "MATCH_FAIL");
            pushCandidate(R.layout.fragment_match_score_fail);
        }
    }

    private void requestResumeParse() {
        if (!isAdded() || parseInFlight) return;
        parseInFlight = true;
        ApiModels.ResumeParseRequest request = new ApiModels.ResumeParseRequest();
        request.resumeText = "";
        ApiClient.getInstance(requireContext()).api().parseCandidateResume(request).enqueue(new Callback<ApiModels.ResumeParseResponse>() {
            @Override
            public void onResponse(Call<ApiModels.ResumeParseResponse> call, Response<ApiModels.ResumeParseResponse> response) {
                parseInFlight = false;
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null && response.body().parsedResumeJson != null) {
                    applyParsedResumeToState(response.body().parsedResumeJson);
                    parseCompleted = true;
                    parsingVisualProgress = 100;
                    notifyCandidateStateChanged();
                    return;
                }
                applyFallbackParsedState();
            }

            @Override
            public void onFailure(Call<ApiModels.ResumeParseResponse> call, Throwable t) {
                parseInFlight = false;
                if (!isAdded()) return;
                applyFallbackParsedState();
            }
        });
    }

    private void startResumeParseWithPolling(@NonNull View root) {
        if (!isAdded()) return;
        parseCompleted = false;
        parseFailed = false;
        parseInFlight = true;
        parsingVisualProgress = 0;
        parsingHandler.removeCallbacksAndMessages(null);
        updateParsingUi(root, 0, "UPLOAD", "Preparing your resume...", false, false);

        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        String jobId = stateStore.getResumeParseJobId();
        retrofit2.Call<ApiModels.ResumeParseStatusResponse> call = (jobId == null || jobId.trim().isEmpty())
                ? ApiClient.getInstance(requireContext()).api().startCandidateResumeParse()
                : ApiClient.getInstance(requireContext()).api().getCandidateResumeParseStatus(jobId);
        call.enqueue(new Callback<ApiModels.ResumeParseStatusResponse>() {
            @Override
            public void onResponse(Call<ApiModels.ResumeParseStatusResponse> call, Response<ApiModels.ResumeParseStatusResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    if (response.body().jobId != null && !response.body().jobId.trim().isEmpty()) {
                        stateStore.setResumeParseJobId(response.body().jobId);
                    }
                    applyParseStatus(root, response.body());
                    scheduleParseStatusPoll(root, 800L);
                    return;
                }
                // Backward-compatible fallback if parse-start is unavailable.
                requestResumeParse();
                startFallbackProgressPolling(root);
            }

            @Override
            public void onFailure(Call<ApiModels.ResumeParseStatusResponse> call, Throwable t) {
                if (!isAdded()) return;
                requestResumeParse();
                startFallbackProgressPolling(root);
            }
        });
    }

    private void scheduleParseStatusPoll(@NonNull View root, long delayMs) {
        if (!isAdded()) return;
        if (parseStatusPollRunnable != null) {
            parsingHandler.removeCallbacks(parseStatusPollRunnable);
        }
        parseStatusPollRunnable = () -> pollResumeParseStatus(root);
        parsingHandler.postDelayed(parseStatusPollRunnable, delayMs);
    }

    private void pollResumeParseStatus(@NonNull View root) {
        if (!isAdded()) return;
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        ApiClient.getInstance(requireContext()).api().getCandidateResumeParseStatus(stateStore.getResumeParseJobId()).enqueue(new Callback<ApiModels.ResumeParseStatusResponse>() {
            @Override
            public void onResponse(Call<ApiModels.ResumeParseStatusResponse> call, Response<ApiModels.ResumeParseStatusResponse> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    scheduleParseStatusPoll(root, 1000L);
                    return;
                }
                if (response.body().jobId != null && !response.body().jobId.trim().isEmpty()) {
                    stateStore.setResumeParseJobId(response.body().jobId);
                }
                applyParseStatus(root, response.body());
                String status = response.body().status == null ? "" : response.body().status;
                if ("SUCCEEDED".equalsIgnoreCase(status)) {
                    onParseSucceeded(root);
                } else if ("FAILED".equalsIgnoreCase(status)) {
                    onParseFailed(root, response.body().message);
                } else {
                    scheduleParseStatusPoll(root, 900L);
                }
            }

            @Override
            public void onFailure(Call<ApiModels.ResumeParseStatusResponse> call, Throwable t) {
                if (!isAdded()) return;
                scheduleParseStatusPoll(root, 1200L);
            }
        });
    }

    private void applyParseStatus(@NonNull View root, @NonNull ApiModels.ResumeParseStatusResponse status) {
        int progress = Math.max(parsingVisualProgress, Math.max(0, Math.min(100, status.progress)));
        parsingVisualProgress = progress;
        updateParsingUi(root, progress, status.stage, status.message, false, false);
    }

    private void onParseSucceeded(@NonNull View root) {
        parseInFlight = false;
        parseFailed = false;
        updateParsingUi(root, 98, "SAVE", "Validating parsed profile...", false, false);
        refreshCandidateStateFromBackend(root, () -> {
            if (!isAdded()) return;
            CandidateStateStore store = new CandidateStateStore(requireContext());
            boolean looksValid = store.getState().hasParsedResume
                    && (!csvToList(store.getParsedSkillsCsv()).isEmpty()
                    || !sanitizeReadableText(store.getParsedEducation(), "").isEmpty());
            if (!looksValid) {
                onParseFailed(root, "Parsing output invalid. Please retry with a clearer file.");
                return;
            }
            parseCompleted = true;
            parsingVisualProgress = 100;
            store.setParsedResume(true);
            updateParsingUi(root, 100, "SAVE", "Resume parsed successfully.", true, false);
            notifyCandidateStateChanged();
        });
    }

    private void onParseFailed(@NonNull View root, @Nullable String message) {
        parseInFlight = false;
        parseFailed = true;
        updateParsingUi(root, Math.max(parsingVisualProgress, 1), "FAILED",
                message == null || message.trim().isEmpty() ? "Resume parsing failed. Retry with a clearer file." : message,
                false, true);
    }

    private void updateParsingUi(@NonNull View root, int progress, @Nullable String stage, @Nullable String message, boolean success, boolean failed) {
        TextView statusText = root.findViewById(R.id.parsing_status);
        TextView percentText = root.findViewById(R.id.parsing_percent);
        android.widget.ProgressBar progressBar = root.findViewById(R.id.parsing_progress);
        View next = root.findViewById(R.id.parsing_next);
        View cancel = root.findViewById(R.id.parsing_cancel);

        if (statusText != null) {
            String fallback = mapParseStageToLabel(stage);
            statusText.setText((message == null || message.trim().isEmpty()) ? fallback : message);
        }
        if (percentText != null) percentText.setText(progress + "%");
        if (progressBar != null) progressBar.setProgress(progress);
        if (next != null) {
            next.setEnabled(success);
            next.setAlpha(success ? 1f : 0.5f);
        }
        if (cancel instanceof android.widget.Button) {
            android.widget.Button cancelBtn = (android.widget.Button) cancel;
            cancelBtn.setText(failed ? "Retry" : "Cancel");
            cancelBtn.setEnabled(failed);
            cancelBtn.setAlpha(failed ? 1f : 0.45f);
        } else if (cancel != null) {
            cancel.setEnabled(failed);
            cancel.setAlpha(failed ? 1f : 0.45f);
        }
    }

    private String mapParseStageToLabel(@Nullable String stage) {
        if (stage == null) return "Parsing resume...";
        switch (stage.toUpperCase(Locale.US)) {
            case "OCR":
                return "Reading scanned pages...";
            case "EXTRACT":
                return "Extracting sections...";
            case "LLM":
                return "Understanding resume content...";
            case "NORMALIZE":
                return "Normalizing skills and experience...";
            case "SAVE":
                return "Saving parsed profile...";
            case "UPLOAD":
            default:
                return "Preparing your resume...";
        }
    }

    private void startFallbackProgressPolling(@NonNull View root) {
        Runnable updater = new Runnable() {
            @Override
            public void run() {
                if (!isAdded() || getView() == null) return;
                int targetMax = parseCompleted ? 100 : 92;
                int increment = parseCompleted ? 10 : 3;
                parsingVisualProgress = Math.min(targetMax, parsingVisualProgress + increment);
                updateParsingUi(root, parsingVisualProgress, parseCompleted ? "SAVE" : "LLM",
                        parseCompleted ? "Resume parsed successfully." : "Parsing resume...", parseCompleted, false);
                if (parsingVisualProgress >= 100) return;
                parsingHandler.postDelayed(this, parseCompleted ? 70L : 180L);
            }
        };
        parsingHandler.postDelayed(updater, 120L);
    }

    private void applyParsedResumeToState(@NonNull Map<String, Object> parsed) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        List<String> skills = new ArrayList<>();
        Object skillsObj = parsed.get("skills");
        if (skillsObj instanceof List) {
            for (Object item : (List<?>) skillsObj) {
                if (item == null) continue;
                String value = normalizeSkillLabel(String.valueOf(item));
                if (!value.isEmpty()) {
                    skills.add(value);
                }
            }
        }
        if (skills.isEmpty()) {
            Set<String> stacks = stateStore.getTechStacks();
            if (!stacks.isEmpty()) {
                skills.addAll(sanitizeSkillList(new ArrayList<>(stacks)));
            }
        }
        skills = sanitizeSkillList(skills);
        List<String> strengths = sanitizeSkillList(toStringList(parsed.get("top_strengths")));
        if (strengths.isEmpty()) {
            strengths.addAll(skills.subList(0, Math.min(5, skills.size())));
        }
        List<String> improvements = sanitizeSkillList(toStringList(parsed.get("suggested_improvements")));

        String educationText = "";
        Object educationObj = parsed.get("education");
        if (educationObj instanceof List && !((List<?>) educationObj).isEmpty()) {
            Object first = ((List<?>) educationObj).get(0);
            if (first instanceof Map) {
                Object degree = ((Map<?, ?>) first).get("degree");
                Object institution = ((Map<?, ?>) first).get("institution");
                String degreeText = degree == null ? "" : String.valueOf(degree).trim();
                String institutionText = institution == null ? "" : String.valueOf(institution).trim();
                if (!degreeText.isEmpty() && !institutionText.isEmpty()) {
                    educationText = degreeText + ", " + institutionText;
                } else if (!degreeText.isEmpty()) {
                    educationText = degreeText;
                } else {
                    educationText = institutionText;
                }
            }
        } else if (educationObj instanceof String) {
            educationText = normalizeEducationText(((String) educationObj).trim());
        }
        if (educationText.isEmpty()) {
            educationText = "";
        }
        educationText = sanitizeReadableText(educationText, "");

        String experienceLevel = extractExperienceLevelForUi(parsed, "Entry Level");

        stateStore.setParsedSummary(String.join(",", skills), experienceLevel, educationText);
        stateStore.setInsights(csvFromList(strengths, 8), csvFromList(improvements, 8));
        stateStore.setParsedResume(true);
        stateStore.setResumeUploaded(true);
        stateStore.setResumeSkipped(false);
        stateStore.setCandidateOnboardingSeen(true);
        stateStore.setLastResumeUpdatedAt(System.currentTimeMillis());
        notifyCandidateStateChanged();
    }

    private void applyFallbackParsedState() {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        Set<String> stacks = stateStore.getTechStacks();
        String fallbackSkills = stacks.isEmpty() ? "" : String.join(",", stacks);
        stateStore.setParsedSummary(fallbackSkills, "Entry Level", "");
        stateStore.setInsights(stacks.isEmpty() ? "" : String.join(",", sanitizeSkillList(new ArrayList<>(stacks))), "");
        stateStore.setParsedResume(!fallbackSkills.isEmpty());
        stateStore.setResumeUploaded(true);
        stateStore.setResumeSkipped(false);
        stateStore.setCandidateOnboardingSeen(true);
        stateStore.setLastResumeUpdatedAt(System.currentTimeMillis());
        parseCompleted = true;
        notifyCandidateStateChanged();
    }

    private String sanitizeReadableText(String text, String fallback) {
        if (text == null) return fallback;
        String normalized = text.replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty()) return fallback;
        if (normalized.length() > 260) {
            normalized = normalized.substring(0, 260);
        }
        int letters = 0;
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
                letters++;
            }
        }
        double ratio = letters / (double) Math.max(1, normalized.length());
        if (ratio < 0.35d) return fallback;
        return normalized;
    }

    @NonNull
    private List<String> sanitizeReadableList(@NonNull List<String> values, int maxLen) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String value : values) {
            String clean = sanitizeReadableText(value, "");
            if (clean.isEmpty()) continue;
            if (clean.length() > maxLen) clean = clean.substring(0, maxLen);
            set.add(clean);
        }
        return new ArrayList<>(set);
    }

    @NonNull
    private List<String> sanitizeSkillList(@NonNull List<String> values) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = normalizeSkillLabel(value);
            if (!normalized.isEmpty()) {
                set.add(normalized);
            }
        }
        return new ArrayList<>(set);
    }

    private String normalizeSkillLabel(@Nullable String value) {
        if (value == null) return "";
        String raw = value.trim();
        if (raw.isEmpty()) return "";
        String lower = raw.toLowerCase(Locale.US);
        switch (lower) {
            case "c#":
            case "csharp":
                return "C#";
            case "c++":
            case "cpp":
                return "C++";
            case "js":
            case "javascript":
                return "JavaScript";
            case "ts":
            case "typescript":
                return "TypeScript";
            case "nodejs":
            case "node.js":
                return "Node.js";
            case "dotnet":
            case ".net":
                return ".NET";
            case "mysql":
                return "MySQL";
            case "sql":
                return "SQL";
            case "aws":
                return "AWS";
            case "api":
            case "rest api":
                return "REST API";
            case "ai/ml":
                return "AI/ML";
            default:
                break;
        }
        String clean = sanitizeReadableText(raw, "");
        if (clean.isEmpty()) return "";
        if (clean.length() <= 4 && clean.toUpperCase(Locale.US).equals(clean)) {
            return clean;
        }
        String[] parts = clean.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(part.substring(0, 1).toUpperCase(Locale.US));
            if (part.length() > 1) {
                sb.append(part.substring(1).toLowerCase(Locale.US));
            }
        }
        return sb.toString();
    }

    private String extractEducationForUi(@NonNull Map<String, Object> parsed, @Nullable String fallback) {
        Object educationObj = parsed.get("education");
        String educationText = "";
        if (educationObj instanceof String) {
            educationText = normalizeEducationText((String) educationObj);
        } else if (educationObj instanceof List && !((List<?>) educationObj).isEmpty()) {
            Object first = ((List<?>) educationObj).get(0);
            if (first instanceof Map) {
                Object degree = ((Map<?, ?>) first).get("degree");
                Object institution = ((Map<?, ?>) first).get("institution");
                String degreeText = degree == null ? "" : String.valueOf(degree);
                String institutionText = institution == null ? "" : String.valueOf(institution);
                if (!degreeText.trim().isEmpty() && !institutionText.trim().isEmpty()) {
                    educationText = degreeText + ", " + institutionText;
                } else if (!degreeText.trim().isEmpty()) {
                    educationText = degreeText;
                } else {
                    educationText = institutionText;
                }
            }
        }
        String fallbackValue = fallback == null ? "Education details parsed" : fallback;
        return sanitizeReadableText(educationText, sanitizeReadableText(fallbackValue, "Education details parsed"));
    }

    private String normalizeEducationText(@Nullable String rawText) {
        if (rawText == null) return "";
        String raw = rawText.trim();
        if (raw.isEmpty()) return "";
        if ((raw.startsWith("[") || raw.startsWith("{")) && raw.contains("degree")) {
            String degree = extractQuotedValue(raw, "degree");
            String institution = extractQuotedValue(raw, "institution");
            String year = extractQuotedValue(raw, "year");
            StringBuilder sb = new StringBuilder();
            if (!degree.isEmpty()) sb.append(degree);
            if (!institution.isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(institution);
            }
            if (!year.isEmpty()) {
                if (sb.length() > 0) sb.append(" (").append(year).append(")");
                else sb.append(year);
            }
            String normalized = sb.toString().trim();
            if (!normalized.isEmpty()) return normalized;
        }
        return raw;
    }

    private String extractQuotedValue(@NonNull String text, @NonNull String key) {
        String[] patterns = new String[]{
                "'" + key + "'\\s*:\\s*'([^']+)'",
                "\"" + key + "\"\\s*:\\s*\"([^\"]+)\""
        };
        for (String pattern : patterns) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(text);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        return "";
    }

    private String extractExperienceLevelForUi(@NonNull Map<String, Object> parsed, @Nullable String fallback) {
        Object expObj = parsed.get("experience_level");
        String value = expObj == null ? "" : String.valueOf(expObj).trim();
        if (!value.isEmpty()) {
            String low = value.toLowerCase(Locale.US);
            if (low.contains("lead") || low.contains("staff")) return "Lead / Staff";
            if (low.contains("senior")) return "Senior Level";
            if (low.contains("mid")) return "Mid Level";
            if (low.contains("entry") || low.contains("junior") || low.contains("fresher")) return "Entry Level";
        }

        Object yearsObj = parsed.get("years_of_experience");
        double years = 0d;
        if (yearsObj instanceof Number) {
            years = ((Number) yearsObj).doubleValue();
        } else if (yearsObj instanceof String) {
            try {
                years = Double.parseDouble((String) yearsObj);
            } catch (Exception ignored) {
                years = 0d;
            }
        }
        if (years >= 10d) return "Lead / Staff";
        if (years >= 5d) return "Senior Level";
        if (years >= 2d) return "Mid Level";
        if (years > 0d) return "Entry Level";

        return sanitizeReadableText(fallback == null ? "" : fallback, "Entry Level");
    }

    private String queryDisplayName(@NonNull Uri uri) {
        try (android.database.Cursor cursor = requireContext().getContentResolver().query(
                uri,
                new String[]{OpenableColumns.DISPLAY_NAME},
                null,
                null,
                null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    return cursor.getString(index);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private void bindResumeAnalysis(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        View back = view.findViewById(R.id.analysis_back);
        if (back != null) {
            back.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        renderResumeAnalysisContent(view, null);
        ApiClient.getInstance(requireContext()).api().getCandidateProfile().enqueue(new Callback<ApiModels.CandidateProfileResponse>() {
            @Override
            public void onResponse(Call<ApiModels.CandidateProfileResponse> call, Response<ApiModels.CandidateProfileResponse> response) {
                if (!isAdded() || response.body() == null || !response.isSuccessful()) return;
                syncCandidateStateFromProfile(response.body());
                renderResumeAnalysisContent(view, response.body().parsedResumeJson);
            }

            @Override
            public void onFailure(Call<ApiModels.CandidateProfileResponse> call, Throwable t) {
                // keep local render
            }
        });

        view.findViewById(R.id.analysis_next).setOnClickListener(v -> {
            String selectedJobId = stateStore.getSelectedJobId();
            if (selectedJobId == null || selectedJobId.isEmpty()) {
                stateStore.setCandidateOnboardingSeen(true);
                if (getActivity() instanceof CandidateActivity && ((CandidateActivity) getActivity()).isOnboardingGateActive()) {
                    ((CandidateActivity) getActivity()).onResumeOnboardingCompleted();
                } else {
                    openCandidateTab(R.id.nav_jobs);
                }
                return;
            }
            setButtonEnabledAnimated(v, false);
            int backendJobId = parseBackendId(selectedJobId);
            if (backendJobId > 0) {
                ApiClient.getInstance(requireContext()).api().getMatchScore(String.valueOf(backendJobId)).enqueue(new Callback<ApiModels.MatchScoreResponse>() {
                    @Override
                    public void onResponse(Call<ApiModels.MatchScoreResponse> call, Response<ApiModels.MatchScoreResponse> response) {
                        setButtonEnabledAnimated(v, true);
                        if (!isAdded()) return;
                        if (response.isSuccessful() && response.body() != null) {
                            handleBackendMatchScoreResponse(stateStore, selectedJobId, response.body(), null);
                            return;
                        }
                        fallbackLocalMatch(stateStore, selectedJobId);
                    }

                    @Override
                    public void onFailure(Call<ApiModels.MatchScoreResponse> call, Throwable t) {
                        setButtonEnabledAnimated(v, true);
                        fallbackLocalMatch(stateStore, selectedJobId);
                    }
                });
            } else {
                setButtonEnabledAnimated(v, true);
                fallbackLocalMatch(stateStore, selectedJobId);
            }
        });
    }

    private void renderResumeAnalysisContent(@NonNull View view, @Nullable Map<String, Object> parsedFromServer) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        List<String> parsedSkills = new ArrayList<>();
        Map<String, Object> parsed = parsedFromServer;
        if (parsed != null) {
            parsedSkills.addAll(sanitizeSkillList(toStringList(parsed.get("skills"))));
        }
        if (parsedSkills.isEmpty()) {
            String[] skills = stateStore.getParsedSkillsCsv().split(",");
            for (String skill : skills) {
                String trimmed = normalizeSkillLabel(skill);
                if (!trimmed.isEmpty()) {
                    parsedSkills.add(trimmed);
                }
            }
        }
        if (parsedSkills.isEmpty() && !stateStore.getTechStacks().isEmpty()) {
            parsedSkills.addAll(sanitizeSkillList(new ArrayList<>(stateStore.getTechStacks())));
        }
        parsedSkills = sanitizeSkillList(parsedSkills);
        android.widget.LinearLayout skillsRow = view.findViewById(R.id.analysis_skills_row);
        View skillsCard = view.findViewById(R.id.analysis_skills_card);
        if (skillsRow != null) {
            skillsRow.removeAllViews();
            int shown = Math.min(10, parsedSkills.size());
            for (int i = 0; i < shown; i++) {
                String skill = parsedSkills.get(i);
                android.widget.TextView chip = new android.widget.TextView(requireContext());
                chip.setText(skill.trim());
                chip.setTextColor(androidx.core.content.ContextCompat.getColor(requireContext(), R.color.text_primary));
                chip.setTextSize(14f);
                chip.setBackgroundResource(R.drawable.bg_chip_light);
                chip.setPadding(24, 10, 24, 10);
                android.widget.LinearLayout.LayoutParams lp = new android.widget.LinearLayout.LayoutParams(
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
                );
                lp.setMargins(0, 0, 12, 0);
                chip.setLayoutParams(lp);
                skillsRow.addView(chip);
            }
            if (parsedSkills.size() > shown) {
                android.widget.TextView moreChip = new android.widget.TextView(requireContext());
                moreChip.setText("+" + (parsedSkills.size() - shown) + " more");
                moreChip.setTextColor(androidx.core.content.ContextCompat.getColor(requireContext(), R.color.text_secondary));
                moreChip.setTextSize(14f);
                moreChip.setBackgroundResource(R.drawable.bg_chip_light);
                moreChip.setPadding(24, 10, 24, 10);
                android.widget.LinearLayout.LayoutParams lp = new android.widget.LinearLayout.LayoutParams(
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
                );
                lp.setMargins(0, 0, 12, 0);
                moreChip.setLayoutParams(lp);
                skillsRow.addView(moreChip);
            }
        }
        if (skillsCard != null) {
            skillsCard.setVisibility(parsedSkills.isEmpty() ? View.GONE : View.VISIBLE);
        }
        TextView expTitle = view.findViewById(R.id.analysis_experience);
        android.widget.TextView exp = view.findViewById(R.id.analysis_experience_value);
        TextView eduTitle = view.findViewById(R.id.analysis_education);
        android.widget.TextView edu = view.findViewById(R.id.analysis_education_value);
        View overviewCard = view.findViewById(R.id.analysis_overview_card);
        TextView summaryTitle = view.findViewById(R.id.analysis_summary);
        TextView summaryValue = view.findViewById(R.id.analysis_summary_value);
        View summaryCard = view.findViewById(R.id.analysis_summary_card);
        TextView expItemsTitle = view.findViewById(R.id.analysis_experience_items);
        TextView expItemsValue = view.findViewById(R.id.analysis_experience_items_value);
        View expItemsCard = view.findViewById(R.id.analysis_experience_items_card);
        TextView skillBalanceTitle = view.findViewById(R.id.analysis_skill_balance);
        TextView balanceLabel = view.findViewById(R.id.analysis_balance_label);
        TextView balanceValue = view.findViewById(R.id.analysis_balance_value);
        TextView balanceDelta = view.findViewById(R.id.analysis_balance_delta);
        ImageView chart = view.findViewById(R.id.analysis_chart);
        TextView chartLabels = view.findViewById(R.id.analysis_chart_labels);
        View skillBalanceCard = view.findViewById(R.id.analysis_skill_balance_card);

        String experienceLevel = parsed != null
                ? extractExperienceLevelForUi(parsed, stateStore.getParsedExperience())
                : sanitizeReadableText(stateStore.getParsedExperience(), "Entry Level");
        String normalizedExpLevel = sanitizeReadableText(experienceLevel, "");
        boolean hasExperienceLevel = !normalizedExpLevel.isEmpty()
                && !"Unknown".equalsIgnoreCase(normalizedExpLevel)
                && !"Not detected".equalsIgnoreCase(normalizedExpLevel);
        if (expTitle != null) expTitle.setVisibility(hasExperienceLevel ? View.VISIBLE : View.GONE);
        if (exp != null) {
            exp.setVisibility(hasExperienceLevel ? View.VISIBLE : View.GONE);
            exp.setText(hasExperienceLevel ? normalizedExpLevel : "");
        }
        String educationUi = parsed != null
                ? extractEducationForUi(parsed, stateStore.getParsedEducation())
                : sanitizeReadableText(stateStore.getParsedEducation(), "");
        boolean hasEducation = !educationUi.isEmpty();
        if (eduTitle != null) eduTitle.setVisibility(hasEducation ? View.VISIBLE : View.GONE);
        if (edu != null) {
            edu.setVisibility(hasEducation ? View.VISIBLE : View.GONE);
            edu.setText(hasEducation ? educationUi : "");
        }
        if (overviewCard != null) {
            overviewCard.setVisibility((hasExperienceLevel || hasEducation) ? View.VISIBLE : View.GONE);
        }
        if (parsed != null && summaryTitle != null && summaryValue != null) {
            String summary = sanitizeReadableText(String.valueOf(parsed.get("summary")), "");
            boolean hasSummary = !summary.isEmpty() && !"null".equalsIgnoreCase(summary);
            if (summaryCard != null) summaryCard.setVisibility(hasSummary ? View.VISIBLE : View.GONE);
            summaryTitle.setVisibility(hasSummary ? View.VISIBLE : View.GONE);
            summaryValue.setVisibility(hasSummary ? View.VISIBLE : View.GONE);
            if (hasSummary) summaryValue.setText(summary);
        }
        if (parsed == null && summaryTitle != null && summaryValue != null) {
            if (summaryCard != null) summaryCard.setVisibility(View.GONE);
            summaryTitle.setVisibility(View.GONE);
            summaryValue.setVisibility(View.GONE);
        }
        if (expItemsTitle != null && expItemsValue != null) {
            String expItemsText = buildExperienceItemsText(parsed);
            boolean hasExpItems = !expItemsText.isEmpty();
            if (expItemsCard != null) expItemsCard.setVisibility(hasExpItems ? View.VISIBLE : View.GONE);
            expItemsTitle.setVisibility(hasExpItems ? View.VISIBLE : View.GONE);
            expItemsValue.setVisibility(hasExpItems ? View.VISIBLE : View.GONE);
            if (hasExpItems) expItemsValue.setText(expItemsText);
        }

        int quality = 0;
        String qualityLabelText = "";
        List<Integer> trendPoints = new ArrayList<>();
        Map<String, Object> qualityMap = null;
        if (parsed != null && parsed.get("profile_quality") instanceof Map) {
            qualityMap = (Map<String, Object>) parsed.get("profile_quality");
        }
        if (qualityMap != null && qualityMap.get("score") instanceof Number) {
            quality = Math.max(0, Math.min(100, ((Number) qualityMap.get("score")).intValue()));
            qualityLabelText = sanitizeReadableText(String.valueOf(qualityMap.get("label")), "");
            Object trendObj = qualityMap.get("trend_points");
            if (trendObj instanceof List) {
                for (Object point : (List<?>) trendObj) {
                    if (point instanceof Number) trendPoints.add(((Number) point).intValue());
                }
            }
        } else if (parsed != null && parsed.get("_quality_score") instanceof Number) {
            quality = Math.max(0, Math.min(100, ((Number) parsed.get("_quality_score")).intValue()));
        } else {
            quality = Math.min(95, 35 + parsedSkills.size() * 7 + (educationUi.isEmpty() ? 0 : 15));
        }
        boolean showBalance = quality > 0 && !parsedSkills.isEmpty() && (parsedSkills.size() >= 3 || hasEducation || hasExperienceLevel);
        if (skillBalanceCard != null) skillBalanceCard.setVisibility(showBalance ? View.VISIBLE : View.GONE);
        int skillBalanceViewsVisibility = showBalance ? View.VISIBLE : View.GONE;
        if (skillBalanceTitle != null) skillBalanceTitle.setVisibility(skillBalanceViewsVisibility);
        if (balanceLabel != null) balanceLabel.setVisibility(skillBalanceViewsVisibility);
        if (balanceValue != null) {
            balanceValue.setVisibility(skillBalanceViewsVisibility);
            balanceValue.setText(quality + "%");
        }
        if (balanceDelta != null) {
            balanceDelta.setVisibility(showBalance ? View.VISIBLE : View.GONE);
            if (!qualityLabelText.isEmpty()) {
                Object compsObj = qualityMap == null ? null : qualityMap.get("components");
                String compSummary = "";
                if (compsObj instanceof Map) {
                    Map<?, ?> comps = (Map<?, ?>) compsObj;
                    compSummary = "Completeness "
                            + sanitizeReadableText(String.valueOf(comps.get("completeness_score")), "")
                            + " • Credibility "
                            + sanitizeReadableText(String.valueOf(comps.get("credibility_score")), "")
                            + " • Freshness "
                            + sanitizeReadableText(String.valueOf(comps.get("freshness_score")), "");
                }
                balanceDelta.setText(compSummary.isEmpty() ? qualityLabelText : (qualityLabelText + " • " + compSummary));
            } else {
                balanceDelta.setText(quality >= 75 ? "Strong profile" : (quality >= 55 ? "Good foundation" : "Needs more detail"));
            }
        }
        if (chart != null) {
            chart.setVisibility(showBalance ? View.VISIBLE : View.GONE);
            if (showBalance) {
                List<Integer> points = trendPoints.isEmpty()
                        ? Arrays.asList(Math.max(10, quality - 20), Math.max(10, quality - 12), Math.max(10, quality - 8), Math.max(10, quality - 4), Math.max(10, quality - 2), quality)
                        : trendPoints;
                Bitmap spark = buildQualitySparkline(points, 720, 240);
                if (spark != null) {
                    chart.setImageBitmap(spark);
                    chart.setScaleType(ImageView.ScaleType.FIT_XY);
                    chart.setBackgroundColor(0xFFE9EDF3);
                }
            }
        }
        if (chartLabels != null) {
            chartLabels.setVisibility(showBalance ? View.VISIBLE : View.GONE);
            if (qualityMap != null && qualityMap.get("components") instanceof Map) {
                Map<?, ?> comps = (Map<?, ?>) qualityMap.get("components");
                chartLabels.setText("Completeness " + sanitizeReadableText(String.valueOf(comps.get("completeness_score")), "0")
                        + "   Credibility " + sanitizeReadableText(String.valueOf(comps.get("credibility_score")), "0")
                        + "   Freshness " + sanitizeReadableText(String.valueOf(comps.get("freshness_score")), "0"));
            } else {
                List<String> labels = parsedSkills.subList(0, Math.min(5, parsedSkills.size()));
                chartLabels.setText(TextUtils.join("   ", labels));
            }
        }

        View warning = view.findViewById(R.id.analysis_warning);
        if (warning != null) {
            warning.setVisibility((parsedSkills.size() < 3 || !hasEducation) ? View.VISIBLE : View.GONE);
        }
    }

    @NonNull
    private String buildExperienceItemsText(@Nullable Map<String, Object> parsed) {
        if (parsed == null) return "";
        Object raw = parsed.get("experience");
        if (!(raw instanceof List)) return "";
        List<String> lines = new ArrayList<>();
        for (Object item : (List<?>) raw) {
            if (!(item instanceof Map)) continue;
            Map<?, ?> row = (Map<?, ?>) item;
            String title = sanitizeReadableText(String.valueOf(row.get("title")), "");
            String company = sanitizeReadableText(String.valueOf(row.get("company")), "");
            String start = sanitizeReadableText(String.valueOf(row.get("start")), "");
            String end = sanitizeReadableText(String.valueOf(row.get("end")), "");
            String duration = sanitizeReadableText(String.valueOf(row.get("duration_label")), "");
            String bullets = "";
            Object b = row.get("bullets");
            if (b instanceof List && !((List<?>) b).isEmpty()) {
                bullets = sanitizeReadableText(String.valueOf(((List<?>) b).get(0)), "");
            }
            String header;
            if (!title.isEmpty() && !company.isEmpty()) header = title + " - " + company;
            else header = !title.isEmpty() ? title : company;
            if (!header.isEmpty()) lines.add("- " + header);
            String dateLine = formatExperienceDateLine(start, end, duration);
            if (!dateLine.isEmpty()) lines.add("  " + dateLine);
            if (!bullets.isEmpty()) lines.add("  " + bullets);
            if (lines.size() >= 8) break;
        }
        return TextUtils.join("\n", lines);
    }

    @NonNull
    private String formatExperienceDateLine(@NonNull String start, @NonNull String end, @NonNull String duration) {
        String left = formatMonthYearForUi(start);
        String right = formatMonthYearForUi(end);
        StringBuilder sb = new StringBuilder();
        if (!left.isEmpty() || !right.isEmpty()) {
            sb.append(left.isEmpty() ? "Start not listed" : left);
            sb.append(" - ");
            sb.append(right.isEmpty() ? "Present" : right);
        }
        if (!duration.isEmpty()) {
            if (sb.length() > 0) sb.append("  •  ");
            sb.append(duration);
        }
        return sb.toString();
    }

    @NonNull
    private String formatMonthYearForUi(@Nullable String raw) {
        String value = sanitizeReadableText(raw, "");
        if (value.isEmpty()) return "";
        if ("Present".equalsIgnoreCase(value) || "Current".equalsIgnoreCase(value)) return "Present";
        try {
            if (value.matches("\\d{1,2}/\\d{4}")) {
                String[] parts = value.split("/");
                int month = Integer.parseInt(parts[0]);
                int year = Integer.parseInt(parts[1]);
                String[] months = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
                if (month >= 1 && month <= 12) return months[month - 1] + " " + year;
            }
            if (value.matches("\\d{4}")) return value;
        } catch (Exception ignored) {
        }
        return value;
    }

    @Nullable
    private Bitmap buildQualitySparkline(@Nullable List<Integer> points, int widthPx, int heightPx) {
        if (points == null || points.size() < 2 || widthPx <= 0 || heightPx <= 0) return null;
        Bitmap bmp = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        Paint grid = new Paint(Paint.ANTI_ALIAS_FLAG);
        grid.setColor(ContextCompat.getColor(requireContext(), R.color.progress_track_light));
        grid.setStrokeWidth(2f);
        Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
        line.setColor(ContextCompat.getColor(requireContext(), R.color.primary_blue));
        line.setStrokeWidth(5f);
        line.setStyle(Paint.Style.STROKE);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setColor(0x223067F6);
        fill.setStyle(Paint.Style.FILL);
        float pad = 12f;
        float left = pad, top = pad, right = widthPx - pad, bottom = heightPx - pad;
        canvas.drawRoundRect(left, top, right, bottom, 12f, 12f, grid);
        for (int i = 1; i <= 3; i++) {
            float y = top + (bottom - top) * (i / 4f);
            canvas.drawLine(left, y, right, y, grid);
        }
        Path path = new Path();
        Path fillPath = new Path();
        for (int i = 0; i < points.size(); i++) {
            float x = left + (right - left) * (i / (float) (points.size() - 1));
            int p = Math.max(0, Math.min(100, points.get(i) == null ? 0 : points.get(i)));
            float y = bottom - (bottom - top) * (p / 100f);
            if (i == 0) {
                path.moveTo(x, y);
                fillPath.moveTo(x, bottom);
                fillPath.lineTo(x, y);
            } else {
                path.lineTo(x, y);
                fillPath.lineTo(x, y);
            }
            if (i == points.size() - 1) {
                fillPath.lineTo(x, bottom);
                fillPath.close();
            }
        }
        canvas.drawPath(fillPath, fill);
        canvas.drawPath(path, line);
        return bmp;
    }

    private void bindMatchScoreSuccess(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        CandidateOnboardingState state = stateStore.getState();
        android.widget.TextView label = view.findViewById(R.id.success_label);
        android.widget.TextView percent = view.findViewById(R.id.success_percent);
        android.widget.ProgressBar progress = view.findViewById(R.id.success_progress);
        int score = stateStore.getLastMatchScore();
        int threshold = stateStore.getLastMatchThreshold();
        if (percent != null) {
            percent.setText(score + "%");
        }
        if (progress != null) {
            progress.setProgress(score);
        }
        if (label != null && !state.selectedJobTitle.isEmpty()) {
            label.setText("Match Score - " + state.selectedJobTitle);
        }
        TextView msg = view.findViewById(R.id.success_message);
        if (msg != null) {
            if (threshold > 0) {
                msg.setText("Great fit. Your score is " + score + "% and the recruiter threshold is " + threshold + "%. Proceed to HR Round.");
            } else {
                msg.setText("Great fit! You have passed the initial screening for this role.");
            }
        }
        view.findViewById(R.id.success_close).setOnClickListener(v -> requireActivity().onBackPressed());
        view.findViewById(R.id.success_cta).setOnClickListener(v -> {
            ensureApplicationForSelectedJob(stateStore, appId -> {
                stateStore.setPipelineState(state.selectedJobId, "HR_READY");
                if (appId > 0) {
                    stateStore.clearActiveAssessmentSession();
                    activeAssessmentQuestions.clear();
                    activeAssessmentAnswers.clear();
                    ApiClient.getInstance(requireContext()).api().hrPrep(appId).enqueue(new Callback<Void>() {
                        @Override public void onResponse(Call<Void> call, Response<Void> response) { }
                        @Override public void onFailure(Call<Void> call, Throwable t) { }
                    });
                    pushHrPrepPreloader();
                } else if (isAdded()) {
                    Toast.makeText(requireContext(), "Application not found", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void bindMatchScoreFail(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        CandidateOnboardingState state = stateStore.getState();
        android.widget.TextView label = view.findViewById(R.id.fail_label);
        android.widget.TextView percent = view.findViewById(R.id.fail_percent);
        android.widget.ProgressBar progress = view.findViewById(R.id.fail_progress);
        int score = stateStore.getLastMatchScore();
        int threshold = stateStore.getLastMatchThreshold();
        if (percent != null) {
            percent.setText(score + "%");
        }
        if (progress != null) {
            progress.setProgress(score);
        }
        if (label != null && !state.selectedJobTitle.isEmpty()) {
            label.setText(state.selectedJobTitle + " criteria not met.");
        }
        TextView failInfo = view.findViewById(R.id.fail_info);
        if (failInfo != null) {
            String retryAt = stateStore.getLastMatchRetryAt();
            String retryMsg = "You can try again after 30 days.";
            if (retryAt != null && !retryAt.trim().isEmpty()) {
                retryMsg = "Retry after " + toFriendlyDateTime(retryAt) + ".";
            }
            if (threshold > 0) {
                retryMsg = "Score " + score + "% vs threshold " + threshold + "%. " + retryMsg;
            }
            failInfo.setText(retryMsg);
        }
        view.findViewById(R.id.fail_close).setOnClickListener(v -> requireActivity().onBackPressed());
        view.findViewById(R.id.fail_cta).setOnClickListener(v -> {
            stateStore.setPipelineState(state.selectedJobId, "MATCH_FAIL");
            Toast.makeText(requireContext(), "Feedback report downloaded", Toast.LENGTH_SHORT).show();
        });
    }

    private int computeMatchScore(String jobTitle, String parsedSkillsCsv) {
        List<String> parsedSkills = new ArrayList<>();
        for (String skill : parsedSkillsCsv.split(",")) {
            parsedSkills.add(skill.trim().toLowerCase());
        }
        List<String> required;
        String title = jobTitle == null ? "" : jobTitle.toLowerCase();
        if (title.contains("data")) {
            required = Arrays.asList("python", "sql", "aws", "data analysis");
        } else if (title.contains("backend")) {
            required = Arrays.asList("java", "spring", "sql", "docker");
        } else {
            required = Arrays.asList("java", "python", "react", "sql");
        }
        int overlap = 0;
        for (String req : required) {
            if (parsedSkills.contains(req.toLowerCase())) {
                overlap++;
            }
        }
        int score = (int) ((overlap / (float) required.size()) * 100f);
        return Math.max(0, Math.min(100, score));
    }

    private void fallbackLocalMatch(CandidateStateStore stateStore, String selectedJobId) {
        int score = computeMatchScore(stateStore.getState().selectedJobTitle, stateStore.getParsedSkillsCsv());
        stateStore.setLastMatchMeta(score, 70, "");
        if (score >= 70) {
            stateStore.setPipelineState(selectedJobId, "MATCH_PASS");
            pushCandidate(R.layout.fragment_match_score_success);
        } else {
            stateStore.setPipelineState(selectedJobId, "MATCH_FAIL");
            pushCandidate(R.layout.fragment_match_score_fail);
        }
    }

    private void bindCandidateApplications(View view) {
        RecyclerView recyclerView = view.findViewById(R.id.candidate_app_recycler);
        View empty = view.findViewById(R.id.candidate_app_empty);
        if (recyclerView == null || getContext() == null) {
            return;
        }
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        CandidateApplicationsAdapter adapter = new CandidateApplicationsAdapter(this::onApplicationClicked);
        recyclerView.setAdapter(adapter);

        List<CandidateApplicationsAdapter.Item> items = new ArrayList<>();
        java.util.Map<String, String> pipelineStates = stateStore.getAllPipelineStates();
        for (java.util.Map.Entry<String, String> entry : pipelineStates.entrySet()) {
            String jobId = entry.getKey();
            String title = jobId.equals(stateStore.getSelectedJobId())
                    ? stateStore.getState().selectedJobTitle
                    : "Application " + jobId.replace("job_", "").toUpperCase();
            items.add(new CandidateApplicationsAdapter.Item(
                    jobId,
                    stateStore.getApplicationIdForJob(jobId),
                    title.isEmpty() ? "Software Engineer" : title,
                    "",
                    "",
                    entry.getValue(),
                    "Local draft",
                    "",
                    null,
                    null,
                    null,
                    null,
                    null
            ));
        }

        adapter.submitList(items);
        if (empty != null) {
            empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
        }

        ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) {
                    return;
                }
                List<CandidateApplicationsAdapter.Item> remoteItems = new ArrayList<>();
                candidateApplicationsCache.clear();
                for (ApiModels.ApplicationDto dto : response.body()) {
                    String jobId = String.valueOf(dto.job);
                    candidateApplicationsCache.add(dto);
                    stateStore.setApplicationIdForJob(jobId, dto.id);
                    stateStore.setPipelineState(jobId, dto.status == null ? "APPLIED" : dto.status);
                    remoteItems.add(new CandidateApplicationsAdapter.Item(
                            jobId,
                            dto.id,
                            dto.jobTitle == null || dto.jobTitle.isEmpty() ? "Software Engineer" : dto.jobTitle,
                            safeOr(dto.company, ""),
                            safeOr(dto.location, ""),
                            dto.status == null ? "APPLIED" : dto.status,
                            dto.appliedAt == null ? "Applied" : ("Applied " + toFriendlyDateTime(dto.appliedAt)),
                            dto.lastUpdated == null ? "" : ("Updated " + toFriendlyDateTime(dto.lastUpdated)),
                            dto.matchScore,
                            dto.hrScore,
                            dto.techScore,
                            dto.nextAction,
                            dto.retryEligibleAt
                    ));
                }
                candidateActionableApplication = findFirstActionableApplication(candidateApplicationsCache);
                adapter.submitList(remoteItems);
                if (empty != null) {
                    empty.setVisibility(remoteItems.isEmpty() ? View.VISIBLE : View.GONE);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) {
                // local fallback rendered
            }
        });
    }

    private void onApplicationClicked(CandidateApplicationsAdapter.Item item) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        stateStore.setSelectedJob(item.jobId, item.title);
        stateStore.setApplicationIdForJob(item.jobId, item.applicationId);
        pushCandidate(R.layout.fragment_candidate_application_details);
    }

    private void refreshCandidateApplicationsCacheAsync() {
        if (!isAdded()) return;
        ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
            @Override public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                candidateApplicationsCache.clear();
                candidateApplicationsCache.addAll(response.body());
                candidateActionableApplication = findFirstActionableApplication(candidateApplicationsCache);
                CandidateStateStore store = new CandidateStateStore(requireContext());
                for (ApiModels.ApplicationDto dto : response.body()) {
                    String jid = String.valueOf(dto.job);
                    store.setApplicationIdForJob(jid, dto.id);
                    store.setPipelineState(jid, safeOr(dto.status, "APPLIED"));
                }
                notifyCandidateStateChanged();
            }
            @Override public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) { }
        });
    }

    private void bindCandidateApplicationDetails(View view) {
        CandidateStateStore store = new CandidateStateStore(requireContext());
        int applicationId = store.getApplicationIdForJob(store.getSelectedJobId());
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.candidate_app_details_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());
        }
        View loading = view.findViewById(R.id.candidate_app_details_loading);
        View scroll = view.findViewById(R.id.candidate_app_details_scroll);
        View empty = view.findViewById(R.id.candidate_app_details_empty);
        if (applicationId <= 0) {
            if (loading != null) loading.setVisibility(View.GONE);
            if (scroll != null) scroll.setVisibility(View.GONE);
            if (empty != null) empty.setVisibility(View.VISIBLE);
            return;
        }
        if (loading != null) loading.setVisibility(View.VISIBLE);
        if (scroll != null) scroll.setVisibility(View.GONE);
        if (empty != null) empty.setVisibility(View.GONE);
        ApiClient.getInstance(requireContext()).api().myApplicationDetail(applicationId).enqueue(new Callback<ApiModels.ApplicationDetailResponse>() {
            @Override
            public void onResponse(Call<ApiModels.ApplicationDetailResponse> call, Response<ApiModels.ApplicationDetailResponse> response) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    if (empty != null) empty.setVisibility(View.VISIBLE);
                    return;
                }
                ApiModels.ApplicationDetailResponse dto = response.body();
                mergeCandidateApplication(dto);
                notifyCandidateStateChanged();
                store.setSelectedJob(String.valueOf(dto.job), safeOr(dto.jobTitle, "Application"));
                store.setPipelineState(String.valueOf(dto.job), safeOr(dto.status, "APPLIED"));

                TextView title = view.findViewById(R.id.candidate_app_details_title);
                TextView subtitle = view.findViewById(R.id.candidate_app_details_subtitle);
                TextView statusChip = view.findViewById(R.id.candidate_app_details_status_chip);
                if (title != null) title.setText(safeOr(dto.jobTitle, "Application"));
                if (subtitle != null) {
                    String applied = dto.appliedAt == null ? "" : "Applied " + toFriendlyDateTime(dto.appliedAt);
                    String companyLoc = joinNonEmpty(" - ", safeOr(dto.company, ""), safeOr(dto.location, ""));
                    subtitle.setText(joinNonEmpty("  -  ", companyLoc, applied));
                }
                if (statusChip != null) statusChip.setText(readableApplicationStatus(dto.status));
                LinearLayout timelineContainer = view.findViewById(R.id.candidate_app_details_timeline_container);
                if (timelineContainer != null) {
                    timelineContainer.removeAllViews();
                    if (dto.timeline != null) {
                        for (ApiModels.ApplicationTimelineItem item : dto.timeline) {
                            if (shouldHideTimelineItem(dto, item)) {
                                continue;
                            }
                            View row = buildApplicationTimelineRow(timelineContainer, item);
                            timelineContainer.addView(row);
                        }
                    }
                }
                com.google.android.material.button.MaterialButton action = view.findViewById(R.id.candidate_app_details_action);
                if (action != null) {
                    String nextAction = resolveNextAction(dto);
                    String actionLabel = buildApplicationDetailsActionLabel(dto);
                    if (TextUtils.isEmpty(actionLabel) || "NONE".equals(nextAction)) {
                        action.setVisibility(View.GONE);
                    } else {
                        action.setVisibility(View.VISIBLE);
                        action.setEnabled(true);
                        action.setText(actionLabel);
                        action.setOnClickListener(v -> {
                            if ("RETRY_LATER".equals(nextAction) || "RETRY_AFTER_30_DAYS".equals(nextAction)) {
                                showRetryDetailsBottomSheet(dto);
                            } else if ("VIEW_FEEDBACK".equals(nextAction)) {
                                showApplicationFeedbackDialog(dto);
                            } else {
                                handleCandidateApplicationAction(dto);
                            }
                        });
                    }
                }
                if (scroll != null) scroll.setVisibility(View.VISIBLE);
                if (empty != null) empty.setVisibility(View.GONE);
            }

            @Override
            public void onFailure(Call<ApiModels.ApplicationDetailResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (empty != null) empty.setVisibility(View.VISIBLE);
            }
        });
    }

    private View buildApplicationTimelineRow(@NonNull ViewGroup parent, @Nullable ApiModels.ApplicationTimelineItem item) {
        android.content.Context ctx = parent.getContext();
        com.google.android.material.card.MaterialCardView card = new com.google.android.material.card.MaterialCardView(ctx);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(8);
        card.setLayoutParams(lp);
        card.setRadius(dp(14));
        card.setStrokeWidth(dp(1));
        card.setStrokeColor(ContextCompat.getColor(ctx, R.color.recruiter_stroke));
        card.setCardBackgroundColor(ContextCompat.getColor(ctx, R.color.recruiter_card));
        LinearLayout content = new LinearLayout(ctx);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(14), dp(12), dp(14), dp(12));
        card.addView(content);

        TextView head = new TextView(ctx);
        head.setTextColor(ContextCompat.getColor(ctx, R.color.text_primary));
        head.setTextSize(15);
        head.setTypeface(head.getTypeface(), android.graphics.Typeface.BOLD);
        head.setText(buildTimelineHeadline(item == null ? null : item.stage, item == null ? null : item.status));
        content.addView(head);

        StringBuilder meta = new StringBuilder();
        if (item != null && item.score != null) meta.append("Score: ").append(Math.round(item.score)).append("%");
        if (item != null && item.threshold != null) {
            if (meta.length() > 0) meta.append("  -  ");
            meta.append("Threshold ").append(item.threshold).append("%");
        }
        if (item != null && item.language != null && !item.language.trim().isEmpty()) {
            if (meta.length() > 0) meta.append("  -  ");
            meta.append(item.language);
        }
        if (item != null && item.at != null && !item.at.trim().isEmpty()) {
            if (meta.length() > 0) meta.append("  -  ");
            meta.append(toFriendlyDateTime(item.at));
        }
        if (meta.length() > 0) {
            TextView sub = new TextView(ctx);
            sub.setTextColor(ContextCompat.getColor(ctx, R.color.text_secondary));
            sub.setTextSize(13);
            sub.setPadding(0, dp(4), 0, 0);
            sub.setText(meta.toString());
            content.addView(sub);
        }

        String hint = buildTimelineHint(item);
        if (!TextUtils.isEmpty(hint)) {
            TextView hintView = new TextView(ctx);
            hintView.setTextColor(ContextCompat.getColor(ctx, R.color.text_secondary));
            hintView.setTextSize(13);
            hintView.setPadding(0, dp(6), 0, 0);
            hintView.setText(hint);
            content.addView(hintView);
        }
        return card;
    }

    private boolean shouldHideTimelineItem(@NonNull ApiModels.ApplicationDetailResponse dto, @Nullable ApiModels.ApplicationTimelineItem item) {
        if (item == null) return true;
        String stage = safeOr(item.stage, "").toUpperCase(Locale.US);
        if (!"OFFER".equals(stage)) return false;
        String itemStatus = safeOr(item.status, "").toUpperCase(Locale.US);
        String appStatus = safeOr(dto.status, "").toUpperCase(Locale.US);

        // Hide offer step unless the application is actually in the offer stage or beyond.
        if (appStatus.contains("FAIL")) return true;
        if (!(appStatus.startsWith("OFFER_") || "TECH_PASS".equals(appStatus))) return true;

        // Explicit backend non-actionable states should not be shown as timeline progress.
        return "BLOCKED".equals(itemStatus) || "NOT_READY".equals(itemStatus);
    }

    private String buildTimelineHeadline(@Nullable String stageKey, @Nullable String statusKey) {
        String stage = safeOr(stageKey, "").toUpperCase(Locale.US);
        String status = safeOr(statusKey, "").toUpperCase(Locale.US);
        if ("MATCH".equals(stage)) {
            if (status.contains("FAIL")) return "Step 1 - Match criteria not met";
            if (status.contains("PASS")) return "Step 1 - Match score cleared";
            return "Step 1 - Match score";
        }
        if ("HR".equals(stage)) {
            if (status.contains("FAIL")) return "Step 2 - HR round not cleared";
            if (status.contains("PASS")) return "Step 2 - HR round cleared";
            if (status.contains("STARTED")) return "Step 2 - HR round in progress";
            if (status.contains("READY")) return "Step 2 - HR round ready";
            return "Step 2 - HR round";
        }
        if ("TECH".equals(stage)) {
            if (status.contains("FAIL")) return "Step 3 - Technical round not cleared";
            if (status.contains("PASS")) return "Step 3 - Technical round cleared";
            if (status.contains("STARTED")) return "Step 3 - Technical round in progress";
            if (status.contains("READY")) return "Step 3 - Technical round ready";
            return "Step 3 - Technical round";
        }
        if ("OFFER".equals(stage)) {
            if (status.contains("ACCEPTED")) return "Step 4 - Offer accepted";
            if (status.contains("SENT")) return "Step 4 - Offer sent";
            if (status.contains("BLOCKED")) return "Step 4 - Offer blocked";
            if (status.contains("PENDING")) return "Step 4 - Offer pending recruiter decision";
            return "Step 4 - Offer";
        }
        return safeOr(stageKey, "Stage") + " - " + safeOr(statusKey, "Pending").replace('_', ' ');
    }

    @Nullable
    private String buildTimelineHint(@Nullable ApiModels.ApplicationTimelineItem item) {
        if (item == null) return null;
        String stage = safeOr(item.stage, "").toUpperCase(Locale.US);
        String status = safeOr(item.status, "").toUpperCase(Locale.US);
        if ("TECH".equals(stage) && status.contains("FAIL")) {
            return "Technical round was not cleared. Review your technical feedback before retrying.";
        }
        if ("HR".equals(stage) && status.contains("FAIL")) {
            return "HR round was not cleared. Review your responses before the next attempt.";
        }
        if ("MATCH".equals(stage) && status.contains("FAIL")) {
            return "Match score was below the recruiter threshold. Open retry details for next eligibility.";
        }
        if ("OFFER".equals(stage) && status.contains("BLOCKED")) {
            return "Offer stage is blocked until the required rounds are cleared.";
        }
        return null;
    }

    private void bindAutoAdvance(View view, @LayoutRes int nextLayout, long delayMillis) {
        if (autoAdvanceRunnable != null) {
            view.removeCallbacks(autoAdvanceRunnable);
        }
        autoAdvanceRunnable = () -> {
            if (!isAdded() || getView() == null) {
                return;
            }
            pushCandidate(nextLayout);
        };
        view.postDelayed(autoAdvanceRunnable, delayMillis);
    }

    private void bindFinalizingAssessment(View view) {
        android.widget.ProgressBar resume = view.findViewById(R.id.final_resume_progress);
        android.widget.ProgressBar skill = view.findViewById(R.id.final_skill_progress);
        android.widget.ProgressBar coding = view.findViewById(R.id.final_coding_progress);
        android.widget.ProgressBar comm = view.findViewById(R.id.final_comm_progress);
        View enter = view.findViewById(R.id.final_enter);
        if (enter != null) {
            setButtonEnabledAnimated(enter, false);
            enter.setOnClickListener(v -> pushCandidate(R.layout.fragment_hr_intro));
        }

        if (resume != null) resume.setProgress(0);
        if (skill != null) skill.setProgress(0);
        if (coding != null) coding.setProgress(0);
        if (comm != null) comm.setProgress(0);

        AnimatorSet set = new AnimatorSet();
        List<android.animation.Animator> animators = new ArrayList<>();
        if (resume != null) animators.add(ObjectAnimator.ofInt(resume, "progress", 0, 100));
        if (skill != null) animators.add(ObjectAnimator.ofInt(skill, "progress", 0, 100));
        if (coding != null) animators.add(ObjectAnimator.ofInt(coding, "progress", 0, 100));
        if (comm != null) animators.add(ObjectAnimator.ofInt(comm, "progress", 0, 100));
        long durationEach = 520L;
        for (android.animation.Animator animator : animators) {
            animator.setDuration(durationEach);
        }
        set.playSequentially(animators);
        set.start();
        view.postDelayed(() -> {
            if (!isAdded() || getView() == null) return;
            if (enter != null) {
                setButtonEnabledAnimated(enter, true);
            }
        }, (durationEach * animators.size()) + 80L);
    }

    private void pushAssessmentPrepPreloader(@NonNull String stage) {
        if (!(getActivity() instanceof CandidateActivity) || getContext() == null) {
            return;
        }
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        HrPrepPreloaderFragment fragment = HrPrepPreloaderFragment.newInstance(
                stateStore.getSelectedJobId(),
                "TECH".equalsIgnoreCase(stage) ? "TECH" : "HR"
        );
        ((CandidateActivity) getActivity()).pushFragment(fragment);
    }

    private void pushHrPrepPreloader() {
        pushAssessmentPrepPreloader("HR");
    }

    private void persistAssessmentStart(CandidateStateStore store, String stage, int applicationId, ApiModels.AssessmentStartResponse resp) {
        if (resp == null) return;
        activeAssessmentQuestions.clear();
        activeAssessmentAnswers.clear();
        store.setActiveAssessmentQuestionsJson("[]");
        if (resp.questions != null) {
            activeAssessmentQuestions.addAll(resp.questions);
            for (ApiModels.AssessmentQuestionDto q : resp.questions) {
                if (q != null && q.selectedOptionIndex != null) {
                    activeAssessmentAnswers.put(q.id, q.selectedOptionIndex);
                }
            }
            store.setActiveAssessmentQuestionsJson(serializeQuestionsJson(resp.questions));
        }
        store.setActiveAssessmentSession(stage, applicationId, resp.sessionId, resp.language, resp.endsAt, 0);
        store.setActiveAssessmentReviewJson("");
        store.setActiveAssessmentResultJson("");
    }

    private String serializeQuestionsJson(List<ApiModels.AssessmentQuestionDto> questions) {
        try {
            JSONArray arr = new JSONArray();
            if (questions != null) {
                for (ApiModels.AssessmentQuestionDto q : questions) {
                    if (q == null) continue;
                    JSONObject o = new JSONObject();
                    o.put("id", q.id);
                    o.put("prompt", safeOr(q.prompt, ""));
                    JSONArray opts = new JSONArray();
                    if (q.options != null) for (String opt : q.options) opts.put(opt);
                    o.put("options", opts);
                    o.put("selected_option_index", q.selectedOptionIndex == null ? JSONObject.NULL : q.selectedOptionIndex);
                    o.put("correct_option", q.correctOption == null ? JSONObject.NULL : q.correctOption);
                    o.put("is_correct", q.isCorrect == null ? JSONObject.NULL : q.isCorrect);
                    o.put("explanation", q.explanation == null ? "" : q.explanation);
                    arr.put(o);
                }
            }
            return arr.toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    private void loadActiveAssessmentQuestions(CandidateStateStore store) {
        if (!activeAssessmentQuestions.isEmpty()) return;
        String raw = store.getActiveAssessmentQuestionsJson();
        if (raw == null || raw.trim().isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                ApiModels.AssessmentQuestionDto q = new ApiModels.AssessmentQuestionDto();
                q.id = o.optInt("id");
                q.prompt = o.optString("prompt");
                List<String> opts = new ArrayList<>();
                JSONArray optsArr = o.optJSONArray("options");
                if (optsArr != null) {
                    for (int j = 0; j < optsArr.length(); j++) opts.add(optsArr.optString(j));
                }
                q.options = opts;
                if (!o.isNull("selected_option_index")) q.selectedOptionIndex = o.optInt("selected_option_index");
                if (!o.isNull("correct_option")) q.correctOption = o.optInt("correct_option");
                if (!o.isNull("is_correct")) q.isCorrect = o.optBoolean("is_correct");
                q.explanation = o.optString("explanation");
                activeAssessmentQuestions.add(q);
                if (q.selectedOptionIndex != null) activeAssessmentAnswers.put(q.id, q.selectedOptionIndex);
            }
        } catch (Exception ignored) { }
    }

    private int getActiveAssessmentCurrentIndex(CandidateStateStore store) {
        try {
            JSONObject obj = store.getActiveAssessmentSession();
            return obj == null ? 0 : Math.max(0, obj.optInt("current_index", 0));
        } catch (Exception e) {
            return 0;
        }
    }

    private void setActiveAssessmentCurrentIndex(CandidateStateStore store, int index) {
        JSONObject obj = store.getActiveAssessmentSession();
        if (obj == null) return;
        try {
            store.setActiveAssessmentSession(
                    obj.optString("stage", ""),
                    obj.optInt("application_id", 0),
                    obj.optInt("session_id", 0),
                    obj.optString("language", ""),
                    obj.optString("ends_at", ""),
                    Math.max(0, index)
            );
        } catch (Exception ignored) { }
    }

    private int getActiveAssessmentSessionId(CandidateStateStore store) {
        JSONObject obj = store.getActiveAssessmentSession();
        return obj == null ? 0 : obj.optInt("session_id", 0);
    }

    private String getActiveAssessmentStage(CandidateStateStore store) {
        JSONObject obj = store.getActiveAssessmentSession();
        return obj == null ? "" : obj.optString("stage", "");
    }

    private int getActiveAssessmentApplicationId(CandidateStateStore store) {
        JSONObject obj = store.getActiveAssessmentSession();
        return obj == null ? 0 : obj.optInt("application_id", 0);
    }

    private String getActiveAssessmentEndsAt(CandidateStateStore store) {
        JSONObject obj = store.getActiveAssessmentSession();
        return obj == null ? "" : obj.optString("ends_at", "");
    }

    private void fetchAssessmentStatusIfNeeded(CandidateStateStore store, @Nullable Runnable onReady, @Nullable Runnable onPending) {
        if (!activeAssessmentQuestions.isEmpty()) {
            if (onReady != null) onReady.run();
            return;
        }
        loadActiveAssessmentQuestions(store);
        if (!activeAssessmentQuestions.isEmpty()) {
            if (onReady != null) onReady.run();
            return;
        }
        int sessionId = getActiveAssessmentSessionId(store);
        if (sessionId <= 0) {
            if (onPending != null) onPending.run();
            return;
        }
        ApiClient.getInstance(requireContext()).api().assessmentStatus(sessionId).enqueue(new Callback<ApiModels.AssessmentStatusResponse>() {
            @Override public void onResponse(Call<ApiModels.AssessmentStatusResponse> call, Response<ApiModels.AssessmentStatusResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    persistAssessmentStart(store, response.body().stage, response.body().applicationId, response.body());
                    if (response.body().answers != null) {
                        for (ApiModels.AssessmentAnswerState a : response.body().answers) {
                            if (a != null && a.selectedOptionIndex != null) activeAssessmentAnswers.put(a.questionId, a.selectedOptionIndex);
                        }
                    }
                }
                if (!activeAssessmentQuestions.isEmpty()) {
                    if (onReady != null) onReady.run();
                } else if (onPending != null) {
                    onPending.run();
                }
            }
            @Override public void onFailure(Call<ApiModels.AssessmentStatusResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (onPending != null) onPending.run();
            }
        });
    }

    private void fetchAssessmentStatusIfNeeded(CandidateStateStore store, @Nullable Runnable onReady) {
        fetchAssessmentStatusIfNeeded(store, onReady, null);
    }

    private void bindHrIntro(View view) {
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        stateStore.setPipelineState(stateStore.getSelectedJobId(), "HR_READY");
        View startButton = view.findViewById(R.id.hr_intro_start);
        if (startButton != null) {
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) startButton.getLayoutParams();
            final int baseBottom = lp.bottomMargin;
            ViewCompat.setOnApplyWindowInsetsListener(view, (v, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                lp.bottomMargin = baseBottom + bars.bottom;
                startButton.setLayoutParams(lp);
                return insets;
            });
            ViewCompat.requestApplyInsets(view);
        }
        View close = view.findViewById(R.id.hr_intro_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        view.findViewById(R.id.hr_intro_start).setOnClickListener(v -> {
            setAssessmentStartButtonState(v, false, "Preparing questions...");
            ensureApplicationForSelectedJob(stateStore, appId -> {
                if (appId > 0) {
                    stateStore.clearActiveAssessmentSession();
                    activeAssessmentQuestions.clear();
                    activeAssessmentAnswers.clear();
                    ApiClient.getInstance(requireContext()).api().hrPrep(appId).enqueue(new Callback<Void>() {
                        @Override public void onResponse(Call<Void> call, Response<Void> response) { }
                        @Override public void onFailure(Call<Void> call, Throwable t) { }
                    });
                    pushHrPrepPreloader();
                } else if (isAdded()) {
                    setAssessmentStartButtonState(v, false, "Preparing questions...");
                    Toast.makeText(requireContext(), "Application not found", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void bindHrQuestion(View view) {
        bindDynamicAssessmentQuestion(view, true);
    }

    private void bindHrMcq(View view) {
        bindDynamicAssessmentQuestion(view, true);
    }

    private void bindHrCleared(View view) {
        View close = view.findViewById(R.id.hr_clear_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        view.findViewById(R.id.hr_clear_next).setOnClickListener(v -> {
            CandidateStateStore stateStore = new CandidateStateStore(requireContext());
            stateStore.setPipelineState(stateStore.getSelectedJobId(), "TECH_READY");
            pushCandidate(R.layout.fragment_select_technical_language);
        });
    }

    private void bindTechnicalLanguage(View view) {
        final String[] selected = {"Java"};
        List<Integer> ids = Arrays.asList(R.id.lang_python, R.id.lang_java, R.id.lang_cpp, R.id.lang_js, R.id.lang_c);
        java.util.Map<Integer, Integer> textIds = new java.util.HashMap<>();
        textIds.put(R.id.lang_python, R.id.lang_python_text);
        textIds.put(R.id.lang_java, R.id.lang_java_text);
        textIds.put(R.id.lang_cpp, R.id.lang_cpp_text);
        textIds.put(R.id.lang_js, R.id.lang_js_text);
        textIds.put(R.id.lang_c, R.id.lang_c_text);

        java.util.function.Consumer<Integer> applySelection = selectedId -> {
            for (int resetId : ids) {
                View resetCard = view.findViewById(resetId);
                if (resetCard != null) {
                    boolean isSelected = resetId == selectedId;
                    resetCard.setBackgroundResource(isSelected ? R.drawable.bg_lang_card_light : R.drawable.bg_lang_card_dark);
                    resetCard.setAlpha(1f);
                }
                Integer tId = textIds.get(resetId);
                if (tId != null) {
                    android.widget.TextView tv = view.findViewById(tId);
                    if (tv != null) {
                        tv.setTextColor(androidx.core.content.ContextCompat.getColor(
                                requireContext(),
                                resetId == selectedId ? R.color.text_primary : R.color.text_on_dark
                        ));
                    }
                }
            }
        };

        for (int id : ids) {
            View card = view.findViewById(id);
            if (card == null) {
                continue;
            }
            card.setOnClickListener(v -> {
                applySelection.accept(id);
                if (id == R.id.lang_python) {
                    selected[0] = "Python";
                } else if (id == R.id.lang_cpp) {
                    selected[0] = "C++";
                } else if (id == R.id.lang_js) {
                    selected[0] = "JavaScript";
                } else if (id == R.id.lang_c) {
                    selected[0] = "C";
                } else {
                    selected[0] = "Java";
                }
            });
        }
        applySelection.accept(R.id.lang_java);
        view.findViewById(R.id.lang_confirm).setOnClickListener(v -> {
            setAssessmentStartButtonState(v, false, "Preparing questions...");
            CandidateStateStore stateStore = new CandidateStateStore(requireContext());
            ensureApplicationForSelectedJob(stateStore, appId -> {
                if (appId > 0) {
                    stateStore.clearActiveAssessmentSession();
                    activeAssessmentQuestions.clear();
                    activeAssessmentAnswers.clear();
                    ApiModels.SelectLanguageRequest request = new ApiModels.SelectLanguageRequest();
                    request.language = selected[0];
                    ApiClient.getInstance(requireContext()).api().techSelectLanguage(appId, request).enqueue(new Callback<ApiModels.AssessmentStartResponse>() {
                        @Override
                        public void onResponse(Call<ApiModels.AssessmentStartResponse> call, Response<ApiModels.AssessmentStartResponse> response) {
                            if (!isAdded()) return;
                            if (response.isSuccessful() && response.body() != null) {
                                // tech/select-language only sets language + prepares bank on backend; do not persist question state from this payload.
                                activeAssessmentQuestions.clear();
                                activeAssessmentAnswers.clear();
                                stateStore.setActiveAssessmentQuestionsJson("[]");
                                stateStore.setActiveAssessmentReviewJson("");
                                stateStore.setActiveAssessmentResultJson("");
                                ApiClient.getInstance(requireContext()).api().techPrep(appId, request).enqueue(new Callback<Void>() {
                                    @Override public void onResponse(Call<Void> call, Response<Void> response) { }
                                    @Override public void onFailure(Call<Void> call, Throwable t) { }
                                });
                                startAssessmentWithRetry("TECH", stateStore, appId, request, v);
                            } else {
                                setAssessmentStartButtonState(v, false, "Preparing questions...");
                                Toast.makeText(requireContext(), "Preparing questions...", Toast.LENGTH_SHORT).show();
                            }
                        }

                        @Override
                        public void onFailure(Call<ApiModels.AssessmentStartResponse> call, Throwable t) {
                            if (!isAdded()) return;
                            setAssessmentStartButtonState(v, false, "Preparing questions...");
                            Toast.makeText(requireContext(), "Preparing questions...", Toast.LENGTH_SHORT).show();
                        }
                    });
                } else {
                    setAssessmentStartButtonState(v, false, "Preparing questions...");
                    Toast.makeText(requireContext(), "Application not found", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void bindTechnicalQuestion(View view) {
        bindDynamicAssessmentQuestion(view, false);
    }

    private void startAssessmentWithRetry(@NonNull String stage, @NonNull CandidateStateStore store, int appId,
                                          @Nullable ApiModels.SelectLanguageRequest techRequest, @NonNull View button) {
        if (assessmentStartInFlight && stage.equalsIgnoreCase(assessmentStartStage) && appId == assessmentStartAppId) {
            return;
        }
        assessmentStartStage = stage;
        assessmentStartAppId = appId;
        assessmentStartAttempt = 0;
        assessmentStartToastShown = false;
        cancelAssessmentStartRetry();
        assessmentStartInFlight = true;
        doAssessmentStart(stage, store, appId, techRequest, button);
    }

    private void doAssessmentStart(@NonNull String stage, @NonNull CandidateStateStore store, int appId,
                                   @Nullable ApiModels.SelectLanguageRequest techRequest, @NonNull View button) {
        Call<ApiModels.AssessmentStartResponse> call;
        if ("TECH".equalsIgnoreCase(stage)) {
            call = ApiClient.getInstance(requireContext()).api().techStart(appId);
        } else {
            call = ApiClient.getInstance(requireContext()).api().hrStart(appId);
        }
        call.enqueue(new Callback<ApiModels.AssessmentStartResponse>() {
            @Override
            public void onResponse(Call<ApiModels.AssessmentStartResponse> call, Response<ApiModels.AssessmentStartResponse> response) {
                if (!isAdded()) return;
                if ((response.code() == 200 || response.code() == 201)
                        && response.body() != null
                        && response.body().questions != null
                        && !response.body().questions.isEmpty()) {
                    assessmentStartInFlight = false;
                    cancelAssessmentStartRetry();
                    persistAssessmentStart(store, stage.toUpperCase(Locale.US), appId, response.body());
                    pushCandidate("TECH".equalsIgnoreCase(stage)
                            ? R.layout.fragment_technical_question
                            : R.layout.fragment_hr_question);
                    return;
                }

                if (response.code() == 202 || response.code() == 204 || response.code() == 409) {
                    scheduleAssessmentStartRetry(stage, store, appId, techRequest, button);
                    showAssessmentPreparingToast();
                    return;
                }

                scheduleAssessmentStartRetry(stage, store, appId, techRequest, button);
                showAssessmentPreparingToast();
            }

            @Override
            public void onFailure(Call<ApiModels.AssessmentStartResponse> call, Throwable t) {
                if (!isAdded()) return;
                scheduleAssessmentStartRetry(stage, store, appId, techRequest, button);
                showAssessmentPreparingToast();
            }
        });
    }

    private void scheduleAssessmentStartRetry(@NonNull String stage, @NonNull CandidateStateStore store, int appId,
                                              @Nullable ApiModels.SelectLanguageRequest techRequest, @NonNull View button) {
        assessmentStartAttempt++;
        long delayMs = Math.min(15000L, 2000L + (assessmentStartAttempt * 1000L));
        if (assessmentStartRetryRunnable != null) {
            assessmentStartHandler.removeCallbacks(assessmentStartRetryRunnable);
        }
        assessmentStartRetryRunnable = () -> {
            if (!isAdded()) return;
            setAssessmentStartButtonState(button, false, "Preparing questions...");
            doAssessmentStart(stage, store, appId, techRequest, button);
        };
        assessmentStartHandler.postDelayed(assessmentStartRetryRunnable, delayMs);
    }

    private void cancelAssessmentStartRetry() {
        if (assessmentStartRetryRunnable != null) {
            assessmentStartHandler.removeCallbacks(assessmentStartRetryRunnable);
            assessmentStartRetryRunnable = null;
        }
        assessmentStartInFlight = false;
    }

    private void showAssessmentPreparingToast() {
        if (assessmentStartToastShown || !isAdded()) return;
        assessmentStartToastShown = true;
        Toast.makeText(requireContext(), "Preparing questions. Please wait...", Toast.LENGTH_SHORT).show();
    }

    private void setAssessmentStartButtonState(@NonNull View button, boolean enabled, @Nullable String text) {
        button.setEnabled(enabled);
        button.setAlpha(enabled ? 1f : 0.6f);
        if (text != null && button instanceof android.widget.TextView) {
            ((android.widget.TextView) button).setText(text);
        }
    }

    private void bindDynamicAssessmentQuestion(View view, boolean hr) {
        CandidateStateStore store = new CandidateStateStore(requireContext());
        fetchAssessmentStatusIfNeeded(
                store,
                () -> renderDynamicAssessmentQuestion(view, hr, store),
                () -> pushAssessmentPrepPreloader(hr ? "HR" : "TECH")
        );
    }

    private void renderDynamicAssessmentQuestion(View view, boolean hr, CandidateStateStore store) {
        if (!isAdded()) return;
        View close = view.findViewById(hr ? R.id.hr_q_close : R.id.tech_close);
        if (close != null) close.setOnClickListener(v -> requireActivity().onBackPressed());

        if (activeAssessmentQuestions.isEmpty()) {
            Toast.makeText(requireContext(), "Preparing questions. Please wait...", Toast.LENGTH_SHORT).show();
            pushAssessmentPrepPreloader(hr ? "HR" : "TECH");
            return;
        }
        int idx = Math.min(getActiveAssessmentCurrentIndex(store), activeAssessmentQuestions.size() - 1);
        ApiModels.AssessmentQuestionDto q = activeAssessmentQuestions.get(idx);
        if (q == null) return;

        TextView counter = view.findViewById(hr ? R.id.hr_q_counter : R.id.tech_counter);
        if (counter != null) counter.setText((idx + 1) + "/" + activeAssessmentQuestions.size());
        android.widget.ProgressBar progress = view.findViewById(hr ? R.id.hr_q_progress : R.id.tech_progress);
        if (progress != null) progress.setProgress((int) (((idx + 1f) / Math.max(1, activeAssessmentQuestions.size())) * 100f));

        if (hr) {
            TextView prompt = view.findViewById(R.id.hr_q_text);
            if (prompt != null) prompt.setText(safeOr(q.prompt, "Question"));
            View image = view.findViewById(R.id.hr_q_image);
            if (image != null) image.setVisibility(View.GONE);
            bindAssessmentTimerToHr(view, store);
        } else {
            TextView title = view.findViewById(R.id.tech_question_title);
            if (title != null) title.setText("Technical Question " + (idx + 1));
            TextView prompt = view.findViewById(R.id.tech_prompt);
            if (prompt != null) prompt.setText(safeOr(q.prompt, "Question"));
            TextView code = view.findViewById(R.id.tech_code);
            if (code != null) code.setVisibility(View.GONE);
        }

        LinearLayout options = view.findViewById(hr ? R.id.hr_q_options : R.id.tech_options);
        View next = view.findViewById(hr ? R.id.hr_q_next : R.id.tech_next);
        if (next instanceof android.widget.Button) {
            ((android.widget.Button) next).setText(idx == activeAssessmentQuestions.size() - 1 ? "Submit" : "Next");
        }
        int preselected = activeAssessmentAnswers.containsKey(q.id) ? activeAssessmentAnswers.get(q.id) : -1;
        setupAssessmentOptions(options, next, q.options, preselected, selectedIndex -> {
            activeAssessmentAnswers.put(q.id, selectedIndex);
            q.selectedOptionIndex = selectedIndex;
            store.setActiveAssessmentQuestionsJson(serializeQuestionsJson(activeAssessmentQuestions));
        });

        if (next != null) {
            next.setOnClickListener(v -> {
                Integer selected = activeAssessmentAnswers.get(q.id);
                if (selected == null) {
                    Toast.makeText(requireContext(), "Select an option", Toast.LENGTH_SHORT).show();
                    return;
                }
                long spentMs = 1000L;
                int sessionId = getActiveAssessmentSessionId(store);
                ApiModels.AssessmentAnswerRequest answerReq = new ApiModels.AssessmentAnswerRequest();
                answerReq.questionId = q.id;
                answerReq.selectedOptionIndex = selected;
                answerReq.timeSpentMs = spentMs;
                ApiClient.getInstance(requireContext()).api().assessmentAnswer(sessionId, answerReq).enqueue(new Callback<ApiModels.AssessmentAnswerResponse>() {
                    @Override public void onResponse(Call<ApiModels.AssessmentAnswerResponse> call, Response<ApiModels.AssessmentAnswerResponse> response) {
                        if (!isAdded()) return;
                        if (idx < activeAssessmentQuestions.size() - 1) {
                            setActiveAssessmentCurrentIndex(store, idx + 1);
                            renderDynamicAssessmentQuestion(view, hr, store);
                        } else {
                            submitDynamicAssessment(store, hr);
                        }
                    }
                    @Override public void onFailure(Call<ApiModels.AssessmentAnswerResponse> call, Throwable t) {
                        if (!isAdded()) return;
                        Snackbar.make(view, "Network issue. Answer saved locally, retrying next step.", Snackbar.LENGTH_SHORT).show();
                        if (idx < activeAssessmentQuestions.size() - 1) {
                            setActiveAssessmentCurrentIndex(store, idx + 1);
                            renderDynamicAssessmentQuestion(view, hr, store);
                        } else {
                            submitDynamicAssessment(store, hr);
                        }
                    }
                });
            });
        }
    }

    private interface OptionSelectedCallback { void onSelected(int index); }

    private void setupAssessmentOptions(LinearLayout container, View nextButton, @Nullable List<String> optionTexts, int preselectedIndex, @Nullable OptionSelectedCallback callback) {
        if (container == null) return;
        Context context = container.getContext();
        container.removeAllViews();
        setButtonEnabledAnimated(nextButton, preselectedIndex >= 0);
        List<View> optionRows = new ArrayList<>();
        List<String> safeOptions = optionTexts == null ? Collections.emptyList() : optionTexts;
        for (int i = 0; i < safeOptions.size(); i++) {
            String txt = safeOptions.get(i);
            if (txt == null || txt.trim().isEmpty()) continue;
            View row = createAssessmentOptionRow(context, txt.trim());
            container.addView(row);
            optionRows.add(row);
            if (i < safeOptions.size() - 1) {
                Space spacer = new Space(context);
                spacer.setLayoutParams(new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        dpToPx(context, 12)
                ));
                container.addView(spacer);
            }
        }
        for (int i = 0; i < optionRows.size(); i++) {
            View row = optionRows.get(i);
            int index = i;
            row.setOnClickListener(v -> {
                for (int k = 0; k < optionRows.size(); k++) {
                    View item = optionRows.get(k);
                    item.setBackgroundResource(k == index ? R.drawable.bg_option_dark_selected : R.drawable.bg_option_dark);
                    ImageView icon = findFirstImage(item);
                    if (icon != null) icon.setImageResource(k == index ? R.drawable.ic_radio_selected : R.drawable.ic_radio_unselected);
                }
                setButtonEnabledAnimated(nextButton, true);
                if (callback != null) callback.onSelected(index);
            });
        }
        if (preselectedIndex >= 0 && preselectedIndex < optionRows.size()) {
            optionRows.get(preselectedIndex).performClick();
        } else {
            for (View item : optionRows) {
                if (item.getVisibility() == View.VISIBLE) {
                    item.setBackgroundResource(R.drawable.bg_option_dark);
                    ImageView icon = findFirstImage(item);
                    if (icon != null) icon.setImageResource(R.drawable.ic_radio_unselected);
                }
            }
        }
    }

    private View createAssessmentOptionRow(@NonNull Context context, @NonNull String text) {
        LinearLayout row = new LinearLayout(context);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setBackgroundResource(R.drawable.bg_option_dark);
        row.setPadding(dpToPx(context, 16), 0, dpToPx(context, 16), 0);
        row.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(context, 58)
        ));
        row.setClickable(true);
        row.setFocusable(true);

        TextView label = new TextView(context);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        label.setLayoutParams(labelParams);
        label.setText(text);
        label.setTextColor(ContextCompat.getColor(context, R.color.text_on_dark));
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);

        ImageView icon = new ImageView(context);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dpToPx(context, 24), dpToPx(context, 24));
        icon.setLayoutParams(iconParams);
        icon.setImageResource(R.drawable.ic_radio_unselected);

        row.addView(label);
        row.addView(icon);
        return row;
    }

    private int dpToPx(@NonNull Context context, int dp) {
        return Math.round(dp * context.getResources().getDisplayMetrics().density);
    }

    @Nullable
    private TextView findFirstText(View root) {
        if (root instanceof TextView) return (TextView) root;
        if (root instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) root;
            for (int i = 0; i < vg.getChildCount(); i++) {
                TextView tv = findFirstText(vg.getChildAt(i));
                if (tv != null) return tv;
            }
        }
        return null;
    }

    private void submitDynamicAssessment(CandidateStateStore store, boolean hr) {
        int sessionId = getActiveAssessmentSessionId(store);
        if (sessionId <= 0) return;
        ApiModels.AssessmentSubmitRequest req = new ApiModels.AssessmentSubmitRequest();
        req.responses = new ArrayList<>();
        for (ApiModels.AssessmentQuestionDto q : activeAssessmentQuestions) {
            Integer selected = activeAssessmentAnswers.get(q.id);
            if (selected == null) continue;
            ApiModels.AssessmentAnswerRequest ar = new ApiModels.AssessmentAnswerRequest();
            ar.questionId = q.id;
            ar.selectedOptionIndex = selected;
            ar.timeSpentMs = 1000L;
            req.responses.add(ar);
        }
        ApiClient.getInstance(requireContext()).api().assessmentSubmit(sessionId, req).enqueue(new Callback<ApiModels.AssessmentSubmitResult>() {
            @Override public void onResponse(Call<ApiModels.AssessmentSubmitResult> call, Response<ApiModels.AssessmentSubmitResult> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    Toast.makeText(requireContext(), "Couldn't submit assessment", Toast.LENGTH_SHORT).show();
                    return;
                }
                lastAssessmentResult = response.body();
                store.setActiveAssessmentResultJson(serializeAssessmentResultJson(response.body()));
                store.setActiveAssessmentReviewJson(store.getActiveAssessmentResultJson());
                if (response.body().pass) {
                    CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                    stateStore.setPipelineState(stateStore.getSelectedJobId(), hr ? "HR_PASS" : "TECH_PASS");
                } else {
                    CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                    stateStore.setPipelineState(stateStore.getSelectedJobId(), hr ? "HR_FAIL" : "TECH_FAIL");
                }
                refreshCandidateApplicationsCacheAsync();
                pushCandidate(R.layout.fragment_assessment_review);
            }
            @Override public void onFailure(Call<ApiModels.AssessmentSubmitResult> call, Throwable t) {
                if (!isAdded()) return;
                Toast.makeText(requireContext(), "Couldn't submit assessment", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private String serializeAssessmentResultJson(ApiModels.AssessmentSubmitResult result) {
        try {
            JSONObject obj = new JSONObject();
            obj.put("score", result.score);
            obj.put("pass", result.pass);
            obj.put("threshold", result.threshold);
            JSONArray review = new JSONArray();
            if (result.review != null) {
                for (ApiModels.AssessmentReviewItem item : result.review) {
                    JSONObject r = new JSONObject();
                    r.put("question_id", item.questionId);
                    r.put("prompt", safeOr(item.prompt, ""));
                    JSONArray opts = new JSONArray();
                    if (item.options != null) for (String opt : item.options) opts.put(opt);
                    r.put("options", opts);
                    r.put("selected_option", item.selectedOption == null ? JSONObject.NULL : item.selectedOption);
                    r.put("correct_option", item.correctOption == null ? JSONObject.NULL : item.correctOption);
                    r.put("is_correct", item.isCorrect);
                    r.put("explanation", safeOr(item.explanation, ""));
                    review.put(r);
                }
            }
            obj.put("review", review);
            return obj.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void bindAssessmentTimerToHr(View view, CandidateStateStore store) {
        if (assessmentCountdown != null) {
            assessmentCountdown.cancel();
            assessmentCountdown = null;
        }
        String endsAt = getActiveAssessmentEndsAt(store);
        long endsMs = parseBackendDate(endsAt);
        if (endsMs <= 0) return;
        List<TextView> timerValues = new ArrayList<>();
        List<TextView> allTextViews = new ArrayList<>();
        collectTextViews((ViewGroup) view.findViewById(R.id.hr_q_timer_row), allTextViews);
        for (TextView tv : allTextViews) {
            String t = String.valueOf(tv.getText());
            if (t.matches("\\d{2}")) timerValues.add(tv);
        }
        if (timerValues.size() < 2) return;
        final TextView minTv = timerValues.get(0);
        final TextView secTv = timerValues.get(1);
        long remain = Math.max(0L, endsMs - System.currentTimeMillis());
        assessmentCountdown = new CountDownTimer(remain, 1000L) {
            @Override public void onTick(long millisUntilFinished) {
                long sec = Math.max(0L, millisUntilFinished / 1000L);
                long mins = sec / 60L;
                long secs = sec % 60L;
                minTv.setText(String.format(Locale.US, "%02d", mins));
                secTv.setText(String.format(Locale.US, "%02d", secs));
            }
            @Override public void onFinish() {
                minTv.setText("00");
                secTv.setText("00");
            }
        };
        assessmentCountdown.start();
    }

    private void collectTextViews(@Nullable ViewGroup root, List<TextView> out) {
        if (root == null) return;
        for (int i = 0; i < root.getChildCount(); i++) {
            View child = root.getChildAt(i);
            if (child instanceof TextView) out.add((TextView) child);
            else if (child instanceof ViewGroup) collectTextViews((ViewGroup) child, out);
        }
    }

    private void bindAssessmentReview(View view) {
        CandidateStateStore store = new CandidateStateStore(requireContext());
        String stage = getActiveAssessmentStage(store);
        View close = view.findViewById(R.id.assessment_review_close);
        TextView summary = view.findViewById(R.id.assessment_review_summary);
        RecyclerView reviewList = view.findViewById(R.id.assessment_review_list);
        android.widget.Button continueButton = view.findViewById(R.id.assessment_review_continue);
        AssessmentReviewAdapter reviewAdapter = null;
        if (reviewList != null) {
            reviewAdapter = new AssessmentReviewAdapter();
            reviewList.setAdapter(reviewAdapter);
        }

        final boolean[] passedRef = new boolean[]{false};
        String raw = store.getActiveAssessmentResultJson();
        if (raw == null || raw.trim().isEmpty()) {
            if (summary != null) summary.setText("No review data available.");
            if (continueButton != null) {
                continueButton.setText("Back to Applications");
                continueButton.setOnClickListener(v -> exitAssessmentReview(store, false, stage));
            }
            if (close != null) close.setOnClickListener(v -> exitAssessmentReview(store, false, stage));
            return;
        }

        try {
            JSONObject obj = new JSONObject(raw);
            float score = (float) obj.optDouble("score", 0d);
            int threshold = obj.optInt("threshold", stage.equals("HR") ? 60 : 70);
            boolean passed = obj.optBoolean("pass", false);
            passedRef[0] = passed;
            if (summary != null) {
                summary.setText("Score " + Math.round(score) + "% - Threshold " + threshold + "% - " + (passed ? "Passed" : "Failed"));
                summary.setTextColor(ContextCompat.getColor(requireContext(), passed ? R.color.soft_green : R.color.danger_red));
            }
            JSONArray review = obj.optJSONArray("review");
            if (reviewAdapter != null && review != null) {
                List<JSONObject> rows = new ArrayList<>();
                for (int i = 0; i < review.length(); i++) {
                    JSONObject r = review.optJSONObject(i);
                    if (r == null) continue;
                    rows.add(r);
                }
                reviewAdapter.submit(rows);
            }
        } catch (Exception e) {
            if (summary != null) summary.setText("Couldn't load review.");
        }

        if (continueButton != null) {
            continueButton.setText(passedRef[0] ? "Continue" : "Back to Applications");
            continueButton.setOnClickListener(v -> {
                if (passedRef[0]) {
                    continueAfterPassedAssessment(store, stage);
                } else {
                    exitAssessmentReview(store, false, stage);
                }
            });
        }
        if (close != null) {
            close.setOnClickListener(v -> exitAssessmentReview(store, passedRef[0], stage));
        }
    }

    private View buildAssessmentReviewCard(int index, @NonNull JSONObject reviewItem) {
        final float density = requireContext().getResources().getDisplayMetrics().density;
        boolean isCorrect = reviewItem.optBoolean("is_correct", false);
        LinearLayout card = new LinearLayout(requireContext());
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(isCorrect ? R.drawable.bg_option_dark_selected : R.drawable.bg_option_dark);
        int pad = (int) (12 * density);
        card.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.bottomMargin = (int) (10 * density);
        card.setLayoutParams(lp);

        String prompt = reviewItem.optString("prompt", "Question");
        JSONArray options = reviewItem.optJSONArray("options");
        int selected = reviewItem.optInt("selected_option", -1);
        int correct = reviewItem.optInt("correct_option", -1);
        String selectedTxt = (options != null && selected >= 0 && selected < options.length()) ? options.optString(selected) : "Not answered";
        String correctTxt = (options != null && correct >= 0 && correct < options.length()) ? options.optString(correct) : "Not available";
        String explanation = reviewItem.optString("explanation", "");

        TextView promptView = new TextView(requireContext());
        promptView.setText(index + ". " + prompt);
        promptView.setTextSize(15f);
        promptView.setTypeface(promptView.getTypeface(), android.graphics.Typeface.BOLD);
        promptView.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_on_dark));
        promptView.setLineSpacing(0f, 1.1f);
        card.addView(promptView);

        TextView selectedView = new TextView(requireContext());
        selectedView.setText("Selected: " + selectedTxt);
        selectedView.setTextSize(13f);
        selectedView.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_muted_on_dark));
        selectedView.setPadding(0, (int) (8 * density), 0, 0);
        card.addView(selectedView);

        TextView correctView = new TextView(requireContext());
        correctView.setText("Correct: " + correctTxt);
        correctView.setTextSize(13f);
        correctView.setTextColor(ContextCompat.getColor(requireContext(), isCorrect ? R.color.soft_green : R.color.danger_red));
        correctView.setPadding(0, (int) (4 * density), 0, 0);
        card.addView(correctView);

        if (!explanation.trim().isEmpty()) {
            TextView whyView = new TextView(requireContext());
            whyView.setText("Why: " + explanation.trim());
            whyView.setTextSize(13f);
            whyView.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_muted_on_dark));
            whyView.setLineSpacing(0f, 1.1f);
            whyView.setPadding(0, (int) (6 * density), 0, 0);
            card.addView(whyView);
        }
        return card;
    }

    private final class AssessmentReviewAdapter extends RecyclerView.Adapter<AssessmentReviewAdapter.Holder> {
        private final List<JSONObject> items = new ArrayList<>();

        void submit(@NonNull List<JSONObject> rows) {
            items.clear();
            items.addAll(rows);
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            FrameLayout host = new FrameLayout(parent.getContext());
            host.setLayoutParams(new RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            return new Holder(host);
        }

        @Override
        public void onBindViewHolder(@NonNull Holder holder, int position) {
            holder.host.removeAllViews();
            View card = buildAssessmentReviewCard(position + 1, items.get(position));
            RecyclerView.LayoutParams params = new RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            int marginBottom = (int) (10 * requireContext().getResources().getDisplayMetrics().density);
            params.bottomMargin = marginBottom;
            card.setLayoutParams(params);
            holder.host.addView(card);
        }

        @Override
        public int getItemCount() {
            return items.size();
        }

        final class Holder extends RecyclerView.ViewHolder {
            final FrameLayout host;
            Holder(@NonNull FrameLayout itemView) {
                super(itemView);
                this.host = itemView;
            }
        }
    }

    private void exitAssessmentReview(@NonNull CandidateStateStore store, boolean passed, @NonNull String stage) {
        if (!passed) {
            store.clearActiveAssessmentSession();
            openCandidateTab(R.id.nav_applications);
            return;
        }
        continueAfterPassedAssessment(store, stage);
    }

    private void continueAfterPassedAssessment(@NonNull CandidateStateStore store, @NonNull String stage) {
        int appId = getActiveAssessmentApplicationId(store);
        if (appId <= 0) {
            appId = store.getApplicationIdForJob(store.getSelectedJobId());
        }
        if (appId <= 0) {
            routeAfterPassedAssessment(store, stage, null);
            return;
        }
        ApiClient.getInstance(requireContext()).api().myApplicationDetail(appId).enqueue(new Callback<ApiModels.ApplicationDetailResponse>() {
            @Override public void onResponse(Call<ApiModels.ApplicationDetailResponse> call, Response<ApiModels.ApplicationDetailResponse> response) {
                if (!isAdded()) return;
                routeAfterPassedAssessment(store, stage, response.isSuccessful() ? response.body() : null);
            }

            @Override public void onFailure(Call<ApiModels.ApplicationDetailResponse> call, Throwable t) {
                if (!isAdded()) return;
                routeAfterPassedAssessment(store, stage, null);
            }
        });
    }

    private void routeAfterPassedAssessment(@NonNull CandidateStateStore store, @NonNull String stage,
                                            @Nullable ApiModels.ApplicationDetailResponse dto) {
        String backendStatus = dto == null ? "" : safeOr(dto.status, "");
        if (!backendStatus.isEmpty()) {
            store.setPipelineState(store.getSelectedJobId(), backendStatus);
        }
        if ("HR".equalsIgnoreCase(stage)) {
            store.clearActiveAssessmentSession();
            activeAssessmentQuestions.clear();
            activeAssessmentAnswers.clear();
            if ("TECH_READY".equalsIgnoreCase(backendStatus)
                    || "TECH_STARTED".equalsIgnoreCase(backendStatus)
                    || "HR_PASS".equalsIgnoreCase(backendStatus)
                    || backendStatus.isEmpty()) {
                pushCandidate(R.layout.fragment_hr_round_cleared);
                return;
            }
        }
        store.clearActiveAssessmentSession();
        pushCandidate(R.layout.fragment_synth_results);
    }

    private interface IntResultCallback { void onResult(int value); }

    private void ensureApplicationForSelectedJob(CandidateStateStore stateStore, @NonNull IntResultCallback callback) {
        String selectedJobId = stateStore.getSelectedJobId();
        int existing = stateStore.getApplicationIdForJob(selectedJobId);
        if (existing > 0) {
            callback.onResult(existing);
            return;
        }
        int backendJobId = parseBackendId(selectedJobId);
        if (backendJobId <= 0) {
            callback.onResult(0);
            return;
        }
        ApiModels.ApplyRequest req = new ApiModels.ApplyRequest();
        req.jobId = backendJobId;
        ApiClient.getInstance(requireContext()).api().apply(req).enqueue(new Callback<ApiModels.ApplicationDto>() {
            @Override public void onResponse(Call<ApiModels.ApplicationDto> call, Response<ApiModels.ApplicationDto> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    stateStore.setApplicationIdForJob(selectedJobId, response.body().id);
                    callback.onResult(response.body().id);
                    return;
                }
                ApiClient.getInstance(requireContext()).api().myApplications().enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
                    @Override public void onResponse(Call<List<ApiModels.ApplicationDto>> call2, Response<List<ApiModels.ApplicationDto>> response2) {
                        if (!isAdded()) return;
                        if (response2.isSuccessful() && response2.body() != null) {
                            for (ApiModels.ApplicationDto dto : response2.body()) {
                                if (dto != null && dto.job == backendJobId) {
                                    stateStore.setApplicationIdForJob(selectedJobId, dto.id);
                                    callback.onResult(dto.id);
                                    return;
                                }
                            }
                        }
                        callback.onResult(0);
                    }
                    @Override public void onFailure(Call<List<ApiModels.ApplicationDto>> call2, Throwable t) {
                        if (!isAdded()) return;
                        callback.onResult(0);
                    }
                });
            }
            @Override public void onFailure(Call<ApiModels.ApplicationDto> call, Throwable t) {
                if (!isAdded()) return;
                callback.onResult(0);
            }
        });
    }

    private void bindSynthResults(View view) {
        android.widget.ProgressBar progress = view.findViewById(R.id.synth_progress);
        if (progress != null) {
            progress.setProgress(0);
            ObjectAnimator anim = ObjectAnimator.ofInt(progress, "progress", 0, 100);
            anim.setDuration(1800L);
            anim.start();
        }
        bindAutoAdvance(view, R.layout.fragment_final_score, 1900L);
    }

    private void bindFinalScore(View view) {
        CandidateStateStore store = new CandidateStateStore(requireContext());
        String fullName = store.getCandidateDisplayName();
        String first = firstName(fullName);
        String selectedJobTitle = safeOr(store.getState().selectedJobTitle, "this role");
        TextView heading = view.findViewById(R.id.final_score_heading);
        TextView body = view.findViewById(R.id.final_score_body);
        if (heading != null) {
            heading.setText("You did it, " + (first.isEmpty() ? "Candidate" : first) + "!");
        }
        if (body != null) {
            body.setText("Your performance exceeded the benchmark for " + selectedJobTitle + ". A formal offer is ready for you.");
        }
        view.findViewById(R.id.final_score_cta).setOnClickListener(v -> pushCandidate(R.layout.fragment_offer_letter));
        View root = getView();
        if (root != null) {
            refreshCandidateStateFromBackend(root, () -> {
                if (!isAdded() || getView() != view) return;
                CandidateStateStore refreshed = new CandidateStateStore(requireContext());
                String refreshedFirst = firstName(refreshed.getCandidateDisplayName());
                if (heading != null) heading.setText("You did it, " + (refreshedFirst.isEmpty() ? "Candidate" : refreshedFirst) + "!");
            });
        }
    }

    private void setupInteractiveOptions(LinearLayout container, View nextButton) {
        if (container == null) {
            return;
        }
        setButtonEnabledAnimated(nextButton, false);
        List<View> rows = new ArrayList<>();
        for (int i = 0; i < container.getChildCount(); i++) {
            View child = container.getChildAt(i);
            if (child instanceof LinearLayout) {
                rows.add(child);
            }
        }
        for (View row : rows) {
            row.setBackgroundResource(R.drawable.bg_option_dark);
            ImageView initialIcon = findFirstImage(row);
            if (initialIcon != null) {
                initialIcon.setImageResource(R.drawable.ic_radio_unselected);
            }
            row.setClickable(true);
            row.setFocusable(true);
            row.setOnClickListener(v -> {
                for (View option : rows) {
                    option.setBackgroundResource(R.drawable.bg_option_dark);
                    ImageView icon = findFirstImage(option);
                    if (icon != null) {
                        icon.setImageResource(R.drawable.ic_radio_unselected);
                    }
                }
                v.setBackgroundResource(R.drawable.bg_option_dark_selected);
                ImageView icon = findFirstImage(v);
                if (icon != null) {
                    icon.setImageResource(R.drawable.ic_radio_selected);
                }
                v.animate().scaleX(0.99f).scaleY(0.99f).setDuration(70).withEndAction(() ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(90).start()).start();
                setButtonEnabledAnimated(nextButton, true);
            });
        }
    }

    private void setButtonEnabledAnimated(View button, boolean enabled) {
        if (button == null) {
            return;
        }
        button.setEnabled(enabled);
        float targetAlpha = enabled ? 1f : 0.55f;
        float targetScale = enabled ? 1f : 0.985f;
        button.animate()
                .alpha(targetAlpha)
                .scaleX(targetScale)
                .scaleY(targetScale)
                .setDuration(140)
                .start();
    }

    private ImageView findFirstImage(View parent) {
        if (parent instanceof ImageView) {
            return (ImageView) parent;
        }
        if (!(parent instanceof ViewGroup)) {
            return null;
        }
        ViewGroup group = (ViewGroup) parent;
        for (int i = 0; i < group.getChildCount(); i++) {
            ImageView child = findFirstImage(group.getChildAt(i));
            if (child != null) {
                return child;
            }
        }
        return null;
    }

    private void bindOfferLetter(View view) {
        TextView offerBody = view.findViewById(R.id.offer_body);
        final String[] companyHolder = {""};
        Runnable renderOfferBody = () -> {
            if (!isAdded()) return;
            CandidateStateStore stateStore = new CandidateStateStore(requireContext());
            String first = firstName(stateStore.getCandidateDisplayName());
            String full = stateStore.getCandidateDisplayName();
            String role = safeOr(stateStore.getState().selectedJobTitle, "Software Engineer");
            String company = safeOr(companyHolder[0], "our team");
            if (offerBody != null) {
                String closing = stateStore.getLastMatchScore() > 0
                        ? "We look forward to discussing the next steps and compensation details with you."
                        : "We look forward to welcoming you to the team.";
                offerBody.setText(
                        "Dear " + (full == null || full.trim().isEmpty() ? (first.isEmpty() ? "Candidate" : first) : full)
                                + ",\n\nWe are thrilled to offer you the position of " + role + " at " + company + ". "
                                + "Your performance across the assessment stages reflects strong alignment with our hiring criteria. "
                                + closing
                );
            }
        };
        renderOfferBody.run();
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        int appId = stateStore.getApplicationIdForJob(stateStore.getSelectedJobId());
        if (appId > 0) {
            ApiClient.getInstance(requireContext()).api().myApplicationDetail(appId).enqueue(new Callback<ApiModels.ApplicationDetailResponse>() {
                @Override public void onResponse(Call<ApiModels.ApplicationDetailResponse> call, Response<ApiModels.ApplicationDetailResponse> response) {
                    if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                    ApiModels.ApplicationDetailResponse dto = response.body();
                    companyHolder[0] = safeOr(dto.company, "");
                    if (dto.jobTitle != null && !dto.jobTitle.trim().isEmpty()) {
                        new CandidateStateStore(requireContext()).setSelectedJob(String.valueOf(dto.job), dto.jobTitle);
                    }
                    renderOfferBody.run();
                }
                @Override public void onFailure(Call<ApiModels.ApplicationDetailResponse> call, Throwable t) { }
            });
        }
        View root = getView();
        if (root != null) {
            refreshCandidateStateFromBackend(root, renderOfferBody);
        }
        View close = view.findViewById(R.id.offer_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        view.findViewById(R.id.offer_sign).setOnClickListener(v -> {
            CandidateStateStore signStateStore = new CandidateStateStore(requireContext());
            signStateStore.setPipelineState(signStateStore.getSelectedJobId(), "OFFER_SENT");
            int signAppId = signStateStore.getApplicationIdForJob(signStateStore.getSelectedJobId());
            if (signAppId > 0) {
                ApiClient.getInstance(requireContext()).api().getOffer(signAppId).enqueue(new Callback<ApiModels.OfferDto>() {
                    @Override
                    public void onResponse(Call<ApiModels.OfferDto> call, Response<ApiModels.OfferDto> response) { }

                    @Override
                    public void onFailure(Call<ApiModels.OfferDto> call, Throwable t) { }
                });
            }
            pushCandidate(R.layout.fragment_e_signature);
        });
    }

    private void bindESignature(View view) {
        View close = view.findViewById(R.id.sign_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        SignaturePadView signaturePad = view.findViewById(R.id.sign_pad_canvas);
        View signatureHint = view.findViewById(R.id.sign_pad_hint);
        View clear = view.findViewById(R.id.sign_clear);
        View undo = view.findViewById(R.id.sign_undo);
        android.widget.CheckBox terms = view.findViewById(R.id.sign_terms_checkbox);
        View accept = view.findViewById(R.id.sign_accept);

        if (signaturePad != null) {
            signaturePad.setOnSignedStateChangeListener(isSigned -> {
                if (signatureHint != null) {
                    signatureHint.setVisibility(isSigned ? View.GONE : View.VISIBLE);
                }
                boolean acceptedTerms = terms != null && terms.isChecked();
                setButtonEnabledAnimated(accept, isSigned && acceptedTerms);
            });
        }
        if (clear != null) {
            clear.setOnClickListener(v -> {
                if (signaturePad != null) {
                    signaturePad.clearSignature();
                }
            });
        }
        if (undo != null) {
            undo.setOnClickListener(v -> {
                if (signaturePad != null) {
                    signaturePad.undoLastStroke();
                }
            });
        }
        if (terms != null) {
            terms.setOnCheckedChangeListener((buttonView, isChecked) -> {
                boolean isSigned = signaturePad != null && signaturePad.hasSignature();
                setButtonEnabledAnimated(accept, isSigned && isChecked);
            });
        }

        setButtonEnabledAnimated(accept, false);
        if (accept != null) {
            accept.setOnClickListener(v -> {
                boolean acceptedTerms = terms != null && terms.isChecked();
                boolean hasSignature = signaturePad != null && signaturePad.hasSignature();
                if (!hasSignature) {
                    Toast.makeText(requireContext(), "Please draw your signature", Toast.LENGTH_SHORT).show();
                    return;
                }
                if (!acceptedTerms) {
                    Toast.makeText(requireContext(), "Please accept terms to continue", Toast.LENGTH_SHORT).show();
                    return;
                }
                CandidateStateStore stateStore = new CandidateStateStore(requireContext());
                int appId = stateStore.getApplicationIdForJob(stateStore.getSelectedJobId());
                if (appId <= 0) {
                    Toast.makeText(requireContext(), "Application not found", Toast.LENGTH_SHORT).show();
                    return;
                }
                setButtonEnabledAnimated(accept, false);
                ApiModels.SignOfferRequest signRequest = new ApiModels.SignOfferRequest();
                signRequest.acceptedTerms = true;
                signRequest.signatureImageUrl = buildSignatureDataUrl(signaturePad);
                ApiClient.getInstance(requireContext()).api().signOffer(appId, signRequest).enqueue(new Callback<ApiModels.OfferDto>() {
                    @Override
                    public void onResponse(Call<ApiModels.OfferDto> call, Response<ApiModels.OfferDto> response) {
                        if (!isAdded() || !response.isSuccessful()) {
                            setButtonEnabledAnimated(accept, true);
                            Toast.makeText(requireContext(), "Unable to sign offer", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        ApiModels.AcceptOfferRequest acceptRequest = new ApiModels.AcceptOfferRequest();
                        ApiClient.getInstance(requireContext()).api().acceptOffer(appId, acceptRequest).enqueue(new Callback<ApiModels.OfferDto>() {
                            @Override
                            public void onResponse(Call<ApiModels.OfferDto> call, Response<ApiModels.OfferDto> response) {
                                if (!isAdded()) return;
                                setButtonEnabledAnimated(accept, true);
                                if (response.isSuccessful() && response.body() != null) {
                                    stateStore.setPipelineState(stateStore.getSelectedJobId(), "OFFER_ACCEPTED");
                                    stateStore.clearActiveAssessmentSession();
                                    cacheLatestOffer(response.body());
                                    refreshCandidateApplicationsCacheAsync();
                                    notifyCandidateStateChanged();
                                    pushCandidate(R.layout.fragment_offer_accepted);
                                } else {
                                    Toast.makeText(requireContext(), "Offer acceptance failed", Toast.LENGTH_SHORT).show();
                                }
                            }

                            @Override
                            public void onFailure(Call<ApiModels.OfferDto> call, Throwable t) {
                                if (!isAdded()) return;
                                setButtonEnabledAnimated(accept, true);
                                Toast.makeText(requireContext(), "Offer acceptance failed", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }

                    @Override
                    public void onFailure(Call<ApiModels.OfferDto> call, Throwable t) {
                        if (!isAdded()) return;
                        setButtonEnabledAnimated(accept, true);
                        Toast.makeText(requireContext(), "Unable to sign offer", Toast.LENGTH_SHORT).show();
                    }
                });
            });
        }
    }

    private void bindOfferAccepted(View view) {
        CandidateStateStore store = new CandidateStateStore(requireContext());
        TextView heading = view.findViewById(R.id.accepted_heading);
        TextView body = view.findViewById(R.id.accepted_body);
        Runnable renderAcceptedCopy = () -> {
            CandidateStateStore latest = new CandidateStateStore(requireContext());
            String first = firstName(latest.getCandidateDisplayName());
            if (heading != null) {
                heading.setText("Offer accepted, " + (first.isEmpty() ? "Candidate" : first) + ".");
            }
            if (body != null) {
                String role = safeOr(latest.getState().selectedJobTitle, "your role");
                body.setText("Your acceptance for " + role + " has been recorded. Download your signed offer letter PDF for records, then return to the dashboard to track onboarding updates.");
            }
        };
        renderAcceptedCopy.run();
        final ApiModels.OfferDto[] latestOffer = new ApiModels.OfferDto[]{getCachedLatestOffer()};
        int appId = store.getApplicationIdForJob(store.getSelectedJobId());
        if (appId > 0) {
            ApiClient.getInstance(requireContext()).api().getOffer(appId).enqueue(new Callback<ApiModels.OfferDto>() {
                @Override public void onResponse(Call<ApiModels.OfferDto> call, Response<ApiModels.OfferDto> response) {
                    if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                    latestOffer[0] = response.body();
                    cacheLatestOffer(response.body());
                }
                @Override public void onFailure(Call<ApiModels.OfferDto> call, Throwable t) { }
            });
        }
        View close = view.findViewById(R.id.accepted_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        TextView acceptedTitle = view.findViewById(R.id.accepted_title);
        if (acceptedTitle != null) acceptedTitle.setText("Offer Finalized");
        View downloadBtn = view.findViewById(R.id.accepted_download);
        if (downloadBtn instanceof android.widget.Button) {
            ((android.widget.Button) downloadBtn).setText("Download Signed Offer Letter");
        }
        view.findViewById(R.id.accepted_download).setOnClickListener(v -> {
            ApiModels.OfferDto offer = latestOffer[0];
            if (offer == null) {
                Toast.makeText(requireContext(), "Fetching offer file...", Toast.LENGTH_SHORT).show();
                return;
            }
            String downloadUrl = !TextUtils.isEmpty(offer.signedPdfUrl) ? offer.signedPdfUrl : offer.offerPdfUrl;
            if (TextUtils.isEmpty(downloadUrl)) {
                Toast.makeText(requireContext(), "Offer PDF not available yet", Toast.LENGTH_SHORT).show();
                return;
            }
            String candidateName = safeOr(store.getCandidateDisplayName(), "Candidate");
            String role = safeOr(store.getState().selectedJobTitle, "Role");
            String filename = sanitizeFilenameForDownload("OfferLetter_" + candidateName + "_" + role + "_Signed.pdf");
            downloadOfferPdfAuthenticated(downloadUrl, filename);
        });
        view.findViewById(R.id.accepted_dashboard).setOnClickListener(v -> {
            openCandidateTab(R.id.nav_home);
        });
        if (view.findViewById(R.id.accepted_dashboard) instanceof android.widget.Button) {
            ((android.widget.Button) view.findViewById(R.id.accepted_dashboard)).setText("Return to Dashboard");
        }
        refreshCandidateStateFromBackend(view, renderAcceptedCopy);
    }

    private String buildSignatureDataUrl(@Nullable SignaturePadView signaturePad) {
        if (signaturePad == null) return "signed_locally";
        try {
            Bitmap bmp = signaturePad.exportSignatureBitmap();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
            String b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            return "data:image/png;base64," + b64;
        } catch (Exception ignored) {
            return "signed_locally";
        }
    }

    private void cacheLatestOffer(@Nullable ApiModels.OfferDto offer) {
        if (offer == null || getContext() == null) return;
        try {
            JSONObject json = new JSONObject();
            json.put("id", offer.id);
            json.put("application", offer.application);
            json.put("status", offer.status);
            json.put("offer_pdf_url", offer.offerPdfUrl);
            json.put("signed_pdf_url", offer.signedPdfUrl);
            requireContext().getSharedPreferences(CANDIDATE_UI_PREFS, android.content.Context.MODE_PRIVATE)
                    .edit().putString("candidate_latest_offer", json.toString()).apply();
        } catch (Exception ignored) { }
    }

    @Nullable
    private ApiModels.OfferDto getCachedLatestOffer() {
        try {
            String raw = requireContext().getSharedPreferences(CANDIDATE_UI_PREFS, android.content.Context.MODE_PRIVATE)
                    .getString("candidate_latest_offer", null);
            if (TextUtils.isEmpty(raw)) return null;
            JSONObject json = new JSONObject(raw);
            ApiModels.OfferDto dto = new ApiModels.OfferDto();
            dto.id = json.optInt("id");
            dto.application = json.optInt("application");
            dto.status = json.optString("status", null);
            dto.offerPdfUrl = json.optString("offer_pdf_url", null);
            dto.signedPdfUrl = json.optString("signed_pdf_url", null);
            return dto;
        } catch (Exception ignored) {
            return null;
        }
    }

    private void downloadOfferPdfAuthenticated(@NonNull String url, @NonNull String fileName) {
        Toast.makeText(requireContext(), "Downloading offer letter...", Toast.LENGTH_SHORT).show();
        ApiClient.getInstance(requireContext()).api().downloadFile(url).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (!isAdded()) return;
                ResponseBody body = response.body();
                if (!response.isSuccessful() || body == null) {
                    Toast.makeText(requireContext(), "Download failed", Toast.LENGTH_SHORT).show();
                    return;
                }
                new Thread(() -> {
                    boolean saved = savePdfToDownloads(fileName, body);
                    if (!isAdded()) return;
                    requireActivity().runOnUiThread(() ->
                            Toast.makeText(requireContext(),
                                    saved ? "Offer letter saved to Downloads" : "Saving file failed",
                                    Toast.LENGTH_SHORT).show()
                    );
                }).start();
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                if (!isAdded()) return;
                Toast.makeText(requireContext(), "Download failed", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean savePdfToDownloads(@NonNull String fileName, @NonNull ResponseBody body) {
        try (InputStream input = body.byteStream()) {
            OutputStream output;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = requireContext().getContentResolver()
                        .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return false;
                output = requireContext().getContentResolver().openOutputStream(uri);
                if (output == null) return false;
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (downloadsDir != null && !downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File outFile = new File(downloadsDir, fileName);
                output = new FileOutputStream(outFile);
            }
            try (OutputStream out = output) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                out.flush();
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }

    private String sanitizeFilenameForDownload(@NonNull String fileName) {
        String sanitized = fileName.replaceAll("[\\\\/:*?\"<>|]+", "_").replaceAll("\\s+", "_");
        return sanitized.length() > 120 ? sanitized.substring(0, 120) : sanitized;
    }

    private void bindRecruiterDashboard(View view) {
        RecyclerView list = view.findViewById(R.id.recruiter_dashboard_activity_list);
        if (list == null) {
            return;
        }
        ActivityAdapter adapter = new ActivityAdapter();
        adapter.submitList(new ArrayList<>());
        list.setAdapter(adapter);
        View loading = view.findViewById(R.id.recruiter_dashboard_activity_loading);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        showStatePanel(view, R.id.recruiter_dashboard_activity_state, false, 0, null, null, null, null);
        android.widget.TextView liveJobsCount = view.findViewById(R.id.recruiter_dashboard_live_jobs_count);
        android.widget.TextView applicantsCount = view.findViewById(R.id.recruiter_dashboard_new_applicants_count);
        android.widget.TextView offersCount = view.findViewById(R.id.recruiter_dashboard_offers_sent_count);
        if (liveJobsCount != null) liveJobsCount.setText("0");
        if (applicantsCount != null) applicantsCount.setText("0");
        if (offersCount != null) offersCount.setText("0");
        ApiClient.getInstance(requireContext()).api().getRecruiterDashboard().enqueue(new Callback<ApiModels.RecruiterDashboardResponse>() {
            @Override
            public void onResponse(Call<ApiModels.RecruiterDashboardResponse> call, Response<ApiModels.RecruiterDashboardResponse> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                ApiModels.RecruiterDashboardResponse body = response.body();
                if (liveJobsCount != null) liveJobsCount.setText(String.valueOf(body.liveJobsCount));
                if (applicantsCount != null) applicantsCount.setText(String.valueOf(body.newApplicantsCount));
                if (offersCount != null) offersCount.setText(String.valueOf(body.offersSentCount));
                List<ActivityAdapter.Item> items = new ArrayList<>();
                if (body.recentActivity != null) {
                    int count = 0;
                    for (ApiModels.DashboardActivityItem it : body.recentActivity) {
                        if (count >= 5) break;
                        String title = it.title == null || it.title.trim().isEmpty() ? "Activity" : it.title;
                        String subtitle = it.body == null || it.body.trim().isEmpty()
                                ? formatRelativeTime(parseBackendDate(it.createdAt))
                                : it.body + " - " + formatRelativeTime(parseBackendDate(it.createdAt));
                        items.add(new ActivityAdapter.Item(title, subtitle));
                        count++;
                    }
                }
                adapter.submitList(items);
                if (loading != null) loading.setVisibility(View.GONE);
                if (items.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_dashboard_activity_state, true, R.drawable.ic_clock,
                            "No activity yet", "Candidate actions and hiring updates will appear here.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_dashboard_activity_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void onFailure(Call<ApiModels.RecruiterDashboardResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_dashboard_activity_state, true, R.drawable.ic_clock,
                        "Couldn't load activity", "Please try again.", "Retry", v -> bindRecruiterDashboard(view));
            }
        });

        ImageButton bell = view.findViewById(R.id.recruiter_dashboard_notifications);
        if (bell != null) bell.setOnClickListener(v -> pushRecruiter(R.layout.fragment_recruiter_notifications));
        View postActionCard = view.findViewById(R.id.recruiter_dashboard_post_job_card);
        if (postActionCard != null) {
            postActionCard.setOnClickListener(v -> pushRecruiter(R.layout.fragment_recruiter_post_job));
        }
        View applicantsActionCard = view.findViewById(R.id.recruiter_dashboard_view_applicants_card);
        if (applicantsActionCard != null) {
            applicantsActionCard.setOnClickListener(v -> {
                openRecruiterTab(R.id.nav_applicants);
            });
        }
        View offersActionCard = view.findViewById(R.id.recruiter_dashboard_view_offers_card);
        if (offersActionCard != null) {
            offersActionCard.setOnClickListener(v -> {
                openRecruiterTab(R.id.nav_offers);
            });
        }
        View liveJobsCard = view.findViewById(R.id.recruiter_dashboard_live_jobs_card);
        if (liveJobsCard != null) {
            liveJobsCard.setOnClickListener(v -> openRecruiterTab(R.id.nav_jobs));
        }
        View newApplicantsCard = view.findViewById(R.id.recruiter_dashboard_new_applicants_card);
        if (newApplicantsCard != null) {
            newApplicantsCard.setOnClickListener(v -> openRecruiterTab(R.id.nav_applicants));
        }
        View offersSentCard = view.findViewById(R.id.recruiter_dashboard_offers_sent_card);
        if (offersSentCard != null) {
            offersSentCard.setOnClickListener(v -> openRecruiterTab(R.id.nav_offers));
        }
        View allActivity = view.findViewById(R.id.recent_activity_view_all);
        if (allActivity != null) {
            allActivity.setOnClickListener(v -> pushRecruiter(R.layout.fragment_recruiter_application_history));
        }
    }

    private void bindRecruiterJobs(View view) {
        RecyclerView jobsList = view.findViewById(R.id.recruiter_jobs_list);
        if (jobsList == null) {
            return;
        }
        View statePanel = view.findViewById(R.id.recruiter_jobs_state);
        View loading = view.findViewById(R.id.recruiter_jobs_loading);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        JobsAdapter adapter = new JobsAdapter(item -> {
            ApiModels.ApiJob selected = null;
            for (ApiModels.ApiJob job : recruiterJobsCache) {
                if (job != null && item.backendId.equals(String.valueOf(job.id))) {
                    selected = job;
                    break;
                }
            }
            setRecruiterSelectedJob(selected);
            pushRecruiter(R.layout.fragment_recruiter_job_details);
        });
        jobsList.setAdapter(adapter);

        final String[] currentQuery = {""};
        final String[] currentRoleFilter = {null};
        final boolean[] newestFirst = {true};
        final List<ApiModels.ApiJob>[] allJobs = new List[]{new ArrayList<>()};

        Runnable renderJobs = () -> {
            List<ApiModels.ApiJob> filtered = new ArrayList<>();
            for (ApiModels.ApiJob job : allJobs[0]) {
                String statusVal = (job.status == null ? "ACTIVE" : job.status).toUpperCase(Locale.US);
                if ("CLOSED_ONLY".equals(currentRoleFilter[0])) {
                    if (!"CLOSED".equals(statusVal)) continue;
                } else if ("ACTIVE_ONLY".equals(currentRoleFilter[0])) {
                    if (!"ACTIVE".equals(statusVal)) continue;
                } else if (currentRoleFilter[0] != null && !currentRoleFilter[0].equals(job.roleType)) {
                    continue;
                }
                if (!currentQuery[0].isEmpty()) {
                    String query = currentQuery[0].toLowerCase();
                    String haystack = (job.title + " " + job.company + " " + job.location + " " + CandidateJobsViewModel.readableRole(job.roleType)).toLowerCase();
                    if (!haystack.contains(query)) {
                        continue;
                    }
                }
                filtered.add(job);
            }
            filtered.sort((a, b) -> newestFirst[0]
                    ? Long.compare(parseBackendDate(b.createdAt), parseBackendDate(a.createdAt))
                    : Long.compare(parseBackendDate(a.createdAt), parseBackendDate(b.createdAt)));
            List<JobsAdapter.Item> items = new ArrayList<>();
            for (ApiModels.ApiJob job : filtered) {
                String subtitle = CandidateJobsViewModel.readableRole(job.roleType)
                        + " • "
                        + ((job.status == null ? "ACTIVE" : job.status).replace('_', ' '))
                        + " • "
                        + (job.isRemote ? "Remote" : (job.location == null ? "" : job.location));
                items.add(new JobsAdapter.Item(String.valueOf(job.id), job.title, subtitle));
            }
            adapter.setItems(items);
            if (loading != null) loading.setVisibility(View.GONE);
            if (items.isEmpty()) {
                boolean hasQuery = currentQuery[0] != null && !currentQuery[0].isEmpty();
                showStatePanel(view, R.id.recruiter_jobs_state, true, R.drawable.ic_briefcase_outline,
                        hasQuery ? "No results found" : "No jobs posted yet",
                        hasQuery ? "Try a different search or clear filters." : "Post your first job to start receiving applicants.",
                        hasQuery ? "Clear Search" : "Post New Job",
                        v -> {
                            if (hasQuery) {
                                EditText input = view.findViewById(R.id.recruiter_jobs_search_input);
                                if (input != null) input.setText("");
                            } else {
                                pushRecruiter(R.layout.fragment_recruiter_post_job);
                            }
                        });
            } else {
                showStatePanel(view, R.id.recruiter_jobs_state, false, 0, null, null, null, null);
            }
        };
        final Runnable[] reloadFromBackend = new Runnable[1];
        reloadFromBackend[0] = () -> ApiClient.getInstance(requireContext()).api()
                .getRecruiterJobsFiltered(null, null, newestFirst[0] ? "-created_at" : "created_at")
                .enqueue(new Callback<List<ApiModels.ApiJob>>() {
                    @Override public void onResponse(Call<List<ApiModels.ApiJob>> call, Response<List<ApiModels.ApiJob>> response) {
                        if (!isAdded()) return;
                        if (!response.isSuccessful() || response.body() == null) {
                            if (loading != null) loading.setVisibility(View.GONE);
                            showStatePanel(view, R.id.recruiter_jobs_state, true, R.drawable.ic_briefcase_outline,
                                    "Couldn't load jobs", "Please try again.", "Retry", vv -> reloadFromBackend[0].run());
                            return;
                        }
                        recruiterJobsCache.clear();
                        recruiterJobsCache.addAll(response.body());
                        allJobs[0] = new ArrayList<>(response.body());
                        renderJobs.run();
                    }
                    @Override public void onFailure(Call<List<ApiModels.ApiJob>> call, Throwable t) {
                        if (!isAdded()) return;
                        if (loading != null) loading.setVisibility(View.GONE);
                        showStatePanel(view, R.id.recruiter_jobs_state, true, R.drawable.ic_briefcase_outline,
                                "Couldn't load jobs", "Check your connection and retry.", "Retry", vv -> reloadFromBackend[0].run());
                    }
                });
        reloadFromBackend[0].run();

        EditText searchInput = view.findViewById(R.id.recruiter_jobs_search_input);
        ImageButton clearButton = view.findViewById(R.id.recruiter_jobs_search_clear);

        clearButton.setOnClickListener(v -> searchInput.setText(""));
        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                currentQuery[0] = s == null ? "" : s.toString().trim();
                renderJobs.run();
                clearButton.setVisibility(currentQuery[0].isEmpty() ? View.GONE : View.VISIBLE);
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        view.findViewById(R.id.recruiter_jobs_filter).setOnClickListener(v -> {
            androidx.appcompat.widget.PopupMenu menu = new androidx.appcompat.widget.PopupMenu(requireContext(), v);
            menu.getMenu().add(0, 1, 0, "Newest first");
            menu.getMenu().add(0, 2, 1, "Oldest first");
            menu.getMenu().add(0, 3, 2, "All roles");
            menu.getMenu().add(0, 4, 3, "Active only");
            menu.getMenu().add(0, 5, 4, "Closed only");
            menu.getMenu().add(0, 6, 5, "Full-time");
            menu.getMenu().add(0, 7, 6, "Contract");
            menu.getMenu().add(0, 8, 7, "Part-time");
            menu.getMenu().add(0, 9, 8, "Remote");
            menu.setOnMenuItemClickListener(item -> {
                int id = item.getItemId();
                if (id == 1) {
                    newestFirst[0] = true;
                } else if (id == 2) {
                    newestFirst[0] = false;
                } else if (id == 3) {
                    currentRoleFilter[0] = null;
                } else if (id == 4) {
                    currentRoleFilter[0] = "ACTIVE_ONLY";
                } else if (id == 5) {
                    currentRoleFilter[0] = "CLOSED_ONLY";
                } else if (id == 6) {
                    currentRoleFilter[0] = Job.ROLE_FULL_TIME;
                } else if (id == 7) {
                    currentRoleFilter[0] = Job.ROLE_CONTRACT;
                } else if (id == 8) {
                    currentRoleFilter[0] = Job.ROLE_PART_TIME;
                } else if (id == 9) {
                    currentRoleFilter[0] = Job.ROLE_REMOTE;
                }
                renderJobs.run();
                return true;
            });
            menu.show();
        });

        View postFab = view.findViewById(R.id.recruiter_jobs_post_fab);
        if (postFab != null) {
            postFab.setOnClickListener(v -> pushRecruiter(R.layout.fragment_recruiter_post_job));
        }
    }

    private String toFriendlyDateTime(@Nullable String iso) {
        if (iso == null || iso.trim().isEmpty()) return "30 days";
        try {
            java.text.SimpleDateFormat in = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US);
            in.setLenient(true);
            java.util.Date date = in.parse(iso.replace("Z", ""));
            if (date == null) return iso;
            java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.US);
            return out.format(date);
        } catch (Exception ignored) {
            return iso;
        }
    }

    private void bindRecruiterApplicants(View view) {
        RecyclerView applicantsList = view.findViewById(R.id.recruiter_applicants_list);
        if (applicantsList == null) {
            return;
        }
        TextView jobTitle = view.findViewById(R.id.recruiter_applicants_job_title);
        if (jobTitle != null) jobTitle.setVisibility(View.GONE);
        View loading = view.findViewById(R.id.recruiter_applicants_loading);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        final boolean[] sortDescending = {true};
        final List<ApplicantsAdapter.Item>[] loadedApplicants = new List[]{new ArrayList<>()};
        ApplicantsAdapter applicantsAdapter = new ApplicantsAdapter(item -> {
            recruiterSelectedApplicant = null;
            for (ApiModels.ApplicationDto dto : recruiterApplicantsCache) {
                if (dto != null && dto.id == item.applicationId) {
                    setRecruiterSelectedApplicant(dto);
                    break;
                }
            }
            if (recruiterSelectedApplicant == null) {
                ApiModels.ApplicationDto stub = new ApiModels.ApplicationDto();
                stub.id = item.applicationId;
                stub.candidateName = item.name;
                stub.status = item.status;
                setRecruiterSelectedApplicant(stub);
            }
            pushRecruiter(R.layout.fragment_recruiter_candidate_profile);
        });
        applicantsAdapter.submitList(new ArrayList<>());
        jobsListModeForApplicants(view, applicantsList, applicantsAdapter, loadedApplicants, jobTitle, true, loading);
        view.findViewById(R.id.recruiter_applicants_filter).setOnClickListener(v -> {
            RecyclerView.Adapter currentAdapter = applicantsList.getAdapter();
            if (currentAdapter instanceof ApplicantsAdapter) {
                if (loadedApplicants[0].isEmpty()) return;
                List<ApplicantsAdapter.Item> current = new ArrayList<>(loadedApplicants[0]);
                current.sort((a, b) -> sortDescending[0]
                        ? Integer.compare(b.matchPercent, a.matchPercent)
                        : Integer.compare(a.matchPercent, b.matchPercent));
                sortDescending[0] = !sortDescending[0];
                loadedApplicants[0] = current;
                applicantsAdapter.submitList(new ArrayList<>(current));
                return;
            }
            if (currentAdapter instanceof JobsAdapter) {
                if (recruiterJobsCache.isEmpty()) return;
                List<ApiModels.ApiJob> jobs = new ArrayList<>(recruiterJobsCache);
                jobs.sort((a, b) -> sortDescending[0]
                        ? Long.compare(parseBackendDate(b.createdAt), parseBackendDate(a.createdAt))
                        : Long.compare(parseBackendDate(a.createdAt), parseBackendDate(b.createdAt)));
                sortDescending[0] = !sortDescending[0];
                recruiterJobsCache.clear();
                recruiterJobsCache.addAll(jobs);
                List<JobsAdapter.Item> items = new ArrayList<>();
                for (ApiModels.ApiJob j : jobs) {
                    String subtitle = safeOr(j.company, "Company") + " - " + safeOr(j.status, "ACTIVE");
                    items.add(new JobsAdapter.Item(String.valueOf(j.id), safeOr(j.title, "Job"), subtitle));
                }
                ((JobsAdapter) currentAdapter).setItems(items);
            }
        });
    }

    private void bindRecruiterCandidateProfile(View view) {
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.recruiter_candidate_profile_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        }
        TextView name = view.findViewById(R.id.recruiter_candidate_name);
        TextView role = view.findViewById(R.id.recruiter_candidate_role);
        TextView location = view.findViewById(R.id.recruiter_candidate_location);
        TextView summaryView = view.findViewById(R.id.recruiter_candidate_resume_summary_value);
        com.google.android.material.chip.ChipGroup skillsGroup = view.findViewById(R.id.recruiter_candidate_skills_group);
        TextView expView = view.findViewById(R.id.recruiter_candidate_experience_value);
        TextView eduView = view.findViewById(R.id.recruiter_candidate_education_details);

        hydrateRecruiterSelectedApplicantFromCache();
        if (name != null) name.setText(recruiterSelectedApplicant != null ? safeOr(recruiterSelectedApplicant.candidateName, "Candidate") : "Candidate");
        if (role != null) role.setText(recruiterSelectedApplicant != null ? safeOr(recruiterSelectedApplicant.jobTitle, "Applied Candidate") : "Applied Candidate");
        if (location != null) location.setText(recruiterSelectedApplicant != null ? safeOr(recruiterSelectedApplicant.candidateEmail, "") : "");
        bindRecruiterAssessmentCards(view, recruiterSelectedApplicant == null ? null : recruiterSelectedApplicant.status, null, null);
        if (summaryView != null) summaryView.setText("Loading candidate profile...");
        if (skillsGroup != null) skillsGroup.removeAllViews();
        if (expView != null) expView.setText("");
        if (eduView != null) eduView.setText("");

        int selectedApplicationId = recruiterSelectedApplicant != null ? recruiterSelectedApplicant.id : getStoredRecruiterSelectedApplicationId();
        if (selectedApplicationId <= 0) {
            if (summaryView != null) summaryView.setText("No candidate selected.");
            View action = view.findViewById(R.id.recruiter_candidate_action_button);
            if (action != null) action.setVisibility(View.GONE);
            return;
        }
        ApiClient.getInstance(requireContext()).api().getRecruiterCandidateProfile(selectedApplicationId)
                .enqueue(new Callback<ApiModels.RecruiterCandidateProfileResponse>() {
                    @Override public void onResponse(Call<ApiModels.RecruiterCandidateProfileResponse> call, Response<ApiModels.RecruiterCandidateProfileResponse> response) {
                        if (!isAdded()) return;
                        if (!response.isSuccessful() || response.body() == null) {
                            if (summaryView != null) summaryView.setText("Unable to load candidate profile.");
                            return;
                        }
                        ApiModels.RecruiterCandidateProfileResponse body = response.body();
                        recruiterSelectedCandidateProfile = body;
                        if (name != null) name.setText(safeOr(body.candidate != null ? body.candidate.fullName : null, "Candidate"));
                        if (role != null) {
                            String primaryRole = safeOr(body.candidate != null ? body.candidate.role : null, "");
                            if (primaryRole.isEmpty()) primaryRole = safeOr(body.jobTitle, "Candidate");
                            role.setText(primaryRole);
                        }
                        if (location != null) {
                            String line = safeOr(body.candidate != null ? body.candidate.location : null, "");
                            String email = safeOr(body.candidate != null ? body.candidate.email : null, "");
                            String phone = safeOr(body.candidate != null ? body.candidate.phone : null, "");
                            if (!email.isEmpty()) line = line.isEmpty() ? email : (line + " - " + email);
                            if (!phone.isEmpty()) line = line.isEmpty() ? phone : (line + " - " + phone);
                            location.setText(line);
                        }
                        bindRecruiterAssessmentCards(view, body.applicationStatus, body.scores == null ? null : body.scores.hr, body.scores == null ? null : body.scores.tech);
                        bindRecruiterCandidateProfileActionButton(view, body);
                        bindRecruiterCandidateParsedResume(view, body.parsedResumeJson);
                    }

                    @Override public void onFailure(Call<ApiModels.RecruiterCandidateProfileResponse> call, Throwable t) {
                        if (!isAdded()) return;
                        recruiterSelectedCandidateProfile = null;
                        if (summaryView != null) summaryView.setText("Network error loading candidate profile.");
                    }
                });
        View actionButton = view.findViewById(R.id.recruiter_candidate_action_button);
        if (actionButton != null) {
            actionButton.setOnClickListener(v -> pushRecruiter(R.layout.fragment_recruiter_candidate_action));
        }
    }

    private String formatRecruiterAssessmentScore(@Nullable ApiModels.AssessmentScore score) {
        if (score == null) return "--";
        if (score.score != null) {
            String suffix = "";
            if (score.pass != null) suffix = score.pass ? " PASS" : " FAIL";
            return Math.round(score.score) + "%" + suffix;
        }
        String status = safeOr(score.status, "");
        if (status.isEmpty()) return "--";
        status = status.replace('_', ' ');
        return status;
    }

    private void bindRecruiterAssessmentCards(@NonNull View root, @Nullable String applicationStatus,
                                              @Nullable ApiModels.AssessmentScore hr, @Nullable ApiModels.AssessmentScore tech) {
        TextView hrScoreValue = root.findViewById(R.id.recruiter_candidate_hr_score_value);
        TextView techScoreValue = root.findViewById(R.id.recruiter_candidate_tech_score_value);
        View hrCard = hrScoreValue == null ? null : (View) hrScoreValue.getParent().getParent();
        View techCard = techScoreValue == null ? null : (View) techScoreValue.getParent().getParent();
        String status = safeOr(applicationStatus, "").toUpperCase(Locale.US);
        boolean matchFailed = "MATCH_FAIL".equals(status);
        boolean hrRelevant = status.contains("HR_") || status.contains("TECH_") || status.startsWith("OFFER_");
        boolean techRelevant = status.contains("TECH_") || status.startsWith("OFFER_");

        if (hrCard != null) hrCard.setVisibility(matchFailed ? View.GONE : View.VISIBLE);
        if (techCard != null) techCard.setVisibility(matchFailed ? View.GONE : View.VISIBLE);

        if (hrScoreValue != null && hrCard != null && hrCard.getVisibility() == View.VISIBLE) {
            hrScoreValue.setText(hrRelevant ? formatRecruiterAssessmentScore(hr) : "Not started");
        }
        if (techScoreValue != null && techCard != null && techCard.getVisibility() == View.VISIBLE) {
            if (!techRelevant && tech == null) {
                techScoreValue.setText("Locked");
            } else {
                techScoreValue.setText(formatRecruiterAssessmentScore(tech));
            }
        }
    }

    private void bindRecruiterCandidateProfileActionButton(@NonNull View view, @NonNull ApiModels.RecruiterCandidateProfileResponse body) {
        View v = view.findViewById(R.id.recruiter_candidate_action_button);
        if (!(v instanceof com.google.android.material.button.MaterialButton)) return;
        com.google.android.material.button.MaterialButton btn = (com.google.android.material.button.MaterialButton) v;
        String status = safeOr(body.applicationStatus, "").toUpperCase(Locale.US);
        if (status.contains("FAIL") || isTerminalRecruiterApplicationStatus(status)) {
            btn.setVisibility(View.GONE);
            return;
        }
        if (status.startsWith("OFFER_")) {
            btn.setVisibility(View.VISIBLE);
            btn.setText("View Offer Details");
            btn.setOnClickListener(x -> openRecruiterTab(R.id.nav_offers));
            return;
        }
        btn.setVisibility(View.VISIBLE);
        btn.setText("Take Action");
        btn.setOnClickListener(x -> pushRecruiter(R.layout.fragment_recruiter_candidate_action));
    }

    private boolean isTerminalRecruiterApplicationStatus(@Nullable String statusRaw) {
        String status = safeOr(statusRaw, "").toUpperCase(Locale.US);
        return "OFFER_ACCEPTED".equals(status) || "OFFER_REJECTED".equals(status);
    }

    @SuppressWarnings("unchecked")
    private void bindRecruiterCandidateParsedResume(@NonNull View root, @Nullable Map<String, Object> parsed) {
        TextView summaryView = root.findViewById(R.id.recruiter_candidate_resume_summary_value);
        com.google.android.material.chip.ChipGroup skillsGroup = root.findViewById(R.id.recruiter_candidate_skills_group);
        TextView expView = root.findViewById(R.id.recruiter_candidate_experience_value);
        TextView eduView = root.findViewById(R.id.recruiter_candidate_education_details);
        if (parsed == null) parsed = new HashMap<>();

        String summary = sanitizeReadableText(String.valueOf(parsed.get("summary") == null ? "" : parsed.get("summary")), "");
        if (summaryView != null) {
            summaryView.setText(summary.isEmpty() ? "No parsed resume summary available yet." : summary);
        }

        if (skillsGroup != null) {
            skillsGroup.removeAllViews();
            List<String> skills = sanitizeSkillList(toStringList(parsed.get("skills")));
            int max = Math.min(8, skills.size());
            for (int i = 0; i < max; i++) {
                Chip chip = new Chip(requireContext(), null, com.google.android.material.R.style.Widget_MaterialComponents_Chip_Action);
                chip.setText(skills.get(i));
                chip.setClickable(false);
                chip.setCheckable(false);
                skillsGroup.addView(chip);
            }
        }

        if (expView != null) {
            expView.setText(buildRecruiterExperienceText(parsed.get("experience")));
        }
        if (eduView != null) {
            eduView.setText(buildRecruiterEducationText(parsed.get("education")));
        }
    }

    private String buildRecruiterExperienceText(@Nullable Object experienceObj) {
        if (!(experienceObj instanceof List)) return "No experience details found.";
        StringBuilder sb = new StringBuilder();
        for (Object item : (List<?>) experienceObj) {
            if (!(item instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) item;
            String title = safeOr(m.get("title") == null ? null : String.valueOf(m.get("title")), "");
            String company = safeOr(m.get("company") == null ? null : String.valueOf(m.get("company")), "");
            String start = safeOr(m.get("start") == null ? null : String.valueOf(m.get("start")), "");
            String end = safeOr(m.get("end") == null ? null : String.valueOf(m.get("end")), "");
            String duration = safeOr(m.get("duration_label") == null ? null : String.valueOf(m.get("duration_label")), "");
            if (sb.length() > 0) sb.append("\n\n");
            String header = !title.isEmpty() && !company.isEmpty() ? (title + " - " + company)
                    : (!title.isEmpty() ? title : (!company.isEmpty() ? company : "Experience"));
            sb.append(header);
            if (!start.isEmpty() || !end.isEmpty()) {
                sb.append("\n").append(start.isEmpty() ? "Start" : start).append(" - ").append(end.isEmpty() ? "Present" : end);
                if (!duration.isEmpty()) sb.append("  (").append(duration).append(")");
            }
            Object bulletsObj = m.get("bullets");
            if (bulletsObj instanceof List) {
                int count = 0;
                for (Object b : (List<?>) bulletsObj) {
                    String line = sanitizeReadableText(String.valueOf(b == null ? "" : b), "");
                    if (line.isEmpty()) continue;
                    sb.append("\n- ").append(line);
                    count++;
                    if (count >= 4) break;
                }
            }
        }
        return sb.length() == 0 ? "No experience details found." : sb.toString();
    }

    private String buildRecruiterEducationText(@Nullable Object educationObj) {
        if (!(educationObj instanceof List)) return "No education details found.";
        StringBuilder sb = new StringBuilder();
        for (Object item : (List<?>) educationObj) {
            if (!(item instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) item;
            String degree = safeOr(m.get("degree") == null ? null : String.valueOf(m.get("degree")), "");
            String institution = safeOr(m.get("institution") == null ? null : String.valueOf(m.get("institution")), "");
            String year = safeOr(m.get("year") == null ? null : String.valueOf(m.get("year")), "");
            if (degree.isEmpty() && institution.isEmpty()) continue;
            if (sb.length() > 0) sb.append("\n");
            sb.append(degree.isEmpty() ? "Education" : degree);
            if (!institution.isEmpty()) sb.append(" - ").append(institution);
            if (!year.isEmpty()) sb.append(" (").append(year).append(")");
        }
        return sb.length() == 0 ? "No education details found." : sb.toString();
    }

    private void bindRecruiterCandidateAction(View view) {
        MaterialToolbar toolbar = view.findViewById(R.id.recruiter_candidate_action_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationIcon(R.drawable.ic_back);
            toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        }
        TextView name = view.findViewById(R.id.recruiter_candidate_action_name);
        TextView role = view.findViewById(R.id.recruiter_candidate_action_role);
        TextView meta = view.findViewById(R.id.recruiter_candidate_action_meta);
        TextView statusChip = view.findViewById(R.id.recruiter_candidate_action_status_chip);
        TextView guidance = view.findViewById(R.id.recruiter_candidate_action_guidance);
        com.google.android.material.button.MaterialButton acceptBtn = view.findViewById(R.id.recruiter_candidate_accept_button);
        com.google.android.material.button.MaterialButton rejectBtn = view.findViewById(R.id.recruiter_candidate_reject_button);

        Runnable render = () -> {
            String displayName = safeOr(recruiterSelectedCandidateProfile != null && recruiterSelectedCandidateProfile.candidate != null
                            ? recruiterSelectedCandidateProfile.candidate.fullName : null,
                    recruiterSelectedApplicant != null ? safeOr(recruiterSelectedApplicant.candidateName, "Candidate") : "Candidate");
            String roleText = "";
            String jobTitle = "";
            String appStatus = "";
            String email = "";
            String phone = "";
            if (recruiterSelectedCandidateProfile != null) {
                jobTitle = safeOr(recruiterSelectedCandidateProfile.jobTitle, "");
                appStatus = safeOr(recruiterSelectedCandidateProfile.applicationStatus, "");
                if (recruiterSelectedCandidateProfile.candidate != null) {
                    roleText = safeOr(recruiterSelectedCandidateProfile.candidate.role, "");
                    email = safeOr(recruiterSelectedCandidateProfile.candidate.email, "");
                    phone = safeOr(recruiterSelectedCandidateProfile.candidate.phone, "");
                }
            }
            if (roleText.isEmpty() && recruiterSelectedApplicant != null) roleText = safeOr(recruiterSelectedApplicant.jobTitle, "");
            if (jobTitle.isEmpty() && recruiterSelectedApplicant != null) jobTitle = safeOr(recruiterSelectedApplicant.jobTitle, "");
            if (appStatus.isEmpty() && recruiterSelectedApplicant != null) appStatus = safeOr(recruiterSelectedApplicant.status, "");
            if (email.isEmpty() && recruiterSelectedApplicant != null) email = safeOr(recruiterSelectedApplicant.candidateEmail, "");
            if (roleText.isEmpty()) roleText = "Applied candidate";

            if (name != null) name.setText(displayName);
            if (role != null) role.setText(roleText);
            if (meta != null) {
                String line = joinNonEmpty(" - ", jobTitle, email, phone);
                meta.setText(line.isEmpty() ? "Candidate application" : line);
            }
            if (statusChip != null) {
                statusChip.setText(readableApplicationStatus(appStatus));
                tintTextChip(statusChip, appStatus);
            }

            String upper = safeOr(appStatus, "").toUpperCase(Locale.US);
            boolean terminalOffer = isTerminalRecruiterApplicationStatus(upper);
            boolean failed = upper.contains("FAIL");
            boolean offerStage = upper.startsWith("OFFER_");
            boolean actionable = !(terminalOffer || failed || offerStage);

            if (guidance != null) {
                guidance.setVisibility(View.VISIBLE);
                guidance.setText(recruiterActionGuidance(upper));
            }

            if (terminalOffer) {
                if (rejectBtn != null) rejectBtn.setVisibility(View.GONE);
                if (acceptBtn != null) {
                    acceptBtn.setVisibility(View.VISIBLE);
                    acceptBtn.setEnabled(true);
                    acceptBtn.setAlpha(1f);
                    acceptBtn.setText("View Signed Offer");
                }
                return;
            }
            if (offerStage) {
                if (rejectBtn != null) rejectBtn.setVisibility(View.GONE);
                if (acceptBtn != null) {
                    acceptBtn.setVisibility(View.VISIBLE);
                    acceptBtn.setEnabled(true);
                    acceptBtn.setAlpha(1f);
                    acceptBtn.setText("Manage Offer");
                }
                return;
            }
            if (failed) {
                if (rejectBtn != null) rejectBtn.setVisibility(View.GONE);
                if (acceptBtn != null) {
                    acceptBtn.setVisibility(View.GONE);
                }
                return;
            }

            if (rejectBtn != null) {
                rejectBtn.setVisibility(View.VISIBLE);
                rejectBtn.setText("Reject Candidate");
                rejectBtn.setEnabled(true);
                rejectBtn.setAlpha(1f);
            }
            if (acceptBtn != null) {
                acceptBtn.setVisibility(View.VISIBLE);
                acceptBtn.setText(actionable ? "Shortlist Candidate" : "Candidate Shortlisted");
                acceptBtn.setEnabled(actionable);
                acceptBtn.setAlpha(actionable ? 1f : 0.6f);
            }
        };

        hydrateRecruiterSelectedApplicantFromCache();
        render.run();
        int selectedApplicationId = recruiterSelectedApplicant != null ? recruiterSelectedApplicant.id : getStoredRecruiterSelectedApplicationId();
        if (selectedApplicationId > 0) {
            ApiClient.getInstance(requireContext()).api().getRecruiterCandidateProfile(selectedApplicationId)
                    .enqueue(new Callback<ApiModels.RecruiterCandidateProfileResponse>() {
                        @Override public void onResponse(Call<ApiModels.RecruiterCandidateProfileResponse> call, Response<ApiModels.RecruiterCandidateProfileResponse> response) {
                            if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                            recruiterSelectedCandidateProfile = response.body();
                            render.run();
                        }
                        @Override public void onFailure(Call<ApiModels.RecruiterCandidateProfileResponse> call, Throwable t) { }
                    });
        }

        if (acceptBtn != null) {
            acceptBtn.setOnClickListener(v -> {
                if (!v.isEnabled()) return;
                String status = safeOr(recruiterSelectedCandidateProfile != null ? recruiterSelectedCandidateProfile.applicationStatus : (recruiterSelectedApplicant == null ? null : recruiterSelectedApplicant.status), "").toUpperCase(Locale.US);
                if (isTerminalRecruiterApplicationStatus(status) || status.startsWith("OFFER_")) {
                    openRecruiterTab(R.id.nav_offers);
                    return;
                }
                performRecruiterApplicantAction("shortlist");
            });
        }
        if (rejectBtn != null) {
            rejectBtn.setOnClickListener(v -> {
                if (!v.isEnabled()) return;
                new AlertDialog.Builder(requireContext())
                        .setTitle("Reject candidate?")
                        .setMessage("This candidate will be moved out of the active pipeline and will receive an update notification.")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Reject Candidate", (dialog, which) -> performRecruiterApplicantAction("reject"))
                        .show();
            });
        }
    }

    private void bindRecruiterOffers(View view) {
        RecyclerView offersList = view.findViewById(R.id.recruiter_offers_list);
        if (offersList == null) {
            return;
        }
        OffersAdapter adapter = new OffersAdapter(item -> {
            setRecruiterSelectedOffer(findOfferById(item.offerId));
            pushRecruiter(R.layout.fragment_recruiter_offer_details);
        });
        adapter.setItems(new ArrayList<>());
        offersList.setAdapter(adapter);
        View loading = view.findViewById(R.id.recruiter_offers_loading);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        Runnable[] loadOffers = new Runnable[1];
        loadOffers[0] = () -> ApiClient.getInstance(requireContext()).api().getRecruiterOffers().enqueue(new Callback<List<ApiModels.RecruiterOfferDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.RecruiterOfferDto>> call, Response<List<ApiModels.RecruiterOfferDto>> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    if (loading != null) loading.setVisibility(View.GONE);
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "Couldn't load offers", "Please try again.", "Retry", v -> loadOffers[0].run());
                    return;
                }
                List<OffersAdapter.Item> items = new ArrayList<>();
                recruiterOfferCache.clear();
                recruiterOfferCache.addAll(response.body());
                for (ApiModels.RecruiterOfferDto dto : response.body()) {
                    OffersAdapter.Status status = mapOfferStatus(dto.status);
                    items.add(new OffersAdapter.Item(
                            dto.id,
                            dto.candidateName == null ? "Candidate" : dto.candidateName,
                            (dto.jobTitle == null || dto.jobTitle.isEmpty()) ? (dto.role == null ? "Role" : dto.role) : dto.jobTitle,
                            status,
                            R.drawable.ic_profile
                    ));
                }
                adapter.setItems(items);
                if (loading != null) loading.setVisibility(View.GONE);
                if (items.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "No offers yet", "Offers you send will appear here.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_offers_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.RecruiterOfferDto>> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "Couldn't load offers", "Check your connection and retry.", "Retry", v -> loadOffers[0].run());
            }
        });
        loadOffers[0].run();

        ChipGroup chipGroup = view.findViewById(R.id.recruiter_offer_filter_group);
        if (chipGroup != null) {
            chipGroup.setOnCheckedChangeListener((group, checkedId) -> {
                if (checkedId == R.id.filter_pending) {
                    adapter.setFilter(OffersAdapter.Status.PENDING);
                } else if (checkedId == R.id.filter_negotiating) {
                    adapter.setFilter(OffersAdapter.Status.NEGOTIATING);
                } else if (checkedId == R.id.filter_signed) {
                    adapter.setFilter(OffersAdapter.Status.SIGNED);
                } else {
                    adapter.setFilter(null);
                }
                if (recruiterOfferCache.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "No offers yet", "Offers you send will appear here.", null, null);
                } else if (adapter.getItemCount() == 0) {
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "No results found", "Try a different filter.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_offers_state, false, 0, null, null, null, null);
                }
            });
        }

        ImageButton search = view.findViewById(R.id.recruiter_offers_search_action);
        View searchCard = view.findViewById(R.id.recruiter_offers_search_card);
        EditText searchInput = view.findViewById(R.id.recruiter_offers_search_input);
        ImageButton searchClear = view.findViewById(R.id.recruiter_offers_search_clear);
        if (search == null || searchCard == null || searchInput == null || searchClear == null) {
            return;
        }

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String query = s == null ? "" : s.toString();
                adapter.setQuery(query);
                searchClear.setVisibility(query.isEmpty() ? View.GONE : View.VISIBLE);
                if (recruiterOfferCache.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "No offers yet", "Offers you send will appear here.", null, null);
                } else if (adapter.getItemCount() == 0) {
                    showStatePanel(view, R.id.recruiter_offers_state, true, R.drawable.ic_offer, "No results found", "Try a different search.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_offers_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        searchClear.setOnClickListener(v -> searchInput.setText(""));

        search.setOnClickListener(v -> {
            boolean showingSearch = searchCard.getVisibility() == View.VISIBLE;
            if (showingSearch) {
                searchInput.setText("");
                searchCard.setVisibility(View.GONE);
                search.setImageResource(R.drawable.ic_search);
                hideKeyboard(searchInput);
            } else {
                searchCard.setVisibility(View.VISIBLE);
                search.setImageResource(R.drawable.ic_close);
                searchInput.requestFocus();
                showKeyboard(searchInput);
            }
        });
    }

    private void bindRecruiterJobDetails(View view) {
        MaterialToolbar toolbar = view.findViewById(R.id.recruiter_job_details_toolbar);
        if (toolbar != null) toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        View loading = view.findViewById(R.id.recruiter_job_details_loading);
        View content = view.findViewById(R.id.recruiter_job_details_card);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        if (content != null) content.setVisibility(View.GONE);
        showStatePanel(view, R.id.recruiter_job_details_state, false, 0, null, null, null, null);

        hydrateRecruiterSelectedJobFromCache();
        ApiModels.ApiJob selected = recruiterSelectedJob;
        int jobId = selected == null ? getStoredRecruiterSelectedJobId() : parseBackendId(String.valueOf(selected.id));
        if (jobId <= 0) {
            showStatePanel(view, R.id.recruiter_job_details_state, true, R.drawable.ic_briefcase_outline, "Job not found", "Select a job again from Active Jobs.", null, null);
            if (loading != null) loading.setVisibility(View.GONE);
            return;
        }
        ApiClient.getInstance(requireContext()).api().getRecruiterJobDetail(jobId).enqueue(new Callback<ApiModels.ApiJob>() {
            @Override public void onResponse(Call<ApiModels.ApiJob> call, Response<ApiModels.ApiJob> response) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    showStatePanel(view, R.id.recruiter_job_details_state, true, R.drawable.ic_briefcase_outline, "Couldn't load job", "Please try again.", "Retry", v -> bindRecruiterJobDetails(view));
                    return;
                }
                setRecruiterSelectedJob(response.body());
                bindRecruiterJobDetailsContent(view, response.body());
                if (content != null) content.setVisibility(View.VISIBLE);
                showStatePanel(view, R.id.recruiter_job_details_state, false, 0, null, null, null, null);
            }
            @Override public void onFailure(Call<ApiModels.ApiJob> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_job_details_state, true, R.drawable.ic_briefcase_outline, "Couldn't load job", "Check your connection and retry.", "Retry", v -> bindRecruiterJobDetails(view));
            }
        });
    }

    private void bindRecruiterJobDetailsContent(View view, ApiModels.ApiJob job) {
        ((TextView) view.findViewById(R.id.recruiter_job_details_title)).setText(safeOr(job.title, "Job"));
        ((TextView) view.findViewById(R.id.recruiter_job_details_company)).setText(safeOr(job.company, "Company"));
        String role = CandidateJobsViewModel.readableRole(job.roleType);
        String loc = job.isRemote ? "Remote" : safeOr(job.location, "Location");
        ((TextView) view.findViewById(R.id.recruiter_job_details_meta)).setText(loc + " • " + role + " • " + formatSalaryForRecruiter(job));
        ((TextView) view.findViewById(R.id.recruiter_job_details_match_threshold)).setText("Min match score: " + job.minMatchScore + "%");
        ((TextView) view.findViewById(R.id.recruiter_job_details_created)).setText("Posted " + formatRelativeTime(parseBackendDate(job.createdAt)));
        renderSkillChipsRow((LinearLayout) view.findViewById(R.id.recruiter_job_details_skills_row), job.requiredSkills);
        view.findViewById(R.id.recruiter_job_details_view_applicants).setOnClickListener(v -> {
            setRecruiterSelectedJob(job);
            pushRecruiter(R.layout.fragment_recruiter_applicants_list);
        });
        final int backendJobId = parseBackendId(String.valueOf(job.id));
        view.findViewById(R.id.recruiter_job_details_close).setOnClickListener(v ->
                ApiClient.getInstance(requireContext()).api().closeRecruiterJob(backendJobId).enqueue(new Callback<ApiModels.ApiJob>() {
                    @Override public void onResponse(Call<ApiModels.ApiJob> call, Response<ApiModels.ApiJob> response) {
                        if (!isAdded()) return;
                        Toast.makeText(requireContext(), response.isSuccessful() ? "Job closed" : "Failed to close job", Toast.LENGTH_SHORT).show();
                        if (response.isSuccessful() && response.body() != null) setRecruiterSelectedJob(response.body());
                        bindRecruiterJobDetails(view);
                    }
                    @Override public void onFailure(Call<ApiModels.ApiJob> call, Throwable t) {
                        if (isAdded()) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                    }
                }));
        view.findViewById(R.id.recruiter_job_details_delete).setOnClickListener(v ->
                new AlertDialog.Builder(requireContext())
                        .setTitle("Delete job?")
                        .setMessage("This will remove the job from your active jobs list.")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Delete", (d,w) -> ApiClient.getInstance(requireContext()).api().deleteRecruiterJob(backendJobId).enqueue(new Callback<Void>() {
                            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                                if (!isAdded()) return;
                                Toast.makeText(requireContext(), response.isSuccessful() ? "Job deleted" : "Delete failed", Toast.LENGTH_SHORT).show();
                                if (response.isSuccessful()) {
                                    setRecruiterSelectedJob(null);
                                    requireActivity().onBackPressed();
                                }
                            }
                            @Override public void onFailure(Call<Void> call, Throwable t) {
                                if (isAdded()) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                            }
                        }))
                        .show());
    }

    private void bindRecruiterApplicantsList(View view) {
        RecyclerView applicantsList = view.findViewById(R.id.recruiter_applicants_list_recycler);
        TextView jobTitle = view.findViewById(R.id.recruiter_applicants_list_job_title);
        View loading = view.findViewById(R.id.recruiter_applicants_list_loading);
        MaterialToolbar toolbar = view.findViewById(R.id.recruiter_applicants_list_toolbar);
        if (toolbar != null) toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        if (applicantsList == null) return;
        ApplicantsAdapter adapter = new ApplicantsAdapter(item -> {
            recruiterSelectedApplicant = null;
            for (ApiModels.ApplicationDto dto : recruiterApplicantsCache) {
                if (dto != null && dto.id == item.applicationId) { setRecruiterSelectedApplicant(dto); break; }
            }
            if (recruiterSelectedApplicant == null) {
                ApiModels.ApplicationDto stub = new ApiModels.ApplicationDto();
                stub.id = item.applicationId;
                stub.candidateName = item.name;
                stub.status = item.status;
                setRecruiterSelectedApplicant(stub);
            }
            pushRecruiter(R.layout.fragment_recruiter_candidate_profile);
        });
        applicantsList.setAdapter(adapter);
        final List<ApplicantsAdapter.Item>[] loaded = new List[]{new ArrayList<>()};
        hydrateRecruiterSelectedJobFromCache();
        if (recruiterSelectedJob == null && getStoredRecruiterSelectedJobId() <= 0) {
            if (jobTitle != null) jobTitle.setVisibility(View.GONE);
            showStatePanel(view, R.id.recruiter_applicants_list_state, true, R.drawable.ic_people_outline, "No job selected", "Open a job and tap View Applicants.", null, null);
            return;
        }
        if (jobTitle != null) jobTitle.setVisibility(View.VISIBLE);
        loadApplicantsForSelectedJob(view, adapter, loaded, jobTitle, loading);
    }

    private void bindRecruiterOfferDetails(View view) {
        MaterialToolbar toolbar = view.findViewById(R.id.recruiter_offer_details_toolbar);
        if (toolbar != null) toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        View loading = view.findViewById(R.id.recruiter_offer_details_loading);
        View content = view.findViewById(R.id.recruiter_offer_details_card);
        Runnable bindContent = () -> {
            if (recruiterSelectedOffer == null) {
                showStatePanel(view, R.id.recruiter_offer_details_state, true, R.drawable.ic_offer, "Offer not found", "Select an offer again.", null, null);
                if (content != null) content.setVisibility(View.GONE);
                return;
            }
            if (content != null) content.setVisibility(View.VISIBLE);
            ((TextView) view.findViewById(R.id.recruiter_offer_details_candidate)).setText(safeOr(recruiterSelectedOffer.candidateName, "Candidate"));
            ((TextView) view.findViewById(R.id.recruiter_offer_details_job)).setText(safeOr(recruiterSelectedOffer.jobTitle, safeOr(recruiterSelectedOffer.role, "Role")));
            ((TextView) view.findViewById(R.id.recruiter_offer_details_status)).setText("Status: " + safeOr(recruiterSelectedOffer.status, "SENT"));
            ((TextView) view.findViewById(R.id.recruiter_offer_details_created)).setText("Created " + formatRelativeTime(parseBackendDate(recruiterSelectedOffer.createdAt)));
            view.findViewById(R.id.recruiter_offer_details_update_status).setOnClickListener(v -> showRecruiterOfferActionsDialog());
            showStatePanel(view, R.id.recruiter_offer_details_state, false, 0, null, null, null, null);
        };
        hydrateRecruiterSelectedOfferFromCache();
        if (recruiterSelectedOffer != null) {
            if (loading != null) loading.setVisibility(View.GONE);
            bindContent.run();
            return;
        }
        int offerId = getStoredRecruiterSelectedOfferId();
        if (offerId <= 0) {
            if (loading != null) loading.setVisibility(View.GONE);
            bindContent.run();
            return;
        }
        if (loading != null) loading.setVisibility(View.VISIBLE);
        ApiClient.getInstance(requireContext()).api().getRecruiterOfferDetail(offerId).enqueue(new Callback<ApiModels.RecruiterOfferDto>() {
            @Override public void onResponse(Call<ApiModels.RecruiterOfferDto> call, Response<ApiModels.RecruiterOfferDto> response) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    setRecruiterSelectedOffer(response.body());
                }
                bindContent.run();
            }
            @Override public void onFailure(Call<ApiModels.RecruiterOfferDto> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                bindContent.run();
            }
        });
    }

    private void showStatePanel(@NonNull View root, int includeId, boolean visible, int iconRes, @Nullable String title, @Nullable String subtitle, @Nullable String ctaText, @Nullable View.OnClickListener ctaListener) {
        View include = root.findViewById(includeId);
        if (include == null) return;
        include.setVisibility(visible ? View.VISIBLE : View.GONE);
        if (!visible) return;
        View stateContainer = include.findViewById(R.id.state_container);
        if (stateContainer instanceof LinearLayout) {
            ((LinearLayout) stateContainer).setGravity(includeId == R.id.recruiter_offers_state
                    ? (android.view.Gravity.TOP | android.view.Gravity.CENTER_HORIZONTAL)
                    : android.view.Gravity.CENTER);
        }
        ImageView icon = include.findViewById(R.id.state_icon);
        TextView titleView = include.findViewById(R.id.state_title);
        TextView subtitleView = include.findViewById(R.id.state_subtitle);
        View cta = include.findViewById(R.id.state_cta);
        if (icon != null && iconRes != 0) icon.setImageResource(iconRes);
        if (titleView != null) titleView.setText(safeOr(title, "Nothing here yet"));
        if (subtitleView != null) subtitleView.setText(safeOr(subtitle, ""));
        if (cta instanceof android.widget.Button) {
            android.widget.Button button = (android.widget.Button) cta;
            if (ctaText != null && !ctaText.trim().isEmpty()) {
                button.setVisibility(View.VISIBLE);
                button.setText(ctaText);
                button.setOnClickListener(ctaListener);
            } else {
                button.setVisibility(View.GONE);
                button.setOnClickListener(null);
            }
        }
    }

    private void renderSkillChipsRow(@Nullable LinearLayout row, @Nullable List<String> skills) {
        if (row == null) return;
        row.removeAllViews();
        List<String> clean = sanitizeSkillList(skills == null ? new ArrayList<>() : skills);
        int count = Math.min(6, clean.size());
        if (count == 0) {
            TextView t = new TextView(requireContext());
            t.setText("No skills listed");
            t.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary));
            row.addView(t);
            return;
        }
        for (int i = 0; i < count; i++) {
            TextView chip = new TextView(requireContext());
            chip.setText(clean.get(i));
            chip.setBackgroundResource(R.drawable.bg_chip_light);
            chip.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary));
            chip.setPadding(18, 8, 18, 8);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            if (i > 0) lp.setMarginStart(8);
            chip.setLayoutParams(lp);
            row.addView(chip);
        }
    }

    private String formatSalaryForRecruiter(@Nullable ApiModels.ApiJob job) {
        if (job == null) return "Salary not set";
        if (job.salaryMin != null && job.salaryMax != null) {
            String cur = (job.currency == null || job.currency.trim().isEmpty()) ? "INR" : job.currency;
            return cur + " " + job.salaryMin + " - " + job.salaryMax;
        }
        if (job.salaryMin != null) return String.valueOf(job.salaryMin);
        if (job.salaryMax != null) return String.valueOf(job.salaryMax);
        return "Salary not set";
    }

    private void bindRecruiterProfile(View view) {
        View editAction = view.findViewById(R.id.recruiter_profile_edit_action);
        if (editAction != null) {
            editAction.setOnClickListener(v -> pushRecruiter(R.layout.fragment_edit_profile));
        }

        TextView nameView = view.findViewById(R.id.recruiter_profile_name);
        TextView roleView = view.findViewById(R.id.recruiter_profile_role);
        TextView companyView = view.findViewById(R.id.recruiter_profile_company);
        View jobsLoading = view.findViewById(R.id.recruiter_profile_jobs_loading);
        if (jobsLoading != null) jobsLoading.setVisibility(View.VISIBLE);
        showStatePanel(view, R.id.recruiter_profile_jobs_state, false, 0, null, null, null, null);

        ApiClient.getInstance(requireContext()).api().getRecruiterProfile().enqueue(new Callback<ApiModels.RecruiterProfileResponse>() {
            @Override public void onResponse(Call<ApiModels.RecruiterProfileResponse> call, Response<ApiModels.RecruiterProfileResponse> response) {
                if (!isAdded() || !response.isSuccessful() || response.body() == null) return;
                ApiModels.RecruiterProfileResponse p = response.body();
                if (nameView != null) nameView.setText(safeOr(p.fullName, "Recruiter"));
                if (roleView != null) {
                    String title = safeOr(p.title, "Recruiter");
                    if (p.companyName != null && !p.companyName.trim().isEmpty()) {
                        title = title + " ? " + p.companyName.trim();
                    }
                    roleView.setText(title);
                }
                if (companyView != null) {
                    String secondary = joinNonEmpty(" - ", safeOr(p.email, ""), safeOr(p.phone, ""), safeOr(p.linkedinUrl, ""));
                    companyView.setText(secondary.isEmpty() ? "Recruiter account" : secondary);
                }
            }
            @Override public void onFailure(Call<ApiModels.RecruiterProfileResponse> call, Throwable t) { }
        });

        RecyclerView jobsList = view.findViewById(R.id.recruiter_profile_jobs_list);
        JobsAdapter jobsAdapter = new JobsAdapter(item -> {
            ApiModels.ApiJob selected = null;
            for (ApiModels.ApiJob job : recruiterJobsCache) {
                if (job != null && item.backendId != null && item.backendId.equals(String.valueOf(job.id))) {
                    selected = job;
                    break;
                }
            }
            if (selected != null) {
                setRecruiterSelectedJob(selected);
                pushRecruiter(R.layout.fragment_recruiter_job_details);
            } else {
                pushRecruiter(R.layout.fragment_recruiter_active_jobs);
            }
        });
        jobsAdapter.setItems(new ArrayList<>());
        jobsList.setAdapter(jobsAdapter);
        ApiClient.getInstance(requireContext()).api().getRecruiterJobs().enqueue(new Callback<List<ApiModels.ApiJob>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApiJob>> call, Response<List<ApiModels.ApiJob>> response) {
                if (!isAdded()) return;
                if (jobsLoading != null) jobsLoading.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    showStatePanel(view, R.id.recruiter_profile_jobs_state, true, R.drawable.ic_briefcase_outline,
                            "Couldn't load jobs", "Please try again.", "Retry", v -> bindRecruiterProfile(view));
                    return;
                }
                recruiterJobsCache.clear();
                recruiterJobsCache.addAll(response.body());
                List<JobsAdapter.Item> managedJobs = new ArrayList<>();
                for (ApiModels.ApiJob job : response.body()) {
                    String title = safeOr(job.title, "Role");
                    String subtitle = joinNonEmpty(" - ",
                            safeOr(job.company, "Company"),
                            (job.location == null || job.location.trim().isEmpty()) ? (job.isRemote ? "Remote" : "") : job.location,
                            (job.status == null ? "ACTIVE" : job.status).replace('_', ' '));
                    managedJobs.add(new JobsAdapter.Item(String.valueOf(job.id), title, subtitle));
                }
                jobsAdapter.setItems(managedJobs);
                if (managedJobs.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_profile_jobs_state, true, R.drawable.ic_briefcase_outline,
                            "No jobs yet", "Post a job to start managing applicants from here.", "Post New Job",
                            v -> pushRecruiter(R.layout.fragment_recruiter_post_job));
                } else {
                    showStatePanel(view, R.id.recruiter_profile_jobs_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApiJob>> call, Throwable t) {
                if (!isAdded()) return;
                if (jobsLoading != null) jobsLoading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_profile_jobs_state, true, R.drawable.ic_briefcase_outline,
                        "Couldn't load jobs", "Check your connection and retry.", "Retry", v -> bindRecruiterProfile(view));
            }
        });

        RecyclerView accountList = view.findViewById(R.id.recruiter_profile_account_list);
        List<SettingsListAdapter.SettingItem> accountItems = Arrays.asList(
                new SettingsListAdapter.SettingItem("Settings", R.drawable.ic_settings),
                new SettingsListAdapter.SettingItem("Notifications", R.drawable.ic_bell),
                new SettingsListAdapter.SettingItem("Help Center", R.drawable.ic_chat),
                new SettingsListAdapter.SettingItem("Logout", R.drawable.ic_logout)
        );
        accountList.setAdapter(new SettingsListAdapter(accountItems, this::onRecruiterAccountItemClick));
    }

    private void bindRecruiterNotifications(View view) {
        RecyclerView list = view.findViewById(R.id.recruiter_notifications_list);
        View loading = view.findViewById(R.id.recruiter_notifications_loading);
        NotificationListAdapter emptyAdapter = new NotificationListAdapter(new ArrayList<>());
        list.setAdapter(emptyAdapter);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        showStatePanel(view, R.id.recruiter_notifications_state, false, 0, null, null, null, null);
        ApiClient.getInstance(requireContext()).api().getMyNotifications().enqueue(new Callback<List<ApiModels.NotificationDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.NotificationDto>> call, Response<List<ApiModels.NotificationDto>> response) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    showStatePanel(view, R.id.recruiter_notifications_state, true, R.drawable.ic_bell,
                            "Couldn't load notifications", "Please try again.", "Retry", v -> bindRecruiterNotifications(view));
                    return;
                }
                List<NotificationListAdapter.NotificationItem> items = new ArrayList<>();
                for (ApiModels.NotificationDto dto : response.body()) {
                    items.add(new NotificationListAdapter.NotificationItem(
                            safeOr(dto.title, "Notification"),
                            safeOr(dto.body, ""),
                            formatRelativeTime(parseBackendDate(dto.createdAt))
                    ));
                }
                list.setAdapter(new NotificationListAdapter(items));
                if (items.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_notifications_state, true, R.drawable.ic_bell,
                            "No notifications yet", "Updates about applicants and offers will appear here.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_notifications_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void onFailure(Call<List<ApiModels.NotificationDto>> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_notifications_state, true, R.drawable.ic_bell,
                        "Couldn't load notifications", "Check your connection and retry.", "Retry", v -> bindRecruiterNotifications(view));
            }
        });
    }

    private void bindRecruiterHistory(View view) {
        RecyclerView list = view.findViewById(R.id.recruiter_history_list);
        if (list == null) {
            return;
        }
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.recruiter_history_toolbar);
        if (toolbar != null) {
            toolbar.setTitle("All Activity");
            toolbar.setNavigationOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());
        }
        ActivityAdapter adapter = new ActivityAdapter();
        adapter.submitList(new ArrayList<>());
        list.setAdapter(adapter);
        View loading = view.findViewById(R.id.recruiter_history_loading);
        if (loading != null) loading.setVisibility(View.VISIBLE);
        showStatePanel(view, R.id.recruiter_history_state, false, 0, null, null, null, null);
        ApiClient.getInstance(requireContext()).api().getRecruiterDashboard().enqueue(new Callback<ApiModels.RecruiterDashboardResponse>() {
            @Override
            public void onResponse(Call<ApiModels.RecruiterDashboardResponse> call, Response<ApiModels.RecruiterDashboardResponse> response) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    showStatePanel(view, R.id.recruiter_history_state, true, R.drawable.ic_clock,
                            "Couldn't load activity", "Please try again.", "Retry", v -> bindRecruiterHistory(view));
                    return;
                }
                List<ActivityAdapter.Item> items = new ArrayList<>();
                List<ApiModels.DashboardActivityItem> activity = response.body().recentActivity;
                if (activity != null) {
                    for (ApiModels.DashboardActivityItem it : activity) {
                        String title = it.title == null || it.title.trim().isEmpty() ? "Activity" : it.title;
                        String subtitle = it.body == null || it.body.trim().isEmpty()
                                ? formatRelativeTime(parseBackendDate(it.createdAt))
                                : it.body + " - " + formatRelativeTime(parseBackendDate(it.createdAt));
                        items.add(new ActivityAdapter.Item(title, subtitle));
                    }
                }
                adapter.submitList(items);
                if (items.isEmpty()) {
                    showStatePanel(view, R.id.recruiter_history_state, true, R.drawable.ic_clock,
                            "No activity yet", "Candidate actions and hiring updates will appear here.", null, null);
                } else {
                    showStatePanel(view, R.id.recruiter_history_state, false, 0, null, null, null, null);
                }
            }

            @Override
            public void onFailure(Call<ApiModels.RecruiterDashboardResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (loading != null) loading.setVisibility(View.GONE);
                showStatePanel(view, R.id.recruiter_history_state, true, R.drawable.ic_clock,
                        "Couldn't load activity", "Please try again.", "Retry", v -> bindRecruiterHistory(view));
            }
        });
    }

    private void bindRecruiterSettings(View view) {
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.recruiter_settings_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());
        }
        RecyclerView list = view.findViewById(R.id.recruiter_settings_list);
        List<SettingsListAdapter.SettingItem> items = Arrays.asList(
                new SettingsListAdapter.SettingItem("Hiring Notifications", R.drawable.ic_bell),
                new SettingsListAdapter.SettingItem("AI Sensitivity", R.drawable.ic_ai),
                new SettingsListAdapter.SettingItem("Team Access", R.drawable.ic_people),
                new SettingsListAdapter.SettingItem("Security", R.drawable.ic_settings)
        );
        list.setAdapter(new SettingsListAdapter(items, item -> handleRecruiterSettingClick(item, view)));
        View logout = view.findViewById(R.id.recruiter_settings_logout);
        if (logout != null) logout.setOnClickListener(v -> logoutToLogin());
    }

    private void bindRecruiterHelpCenter(View view) {
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.recruiter_help_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());
        }
        RecyclerView list = view.findViewById(R.id.recruiter_help_faq_list);
        List<SettingsListAdapter.SettingItem> items = Arrays.asList(
                new SettingsListAdapter.SettingItem("How do I shortlist candidates faster?", R.drawable.ic_question_mark),
                new SettingsListAdapter.SettingItem("Can I customize AI score thresholds?", R.drawable.ic_question_mark),
                new SettingsListAdapter.SettingItem("How do I resend offer letters?", R.drawable.ic_question_mark)
        );
        list.setAdapter(new SettingsListAdapter(items, item -> showRecruiterHelpAnswer(item.label)));
        View chat = view.findViewById(R.id.recruiter_help_live_chat);
        if (chat != null) {
            chat.setOnClickListener(v -> openRecruiterSupportEmail());
        }
        View logout = view.findViewById(R.id.recruiter_help_logout);
        if (logout != null) logout.setOnClickListener(v -> logoutToLogin());
    }

    private void bindEditProfile(View view) {
        View close = view.findViewById(R.id.edit_close);
        if (close != null) {
            close.setOnClickListener(v -> requireActivity().onBackPressed());
        }
        View photo = view.findViewById(R.id.edit_photo);
        if (photo != null) {
            photo.setOnClickListener(v -> Toast.makeText(requireContext(), "Profile photo upload is not available yet.", Toast.LENGTH_SHORT).show());
        }

        String role = com.simats.hireai.network.TokenStore.getInstance(requireContext()).getRole();
        if (!"RECRUITER".equalsIgnoreCase(role)) {
            return;
        }

        TextView pageTitle = view.findViewById(R.id.edit_title);
        TextView nameHeader = view.findViewById(R.id.edit_name);
        TextView handle = view.findViewById(R.id.edit_handle);
        TextView joined = view.findViewById(R.id.edit_joined);
        com.google.android.material.textfield.TextInputEditText nameInput = view.findViewById(R.id.edit_name_input);
        com.google.android.material.textfield.TextInputEditText bioInput = view.findViewById(R.id.edit_bio_input);
        com.google.android.material.textfield.TextInputEditText phoneInput = view.findViewById(R.id.edit_phone_input);
        com.google.android.material.textfield.TextInputEditText linkInput = view.findViewById(R.id.edit_link_input);
        com.google.android.material.button.MaterialButton save = view.findViewById(R.id.edit_save);

        if (pageTitle != null) pageTitle.setText("Edit Recruiter Profile");
        if (joined != null) joined.setText("Recruiter account");
        if (save != null) save.setEnabled(false);

        final ApiModels.RecruiterProfileResponse[] loadedProfile = new ApiModels.RecruiterProfileResponse[1];
        ApiClient.getInstance(requireContext()).api().getRecruiterProfile().enqueue(new Callback<ApiModels.RecruiterProfileResponse>() {
            @Override public void onResponse(Call<ApiModels.RecruiterProfileResponse> call, Response<ApiModels.RecruiterProfileResponse> response) {
                if (!isAdded()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    if (save != null) save.setEnabled(true);
                    Toast.makeText(requireContext(), "Failed to load recruiter profile", Toast.LENGTH_SHORT).show();
                    return;
                }
                loadedProfile[0] = response.body();
                ApiModels.RecruiterProfileResponse p = response.body();
                if (nameHeader != null) nameHeader.setText(safeOr(p.fullName, "Recruiter"));
                if (handle != null) handle.setText((p.email == null || p.email.trim().isEmpty()) ? "@recruiter" : p.email.trim());
                if (nameInput != null) nameInput.setText(safeOr(p.fullName, ""));
                if (bioInput != null) bioInput.setText(safeOr(p.bio, ""));
                if (phoneInput != null) phoneInput.setText(safeOr(p.phone, ""));
                if (linkInput != null) linkInput.setText(safeOr(p.linkedinUrl, ""));
                if (save != null) save.setEnabled(true);
            }

            @Override public void onFailure(Call<ApiModels.RecruiterProfileResponse> call, Throwable t) {
                if (!isAdded()) return;
                if (save != null) save.setEnabled(true);
                Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });

        if (save != null) {
            save.setOnClickListener(v -> {
                String fullName = nameInput != null && nameInput.getText() != null ? nameInput.getText().toString().trim() : "";
                String bio = bioInput != null && bioInput.getText() != null ? bioInput.getText().toString().trim() : "";
                String phone = phoneInput != null && phoneInput.getText() != null ? phoneInput.getText().toString().trim() : "";
                String linkedin = linkInput != null && linkInput.getText() != null ? linkInput.getText().toString().trim() : "";
                if (fullName.isEmpty()) {
                    Toast.makeText(requireContext(), "Name is required", Toast.LENGTH_SHORT).show();
                    return;
                }
                ApiModels.RecruiterProfileUpdateRequest req = new ApiModels.RecruiterProfileUpdateRequest();
                req.fullName = fullName;
                req.bio = bio;
                req.phone = phone;
                req.linkedinUrl = linkedin;
                req.companyName = loadedProfile[0] == null ? null : loadedProfile[0].companyName;
                req.title = loadedProfile[0] == null ? null : loadedProfile[0].title;
                save.setEnabled(false);
                ApiClient.getInstance(requireContext()).api().updateRecruiterProfile(req).enqueue(new Callback<ApiModels.RecruiterProfileResponse>() {
                    @Override public void onResponse(Call<ApiModels.RecruiterProfileResponse> call, Response<ApiModels.RecruiterProfileResponse> response) {
                        if (!isAdded()) return;
                        save.setEnabled(true);
                        if (!response.isSuccessful() || response.body() == null) {
                            Toast.makeText(requireContext(), "Failed to save profile", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        Toast.makeText(requireContext(), "Profile updated", Toast.LENGTH_SHORT).show();
                        requireActivity().onBackPressed();
                    }

                    @Override public void onFailure(Call<ApiModels.RecruiterProfileResponse> call, Throwable t) {
                        if (!isAdded()) return;
                        save.setEnabled(true);
                        Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                    }
                });
            });
        }
    }

    private void bindRecruiterPostJob(View view) {
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.recruiter_post_job_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
        }

        com.google.android.material.textfield.TextInputLayout titleLayout = view.findViewById(R.id.recruiter_job_title_layout);
        com.google.android.material.textfield.TextInputEditText titleInput = view.findViewById(R.id.recruiter_job_title_input);
        com.google.android.material.textfield.TextInputLayout companyLayout = view.findViewById(R.id.recruiter_job_company_layout);
        com.google.android.material.textfield.TextInputEditText companyInput = view.findViewById(R.id.recruiter_job_company_input);
        com.google.android.material.textfield.TextInputEditText deptInput = view.findViewById(R.id.recruiter_job_department_input);
        com.google.android.material.textfield.TextInputLayout locationLayout = view.findViewById(R.id.recruiter_job_location_layout);
        com.google.android.material.textfield.TextInputEditText locationInput = view.findViewById(R.id.recruiter_job_location_input);
        com.google.android.material.chip.ChipGroup roleTypeGroup = view.findViewById(R.id.recruiter_role_type_group);
        com.google.android.material.textfield.TextInputLayout skillLayout = view.findViewById(R.id.recruiter_skill_input_layout);
        com.google.android.material.textfield.TextInputEditText skillInput = view.findViewById(R.id.recruiter_skill_input);
        com.google.android.material.textfield.TextInputLayout salaryMinLayout = view.findViewById(R.id.recruiter_job_salary_min_layout);
        com.google.android.material.textfield.TextInputEditText salaryMinInput = view.findViewById(R.id.recruiter_job_salary_min_input);
        com.google.android.material.textfield.TextInputLayout salaryMaxLayout = view.findViewById(R.id.recruiter_job_salary_max_layout);
        com.google.android.material.textfield.TextInputEditText salaryMaxInput = view.findViewById(R.id.recruiter_job_salary_max_input);
        ChipGroup chipGroup = view.findViewById(R.id.recruiter_skills_chip_group);
        com.google.android.material.slider.Slider slider = view.findViewById(R.id.recruiter_job_match_slider);
        android.widget.TextView value = view.findViewById(R.id.recruiter_job_match_score_value);
        if (slider != null && value != null) {
            slider.addOnChangeListener((s, v, fromUser) -> value.setText(((int) v) + "%"));
            value.setText(((int) slider.getValue()) + "%");
        }

        List<String> selectedSkills = new ArrayList<>();
        Runnable addSkill = () -> {
            if (skillInput == null || chipGroup == null || skillLayout == null) {
                return;
            }
            String raw = skillInput.getText() == null ? "" : skillInput.getText().toString().trim();
            if (raw.isEmpty()) {
                return;
            }
            String normalized = raw.substring(0, 1).toUpperCase() + raw.substring(1);
            if (selectedSkills.contains(normalized)) {
                skillInput.setText("");
                return;
            }
            selectedSkills.add(normalized);
            Chip chip = new Chip(requireContext());
            chip.setText(normalized);
            chip.setCloseIconVisible(true);
            chip.setClickable(true);
            chip.setCheckable(false);
            chip.setEnsureMinTouchTargetSize(true);
            chip.setOnCloseIconClickListener(v -> {
                selectedSkills.remove(normalized);
                chipGroup.removeView(chip);
            });
            chipGroup.addView(chip);
            skillLayout.setError(null);
            skillInput.setText("");
        };

        if (skillLayout != null) {
            skillLayout.setEndIconOnClickListener(v -> addSkill.run());
        }
        if (skillInput != null) {
            skillInput.setOnEditorActionListener((textView, actionId, keyEvent) -> {
                addSkill.run();
                return true;
            });
        }

        view.findViewById(R.id.recruiter_publish_job).setOnClickListener(v -> {
            if (titleLayout != null) {
                titleLayout.setError(null);
            }
            if (companyLayout != null) {
                companyLayout.setError(null);
            }
            if (locationLayout != null) {
                locationLayout.setError(null);
            }
            if (skillLayout != null) {
                skillLayout.setError(null);
            }
            if (salaryMinLayout != null) {
                salaryMinLayout.setError(null);
            }
            if (salaryMaxLayout != null) {
                salaryMaxLayout.setError(null);
            }
            String title = titleInput != null && titleInput.getText() != null
                    ? titleInput.getText().toString().trim() : "";
            String company = companyInput != null && companyInput.getText() != null
                    ? companyInput.getText().toString().trim() : "";
            String department = deptInput != null && deptInput.getText() != null
                    ? deptInput.getText().toString().trim() : "";
            String location = locationInput != null && locationInput.getText() != null
                    ? locationInput.getText().toString().trim() : "";

            String roleType = null;
            int checkedRoleId = roleTypeGroup == null ? View.NO_ID : roleTypeGroup.getCheckedChipId();
            if (checkedRoleId == R.id.recruiter_role_full_time) {
                roleType = Job.ROLE_FULL_TIME;
            } else if (checkedRoleId == R.id.recruiter_role_contract) {
                roleType = Job.ROLE_CONTRACT;
            } else if (checkedRoleId == R.id.recruiter_role_part_time) {
                roleType = Job.ROLE_PART_TIME;
            } else if (checkedRoleId == R.id.recruiter_role_remote) {
                roleType = Job.ROLE_REMOTE;
            }

            if (title.isEmpty()) {
                if (titleLayout != null) {
                    titleLayout.setError("Job title is required");
                }
                return;
            }
            if (company.isEmpty()) {
                if (companyLayout != null) {
                    companyLayout.setError("Company is required");
                }
                return;
            }
            if (roleType == null) {
                Toast.makeText(requireContext(), "Select a role type", Toast.LENGTH_SHORT).show();
                return;
            }
            boolean isRemote = Job.ROLE_REMOTE.equals(roleType);
            if (!isRemote && location.isEmpty()) {
                if (locationLayout != null) {
                    locationLayout.setError("Location is required");
                }
                return;
            }
            if (selectedSkills.isEmpty()) {
                if (skillLayout != null) {
                    skillLayout.setError("Add at least one skill");
                }
                return;
            }

            Integer salaryMin = parseNullableInt(salaryMinInput == null ? null : salaryMinInput.getText());
            Integer salaryMax = parseNullableInt(salaryMaxInput == null ? null : salaryMaxInput.getText());
            if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
                if (salaryMaxLayout != null) {
                    salaryMaxLayout.setError("Max must be >= min");
                }
                return;
            }

            int minScore = slider == null ? 70 : (int) slider.getValue();
            Job job = JobsRepository.getInstance(requireContext()).createJob(
                    title,
                    company,
                    location,
                    isRemote,
                    roleType,
                    salaryMin,
                    salaryMax,
                    selectedSkills,
                    minScore
            );
            JobsRepository.getInstance(requireContext()).publishJob(job);
            JobsRepository.getInstance(requireContext()).publishJobToBackend(requireContext(), job);
            Snackbar.make(v, "Job published", Snackbar.LENGTH_SHORT).show();
            openRecruiterTab(R.id.nav_jobs);
        });
    }

    private void onRecruiterAccountItemClick(SettingsListAdapter.SettingItem item) {
        if ("Settings".equals(item.label)) {
            pushRecruiter(R.layout.fragment_recruiter_settings);
        } else if ("Notifications".equals(item.label)) {
            pushRecruiter(R.layout.fragment_recruiter_notifications);
        } else if ("Help Center".equals(item.label)) {
            pushRecruiter(R.layout.fragment_recruiter_help_center);
        } else if ("Logout".equals(item.label)) {
            logoutToLogin();
        }
    }

    private void handleRecruiterSettingClick(@NonNull SettingsListAdapter.SettingItem item, @NonNull View root) {
        if ("Hiring Notifications".equals(item.label)) {
            boolean current = getRecruiterSettingBool(KEY_RECRUITER_SETTING_HIRING_NOTIFS, true);
            String[] labels = new String[]{"Enabled", "Disabled"};
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Hiring Notifications")
                    .setSingleChoiceItems(labels, current ? 0 : 1, null)
                    .setPositiveButton("Save", (d, which) -> {
                        androidx.appcompat.app.AlertDialog dialog = (androidx.appcompat.app.AlertDialog) d;
                        int checked = dialog.getListView().getCheckedItemPosition();
                        setRecruiterSettingBool(KEY_RECRUITER_SETTING_HIRING_NOTIFS, checked != 1);
                        Toast.makeText(requireContext(), "Notification preference updated", Toast.LENGTH_SHORT).show();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            return;
        }
        if ("AI Sensitivity".equals(item.label)) {
            String[] labels = new String[]{"Balanced", "Conservative", "Aggressive"};
            String current = getRecruiterSettingString(KEY_RECRUITER_SETTING_AI_SENSITIVITY, "Balanced");
            int selected = 0;
            for (int i = 0; i < labels.length; i++) if (labels[i].equalsIgnoreCase(current)) selected = i;
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                    .setTitle("AI Sensitivity")
                    .setSingleChoiceItems(labels, selected, null)
                    .setPositiveButton("Save", (d, which) -> {
                        androidx.appcompat.app.AlertDialog dialog = (androidx.appcompat.app.AlertDialog) d;
                        int checked = dialog.getListView().getCheckedItemPosition();
                        if (checked < 0) checked = 0;
                        setRecruiterSettingString(KEY_RECRUITER_SETTING_AI_SENSITIVITY, labels[checked]);
                        Toast.makeText(requireContext(), "AI sensitivity saved", Toast.LENGTH_SHORT).show();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            return;
        }
        if ("Team Access".equals(item.label)) {
            String access = getRecruiterSettingString(KEY_RECRUITER_SETTING_TEAM_ACCESS, "Owner only");
            String[] labels = new String[]{"Owner only", "Owner + Recruiters", "Restricted reviewers"};
            int selected = 0;
            for (int i = 0; i < labels.length; i++) if (labels[i].equalsIgnoreCase(access)) selected = i;
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Team Access")
                    .setMessage("Control who can view candidates and update job pipelines from this device.")
                    .setSingleChoiceItems(labels, selected, null)
                    .setPositiveButton("Save", (d, which) -> {
                        androidx.appcompat.app.AlertDialog dialog = (androidx.appcompat.app.AlertDialog) d;
                        int checked = dialog.getListView().getCheckedItemPosition();
                        if (checked < 0) checked = 0;
                        setRecruiterSettingString(KEY_RECRUITER_SETTING_TEAM_ACCESS, labels[checked]);
                        Toast.makeText(requireContext(), "Team access updated", Toast.LENGTH_SHORT).show();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            return;
        }
        if ("Security".equals(item.label)) {
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Security")
                    .setMessage("Session and device security options are managed server-side. You can open notifications to review activity or logout from this device now.")
                    .setPositiveButton("Open Notifications", (d, w) -> pushRecruiter(R.layout.fragment_recruiter_notifications))
                    .setNeutralButton("Logout", (d, w) -> logoutToLogin())
                    .setNegativeButton("Close", null)
                    .show();
        }
    }

    private void showRecruiterHelpAnswer(@NonNull String question) {
        String answer;
        if (question.contains("shortlist")) {
            answer = "Use Match Score and assessment outcomes first. Open the candidate profile, review strengths and round results, then shortlist from the Take Action screen.";
        } else if (question.contains("thresholds")) {
            answer = "Yes. Set the minimum match score when publishing or editing a job. Candidate pass/fail on match score is evaluated against that recruiter threshold.";
        } else if (question.contains("resend offer")) {
            answer = "Open Offers, select the candidate offer, and update the offer status or share the generated signed PDF. Offer milestones also create notifications for both sides.";
        } else {
            answer = "Help content will be expanded soon.";
        }
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle(question)
                .setMessage(answer)
                .setPositiveButton("Got it", null)
                .show();
    }

    private void openRecruiterSupportEmail() {
        try {
            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_SENDTO);
            intent.setData(android.net.Uri.parse("mailto:support@hireai.app"));
            intent.putExtra(android.content.Intent.EXTRA_SUBJECT, "HireAI Recruiter Support");
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(requireContext(), "No email app found", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean getRecruiterSettingBool(@NonNull String key, boolean fallback) {
        if (getContext() == null) return fallback;
        return requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .getBoolean(key, fallback);
    }

    private void setRecruiterSettingBool(@NonNull String key, boolean value) {
        if (getContext() == null) return;
        requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .edit().putBoolean(key, value).apply();
    }

    @NonNull
    private String getRecruiterSettingString(@NonNull String key, @NonNull String fallback) {
        if (getContext() == null) return fallback;
        String value = requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .getString(key, fallback);
        return value == null ? fallback : value;
    }

    private void setRecruiterSettingString(@NonNull String key, @NonNull String value) {
        if (getContext() == null) return;
        requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .edit().putString(key, value).apply();
    }

    private Integer parseNullableInt(CharSequence text) {
        if (text == null) {
            return null;
        }
        String raw = text.toString().trim();
        if (raw.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException ignore) {
            return null;
        }
    }

    private int statusToPercent(String status) {
        if ("TECH_PASS".equals(status) || "OFFER_ACCEPTED".equals(status)) return 95;
        if ("HR_PASS".equals(status) || "TECH_READY".equals(status)) return 88;
        if ("MATCH_PASS".equals(status) || "HR_READY".equals(status)) return 80;
        if ("MATCH_FAIL".equals(status) || "HR_FAIL".equals(status) || "TECH_FAIL".equals(status)) return 45;
        return 65;
    }

    private OffersAdapter.Status mapOfferStatus(String status) {
        if (status == null) return OffersAdapter.Status.PENDING;
        if ("NEGOTIATING".equalsIgnoreCase(status)) return OffersAdapter.Status.NEGOTIATING;
        if ("SIGNED".equalsIgnoreCase(status) || "ACCEPTED".equalsIgnoreCase(status)) return OffersAdapter.Status.SIGNED;
        return OffersAdapter.Status.PENDING;
    }

    private void observeSharedCandidateState(@NonNull View root) {
        if (getContext() == null || !isCandidateRootLayout(layoutId)) {
            return;
        }
        CandidateUserStateRepository.getInstance(requireContext())
                .stateVersion()
                .observe(getViewLifecycleOwner(), ignored -> {
                    if (!isAdded() || getView() != root) {
                        return;
                    }
                    if (layoutId == R.layout.fragment_home) {
                        renderCandidateHome(root);
                    } else if (layoutId == R.layout.fragment_candidate_jobs) {
                        updateJobsResumeBanner(root);
                    } else if (layoutId == R.layout.fragment_profile) {
                        bindCandidateProfileFromLocal(root);
                    }
                });
    }

    private void notifyCandidateStateChanged() {
        if (getContext() == null) {
            return;
        }
        CandidateUserStateRepository.getInstance(requireContext()).notifyStateChanged();
    }

    private boolean isCandidateRootLayout(int id) {
        return id == R.layout.fragment_home
                || id == R.layout.fragment_candidate_jobs
                || id == R.layout.fragment_profile
                || id == R.layout.fragment_candidate_applications
                || id == R.layout.fragment_select_tech_stack;
    }

    private void pushRecruiter(@LayoutRes int targetLayout) {
        if (getActivity() instanceof RecruiterActivity) {
            ((RecruiterActivity) getActivity()).pushScreen(targetLayout);
        } else if (getActivity() instanceof RecruiterDetailActivity) {
            ((RecruiterDetailActivity) getActivity()).pushScreen(targetLayout);
        }
    }

    private void pushCandidate(@LayoutRes int targetLayout) {
        if (getActivity() instanceof CandidateActivity) {
            ((CandidateActivity) getActivity()).pushScreen(targetLayout);
        } else if (getActivity() instanceof CandidateDetailActivity) {
            ((CandidateDetailActivity) getActivity()).pushScreen(targetLayout);
        }
    }

    private void openCandidateTab(int tabId) {
        if (getActivity() instanceof CandidateActivity) {
            ((CandidateActivity) getActivity()).navigateToRootTab(tabId);
        } else if (getActivity() instanceof CandidateDetailActivity) {
            ((CandidateDetailActivity) getActivity()).navigateToRootTab(tabId);
        }
    }

    private void openRecruiterTab(int tabId) {
        if (getActivity() instanceof RecruiterActivity) {
            ((RecruiterActivity) getActivity()).navigateToRootTab(tabId);
        } else if (getActivity() instanceof RecruiterDetailActivity) {
            ((RecruiterDetailActivity) getActivity()).navigateToRootTab(tabId);
        }
    }

    private void setRecruiterSelectedJob(@Nullable ApiModels.ApiJob job) {
        recruiterSelectedJob = job;
        if (getContext() == null) return;
        int id = (job == null) ? -1 : parseBackendId(String.valueOf(job.id));
        requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .edit()
                .putInt(KEY_RECRUITER_SELECTED_JOB_ID, id)
                .apply();
    }

    private void setRecruiterSelectedApplicant(@Nullable ApiModels.ApplicationDto app) {
        recruiterSelectedApplicant = app;
        if (getContext() == null) return;
        int id = app == null ? -1 : app.id;
        requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .edit()
                .putInt(KEY_RECRUITER_SELECTED_APPLICATION_ID, id)
                .apply();
    }

    private void setRecruiterSelectedOffer(@Nullable ApiModels.RecruiterOfferDto offer) {
        recruiterSelectedOffer = offer;
        if (getContext() == null) return;
        int id = offer == null ? -1 : offer.id;
        requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .edit()
                .putInt(KEY_RECRUITER_SELECTED_OFFER_ID, id)
                .apply();
    }

    private int getStoredRecruiterSelectedJobId() {
        if (getContext() == null) return -1;
        return requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .getInt(KEY_RECRUITER_SELECTED_JOB_ID, -1);
    }

    private int getStoredRecruiterSelectedApplicationId() {
        if (getContext() == null) return -1;
        return requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .getInt(KEY_RECRUITER_SELECTED_APPLICATION_ID, -1);
    }

    private int getStoredRecruiterSelectedOfferId() {
        if (getContext() == null) return -1;
        return requireContext().getSharedPreferences(RECRUITER_UI_PREFS, android.content.Context.MODE_PRIVATE)
                .getInt(KEY_RECRUITER_SELECTED_OFFER_ID, -1);
    }

    private void hydrateRecruiterSelectedJobFromCache() {
        if (recruiterSelectedJob != null) return;
        int storedId = getStoredRecruiterSelectedJobId();
        if (storedId <= 0) return;
        for (ApiModels.ApiJob job : recruiterJobsCache) {
            if (job != null && parseBackendId(String.valueOf(job.id)) == storedId) {
                recruiterSelectedJob = job;
                return;
            }
        }
    }

    private void hydrateRecruiterSelectedApplicantFromCache() {
        if (recruiterSelectedApplicant != null) return;
        int storedId = getStoredRecruiterSelectedApplicationId();
        if (storedId <= 0) return;
        for (ApiModels.ApplicationDto dto : recruiterApplicantsCache) {
            if (dto != null && dto.id == storedId) {
                recruiterSelectedApplicant = dto;
                return;
            }
        }
    }

    private void hydrateRecruiterSelectedOfferFromCache() {
        if (recruiterSelectedOffer != null) return;
        int storedId = getStoredRecruiterSelectedOfferId();
        if (storedId <= 0) return;
        for (ApiModels.RecruiterOfferDto dto : recruiterOfferCache) {
            if (dto != null && dto.id == storedId) {
                recruiterSelectedOffer = dto;
                return;
            }
        }
    }
    private void jobsListModeForApplicants(
            View root,
            RecyclerView applicantsList,
            ApplicantsAdapter applicantsAdapter,
            List<ApplicantsAdapter.Item>[] loadedApplicantsRef,
            @Nullable TextView titleView,
            boolean openApplicantsListScreen,
            @Nullable View loadingView
    ) {
        JobsAdapter jobsAdapter = new JobsAdapter(item -> {
            int backendJobId = parseBackendId(item.backendId);
            if (backendJobId <= 0) return;
            for (ApiModels.ApiJob job : recruiterJobsCache) {
                if (job != null && String.valueOf(job.id).equals(item.backendId)) {
                    setRecruiterSelectedJob(job);
                    break;
                }
            }
            if (openApplicantsListScreen) {
                pushRecruiter(R.layout.fragment_recruiter_applicants_list);
                return;
            }
            applicantsList.setAdapter(applicantsAdapter);
            loadApplicantsForSelectedJob(root, applicantsAdapter, loadedApplicantsRef, titleView, loadingView);
        });
        applicantsList.setAdapter(jobsAdapter);
        if (titleView != null) titleView.setText("Select a job");
        if (loadingView != null) loadingView.setVisibility(View.VISIBLE);
        if (root.findViewById(R.id.recruiter_applicants_state) != null) {
            showStatePanel(root, R.id.recruiter_applicants_state, false, 0, null, null, null, null);
        }
        ApiClient.getInstance(requireContext()).api().getRecruiterJobs().enqueue(new Callback<List<ApiModels.ApiJob>>() {
            @Override public void onResponse(Call<List<ApiModels.ApiJob>> call, Response<List<ApiModels.ApiJob>> response) {
                if (!isAdded()) return;
                if (loadingView != null) loadingView.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    if (root.findViewById(R.id.recruiter_applicants_state) != null) {
                        showStatePanel(root, R.id.recruiter_applicants_state, true, R.drawable.ic_people_outline, "Couldn't load jobs", "Please try again.", "Retry", v -> bindRecruiterApplicants(root));
                    }
                    return;
                }
                recruiterJobsCache.clear();
                recruiterJobsCache.addAll(response.body());
                List<JobsAdapter.Item> items = new ArrayList<>();
                for (ApiModels.ApiJob j : response.body()) {
                    String subtitle = safeOr(j.company, "Company") + " - " + safeOr(j.status, "ACTIVE");
                    items.add(new JobsAdapter.Item(String.valueOf(j.id), safeOr(j.title, "Job"), subtitle));
                }
                jobsAdapter.setItems(items);
                if (root.findViewById(R.id.recruiter_applicants_state) != null) {
                    if (items.isEmpty()) {
                        showStatePanel(root, R.id.recruiter_applicants_state, true, R.drawable.ic_people_outline, "No jobs yet", "Post a job first to review applicants.", "Post New Job", v -> pushRecruiter(R.layout.fragment_recruiter_post_job));
                    } else {
                        showStatePanel(root, R.id.recruiter_applicants_state, false, 0, null, null, null, null);
                    }
                }
                if (!openApplicantsListScreen && recruiterSelectedJob != null) {
                    applicantsList.setAdapter(applicantsAdapter);
                    loadApplicantsForSelectedJob(root, applicantsAdapter, loadedApplicantsRef, titleView, loadingView);
                }
            }
            @Override public void onFailure(Call<List<ApiModels.ApiJob>> call, Throwable t) {
                if (!isAdded()) return;
                if (loadingView != null) loadingView.setVisibility(View.GONE);
                if (root.findViewById(R.id.recruiter_applicants_state) != null) {
                    showStatePanel(root, R.id.recruiter_applicants_state, true, R.drawable.ic_people_outline, "Couldn't load jobs", "Check your connection and retry.", "Retry", v -> bindRecruiterApplicants(root));
                }
            }
        });
    }

    private void loadApplicantsForSelectedJob(View root, ApplicantsAdapter adapter, List<ApplicantsAdapter.Item>[] loadedApplicantsRef, @Nullable TextView titleView, @Nullable View loadingView) {
        hydrateRecruiterSelectedJobFromCache();
        int jobId = recruiterSelectedJob == null ? getStoredRecruiterSelectedJobId() : parseBackendId(String.valueOf(recruiterSelectedJob.id));
        if (jobId <= 0) return;
        if (titleView != null) {
            String title = recruiterSelectedJob == null ? "Applicants" : safeOr(recruiterSelectedJob.title, "Applicants");
            titleView.setText(title);
        }
        if (loadingView != null) loadingView.setVisibility(View.VISIBLE);
        int stateId = root.findViewById(R.id.recruiter_applicants_list_state) != null ? R.id.recruiter_applicants_list_state : R.id.recruiter_applicants_state;
        if (root.findViewById(stateId) != null) showStatePanel(root, stateId, false, 0, null, null, null, null);
        ApiClient.getInstance(requireContext()).api().getRecruiterJobApplicants(jobId).enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
            @Override public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                if (!isAdded()) return;
                if (loadingView != null) loadingView.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null) {
                    if (root.findViewById(stateId) != null) showStatePanel(root, stateId, true, R.drawable.ic_people_outline, "Couldn't load applicants", "Please try again.", "Retry", v -> loadApplicantsForSelectedJob(root, adapter, loadedApplicantsRef, titleView, loadingView));
                    return;
                }
                recruiterApplicantsCache.clear();
                recruiterApplicantsCache.addAll(response.body());
                List<ApplicantsAdapter.Item> rows = new ArrayList<>();
                for (ApiModels.ApplicationDto dto : response.body()) {
                    int pct = (dto.matchScore != null && dto.matchScore > 0) ? dto.matchScore : statusToPercent(dto.status);
                    rows.add(new ApplicantsAdapter.Item(
                            dto.id,
                            dto.candidateId == null ? 0 : dto.candidateId,
                            safeOr(dto.candidateName, "Candidate"),
                            (safeOr(dto.status, "APPLIED").replace('_', ' ') + " - " + formatRelativeTime(parseBackendDate(dto.appliedAt))),
                            safeOr(dto.status, "APPLIED"),
                            pct,
                            R.drawable.ic_profile
                    ));
                }
                loadedApplicantsRef[0] = rows;
                adapter.submitList(new ArrayList<>(rows));
                if (root.findViewById(stateId) != null) {
                    if (rows.isEmpty()) {
                        showStatePanel(root, stateId, true, R.drawable.ic_people_outline, "No applicants yet", "Candidates who apply to this job will appear here.", null, null);
                    } else {
                        showStatePanel(root, stateId, false, 0, null, null, null, null);
                    }
                }
            }
            @Override public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) {
                if (!isAdded()) return;
                if (loadingView != null) loadingView.setVisibility(View.GONE);
                if (root.findViewById(stateId) != null) showStatePanel(root, stateId, true, R.drawable.ic_people_outline, "Couldn't load applicants", "Check your connection and retry.", "Retry", v -> loadApplicantsForSelectedJob(root, adapter, loadedApplicantsRef, titleView, loadingView));
            }
        });
    }

    @Nullable
    private ApiModels.RecruiterOfferDto findOfferById(int offerId) {
        for (ApiModels.RecruiterOfferDto dto : recruiterOfferCache) {
            if (dto != null && dto.id == offerId) return dto;
        }
        return null;
    }

    private void showRecruiterOfferActionsDialog() {
        if (recruiterSelectedOffer == null || getContext() == null) return;
        String[] labels = new String[]{"Pending", "Negotiating", "Signed"};
        String[] statusValues = new String[]{"SENT", "NEGOTIATING", "SIGNED"};
        new AlertDialog.Builder(requireContext())
                .setTitle("Offer: " + safeOr(recruiterSelectedOffer.candidateName, "Candidate"))
                .setItems(labels, (dialog, which) -> {
                    java.util.Map<String, String> body = new java.util.HashMap<>();
                    body.put("status", statusValues[which]);
                    ApiClient.getInstance(requireContext()).api().patchRecruiterOffer(recruiterSelectedOffer.id, body)
                            .enqueue(new Callback<ApiModels.RecruiterOfferDto>() {
                                @Override public void onResponse(Call<ApiModels.RecruiterOfferDto> call, Response<ApiModels.RecruiterOfferDto> response) {
                                    if (!isAdded()) return;
                                    Toast.makeText(requireContext(), response.isSuccessful() ? "Offer updated" : "Failed to update", Toast.LENGTH_SHORT).show();
                                    if (response.isSuccessful() && response.body() != null) {
                                        recruiterSelectedOffer = response.body();
                                    }
                                    if (getView() != null) {
                                        if (layoutId == R.layout.fragment_recruiter_offer_details) {
                                            bindRecruiterOfferDetails(getView());
                                        } else {
                                            bindRecruiterOffers(getView());
                                        }
                                    }
                                }
                                @Override public void onFailure(Call<ApiModels.RecruiterOfferDto> call, Throwable t) {
                                    if (isAdded()) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                                }
                            });
                })
                .setNegativeButton("Close", null)
                .show();
    }

    private void tintTextChip(@NonNull TextView chip, @Nullable String statusRaw) {
        String status = safeOr(statusRaw, "").toUpperCase(Locale.US);
        int bg;
        int fg;
        if (status.contains("FAIL")) {
            bg = 0xFFFFF1F1; fg = 0xFFC62828;
        } else if (status.startsWith("OFFER_ACCEPTED")) {
            bg = 0xFFEAF7EF; fg = 0xFF0F7A3A;
        } else if (status.startsWith("OFFER_")) {
            bg = 0xFFEAF2FF; fg = 0xFF1E5EFF;
        } else if (status.contains("PASS") || status.contains("READY") || status.contains("STARTED")) {
            bg = 0xFFEAF2FF; fg = 0xFF1E5EFF;
        } else {
            bg = 0xFFF2F4F7; fg = 0xFF4B5563;
        }
        android.graphics.drawable.GradientDrawable d = new android.graphics.drawable.GradientDrawable();
        d.setCornerRadius(dp(999));
        d.setColor(bg);
        chip.setBackground(d);
        chip.setTextColor(fg);
    }

    @NonNull
    private String recruiterActionGuidance(@NonNull String status) {
        if (status.startsWith("OFFER_ACCEPTED")) return "Candidate has accepted the offer. Screening actions are closed.";
        if (status.startsWith("OFFER_")) return "Offer is already in progress. Manage it from the Offers tab.";
        if (status.contains("TECH_FAIL")) return "Candidate did not clear the technical round. Review assessment outcome instead of taking screening action.";
        if (status.contains("HR_FAIL")) return "Candidate did not clear the HR round. Review responses and recruiter notes before any next step.";
        if (status.contains("MATCH_FAIL")) return "Candidate did not clear the match criteria. Screening actions are not available for this application.";
        if (status.contains("TECH_PASS")) return "Candidate has cleared the technical round. You can proceed with offer actions.";
        if (status.contains("HR_PASS") || status.contains("TECH_READY") || status.contains("HR_READY") || status.contains("STARTED") || status.contains("MATCH_PASS") || status.equals("APPLIED")) {
            return "Review the candidate profile, round outcomes, and then shortlist or reject.";
        }
        return "Review candidate stage and choose the next valid action.";
    }

    private void performRecruiterApplicantAction(String action) {
        if (recruiterSelectedApplicant == null || !isAdded()) {
            Toast.makeText(requireContext(), "No applicant selected", Toast.LENGTH_SHORT).show();
            return;
        }
        View root = getView();
        View acceptBtn = root == null ? null : root.findViewById(R.id.recruiter_candidate_accept_button);
        View rejectBtn = root == null ? null : root.findViewById(R.id.recruiter_candidate_reject_button);
        if (acceptBtn != null) acceptBtn.setEnabled(false);
        if (rejectBtn != null) rejectBtn.setEnabled(false);
        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("action", action);
        ApiClient.getInstance(requireContext()).api().recruiterApplicationAction(recruiterSelectedApplicant.id, body)
                .enqueue(new Callback<ApiModels.ApplicationDto>() {
                    @Override public void onResponse(Call<ApiModels.ApplicationDto> call, Response<ApiModels.ApplicationDto> response) {
                        if (!isAdded()) return;
                        if (response.isSuccessful() && response.body() != null) {
                            recruiterSelectedApplicant = response.body();
                            setRecruiterSelectedApplicant(response.body());
                            if (recruiterSelectedCandidateProfile != null) {
                                recruiterSelectedCandidateProfile.applicationStatus = safeOr(response.body().status, recruiterSelectedCandidateProfile.applicationStatus);
                            }
                            for (int i = 0; i < recruiterApplicantsCache.size(); i++) {
                                ApiModels.ApplicationDto dto = recruiterApplicantsCache.get(i);
                                if (dto != null && dto.id == response.body().id) {
                                    recruiterApplicantsCache.set(i, response.body());
                                    break;
                                }
                            }
                        }
                        if (acceptBtn != null) acceptBtn.setEnabled(true);
                        if (rejectBtn != null) rejectBtn.setEnabled(true);
                        Toast.makeText(requireContext(), response.isSuccessful() ? ("shortlist".equals(action) ? "Candidate shortlisted and notified" : "Candidate rejected and notified") : "Action failed", Toast.LENGTH_SHORT).show();
                        if (response.isSuccessful() && root != null) {
                            notifyCandidateStateChanged();
                        }
                        requireActivity().onBackPressed();
                    }
                    @Override public void onFailure(Call<ApiModels.ApplicationDto> call, Throwable t) {
                        if (acceptBtn != null) acceptBtn.setEnabled(true);
                        if (rejectBtn != null) rejectBtn.setEnabled(true);
                        if (isAdded()) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @NonNull
    private String safeOr(@Nullable String value, @NonNull String fallback) {
        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
            return fallback;
        }
        return value.trim();
    }

    @NonNull
    private String joinNonEmpty(@NonNull String separator, @Nullable String... values) {
        List<String> parts = new ArrayList<>();
        if (values != null) {
            for (String v : values) {
                if (v != null && !v.trim().isEmpty()) parts.add(v.trim());
            }
        }
        return parts.isEmpty() ? "" : TextUtils.join(separator, parts);
    }

    private int dp(int value) {
        return Math.round(value * requireContext().getResources().getDisplayMetrics().density);
    }

    private void ensureBackOnDetailToolbar(View view) {
        if (isRootTabLayout(layoutId)) {
            return;
        }
        MaterialToolbar toolbar = findFirstToolbar(view);
        if (toolbar == null) {
            return;
        }
        if (toolbar.getNavigationIcon() == null) {
            toolbar.setNavigationIcon(R.drawable.ic_back);
        }
        toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());
    }

    private boolean isRootTabLayout(int id) {
        return id == R.layout.fragment_home
                || id == R.layout.fragment_candidate_jobs
                || id == R.layout.fragment_candidate_applications
                || id == R.layout.fragment_profile
                || id == R.layout.fragment_recruiter_dashboard
                || id == R.layout.fragment_recruiter_active_jobs
                || id == R.layout.fragment_recruiter_applicants
                || id == R.layout.fragment_recruiter_offers
                || id == R.layout.fragment_recruiter_profile
                || id == R.layout.fragment_select_tech_stack;
    }

    private MaterialToolbar findFirstToolbar(View view) {
        if (view instanceof MaterialToolbar) {
            return (MaterialToolbar) view;
        }
        if (!(view instanceof ViewGroup)) {
            return null;
        }
        ViewGroup vg = (ViewGroup) view;
        for (int i = 0; i < vg.getChildCount(); i++) {
            MaterialToolbar toolbar = findFirstToolbar(vg.getChildAt(i));
            if (toolbar != null) {
                return toolbar;
            }
        }
        return null;
    }

    private void logoutToLogin() {
        if (getContext() == null) {
            return;
        }
        new CandidateStateStore(requireContext()).clearCandidateSession();
        new com.simats.hireai.network.AuthRepository(requireContext()).logout();
        Intent intent = new Intent(getContext(), LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    private void showKeyboard(View target) {
        if (getContext() == null) {
            return;
        }
        InputMethodManager imm = (InputMethodManager) getContext().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
        if (imm != null) {
            imm.showSoftInput(target, InputMethodManager.SHOW_IMPLICIT);
        }
    }

    private int parseBackendId(String id) {
        if (id == null) return -1;
        try {
            return Integer.parseInt(id.trim());
        } catch (Exception ignore) {
            return -1;
        }
    }

    private long parseBackendDate(String value) {
        if (value == null || value.trim().isEmpty()) {
            return System.currentTimeMillis();
        }
        try {
            String normalized = value.replace("Z", "+0000");
            if (normalized.length() > 5 && normalized.charAt(normalized.length() - 3) == ':') {
                normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);
            }
            java.text.SimpleDateFormat parser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", java.util.Locale.US);
            return parser.parse(normalized).getTime();
        } catch (Exception ignored) {
            try {
                String normalized = value.replace("Z", "+0000");
                if (normalized.length() > 5 && normalized.charAt(normalized.length() - 3) == ':') {
                    normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);
                }
                java.text.SimpleDateFormat parser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", java.util.Locale.US);
                return parser.parse(normalized).getTime();
            } catch (Exception e) {
                return System.currentTimeMillis();
            }
        }
    }

    private String formatRelativeTime(long timestamp) {
        long diff = Math.max(0L, System.currentTimeMillis() - timestamp);
        long minutes = diff / (60 * 1000L);
        if (minutes < 1) {
            return "just now";
        }
        if (minutes < 60) {
            return minutes + "m ago";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = hours / 24;
        if (days < 7) {
            return days + "d ago";
        }
        long weeks = days / 7;
        return weeks + "w ago";
    }

    private String formatFriendlyDateTime(@Nullable String backendIso) {
        if (backendIso == null || backendIso.trim().isEmpty()) {
            return "";
        }
        long ts = parseBackendDate(backendIso);
        String relative = formatRelativeTime(ts);
        java.text.SimpleDateFormat format = new java.text.SimpleDateFormat("dd MMM yyyy, hh:mm a", java.util.Locale.US);
        return "Updated " + relative + " (" + format.format(new java.util.Date(ts)) + ")";
    }

    private void loadRecruiterApplicantsDashboard(List<Integer> jobIds, java.util.function.Consumer<List<ApiModels.ApplicationDto>> onDone) {
        if (jobIds == null || jobIds.isEmpty()) {
            onDone.accept(new ArrayList<>());
            return;
        }
        List<ApiModels.ApplicationDto> aggregated = new ArrayList<>();
        loadRecruiterApplicantsDashboardAt(jobIds, 0, aggregated, onDone);
    }

    private void loadRecruiterApplicantsDashboardAt(
            List<Integer> jobIds,
            int index,
            List<ApiModels.ApplicationDto> aggregated,
            java.util.function.Consumer<List<ApiModels.ApplicationDto>> onDone
    ) {
        if (!isAdded()) {
            return;
        }
        if (index >= jobIds.size()) {
            onDone.accept(aggregated);
            return;
        }
        int jobId = jobIds.get(index);
        ApiClient.getInstance(requireContext()).api().getRecruiterJobApplicants(jobId).enqueue(new Callback<List<ApiModels.ApplicationDto>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApplicationDto>> call, Response<List<ApiModels.ApplicationDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    aggregated.addAll(response.body());
                }
                loadRecruiterApplicantsDashboardAt(jobIds, index + 1, aggregated, onDone);
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApplicationDto>> call, Throwable t) {
                loadRecruiterApplicantsDashboardAt(jobIds, index + 1, aggregated, onDone);
            }
        });
    }

    private void hideKeyboard(View target) {
        if (getContext() == null) {
            return;
        }
        InputMethodManager imm = (InputMethodManager) getContext().getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
        if (imm != null) {
            imm.hideSoftInputFromWindow(target.getWindowToken(), 0);
        }
    }
}
