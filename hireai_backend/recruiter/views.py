from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
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

import logging
logger = logging.getLogger(__name__)



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

    all_apps = Application.objects.filter(job_id__in=job_ids).select_related('candidate', 'job')
    total_apps = all_apps.count()
    new_applicants = all_apps.filter(status=Application.STATUS_APPLIED).count()
    shortlisted_count = all_apps.filter(status=Application.STATUS_SHORTLISTED).count()
    ai_screened_count = all_apps.filter(
        status__in=[Application.STATUS_AI_SCREENING, Application.STATUS_HR_PASSED, Application.STATUS_HR_PENDING]
    ).count()
    
    interviews = all_apps.filter(
        status__in=[Application.STATUS_INTERVIEW, Application.STATUS_TECH_PENDING, Application.STATUS_TECH_PASSED]
    ).count()
    
    offers_sent = Offer.objects.filter(application__job_id__in=job_ids).count()
    hired_count = all_apps.filter(
        status__in=[Application.STATUS_OFFER_ACCEPTED, Application.STATUS_OFFER_SIGNED, Application.STATUS_OFFER_SENT]
    ).count()

    # Application Pipeline Breakdown
    pipeline = {
        'applied': all_apps.filter(status=Application.STATUS_APPLIED).count(),
        'ai_screening': ai_screened_count,
        'shortlisted': shortlisted_count,
        'interview': interviews,
        'hired': hired_count,
        'rejected': all_apps.filter(status=Application.STATUS_REJECTED).count(),
    }

    # Top matching candidates
    from jobs.views import _normalize_skills, _match_skills
    top_matches = []
    app_scores = []
    for app in all_apps:
        cand_skills = []
        try:
            cand_profile = app.candidate.candidate_profile
            cand_skills = cand_profile.tech_stacks or cand_profile.parsed_resume_json.get('skills', [])
        except Exception:
            pass
        score, _, _ = _match_skills(_normalize_skills(cand_skills), app.job.required_skills or [])
        app_scores.append((app, cand_skills, score))

    app_scores.sort(key=lambda x: x[2], reverse=True)
    for app, cand_skills, score in app_scores[:6]:
        top_matches.append({
            'application_id': app.id,
            'candidate_id': app.candidate.id,
            'candidate_name': app.candidate.full_name or app.candidate.email.split('@')[0],
            'candidate_email': app.candidate.email,
            'job_id': app.job.id,
            'job_title': app.job.title,
            'match_score': score,
            'ats_score': score,
            'status': app.status,
            'skills': cand_skills[:5],
            'applied_at': app.applied_at.isoformat(),
        })

    # Active job postings summary
    active_jobs_list = []
    for j in jobs.filter(status=Job.STATUS_OPEN).order_by('-created_at')[:5]:
        active_jobs_list.append({
            'id': j.id,
            'title': j.title,
            'company': j.company,
            'location': j.location or 'Remote',
            'role_type': j.role_type,
            'applicants_count': all_apps.filter(job=j).count(),
            'required_skills': j.required_skills[:4] if isinstance(j.required_skills, list) else [],
            'created_at': j.created_at.isoformat(),
        })

    # Recent activity
    recent = []
    recent_apps = all_apps.order_by('-applied_at')[:10]
    for app in recent_apps:
        recent.append({
            'id': str(app.id),
            'type': 'application',
            'title': f'New application for {app.job.title}',
            'body': f'{app.candidate.full_name or app.candidate.email} applied with {app.match_score or 75}% match',
            'created_at': app.applied_at.isoformat(),
            'metadata': {'application_id': app.id, 'job_id': app.job_id, 'match_score': app.match_score, 'status': app.status},
        })

    return Response({
        'live_jobs_count': live_jobs,
        'total_applications_count': total_apps,
        'new_applicants_count': new_applicants,
        'ai_screened_count': ai_screened_count,
        'shortlisted_count': shortlisted_count,
        'interviews_count': interviews,
        'offers_sent_count': offers_sent,
        'hired_count': hired_count,
        'pipeline': pipeline,
        'top_matching_candidates': top_matches,
        'active_jobs': active_jobs_list,
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
def recruiter_all_applicants_view(request):
    """List all applicants across all jobs posted by the recruiter."""
    err = _require_recruiter(request.user)
    if err:
        return err

    job_ids = Job.objects.filter(created_by=request.user).values_list('id', flat=True)
    applications = Application.objects.filter(job_id__in=job_ids).select_related('candidate', 'job')

    status_filter = request.query_params.get('status')
    if status_filter:
        applications = applications.filter(status__iexact=status_filter)

    return Response(ApplicationDtoSerializer(applications, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruiter_ai_screening_view(request):
    """
    List applications strictly in the AI_SCREENING stage for jobs posted by this recruiter.
    Enforces that ONLY applications with status == 'ai_screening' are returned.
    """
    err = _require_recruiter(request.user)
    if err:
        return err

    job_ids = Job.objects.filter(created_by=request.user).values_list('id', flat=True)
    applications = Application.objects.filter(
        job_id__in=job_ids,
        status=Application.STATUS_AI_SCREENING
    ).select_related('candidate', 'job')

    return Response(ApplicationDtoSerializer(applications, many=True).data)


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
    """Perform stage-dependent action on an application (move_to_ai_screening, shortlist, schedule_interview, hire/send_offer, reject)."""
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
    prev_status = app.status

    # Strict stage transition validations:
    # Applied -> AI Screening -> Shortlisted -> Interview -> Hired / Offer (or Rejected from non-terminal stage)
    if action in ('move_to_ai_screening', 'ai_screening'):
        if prev_status != Application.STATUS_APPLIED:
            return Response(
                {'detail': f'Cannot move to AI Screening from stage "{prev_status}". Only allowed from "Applied" stage.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        app.status = Application.STATUS_AI_SCREENING
        app.save(update_fields=['status'])
        app.compute_next_action()

        try:
            from applications.models import ApplicationStatusHistory
            ApplicationStatusHistory.objects.create(
                application=app,
                from_status=prev_status,
                to_status=Application.STATUS_AI_SCREENING,
                changed_by=request.user,
                note='Moved to AI screening stage',
            )
        except Exception:
            pass

        cand_name = app.candidate.full_name or app.candidate.username or 'Candidate'
        Notification.objects.create(
            user=app.candidate,
            type='ai_screening',
            title='AI Screening in Progress 🧠',
            body=f'Your application for {app.job.title} at {app.job.company} is being evaluated in AI screening.',
            payload={'application_id': app.id, 'job_id': app.job.id},
        )
        Notification.objects.create(
            user=request.user,
            type='ai_screening',
            title='Candidate Moved to AI Screening 🧠',
            body=f'{cand_name} was moved to AI Screening for {app.job.title}',
            payload={'application_id': app.id, 'job_id': app.job.id, 'candidate_name': cand_name, 'route': '/recruiter/ai-screening'},
        )

    elif action == 'shortlist':
        if prev_status not in (Application.STATUS_AI_SCREENING, Application.STATUS_HR_PASSED, Application.STATUS_HR_PENDING):
            return Response(
                {'detail': f'Cannot shortlist from stage "{prev_status}". Candidate must be in "AI Screening" stage first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        app.status = Application.STATUS_SHORTLISTED
        app.save(update_fields=['status'])
        app.compute_next_action()

        try:
            from applications.models import ApplicationStatusHistory
            ApplicationStatusHistory.objects.create(
                application=app,
                from_status=prev_status,
                to_status=Application.STATUS_SHORTLISTED,
                changed_by=request.user,
                note='Shortlisted by recruiter',
            )
        except Exception:
            pass

        cand_name = app.candidate.full_name or app.candidate.username or 'Candidate'
        Notification.objects.create(
            user=app.candidate,
            type='shortlist',
            title='Application Shortlisted 🎉',
            body=f'Congratulations! Your application for {app.job.title} at {app.job.company} has been shortlisted.',
            payload={'application_id': app.id, 'job_id': app.job.id},
        )
        Notification.objects.create(
            user=request.user,
            type='shortlist',
            title='Candidate Shortlisted ⭐',
            body=f'{cand_name} was shortlisted for {app.job.title}',
            payload={'application_id': app.id, 'job_id': app.job.id, 'candidate_name': cand_name, 'route': '/recruiter/shortlisted'},
        )

    elif action in ('schedule_interview', 'interview'):
        if prev_status != Application.STATUS_SHORTLISTED:
            return Response(
                {'detail': f'Cannot schedule interview from stage "{prev_status}". Candidate must be "Shortlisted" first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        app.status = Application.STATUS_INTERVIEW
        app.save(update_fields=['status'])
        app.compute_next_action()

        try:
            from applications.models import ApplicationStatusHistory, Interview
            ApplicationStatusHistory.objects.create(
                application=app,
                from_status=prev_status,
                to_status=Application.STATUS_INTERVIEW,
                changed_by=request.user,
                note='Interview scheduled with candidate',
            )
            # Create scheduled Interview record only if not already scheduled
            if not Interview.objects.filter(application=app, status=Interview.STATUS_SCHEDULED).exists():
                scheduled_date = timezone.now() + timedelta(days=2, hours=10)
                Interview.objects.create(
                    application=app,
                    candidate=app.candidate,
                    recruiter=request.user,
                    job=app.job,
                    title=f'Technical & HR Discussion - {app.job.title}',
                    scheduled_at=scheduled_date,
                    duration_minutes=45,
                    meeting_link='https://meet.google.com/smarthire-ai-interview',
                    interview_type='HR & Technical Round',
                    status=Interview.STATUS_SCHEDULED,
                    notes=request.data.get('notes', 'Please be prepared to discuss your projects and technical skills.'),
                )
        except Exception as err:
            logger.error(f'Failed to schedule interview record: {err}')

        cand_name = app.candidate.full_name or app.candidate.username or 'Candidate'
        Notification.objects.create(
            user=app.candidate,
            type='interview',
            title='Interview Scheduled 📅',
            body=f'An interview has been scheduled for your application to {app.job.title} at {app.job.company}!',
            payload={'application_id': app.id, 'job_id': app.job.id},
        )
        Notification.objects.create(
            user=request.user,
            type='interview',
            title='Interview Scheduled 📅',
            body=f'Interview scheduled with {cand_name} for {app.job.title}',
            payload={'application_id': app.id, 'job_id': app.job.id, 'candidate_name': cand_name, 'route': '/recruiter/interviews'},
        )

    elif action in ('hire', 'hired', 'send_offer'):
        if prev_status not in (Application.STATUS_INTERVIEW, Application.STATUS_TECH_PASSED, Application.STATUS_TECH_PENDING):
            return Response(
                {'detail': f'Cannot hire / send offer from stage "{prev_status}". Candidate must be in "Interview" stage first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        app.status = Application.STATUS_OFFER_ACCEPTED if action in ('hire', 'hired') else Application.STATUS_OFFER_SENT
        app.save(update_fields=['status'])
        app.compute_next_action()

        try:
            from applications.models import ApplicationStatusHistory
            ApplicationStatusHistory.objects.create(
                application=app,
                from_status=prev_status,
                to_status=app.status,
                changed_by=request.user,
                note='Candidate hired / offer extended',
            )
        except Exception:
            pass

        offer, created = Offer.objects.get_or_create(
            application=app,
            defaults={
                'status': Offer.STATUS_ACCEPTED if action in ('hire', 'hired') else Offer.STATUS_PENDING,
                'offer_pdf_url': f'/media/offers/offer_{app.id}.pdf',
            }
        )
        if not created and action in ('hire', 'hired'):
            offer.status = Offer.STATUS_ACCEPTED
            offer.save(update_fields=['status'])

        cand_name = app.candidate.full_name or app.candidate.username or 'Candidate'
        Notification.objects.create(
            user=app.candidate,
            type='offer',
            title='Hired! Congratulations 🎉' if action in ('hire', 'hired') else 'Offer Letter Received 💼',
            body=f'Congratulations! You have been selected for {app.job.title} at {app.job.company}!',
            payload={'application_id': app.id, 'offer_id': offer.id},
        )
        Notification.objects.create(
            user=request.user,
            type='offer',
            title='Candidate Hired / Offer Sent 🏆',
            body=f'{cand_name} was hired / offer sent for {app.job.title}',
            payload={'application_id': app.id, 'job_id': app.job.id, 'candidate_name': cand_name, 'route': '/recruiter/applicants'},
        )

    elif action == 'reject':
        if prev_status in (Application.STATUS_OFFER_ACCEPTED, Application.STATUS_OFFER_SIGNED, Application.STATUS_OFFER_SENT, Application.STATUS_REJECTED):
            return Response(
                {'detail': f'Cannot reject candidate from stage "{prev_status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        app.status = Application.STATUS_REJECTED
        app.last_failure_reason = request.data.get('reason', 'Rejected by recruiter')
        app.save(update_fields=['status', 'last_failure_reason'])
        app.compute_next_action()

        try:
            from applications.models import ApplicationStatusHistory
            ApplicationStatusHistory.objects.create(
                application=app,
                from_status=prev_status,
                to_status=Application.STATUS_REJECTED,
                changed_by=request.user,
                note=app.last_failure_reason,
            )
        except Exception:
            pass

        cand_name = app.candidate.full_name or app.candidate.username or 'Candidate'
        Notification.objects.create(
            user=app.candidate,
            type='reject',
            title='Application Update',
            body=f'Your application for {app.job.title} at {app.job.company} was reviewed.',
            payload={'application_id': app.id, 'job_id': app.job.id},
        )
        Notification.objects.create(
            user=request.user,
            type='reject',
            title='Candidate Application Rejected',
            body=f"{cand_name}'s application was rejected for {app.job.title}",
            payload={'application_id': app.id, 'job_id': app.job.id, 'candidate_name': cand_name, 'route': '/recruiter/applicants'},
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
    """View candidate profile and AI screening evaluation for an application."""
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
    resume_file_url = None
    cand_location = ''
    cand_bio = ''
    cand_phone = candidate.phone
    cand_tech_stacks = []

    try:
        profile = candidate.candidate_profile
        parsed_resume = profile.parsed_resume_json or {}
        cand_location = profile.location or ''
        cand_bio = profile.bio or ''
        cand_tech_stacks = profile.tech_stacks or []
        if profile.phone:
            cand_phone = profile.phone
        if profile.resume_file:
            resume_file_url = profile.resume_file.url
    except CandidateProfile.DoesNotExist:
        pass

    # Extract all candidate skills
    from jobs.views import _normalize_skills, _match_skills
    raw_cand_skills = []
    if cand_tech_stacks:
        raw_cand_skills.extend(cand_tech_stacks)
    if isinstance(parsed_resume, dict) and 'skills' in parsed_resume and isinstance(parsed_resume['skills'], list):
        raw_cand_skills.extend(parsed_resume['skills'])

    candidate_skills_set = _normalize_skills(raw_cand_skills)
    job_req_skills = app.job.required_skills or []
    computed_match_score, matched_skills, missing_skills = _match_skills(candidate_skills_set, job_req_skills)

    ats_score = parsed_resume.get('overallScore') if isinstance(parsed_resume, dict) and 'overallScore' in parsed_resume else (app.match_score or computed_match_score or 75)

    # 4 Relevance Pillars Evaluation
    # 1. Education Relevance
    raw_education = parsed_resume.get('education', []) if isinstance(parsed_resume, dict) else []
    extracted_degree = 'Not detected'
    extracted_year = 'Not detected'
    if raw_education:
        first_edu = raw_education[0] if isinstance(raw_education, list) and len(raw_education) > 0 else raw_education
        if isinstance(first_edu, dict):
            extracted_degree = first_edu.get('degree') or first_edu.get('institution') or first_edu.get('college') or 'Not detected'
            extracted_year = str(first_edu.get('year') or first_edu.get('graduation_year') or 'Not detected')
        elif isinstance(first_edu, str):
            extracted_degree = first_edu
    
    edu_text = f"{extracted_degree} {' '.join(str(e) for e in raw_education)}".lower()
    if any(k in edu_text for k in ['computer', 'b.tech', 'be', 'b.e', 'bca', 'mca', 'm.tech', 'science', 'engineering', 'it', 'software']):
        education_relevance = {
            'status': 'High Relevance',
            'details': f'Relevant Computer Science / Engineering degree detected: {extracted_degree if extracted_degree != "Not detected" else "Engineering degree"}'
        }
    elif raw_education:
        education_relevance = {
            'status': 'Relevant',
            'details': f'Degree detected: {extracted_degree}'
        }
    else:
        education_relevance = {
            'status': 'Not detected',
            'details': 'No education records detected in resume.'
        }

    # 2. Experience Relevance
    raw_experience = parsed_resume.get('experience') or parsed_resume.get('work_experience') or [] if isinstance(parsed_resume, dict) else []
    if raw_experience and isinstance(raw_experience, list) and len(raw_experience) > 0:
        first_exp = raw_experience[0] if isinstance(raw_experience[0], dict) else {}
        exp_role = first_exp.get('title') or first_exp.get('role') or 'Software Developer'
        exp_duration = first_exp.get('duration') or f'{len(raw_experience)} position(s)'
        experience_relevance = {
            'status': 'Relevant Experience',
            'details': f'{exp_duration} detected as {exp_role} with practical industry exposure.'
        }
    else:
        experience_relevance = {
            'status': 'Not detected',
            'details': 'No formal work experience records detected.'
        }

    # 3. Project Relevance
    raw_projects = parsed_resume.get('projects', []) if isinstance(parsed_resume, dict) else []
    if raw_projects and isinstance(raw_projects, list) and len(raw_projects) > 0:
        proj_titles = [p.get('title') if isinstance(p, dict) else str(p) for p in raw_projects[:2]]
        project_relevance = {
            'status': 'Relevant Projects',
            'details': f'{len(raw_projects)} project(s) detected: {", ".join(proj_titles)}.'
        }
    else:
        project_relevance = {
            'status': 'Not detected',
            'details': 'No project records detected.'
        }

    # 4. Certification Relevance
    raw_certs = parsed_resume.get('certifications', []) if isinstance(parsed_resume, dict) else []
    if raw_certs and isinstance(raw_certs, list) and len(raw_certs) > 0:
        cert_names = [c.get('name') if isinstance(c, dict) else str(c) for c in raw_certs[:2]]
        certification_relevance = {
            'status': 'Relevant Certifications',
            'details': f'{len(raw_certs)} certification(s) detected: {", ".join(cert_names)}.'
        }
    else:
        certification_relevance = {
            'status': 'Not detected',
            'details': 'No certifications detected.'
        }

    # AI Screening Recommendation (Decision Support Only)
    if computed_match_score >= 70:
        recommendation = "Recommended for Shortlisting"
        recommendation_note = f"Candidate matches {len(matched_skills)} of {len(job_req_skills)} required skills ({computed_match_score}% match) with ATS Score of {ats_score}/100."
        recommendation_badge = "success"
    elif computed_match_score >= 35:
        recommendation = "Needs Recruiter Review"
        recommendation_note = f"Candidate matches {len(matched_skills)} of {len(job_req_skills)} required skills ({computed_match_score}% match). Recruiter review of candidate experience is advised."
        recommendation_badge = "warning"
    else:
        recommendation = "Needs Recruiter Review"
        recommendation_note = f"Candidate matches {len(matched_skills)} of {len(job_req_skills)} required skills ({computed_match_score}% match). Review candidate projects and foundational skills."
        recommendation_badge = "neutral"

    # Clean Parsed Details with "Not detected" fallbacks
    parsed_details = {
        'full_name': candidate.full_name or parsed_resume.get('name') or candidate.email.split('@')[0] or 'Not detected',
        'email': candidate.email or parsed_resume.get('email') or 'Not detected',
        'phone': cand_phone or parsed_resume.get('phone') or 'Not detected',
        'location': cand_location or parsed_resume.get('location') or 'Not detected',
        'education_degree': extracted_degree,
        'graduation_year': extracted_year,
        'technical_skills': list(candidate_skills_set) if candidate_skills_set else (raw_cand_skills if raw_cand_skills else ['Not detected']),
        'projects': raw_projects if (isinstance(raw_projects, list) and len(raw_projects) > 0) else [],
        'work_experience': raw_experience if (isinstance(raw_experience, list) and len(raw_experience) > 0) else [],
        'certifications': raw_certs if (isinstance(raw_certs, list) and len(raw_certs) > 0) else [],
        'github': parsed_resume.get('github') or parsed_resume.get('github_url') or 'Not detected',
        'linkedin': parsed_resume.get('linkedin') or parsed_resume.get('linkedin_url') or 'Not detected',
    }

    # Assessment scores
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
        'company': app.job.company,
        'job_required_skills': job_req_skills,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'application_status': app.status,
        'match_score': computed_match_score,
        'ats_score': ats_score,
        'applied_at': app.applied_at.isoformat(),
        'candidate': {
            'id': candidate.id,
            'full_name': candidate.full_name or candidate.email.split('@')[0],
            'email': candidate.email,
            'phone': cand_phone or 'Not detected',
            'role': candidate.role,
            'location': cand_location or 'Not detected',
            'bio': cand_bio or 'Not detected',
        },
        'relevance': {
            'education': education_relevance,
            'experience': experience_relevance,
            'project': project_relevance,
            'certification': certification_relevance,
        },
        'ai_recommendation': {
            'recommendation': recommendation,
            'note': recommendation_note,
            'badge': recommendation_badge,
            'disclaimer': 'Recommendation is decision support only. It does not automatically change the application stage.',
        },
        'parsed_details': parsed_details,
        'resume_file_url': resume_file_url,
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


# ─────────────────────────────────────────
# Recruiter Interviews
# ─────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recruiter_interviews_view(request):
    """List or schedule interviews for recruiter's jobs."""
    err = _require_recruiter(request.user)
    if err:
        return err

    from applications.models import Interview
    if request.method == 'GET':
        interviews = Interview.objects.filter(
            Q(recruiter=request.user) | Q(job__created_by=request.user)
        ).select_related('candidate', 'job', 'application').order_by('scheduled_at')

        data = []
        for inv in interviews:
            data.append({
                'id': inv.id,
                'application_id': inv.application_id,
                'candidate_name': inv.candidate.full_name or inv.candidate.email.split('@')[0],
                'candidate_email': inv.candidate.email,
                'job_title': inv.job.title,
                'company': inv.job.company,
                'title': inv.title,
                'scheduled_at': inv.scheduled_at.isoformat(),
                'date': inv.scheduled_at.strftime('%Y-%m-%d'),
                'time': inv.scheduled_at.strftime('%I:%M %p'),
                'duration_minutes': inv.duration_minutes,
                'meeting_link': inv.meeting_link,
                'interview_type': inv.interview_type,
                'status': 'Upcoming' if inv.status == Interview.STATUS_SCHEDULED else ('Completed' if inv.status == Interview.STATUS_COMPLETED else 'Cancelled'),
                'notes': inv.notes,
            })
        return Response(data)

    # POST - Schedule an interview directly
    data = request.data
    app_id = data.get('application_id')
    try:
        app = Application.objects.select_related('job', 'candidate').get(id=app_id, job__created_by=request.user)
    except Application.DoesNotExist:
        return Response({'detail': 'Application not found for this recruiter.'}, status=status.HTTP_404_NOT_FOUND)

    scheduled_date = data.get('scheduled_at') or timezone.now() + timedelta(days=2, hours=10)
    interview = Interview.objects.create(
        application=app,
        candidate=app.candidate,
        recruiter=request.user,
        job=app.job,
        title=data.get('title', f'Technical Round - {app.job.title}'),
        scheduled_at=scheduled_date,
        duration_minutes=data.get('duration_minutes', 45),
        meeting_link=data.get('meeting_link', 'https://meet.google.com/smarthire-interview'),
        interview_type=data.get('interview_type', 'Technical Round'),
        status=Interview.STATUS_SCHEDULED,
        notes=data.get('notes', 'Interview scheduled by recruiter'),
    )

    # Update app status
    app.status = Application.STATUS_INTERVIEW
    app.save(update_fields=['status'])
    app.compute_next_action()

    return Response({
        'id': interview.id,
        'application_id': app.id,
        'candidate_name': app.candidate.full_name or app.candidate.email,
        'job_title': app.job.title,
        'title': interview.title,
        'status': 'Upcoming',
    }, status=status.HTTP_201_CREATED)

