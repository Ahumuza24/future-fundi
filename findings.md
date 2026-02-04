# Optimization and Audit Plan

## Backend

1. [x] **Cleanup**: Remove `generate_courses_data.py` and `generate_teacher_test_data.py` (move to `management/commands` or delete).
2. [x] **Rate Limiting**: Fix `apps/api/views.py` `LearnerViewSet` ensuring `throttle_classes` is NOT disabling throttles.
3. [x] **Error Handling**: Implement a standardized `exception_handler` in `apps/api/exceptions.py` and register it in `fundi/settings.py`.
4. [x] **Unused Imports**: Audit `apps/api/views.py` and `apps/api/serializers.py` for unused imports.
5. [x] **Database Optimization**: Added `select_related` to critical queries in dashboard view.
6. [x] **Security Headers**: Implemented middleware for strict security headers.

## Frontend

1. [x] **Unused Imports**: Audit `src` for unused imports (manual or tool-assisted).
2. [x] **Validation**: Ensure `LoginPage` and `SignUpPage` have basic frontend validation (HTML5 is present, maybe add improved error display).
3. [x] **Error Boundary**: Added React Error Boundary for app stability.
4. [x] **Type Safety**: Improved types in `api.ts` and `ProtectedRoute.tsx`.
5. [x] **Standardization**: Added common validation and error utility functions.

## Execution

Steps will be performed sequentially.
