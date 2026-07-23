package com.simats.hireai;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class CandidateUserStateRepository {
    private static CandidateUserStateRepository instance;
    private final MutableLiveData<Long> stateVersion = new MutableLiveData<>(System.currentTimeMillis());

    private CandidateUserStateRepository(Context context) {
        // Reserved for future DataStore-backed reactive state.
    }

    public static synchronized CandidateUserStateRepository getInstance(@NonNull Context context) {
        if (instance == null) {
            instance = new CandidateUserStateRepository(context.getApplicationContext());
        }
        return instance;
    }

    public LiveData<Long> stateVersion() {
        return stateVersion;
    }

    public void notifyStateChanged() {
        stateVersion.postValue(System.currentTimeMillis());
    }
}
