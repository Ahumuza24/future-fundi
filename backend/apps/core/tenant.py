from __future__ import annotations

import threading
from typing import Optional

# Deprecated compatibility module.
# New code should use explicit request.user.tenant_id (school_id) scoping.
_tenant_local = threading.local()


def set_current_tenant(tenant_id: Optional[str]) -> None:
    """Store current school id in thread-local context (legacy compatibility)."""
    _tenant_local.tenant_id = tenant_id


def get_current_tenant() -> Optional[str]:
    """Retrieve current school id from thread-local context (legacy compatibility)."""
    return getattr(_tenant_local, "tenant_id", None)
