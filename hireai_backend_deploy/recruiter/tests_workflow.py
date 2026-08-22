import json
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from jobs.models import Job
from applications.models import Application
from candidates.models import CandidateProfile
from notifications.models import Notification

User = get_user_model()

class RecruiterWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create recruiter
        self.recruiter_user = User.objects.create_user(
            username='recruiter_test',
            email='recruiter@hireai.test',
            password='Password123!',
            role=User.ROLE_RECRUITER,
            full_name='Test Recruiter'
        )
        # Create candidate
        self.candidate_user = User.objects.create_user(
            username='candidate_test',
            email='candidate@hireai.test',
            password='Password123!',
            role=User.ROLE_CANDIDATE,
            full_name='Test Candidate'
        )
        self.profile = CandidateProfile.objects.create(
            user=self.candidate_user,
            phone='+91 9876543210',
            location='Bangalore, India',
            tech_stacks=['SQL', 'Git'],
            parsed_resume_json={
                'name': 'Test Candidate',
                'email': 'candidate@hireai.test',
                'phone': '+91 9876543210',
                'location': 'Bangalore, India',
                'skills': ['SQL', 'Git'],
                'education': [{'degree': 'B.Tech Computer Science', 'college': 'IIT', 'year': '2024'}],
                'projects': [{'title': 'Database Optimization', 'desc': 'High throughput SQL queries', 'tech': 'SQL'}],
                'experience': [{'title': 'Junior Developer', 'company': 'Tech Corp', 'duration': '1 year', 'description': 'Maintained database schemas'}],
                'certifications': [{'name': 'Oracle SQL Certified Associate', 'issuer': 'Oracle'}],
                'github': 'https://github.com/testcandidate',
                'linkedin': 'https://linkedin.com/in/testcandidate',
                'overallScore': 77,
            }
        )
        # Create Job requiring Python, Django, SQL
        self.job = Job.objects.create(
            created_by=self.recruiter_user,
            title='Backend Python Developer',
            company='Tech Solutions',
            location='Bangalore',
            required_skills=['Python', 'Django', 'SQL'],
            salary_min=1500000,
            salary_max=2500000
        )
        # Create Application in applied stage
        self.application = Application.objects.create(
            job=self.job,
            candidate=self.candidate_user,
            status=Application.STATUS_APPLIED,
            match_score=33
        )
        self.client.force_authenticate(user=self.recruiter_user)

    def test_candidate_profile_api(self):
        """Test candidate review profile calculation and 12 parsed fields."""
        response = self.client.get(f'/api/recruiter/applications/{self.application.id}/candidate-profile')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Authoritative skill matching
        self.assertEqual(data['job_required_skills'], ['Python', 'Django', 'SQL'])
        self.assertEqual(data['matched_skills'], ['SQL'])
        self.assertEqual(data['missing_skills'], ['Python', 'Django'])
        self.assertEqual(data['match_score'], 33)
        self.assertEqual(data['ats_score'], 77)

        # AI Recommendation decision support
        self.assertIn('ai_recommendation', data)
        self.assertIn('Recommendation is decision support only', data['ai_recommendation']['disclaimer'])

        # 4 Relevance pillars
        self.assertIn('education', data['relevance'])
        self.assertIn('experience', data['relevance'])
        self.assertIn('project', data['relevance'])
        self.assertIn('certification', data['relevance'])

        # 12 Parsed fields
        details = data['parsed_details']
        self.assertEqual(details['full_name'], 'Test Candidate')
        self.assertEqual(details['email'], 'candidate@hireai.test')
        self.assertEqual(details['phone'], '+91 9876543210')
        self.assertEqual(details['location'], 'Bangalore, India')
        self.assertIn('B.Tech', details['education_degree'])
        self.assertEqual(details['graduation_year'], '2024')
        self.assertIn('sql', [s.lower() for s in details['technical_skills']])
        self.assertEqual(details['github'], 'https://github.com/testcandidate')
        self.assertEqual(details['linkedin'], 'https://linkedin.com/in/testcandidate')

    def test_stage_dependent_workflow_transitions(self):
        """Test strict stage progression and illegal skip rejections."""
        # 1. From Applied: Cannot jump directly to Interview or Hired
        resp_illegal = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'schedule_interview'}),
            content_type='application/json'
        )
        self.assertEqual(resp_illegal.status_code, 400)

        resp_illegal_hire = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'hire'}),
            content_type='application/json'
        )
        self.assertEqual(resp_illegal_hire.status_code, 400)

        # 2. From Applied: Move to AI Screening (Allowed)
        resp_screen = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'move_to_ai_screening'}),
            content_type='application/json'
        )
        self.assertEqual(resp_screen.status_code, 200)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_AI_SCREENING)

        # 3. From AI Screening: Cannot jump to Interview or Hired
        resp_skip_int = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'schedule_interview'}),
            content_type='application/json'
        )
        self.assertEqual(resp_skip_int.status_code, 400)

        # 4. From AI Screening: Shortlist (Allowed)
        resp_shortlist = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'shortlist'}),
            content_type='application/json'
        )
        self.assertEqual(resp_shortlist.status_code, 200)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_SHORTLISTED)

        # 5. From Shortlisted: Cannot jump to Hired directly
        resp_skip_hire = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'hire'}),
            content_type='application/json'
        )
        self.assertEqual(resp_skip_hire.status_code, 400)

        # 6. From Shortlisted: Schedule Interview (Allowed)
        resp_interview = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'schedule_interview'}),
            content_type='application/json'
        )
        self.assertEqual(resp_interview.status_code, 200)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_INTERVIEW)

        # 7. From Interview: Mark Hired / Offer (Allowed)
        resp_hire = self.client.post(
            f'/api/recruiter/applications/{self.application.id}/action',
            data=json.dumps({'action': 'hire'}),
            content_type='application/json'
        )
        self.assertEqual(resp_hire.status_code, 200)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_OFFER_ACCEPTED)

    def test_candidate_sync_and_hired_status_persistence(self):
        """Test complete flow from apply -> screening -> shortlist -> interview -> hired, and candidate fetch."""
        # 1. Initially applied
        self.client.force_authenticate(user=self.candidate_user)
        resp_cand_applied = self.client.get('/api/applications/mine')
        self.assertEqual(resp_cand_applied.status_code, 200)
        self.assertEqual(len(resp_cand_applied.json()), 1)
        self.assertEqual(resp_cand_applied.json()[0]['status'], 'applied')

        # 2. Progress through recruiter actions
        self.client.force_authenticate(user=self.recruiter_user)
        self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'move_to_ai_screening'}), content_type='application/json')
        self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'shortlist'}), content_type='application/json')
        self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'schedule_interview'}), content_type='application/json')

        # Check candidate at interview stage (not automatically hired)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_INTERVIEW)
        self.client.force_authenticate(user=self.candidate_user)
        resp_cand_interview = self.client.get('/api/applications/mine')
        self.assertEqual(resp_cand_interview.json()[0]['status'], 'interview')

        # 3. Recruiter explicitly marks candidate as Hired
        self.client.force_authenticate(user=self.recruiter_user)
        resp_hire = self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'hire'}), content_type='application/json')
        self.assertEqual(resp_hire.status_code, 200)

        # 4. Verify in Django Database
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.STATUS_OFFER_ACCEPTED)

        # 5. Candidate re-queries (simulating refresh / re-login)
        self.client.force_authenticate(user=self.candidate_user)
        resp_cand_hired = self.client.get('/api/applications/mine')
        self.assertEqual(resp_cand_hired.status_code, 200)
        cand_apps = resp_cand_hired.json()
        self.assertEqual(len(cand_apps), 1)
        self.assertEqual(cand_apps[0]['status'], Application.STATUS_OFFER_ACCEPTED)

    def test_recruiter_notification_flow(self):
        """Test complete notification generation, unread counts, and read updates across the hiring lifecycle."""
        # Clean any previous notifications
        Notification.objects.filter(user=self.recruiter_user).delete()

        # 1. Candidate applies for a recruiter job
        self.client.force_authenticate(user=self.candidate_user)
        new_job = Job.objects.create(
            created_by=self.recruiter_user,
            title='AI Research Engineer',
            company='HireAI Labs',
            required_skills=['Python', 'PyTorch'],
        )
        resp_apply = self.client.post(
            '/api/applications/',
            data=json.dumps({'job_id': new_job.id}),
            content_type='application/json'
        )
        self.assertEqual(resp_apply.status_code, 201)
        app_id = resp_apply.json()['id']

        # Verify recruiter received "New candidate application"
        self.client.force_authenticate(user=self.recruiter_user)
        notifs_resp = self.client.get('/api/notifications/mine')
        self.assertEqual(notifs_resp.status_code, 200)
        notifs = notifs_resp.json()
        self.assertEqual(len(notifs), 1)
        self.assertIn('applied for AI Research Engineer', notifs[0]['body'])
        self.assertFalse(notifs[0]['read'])

        # 2. Recruiter moves candidate to AI Screening
        self.client.post(f'/api/recruiter/applications/{app_id}/action', data=json.dumps({'action': 'move_to_ai_screening'}), content_type='application/json')
        notifs = self.client.get('/api/notifications/mine').json()
        self.assertEqual(len(notifs), 2)
        self.assertIn('moved to AI Screening', notifs[0]['body'])

        # 3. Recruiter shortlists candidate
        self.client.post(f'/api/recruiter/applications/{app_id}/action', data=json.dumps({'action': 'shortlist'}), content_type='application/json')
        notifs = self.client.get('/api/notifications/mine').json()
        self.assertEqual(len(notifs), 3)
        self.assertIn('shortlisted', notifs[0]['body'])

        # 4. Recruiter schedules interview
        self.client.post(f'/api/recruiter/applications/{app_id}/action', data=json.dumps({'action': 'schedule_interview'}), content_type='application/json')
        notifs = self.client.get('/api/notifications/mine').json()
        self.assertEqual(len(notifs), 4)
        self.assertIn('Interview scheduled', notifs[0]['body'])

        # 5. Recruiter marks candidate as hired / sends offer
        self.client.post(f'/api/recruiter/applications/{app_id}/action', data=json.dumps({'action': 'hire'}), content_type='application/json')
        notifs = self.client.get('/api/notifications/mine').json()
        self.assertEqual(len(notifs), 5)
        self.assertIn('hired', notifs[0]['body'])

        # 6. Mark single notification as read
        single_notif_id = notifs[0]['id']
        resp_read = self.client.post(f'/api/notifications/{single_notif_id}/read')
        self.assertEqual(resp_read.status_code, 200)
        notifs_after_read = self.client.get('/api/notifications/mine').json()
        self.assertTrue(notifs_after_read[0]['read'])
        self.assertFalse(notifs_after_read[1]['read'])

        # 7. Mark all notifications as read
        resp_mark_all = self.client.post('/api/notifications/mark-all-read')
        self.assertEqual(resp_mark_all.status_code, 200)
        notifs_all_read = self.client.get('/api/notifications/mine').json()
        self.assertTrue(all(n['read'] for n in notifs_all_read))

    def test_recruiter_rejection_notification(self):
        """Test recruiter rejection creates notification and updates correctly."""
        # Move to AI Screening then reject
        self.client.force_authenticate(user=self.recruiter_user)
        self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'move_to_ai_screening'}), content_type='application/json')
        self.client.post(f'/api/recruiter/applications/{self.application.id}/action', data=json.dumps({'action': 'reject', 'reason': 'Skill mismatch'}), content_type='application/json')

        notifs = self.client.get('/api/notifications/mine').json()
        self.assertTrue(any('rejected' in n['body'].lower() for n in notifs))

    def test_ai_screening_endpoint_strict_filtering(self):
        """Verify that /api/recruiter/ai-screening returns ONLY applications with status == 'ai_screening'."""
        self.client.force_authenticate(user=self.recruiter_user)

        # Create 4 candidates with different stages:
        # apple -> Applied
        # lone -> AI Screening
        # nitish -> Offered / Hired
        # hari -> Offered / Hired
        user_apple = User.objects.create_user(username='apple_user', email='apple@test.com', password='Password123!', role=User.ROLE_CANDIDATE, full_name='apple')
        user_lone = User.objects.create_user(username='lone_user', email='lone@test.com', password='Password123!', role=User.ROLE_CANDIDATE, full_name='lone')
        user_nitish = User.objects.create_user(username='nitish_user', email='nitish@test.com', password='Password123!', role=User.ROLE_CANDIDATE, full_name='nitish')
        user_hari = User.objects.create_user(username='hari_user', email='hari@test.com', password='Password123!', role=User.ROLE_CANDIDATE, full_name='Hari')

        app_apple = Application.objects.create(job=self.job, candidate=user_apple, status=Application.STATUS_APPLIED, match_score=85)
        app_lone = Application.objects.create(job=self.job, candidate=user_lone, status=Application.STATUS_AI_SCREENING, match_score=90)
        app_nitish = Application.objects.create(job=self.job, candidate=user_nitish, status=Application.STATUS_OFFER_ACCEPTED, match_score=95)
        app_hari = Application.objects.create(job=self.job, candidate=user_hari, status=Application.STATUS_OFFER_ACCEPTED, match_score=92)

        # 1. Query /api/recruiter/ai-screening
        resp = self.client.get('/api/recruiter/ai-screening')
        self.assertEqual(resp.status_code, 200)
        screened_apps = resp.json()

        screened_names = [a['candidate_name'] for a in screened_apps]

        # lone MUST appear
        self.assertIn('lone', screened_names)

        # apple (Applied), nitish (Offered), Hari (Offered) MUST NOT appear
        self.assertNotIn('apple', screened_names)
        self.assertNotIn('nitish', screened_names)
        self.assertNotIn('Hari', screened_names)

        # 2. When apple is moved to AI Screening, apple MUST appear
        self.client.post(f'/api/recruiter/applications/{app_apple.id}/action', data=json.dumps({'action': 'move_to_ai_screening'}), content_type='application/json')
        resp2 = self.client.get('/api/recruiter/ai-screening')
        screened_names_2 = [a['candidate_name'] for a in resp2.json()]
        self.assertIn('apple', screened_names_2)
        self.assertIn('lone', screened_names_2)

        # 3. When lone is shortlisted, lone MUST disappear from AI Screening
        self.client.post(f'/api/recruiter/applications/{app_lone.id}/action', data=json.dumps({'action': 'shortlist'}), content_type='application/json')
        resp3 = self.client.get('/api/recruiter/ai-screening')
        screened_names_3 = [a['candidate_name'] for a in resp3.json()]
        self.assertNotIn('lone', screened_names_3)
        self.assertIn('apple', screened_names_3)
