package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.tabs.TabLayout;
import com.simats.hireai.network.AuthRepository;

public class LoginActivity extends AppCompatActivity {
    private boolean isCandidateSelected = true;
    private long loadingStartedAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        TabLayout roleTabs = findViewById(R.id.login_role_tabs);
        Button loginButton = findViewById(R.id.login_action_button);
        EditText emailInput = findViewById(R.id.login_email_input);
        EditText passwordInput = findViewById(R.id.login_password_input);
        TextView signupHint = findViewById(R.id.login_signup_hint);
        CircularProgressIndicator loading = findViewById(R.id.login_loading_inline);
        AuthRepository authRepository = new AuthRepository(this);

        TabLayout.Tab candidateTab = roleTabs.getTabAt(1);
        if (candidateTab != null) {
            candidateTab.select();
            isCandidateSelected = true;
        }

        roleTabs.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                isCandidateSelected = tab != null && tab.getPosition() == 1;
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
                // no-op
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                // no-op
            }
        });

        signupHint.setOnClickListener(v -> startActivity(new Intent(this, SignupActivity.class)));

        loginButton.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            String password = passwordInput.getText().toString();
            if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) {
                Toast.makeText(this, "Enter email and password", Toast.LENGTH_SHORT).show();
                return;
            }
            loginButton.setEnabled(false);
            loginButton.setText("Signing in...");
            loading.setVisibility(android.view.View.VISIBLE);
            loadingStartedAt = System.currentTimeMillis();
            emailInput.setEnabled(false);
            passwordInput.setEnabled(false);
            roleTabs.setEnabled(false);
            signupHint.setEnabled(false);
            authRepository.login(email, password, new AuthRepository.AuthCallback() {
                @Override
                public void onSuccess(com.simats.hireai.network.ApiModels.AuthResponse response) {
                    long elapsed = System.currentTimeMillis() - loadingStartedAt;
                    long delay = Math.max(0L, 350L - elapsed);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        loginButton.setEnabled(true);
                        loginButton.setText("Login");
                        loading.setVisibility(android.view.View.GONE);
                        emailInput.setEnabled(true);
                        passwordInput.setEnabled(true);
                        roleTabs.setEnabled(true);
                        signupHint.setEnabled(true);
                        String actualRole = response.user != null ? response.user.role : null;
                        String expectedRole = isCandidateSelected ? "CANDIDATE" : "RECRUITER";
                        if (actualRole != null && !expectedRole.equals(actualRole)) {
                            authRepository.logout();
                            String roleLabel = "RECRUITER".equals(actualRole) ? "Recruiter" : "Candidate";
                            Toast.makeText(LoginActivity.this,
                                    "This account is a " + roleLabel + " account. Switch tab and login.",
                                    Toast.LENGTH_LONG).show();
                            return;
                        }
                        boolean candidate = actualRole != null ? "CANDIDATE".equals(actualRole) : isCandidateSelected;
                        new CandidateStateStore(LoginActivity.this).setLoggedIn(candidate);
                        Intent intent = new Intent(LoginActivity.this, candidate ? CandidateActivity.class : RecruiterActivity.class);
                        startActivity(intent);
                        finish();
                    }, delay);
                }

                @Override
                public void onError(String message) {
                    long elapsed = System.currentTimeMillis() - loadingStartedAt;
                    long delay = Math.max(0L, 250L - elapsed);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        loginButton.setEnabled(true);
                        loginButton.setText("Login");
                        loading.setVisibility(android.view.View.GONE);
                        emailInput.setEnabled(true);
                        passwordInput.setEnabled(true);
                        roleTabs.setEnabled(true);
                        signupHint.setEnabled(true);
                        Toast.makeText(LoginActivity.this, message == null ? "Login failed" : message, Toast.LENGTH_SHORT).show();
                    }, delay);
                }
            });
        });
    }
}
