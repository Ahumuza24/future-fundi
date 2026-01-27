"""Course-related API views.

Provides endpoints for:
- Admin: CRUD operations for courses and levels
- Learners/Teachers: View available courses, enrollments, progress
- Teachers: Update learner progress within levels
"""

from apps.api.serializers import (
    AchievementSerializer,
    CareerSerializer,
    CourseAdminSerializer,
    CourseLevelSerializer,
    CourseListSerializer,
    CourseSerializer,
    LearnerCourseEnrollmentDetailSerializer,
    LearnerCourseEnrollmentSerializer,
    LearnerLevelProgressSerializer,
    ModuleSerializer,
)
from apps.core.models import (
    Achievement,
    Career,
    Course,
    CourseLevel,
    Learner,
    LearnerCourseEnrollment,
    LearnerLevelProgress,
    Module,
)
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class CanManageCourses(permissions.BasePermission):
    """Allows access to admin and data_entry users for course management."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["admin", "data_entry"]
        )


class IsTeacher(permissions.BasePermission):
    """Allows access only to teachers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["teacher", "admin"]
        )


class IsParent(permissions.BasePermission):
    """Allows access only to parents."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["parent", "admin"]
        )


class CourseViewSet(viewsets.ModelViewSet):
    """Course management for admins and viewing for all users.

    Admins can CRUD courses.
    Other users can only list/retrieve courses they're eligible for.
    """

    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True)

        # Filter by tenant (school-specific or global)
        user = self.request.user
        if user.is_authenticated and user.tenant:
            queryset = queryset.filter(Q(tenant__isnull=True) | Q(tenant=user.tenant))
        else:
            queryset = queryset.filter(tenant__isnull=True)

        return queryset.prefetch_related("levels")

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        if self.action in [
            "create",
            "update",
            "partial_update",
        ] and self.request.user.role in ["admin", "data_entry"]:
            return CourseAdminSerializer
        return CourseSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [CanManageCourses()]
        return [permissions.IsAuthenticated()]

    @action(
        detail=False, methods=["get"], url_path="for-learner/(?P<learner_id>[^/.]+)"
    )
    def for_learner(self, request, learner_id=None):
        """Get available courses for a learner."""
        courses = self.get_queryset()
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def levels(self, request, pk=None):
        """Get all levels for a course."""
        course = self.get_object()
        levels = course.levels.all().order_by("level_number")
        serializer = CourseLevelSerializer(levels, many=True)
        return Response(serializer.data)


class CourseLevelViewSet(viewsets.ModelViewSet):
    """Course level management - admin only."""

    queryset = CourseLevel.objects.all()
    serializer_class = CourseLevelSerializer
    permission_classes = [CanManageCourses]

    def get_queryset(self):
        course_id = self.request.query_params.get("course")
        if course_id:
            return CourseLevel.objects.filter(course_id=course_id).order_by(
                "level_number"
            )
        return CourseLevel.objects.all().order_by("course", "level_number")


class ModuleViewSet(viewsets.ModelViewSet):
    """Module (Micro-credential) management."""

    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "upload_media",
        ]:
            return [CanManageCourses()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        course = self.request.query_params.get("course")
        if course:
            return Module.objects.filter(course_id=course)
        return Module.objects.all()

    @action(detail=True, methods=["post"], url_path="upload-media")
    def upload_media(self, request, pk=None):
        """Upload media files (images/videos) to a module."""
        import os
        import uuid

        from django.conf import settings
        from django.core.files.storage import default_storage

        module = self.get_object()
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response({"error": "No file provided"}, status=400)

        # Validate file type
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ]
        content_type = uploaded_file.content_type
        if content_type not in allowed_types:
            return Response(
                {"error": f"File type not allowed. Allowed: images and videos"},
                status=400,
            )

        # Generate unique filename
        ext = os.path.splitext(uploaded_file.name)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = f"modules/{module.id}/{unique_name}"

        # Save file
        saved_path = default_storage.save(file_path, uploaded_file)
        file_url = default_storage.url(saved_path)

        # Determine file type
        file_type = "image" if content_type.startswith("image/") else "video"

        # Add to module's media_files
        media_entry = {
            "id": uuid.uuid4().hex[:8],
            "type": file_type,
            "name": uploaded_file.name,
            "url": file_url,
            "content_type": content_type,
        }

        if module.media_files is None:
            module.media_files = []
        module.media_files.append(media_entry)
        module.save()

        return Response(
            {
                "message": "File uploaded successfully",
                "file": media_entry,
                "media_files": module.media_files,
            }
        )

    @action(
        detail=True, methods=["delete"], url_path="delete-media/(?P<media_id>[^/.]+)"
    )
    def delete_media(self, request, pk=None, media_id=None):
        """Delete a media file from a module."""
        from django.core.files.storage import default_storage

        module = self.get_object()

        if not module.media_files:
            return Response({"error": "No media files"}, status=404)

        # Find and remove the media entry
        media_to_delete = None
        for media in module.media_files:
            if media.get("id") == media_id:
                media_to_delete = media
                break

        if not media_to_delete:
            return Response({"error": "Media not found"}, status=404)

        # Try to delete the actual file
        try:
            url = media_to_delete.get("url", "")
            if url.startswith("/media/"):
                file_path = url.replace("/media/", "")
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
        except Exception:
            pass  # File might already be deleted

        module.media_files.remove(media_to_delete)
        module.save()

        return Response({"message": "Media deleted", "media_files": module.media_files})


class CareerViewSet(viewsets.ModelViewSet):
    """Career management."""

    queryset = Career.objects.all()
    serializer_class = CareerSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [CanManageCourses()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        course = self.request.query_params.get("course")
        if course:
            return Career.objects.filter(course_id=course)
        return Career.objects.all()


class LearnerEnrollmentViewSet(viewsets.ModelViewSet):
    """Manage learner course enrollments."""

    serializer_class = LearnerCourseEnrollmentSerializer

    def get_queryset(self):
        user = self.request.user

        # Admins see all
        if user.role == "admin":
            return LearnerCourseEnrollment.objects.all()

        # Parents see their children's enrollments
        if user.role == "parent":
            return LearnerCourseEnrollment.objects.filter(learner__parent=user)

        # Teachers see enrollments for learners they teach
        if user.role == "teacher":
            # Get learners from teacher's sessions
            learner_ids = user.sessions_taught.values_list(
                "learners", flat=True
            ).distinct()
            return LearnerCourseEnrollment.objects.filter(learner_id__in=learner_ids)

        # Learners see their own
        if user.role == "learner" and hasattr(user, "learner_profile"):
            return LearnerCourseEnrollment.objects.filter(learner=user.learner_profile)

        return LearnerCourseEnrollment.objects.none()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return LearnerCourseEnrollmentDetailSerializer
        return LearnerCourseEnrollmentSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Enroll a learner in a course."""
        learner_id = request.data.get("learner")
        course_id = request.data.get("course")

        try:
            learner = Learner.objects.get(id=learner_id)
            course = Course.objects.get(id=course_id)
        except (Learner.DoesNotExist, Course.DoesNotExist):
            return Response({"error": "Learner or Course not found"}, status=404)

        # Check if already enrolled
        if LearnerCourseEnrollment.objects.filter(
            learner=learner, course=course
        ).exists():
            return Response(
                {"error": "Learner already enrolled in this course"}, status=400
            )

        # Create enrollment starting at level 1
        first_level = course.levels.order_by("level_number").first()
        enrollment = LearnerCourseEnrollment.objects.create(
            learner=learner, course=course, current_level=first_level
        )

        # Create progress record for first level
        if first_level:
            LearnerLevelProgress.objects.create(
                enrollment=enrollment, level=first_level
            )

        serializer = LearnerCourseEnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        """Get detailed progress for an enrollment."""
        enrollment = self.get_object()
        progress = enrollment.level_progress.all().order_by("level__level_number")
        serializer = LearnerLevelProgressSerializer(progress, many=True)
        return Response(serializer.data)


class LearnerProgressViewSet(viewsets.ModelViewSet):
    """Manage learner level progress - primarily for teachers."""

    queryset = LearnerLevelProgress.objects.all()
    serializer_class = LearnerLevelProgressSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=["post"])
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

        modules = request.data.get("modules_completed")
        artifacts = request.data.get("artifacts_submitted")
        score = request.data.get("assessment_score")
        confirmed = request.data.get("teacher_confirmed")

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
        return Response(
            {
                "progress": serializer.data,
                "promoted": promoted,
                "message": (
                    "Learner promoted to next level!"
                    if promoted
                    else "Progress updated"
                ),
            }
        )

    @action(detail=True, methods=["post"])
    def confirm_completion(self, request, pk=None):
        """Teacher confirms level completion."""
        progress = self.get_object()
        progress.teacher_confirmed = True
        progress.save()

        # Check for auto-promotion
        promoted = progress.enrollment.check_and_promote()

        return Response(
            {
                "confirmed": True,
                "promoted": promoted,
                "message": (
                    "Level confirmed and learner promoted!"
                    if promoted
                    else "Level completion confirmed"
                ),
            }
        )


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """View achievements - read only for most users."""

    serializer_class = AchievementSerializer

    def get_queryset(self):
        user = self.request.user

        # Parents see their children's achievements
        if user.role == "parent":
            return Achievement.objects.filter(learner__parent=user)

        # Learners see their own
        if user.role == "learner" and hasattr(user, "learner_profile"):
            return Achievement.objects.filter(learner=user.learner_profile)

        # Admins see all
        if user.role == "admin":
            return Achievement.objects.all()

        return Achievement.objects.none()

    @action(
        detail=False, methods=["get"], url_path="for-learner/(?P<learner_id>[^/.]+)"
    )
    def for_learner(self, request, learner_id=None):
        """Get achievements for a specific learner."""
        try:
            learner = Learner.objects.get(id=learner_id)
        except Learner.DoesNotExist:
            return Response({"error": "Learner not found"}, status=404)

        achievements = Achievement.objects.filter(learner=learner)
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """Activity management for data entry and admin users.

    Allows CRUD operations on upcoming activities.
    """

    from apps.api.serializers import ActivitySerializer
    from apps.core.models import Activity

    serializer_class = ActivitySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            # Anyone authenticated can view
            return [permissions.IsAuthenticated()]
        # Only admin/data_entry can create/update/delete
        return [CanManageCourses()]

    def get_queryset(self):
        from apps.core.models import Activity

        queryset = Activity.objects.all().select_related("course", "created_by")

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        return queryset.order_by("date", "start_time")

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Get upcoming activities only."""
        from datetime import date

        from apps.api.serializers import ActivitySerializer
        from apps.core.models import Activity

        activities = Activity.objects.filter(
            status="upcoming", date__gte=date.today()
        ).order_by("date", "start_time")[:10]

        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="upload-media")
    def upload_media(self, request, pk=None):
        """Upload media file to an activity."""
        import os
        import uuid

        from django.conf import settings
        from django.core.files.storage import default_storage

        activity = self.get_object()
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file provided"}, status=400)

        # Validate file type
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/quicktime",
        ]
        if file.content_type not in allowed_types:
            return Response({"error": "Invalid file type"}, status=400)

        # Generate unique filename
        ext = os.path.splitext(file.name)[1]
        filename = f"activities/{activity.id}/{uuid.uuid4()}{ext}"

        # Save file
        path = default_storage.save(filename, file)
        url = default_storage.url(path)

        # Update activity media_files
        media_entry = {
            "id": str(uuid.uuid4()),
            "type": "image" if file.content_type.startswith("image") else "video",
            "name": file.name,
            "url": url,
            "content_type": file.content_type,
        }

        media_files = list(activity.media_files or [])
        media_files.append(media_entry)
        activity.media_files = media_files
        activity.save()

        return Response(
            {
                "message": "File uploaded successfully",
                "media_files": activity.media_files,
            }
        )

    @action(
        detail=True, methods=["delete"], url_path="delete-media/(?P<media_id>[^/.]+)"
    )
    def delete_media(self, request, pk=None, media_id=None):
        """Delete a media file from an activity."""
        activity = self.get_object()

        media_files = list(activity.media_files or [])
        media_files = [m for m in media_files if m.get("id") != media_id]
        activity.media_files = media_files
        activity.save()

        return Response(
            {"message": "Media deleted", "media_files": activity.media_files}
        )
