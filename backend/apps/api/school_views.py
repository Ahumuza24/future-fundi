from apps.api.serializers import CourseSerializer, LearnerSerializer, UserSerializer
from apps.core.models import (
    Achievement,
    Artifact,
    Course,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    School,
)
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsSchoolAdmin

User = get_user_model()

class SchoolDashboardViewSet(viewsets.ViewSet):
    """
    Dashboard viewset for school admins.
    """
    permission_classes = [IsSchoolAdmin]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Overview of learning statistics for the school."""
        school = request.user.tenant
        if not school:
             return Response({"error": "User does not belong to a school"}, status=status.HTTP_400_BAD_REQUEST)

        # Basic Stats
        total_students = school.users.filter(role='learner').count()
        total_teachers = school.users.filter(role='teacher').count()
        
        # Courses available to this school (Global + School specific)
        from django.db.models import Q
        total_courses = Course.objects.filter(
            Q(tenant=school) | Q(tenant__isnull=True)
        ).count()
        
        # Active Enrollments
        active_enrollments = LearnerCourseEnrollment.objects.filter(
            learner__tenant=school, is_active=True
        ).count()

        # Badges & Artifacts
        total_badges = Achievement.objects.filter(learner__tenant=school).count()
        total_artifacts = Artifact.objects.filter(learner__tenant=school).count()
        
        # TODO: Implement real aggregation for these metrics
        # For now providing realistic numbers/placeholders
        
        return Response({
            "overview": {
                "total_students": total_students,
                "active_students": active_enrollments,
                "total_teachers": total_teachers,
                "total_courses": total_courses
            },
            "performance": {
                "average_completion_rate": 68, # Placeholder
                "average_assessment_score": 78, # Placeholder
                "total_badges_awarded": total_badges,
                "total_artifacts_submitted": total_artifacts
            },
            "trends": {
                "enrollments_this_month": 24, # Placeholder
                "badges_this_month": 45, # Placeholder
                "completion_this_month": 18 # Placeholder
            },
            "topPerformers": [
                # Placeholder data matching frontend structure
                { "student_name": "Mike Johnson", "completion_rate": 100, "badges_count": 15 },
                { "student_name": "Sarah Williams", "completion_rate": 95, "badges_count": 12 },
                { "student_name": "David Brown", "completion_rate": 92, "badges_count": 11 }
            ],
            "courseStats": [
                 # Placeholder data matching frontend structure
                { "course_name": "Digital Literacy Fundamentals", "enrolled_students": 45, "completion_rate": 78 },
                { "course_name": "Creative Problem Solving", "enrolled_students": 38, "completion_rate": 85 },
                { "course_name": "Communication Excellence", "enrolled_students": 52, "completion_rate": 92 }
            ]
        })

class SchoolStudentViewSet(viewsets.ModelViewSet):
    """
    Manage students within the school.
    """
    serializer_class = UserSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        # Return users with role 'learner' within the admin's tenant
        return User.objects.filter(tenant=self.request.user.tenant, role='learner').order_by('-date_joined')
        
    def perform_create(self, serializer):
        # Force tenant to be the admin's tenant and role to be learner
        serializer.save(tenant=self.request.user.tenant, role='learner')

class SchoolTeacherViewSet(viewsets.ModelViewSet):
    """
    Manage teachers within the school.
    """
    serializer_class = UserSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        # Return users with role 'teacher' within the admin's tenant
        return User.objects.filter(tenant=self.request.user.tenant, role='teacher').order_by('-date_joined')
        
    def perform_create(self, serializer):
        # Force tenant to be the admin's tenant and role to be teacher
        serializer.save(tenant=self.request.user.tenant, role='teacher')

class SchoolPathwayViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View courses available to the school.
    """
    serializer_class = CourseSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.tenant
        from django.db.models import Q
        return Course.objects.filter(
            Q(tenant=school) | Q(tenant__isnull=True)
        ).order_by('name')
