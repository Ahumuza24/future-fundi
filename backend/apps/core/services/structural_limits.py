"""
Structural limits enforcement service (PRD §12).

Rules:
  - Warn when the count of children approaches the ceiling (at ceiling - 1).
  - Hard-block when the count meets or exceeds the ceiling.

Layer     Parent    Warn  Max
--------  --------  ----  ---
Track     Pathway      3    4
Program   Track        2    3
Module    Program      4    5
Unit      Module       5    6
Lesson    Unit         3    4
Task      Lesson       4    5
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from rest_framework.exceptions import ValidationError

_LAYER_CONFIG: dict[str, dict] = {
    "track":   {"related_name": "tracks",   "warn": 3, "max": 4},
    "program": {"related_name": "programs", "warn": 2, "max": 3},
    "module":  {"related_name": "modules",  "warn": 4, "max": 5},
    "unit":    {"related_name": "units",    "warn": 5, "max": 6},
    "lesson":  {"related_name": "lessons",  "warn": 3, "max": 4},
    "task":    {"related_name": "tasks",    "warn": 4, "max": 5},
}

LimitStatus = Literal["ok", "warn", "blocked"]


@dataclass(frozen=True)
class LimitResult:
    status: LimitStatus
    current: int
    max_count: int
    message: str


def check(parent_obj: object, child_layer: str) -> LimitResult:
    """Return a LimitResult for adding one more child of `child_layer` to `parent_obj`."""
    config = _LAYER_CONFIG[child_layer]
    related_name = config["related_name"]
    warn_at = config["warn"]
    hard_max = config["max"]

    manager = getattr(parent_obj, related_name)
    # Modules can exist on both Pathway (legacy) and Program FKs; count only the program-linked ones.
    if child_layer == "module":
        current = manager.filter(program=parent_obj).count()
    else:
        current = manager.count()

    if current >= hard_max:
        return LimitResult(
            status="blocked",
            current=current,
            max_count=hard_max,
            message=(
                f"Cannot add another {child_layer}: this parent already has {current} "
                f"{child_layer}s (maximum is {hard_max})."
            ),
        )
    if current >= warn_at:
        return LimitResult(
            status="warn",
            current=current,
            max_count=hard_max,
            message=(
                f"This parent has {current} {child_layer}s. "
                f"The maximum is {hard_max} — only {hard_max - current} slot(s) remaining."
            ),
        )
    return LimitResult(status="ok", current=current, max_count=hard_max, message="")


def enforce(parent_obj: object, child_layer: str) -> LimitResult:
    """Check limits and raise ValidationError if blocked; return result for warn/ok."""
    result = check(parent_obj, child_layer)
    if result.status == "blocked":
        raise ValidationError({"structural_limit": result.message})
    return result
