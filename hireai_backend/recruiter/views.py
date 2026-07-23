from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from applications.models import Application, Offer
from applications.serializers import ApplicationDtoSerializer
from candidates.models import CandidateProfile
from jobs.models import Job
from jobs.serializers import JobSerializer, PublishJobSerializer
from notifications.models import Notification
from .models import RecruiterProfile
from .serializers import RecruiterProfileUpdateSerializer


def _require_recruiter(user):
    """Returns error Response if user is not a recruiter, else None."""
    if user.role != User.ROLE_RECRUITER:
        return Response({'detail': 'Recruiter access required.'}, status=status.HTTP_403_FORBIDDEN)
    return None


def _get_or_create_profile(user):
    profile, _ = RecruiterProfile.objects.get_or_create(user=user)
    return profile


# ─────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """Recruiter dashboard stats."""
    err = _require_recruiter(request.user)
    if err:
        return err

    user = request.user
    jobs = Job.objects.filter(created_by=user)
    live_jobs = jobs.filter(status=Job.STATUS_OPEN).count()
    job_ids = jobs.values_list('id', flat=True)

    all_apps = Application.objects.filter(job_id__in=job_ids)
    new_applicants = all_apps.filter(status=Application.STATUS_APPLIED).count()
    offers_sent = Offer.objects.filter(application__job_id__in=job_ids).count()
    interviews = all_apps.filter(
        status__in=[Application.STATUS_HR_PENDING, Application.STATUS_TECH_PENDING]
    ).count()

    # Recent activity
    recent = []
    recent_apps = all_apps.order_by('-applied_at')[:10]
    for app in recent_apps:
        recent.append({
            'id': str(app.id),
            'type': 'application',
            'title': f'New application for {app.job.title}',
            'body': f'{app.candidate.full_name} applied',
            'created_at': app.applied_at.isoformat(),
            'metadata': {'application_id': app.id, 'job_id': app.job_id},
        })

    return Response({
        'live_jobs_count': live_jobs,
        'new_applicants_count': new_applicants,
        'offers_sent_count': offers_sent,
        'interviews_count': interviews,
        'recent_activity': recent,
    })


# ─────────────────────────────────────────
# Recruiter Jobs
# ─────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recruiter_jobs_view(request):
    """List or create recruiter's jobs."""
    err = _require_recruiter(request.user)
    if err:
        return err

    if request.method == 'GET':
        qs = Job.objects.filter(created_by=request.user)
        search = request.query_params.get('search')
        status_filter = request.query_params.get('status')
        ordering = request.query_params.get('ordering')

        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(company__icontains=search))
        if status_filter:
            qs = qs.filter(status__iexact=status_filter)
        if ordering:
            qs = qs.order_by(ordering)

        return Response(JobSerializer(qs, many=True).data)

    # POST — create a new job
    serializer = PublishJobSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    job = Job.objects.create(
        title=data['title'],
        company=data['company'],
        location=data.get('location', ''),
        is_remote=data.get('is_remote', False),
        role_type=data.get('role_type', 'FULL_TIME'),
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        currency=data.get('currency', 'INR'),
        required_skills=data.get('required_skills', []),
        min_match_score=data.get('min_match_score', 70),
        status=Job.STATUS_OPEN,
        created_by=request.user,
    )

    return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def recruiter_job_detail_view(request, job_id):
    """Get, update, or delete a specific job."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        job = Job.objects.get(id=job_id, created_by=request.user)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(JobSerializer(job).data)

    if request.method == 'DELETE':
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH
    data = request.data
    for field in ['title', 'company', 'location', 'role_type', 'currency']:
        if field in data:
            setattr(job, field, data[field])
    if 'is_remote' in data:
        job.is_remote = data['is_remote']
    if 'salary_min' in data:
        job.salary_min = data['salary_min']
    if 'salary_max' in data:
        job.salary_max = data['salary_max']
    if 'required_skills' in data:
        job.required_skills = data['required_skills']
    if 'min_match_score' in data:
        job.min_match_score = data['min_match_score']
    job.save()
    return Response(JobSerializer(job).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recruiter_job_close_view(request, job_id):
    """Close a job."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        job = Job.objects.get(id=job_id, created_by=request.user)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    job.status = Job.STATUS_CLOSED
    job.save(update_fields=['status'])
    return Response(JobSerializer(job).data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruiter_job_applicants_view(request, job_id):
    """List applicants for a specific job."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        job = Job.objects.get(id=job_id, created_by=request.user)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    applications = Application.objects.filter(job=job).select_related('candidate', 'job')
    return Response(ApplicationDtoSerializer(applications, many=True).data)


# ─────────────────────────────────────────
# Recruiter Offers
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruiter_offers_view(request):
    """List all offers for recruiter's jobs."""
    err = _require_recruiter(request.user)
    if err:
        return err

    job_ids = Job.objects.filter(created_by=request.user).values_list('id', flat=True)
    offers = Offer.objects.filter(
        application__job_id__in=job_ids
    ).select_related('application__candidate', 'application__job')

    status_filter = request.query_params.get('status')
    if status_filter:
        offers = offers.filter(status__iexact=status_filter)

    data = []
    for offer in offers:
        app = offer.application
        data.append({
            'id': offer.id,
            'application': app.id,
            'candidate_name': app.candidate.full_name,
            'role': app.candidate.role,
            'candidate_email': app.candidate.email,
            'job_title': app.job.title,
            'company': app.job.company,
            'application_status': app.status,
            'status': offer.status,
            'created_at': offer.created_at.isoformat(),
        })

    return Response(data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def recruiter_offer_detail_view(request, offer_id):
    """Get or update an offer."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        offer = Offer.objects.select_related(
            'application__candidate', 'application__job'
        ).get(id=offer_id)
    except Offer.DoesNotExist:
        return Response({'detail': 'Offer not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        app = offer.application
        return Response({
            'id': offer.id,
            'application': app.id,
            'candidate_name': app.candidate.full_name,
            'role': app.candidate.role,
            'candidate_email': app.candidate.email,
            'job_title': app.job.title,
            'company': app.job.company,
            'application_status': app.status,
            'status': offer.status,
            'created_at': offer.created_at.isoformat(),
        })

    # PATCH
    if 'status' in request.data:
        offer.status = request.data['status']
        offer.save(update_fields=['status'])

    app = offer.application
    return Response({
        'id': offer.id,
        'application': app.id,
        'candidate_name': app.candidate.full_name,
        'role': app.candidate.role,
        'candidate_email': app.candidate.email,
        'job_title': app.job.title,
        'company': app.job.company,
        'application_status': app.status,
        'status': offer.status,
        'created_at': offer.created_at.isoformat(),
    })


# ─────────────────────────────────────────
# Application Actions
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recruiter_application_action_view(request, application_id):
    """Perform action on an application (shortlist, reject, send_offer)."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        app = Application.objects.select_related('job', 'candidate').get(id=application_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Verify this job belongs to the recruiter
    if app.job.created_by_id != request.user.id:
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get('action', '').lower()

    if action == 'shortlist':
        app.status = Application.STATUS_SHORTLISTED
        app.save(update_fields=['status'])
        app.compute_next_action()

        # Create notification for candidate
        Notification.objects.create(
            user=app.candidate,
            type='application_update',
            title='Application Shortlisted',
            body=f'Your application for {app.job.title} has been shortlisted!',
            payload={'application_id': app.id},
        )

    elif action == 'reject':
        app.status = Application.STATUS_REJECTED
        app.last_failure_reason = request.data.get('reason', 'Rejected by recruiter')
        app.save(update_fields=['status', 'last_failure_reason'])
        app.compute_next_action()

        Notification.objects.create(
            user=app.candidate,
            type='application_update',
            title='Application Update',
            body=f'Your application for {app.job.title} has been updated.',
            payload={'application_id': app.id},
        )

    elif action == 'send_offer':
        app.status = Application.STATUS_OFFER_SENT
        app.save(update_fields=['status'])
        app.compute_next_action()

        # Create offer
        offer, created = Offer.objects.get_or_create(
            application=app,
            defaults={
                'status': Offer.STATUS_PENDING,
                'offer_pdf_url': f'/media/offers/offer_{app.id}.pdf',
            }
        )

        Notification.objects.create(
            user=app.candidate,
            type='offer',
            title='Offer Received!',
            body=f'You have received an offer for {app.job.title} at {app.job.company}!',
            payload={'application_id': app.id, 'offer_id': offer.id},
        )

    else:
        return Response({'detail': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(ApplicationDtoSerializer(app).data)


# ─────────────────────────────────────────
# Recruiter - View Candidate Profile
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruiter_candidate_profile_view(request, application_id):
    """View candidate profile for an application."""
    err = _require_recruiter(request.user)
    if err:
        return err

    try:
        app = Application.objects.select_related('job', 'candidate').get(id=application_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    if app.job.created_by_id != request.user.id:
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    candidate = app.candidate
    parsed_resume = {}
    try:
        profile = candidate.candidate_profile
        parsed_resume = profile.parsed_resume_json or {}
    except CandidateProfile.DoesNotExist:
        pass

    # Get assessment scores
    from applications.models import AssessmentSession
    hr_sessions = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_HR
    ).order_by('-created_at')
    tech_sessions = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_TECH
    ).order_by('-created_at')

    hr_score_data = None
    if hr_sessions.exists() or app.hr_score is not None:
        hr_score_data = {
            'score': app.hr_score,
            'pass': app.hr_score is not None and app.hr_score >= 60,
            'status': 'completed' if app.hr_score is not None else 'pending',
            'threshold': 60,
        }

    tech_score_data = None
    if tech_sessions.exists() or app.tech_score is not None:
        tech_score_data = {
            'score': app.tech_score,
            'pass': app.tech_score is not None and app.tech_score >= 60,
            'status': 'completed' if app.tech_score is not None else 'pending',
            'threshold': 60,
        }

    return Response({
        'application_id': app.id,
        'job_id': app.job_id,
        'job_title': app.job.title,
        'application_status': app.status,
        'candidate': {
            'id': candidate.id,
            'full_name': candidate.full_name,
            'email': candidate.email,
            'phone': candidate.phone,
            'role': candidate.role,
            'location': '',
        },
        'scores': {
            'hr': hr_score_data,
            'tech': tech_score_data,
        },
        'parsed_resume_json': parsed_resume,
    })


# ─────────────────────────────────────────
# Recruiter Profile
# ─────────────────────────────────────────

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def recruiter_profile_view(request):
    """Get or update recruiter profile."""
    err = _require_recruiter(request.user)
    if err:
        return err

    user = request.user
    profile = _get_or_create_profile(user)

    if request.method == 'GET':
        return Response({
            'full_name': user.full_name,
            'email': user.email,
            'company_name': profile.company_name,
            'title': profile.title,
            'phone': profile.phone or user.phone,
            'linkedin_url': profile.linkedin_url,
            'bio': profile.bio,
        })

    # PUT
    serializer = RecruiterProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if 'full_name' in data and data['full_name']:
        user.full_name = data['full_name']
        user.save(update_fields=['full_name'])
    for field in ['company_name', 'title', 'phone', 'linkedin_url', 'bio']:
        if field in data:
            setattr(profile, field, data[field])
    profile.save()

    return Response({
        'full_name': user.full_name,
        'email': user.email,
        'company_name': profile.company_name,
        'title': profile.title,
        'phone': profile.phone or user.phone,
        'linkedin_url': profile.linkedin_url,
        'bio': profile.bio,
    })
