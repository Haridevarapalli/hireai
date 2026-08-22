"""
Seed the database with sample jobs, a recruiter, and a candidate.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from accounts.models import User
from candidates.models import CandidateProfile
from jobs.models import Job
from recruiter.models import RecruiterProfile


class Command(BaseCommand):
    help = 'Seed database with sample data for development'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')

        # --- Recruiter user ---
        recruiter, created = User.objects.get_or_create(
            email='recruiter@hireai.com',
            defaults={
                'username': 'recruiter@hireai.com',
                'full_name': 'Sarah Johnson',
                'role': User.ROLE_RECRUITER,
                'phone': '+91 9876543210',
                'is_verified': True,
            }
        )
        if created:
            recruiter.set_password('password123')
            recruiter.save()
            self.stdout.write(self.style.SUCCESS(f'  Created recruiter: {recruiter.email}'))
        else:
            self.stdout.write(f'  Recruiter already exists: {recruiter.email}')

        RecruiterProfile.objects.get_or_create(
            user=recruiter,
            defaults={
                'company_name': 'TechCorp India',
                'title': 'Senior Technical Recruiter',
                'phone': '+91 9876543210',
                'bio': 'Experienced recruiter with 8+ years in tech hiring.',
            }
        )

        # --- Candidate user ---
        candidate, created = User.objects.get_or_create(
            email='candidate@hireai.com',
            defaults={
                'username': 'candidate@hireai.com',
                'full_name': 'Rahul Kumar',
                'role': User.ROLE_CANDIDATE,
                'phone': '+91 9123456789',
                'is_verified': True,
            }
        )
        if created:
            candidate.set_password('password123')
            candidate.save()
            self.stdout.write(self.style.SUCCESS(f'  Created candidate: {candidate.email}'))
        else:
            self.stdout.write(f'  Candidate already exists: {candidate.email}')

        CandidateProfile.objects.get_or_create(
            user=candidate,
            defaults={
                'tech_stacks': ['Python', 'Django', 'JavaScript', 'React', 'SQL'],
                'parse_status': 'completed',
                'parsed_resume_json': {
                    'name': 'Rahul Kumar',
                    'email': 'candidate@hireai.com',
                    'phone': '+91 9123456789',
                    'summary': 'Full-stack developer with 3 years of experience in Python, Django, and React.',
                    'skills': ['Python', 'Django', 'JavaScript', 'React', 'SQL', 'Git', 'Docker', 'REST APIs'],
                    'experience': [
                        {
                            'title': 'Full Stack Developer',
                            'company': 'InnoTech Solutions',
                            'duration': '2 years',
                            'description': 'Built scalable web applications using Django and React.',
                        },
                        {
                            'title': 'Junior Developer',
                            'company': 'CodeStart Pvt Ltd',
                            'duration': '1 year',
                            'description': 'Developed REST APIs and frontend modules.',
                        },
                    ],
                    'education': [
                        {
                            'degree': 'B.Tech in Computer Science',
                            'institution': 'SIMATS University',
                            'year': '2022',
                        },
                    ],
                },
            }
        )

        # --- Sample Jobs ---
        sample_jobs = [
            {
                'title': 'Senior Python Developer',
                'company': 'TechCorp India',
                'location': 'Bangalore, India',
                'is_remote': True,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 1500000,
                'salary_max': 2500000,
                'currency': 'INR',
                'required_skills': ['Python', 'Django', 'REST APIs', 'PostgreSQL', 'Docker'],
                'min_match_score': 65,
            },
            {
                'title': 'React Frontend Engineer',
                'company': 'WebScale Technologies',
                'location': 'Mumbai, India',
                'is_remote': True,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 1200000,
                'salary_max': 2000000,
                'currency': 'INR',
                'required_skills': ['React', 'JavaScript', 'TypeScript', 'CSS', 'Redux'],
                'min_match_score': 60,
            },
            {
                'title': 'Full Stack Developer',
                'company': 'TechCorp India',
                'location': 'Chennai, India',
                'is_remote': False,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 1000000,
                'salary_max': 1800000,
                'currency': 'INR',
                'required_skills': ['Python', 'JavaScript', 'Django', 'React', 'SQL'],
                'min_match_score': 70,
            },
            {
                'title': 'DevOps Engineer',
                'company': 'CloudFirst Solutions',
                'location': 'Hyderabad, India',
                'is_remote': True,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 1400000,
                'salary_max': 2200000,
                'currency': 'INR',
                'required_skills': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
                'min_match_score': 60,
            },
            {
                'title': 'Java Backend Developer',
                'company': 'FinPay Systems',
                'location': 'Delhi, India',
                'is_remote': False,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 1300000,
                'salary_max': 2100000,
                'currency': 'INR',
                'required_skills': ['Java', 'Spring Boot', 'Microservices', 'SQL', 'Redis'],
                'min_match_score': 65,
            },
            {
                'title': 'Mobile App Developer (Android)',
                'company': 'AppVerse Labs',
                'location': 'Pune, India',
                'is_remote': True,
                'role_type': Job.ROLE_CONTRACT,
                'salary_min': 800000,
                'salary_max': 1500000,
                'currency': 'INR',
                'required_skills': ['Android', 'Kotlin', 'Java', 'Retrofit', 'Room'],
                'min_match_score': 60,
            },
            {
                'title': 'Data Analyst',
                'company': 'DataDriven Inc.',
                'location': 'Bangalore, India',
                'is_remote': False,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 900000,
                'salary_max': 1400000,
                'currency': 'INR',
                'required_skills': ['Python', 'SQL', 'Pandas', 'Tableau', 'Excel'],
                'min_match_score': 55,
            },
            {
                'title': 'ML Engineer',
                'company': 'AI Labs India',
                'location': 'Bangalore, India',
                'is_remote': True,
                'role_type': Job.ROLE_FULL_TIME,
                'salary_min': 2000000,
                'salary_max': 3500000,
                'currency': 'INR',
                'required_skills': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'NLP'],
                'min_match_score': 70,
            },
        ]

        for job_data in sample_jobs:
            job, created = Job.objects.get_or_create(
                title=job_data['title'],
                company=job_data['company'],
                created_by=recruiter,
                defaults=job_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created job: {job.title} @ {job.company}'))
            else:
                self.stdout.write(f'  Job already exists: {job.title} @ {job.company}')

        self.stdout.write(self.style.SUCCESS('\nSeeding complete!'))
        self.stdout.write(f'\n  Recruiter login: recruiter@hireai.com / password123')
        self.stdout.write(f'  Candidate login: candidate@hireai.com / password123\n')
