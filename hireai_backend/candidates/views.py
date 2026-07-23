import hashlib
import uuid

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from .models import CandidateProfile
from .serializers import (
    CandidateProfileUpdateSerializer,
    ResumeParseRequestSerializer,
)

# In-memory parse job tracker (dev only — would use Celery in production)
_parse_jobs = {}


def _get_or_create_profile(user):
    profile, _ = CandidateProfile.objects.get_or_create(user=user)
    return profile


def _profile_response(user, profile):
    resume_url = ''
    if profile.resume_file:
        resume_url = profile.resume_file.url
    return {
        'full_name': user.full_name,
        'email': user.email,
        'phone': profile.phone or user.phone,
        'role': user.role,
        'tech_stacks': profile.tech_stacks or [],
        'resume_file_url': resume_url,
        'resume_id': profile.resume_id,
        'resume_hash': profile.resume_hash,
        'parse_status': profile.parse_status,
        'parsed_resume_json': profile.parsed_resume_json or {},
        'updated_at': profile.updated_at.isoformat() if profile.updated_at else '',
    }


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def candidate_profile_view(request):
    """GET or PUT candidate profile."""
    user = request.user
    if user.role != User.ROLE_CANDIDATE:
        return Response({'detail': 'Not a candidate.'}, status=status.HTTP_403_FORBIDDEN)

    profile = _get_or_create_profile(user)

    if request.method == 'GET':
        return Response(_profile_response(user, profile))

    # PUT
    serializer = CandidateProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if 'full_name' in data and data['full_name']:
        user.full_name = data['full_name']
        user.save(update_fields=['full_name'])
    if 'phone' in data:
        profile.phone = data['phone']
    if 'tech_stacks' in data:
        profile.tech_stacks = data['tech_stacks']
    if 'parsed_resume_json' in data and data['parsed_resume_json'] is not None:
        profile.parsed_resume_json = data['parsed_resume_json']
        profile.parse_status = 'completed'
    profile.save()

    return Response(_profile_response(user, profile))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def resume_upload_view(request):
    """Upload resume file (multipart)."""
    user = request.user
    profile = _get_or_create_profile(user)

    resume_file = request.FILES.get('resumeFile') or request.FILES.get('resume_file')
    if not resume_file:
        # Try the first file in the request
        for key in request.FILES:
            resume_file = request.FILES[key]
            break

    if not resume_file:
        return Response({'detail': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    # Save file
    profile.resume_file = resume_file
    profile.resume_id = str(uuid.uuid4())
    profile.resume_hash = hashlib.md5(resume_file.read()).hexdigest()
    resume_file.seek(0)
    profile.parse_status = 'uploaded'
    profile.save()

    # Create a parse job
    job_id = str(uuid.uuid4())
    _parse_jobs[job_id] = {
        'user_id': user.id,
        'status': 'pending',
        'progress': 0,
        'stage': 'uploading',
        'message': 'Resume uploaded, parsing will begin shortly.',
        'created_at': timezone.now(),
    }

    return Response({
        'resume_file_url': profile.resume_file.url,
        'resume_id': profile.resume_id,
        'filename': resume_file.name,
        'parse_job_id': job_id,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_parse_view(request):
    """Accept parsed resume data from client."""
    user = request.user
    profile = _get_or_create_profile(user)

    serializer = ResumeParseRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if data.get('parsed_resume_json'):
        profile.parsed_resume_json = data['parsed_resume_json']
        profile.parse_status = 'completed'
        profile.save()

    return Response({
        'parsed_resume_json': profile.parsed_resume_json or {},
        'parsed': True,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_parse_start_view(request):
    """Start resume parsing job (simulated)."""
    user = request.user
    profile = _get_or_create_profile(user)

    job_id = str(uuid.uuid4())

    # Simulate completed parsing with sample data
    sample_parsed = _generate_sample_parsed_resume(user, profile)
    profile.parsed_resume_json = sample_parsed
    profile.parse_status = 'completed'
    profile.save()

    _parse_jobs[job_id] = {
        'user_id': user.id,
        'status': 'completed',
        'progress': 100,
        'stage': 'done',
        'message': 'Resume parsed successfully.',
        'created_at': timezone.now(),
    }

    return Response({
        'job_id': job_id,
        'status': 'completed',
        'progress': 100,
        'stage': 'done',
        'message': 'Resume parsed successfully.',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_parse_status_view(request):
    """Check parsing job status."""
    job_id = request.query_params.get('job_id', '')

    if job_id and job_id in _parse_jobs:
        job = _parse_jobs[job_id]
        # Simulate progress advancement
        if job['status'] != 'completed':
            job['progress'] = min(100, job['progress'] + 35)
            if job['progress'] >= 100:
                job['status'] = 'completed'
                job['stage'] = 'done'
                job['message'] = 'Resume parsed successfully.'
                # Also update the profile
                user = request.user
                profile = _get_or_create_profile(user)
                if not profile.parsed_resume_json:
                    profile.parsed_resume_json = _generate_sample_parsed_resume(user, profile)
                    profile.parse_status = 'completed'
                    profile.save()
            elif job['progress'] >= 60:
                job['stage'] = 'analyzing'
                job['message'] = 'Extracting skills and experience...'
            else:
                job['stage'] = 'parsing'
                job['message'] = 'Reading resume content...'

        return Response({
            'job_id': job_id,
            'status': job['status'],
            'progress': job['progress'],
            'stage': job['stage'],
            'message': job['message'],
        })

    # No job found — return completed to avoid blocking
    return Response({
        'job_id': job_id or 'unknown',
        'status': 'completed',
        'progress': 100,
        'stage': 'done',
        'message': 'Parse complete.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_parse_cancel_view(request):
    """Cancel an in-progress parse."""
    job_id = request.query_params.get('job_id', '')
    if job_id in _parse_jobs:
        _parse_jobs[job_id]['status'] = 'cancelled'
        _parse_jobs[job_id]['message'] = 'Cancelled by user.'
    return Response({
        'job_id': job_id,
        'status': 'cancelled',
        'progress': 0,
        'stage': 'cancelled',
        'message': 'Parse cancelled.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_parse_retry_view(request):
    """Retry resume parsing."""
    resume_id = request.query_params.get('resume_id', '')
    user = request.user
    profile = _get_or_create_profile(user)

    job_id = str(uuid.uuid4())
    sample_parsed = _generate_sample_parsed_resume(user, profile)
    profile.parsed_resume_json = sample_parsed
    profile.parse_status = 'completed'
    profile.save()

    _parse_jobs[job_id] = {
        'user_id': user.id,
        'status': 'completed',
        'progress': 100,
        'stage': 'done',
        'message': 'Resume re-parsed successfully.',
        'created_at': timezone.now(),
    }

    return Response({
        'job_id': job_id,
        'status': 'completed',
        'progress': 100,
        'stage': 'done',
        'message': 'Resume re-parsed successfully.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resume_remove_view(request):
    """Remove candidate's resume."""
    user = request.user
    profile = _get_or_create_profile(user)
    if profile.resume_file:
        profile.resume_file.delete(save=False)
    profile.resume_file = None
    profile.resume_id = ''
    profile.resume_hash = ''
    profile.parse_status = ''
    profile.parsed_resume_json = {}
    profile.save()
    return Response({'removed': True})


def _generate_sample_parsed_resume(user, profile):
    """Generate a realistic sample parsed resume JSON."""
    name = user.full_name or 'Candidate'
    tech_stacks = profile.tech_stacks or ['Python', 'JavaScript']
    return {
        'name': name,
        'email': user.email,
        'phone': profile.phone or user.phone or '+91 9876543210',
        'summary': f'{name} is an experienced software developer with expertise in {", ".join(tech_stacks[:3])}.',
        'skills': tech_stacks + ['Git', 'REST APIs', 'SQL', 'Problem Solving'],
        'experience': [
            {
                'title': 'Software Developer',
                'company': 'Tech Corp',
                'duration': '2 years',
                'description': f'Developed and maintained applications using {", ".join(tech_stacks[:2])}.',
            },
            {
                'title': 'Junior Developer',
                'company': 'StartUp Inc.',
                'duration': '1 year',
                'description': 'Worked on full-stack development and API integrations.',
            },
        ],
        'education': [
            {
                'degree': 'Bachelor of Science in Computer Science',
                'institution': 'University of Technology',
                'year': '2022',
            },
        ],
        'certifications': ['AWS Cloud Practitioner', 'Google Analytics Certified'],
    }
