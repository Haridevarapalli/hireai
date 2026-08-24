# Android Appium E2E Testing & GitHub Pages Report Hosting Setup

This document provides complete instructions for setting up, executing, and publishing Android Appium E2E test reports to GitHub Pages via GitHub Actions.

---

## 1. Folder Structure Overview

```
.
├── .github/
│   └── workflows/
│       ├── android-e2e.yml            # Main E2E testing & GitHub Pages publishing pipeline
│       └── deploy-reports.yml         # Dedicated report deployment trigger workflow
│
├── hireai_frontend/
│   └── smarthire/
│       ├── e2e_mobile/
│       │   ├── pages/
│       │   │   ├── MobileHomePage.ts  # Home Page Object Model
│       │   │   └── MobileLoginPage.ts # Login Page Object Model
│       │   ├── utils/
│       │   │   └── Reporter.ts       # Excel, HTML, Markdown, Logs & Screenshots generator
│       │   └── runner.ts             # Appium test execution runner
│       │
│       └── Test Results/             # Local test output directory
│           ├── Excel/
│           │   └── Automation_Test_Report.xlsx
│           ├── HTML/
│           │   └── execution-report.html
│           ├── Screenshots/
│           ├── Logs/
│           │   └── execution.log
│           └── Summary/
│               └── summary.md
│
└── APPIUM_GITHUB_PAGES_SETUP.md      # Setup & Operations Guide
```

---

## 2. GitHub Pages Directory Structure

When published by GitHub Actions, the live website is organized as follows:

```
https://<github-username>.github.io/<repository-name>/

reports/
├── latest/
│   ├── execution-report.html   <-- Main Live Report URL
│   ├── summary.md
│   ├── screenshots/
│   └── logs/
│
└── history/
    ├── build-001/
    ├── build-002/
    └── build-003/
```

---

## 3. GitHub Repository Configuration

To enable GitHub Pages hosting:

1. Go to your repository on GitHub: `https://github.com/<username>/<repository-name>`.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`.
4. Workflow permissions:
   - Navigate to **Settings** > **Actions** > **General**.
   - Under **Workflow permissions**, choose **Read and write permissions**.

---

## 4. Workflows Explanation

### `android-e2e.yml`
Executed on push/pull request to `main`/`master` or manually via `workflow_dispatch`. Performs:
1. **Checkout**: Checks out source code.
2. **Environment Setup**: Configures Node.js 20, Java 17 JDK, Android SDK.
3. **Emulator Setup**: Launches Android AVD emulator (`reactivecircus/android-emulator-runner`).
4. **Appium Startup**: Starts background Appium server on port `4723`.
5. **Execution**: Runs `npm run test:e2e-mobile`.
6. **Report Generation**: Builds Excel (`Automation_Test_Report.xlsx`), HTML (`execution-report.html`), Screenshots, Logs, and `summary.md`.
7. **Artifact Upload**: Uploads full `Test Results/` bundle (persisted even on test failures via `if: always()`).
8. **GitHub Actions Summary**: Renders test metrics into `$GITHUB_STEP_SUMMARY`.
9. **GitHub Pages Publish**: Stages `reports/latest/` and `reports/history/build-<build_number>/` and deploys live to GitHub Pages.

---

## 5. Live Report & Summary Specifications

### Live Report URL
`https://<github-username>.github.io/<repository-name>/reports/latest/execution-report.html`

### GitHub Actions Summary Format
```markdown
# Android Appium Test Summary

Build Number: <run_number>
Execution Date: YYYY-MM-DD

Total Tests: 2
Passed: 2
Failed: 0
Pass Rate: 100%

Report URL:
https://<github-username>.github.io/<repository-name>/reports/latest/execution-report.html
```

---

## 6. Running Tests Locally

To run the Appium tests locally:

1. Start Appium server:
   ```bash
   npx appium --port 4723 --base-path /wd/hub
   ```
2. Run test execution script:
   ```bash
   cd hireai_frontend/smarthire
   npm run test:e2e-mobile
   ```
3. View generated reports under `hireai_frontend/smarthire/Test Results/`.
