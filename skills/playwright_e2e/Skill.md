---
name: playwright_e2e
description: Guidelines for working with Playwright browser automation and E2E testing.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: playwright-e2e
  enabled: true
---

# playwright_e2e

Guidelines for working with Playwright browser automation and E2E testing.

=== Playwright E2E Testing Guidelines ===

--- RUNTIME ENVIRONMENT ---
The base container image already has Playwright and Chromium installed at the infrastructure level,
with browser binaries at /ms-playwright. You do not need to reinstall them for the agent's own
browser tooling. These guidelines apply to setting up Playwright within a user project.

--- DEPENDENCY SETUP ---
- Declare Playwright as an explicit pinned project dependency rather than relying on transient npx downloads
- For E2E test suites: add "@playwright/test" to devDependencies
- For library-only usage (no test runner): add "playwright" to dependencies
- Example (Node.js): npm install --save-dev @playwright/test
- For Python projects: pip install playwright
- npx playwright may work ad-hoc, but pinning the version ensures consistent behavior across environments

--- BROWSER BINARY INSTALLATION ---
- Browser binaries are not installed automatically when the npm/pip package is installed
- Install binaries explicitly after the package is installed
- Preferred command — handles both binaries and OS-level shared library deps in one step:
    npx playwright install --with-deps chromium      # Node.js projects
    python -m playwright install --with-deps chromium  # Python projects
- If the base OS already provides all required shared libraries:
    npx playwright install chromium
- If using a custom PLAYWRIGHT_BROWSERS_PATH, create the directory BEFORE running install:
    mkdir -p /custom/path
    PLAYWRIGHT_BROWSERS_PATH=/custom/path npx playwright install --with-deps chromium
- Default browser cache locations:
    Node.js:  /home/<user>/.cache/ms-playwright
    Python:   /home/<user>/.cache/ms-playwright  (or PLAYWRIGHT_BROWSERS_PATH if set)

--- DIAGNOSING LAUNCH FAILURES ---
Playwright launch errors fall into two distinct classes — identify which before applying a fix:

CLASS 1 — Missing browser binary:
  Symptoms:
    - "Executable doesn't exist at .../ms-playwright/chromium-.../chrome"
    - "Run: npx playwright install"
  Fix: Run the browser install command (see BROWSER BINARY INSTALLATION above)

CLASS 2 — Missing OS shared libraries:
  Symptoms:
    - "Host system is missing dependencies to run browsers"
    - Error lists libs such as: libatk1.0-0, libcups2, libgbm1, libxkbcommon0, libasound2
  Fix: Use `--with-deps` flag during install, or install the listed libs via apt-get

Additional notes:
- In multi-container projects, each container needs its own independent browser installation
- "No tests found" is not a Playwright failure — the runner is working but no spec files exist yet
- If errors persist after a Dockerfile fix, rebuild with: docker build --no-cache ...
- Verify browser installation inside a container:
    ls /ms-playwright   (if PLAYWRIGHT_BROWSERS_PATH is set)
    ls /home/<user>/.cache/ms-playwright   (default)

--- PROJECT CONFIGURATION ---
- Add a playwright.config file at the project root rather than relying on Playwright defaults
- Set testDir explicitly to point to where your spec files live
- If the project has a dev server, use webServer to let Playwright start and stop it automatically
- Set reuseExistingServer: !process.env.CI so local runs reuse a running server, CI always starts fresh
- Adapt baseURL and the webServer command to match the project's actual framework and port
- For projects without a dev server (e.g. static files, already-running services), omit webServer
  and set baseURL to the appropriate URL directly

--- TEST FILE CONVENTIONS ---
- Place test files under the directory declared in testDir
- Common naming patterns: *.spec.js, *.spec.ts, *.test.js, *.test.ts
- Never place test files inside node_modules — Playwright ignores them there
- Start with at least one smoke test to verify the full pipeline works
  (runner → browser launch → app connection) before writing more complex scenarios

--- SCRIPTS AND CI ---
- Add repeatable scripts to the project's package.json (or equivalent) for test execution:
    "test:e2e":         "playwright test"
    "test:e2e:install": "playwright install --with-deps chromium"
- Standard CI invocation: CI=true npx playwright test --reporter=list
- For Python projects the equivalent is: CI=true python -m pytest or python -m playwright test

--- STARTING FROM SCRATCH ---
When integrating Playwright into a project that has none, a typical path is:
pin the dependency → install the package → install browser binaries → add a config file
suited to the project → create a test directory with a smoke test → add convenience scripts.
Adapt or skip any of these steps to fit the project's existing structure and conventions.
