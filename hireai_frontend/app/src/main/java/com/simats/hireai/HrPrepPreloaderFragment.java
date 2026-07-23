package com.simats.hireai;

import android.animation.ObjectAnimator;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.transition.TransitionManager;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.transition.MaterialFadeThrough;
import com.google.android.material.transition.MaterialSharedAxis;
import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HrPrepPreloaderFragment extends Fragment {
    private static final String ARG_JOB_ID = "job_id";
    private static final String ARG_ASSESSMENT_TYPE = "assessment_type";
    private static final String STATE_STEP = "state_step";
    private static final long STEP_ONE_MS = 1200L;
    private static final long STEP_TWO_MS = 1600L;
    private static final long STEP_THREE_MIN_VISIBLE_MS = 1800L;

    private enum Step {
        ONE, TWO, THREE
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable stepAdvanceRunnable;
    private ObjectAnimator progressAnimator;
    private Step currentStep = Step.ONE;

    private View root;
    private TextView stepTitle;
    private TextView heading;
    private TextView subtitle;
    private MaterialCardView imageCard;
    private TextView label;
    private LinearProgressIndicator progress;
    private MaterialButton nextButton;
    private boolean prepTriggered = false;
    private final Handler startHandler = new Handler(Looper.getMainLooper());
    private Runnable startRetryRunnable;
    private boolean startInFlight = false;
    private int startAttempt = 0;
    private boolean assessmentReady = false;
    private boolean autoAdvanced = false;
    private int readySessionId = 0;
    private String readyLanguage = "";
    private String readyEndsAt = "";
    private long stepThreeShownAtMs = 0L;
    private boolean pendingAdvance = false;

    public static HrPrepPreloaderFragment newInstance(String jobId, String assessmentType) {
        HrPrepPreloaderFragment fragment = new HrPrepPreloaderFragment();
        Bundle args = new Bundle();
        args.putString(ARG_JOB_ID, jobId == null ? "" : jobId);
        args.putString(ARG_ASSESSMENT_TYPE, assessmentType == null ? "HR" : assessmentType);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setEnterTransition(new MaterialSharedAxis(MaterialSharedAxis.X, true));
        setReturnTransition(new MaterialSharedAxis(MaterialSharedAxis.X, false));
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_hr_prep_preloader, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        root = view;
        stepTitle = view.findViewById(R.id.hr_prep_step_title);
        heading = view.findViewById(R.id.hr_prep_heading);
        subtitle = view.findViewById(R.id.hr_prep_subtitle);
        imageCard = view.findViewById(R.id.hr_prep_image_card);
        label = view.findViewById(R.id.hr_prep_label);
        progress = view.findViewById(R.id.hr_prep_progress);
        nextButton = view.findViewById(R.id.hr_prep_next);
        nextButton.setTextColor(ContextCompat.getColor(requireContext(), android.R.color.white));
        nextButton.setTextColor(ColorStateList.valueOf(ContextCompat.getColor(requireContext(), android.R.color.white)));

        MaterialToolbar toolbar = view.findViewById(R.id.hr_prep_toolbar);
        toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());

        if (savedInstanceState != null) {
            int stepIndex = savedInstanceState.getInt(STATE_STEP, 0);
            currentStep = Step.values()[Math.max(0, Math.min(Step.values().length - 1, stepIndex))];
        }

        nextButton.setOnClickListener(v -> {
            advanceWhenReady();
        });

        renderStep(false);
        triggerBackendPrepIfNeeded();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getActivity() != null) {
            int light = ContextCompat.getColor(requireContext(), R.color.bg_light);
            getActivity().getWindow().setStatusBarColor(light);
            getActivity().getWindow().setNavigationBarColor(light);
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getActivity().getWindow(), getActivity().getWindow().getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(true);
                controller.setAppearanceLightNavigationBars(true);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onStop() {
        cancelStartRetry();
        cancelPendingWork();
        super.onStop();
    }

    @Override
    public void onDestroyView() {
        cancelStartRetry();
        cancelPendingWork();
        root = null;
        stepTitle = null;
        heading = null;
        subtitle = null;
        imageCard = null;
        label = null;
        progress = null;
        nextButton = null;
        super.onDestroyView();
    }

    @Override
    public void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putInt(STATE_STEP, currentStep.ordinal());
    }

    private void renderStep(boolean animateTransition) {
        if (root == null || stepTitle == null) {
            return;
        }
        cancelPendingWork();
        if (animateTransition) {
            TransitionManager.beginDelayedTransition((ViewGroup) root, new MaterialFadeThrough());
        }

        switch (currentStep) {
            case ONE:
                stepTitle.setText("Step 1/3");
                heading.setText("Synthesizing your profile");
                subtitle.setText("Mapping your experience to the HR assessment database.");
                label.setText("Analyzing Resume Context");
                imageCard.setVisibility(View.GONE);
                nextButton.setVisibility(View.GONE);
                animateProgress(5, 25, STEP_ONE_MS);
                stepAdvanceRunnable = () -> {
                    currentStep = Step.TWO;
                    renderStep(true);
                };
                handler.postDelayed(stepAdvanceRunnable, STEP_ONE_MS);
                break;
            case TWO:
                stepTitle.setText("Step 2 of 3");
                heading.setText("Generating Question Bank");
                subtitle.setText("Selecting the most relevant HR & behavioral questions based on your background.");
                label.setText("Generating Questions");
                imageCard.setVisibility(View.VISIBLE);
                nextButton.setVisibility(View.GONE);
                animateProgress(20, 80, STEP_TWO_MS);
                stepAdvanceRunnable = () -> {
                    currentStep = Step.THREE;
                    renderStep(true);
                };
                handler.postDelayed(stepAdvanceRunnable, STEP_TWO_MS);
                break;
            case THREE:
                stepThreeShownAtMs = SystemClock.elapsedRealtime();
                stepTitle.setText("Step 3 of 3");
                heading.setText("Optimizing Difficulty");
                subtitle.setText("Calibrating assessment difficulty to match your reported skill levels.");
                label.setText("Ideal");
                imageCard.setVisibility(View.GONE);
                nextButton.setVisibility(View.VISIBLE);
                nextButton.setEnabled(assessmentReady);
                nextButton.setAlpha(1f);
                nextButton.setText(assessmentReady ? "Continue" : "Preparing questions...");
                animateProgress(70, 100, 1000L);
                if (assessmentReady && pendingAdvance) {
                    scheduleDeferredAdvance();
                }
                break;
        }
    }

    private void triggerBackendPrepIfNeeded() {
        if (prepTriggered || getContext() == null) return;
        prepTriggered = true;
        CandidateStateStore stateStore = new CandidateStateStore(requireContext());
        int appId = stateStore.getApplicationIdForJob(stateStore.getSelectedJobId());
        if (appId <= 0) return;
        String assessmentType = getArguments() == null ? "HR" : getArguments().getString(ARG_ASSESSMENT_TYPE, "HR");
        if ("TECH".equalsIgnoreCase(assessmentType)) {
            org.json.JSONObject active = stateStore.getActiveAssessmentSession();
            ApiModels.SelectLanguageRequest req = new ApiModels.SelectLanguageRequest();
            req.language = active == null ? "" : active.optString("language", "");
            if (req.language != null && !req.language.trim().isEmpty()) {
                startAssessmentGeneration("TECH", stateStore, appId);
            }
        } else {
            startAssessmentGeneration("HR", stateStore, appId);
        }
    }

    private void startAssessmentGeneration(@NonNull String stage, @NonNull CandidateStateStore store, int appId) {
        if (startInFlight) return;
        startInFlight = true;
        startAttempt = 0;
        cancelStartRetry();
        doStartAssessment(stage, store, appId);
    }

    private void doStartAssessment(@NonNull String stage, @NonNull CandidateStateStore store, int appId) {
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
                ApiModels.AssessmentStartResponse body = response.body();
                if ((response.code() == 200 || response.code() == 201) && body != null) {
                    if (applyReadyState(stage, store, appId, body)) {
                        return;
                    }
                    if (body.sessionId > 0) {
                        fetchReadyStatus(stage, store, appId, body.sessionId);
                        return;
                    }
                }
                if ((response.code() == 202 || response.code() == 204 || response.code() == 409) && body != null && body.sessionId > 0) {
                    fetchReadyStatus(stage, store, appId, body.sessionId);
                    return;
                }
                if (response.code() == 202 || response.code() == 204 || response.code() == 409) {
                    scheduleStartRetry(stage, store, appId);
                    return;
                }
                scheduleStartRetry(stage, store, appId);
            }

            @Override
            public void onFailure(Call<ApiModels.AssessmentStartResponse> call, Throwable t) {
                if (!isAdded()) return;
                scheduleStartRetry(stage, store, appId);
            }
        });
    }

    private boolean applyReadyState(@NonNull String stage, @NonNull CandidateStateStore store, int appId,
                                    @NonNull ApiModels.AssessmentStartResponse body) {
        if (body.questions == null || body.questions.isEmpty()) {
            return false;
        }
        assessmentReady = true;
        startInFlight = false;
        readySessionId = body.sessionId;
        readyLanguage = body.language;
        readyEndsAt = body.endsAt;
        store.setActiveAssessmentSession(
                stage.toUpperCase(),
                appId,
                readySessionId,
                readyLanguage,
                readyEndsAt,
                0
        );
        store.setActiveAssessmentQuestionsJson("[]");
        store.setActiveAssessmentReviewJson("");
        store.setActiveAssessmentResultJson("");
        pendingAdvance = true;
        if (currentStep == Step.THREE && nextButton != null) {
            nextButton.setEnabled(true);
            nextButton.setText("Continue");
            scheduleDeferredAdvance();
        }
        return true;
    }

    private void fetchReadyStatus(@NonNull String stage, @NonNull CandidateStateStore store, int appId, int sessionId) {
        ApiClient.getInstance(requireContext()).api().assessmentStatus(sessionId).enqueue(new Callback<ApiModels.AssessmentStatusResponse>() {
            @Override
            public void onResponse(Call<ApiModels.AssessmentStatusResponse> call, Response<ApiModels.AssessmentStatusResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null && applyReadyState(stage, store, appId, response.body())) {
                    return;
                }
                scheduleStartRetry(stage, store, appId);
            }

            @Override
            public void onFailure(Call<ApiModels.AssessmentStatusResponse> call, Throwable t) {
                if (!isAdded()) return;
                scheduleStartRetry(stage, store, appId);
            }
        });
    }

    private void scheduleStartRetry(@NonNull String stage, @NonNull CandidateStateStore store, int appId) {
        startAttempt++;
        long delayMs = Math.min(15000L, 2000L + (startAttempt * 1000L));
        if (startRetryRunnable != null) {
            startHandler.removeCallbacks(startRetryRunnable);
        }
        startRetryRunnable = () -> {
            if (!isAdded()) return;
            doStartAssessment(stage, store, appId);
        };
        startHandler.postDelayed(startRetryRunnable, delayMs);
    }

    private void cancelStartRetry() {
        if (startRetryRunnable != null) {
            startHandler.removeCallbacks(startRetryRunnable);
            startRetryRunnable = null;
        }
        startInFlight = false;
    }

    private void advanceWhenReady() {
        if (autoAdvanced || !assessmentReady || currentStep != Step.THREE) return;
        autoAdvanced = true;
        pendingAdvance = false;
        if (getActivity() instanceof CandidateActivity) {
            String assessmentType = getArguments() == null ? "HR" : getArguments().getString(ARG_ASSESSMENT_TYPE, "HR");
            ((CandidateActivity) getActivity()).pushScreen(
                    "TECH".equalsIgnoreCase(assessmentType)
                            ? R.layout.fragment_technical_question
                            : R.layout.fragment_hr_question
            );
        }
    }

    private void animateProgress(int from, int to, long durationMs) {
        if (progress == null) {
            return;
        }
        progress.setProgress(from);
        progressAnimator = ObjectAnimator.ofInt(progress, "progress", from, to);
        progressAnimator.setDuration(durationMs);
        progressAnimator.start();
    }

    private void scheduleDeferredAdvance() {
        if (!assessmentReady || autoAdvanced || currentStep != Step.THREE) {
            return;
        }
        if (stepAdvanceRunnable != null) {
            handler.removeCallbacks(stepAdvanceRunnable);
            stepAdvanceRunnable = null;
        }
        long elapsed = Math.max(0L, SystemClock.elapsedRealtime() - stepThreeShownAtMs);
        long remaining = Math.max(0L, STEP_THREE_MIN_VISIBLE_MS - elapsed);
        stepAdvanceRunnable = this::advanceWhenReady;
        handler.postDelayed(stepAdvanceRunnable, remaining);
    }

    private void cancelPendingWork() {
        if (stepAdvanceRunnable != null) {
            handler.removeCallbacks(stepAdvanceRunnable);
            stepAdvanceRunnable = null;
        }
        if (progressAnimator != null) {
            progressAnimator.cancel();
            progressAnimator = null;
        }
    }
}
