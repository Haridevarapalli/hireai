package com.simats.hireai.network;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

public class TokenStore {
    private static final String PREF_FILE = "hireai_secure_session";
    private static final String KEY_ACCESS = "access_token";
    private static final String KEY_REFRESH = "refresh_token";
    private static final String KEY_ROLE = "role";

    private final SharedPreferences prefs;
    private static TokenStore instance;

    public static synchronized TokenStore getInstance(Context context) {
        if (instance == null) {
            instance = new TokenStore(context.getApplicationContext());
        }
        return instance;
    }

    private TokenStore(Context context) {
        SharedPreferences fallback = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);
        SharedPreferences securePrefs;
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            securePrefs = EncryptedSharedPreferences.create(
                    context,
                    PREF_FILE,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception exception) {
            securePrefs = fallback;
        }
        this.prefs = securePrefs;
    }

    public synchronized void saveTokens(String access, String refresh) {
        prefs.edit().putString(KEY_ACCESS, access).putString(KEY_REFRESH, refresh).apply();
    }

    public synchronized String getAccessToken() {
        return prefs.getString(KEY_ACCESS, null);
    }

    public synchronized String getRefreshToken() {
        return prefs.getString(KEY_REFRESH, null);
    }

    public synchronized void saveRole(String role) {
        prefs.edit().putString(KEY_ROLE, role).apply();
    }

    public synchronized String getRole() {
        return prefs.getString(KEY_ROLE, null);
    }

    public synchronized boolean hasRefreshToken() {
        String refresh = getRefreshToken();
        return refresh != null && !refresh.trim().isEmpty();
    }

    public synchronized void clear() {
        prefs.edit().clear().apply();
    }
}
