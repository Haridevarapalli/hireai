package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.textfield.TextInputLayout;
import com.simats.hireai.network.AuthRepository;
import com.simats.hireai.network.ApiModels.AuthResponse;

public class VerifyOtpActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_verify_otp);

        String email = getIntent().getStringExtra("email");
        MaterialToolbar toolbar = findViewById(R.id.otp_toolbar);
        TextView emailView = findViewById(R.id.otp_email_label);
        EditText otpInput = findViewById(R.id.otp_input);
        TextInputLayout otpInputLayout = findViewById(R.id.otp_input_layout);
        LinearProgressIndicator loading = findViewById(R.id.otp_loading);
        Button verifyButton = findViewById(R.id.otp_verify_button);
        TextView resend = findViewById(R.id.otp_resend);

        toolbar.setNavigationOnClickListener(v -> finish());
        emailView.setText(email == null ? "" : email);
        AuthRepository authRepository = new AuthRepository(this);

        verifyButton.setOnClickListener(v -> {
            String otp = otpInput.getText().toString().trim();
            if (TextUtils.isEmpty(email) || otp.length() != 6) {
                otpInputLayout.setError("Please enter a valid 6-digit OTP");
                return;
            }
            otpInputLayout.setError(null);
            verifyButton.setEnabled(false);
            resend.setEnabled(false);
            loading.setVisibility(android.view.View.VISIBLE);
            authRepository.verifyOtp(email, otp, new AuthRepository.AuthCallback() {
                @Override
                public void onSuccess(AuthResponse response) {
                    verifyButton.setEnabled(true);
                    resend.setEnabled(true);
                    loading.setVisibility(android.view.View.GONE);
                    boolean candidate = response.user != null && "CANDIDATE".equals(response.user.role);
                    if (candidate) new CandidateStateStore(VerifyOtpActivity.this).setLoggedIn(true);
                    startActivity(new Intent(VerifyOtpActivity.this, candidate ? CandidateActivity.class : RecruiterActivity.class));
                    finish();
                }

                @Override
                public void onError(String message) {
                    verifyButton.setEnabled(true);
                    resend.setEnabled(true);
                    loading.setVisibility(android.view.View.GONE);
                    Toast.makeText(VerifyOtpActivity.this, message == null ? "OTP verification failed" : message, Toast.LENGTH_SHORT).show();
                }
            });
        });

        resend.setOnClickListener(v -> {
            if (TextUtils.isEmpty(email)) return;
            resend.setEnabled(false);
            loading.setVisibility(android.view.View.VISIBLE);
            authRepository.resendOtp(email, new AuthRepository.SimpleCallback() {
                @Override
                public void onSuccess() {
                    resend.setEnabled(true);
                    loading.setVisibility(android.view.View.GONE);
                    Toast.makeText(VerifyOtpActivity.this, "OTP resent", Toast.LENGTH_SHORT).show();
                }

                @Override
                public void onError(String message) {
                    resend.setEnabled(true);
                    loading.setVisibility(android.view.View.GONE);
                    Toast.makeText(VerifyOtpActivity.this, message == null ? "Failed to resend OTP" : message, Toast.LENGTH_SHORT).show();
                }
            });
        });
    }
}
