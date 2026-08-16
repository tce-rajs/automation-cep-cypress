# CEP Automation — Test Report

Results below are from the last individually-confirmed clean run of each
module (each run separately, 0 failures). A final combined run of all
modules together is still pending due to intermittent network connectivity
during verification — see "Status" at the bottom.

## Summary

| Module | Spec | Passing | Skipped | Failing |
|---|---|---:|---:|---:|
| Login | `cypress/e2e/01-login/login.cy.js` | 37 | 5 | 0 |
| Navigation | `cypress/e2e/02-navigation/navigation.cy.js` | 29 | 0 | 0 |
| Add Resource | `cypress/e2e/03-add-resource/add-resource.cy.js` | 34 | 14 | 0 |
| Create | `cypress/e2e/03-add-resource/create.cy.js` | 26 | 10 | 0 |
| AI-Assist | `cypress/e2e/03-add-resource/ai-assist.cy.js` | 22 | 1 | 0 |
| Gallery | `cypress/e2e/03-add-resource/gallery.cy.js` | 19 | 2 | 0 |
| Library | `cypress/e2e/03-add-resource/library.cy.js` | 17 | 16 | 0 |
| Playlist | `cypress/e2e/04-playlist/playlist.cy.js` | 37 | 17 | 0 |
| Player | `cypress/e2e/05-player/player.cy.js` | 12 | 34 | 0 |
| **Total** | | **233** | **99** | **0** |

Plus `cypress/e2e/smoke/smoke.cy.js` — 1 passing (fast end-to-end demo, not
part of the module counts above).

## What's skipped, and why

Every skip has a documented reason in its own file as an `it.skip(...)`
comment. The recurring categories:

- **Needs real elapsed time** — session-timeout tests requiring a genuine
  15+ minute wait (Login).
- **Needs a second physical device** — DropIt file transfer (Add Resource).
- **Needs to force a server failure with no controlled trigger** — "what
  happens if the save fails" scenarios (several modules).
- **Control doesn't exist in this app version** — e.g. Create/Add Resource's
  Chapter/Topic field is read-only, not an interactive selector as the test
  case assumed.
- **Would alter shared, live QA data with no undo** — removing a real
  curriculum resource (Playlist).
- **Resource type not found anywhere in the explored curriculum** — Image,
  Weblink, Notes, Ebook player types (Player) — checked across all 7
  chapters and multiple topics each.
- **Session-loss mid-action** — can't reliably force a live session to
  expire on demand (every module).
- **Checkpoints module** — needs real enrolled/active students for its core
  features; not reproducible from a single teacher QA account.

## Status

- Every module above was run **individually** and passed clean (0 failures)
  at least once, most more than once across the session.
- A **full combined run** of all modules together previously passed 100%
  clean (234/99/0 including smoke) *before* the Page Object Model refactor
  and folder reorganization.
- After that restructuring, verification of the affected specs
  (create/add-resource/playlist) has been repeatedly interrupted by network
  connectivity issues to the QA environment (DNS failures, 30s page-load
  timeouts) rather than code problems. Three real bugs *were* found and
  fixed during this process (unrelated to the refactor itself): a
  self-matching test-title assertion, a chapter/topic popup click-timing
  race condition, and an overly generic text assertion. Each fix has
  individually passed in the runs that got far enough to reach it.
- **Recommended next step:** re-run `npm test` once the connection to
  `ce-qa-school.devstudi.com` is stable for a sustained ~15-20 minutes, to
  get one final clean combined confirmation.
