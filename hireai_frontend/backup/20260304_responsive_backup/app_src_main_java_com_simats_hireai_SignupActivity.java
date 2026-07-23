package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.tabs.TabLayout;
import com.simats.hireai.network.AuthRepository;
import com.simats.hireai.network.ApiModels.OtpStartResponse;

public class SignupActivity extends AppCompatActivity {
    private boolean candidateSelected = true;
    private long loadingStartedAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        EditText nameInput = findViewById(R.id.signup_name_input);
        EditText emailInput = findViewById(R.id.signup_email_input);
        EditText passwordInput = findViewById(R.id.signup_password_input);
        Button action = findViewById(R.id.signup_action_button);
        TextView loginHint = findViewById(R.id.signup_login_hint);
        CircularProgressIndicator loadingInline = findViewById(R.id.signup_loading_inline);
        TabLayout roleTabs = findViewById(R.id.signup_role_tabs);

        TabLayout.Tab candidateTab = roleTabs.getTabAt(1);
        if (candidateTab != null) candidateTab.select();

        roleTabs.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                candidateSelected = tab != null && tab.getPosition() == 1;
            }

            @Override public void onTabUnselected(TabLayout.Tab tab) { }
            @Override public void onTabReselected(TabLayout.Tab tab) { }
        });

        AuthRepository authRepository = new AuthRepository(this);
        loginHint.setOnClickListener(v -> {
            startActivity(new Intent(SignupActivity.this, LoginActivity.class));
            finish();
        });
        action.setOnClickListener(v -> {
            String fullName = nameInput.getText().toString().trim();
            String email = emailInput.getText().toString().trim();
            String password = passwordInput.getText().toString();
            if (TextUtils.isEmpty(fullName)) {
                nameInput.setError("Full name is required");
                nameInput.requestFocus();
                return;
            }
            if (TextUtils.isEmpty(email)) {
                emailInput.setError("Email is required");
                emailInput.requestFocus();
                return;
            }
            if (password.length() < 8) {
                passwordInput.setError("Password must be at least 8 characters");
                passwordInput.requestFocus();
                Toast.makeText(this, "Password must be at least 8 characters", Toast.LENGTH_SHORT).show();
                return;
            }
            action.setEnabled(false);
            action.setText("Creating account...");
            loadingInline.setVisibility(View.VISIBLE);
            loadingStartedAt = System.currentTimeMillis();
            nameInput.setEnabled(false);
            emailInput.setEnabled(false);
            passwordInput.setEnabled(false);
            roleTabs.setEnabled(false);
            loginHint.setEnabled(false);
            String role = candidateSelected ? "CANDIDATE" : "RECRUITER";
            authRepository.signup(fullName, email, password, role, "", new AuthRepository.OtpCallback() {
                @Override
                public void onSuccess(OtpStartResponse response) {
                    long elapsed = System.currentTimeMillis() - loadingStartedAt;
                    long delay = Math.max(0L, 450L - elapsed);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        action.setEnabled(true);
                        action.setText("Continue");
                        loadingInline.setVisibility(View.GONE);
                        nameInput.setEnabled(true);
                        emailInput.setEnabled(true);
                        passwordInput.setEnabled(true);
                        roleTabs.setEnabled(true);
                        loginHint.setEnabled(true);
                        Intent otpIntent = new Intent(SignupActivity.this, VerifyOtpActivity.class);
                        otpIntent.putExtra("email", response.email);
                        otpIntent.putExtra("role", response.role);
                        startActivity(otpIntent);
                        finish();
                    }, delay);
                }

                @Override
                public void onError(String message) {
                    long elapsed = System.currentTimeMillis() - loadingStartedAt;
                    long delay = Math.max(0L, 300L - elapsed);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        action.setEnabled(true);
                        action.setText("Continue");
                        loadingInline.setVisibility(View.GONE);
                        nameInput.setEnabled(true);
                        emailInput.setEnabled(true);
                        passwordInput.setEnabled(true);
                        roleTabs.setEnabled(true);
                        loginHint.setEnabled(true);
                        Toast.makeText(SignupActivity.this, message == null ? "Signup failed" : message, Toast.LENGTH_SHORT).show();
                    }, delay);
                }
            });
        });
    }
}
