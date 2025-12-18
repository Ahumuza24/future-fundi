from __future__ import annotations

import threading
from typing import Optional

_tenant_local = threading.local()


def set_current_tenant(tenant_id: Optional[str]) -> None:
    """Store current tenant id in thread-local context."""
    _tenant_local.tenant_id = tenant_id


def get_current_tenant() -> Optional[str]:
    """Retrieve current tenant id from thread-local context."""
    return getattr(_tenant_local, "tenant_id", None)

