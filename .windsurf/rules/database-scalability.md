---
trigger: always_on
---

Use PostgreSQL with proper indexing.
Use UUID primary keys.
Avoid n+1 queries by using select related and prefetch related.
Ensure all lists use pagination.
Ensure foreign keys use on delete cascade when sensible.
Use read only serializers where possible.