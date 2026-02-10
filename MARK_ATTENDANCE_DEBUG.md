# Mark Attendance Troubleshooting Guide

## Issue: No Students Displaying

### What I've Added:

1. **Console Logging** - The page now logs detailed information to help debug
2. **Empty State** - Shows a helpful message when no students are found
3. **Better Error Handling** - Captures and logs API errors

### How to Debug:

1. **Open Browser Console** (Press F12)
2. **Go to Mark Attendance page**
3. **Check the console for these messages:**
   - "Fetching students for attendance..."
   - "Students API response:" (shows the raw API response)
   - "Processed students data:" (shows the processed array)
   - "Number of students:" (shows the count)

### Possible Issues & Solutions:

#### Issue 1: API Returns Empty Array

**Console shows:** `Number of students: 0`
**Cause:** The teacher account has no students assigned
**Solution:**

- Check if students are assigned to this teacher in the database
- The API endpoint `/api/teacher/students/` might be filtering by teacher assignment

#### Issue 2: API Returns Paginated Data

**Console shows:** Response has a `results` property
**Status:** ✅ Already handled - code checks for both direct array and paginated format

#### Issue 3: API Error

**Console shows:** "Failed to fetch students" with error details
**Possible causes:**

- Authentication issue (token expired)
- API endpoint not available
- CORS issue
- Network error

**Solution:** Check the error details in console

#### Issue 4: Different Data Structure

**Console shows:** Students data but different field names
**Solution:** Check if the API returns different field names than expected:

- Expected: `id`, `first_name`, `last_name`, `full_name`, `current_class`
- If different, we need to update the interface

### Quick Test:

Open browser console and run:

```javascript
// Check if API is accessible
fetch("http://localhost:8000/api/teacher/students/", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("access_token"),
  },
})
  .then((r) => r.json())
  .then((data) => console.log("Direct API test:", data));
```

### Next Steps:

1. **Check the console output** when you load the Mark Attendance page
2. **Share the console logs** so I can see exactly what the API is returning
3. Based on the logs, I can:
   - Fix the data parsing if the structure is different
   - Help configure the backend if students aren't being returned
   - Adjust the API call if there's an authentication issue

---

## Expected Behavior:

When working correctly, you should see:

- Console: "Number of students: X" (where X > 0)
- Page: Grid of student cards with 4 status buttons each
- Stats: Counts updating as you mark attendance

## Current State:

The page now:

- ✅ Logs all API responses for debugging
- ✅ Shows helpful empty state message
- ✅ Handles both array and paginated responses
- ✅ Catches and logs all errors
- ✅ Displays clear instructions to check console

**Please check the browser console (F12) and share what you see!**
