"""Rate limiting/throttling classes for API endpoints."""

from __future__ import annotations

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """Burst rate limit: 60 requests per minute per user."""

    rate = "60/min"
    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    """Sustained rate limit: 1000 requests per hour per user."""

    rate = "1000/hour"
    scope = "sustained"


class AnonBurstRateThrottle(AnonRateThrottle):
    """Burst rate limit for anonymous users: 20 requests per minute."""

    rate = "20/min"
    scope = "anon_burst"


class LoginRateThrottle(AnonRateThrottle):
    """Strict throttle for the login endpoint to prevent brute-force.
    5 attempts per minute per IP address.
    """

    rate = "5/min"
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Strict throttle for registration to prevent account-creation spam.
    3 new accounts per minute per IP address.
    """

    rate = "3/min"
    scope = "register"
