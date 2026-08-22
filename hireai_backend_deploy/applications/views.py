from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from candidates.models import CandidateProfile
from jobs.models import Job
from .models import Application, AssessmentSession, AssessmentQuestion, AssessmentAnswer, Offer
from .serializers import (
    ApplicationDtoSerializer,
    ApplyRequestSerializer,
    AssessmentAnswerRequestSerializer,
    AssessmentSubmitRequestSerializer,
    SelectLanguageRequestSerializer,
    SignOfferRequestSerializer,
    AcceptOfferRequestSerializer,
)
from .question_bank import get_hr_questions, get_tech_questions


# ─────────────────────────────────────────
# Applications
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_view(request):
    """Candidate applies to a job."""
    serializer = ApplyRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if user.role != User.ROLE_CANDIDATE:
        return Response({'detail': 'Only candidates can apply.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        job = Job.objects.get(id=serializer.validated_data['job_id'])
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if already applied
    existing = Application.objects.filter(candidate=user, job=job).first()
    if existing:
        return Response(ApplicationDtoSerializer(existing).data, status=status.HTTP_200_OK)

    # Compute match score
    match_score = _compute_match_score(user, job)

    application = Application.objects.create(
        job=job,
        candidate=user,
        status=Application.STATUS_APPLIED,
        match_score=match_score,
    )
    application.compute_next_action()

    # Record status history
    try:
        from .models import ApplicationStatusHistory
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status='',
            to_status=Application.STATUS_APPLIED,
            changed_by=user,
            note=f'Applied to {job.title} at {job.company}',
        )
    except Exception as e:
        pass

    # Create in-app notifications
    try:
        from notifications.models import Notification
        # Candidate notification
        Notification.objects.create(
            user=user,
            type='application',
            title='Application Submitted',
            body=f'You have successfully applied for {job.title} at {job.company}.',
            payload={'application_id': application.id, 'job_id': job.id},
        )
        # Recruiter notification
        if job.created_by:
            candidate_name = user.full_name or user.username or 'Candidate'
            Notification.objects.create(
                user=job.created_by,
                type='new_application',
                title='New Candidate Application 📥',
                body=f'{candidate_name} applied for {job.title}',
                payload={'application_id': application.id, 'job_id': job.id, 'candidate_name': candidate_name, 'route': '/recruiter/applicants'},
            )
    except Exception as e:
        pass

    return Response(ApplicationDtoSerializer(application).data, status=status.HTTP_201_CREATED)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications_view(request):
    """List the current candidate's applications."""
    user = request.user
    applications = Application.objects.filter(candidate=user).select_related('job')
    return Response(ApplicationDtoSerializer(applications, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_application_detail_view(request, application_id):
    """Get details with timeline for one application."""
    user = request.user
    try:
        application = Application.objects.select_related('job').get(id=application_id, candidate=user)
    except Application.DoesNotExist:
        return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    data = ApplicationDtoSerializer(application).data
    data['timeline'] = _build_timeline(application)
    return Response(data)


# ─────────────────────────────────────────
# HR Assessment
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hr_prep_view(request, application_id):
    """Prepare HR assessment (just marks status)."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app
    app.status = Application.STATUS_HR_PENDING
    app.save(update_fields=['status'])
    app.compute_next_action()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hr_start_view(request, application_id):
    """Start HR assessment — generate questions and return session."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    # Check for existing active session
    existing = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_HR,
        status__in=[AssessmentSession.STATUS_ACTIVE, AssessmentSession.STATUS_PENDING]
    ).first()
    if existing:
        return Response(_session_response(existing))

    # Create new session
    session = _create_assessment_session(app, AssessmentSession.STAGE_HR, '')
    app.status = Application.STATUS_HR_PENDING
    app.save(update_fields=['status'])
    app.compute_next_action()

    return Response(_session_response(session), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hr_submit_view(request, application_id):
    """Submit HR assessment results."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    session = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_HR,
    ).order_by('-created_at').first()

    if not session:
        return Response({'detail': 'No HR session found.'}, status=status.HTTP_404_NOT_FOUND)

    return _submit_assessment(session, app, request.data, 'hr')


# ─────────────────────────────────────────
# Tech Assessment
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tech_select_language_view(request, application_id):
    """Select programming language for tech assessment."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    serializer = SelectLanguageRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    language = serializer.validated_data['language']
    app.tech_language = language
    app.save(update_fields=['tech_language'])

    # Create a session with language but don't start yet
    session = _create_assessment_session(app, AssessmentSession.STAGE_TECH, language)

    return Response(_session_response(session))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tech_prep_view(request, application_id):
    """Prepare tech assessment."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    serializer = SelectLanguageRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    app.tech_language = serializer.validated_data['language']
    app.status = Application.STATUS_TECH_PENDING
    app.save(update_fields=['tech_language', 'status'])
    app.compute_next_action()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tech_start_view(request, application_id):
    """Start tech assessment."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    existing = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_TECH,
        status__in=[AssessmentSession.STATUS_ACTIVE, AssessmentSession.STATUS_PENDING]
    ).first()
    if existing:
        return Response(_session_response(existing))

    language = app.tech_language or 'default'
    session = _create_assessment_session(app, AssessmentSession.STAGE_TECH, language)
    app.status = Application.STATUS_TECH_PENDING
    app.save(update_fields=['status'])
    app.compute_next_action()

    return Response(_session_response(session), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tech_submit_view(request, application_id):
    """Submit tech assessment."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    session = AssessmentSession.objects.filter(
        application=app, stage=AssessmentSession.STAGE_TECH,
    ).order_by('-created_at').first()

    if not session:
        return Response({'detail': 'No tech session found.'}, status=status.HTTP_404_NOT_FOUND)

    return _submit_assessment(session, app, request.data, 'tech')


# ─────────────────────────────────────────
# Assessment Session Endpoints
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assessment_questions_view(request, session_id):
    """Paginated questions for a session."""
    try:
        session = AssessmentSession.objects.get(id=session_id)
    except AssessmentSession.DoesNotExist:
        return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 5))
    offset = (page - 1) * page_size

    all_questions = session.questions.all()
    total = all_questions.count()
    page_questions = all_questions[offset:offset + page_size]

    # Get existing answers
    answers = {a.question_id: a for a in session.answers.all()}

    questions_data = []
    for q in page_questions:
        ans = answers.get(q.id)
        questions_data.append({
            'id': q.id,
            'prompt': q.prompt,
            'options': q.options,
            'tags': q.tags,
            'selected_option_index': ans.selected_option_index if ans else None,
            'is_correct': ans.is_correct if ans else None,
            'explanation': '',
            'correct_option': None,
        })

    answered = session.answers.count()

    return Response({
        'questions': questions_data,
        'progress': {
            'page': page,
            'page_size': page_size,
            'total_questions': total,
            'answered_questions': answered,
        },
        'ends_at': session.ends_at.isoformat() if session.ends_at else None,
        'status': session.status,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assessment_answer_view(request, session_id):
    """Record an answer for a question."""
    try:
        session = AssessmentSession.objects.get(id=session_id)
    except AssessmentSession.DoesNotExist:
        return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AssessmentAnswerRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        question = AssessmentQuestion.objects.get(id=data['question_id'], session=session)
    except AssessmentQuestion.DoesNotExist:
        return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

    is_correct = data['selected_option_index'] == question.correct_option

    answer, created = AssessmentAnswer.objects.update_or_create(
        session=session,
        question=question,
        defaults={
            'selected_option_index': data['selected_option_index'],
            'is_correct': is_correct,
            'time_spent_ms': data.get('time_spent_ms', 0),
        }
    )

    session.answered_questions = session.answers.count()
    session.save(update_fields=['answered_questions'])

    return Response({
        'saved': True,
        'session_id': session.id,
        'question_id': question.id,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assessment_submit_view(request, session_id):
    """Submit the entire assessment session."""
    try:
        session = AssessmentSession.objects.get(id=session_id)
    except AssessmentSession.DoesNotExist:
        return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    app = session.application
    stage_key = 'hr' if session.stage == AssessmentSession.STAGE_HR else 'tech'

    return _submit_assessment(session, app, request.data, stage_key)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assessment_status_view(request, session_id):
    """Check assessment session status."""
    try:
        session = AssessmentSession.objects.get(id=session_id)
    except AssessmentSession.DoesNotExist:
        return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    response_data = _session_response(session)

    # Add remaining time
    if session.ends_at:
        remaining = max(0, int((session.ends_at - timezone.now()).total_seconds()))
        response_data['remaining_secs'] = remaining
    else:
        response_data['remaining_secs'] = session.duration_secs

    # Add answer states
    answers = session.answers.all()
    response_data['answers'] = [
        {
            'question_id': a.question_id,
            'selected_option_index': a.selected_option_index,
            'is_correct': a.is_correct,
            'time_spent_ms': a.time_spent_ms,
        }
        for a in answers
    ]

    return Response(response_data)


# ─────────────────────────────────────────
# Offers
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_offer_view(request, application_id):
    """Get offer for an application."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    try:
        offer = app.offer
    except Offer.DoesNotExist:
        return Response({'detail': 'No offer found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': offer.id,
        'application': offer.application_id,
        'status': offer.status,
        'offer_pdf_url': offer.offer_pdf_url,
        'signed_pdf_url': offer.signed_pdf_url,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sign_offer_view(request, application_id):
    """Sign the offer."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    serializer = SignOfferRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        offer = app.offer
    except Offer.DoesNotExist:
        return Response({'detail': 'No offer found.'}, status=status.HTTP_404_NOT_FOUND)

    offer.status = Offer.STATUS_SIGNED
    offer.signed_pdf_url = serializer.validated_data.get('signature_image_url', '')
    offer.save()

    app.status = Application.STATUS_OFFER_SIGNED
    app.save(update_fields=['status'])
    app.compute_next_action()

    return Response({
        'id': offer.id,
        'application': offer.application_id,
        'status': offer.status,
        'offer_pdf_url': offer.offer_pdf_url,
        'signed_pdf_url': offer.signed_pdf_url,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_offer_view(request, application_id):
    """Accept the offer."""
    app = _get_candidate_app(request.user, application_id)
    if isinstance(app, Response):
        return app

    try:
        offer = app.offer
    except Offer.DoesNotExist:
        return Response({'detail': 'No offer found.'}, status=status.HTTP_404_NOT_FOUND)

    offer.status = Offer.STATUS_ACCEPTED
    offer.save()

    app.status = Application.STATUS_OFFER_ACCEPTED
    app.save(update_fields=['status'])
    app.compute_next_action()

    return Response({
        'id': offer.id,
        'application': offer.application_id,
        'status': offer.status,
        'offer_pdf_url': offer.offer_pdf_url,
        'signed_pdf_url': offer.signed_pdf_url,
    })


# ─────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────

def _get_candidate_app(user, application_id):
    """Get an application owned by the candidate, or return error Response."""
    try:
        return Application.objects.select_related('job').get(id=application_id, candidate=user)
    except Application.DoesNotExist:
        return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)


def _compute_match_score(user, job):
    """Compute match score between candidate and job using the authoritative skill matching engine."""
    from jobs.views import _normalize_skills, _match_skills
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
    return score



def _create_assessment_session(app, stage, language):
    """Create a new assessment session with questions."""
    now = timezone.now()
    duration = 1800 if stage == AssessmentSession.STAGE_HR else 2400  # 30 or 40 min
    num_questions = 10

    session = AssessmentSession.objects.create(
        application=app,
        stage=stage,
        status=AssessmentSession.STATUS_ACTIVE,
        language=language,
        ends_at=now + timedelta(seconds=duration),
        duration_secs=duration,
        total_questions=num_questions,
        answered_questions=0,
        exam_mode='mcq',
    )

    # Generate questions
    if stage == AssessmentSession.STAGE_HR:
        questions = get_hr_questions(num_questions)
    else:
        questions = get_tech_questions(language, num_questions)

    for q_data in questions:
        AssessmentQuestion.objects.create(
            session=session,
            prompt=q_data['prompt'],
            options=q_data['options'],
            tags=q_data.get('tags', []),
            correct_option=q_data['correct_option'],
            explanation=q_data.get('explanation', ''),
        )

    return session


def _session_response(session):
    """Build the AssessmentStartResponse dict."""
    questions = session.questions.all()
    return {
        'session_id': session.id,
        'application_id': session.application_id,
        'stage': session.stage,
        'language': session.language,
        'status': session.status,
        'ends_at': session.ends_at.isoformat() if session.ends_at else None,
        'duration_secs': session.duration_secs,
        'total_questions': session.total_questions,
        'answered_questions': session.answered_questions,
        'exam_mode': session.exam_mode,
        'questions': [
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
        ],
    }


def _submit_assessment(session, app, request_data, stage_key):
    """Score and submit an assessment session."""
    # Process any remaining answers from the request
    submit_ser = AssessmentSubmitRequestSerializer(data=request_data)
    submit_ser.is_valid(raise_exception=True)

    responses = submit_ser.validated_data.get('responses', [])
    for resp in responses:
        try:
            question = AssessmentQuestion.objects.get(id=resp['question_id'], session=session)
            is_correct = resp['selected_option_index'] == question.correct_option
            AssessmentAnswer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    'selected_option_index': resp['selected_option_index'],
                    'is_correct': is_correct,
                    'time_spent_ms': resp.get('time_spent_ms', 0),
                }
            )
        except AssessmentQuestion.DoesNotExist:
            continue

    # Calculate score
    total_questions = session.questions.count()
    answers = session.answers.all()
    correct = sum(1 for a in answers if a.is_correct)
    score = (correct / total_questions * 100) if total_questions > 0 else 0

    # Mark session completed
    session.status = AssessmentSession.STATUS_SUBMITTED
    session.answered_questions = answers.count()
    session.save()

    # Update application
    threshold = 60
    passed = score >= threshold

    if stage_key == 'hr':
        app.hr_score = score
        if passed:
            app.status = Application.STATUS_HR_PASSED
        else:
            app.status = Application.STATUS_HR_FAILED
            app.last_failure_reason = f'HR score {score:.0f}% below threshold {threshold}%'
    else:
        app.tech_score = score
        if passed:
            app.status = Application.STATUS_TECH_PASSED
        else:
            app.status = Application.STATUS_TECH_FAILED
            app.last_failure_reason = f'Tech score {score:.0f}% below threshold {threshold}%'

    app.save()
    app.compute_next_action()

    # Build review data
    review = []
    questions_qs = session.questions.all()
    answers_map = {a.question_id: a for a in answers}
    for q in questions_qs:
        ans = answers_map.get(q.id)
        review.append({
            'question_id': q.id,
            'prompt': q.prompt,
            'options': q.options,
            'selected_option': ans.selected_option_index if ans else None,
            'correct_option': q.correct_option,
            'is_correct': ans.is_correct if ans else False,
            'explanation': q.explanation,
        })

    return Response({
        'score': score,
        'pass': passed,
        'threshold': threshold,
        'breakdown': {
            'total_questions': total_questions,
            'correct_answers': correct,
        },
        'review': review,
        'exam_mode': session.exam_mode,
    })


def _build_timeline(application):
    """Build timeline for application detail view."""
    timeline = []

    timeline.append({
        'stage': 'Applied',
        'status': 'completed',
        'score': application.match_score,
        'threshold': application.job.min_match_score if application.job else None,
        'language': None,
        'at': application.applied_at.isoformat() if application.applied_at else None,
    })

    # HR stage
    hr_sessions = AssessmentSession.objects.filter(
        application=application, stage=AssessmentSession.STAGE_HR
    ).order_by('-created_at')
    if hr_sessions.exists():
        hr = hr_sessions.first()
        hr_status = 'completed' if hr.status == AssessmentSession.STATUS_SUBMITTED else 'in_progress'
        timeline.append({
            'stage': 'HR Assessment',
            'status': hr_status,
            'score': application.hr_score,
            'threshold': 60,
            'language': None,
            'at': hr.created_at.isoformat(),
        })

    # Tech stage
    tech_sessions = AssessmentSession.objects.filter(
        application=application, stage=AssessmentSession.STAGE_TECH
    ).order_by('-created_at')
    if tech_sessions.exists():
        tech = tech_sessions.first()
        tech_status = 'completed' if tech.status == AssessmentSession.STATUS_SUBMITTED else 'in_progress'
        timeline.append({
            'stage': 'Technical Assessment',
            'status': tech_status,
            'score': application.tech_score,
            'threshold': 60,
            'language': application.tech_language,
            'at': tech.created_at.isoformat(),
        })

    # Offer stage
    try:
        offer = application.offer
        timeline.append({
            'stage': 'Offer',
            'status': offer.status,
            'score': None,
            'threshold': None,
            'language': None,
            'at': offer.created_at.isoformat(),
        })
    except Offer.DoesNotExist:
        pass

    return timeline
