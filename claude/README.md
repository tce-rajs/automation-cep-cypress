# claude/ — Reference folder for AI assistants

This folder exists so that Claude (or any AI assistant) picking up this
project fresh -- on a different machine, after a fresh `git clone`, in a new
session with no memory of past conversations -- can get up to speed quickly
without re-discovering everything from scratch through trial and error
against the live app.

Read these in order:

0. **[PROJECT_OVERVIEW_AND_SESSION_LOG.md](PROJECT_OVERVIEW_AND_SESSION_LOG.md)**
   — start here for the fastest catch-up: a self-contained project overview
   plus a narrative log of what the most recent major session did and why.
   The numbered files below are the detailed, living references it points
   into; this one is the fast-orientation companion, not a replacement.
1. **[PROJECT_NOTES.md](PROJECT_NOTES.md)** — architecture, how the
   POM/folder structure works, the target-class config system, and
   conventions used throughout the suite.
2. **[APP_QUIRKS.md](APP_QUIRKS.md)** — confirmed real behaviors of the CEP
   app itself (not assumptions) that shaped how tests are written, plus
   known real bugs found in the app during this work.
3. **[SELECTORS_REFERENCE.md](SELECTORS_REFERENCE.md)** — quick lookup of
   confirmed real selectors by module, so you don't have to re-explore the
   live DOM for things already found.
4. **[../MODULE_COVERAGE.md](../MODULE_COVERAGE.md)** (project root) — what
   each app module has automated vs. pending, and why each pending item is
   blocked (missing curriculum content, missing selectors, external code,
   real elapsed time).
5. **[../PENDING_TASKS.md](../PENDING_TASKS.md)** (project root) — check
   this FIRST for anything currently open: unresolved investigations, work
   left mid-stream, known issues awaiting a fix. More current than this
   folder's other files for anything still in flux.

> Two files this list used to point at are gone: `DEVELOPER_QUESTIONS.md`
> was never committed, and `TEST_REPORT.md` was removed as redundant --
> per-run results now live in the Allure report (`npm run test:report`) and
> per-test-case status in the Execution sheet of the `Test_Cases/*.xlsx`
> workbooks.

## The core rule this whole project follows: verify, don't guess

Every selector, every app behavior, every "this is how it works" claim in
this codebase was confirmed by actually exploring the live app (screenshots,
DOM dumps, network inspection) or came from a direct answer from the dev
team with source-code references -- never assumed from the test case
wording alone. If you're extending this suite and need a selector or
behavior that isn't already documented here, go verify it against the live
app the same way, rather than guessing based on what "seems reasonable."
This has caught real bugs in this app (see APP_QUIRKS.md) that guessing
would have either missed or wrongly blamed on the tests.
