---
name: reusable-auth-setup
description: '# Category: Authentication

  # Type: Full Stack Setup

  # Tags: FastAPI, React, Vite, Authentication, Reusable Components


  Sets up reusable authentication backend and frontend from the reusable-components
  repository, runs validation tests, and returns startup URLs and test results.'
enabled: true
---

When invoked:

1. Create a backend folder.

2. Install:
   - git+https://github.com/SathsaraSDigitalT3/reusable-components.git#subdirectory=vizai_auth
   - uvicorn

3. Run:
   vizai-auth init --provider local --user-store memory --rbac-store memory

4. Start FastAPI on port 8000.

5. Verify:
   GET /health returns 200.

6. Discover seeded admin credentials produced by initialization.

7. Verify login using the seeded admin credentials.

8. Create a frontend folder.

9. Create a React TypeScript Vite application using a Vite version compatible with the installed Node.js runtime.

10. Install:
    npm install "github:SathsaraSDigitalT3/reusable-components#main" react-router-dom

11. Run:
    npx vizai-auth-ui install

12. Start frontend on port 5173.

13. Verify:
    GET http://localhost:5173 returns HTTP 200.

14. Do not modify reusable component source code.

15. Use runtime compatibility workarounds when required.

16. Leave backend and frontend servers running after validation.

Return results in the following exact format:

## Running servers (leave running)

Backend (FastAPI):
Frontend (Vite):

## Admin credentials

Email:
Password:

## Test Results

| Test ID | Status | Result |

## Test Summary

Total Tests:
Passed:
Failed:
Skipped:
Backend health:
Frontend startup:
Authentication API:
