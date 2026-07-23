from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from candidates.models import CandidateProfile
from .models import Job
from .serializers import JobSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_jobs_view(request):
    """List all open jobs with optional filters (type, remote, search)."""
    qs = Job.objects.filter(status=Job.STATUS_OPEN)

    job_type = request.query_params.get('type')
    remote = request.query_params.get('remote')
    search = request.query_params.get('search')

    if job_type:
        qs = qs.filter(role_type__iexact=job_type)
    if remote and remote.lower() in ('true', '1', 'yes'):
        qs = qs.filter(is_remote=True)
    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(company__icontains=search) |
            Q(location__icontains=search)
        )

    serializer = JobSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_score_view(request, job_id):
    """Compute match score between candidate skills and job requirements."""
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if user.role != User.ROLE_CANDIDATE:
        return Response({'detail': 'Only candidates can check match score.'},
                        status=status.HTTP_403_FORBIDDEN)

    # Get candidate skills
    candidate_skills = set()
    try:
        profile = user.candidate_profile
        if profile.tech_stacks:
            candidate_skills.update(s.lower().strip() for s in profile.tech_stacks)
        parsed = profile.parsed_resume_json or {}
        if 'skills' in parsed and isinstance(parsed['skills'], list):
            candidate_skills.update(s.lower().strip() for s in parsed['skills'])
    except CandidateProfile.DoesNotExist:
        pass

    required_skills = [s.lower().strip() for s in (job.required_skills or [])]

    if not required_skills:
        score = 85  # Default high score if no specific skills required
    else:
        matched = [s for s in required_skills if s in candidate_skills]
        score = int((len(matched) / len(required_skills)) * 100)
        score = max(20, min(100, score))  # Floor at 20 to be encouraging

    missing = [s for s in (job.required_skills or []) if s.lower().strip() not in candidate_skills]
    top_strengths = [s for s in (job.required_skills or []) if s.lower().strip() in candidate_skills][:5]

    suggested = []
    for m in missing[:3]:
        suggested.append(f'Learn {m} to improve your match score')

    threshold = job.min_match_score

    return Response({
        'job_id': job.id,
        'score': score,
        'pass_status': score >= threshold,
        'missing_keywords': missing,
        'threshold': threshold,
        'cooldown_active': False,
        'retry_after_at': None,
        'top_strengths': top_strengths,
        'suggested_improvements': suggested,
    })
