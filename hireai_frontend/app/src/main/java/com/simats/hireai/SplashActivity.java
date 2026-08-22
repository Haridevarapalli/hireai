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
            startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            finish();
        }, SPLASH_DELAY_MS);
    }
}
