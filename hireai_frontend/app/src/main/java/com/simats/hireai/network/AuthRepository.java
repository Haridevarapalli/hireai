package com.simats.hireai.network;

import android.content.Context;

import com.simats.hireai.network.ApiModels.AuthResponse;
import com.simats.hireai.network.ApiModels.LoginRequest;
import com.simats.hireai.network.ApiModels.OtpStartResponse;
import com.simats.hireai.network.ApiModels.OtpVerifyRequest;
import com.simats.hireai.network.ApiModels.RefreshResponse;
import com.simats.hireai.network.ApiModels.SignupRequest;
import com.simats.hireai.network.ApiModels.TokenRefreshRequest;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.UUID;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AuthRepository {
    private final Context appContext;
    private final ApiService apiService;
    private final TokenStore tokenStore;

    public interface AuthCallback {
        void onSuccess(AuthResponse response);
        void onError(String message);
    }

    public interface SimpleCallback {
        void onSuccess();
        void onError(String message);
    }

    public interface OtpCallback {
        void onSuccess(OtpStartResponse response);
        void onError(String message);
    }

    public AuthRepository(Context context) {
        this.appContext = context.getApplicationContext();
        this.apiService = ApiClient.getInstance(context).api();
        this.tokenStore = TokenStore.getInstance(context);
    }

    public void login(String email, String password, AuthCallback callback) {
        LoginRequest request = new LoginRequest();
        request.email = email;
        request.password = password;
        apiService.login(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    callback.onError(extractErrorMessage(response, "Login failed"));
                    return;
                }
                persistSession(response.body());
                callback.onSuccess(response.body());
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public void signup(String fullName, String email, String password, String role, String phone, OtpCallback callback) {
        SignupRequest request = new SignupRequest();
        request.fullName = fullName;
        request.email = email;
        request.password = password;
        request.role = role;
        request.phone = phone;
        apiService.signup(request).enqueue(new Callback<OtpStartResponse>() {
            @Override
            public void onResponse(Call<OtpStartResponse> call, Response<OtpStartResponse> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    callback.onError(extractErrorMessage(response, "Signup failed"));
                    return;
                }
                callback.onSuccess(response.body());
            }

            @Override
            public void onFailure(Call<OtpStartResponse> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public void verifyOtp(String email, String otp, AuthCallback callback) {
        OtpVerifyRequest request = new OtpVerifyRequest();
        request.email = email;
        request.otp = otp;
        apiService.verifyOtp(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    callback.onError(extractErrorMessage(response, "OTP verification failed"));
                    return;
                }
                persistSession(response.body());
                callback.onSuccess(response.body());
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public void resendOtp(String email, SimpleCallback callback) {
        ApiModels.OtpResendRequest request = new ApiModels.OtpResendRequest();
        request.email = email;
        apiService.resendOtp(request).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (!response.isSuccessful()) {
                    callback.onError(extractErrorMessage(response, "Failed to resend OTP"));
                    return;
                }
                callback.onSuccess();
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public void refreshSession(SimpleCallback callback) {
        String refresh = tokenStore.getRefreshToken();
        if (refresh == null || refresh.trim().isEmpty()) {
            callback.onError("No refresh token");
            return;
        }
        TokenRefreshRequest request = new TokenRefreshRequest();
        request.refresh = refresh;
        apiService.refresh(request).enqueue(new Callback<RefreshResponse>() {
            @Override
            public void onResponse(Call<RefreshResponse> call, Response<RefreshResponse> response) {
                if (!response.isSuccessful() || response.body() == null || response.body().access == null) {
                    tokenStore.clear();
                    callback.onError("Session expired");
                    return;
                }
                RefreshResponse body = response.body();
                tokenStore.saveTokens(body.access, body.refresh != null ? body.refresh : refresh);
                callback.onSuccess();
            }

            @Override
            public void onFailure(Call<RefreshResponse> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public void logout() {
        tokenStore.clear();
    }

    public boolean hasSession() {
        return tokenStore.hasRefreshToken();
    }

    public String getSavedRole() {
        return tokenStore.getRole();
    }

    private void persistSession(AuthResponse authResponse) {
        tokenStore.saveTokens(authResponse.access, authResponse.refresh);
        if (authResponse.user != null && authResponse.user.role != null) {
            tokenStore.saveRole(authResponse.user.role);
        }
        registerDevicePlaceholderToken();
    }

    private void registerDevicePlaceholderToken() {
        try {
            android.content.SharedPreferences sp = appContext.getSharedPreferences("hireai_device", Context.MODE_PRIVATE);
            String token = sp.getString("token", null);
            if (token == null || token.trim().isEmpty()) {
                token = "android-local-" + UUID.randomUUID().toString();
                sp.edit().putString("token", token).apply();
            }
            ApiModels.DeviceRegisterRequest req = new ApiModels.DeviceRegisterRequest();
            req.token = token;
            req.platform = "android";
            apiService.registerDevice(req).enqueue(new Callback<ApiModels.DeviceRegisterResponse>() {
                @Override public void onResponse(Call<ApiModels.DeviceRegisterResponse> call, Response<ApiModels.DeviceRegisterResponse> response) { }
                @Override public void onFailure(Call<ApiModels.DeviceRegisterResponse> call, Throwable t) { }
            });
        } catch (Exception ignored) { }
    }

    private String extractErrorMessage(Response<?> response, String fallback) {
        try {
            if (response == null || response.errorBody() == null) return fallback;
            String raw = response.errorBody().string();
            if (raw == null || raw.trim().isEmpty()) return fallback;
            JSONObject obj = new JSONObject(raw);
            if (obj.has("detail")) {
                String detail = obj.optString("detail");
                if (!detail.trim().isEmpty()) return detail;
            }
            if (obj.has("non_field_errors")) {
                JSONArray arr = obj.optJSONArray("non_field_errors");
                if (arr != null && arr.length() > 0) return arr.optString(0, fallback);
            }
            String[] keys = new String[]{"email", "password", "otp", "full_name"};
            for (String key : keys) {
                if (obj.has(key)) {
                    JSONArray arr = obj.optJSONArray(key);
                    if (arr != null && arr.length() > 0) return arr.optString(0, fallback);
                    String val = obj.optString(key, "");
                    if (!val.trim().isEmpty()) return val;
                }
            }
            return fallback;
        } catch (Exception e) {
            return fallback;
        }
    }
}
