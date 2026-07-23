from rest_framework import serializers


class CandidateProfileResponseSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(allow_blank=True)
    role = serializers.CharField()
    tech_stacks = serializers.ListField(child=serializers.CharField())
    resume_file_url = serializers.CharField(allow_blank=True, allow_null=True)
    resume_id = serializers.CharField(allow_blank=True)
    resume_hash = serializers.CharField(allow_blank=True)
    parse_status = serializers.CharField(allow_blank=True)
    parsed_resume_json = serializers.DictField(allow_null=True)
    updated_at = serializers.DateTimeField()


class CandidateProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    tech_stacks = serializers.ListField(child=serializers.CharField(), required=False)
    parsed_resume_json = serializers.DictField(required=False, allow_null=True)


class ResumeUploadResponseSerializer(serializers.Serializer):
    resume_file_url = serializers.CharField()
    resume_id = serializers.CharField()
    filename = serializers.CharField()
    parse_job_id = serializers.CharField()


class ResumeParseRequestSerializer(serializers.Serializer):
    resume_text = serializers.CharField(required=False, allow_blank=True)
    parsed_resume_json = serializers.DictField(required=False, allow_null=True)


class ResumeParseStatusSerializer(serializers.Serializer):
    job_id = serializers.CharField()
    status = serializers.CharField()
    progress = serializers.IntegerField()
    stage = serializers.CharField()
    message = serializers.CharField(allow_blank=True)
