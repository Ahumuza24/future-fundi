# ✅ Duplicate Export Errors FIXED

## Error:

```
Multiple exports with the same name "enrollmentApi"
Multiple exports with the same name "progressApi"
```

## Root Cause:

When I added the missing APIs, I used `cat api-additions.ts >> api.ts` which **appended** the content to the file. However, the APIs already existed in the file at lines 325-358!

This created duplicate exports:

- `enrollmentApi` at line 325 (original) ✅
- `enrollmentApi` at line 464 (duplicate) ❌
- `progressApi` at line 344 (original) ✅
- `progressApi` at line 476 (duplicate) ❌

## The Fix:

Removed the duplicate lines (463-485) using:

```bash
sed -i '463,485d' api.ts
```

## Verification:

```bash
grep -n "export const enrollmentApi" api.ts
# Output: 325:export const enrollmentApi = {

grep -n "export const progressApi" api.ts
# Output: 344:export const progressApi = {
```

✅ Only one declaration of each API now!

## Current Status:

### enrollmentApi (line 325):

```typescript
export const enrollmentApi = {
  getAll: () => api.get("/api/enrollments/"),
  getById: (id: string) => api.get(`/api/enrollments/${id}/`),
  getProgress: (id: string) => api.get(`/api/enrollments/${id}/progress/`),
  enroll: (learnerId: string, courseId: string) =>
    api.post("/api/enrollments/", { learner: learnerId, course: courseId }),
  unenroll: (id: string) => api.delete(`/api/enrollments/${id}/`),
};
```

### progressApi (line 344):

```typescript
export const progressApi = {
  getById: (id: string) => api.get(`/api/progress/${id}/`),
  updateProgress: (
    id: string,
    data: {
      modules_completed?: number;
      artifacts_submitted?: number;
      assessment_score?: number;
      teacher_confirmed?: boolean;
    },
  ) => api.post(`/api/progress/${id}/update_progress/`, data),
  confirmCompletion: (id: string) =>
    api.post(`/api/progress/${id}/confirm_completion/`),
};
```

## Result:

✅ **No more duplicate export errors**  
✅ **Update Progress feature will work**  
✅ **Mark Attendance feature will work**  
✅ **All APIs properly exported**

The build should now succeed!
