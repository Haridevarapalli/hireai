package com.simats.hireai.network;

import com.simats.hireai.network.ApiModels.AuthResponse;
import com.simats.hireai.network.ApiModels.LoginRequest;
import com.simats.hireai.network.ApiModels.MatchScoreResponse;
import com.simats.hireai.network.ApiModels.OtpResendRequest;
import com.simats.hireai.network.ApiModels.OtpStartResponse;
import com.simats.hireai.network.ApiModels.OtpVerifyRequest;
import com.simats.hireai.network.ApiModels.PublishJobRequest;
import com.simats.hireai.network.ApiModels.RefreshResponse;
import com.simats.hireai.network.ApiModels.SignupRequest;
import com.simats.hireai.network.ApiModels.TokenRefreshRequest;
import com.simats.hireai.network.ApiModels.ApiJob;
import com.simats.hireai.network.ApiModels.ApplyRequest;
import com.simats.hireai.network.ApiModels.ApplicationDto;
import com.simats.hireai.network.ApiModels.AssessmentSubmitRequest;
import com.simats.hireai.network.ApiModels.SelectLanguageRequest;
import com.simats.hireai.network.ApiModels.OfferDto;
import com.simats.hireai.network.ApiModels.SignOfferRequest;
import com.simats.hireai.network.ApiModels.AcceptOfferRequest;
import com.simats.hireai.network.ApiModels.RecruiterOfferDto;

import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Multipart;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.POST;
import retrofit2.http.PATCH;
import retrofit2.http.Path;
import retrofit2.http.Query;
import retrofit2.http.DELETE;
import retrofit2.http.Url;
import okhttp3.MultipartBody;

public interface ApiService {
    @POST("auth/signup")
    Call<OtpStartResponse> signup(@Body SignupRequest request);

    @POST("auth/verify-otp")
    Call<AuthResponse> verifyOtp(@Body OtpVerifyRequest request);

    @POST("auth/resend-otp")
    Call<Void> resendOtp(@Body OtpResendRequest request);

    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/token/refresh")
    Call<RefreshResponse> refresh(@Body TokenRefreshRequest request);

    @Multipart
    @POST("candidate/resume/upload")
    Call<ApiModels.ResumeUploadResponse> uploadCandidateResume(@Part MultipartBody.Part resumeFile);

    @POST("candidate/resume/parse")
    Call<ApiModels.ResumeParseResponse> parseCandidateResume(@Body ApiModels.ResumeParseRequest request);

    @POST("candidate/resume/parse-start")
    Call<ApiModels.ResumeParseStatusResponse> startCandidateResumeParse();

    @GET("candidate/resume/parse-status")
    Call<ApiModels.ResumeParseStatusResponse> getCandidateResumeParseStatus(@Query("job_id") String jobId);

    @POST("candidate/resume/parse-cancel")
    Call<ApiModels.ResumeParseStatusResponse> cancelCandidateResumeParse(@Query("job_id") String jobId);

    @POST("candidate/resume/parse-retry")
    Call<ApiModels.ResumeParseStatusResponse> retryCandidateResumeParse(@Query("resume_id") String resumeId, @Query("force") String force);

    @GET("candidate/profile")
    Call<ApiModels.CandidateProfileResponse> getCandidateProfile();

    @PUT("candidate/profile")
    Call<ApiModels.CandidateProfileResponse> updateCandidateProfile(@Body ApiModels.CandidateProfileUpdateRequest request);

    @POST("candidate/resume/remove")
    Call<ApiModels.GenericSuccessResponse> removeCandidateResume();

    @GET("jobs")
    Call<List<ApiJob>> getJobs(
            @Query("type") String type,
            @Query("remote") String remote,
            @Query("search") String search
    );

    @GET("recruiter/jobs")
    Call<List<ApiJob>> getRecruiterJobs();

    @GET("recruiter/jobs")
    Call<List<ApiJob>> getRecruiterJobsFiltered(
            @Query("search") String search,
            @Query("status") String status,
            @Query("ordering") String ordering
    );

    @GET("recruiter/jobs/{id}/applicants")
    Call<List<ApplicationDto>> getRecruiterJobApplicants(@Path("id") int jobId);

    @GET("recruiter/jobs/{id}")
    Call<ApiJob> getRecruiterJobDetail(@Path("id") int jobId);

    @PATCH("recruiter/jobs/{id}")
    Call<ApiJob> patchRecruiterJob(@Path("id") int jobId, @Body PublishJobRequest request);

    @POST("recruiter/jobs/{id}/close")
    Call<ApiJob> closeRecruiterJob(@Path("id") int jobId);

    @retrofit2.http.DELETE("recruiter/jobs/{id}")
    Call<Void> deleteRecruiterJob(@Path("id") int jobId);

    @POST("recruiter/jobs")
    Call<ApiJob> publishRecruiterJob(@Body PublishJobRequest request);

    @GET("recruiter/offers")
    Call<List<RecruiterOfferDto>> getRecruiterOffers();

    @GET("recruiter/offers")
    Call<List<RecruiterOfferDto>> getRecruiterOffersFiltered(@Query("status") String status);

    @GET("recruiter/offers/{id}")
    Call<RecruiterOfferDto> getRecruiterOfferDetail(@Path("id") int offerId);

    @PATCH("recruiter/offers/{id}")
    Call<RecruiterOfferDto> patchRecruiterOffer(@Path("id") int offerId, @Body java.util.Map<String, String> body);

    @GET("recruiter/dashboard")
    Call<ApiModels.RecruiterDashboardResponse> getRecruiterDashboard();

    @GET("recruiter/profile")
    Call<ApiModels.RecruiterProfileResponse> getRecruiterProfile();

    @PUT("recruiter/profile")
    Call<ApiModels.RecruiterProfileResponse> updateRecruiterProfile(@Body ApiModels.RecruiterProfileUpdateRequest request);

    @GET("notifications/mine")
    Call<List<ApiModels.NotificationDto>> getMyNotifications();

    @POST("devices/register")
    Call<ApiModels.DeviceRegisterResponse> registerDevice(@Body ApiModels.DeviceRegisterRequest request);

    @POST("recruiter/applications/{id}/action")
    Call<ApplicationDto> recruiterApplicationAction(@Path("id") int applicationId, @Body java.util.Map<String, String> body);

    @GET("recruiter/applications/{id}/candidate-profile")
    Call<ApiModels.RecruiterCandidateProfileResponse> getRecruiterCandidateProfile(@Path("id") int applicationId);

    @POST("jobs/{id}/match-score")
    Call<MatchScoreResponse> getMatchScore(@Path("id") String jobId);

    @POST("applications")
    Call<ApplicationDto> apply(@Body ApplyRequest request);

    @GET("applications/mine")
    Call<List<ApplicationDto>> myApplications();

    @GET("applications/mine/{id}")
    Call<ApiModels.ApplicationDetailResponse> myApplicationDetail(@Path("id") int applicationId);

    @POST("applications/{id}/hr/prep")
    Call<Void> hrPrep(@Path("id") int applicationId);

    @POST("applications/{id}/hr/start")
    Call<ApiModels.AssessmentStartResponse> hrStart(@Path("id") int applicationId);

    @POST("applications/{id}/hr/submit")
    Call<ApiModels.AssessmentSubmitResult> hrSubmit(@Path("id") int applicationId, @Body AssessmentSubmitRequest request);

    @POST("applications/{id}/tech/select-language")
    Call<ApiModels.AssessmentStartResponse> techSelectLanguage(@Path("id") int applicationId, @Body SelectLanguageRequest request);

    @POST("applications/{id}/tech/prep")
    Call<Void> techPrep(@Path("id") int applicationId, @Body SelectLanguageRequest request);

    @POST("applications/{id}/tech/start")
    Call<ApiModels.AssessmentStartResponse> techStart(@Path("id") int applicationId);

    @POST("applications/{id}/tech/submit")
    Call<ApiModels.AssessmentSubmitResult> techSubmit(@Path("id") int applicationId, @Body AssessmentSubmitRequest request);

    @GET("assessments/sessions/{id}/questions")
    Call<ApiModels.AssessmentQuestionsPageResponse> assessmentQuestions(@Path("id") int sessionId, @Query("page") int page, @Query("page_size") int pageSize);

    @POST("assessments/sessions/{id}/answer")
    Call<ApiModels.AssessmentAnswerResponse> assessmentAnswer(@Path("id") int sessionId, @Body ApiModels.AssessmentAnswerRequest request);

    @POST("assessments/sessions/{id}/submit")
    Call<ApiModels.AssessmentSubmitResult> assessmentSubmit(@Path("id") int sessionId, @Body AssessmentSubmitRequest request);

    @GET("assessments/sessions/{id}/status")
    Call<ApiModels.AssessmentStatusResponse> assessmentStatus(@Path("id") int sessionId);

    @GET("applications/{id}/offer")
    Call<OfferDto> getOffer(@Path("id") int applicationId);

    @POST("applications/{id}/offer/sign")
    Call<OfferDto> signOffer(@Path("id") int applicationId, @Body SignOfferRequest request);

    @POST("applications/{id}/offer/accept")
    Call<OfferDto> acceptOffer(@Path("id") int applicationId, @Body AcceptOfferRequest request);

    @GET
    Call<ResponseBody> downloadFile(@Url String url);
}
