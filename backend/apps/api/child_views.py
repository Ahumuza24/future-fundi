from __future__ import annotations

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import Learner, Artifact, PathwayInputs, WeeklyPulse
from .serializers import (
    LearnerSerializer,
    ChildCreateSerializer,
    ChildUpdateSerializer,
    ChildDetailSerializer,
    ArtifactSerializer,
    PathwayInputsSerializer,
    WeeklyPulseSerializer,
)


class IsParent(permissions.BasePermission):
    """Permission class to check if user is a parent."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'parent'


class ChildViewSet(viewsets.ModelViewSet):
    """ViewSet for parents to manage their children.
    
    Parents can:
    - List all their children
    - Add a new child
    - View child details (with all dashboard data)
    - Update child information
    - Delete a child
    """
    permission_classes = [IsParent]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChildCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ChildUpdateSerializer
        elif self.action == 'retrieve':
            return ChildDetailSerializer
        return LearnerSerializer
    
    def get_queryset(self):
        """Return only children belonging to the authenticated parent."""
        return Learner.objects.filter(
            parent=self.request.user
        ).select_related('tenant', 'parent').prefetch_related(
            'artifacts',
            'pathway_inputs',
            'weekly_pulses',
            'assessments'
        ).order_by('first_name', 'last_name')
    
    def perform_create(self, serializer):
        """Create a child for the authenticated parent."""
        serializer.save()
    
    @action(detail=True, methods=['get'], url_path='dashboard')
    def dashboard(self, request, pk=None):
        """Get complete dashboard data for a specific child.
        
        This endpoint provides all the data needed for the parent
        to view their child's complete dashboard, including:
        - Pathway score and gate
        - Recent artifacts
        - Weekly pulse
        - Assessments
        - Growth tree data
        """
        child = self.get_object()
        
        # Get latest pathway inputs
        latest_pathway = child.pathway_inputs.order_by('-created_at').first()
        pathway_score = None
        pathway_gate = None
        
        if latest_pathway:
            from apps.core.services.pathway import (
                calculate_pathway_score,
                determine_gate,
            )
            
            pathway_score = calculate_pathway_score(latest_pathway)
            
            # Check for positive mood
            latest_pulse = child.weekly_pulses.order_by('-created_at').first()
            has_positive_mood = latest_pulse.mood >= 60 if latest_pulse else True
            
            pathway_gate = determine_gate(
                pathway_score,
                latest_pathway.skill_readiness,
                has_positive_mood
            )
        
        # Get recent data
        recent_artifacts = child.artifacts.order_by('-submitted_at')[:10]
        latest_pulse = child.weekly_pulses.order_by('-created_at').first()
        recent_assessments = child.assessments.order_by('-created_at')[:5]
        
        return Response({
            'child': LearnerSerializer(child).data,
            'pathway': {
                'score': pathway_score,
                'gate': pathway_gate,
                'inputs': PathwayInputsSerializer(latest_pathway).data if latest_pathway else None,
            },
            'artifacts': ArtifactSerializer(recent_artifacts, many=True).data,
            'weekly_pulse': WeeklyPulseSerializer(latest_pulse).data if latest_pulse else None,
            'assessments': recent_assessments.count(),
            'artifacts_count': child.artifacts.count(),
        })
    
    @action(detail=True, methods=['get'], url_path='artifacts')
    def artifacts(self, request, pk=None):
        """Get all artifacts for a specific child."""
        child = self.get_object()
        artifacts = child.artifacts.order_by('-submitted_at')
        serializer = ArtifactSerializer(artifacts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='pathway')
    def pathway(self, request, pk=None):
        """Get pathway score and recommendations for a specific child."""
        child = self.get_object()
        latest_inputs = child.pathway_inputs.order_by('-created_at').first()
        
        if not latest_inputs:
            return Response({
                'detail': 'No pathway inputs available',
                'score': None,
                'gate': None
            })
        
        from apps.core.services.pathway import (
            calculate_pathway_score,
            determine_gate,
            recommend_next_moves,
        )
        
        score = calculate_pathway_score(latest_inputs)
        
        # Check for positive mood
        latest_pulse = child.weekly_pulses.order_by('-created_at').first()
        has_positive_mood = latest_pulse.mood >= 60 if latest_pulse else True
        
        gate = determine_gate(score, latest_inputs.skill_readiness, has_positive_mood)
        recommendations = recommend_next_moves(latest_inputs, child, gate)
        
        return Response({
            'score': score,
            'gate': gate,
            'recommendations': recommendations,
            'inputs': PathwayInputsSerializer(latest_inputs).data,
        })
    
    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Get summary data for all children of the parent.
        
        Useful for a family overview dashboard.
        """
        children = self.get_queryset()
        
        summary_data = []
        for child in children:
            latest_pathway = child.pathway_inputs.order_by('-created_at').first()
            pathway_score = None
            
            if latest_pathway:
                from apps.core.services.pathway import calculate_pathway_score
                pathway_score = calculate_pathway_score(latest_pathway)
            
            summary_data.append({
                'id': str(child.id),
                'name': child.full_name,
                'age': child.age,
                'pathway_score': pathway_score,
                'artifacts_count': child.artifacts.count(),
                'joined_at': child.joined_at,
            })
        
        return Response({
            'children': summary_data,
            'total_children': len(summary_data),
        })
