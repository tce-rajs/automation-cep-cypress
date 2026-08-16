# claude/ — Reference folder for AI assistants

This folder exists so that Claude (or any AI assistant) picking up this
project fresh -- on a different machine, after a fresh `git clone`, in a new
session with no memory of past conversations -- can get up to speed quickly
without re-discovering everything from scratch through trial and error
against the live app.

Read these in order:

1. **[PROJECT_NOTES.md](PROJECT_NOTES.md)** — architecture, how the
   POM/folder structure works, the target-class config system, and
   conventions used throughout the suite.
2. **[APP_QUIRKS.md](APP_QUIRKS.md)** — confirmed real behaviors of the CEP
   app itself (not assumptions) that shaped how tests are written, plus
   known real bugs found in the app during this work.
3. **[SELECTORS_REFERENCE.md](SELECTORS_REFERENCE.md)** — quick lookup of
   confirmed real selectors by module, so you don't have to re-explore the
   live DOM for things already found.
4. **[../DEVELOPER_QUESTIONS.md](../DEVELOPER_QUESTIONS.md)** (project
   root, not in this folder) — every skipped test case with the specific
   question needed to unblock it, several already answered by the dev team
   with exact endpoints/selectors/storage schemas.
5. **[../TEST_REPORT.md](../TEST_REPORT.md)** (project root) — current
   pass/fail/skip counts per module.

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
