# CEP (Class Edge Platform) — Cypress Test Automation

Automated end-to-end tests for the Class Edge Platform teacher whiteboard app
(`https://ce-qa-school.devstudi.com/teach/whiteboard`), built with
[Cypress](https://www.cypress.io/) and organized using the **Page Object
Model (POM)**.

## Project structure

```
cypress_cep/
├── Test_Cases/              # Source Excel test cases (one folder per module)
│   ├── 01_Login/
│   ├── 02_Navigation/
│   ├── 03_Add_Resource/
│   └── 04_Playlist/, 05_Player/  (see cypress/e2e/ below)
│
├── cypress/
│   ├── e2e/                 # The actual test specs, numbered to match Test_Cases/
│   │   ├── 01-login/
│   │   ├── 02-navigation/
│   │   ├── 03-add-resource/   # Add Resource, Create, AI-Assist, Gallery, Library
│   │   ├── 04-playlist/
│   │   ├── 05-player/
│   │   ├── 06-toolbar/
│   │   ├── 07-compass/          # confirmed pending -- Compass not available on the current class
│   │   ├── 08-attendance/       # confirmed pending -- no Attendance option on this account
│   │   ├── 09-minimap/          # core flow, confirmed
│   │   ├── 10-ai-notices/       # core flow, confirmed
│   │   ├── 11-learning-shorts/  # core flow, confirmed
│   │   ├── 12-ai-homework/      # confirmed pending -- grade/subject not supported for generation
│   │   ├── 13-whiteboard/       # Whiteboard shell -- header, clock, drawing surface, states
│   │   ├── 14-account-management/  # Change Password/PIN, MFA, profile popover -- added 2026-08-23
│   │   └── smoke/             # Fast ~1-minute demo covering every module's core flow
│   │
│   ├── pages/                # Page Object Model -- see below
│   │   ├── LoginPage.js
│   │   ├── PlaylistPage.js
│   │   ├── AddResourcePage.js
│   │   ├── GalleryPage.js
│   │   ├── LibraryPage.js
│   │   ├── AiAssistPage.js
│   │   ├── PlayerPage.js
│   │   ├── ToolbarPage.js
│   │   ├── CompassPage.js
│   │   ├── AttendancePage.js
│   │   ├── MinimapPage.js
│   │   ├── AiNoticesPage.js
│   │   ├── LearningShortsPage.js
│   │   ├── AiHomeworkPage.js
│   │   ├── WhiteboardPage.js
│   │   ├── AccountManagementPage.js
│   │   ├── EbookPlayerPage.js
│   │   ├── ImagePlayerPage.js
│   │   └── WeblinkPlayerPage.js
│   │
│   ├── support/
│   │   ├── commands.js        # Shared login commands (loginWithValidPin, etc.)
│   │   └── e2e.js             # Global test setup
│   │
│   └── fixtures/              # Sample files used in upload tests
│
├── cypress.config.js
├── package.json
└── allure-results/, allure-report/   # Generated when you run the Allure report (gitignored)
```

## What is a Page Object Model (POM)?

Instead of every test file repeating the same raw selectors (`cy.get('[data-qa-id="..."]')`)
and click sequences, each screen or feature of the app gets its own file in
`cypress/pages/` that exposes simple, readable methods:

```js
// cypress/pages/GalleryPage.js
export const GalleryPage = {
  open() { ... },
  firstImage() { ... },
  canvasElementCount() { ... },
};
```

Test files then read like plain English instead of a wall of selectors:

```js
import { GalleryPage } from "../../pages/GalleryPage";

GalleryPage.open();
GalleryPage.firstImage().click();
```

**Why this matters:** if the app's UI changes (a button's selector changes,
a flow gets an extra step), you fix it in **one place** — the page object —
instead of hunting through every test file that happens to use it.

## Running the tests

Every command needs the Cypress binary launched cleanly. On Windows in
PowerShell, clear a stray environment variable first (only needed once per
terminal session):

```powershell
$env:ELECTRON_RUN_AS_NODE=''
```

| What you want | Command |
|---|---|
| Run the entire suite, headless | `npm test` |
| Open the interactive Cypress GUI (watch tests run live, pick specs one at a time) | `npm run cypress:open` |
| Run one spec file | `npx cypress run --spec cypress/e2e/01-login/login.cy.js` |
| Run one module folder | `npx cypress run --spec "cypress/e2e/03-add-resource/**/*.cy.js"` |
| Quick ~1-minute sanity check / demo | `npx cypress run --spec cypress/e2e/smoke/smoke.cy.js` |

## Viewing test results

**Default report:** happens automatically on every run — pass/fail counts
print in the terminal, and a screenshot is saved to `cypress/screenshots/`
for every failing test. No setup needed.

**Optional Allure report** (richer, browsable HTML report with history,
timings, and grouping): kept completely separate from the default report —
using it never disables the normal output above.

```powershell
npm run test:allure       # run all tests, recording Allure data
npm run allure:generate   # build the HTML report from that data
npm run allure:open       # open it in your browser
```

Or do all three in one go:

```powershell
npm run test:report
```

> **Note:** `npm run allure:generate` and `allure:open` need a Java runtime
> installed on your machine (the `allure` CLI is Java-based). If you see a
> `JAVA_HOME is not set` error, install a JRE (e.g. from
> [adoptium.net](https://adoptium.net)) and re-run the command. This only
> affects the optional HTML report step — `npm run test:allure` itself still
> records full result data into `allure-results/` with no Java needed, and
> the default Cypress report (terminal output + screenshots) always works
> regardless.

## Notes

- All tests run against the live QA environment — no mocking. A few tests
  are intentionally skipped (`it.skip`) with a comment explaining why: things
  like a 15-minute session-timeout flow, a feature that needs a second
  physical device, or a resource type that doesn't exist anywhere in the
  current curriculum content. These are documented gaps, not oversights.
- `cypress/support/commands.js` holds the shared PIN/password login flows
  used by nearly every spec, via `cy.loginWithValidPin()` and
  `cy.loginWithValidPassword()`.
- The `07-compass/` through `12-ai-homework/` specs cover modules that had
  zero automation before 2026-08-22. All six were confirmed live against the
  Class 12A account that day; three (AI Notices, Learning Shorts, Minimap)
  came back green, and three (Compass, Attendance, AI Homework) surfaced
  real, confirmed content/config gates the current class doesn't satisfy --
  see [MODULE_COVERAGE.md](MODULE_COVERAGE.md)'s note on those three.
- `13-whiteboard/` (added 2026-08-23) and `14-account-management/` (added
  2026-08-23) are the two newest modules, also previously undocumented and
  unautomated. Account Management in particular is security-relevant
  (Change Password, Change PIN, MFA) -- see its own header comment and
  `claude/CREDENTIAL_HISTORY.md` (gitignored) before touching anything
  destructive there.
- **[PENDING_TASKS.md](PENDING_TASKS.md)** tracks anything currently open
  or mid-investigation -- check it before assuming any area is finished.
