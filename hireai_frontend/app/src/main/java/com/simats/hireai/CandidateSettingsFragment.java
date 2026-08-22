package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;
import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;
import com.simats.hireai.network.TokenStore;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CandidateSettingsFragment extends Fragment {

    private MaterialToolbar toolbar;
    private TextView tvEmail;
    private View btnChangePassword;
    private MaterialButton btnLogout;

    public static CandidateSettingsFragment newInstance() {
        return new CandidateSettingsFragment();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_candidate_settings, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        toolbar = view.findViewById(R.id.candidate_settings_toolbar);
        tvEmail = view.findViewById(R.id.tv_settings_user_email);
        btnChangePassword = view.findViewById(R.id.btn_setting_change_password);
        btnLogout = view.findViewById(R.id.btn_candidate_logout);

        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> {
                if (getActivity() != null) {
                    getActivity().onBackPressed();
                }
            });
        }

        if (getContext() != null) {
            CandidateStateStore stateStore = new CandidateStateStore(getContext());
            String email = stateStore.getCandidateEmail();
            if (email != null && !email.isEmpty()) {
                tvEmail.setText(email);
            }
        }

        if (btnChangePassword != null) {
            btnChangePassword.setOnClickListener(v -> showChangePasswordDialog());
        }

        if (btnLogout != null) {
            btnLogout.setOnClickListener(v -> handleLogout());
        }
    }

    private void showChangePasswordDialog() {
        if (getContext() == null) return;

        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_change_password, null);
        EditText editCurrent = dialogView.findViewById(R.id.edit_current_password);
        EditText editNew = dialogView.findViewById(R.id.edit_new_password);
        EditText editConfirm = dialogView.findViewById(R.id.edit_confirm_password);
        MaterialButton btnCancel = dialogView.findViewById(R.id.btn_cancel_change_password);
        MaterialButton btnSubmit = dialogView.findViewById(R.id.btn_submit_change_password);

        AlertDialog dialog = new AlertDialog.Builder(getContext())
                .setView(dialogView)
                .setCancelable(true)
                .create();

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnSubmit.setOnClickListener(v -> {
            String current = editCurrent.getText() != null ? editCurrent.getText().toString().trim() : "";
            String newPass = editNew.getText() != null ? editNew.getText().toString().trim() : "";
            String confirm = editConfirm.getText() != null ? editConfirm.getText().toString().trim() : "";

            if (current.isEmpty() || newPass.isEmpty() || confirm.isEmpty()) {
                Toast.makeText(getContext(), "Please fill in all fields", Toast.LENGTH_SHORT).show();
                return;
            }

            if (!newPass.equals(confirm)) {
                Toast.makeText(getContext(), "New passwords do not match", Toast.LENGTH_SHORT).show();
                return;
            }

            if (newPass.length() < 6) {
                Toast.makeText(getContext(), "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
                return;
            }

            ApiModels.ChangePasswordRequest req = new ApiModels.ChangePasswordRequest();
            req.currentPassword = current;
            req.newPassword = newPass;

            ApiClient.getInstance(getContext()).api().changePassword(req).enqueue(new Callback<ApiModels.GenericSuccessResponse>() {
                @Override
                public void onResponse(Call<ApiModels.GenericSuccessResponse> call, Response<ApiModels.GenericSuccessResponse> response) {
                    if (!isAdded()) return;
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        if (getView() != null) {
                            Snackbar.make(getView(), "Password changed successfully", Snackbar.LENGTH_LONG).show();
                        }
                    } else {
                        Toast.makeText(getContext(), "Failed to change password. Please check current password.", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiModels.GenericSuccessResponse> call, Throwable t) {
                    if (!isAdded()) return;
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }

    private void handleLogout() {
        if (getActivity() == null) return;
        TokenStore tokenStore = TokenStore.getInstance(getActivity());
        tokenStore.clear();
        CandidateStateStore stateStore = new CandidateStateStore(getActivity());
        stateStore.clearCandidateSession();

        Intent intent = new Intent(getActivity(), LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        getActivity().finish();
    }
}
