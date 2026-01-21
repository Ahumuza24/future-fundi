"""Course-related API views.

Provides endpoints for:
- Admin: CRUD operations for courses and levels
- Learners/Teachers: View available courses, enrollments, progress
- Teachers: Update learner progress within levels
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from apps.core.models import (
    Course,
    CourseLevel,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    Achievement,
    Learner,
)
from apps.api.serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseLevelSerializer,
    LearnerCourseEnrollmentSerializer,
    LearnerCourseEnrollmentDetailSerializer,
    LearnerLevelProgressSerializer,
    AchievementSerializer,
    CourseAdminSerializer,
)


class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsTeacher(permissions.BasePermission):
    """Allows access only to teachers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['teacher', 'admin']


class IsParent(permissions.BasePermission):
    """Allows access only to parents."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['parent', 'admin']


class CourseViewSet(viewsets.ModelViewSet):
    """Course management for admins and viewing for all users.
    
    Admins can CRUD courses.
    Other users can only list/retrieve courses they're eligible for.
    """
    
    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True)
        
        # Filter by domain if specified
        domain = self.request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(domain=domain)
        
        # Filter by age if specified
        age = self.request.query_params.get('age')
        if age:
            try:
                age = int(age)
                queryset = queryset.filter(min_age__lte=age, max_age__gte=age)
            except ValueError:
                pass
        
        # Filter by tenant (school-specific or global)
        user = self.request.user
        if user.is_authenticated and user.tenant:
            queryset = queryset.filter(
                Q(tenant__isnull=True) | Q(tenant=user.tenant)
            )
        else:
            queryset = queryset.filter(tenant__isnull=True)
        
        return queryset.prefetch_related('levels')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        if self.action in ['create', 'update', 'partial_update'] and self.request.user.role == 'admin':
            return CourseAdminSerializer
        return CourseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='for-learner/(?P<learner_id>[^/.]+)')
    def for_learner(self, request, learner_id=None):
        """Get courses available for a specific learner based on age."""
        try:
            learner = Learner.objects.get(id=learner_id)
        except Learner.DoesNotExist:
            return Response({'error': 'Learner not found'}, status=404)
        
        age = learner.age
        if not age:
            return Response({'error': 'Learner age not available'}, status=400)
        
        courses = self.get_queryset().filter(min_age__lte=age, max_age__gte=age)
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def levels(self, request, pk=None):
        """Get all levels for a course."""
        course = self.get_object()
        levels = course.levels.all().order_by('level_number')
        serializer = CourseLevelSerializer(levels, many=True)
        return Response(serializer.data)


class CourseLevelViewSet(viewsets.ModelViewSet):
    """Course level management - admin only."""
    queryset = CourseLevel.objects.all()
    serializer_class = CourseLevelSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if course_id:
            return CourseLevel.objects.filter(course_id=course_id).order_by('level_number')
        return CourseLevel.objects.all().order_by('course', 'level_number')


class LearnerEnrollmentViewSet(viewsets.ModelViewSet):
    """Manage learner course enrollments."""
    serializer_class = LearnerCourseEnrollmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins see all
        if user.role == 'admin':
            return LearnerCourseEnrollment.objects.all()
        
        # Parents see their children's enrollments
        if user.role == 'parent':
            return LearnerCourseEnrollment.objects.filter(learner__parent=user)
        
        # Teachers see enrollments for learners they teach
        if user.role == 'teacher':
            # Get learners from teacher's sessions
            learner_ids = user.sessions_taught.values_list('learners', flat=True).distinct()
            return LearnerCourseEnrollment.objects.filter(learner_id__in=learner_ids)
        
        # Learners see their own
        if user.role == 'learner' and hasattr(user, 'learner_profile'):
            return LearnerCourseEnrollment.objects.filter(learner=user.learner_profile)
        
        return LearnerCourseEnrollment.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LearnerCourseEnrollmentDetailSerializer
        return LearnerCourseEnrollmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Enroll a learner in a course."""
        learner_id = request.data.get('learner')
        course_id = request.data.get('course')
        
        try:
            learner = Learner.objects.get(id=learner_id)
            course = Course.objects.get(id=course_id)
        except (Learner.DoesNotExist, Course.DoesNotExist):
            return Response({'error': 'Learner or Course not found'}, status=404)
        
        # Check age eligibility
        if learner.age and not course.is_age_eligible(learner.age):
            return Response({
                'error': f'Learner age {learner.age} not eligible for course (requires {course.min_age}-{course.max_age})'
            }, status=400)
        
        # Check if already enrolled
        if LearnerCourseEnrollment.objects.filter(learner=learner, course=course).exists():
            return Response({'error': 'Learner already enrolled in this course'}, status=400)
        
        # Create enrollment starting at level 1
        first_level = course.levels.order_by('level_number').first()
        enrollment = LearnerCourseEnrollment.objects.create(
            learner=learner,
            course=course,
            current_level=first_level
        )
        
        # Create progress record for first level
        if first_level:
            LearnerLevelProgress.objects.create(
                enrollment=enrollment,
                level=first_level
            )
        
        serializer = LearnerCourseEnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get detailed progress for an enrollment."""
        enrollment = self.get_object()
        progress = enrollment.level_progress.all().order_by('level__level_number')
        serializer = LearnerLevelProgressSerializer(progress, many=True)
        return Response(serializer.data)


class LearnerProgressViewSet(viewsets.ModelViewSet):
    """Manage learner level progress - primarily for teachers."""
    queryset = LearnerLevelProgress.objects.all()
    serializer_class = LearnerLevelProgressSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update progress for a learner on a level.
        
        This is the main endpoint teachers use to record:
        - Module completions
        - Artifact submissions
        - Assessment scores
        - Teacher confirmation
        
        Auto-promotion is triggered if all criteria are met.
        """
        progress = self.get_object()
        
        modules = request.data.get('modules_completed')
        artifacts = request.data.get('artifacts_submitted')
        score = request.data.get('assessment_score')
        confirmed = request.data.get('teacher_confirmed')
        
        if modules is not None:
            progress.modules_completed = int(modules)
        if artifacts is not None:
            progress.artifacts_submitted = int(artifacts)
        if score is not None:
            progress.assessment_score = int(score)
        if confirmed is not None:
            progress.teacher_confirmed = bool(confirmed)
        
        progress.save()
        
        # Check for auto-promotion
        promoted = progress.enrollment.check_and_promote()
        
        serializer = LearnerLevelProgressSerializer(progress)
        return Response({
            'progress': serializer.data,
            'promoted': promoted,
            'message': 'Learner promoted to next level!' if promoted else 'Progress updated'
        })
    
    @action(detail=True, methods=['post'])
    def confirm_completion(self, request, pk=None):
        """Teacher confirms level completion."""
        progress = self.get_object()
        progress.teacher_confirmed = True
        progress.save()
        
        # Check for auto-promotion
        promoted = progress.enrollment.check_and_promote()
        
        return Response({
            'confirmed': True,
            'promoted': promoted,
            'message': 'Level confirmed and learner promoted!' if promoted else 'Level completion confirmed'
        })


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """View achievements - read only for most users."""
    serializer_class = AchievementSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Parents see their children's achievements
        if user.role == 'parent':
            return Achievement.objects.filter(learner__parent=user)
        
        # Learners see their own
        if user.role == 'learner' and hasattr(user, 'learner_profile'):
            return Achievement.objects.filter(learner=user.learner_profile)
        
        # Admins see all
        if user.role == 'admin':
            return Achievement.objects.all()
        
        return Achievement.objects.none()
    
    @action(detail=False, methods=['get'], url_path='for-learner/(?P<learner_id>[^/.]+)')
    def for_learner(self, request, learner_id=None):
        """Get achievements for a specific learner."""
        try:
            learner = Learner.objects.get(id=learner_id)
        except Learner.DoesNotExist:
            return Response({'error': 'Learner not found'}, status=404)
        
        achievements = Achievement.objects.filter(learner=learner)
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)
