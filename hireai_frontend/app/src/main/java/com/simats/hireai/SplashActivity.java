package com.simats.hireai;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;

import com.simats.hireai.network.AuthRepository;

public class SplashActivity extends AppCompatActivity {
    private static final long SPLASH_DELAY_MS = 1200L;
    private static final String PREFS_NAME = "hireai_prefs";
    private static final String KEY_ONBOARDING_DONE = "onboarding_done";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        WindowInsetHelper.applyRootInsets(this);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            boolean onboardingDone = prefs.getBoolean(KEY_ONBOARDING_DONE, false);
            if (!onboardingDone) {
                startActivity(new Intent(this, OnboardingActivity.class));
                finish();
                return;
            }
            AuthRepository authRepository = new AuthRepository(this);
            if (!authRepository.hasSession()) {
                startActivity(new Intent(this, LoginActivity.class));
                finish();
                return;
            }
            authRepository.refreshSession(new AuthRepository.SimpleCallback() {
                @Override
                public void onSuccess() {
                    String role = authRepository.getSavedRole();
                    Class<?> target = "RECRUITER".equals(role) ? RecruiterActivity.class : CandidateActivity.class;
                    startActivity(new Intent(SplashActivity.this, target));
                    finish();
                }

                @Override
                public void onError(String message) {
                    startActivity(new Intent(SplashActivity.this, LoginActivity.class));
                    finish();
                }
            });
        }, SPLASH_DELAY_MS);
    }
}
