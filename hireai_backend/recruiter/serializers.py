from rest_framework import serializers


class RecruiterProfileResponseSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    company_name = serializers.CharField(allow_blank=True)
    title = serializers.CharField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    linkedin_url = serializers.CharField(allow_blank=True)
    bio = serializers.CharField(allow_blank=True)


class RecruiterProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    linkedin_url = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)


class RecruiterDashboardSerializer(serializers.Serializer):
    live_jobs_count = serializers.IntegerField()
    new_applicants_count = serializers.IntegerField()
    offers_sent_count = serializers.IntegerField()
    interviews_count = serializers.IntegerField()
    recent_activity = serializers.ListField()
