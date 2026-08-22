from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response


from accounts.models import User
from candidates.models import CandidateProfile
from .models import Job
from .serializers import JobSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
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



SKILL_ALIASES = {
    'js': {'javascript'},
    'javascript': {'js'},
    'ts': {'typescript'},
    'typescript': {'ts'},
    'reactjs': {'react'},
    'react.js': {'react'},
    'react': {'reactjs', 'react.js'},
    'nodejs': {'node.js'},
    'node': {'node.js', 'nodejs'},
    'node.js': {'node', 'nodejs'},
    'nextjs': {'next.js'},
    'next': {'next.js', 'nextjs'},
    'next.js': {'next', 'nextjs'},
    'mysql': {'sql'},
    'postgresql': {'sql', 'postgres'},
    'postgres': {'sql', 'postgresql'},
    'oracle': {'sql'},
    'plsql': {'sql', 'pl/sql'},
    'pl/sql': {'sql', 'plsql'},
    'spring': {'spring boot', 'springboot'},
    'springboot': {'spring boot', 'spring'},
    'spring boot': {'spring', 'springboot'},
    'rest api': {'rest apis', 'restful apis', 'restful api'},
    'rest apis': {'rest api', 'restful apis', 'restful api'},
    'aws': {'amazon web services'},
}


def _normalize_skills(skills_list):
    normalized = set()
    for s in skills_list:
        if not s or not isinstance(s, str):
            continue
        clean = s.lower().strip()
        if not clean:
            continue
        normalized.add(clean)
        if clean in SKILL_ALIASES:
            normalized.update(SKILL_ALIASES[clean])
    return normalized


def _match_skills(candidate_skills_set, required_skills):
    if not required_skills:
        return 85, [], []
    matched = []
    missing = []
    for req in required_skills:
        clean_req = req.lower().strip()
        aliases = SKILL_ALIASES.get(clean_req, set()) | {clean_req}
        if candidate_skills_set & aliases:
            matched.append(req)
        else:
            missing.append(req)
    score = round((len(matched) / len(required_skills)) * 100) if required_skills else 0
    return score, matched, missing


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

    raw_skills = []
    try:
        profile = user.candidate_profile
        if profile.tech_stacks:
            raw_skills.extend(profile.tech_stacks)
        parsed = profile.parsed_resume_json or {}
        if 'skills' in parsed and isinstance(parsed['skills'], list):
            raw_skills.extend(parsed['skills'])
    except CandidateProfile.DoesNotExist:
        pass

    candidate_skills = _normalize_skills(raw_skills)
    required_skills = job.required_skills or []
    score, matched, missing = _match_skills(candidate_skills, required_skills)
    top_strengths = matched[:5]

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


@api_view(['GET'])
@permission_classes([AllowAny])
def get_job_detail_view(request, job_id):
    """Retrieve full details of a specific job."""
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    data = JobSerializer(job).data

    # If user is authenticated candidate, compute dynamic match details
    if request.user.is_authenticated and request.user.role == 'CANDIDATE':
        raw_skills = []
        try:
            profile = request.user.candidate_profile
            if profile.tech_stacks:
                raw_skills.extend(profile.tech_stacks)
            parsed = profile.parsed_resume_json or {}
            if 'skills' in parsed and isinstance(parsed['skills'], list):
                raw_skills.extend(parsed['skills'])
        except Exception:
            pass

        candidate_skills = _normalize_skills(raw_skills)
        req_skills = job.required_skills or []
        score, matched, missing = _match_skills(candidate_skills, req_skills)

        data['match_score'] = score
        data['matched_skills'] = matched
        data['missing_skills'] = missing

    return Response(data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_job_view(request, job_id):
    """Toggle saving/bookmarking a job for the candidate."""
    from .models import SavedJob
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    saved_entry = SavedJob.objects.filter(candidate=request.user, job=job).first()
    if saved_entry:
        saved_entry.delete()
        return Response({'saved': False, 'message': 'Job removed from saved jobs.'})
    else:
        SavedJob.objects.create(candidate=request.user, job=job)
        return Response({'saved': True, 'message': 'Job saved successfully.'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_saved_jobs_view(request):
    """List all jobs saved by the candidate."""
    from .models import SavedJob
    saved = SavedJob.objects.filter(candidate=request.user).select_related('job')
    jobs_list = [s.job for s in saved]
    serializer = JobSerializer(jobs_list, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_recommended_jobs_view(request):
    """List open jobs sorted dynamically by match score with the candidate profile."""
    raw_skills = []
    if request.user.is_authenticated and getattr(request.user, 'role', '') == User.ROLE_CANDIDATE:
        try:
            profile = request.user.candidate_profile
            if profile.tech_stacks:
                raw_skills.extend(profile.tech_stacks)
            parsed = profile.parsed_resume_json or {}
            if 'skills' in parsed and isinstance(parsed['skills'], list):
                raw_skills.extend(parsed['skills'])
        except Exception:
            pass

    candidate_skills = _normalize_skills(raw_skills)
    open_jobs = Job.objects.filter(status=Job.STATUS_OPEN)
    results = []

    for j in open_jobs:
        req_skills = j.required_skills or []
        if not req_skills:
            score = 85
            matched = []
            missing = []
        elif candidate_skills:
            score, matched, missing = _match_skills(candidate_skills, req_skills)
        else:
            score = 75
            matched = []
            missing = req_skills

        data = JobSerializer(j).data
        data['match_score'] = score
        data['matched_skills'] = matched
        data['missing_skills'] = missing
        results.append(data)

    results.sort(key=lambda x: x['match_score'], reverse=True)
    return Response(results)


