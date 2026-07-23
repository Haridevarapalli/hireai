from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    required_skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'location', 'is_remote',
            'role_type', 'salary_min', 'salary_max', 'currency',
            'required_skills', 'min_match_score', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']


class PublishJobSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    company = serializers.CharField(max_length=255)
    location = serializers.CharField(max_length=255, required=False, default='')
    is_remote = serializers.BooleanField(default=False)
    role_type = serializers.CharField(max_length=30, default='FULL_TIME')
    salary_min = serializers.IntegerField(required=False, allow_null=True)
    salary_max = serializers.IntegerField(required=False, allow_null=True)
    currency = serializers.CharField(max_length=10, default='INR')
    required_skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    min_match_score = serializers.IntegerField(default=70)


class MatchScoreResponseSerializer(serializers.Serializer):
    job_id = serializers.IntegerField()
    score = serializers.IntegerField()
    pass_status = serializers.BooleanField()
    missing_keywords = serializers.ListField(child=serializers.CharField())
    threshold = serializers.IntegerField()
    cooldown_active = serializers.BooleanField(allow_null=True)
    retry_after_at = serializers.CharField(allow_blank=True, allow_null=True)
    top_strengths = serializers.ListField(child=serializers.CharField())
    suggested_improvements = serializers.ListField(child=serializers.CharField())
