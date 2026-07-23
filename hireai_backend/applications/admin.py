from django.contrib import admin
from .models import Application, AssessmentSession, AssessmentQuestion, Offer

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'job', 'status', 'match_score', 'hr_score', 'tech_score', 'applied_at']
    list_filter = ['status']
    search_fields = ['candidate__email', 'job__title']

@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ['application', 'stage', 'status', 'total_questions', 'answered_questions', 'created_at']
    list_filter = ['stage', 'status']

@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ['session', 'prompt', 'correct_option']

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['application', 'status', 'created_at']
    list_filter = ['status']
