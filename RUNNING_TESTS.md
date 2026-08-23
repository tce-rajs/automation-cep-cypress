# Running Tests — Full Reference

Every way to run this suite, from a single test case to the full 28-spec run
with an Allure report. See [README.md](README.md) for project structure and
[claude/PROJECT_NOTES.md](claude/PROJECT_NOTES.md) for deeper conventions.

**One-time per terminal session (PowerShell):**
```powershell
$env:ELECTRON_RUN_AS_NODE=''
```
**One-time per terminal session (cmd.exe):**
```cmd
set ELECTRON_RUN_AS_NODE=
```
Cypress fails to launch without this — a known quirk of this machine's shell
environment, not a project issue.

## Folder policy

- **`automation-cep-cypress`** (this folder) — automation development and
  quick module-scoped runs only.
- **`automation-cep-cypress-run`** — dedicated to full-suite background runs
  and Allure reports, on a separate QA account so it doesn't collide with
  dev work happening here. See `claude/PROJECT_NOTES.md`.
- Both folders need their own `cypress.env.json` (gitignored) with QA
  credentials — copy from `cypress.env.example.json` if missing.

## Dev-loop runs (fast, module-scoped — fine to run here)

| What | Command |
|---|---|
| One spec file | `npx cypress run --spec cypress/e2e/01-login/login.cy.js` |
| One module folder | `npx cypress run --spec "cypress/e2e/05-player/**/*.cy.js"` |
| Interactive GUI (watch it run, pick specs live) | `npm run cypress:open` |
| One test only (temporary) | Add `.only` to the specific `it(...)`, run the spec file, then **remove every `.only`** afterward — leaving one silently disables every other test in that file, including in CI. Verify none remain: `Select-String -Path "cypress/e2e/**/*.cy.js" -Pattern "\.only\(" -AllMatches` |
| Quick ~1-minute sanity check across every module | `npx cypress run --spec cypress/e2e/smoke/smoke.cy.js` |

## Full-suite runs

**Plain full run, default spec order, no Allure:**
```powershell
npm test
```

**Full run + Allure report, all in one go (default spec order):**
```powershell
npm run test:report
```
This chains three steps and can also be run individually:
```powershell
npm run test:allure       # runs the suite, records Allure data into allure-results/
npm run allure:generate   # builds the HTML report into allure-report/ (needs a JRE — see below)
npm run allure:open       # serves the report over local HTTP and opens it in your browser
```
> Never open `allure-report/index.html` directly as a `file://` URL — it
> breaks ("Failed to fetch" on every widget). Always use `allure:open`,
> which serves it properly.
>
> `allure:generate`/`allure:open` need a Java runtime (the `allure` CLI is
> Java-based). If you see `JAVA_HOME is not set`, install a JRE from
> [adoptium.net](https://adoptium.net). `test:allure` itself needs no Java —
> it records raw result data regardless.

**Full run in a specific module order** (the sequence used for the
2026-08-22 full-suite verification, mirroring the module list rather than
folder/alphabetical order — Login → Navigation → Playlist → Add Resource →
Toolbar → Compass → all 12 Player specs → AI Assist → AI Notices →
Attendance → Gallery → Learning Shorts → Minimap → Library → AI Homework):
```powershell
npx cypress run --env allure=true --spec "cypress/e2e/01-login/login.cy.js,cypress/e2e/02-navigation/navigation.cy.js,cypress/e2e/04-playlist/playlist.cy.js,cypress/e2e/03-add-resource/add-resource.cy.js,cypress/e2e/03-add-resource/create.cy.js,cypress/e2e/06-toolbar/toolbar.cy.js,cypress/e2e/06-toolbar/toolbar-additional.cy.js,cypress/e2e/07-compass/compass.cy.js,cypress/e2e/05-player/quiz.cy.js,cypress/e2e/05-player/code-editor.cy.js,cypress/e2e/05-player/video.cy.js,cypress/e2e/05-player/video-flow.cy.js,cypress/e2e/05-player/pdf-worksheet.cy.js,cypress/e2e/05-player/tce.cy.js,cypress/e2e/05-player/unsupported.cy.js,cypress/e2e/05-player/image.cy.js,cypress/e2e/05-player/weblink.cy.js,cypress/e2e/05-player/ebook.cy.js,cypress/e2e/05-player/checkpoints.cy.js,cypress/e2e/05-player/notes.cy.js,cypress/e2e/03-add-resource/ai-assist.cy.js,cypress/e2e/10-ai-notices/ai-notices.cy.js,cypress/e2e/08-attendance/attendance.cy.js,cypress/e2e/03-add-resource/gallery.cy.js,cypress/e2e/11-learning-shorts/learning-shorts.cy.js,cypress/e2e/09-minimap/minimap.cy.js,cypress/e2e/03-add-resource/library.cy.js,cypress/e2e/12-ai-homework/ai-homework.cy.js"
npm run allure:generate
npm run allure:open
```
This list is a historical record of the 2026-08-22 run specifically --
`13-whiteboard/whiteboard.cy.js` and `14-account-management/account-management.cy.js`
were added afterward (2026-08-23) and are not included above. Add them to
the `--spec` list for a genuinely full run.

Ordering only changes the terminal narrative and Allure's run timeline —
the recorded results are identical either way, so use whichever order is
more useful to read.

**Running the full suite in the background** (PowerShell):
```powershell
npx cypress run --env allure=true *> full-run-output.log
```
Then tail it with `Get-Content full-run-output.log -Wait -Tail 30`, or from
Git Bash: `tail -f full-run-output.log`.

## Before every full-suite run

1. Clean stale results so old data doesn't mix into the new Allure report:
   ```powershell
   Remove-Item -Recurse -Force allure-results -ErrorAction SilentlyContinue
   Remove-Item full-run-output.log -ErrorAction SilentlyContinue
   ```
2. Make sure no leftover `Cypress.exe`/`node.exe` processes are still
   running from a previous attempt (`tasklist | findstr Cypress`) — kill any
   with `taskkill /F /IM Cypress.exe /T` and `taskkill /F /IM node.exe /T`
   if found.
3. On a machine with limited RAM (8GB or less), close unused Chrome tabs
   and extra editor windows first, and **never run two full suites
   concurrently** — confirmed on 2026-08-22 to starve the browser and cause
   every `cy.visit()` to time out on a blank page, cascading false failures
   through many specs. If a full run degrades this way even when run alone
   and freeing memory doesn't fix it, the machine likely has leaked
   GPU/window-handle state from repeated forceful Electron kills — a reboot
   clears it; killing processes alone may not.

## Troubleshooting quick reference

| Symptom | Cause | Fix |
|---|---|---|
| Cypress won't launch at all | `ELECTRON_RUN_AS_NODE` set in shell | Clear it (see top of this file) |
| Every `cy.visit()` times out on a blank page, cascading through many specs | Machine resource exhaustion (RAM) or leaked Electron/GPU state from repeated force-kills | Free memory, avoid concurrent full runs; if it persists, reboot |
| Password-login tests fail on school-dropdown search | `SCHOOL_SEARCH_TERM` in `cypress.env.json` doesn't match any live dropdown option for that account | Verify the exact school display name for that QA account and update `cypress.env.json` |
| `allure:open` shows "Failed to fetch" on every widget | Opened `allure-report/index.html` directly as a file | Use `npm run allure:open` instead, never double-click the HTML |
| One test passes alone but fails in the full suite | Shared cumulative QA test data (e.g. Library attach indexes already used) | See `claude/PROJECT_NOTES.md`'s "Known collision risk" section |
