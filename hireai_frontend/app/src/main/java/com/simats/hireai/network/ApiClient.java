package com.simats.hireai.network;

import android.content.Context;

import com.simats.hireai.BuildConfig;
import com.simats.hireai.network.ApiModels.RefreshResponse;
import com.simats.hireai.network.ApiModels.TokenRefreshRequest;

import okhttp3.Authenticator;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.Route;
import okhttp3.logging.HttpLoggingInterceptor.Logger;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static ApiClient instance;
    private final ApiService apiService;

    public static synchronized ApiClient getInstance(Context context) {
        if (instance == null) {
            instance = new ApiClient(context.getApplicationContext());
        }
        return instance;
    }

    private ApiClient(Context context) {
        TokenStore tokenStore = TokenStore.getInstance(context);

        Interceptor authInterceptor = chain -> {
            Request original = chain.request();
            Request.Builder builder = original.newBuilder();
            String accessToken = tokenStore.getAccessToken();
            if (accessToken != null && !accessToken.trim().isEmpty()) {
                builder.header("Authorization", "Bearer " + accessToken);
            }
            return chain.proceed(builder.build());
        };

        Authenticator authenticator = new Authenticator() {
            @Override
            public Request authenticate(Route route, Response response) {
                if (responseCount(response) >= 2) return null;
                String refreshToken = tokenStore.getRefreshToken();
                if (refreshToken == null || refreshToken.isEmpty()) {
                    return null;
                }
                try {
                    Retrofit bareRetrofit = new Retrofit.Builder()
                            .baseUrl(BuildConfig.API_BASE_URL)
                            .addConverterFactory(GsonConverterFactory.create())
                            .build();
                    ApiService bareApi = bareRetrofit.create(ApiService.class);
                    TokenRefreshRequest request = new TokenRefreshRequest();
                    request.refresh = refreshToken;
                    Call<RefreshResponse> call = bareApi.refresh(request);
                    retrofit2.Response<RefreshResponse> refreshResponse = call.execute();
                    if (!refreshResponse.isSuccessful() || refreshResponse.body() == null) {
                        tokenStore.clear();
                        return null;
                    }
                    RefreshResponse body = refreshResponse.body();
                    tokenStore.saveTokens(body.access, body.refresh != null ? body.refresh : refreshToken);
                    return response.request()
                            .newBuilder()
                            .header("Authorization", "Bearer " + body.access)
                            .build();
                } catch (Exception e) {
                    tokenStore.clear();
                    return null;
                }
            }
        };

        OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(new RetryGetTimeoutInterceptor())
                .authenticator(authenticator)
                .connectTimeout(20, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .readTimeout(90, TimeUnit.SECONDS);

        if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor(new SafeHttpLogger());
            logging.setLevel(HttpLoggingInterceptor.Level.HEADERS);
            clientBuilder.addInterceptor(logging);
            clientBuilder.addInterceptor(new MultipartMetadataInterceptor());
        }

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL)
                .client(clientBuilder.build())
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        apiService = retrofit.create(ApiService.class);
    }

    public ApiService api() {
        return apiService;
    }

    private static int responseCount(Response response) {
        int result = 1;
        while ((response = response.priorResponse()) != null) {
            result++;
        }
        return result;
    }

    private static class RetryGetTimeoutInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();
            try {
                return chain.proceed(request);
            } catch (SocketTimeoutException first) {
                if (!"GET".equalsIgnoreCase(request.method())) {
                    throw first;
                }
                return chain.proceed(request);
            }
        }
    }

    private static class SafeHttpLogger implements Logger {
        @Override
        public void log(String message) {
            if (message == null) return;
            String lower = message.toLowerCase();
            if (lower.contains("multipart/form-data") || lower.contains("content-disposition: form-data")) {
                android.util.Log.i("OkHttpClient", message);
                return;
            }
            android.util.Log.i("OkHttpClient", message);
        }
    }

    private static class MultipartMetadataInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();
            RequestBody body = request.body();
            MediaType mediaType = body != null ? body.contentType() : null;
            if (mediaType != null && "multipart".equalsIgnoreCase(mediaType.type())) {
                long size = -1L;
                try {
                    size = body.contentLength();
                } catch (Exception ignored) { }
                android.util.Log.i("OkHttpUpload", request.method() + " " + request.url()
                        + " multipart upload"
                        + (size >= 0 ? (" bytes=" + size) : ""));
            }
            return chain.proceed(request);
        }
    }
}
