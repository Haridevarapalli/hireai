from rest_framework import serializers
from .models import Application, AssessmentSession, AssessmentQuestion, Offer


class ApplicationDtoSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company = serializers.CharField(source='job.company', read_only=True)
    location = serializers.CharField(source='job.location', read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    last_updated = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'candidate_id', 'job_title', 'company',
            'candidate_name', 'candidate_email', 'match_score',
            'hr_score', 'tech_score', 'status', 'location',
            'applied_at', 'last_updated', 'next_action',
            'retry_eligible_at', 'updated_at', 'tech_language',
            'last_failure_reason',
        ]


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
