import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hireai.settings')
django.setup()

from accounts.models import User
from candidates.models import CandidateProfile
from recruiter.models import RecruiterProfile
from jobs.models import Job
from applications.models import Application, Offer

def seed_database():
    print("--- Seeding Django database (db.sqlite3) ---")
    
    # 1. Create or update Demo Candidate
    candidate, created = User.objects.get_or_create(
        email='demo@candidate.com',
        defaults={
            'username': 'demo@candidate.com',
            'full_name': 'Demo Candidate',
            'role': User.ROLE_CANDIDATE,
            'phone': '+91 9876543210',
            'is_verified': True,
        }
    )
    candidate.set_password('Password123!')
    candidate.is_verified = True
    candidate.save()

    # Candidate Profile
    cand_profile, _ = CandidateProfile.objects.get_or_create(user=candidate)
    cand_profile.phone = '+91 9876543210'
    cand_profile.tech_stacks = ['React', 'TypeScript', 'Node.js', 'Next.js', 'Python', 'Docker', 'AWS']
    cand_profile.parse_status = 'completed'
    cand_profile.parsed_resume_json = {
        'name': 'Demo Candidate',
        'email': 'demo@candidate.com',
        'phone': '+91 9876543210',
        'summary': 'Full Stack Developer with 3+ years experience building scalable web applications with React, Next.js, and Node.js.',
        'skills': ['React', 'TypeScript', 'Node.js', 'Next.js', 'Python', 'Tailwind CSS', 'Docker', 'AWS', 'PostgreSQL'],
        'education': [{'degree': 'B.Tech in Computer Science', 'college': 'IIT Delhi', 'year': '2023', 'score': '8.8 CGPA'}],
        'projects': [{'title': 'AI Career Portal', 'desc': 'AI driven recruitment matching engine', 'tech': 'React, Python, Django'}],
        'certifications': [{'name': 'AWS Certified Developer Associate', 'issuer': 'Amazon Web Services'}]
    }
    cand_profile.save()
    print(f"Candidate seeded: {candidate.email}")

    # 2. Create or update Demo Recruiter
    recruiter, created = User.objects.get_or_create(
        email='demo@recruiter.com',
        defaults={
            'username': 'demo@recruiter.com',
            'full_name': 'Demo Recruiter',
            'role': User.ROLE_RECRUITER,
            'phone': '+91 9876543211',
            'is_verified': True,
        }
    )
    recruiter.set_password('Password123!')
    recruiter.is_verified = True
    recruiter.save()

    rec_profile, _ = RecruiterProfile.objects.get_or_create(user=recruiter)
    rec_profile.company_name = 'SmartHire Enterprise'
    rec_profile.title = 'Head of Talent Acquisition'
    rec_profile.save()
    print(f"Recruiter seeded: {recruiter.email}")

    # 3. Seed Realistic Tech Jobs
    jobs_data = [
        {
            'title': 'Software Development Engineer II',
            'company': 'Amazon',
            'location': 'Hyderabad, India',
            'is_remote': False,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 2200000,
            'salary_max': 3800000,
            'currency': 'INR',
            'required_skills': ['Java', 'Python', 'AWS', 'Distributed Systems', 'Data Structures'],
            'min_match_score': 75,
        },
        {
            'title': 'Frontend Engineer - React & Next.js',
            'company': 'Flipkart',
            'location': 'Bangalore, India',
            'is_remote': False,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 1800000,
            'salary_max': 3000000,
            'currency': 'INR',
            'required_skills': ['React', 'TypeScript', 'Next.js', 'JavaScript', 'CSS'],
            'min_match_score': 70,
        },
        {
            'title': 'Data Scientist & ML Engineer',
            'company': 'Google',
            'location': 'Bangalore, India',
            'is_remote': True,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 2800000,
            'salary_max': 5000000,
            'currency': 'INR',
            'required_skills': ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
            'min_match_score': 80,
        },
        {
            'title': 'Senior Backend Engineer',
            'company': 'Razorpay',
            'location': 'Bangalore, India',
            'is_remote': False,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 2400000,
            'salary_max': 4000000,
            'currency': 'INR',
            'required_skills': ['Go', 'Python', 'PostgreSQL', 'Microservices', 'Kafka'],
            'min_match_score': 75,
        },
        {
            'title': 'Full Stack Cloud Developer',
            'company': 'Microsoft',
            'location': 'Hyderabad, India',
            'is_remote': False,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 2500000,
            'salary_max': 4200000,
            'currency': 'INR',
            'required_skills': ['C#', 'React', 'Azure', 'TypeScript', 'Docker'],
            'min_match_score': 70,
        },
        {
            'title': 'Product Designer (UI/UX)',
            'company': 'CRED',
            'location': 'Bangalore, India',
            'is_remote': True,
            'role_type': Job.ROLE_FULL_TIME,
            'salary_min': 2000000,
            'salary_max': 3500000,
            'currency': 'INR',
            'required_skills': ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping'],
            'min_match_score': 70,
        }
    ]

    created_jobs = []
    for jd in jobs_data:
        job, _ = Job.objects.get_or_create(
            title=jd['title'],
            company=jd['company'],
            defaults={
                **jd,
                'status': Job.STATUS_OPEN,
                'created_by': recruiter,
            }
        )
        created_jobs.append(job)
    print(f"Seeded {len(created_jobs)} jobs.")

    # 4. Seed Applications for Candidate
    if created_jobs:
        # Job 1: Shortlisted
        app1, _ = Application.objects.get_or_create(
            job=created_jobs[0],
            candidate=candidate,
            defaults={'status': Application.STATUS_SHORTLISTED, 'match_score': 92}
        )
        # Job 2: HR Pending (Interview stage)
        app2, _ = Application.objects.get_or_create(
            job=created_jobs[1],
            candidate=candidate,
            defaults={'status': Application.STATUS_HR_PENDING, 'match_score': 95}
        )
        # Job 3: Applied
        app3, _ = Application.objects.get_or_create(
            job=created_jobs[2],
            candidate=candidate,
            defaults={'status': Application.STATUS_APPLIED, 'match_score': 78}
        )
        print("Seeded candidate applications.")

    print("--- Database seeding complete ---")

if __name__ == '__main__':
    seed_database()
