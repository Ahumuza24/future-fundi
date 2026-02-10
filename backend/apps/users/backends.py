from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Authenticate against the User model using email or username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)

        try:
            # Check if username is email or username
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user (#20760).
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # If multiple users match, try to find one with correct password
            users = User.objects.filter(
                Q(username__iexact=username) | Q(email__iexact=username)
            ).order_by("-id")
            for user in users:
                if user.check_password(password) and self.user_can_authenticate(user):
                    return user
            return None

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
