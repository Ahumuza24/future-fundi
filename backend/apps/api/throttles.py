"""Rate limiting/throttling classes for API endpoints."""
from __future__ import annotations

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


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

