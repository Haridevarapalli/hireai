from rest_framework import serializers
from .models import Application, AssessmentSession, AssessmentQuestion, Offer


class ApplicationDtoSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company = serializers.CharField(source='job.company', read_only=True)
    location = serializers.CharField(source='job.location', read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    candidate_phone = serializers.CharField(source='candidate.phone', read_only=True)
    last_updated = serializers.DateTimeField(source='updated_at', read_only=True)
    skills = serializers.SerializerMethodField()
    resume_file_url = serializers.SerializerMethodField()
    ats_score = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'candidate_id', 'job_title', 'company',
            'candidate_name', 'candidate_email', 'candidate_phone', 'match_score',
            'hr_score', 'tech_score', 'status', 'location',
            'applied_at', 'last_updated', 'next_action',
            'retry_eligible_at', 'updated_at', 'tech_language',
            'last_failure_reason', 'skills', 'resume_file_url', 'ats_score',
        ]

    def get_match_score(self, obj):
        try:
            raw_skills = []
            profile = obj.candidate.candidate_profile
            if profile.tech_stacks:
                raw_skills.extend(profile.tech_stacks)
            parsed = profile.parsed_resume_json or {}
            if 'skills' in parsed and isinstance(parsed['skills'], list):
                raw_skills.extend(parsed['skills'])
            from jobs.views import _normalize_skills, _match_skills
            candidate_skills = _normalize_skills(raw_skills)
            req_skills = obj.job.required_skills or []
            score, _, _ = _match_skills(candidate_skills, req_skills)
            return score
        except Exception:
            return obj.match_score or 0

    def get_skills(self, obj):
        try:
            profile = obj.candidate.candidate_profile
            return profile.tech_stacks or profile.parsed_resume_json.get('skills', [])
        except Exception:
            return []

    def get_resume_file_url(self, obj):
        try:
            profile = obj.candidate.candidate_profile
            if profile.resume_file:
                return profile.resume_file.url
        except Exception:
            pass
        return None

    def get_ats_score(self, obj):
        try:
            profile = obj.candidate.candidate_profile
            parsed = profile.parsed_resume_json or {}
            if 'overallScore' in parsed:
                return parsed['overallScore']
        except Exception:
            pass
        return obj.match_score or 0


class ApplicationTimelineSerializer(serializers.Serializer):
    stage = serializers.CharField()
    status = serializers.CharField()
    score = serializers.FloatField(allow_null=True)
    threshold = serializers.IntegerField(allow_null=True)
    language = serializers.CharField(allow_blank=True, allow_null=True)
    at = serializers.DateTimeField(allow_null=True)


class ApplicationDetailSerializer(ApplicationDtoSerializer):
    timeline = ApplicationTimelineSerializer(many=True, read_only=True)

    class Meta(ApplicationDtoSerializer.Meta):
        fields = ApplicationDtoSerializer.Meta.fields + ['timeline']


class ApplyRequestSerializer(serializers.Serializer):
    job_id = serializers.IntegerField()


class AssessmentStartResponseSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentSession
        fields = [
            'session_id', 'application_id', 'stage', 'language',
            'status', 'ends_at', 'duration_secs', 'total_questions',
            'answered_questions', 'exam_mode', 'questions',
        ]

    session_id = serializers.IntegerField(source='id')
    application_id = serializers.IntegerField(source='application.id')

    def get_questions(self, obj):
        questions = obj.questions.all()
        return [
            {
                'id': q.id,
                'prompt': q.prompt,
                'options': q.options,
                'tags': q.tags,
                'selected_option_index': None,
                'is_correct': None,
                'explanation': '',
                'correct_option': None,
            }
            for q in questions
        ]


class AssessmentQuestionDtoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    prompt = serializers.CharField()
    options = serializers.ListField()
    tags = serializers.ListField()
    selected_option_index = serializers.IntegerField(allow_null=True)
    is_correct = serializers.BooleanField(allow_null=True)
    explanation = serializers.CharField(allow_blank=True)
    correct_option = serializers.IntegerField(allow_null=True)


class AssessmentAnswerRequestSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_index = serializers.IntegerField()
    time_spent_ms = serializers.IntegerField(default=0)


class AssessmentSubmitRequestSerializer(serializers.Serializer):
    score = serializers.FloatField(required=False, allow_null=True)
    responses = AssessmentAnswerRequestSerializer(many=True, required=False)


class SelectLanguageRequestSerializer(serializers.Serializer):
    language = serializers.CharField(max_length=50)


class OfferDtoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ['id', 'application', 'status', 'offer_pdf_url', 'signed_pdf_url']


class SignOfferRequestSerializer(serializers.Serializer):
    signature_image_url = serializers.CharField(allow_blank=True)
    accepted_terms = serializers.BooleanField()


class AcceptOfferRequestSerializer(serializers.Serializer):
    accepted = serializers.BooleanField(default=True)
