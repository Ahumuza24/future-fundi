from __future__ import annotations

from rest_framework import serializers

from apps.core.models import (
    Learner,
    Artifact,
    PathwayInputs,
    WeeklyPulse,
    Assessment,
)


class LearnerSerializer(serializers.ModelSerializer):
    """Basic learner/child serializer."""
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)
    
    class Meta:
        model = Learner
        fields = [
            "id",
            "parent",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "parent_name",
        ]
        read_only_fields = ["id", "parent"]


class ChildCreateSerializer(serializers.ModelSerializer):
    """Serializer for parents to create/add children with login credentials."""
    
    username = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Learner
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "username",
            "password",
            "password_confirm",
        ]
    
    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Check if username already exists
        from apps.users.models import User
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        
        return attrs
    
    def create(self, validated_data):
        from apps.users.models import User
        
        # Extract user-related fields
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')  # Remove confirm password
        
        # Parent and tenant are set from the request context
        parent = self.context['request'].user
        tenant = parent.tenant
        
        # Create user account for the child
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='learner',
            tenant=tenant,
            is_active=True
        )
        
        # Create learner profile linked to the user
        learner = Learner.objects.create(
            parent=parent,
            tenant=tenant,  # Can be None
            user=user,
            **validated_data
        )
        
        return learner


class ChildUpdateSerializer(serializers.ModelSerializer):
    """Serializer for parents to update their children's details."""
    
    new_password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    new_password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Learner
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "current_school",
            "current_class",
            "consent_media",
            "equity_flag",
            "joined_at",
            "new_password",
            "new_password_confirm",
        ]
    
    def validate(self, attrs):
        # If password change is requested, validate it
        new_password = attrs.get('new_password', '')
        new_password_confirm = attrs.get('new_password_confirm', '')
        
        if new_password or new_password_confirm:
            if new_password != new_password_confirm:
                raise serializers.ValidationError({"new_password": "Passwords do not match."})
        
        return attrs
    
    def update(self, instance, validated_data):
        # Extract password fields
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('new_password_confirm', None)
        
        # Update learner fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update user's first_name and last_name if changed
        if instance.user:
            instance.user.first_name = instance.first_name
            instance.user.last_name = instance.last_name
            
            # Change password if provided
            if new_password:
                instance.user.set_password(new_password)
            
            instance.user.save()
        
        return instance


class ArtifactSerializer(serializers.ModelSerializer):
    """Serializer for learner artifacts."""
    learner_name = serializers.CharField(source='learner.full_name', read_only=True)
    
    class Meta:
        model = Artifact
        fields = [
            "id",
            "learner",
            "learner_name",
            "title",
            "reflection",
            "submitted_at",
            "media_refs",
        ]
        read_only_fields = ["id", "submitted_at"]


class PathwayInputsSerializer(serializers.ModelSerializer):
    """Serializer for pathway scoring inputs."""
    
    class Meta:
        model = PathwayInputs
        fields = [
            "id",
            "learner",
            "interest_persistence",
            "skill_readiness",
            "enjoyment",
            "local_demand",
            "breadth",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WeeklyPulseSerializer(serializers.ModelSerializer):
    """Serializer for weekly mood check-ins."""
    
    class Meta:
        model = WeeklyPulse
        fields = [
            "id",
            "learner",
            "mood",
            "win",
            "worry",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for learner assessments."""
    module_name = serializers.CharField(source='module.name', read_only=True)
    
    class Meta:
        model = Assessment
        fields = [
            "id",
            "learner",
            "module",
            "module_name",
            "score",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ChildDetailSerializer(serializers.ModelSerializer):
    """Detailed child serializer with all related data for parent dashboard."""
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    recent_artifacts = ArtifactSerializer(source='artifacts', many=True, read_only=True)
    latest_pathway = PathwayInputsSerializer(source='pathway_inputs.first', read_only=True)
    latest_pulse = WeeklyPulseSerializer(source='weekly_pulses.first', read_only=True)
    recent_assessments = AssessmentSerializer(source='assessments', many=True, read_only=True)
    artifacts_count = serializers.IntegerField(source='artifacts.count', read_only=True)
    
    class Meta:
        model = Learner
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "consent_media",
            "equity_flag",
            "joined_at",
            "recent_artifacts",
            "artifacts_count",
            "latest_pathway",
            "latest_pulse",
            "recent_assessments",
        ]
        read_only_fields = ["id"]
