package com.simats.hireai;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.simats.hireai.network.ApiClient;
import com.simats.hireai.network.ApiModels;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class JobsRepository {
    private static final String PREFS = "hireai_shared_jobs";
    private static final String KEY_JOBS_JSON = "jobs_json";

    private static JobsRepository instance;

    public static synchronized JobsRepository getInstance(Context context) {
        if (instance == null) {
            instance = new JobsRepository(context.getApplicationContext());
        }
        return instance;
    }

    private final SharedPreferences prefs;
    private final MutableLiveData<List<Job>> jobsLiveData = new MutableLiveData<>(new ArrayList<>());
    private final List<Job> jobs = new ArrayList<>();

    private JobsRepository(Context context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        load();
        syncFromBackend(context);
    }

    public LiveData<List<Job>> observeJobs() {
        return jobsLiveData;
    }

    public synchronized List<Job> getJobs() {
        return new ArrayList<>(jobs);
    }

    public synchronized void publishJob(Job job) {
        if (job == null || job.id.trim().isEmpty() || job.title.trim().isEmpty()) {
            return;
        }
        jobs.add(0, job);
        persistAndPublish();
    }

    public void publishJobToBackend(Context context, Job job) {
        ApiModels.PublishJobRequest request = new ApiModels.PublishJobRequest();
        request.title = job.title;
        request.company = job.company;
        request.location = job.location;
        request.isRemote = job.isRemote;
        request.roleType = job.roleType;
        request.salaryMin = job.salaryMin;
        request.salaryMax = job.salaryMax;
        request.currency = job.currency;
        request.requiredSkills = new ArrayList<>(job.skills);
        request.minMatchScore = job.minMatchScore;
        ApiClient.getInstance(context).api().publishRecruiterJob(request).enqueue(new Callback<ApiModels.ApiJob>() {
            @Override
            public void onResponse(Call<ApiModels.ApiJob> call, Response<ApiModels.ApiJob> response) {
                syncFromBackend(context);
            }

            @Override
            public void onFailure(Call<ApiModels.ApiJob> call, Throwable t) {
                // keep local
            }
        });
    }

    public void syncFromBackend(Context context) {
        ApiClient.getInstance(context).api().getJobs(null, null, null).enqueue(new Callback<List<ApiModels.ApiJob>>() {
            @Override
            public void onResponse(Call<List<ApiModels.ApiJob>> call, Response<List<ApiModels.ApiJob>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    return;
                }
                mergeRemoteJobs(response.body());
            }

            @Override
            public void onFailure(Call<List<ApiModels.ApiJob>> call, Throwable t) {
                // keep local fallback
            }
        });
    }

    public void fetchRecommendedJobs(Context context, Callback<List<ApiModels.ApiJob>> callback) {
        ApiClient.getInstance(context).api().getRecommendedJobs().enqueue(callback);
    }

    public void fetchSavedJobs(Context context, Callback<List<ApiModels.ApiJob>> callback) {
        ApiClient.getInstance(context).api().getSavedJobs().enqueue(callback);
    }

    public void toggleSaveJob(Context context, int jobId, Callback<ApiModels.SaveJobResponse> callback) {
        ApiClient.getInstance(context).api().saveJob(jobId).enqueue(callback);
    }

    public synchronized Job createJob(
            String title,
            String company,
            String location,
            boolean isRemote,
            String roleType,
            Integer salaryMin,
            Integer salaryMax,
            List<String> skills,
            int minMatchScore
    ) {
        return new Job(
                UUID.randomUUID().toString(),
                title,
                company,
                isRemote ? "Remote" : location,
                isRemote,
                roleType,
                salaryMin,
                salaryMax,
                "INR",
                skills,
                minMatchScore,
                System.currentTimeMillis()
        );
    }

    private void load() {
        String raw = prefs.getString(KEY_JOBS_JSON, "");
        if (raw == null || raw.trim().isEmpty()) {
            jobs.clear();
            publishOnly();
            return;
        }
        try {
            JSONArray array = new JSONArray(raw);
            jobs.clear();
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                jobs.add(fromJson(obj));
            }
            publishOnly();
        } catch (Exception ignored) {
            jobs.clear();
            publishOnly();
        }
    }

    private void persistAndPublish() {
        JSONArray array = new JSONArray();
        for (Job job : jobs) {
            array.put(toJson(job));
        }
        prefs.edit().putString(KEY_JOBS_JSON, array.toString()).apply();
        publishOnly();
    }

    private synchronized void mergeRemoteJobs(List<ApiModels.ApiJob> remote) {
        List<Job> mapped = new ArrayList<>();
        for (ApiModels.ApiJob apiJob : remote) {
            mapped.add(new Job(
                    apiJob.id == null ? UUID.randomUUID().toString() : apiJob.id,
                    apiJob.title,
                    apiJob.company,
                    apiJob.location,
                    apiJob.isRemote,
                    apiJob.roleType,
                    apiJob.salaryMin,
                    apiJob.salaryMax,
                    apiJob.currency,
                    apiJob.requiredSkills,
                    apiJob.minMatchScore,
                    parseCreatedAt(apiJob.createdAt)
            ));
        }
        if (mapped.isEmpty()) {
            return;
        }
        jobs.clear();
        jobs.addAll(mapped);
        Collections.sort(jobs, Comparator.comparingLong((Job j) -> j.createdAt).reversed());
        persistAndPublish();
    }

    private long parseCreatedAt(String createdAt) {
        if (createdAt == null || createdAt.trim().isEmpty()) {
            return System.currentTimeMillis();
        }
        try {
            String normalized = createdAt.replace("Z", "+0000");
            if (normalized.length() > 5 && (normalized.charAt(normalized.length() - 3) == ':')) {
                normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);
            }
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            return parser.parse(normalized).getTime();
        } catch (Exception ignored) {
            try {
                String normalized = createdAt.replace("Z", "+0000");
                if (normalized.length() > 5 && (normalized.charAt(normalized.length() - 3) == ':')) {
                    normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);
                }
                SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US);
                parser.setTimeZone(TimeZone.getTimeZone("UTC"));
                return parser.parse(normalized).getTime();
            } catch (Exception e) {
                return System.currentTimeMillis();
            }
        }
    }

    private void publishOnly() {
        jobsLiveData.postValue(new ArrayList<>(jobs));
    }

    private JSONObject toJson(Job job) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", job.id);
            obj.put("title", job.title);
            obj.put("company", job.company);
            obj.put("location", job.location);
            obj.put("isRemote", job.isRemote);
            obj.put("roleType", job.roleType);
            obj.put("salaryMin", job.salaryMin == null ? JSONObject.NULL : job.salaryMin);
            obj.put("salaryMax", job.salaryMax == null ? JSONObject.NULL : job.salaryMax);
            obj.put("currency", job.currency);
            JSONArray skills = new JSONArray();
            for (String skill : job.skills) {
                skills.put(skill);
            }
            obj.put("skills", skills);
            obj.put("minMatchScore", job.minMatchScore);
            obj.put("createdAt", job.createdAt);
        } catch (Exception ignored) {
        }
        return obj;
    }

    private Job fromJson(JSONObject obj) {
        JSONArray skillsArray = obj.optJSONArray("skills");
        List<String> skills = new ArrayList<>();
        if (skillsArray != null) {
            for (int i = 0; i < skillsArray.length(); i++) {
                skills.add(skillsArray.optString(i));
            }
        }
        Integer salaryMin = obj.isNull("salaryMin") ? null : obj.optInt("salaryMin");
        Integer salaryMax = obj.isNull("salaryMax") ? null : obj.optInt("salaryMax");
        return new Job(
                obj.optString("id"),
                obj.optString("title"),
                obj.optString("company"),
                obj.optString("location"),
                obj.optBoolean("isRemote"),
                obj.optString("roleType", Job.ROLE_FULL_TIME),
                salaryMin,
                salaryMax,
                obj.optString("currency", "INR"),
                skills,
                obj.optInt("minMatchScore", 70),
                obj.optLong("createdAt", System.currentTimeMillis())
        );
    }
}
