# Project Notes

## What this is

Cypress E2E automation for the CEP (Class Edge / Tata ClassEdge) teacher
whiteboard app, at `https://ce-qa-school.devstudi.com/teach/whiteboard`.
Test cases originate from Excel files in `Test_Cases/`, one folder per
module (Login, Navigation, Add Resource, Playlist, Player). Written at
"beginner level" Cypress coding on purpose -- plain `cy.get()`/`cy.contains()`
chains through Page Objects, no advanced plugins beyond the Allure reporter,
minimal abstraction.

## Folder structure

```
cypress/
├── e2e/                 # Specs, numbered to mirror Test_Cases/
│   ├── 01-login/
│   ├── 02-navigation/
│   ├── 03-add-resource/   # Add Resource, Create, AI-Assist, Gallery, Library
│   ├── 04-playlist/
│   ├── 05-player/
│   └── smoke/              # ~1 min sanity check covering every module
├── pages/                # Page Object Model -- one file per screen/feature
├── config/
│   └── targetClass.js    # see "Target class config" below
├── support/
│   ├── commands.js        # cy.loginWithValidPin(), cy.simulateSessionLoss(), etc.
│   └── e2e.js
└── fixtures/              # Sample upload files
```

Cypress auto-discovers specs recursively (`cypress/e2e/**/*.cy.{js,...}`),
so the numbered subfolders are just for human/AI readability, not required
by Cypress itself.

## Target class config (`cypress/config/targetClass.js`)

The QA account's teacher assignment can change (a different Grade/Division/
Subject/Chapter/Topic gets assigned for testing at different times). Rather
than hardcode a specific class in every spec, `PlaylistPage.goToTargetClass()`
reads from this one config file:

```js
module.exports = {
  grade: "Class 8",
  division: "A",
  subject: "Computer Science",
  chapter: "Photoshop",
  topicIndex: 0,
};
```

**When a new class is assigned for testing, edit only this file.** Every
spec that calls `PlaylistPage.goToTargetClass()` in its `beforeEach` picks
up the change automatically -- currently used by Navigation's "Chapters and
Topics" tests and every `beforeEach` in `add-resource.cy.js`.

Two other Playlist/Player-specific navigation helpers exist independently
and are NOT tied to this config, because they need very specific known
content (not just "the current class"):
- `PlaylistPage.goToKnownContentTopic()` — hardcoded to Class 8A | Computer
  Science, "Photoshop" chapter, first topic. Confirmed to reliably contain
  Video/Worksheets/Quiz/Unsupported resources. Used by `playlist.cy.js` and
  most of `player.cy.js`.
- `PlaylistPage.goToHtmlChapterFirstTopic()` — same class, "HTML" chapter,
  first topic. Confirmed to contain a Code-type resource.

If the assigned class changes, these two may also need updating to point at
a chapter/topic with equivalent content types, since they were chosen for
their *content*, not just because they're "the" class.

## Page Object Model

Each screen/feature has one file in `cypress/pages/`. Methods are named for
what they do, not how ("goToTargetClass", not "clickClassPopupThenGradeThenDivision").
When the app's UI changes, fix it once in the page object rather than in
every spec file that uses it.

## Custom Cypress commands (`cypress/support/commands.js`)

- `cy.visitApp()` — visits `/teach/whiteboard`
- `cy.openSignInModal()` — Guest Mode → Sign In modal
- `cy.loginWithValidPin()` / `cy.loginWithValidPassword()` — full login,
  ends on Dashboard
- `cy.simulateSessionLoss()` — clears the `token`/`clientId` localStorage
  keys. **Doesn't do anything by itself** -- the app only reacts once a
  request comes back 401, so pair it with an action that fires a real
  network request right after (form submit, clicking something that hits
  the API). Clicking something already-loaded client-side (e.g. a tab
  that's already rendered) won't trigger anything -- confirmed the hard way
  once, see APP_QUIRKS.md.

## Network-failure-simulation pattern

Several tests need to verify "what happens when a save fails." Since these
are Cypress tests against a real backend, forcing a real server error isn't
possible -- instead, `cy.intercept()` stubs the specific endpoint to return
an error status, confirmed against real endpoints (see SELECTORS_REFERENCE.md
for the list). This only works where the exact endpoint URL is confirmed;
where it wasn't, the test stays skipped rather than guessing a URL pattern.

## Known collision risk: shared cumulative test data

Tests that attach existing Library resources (not custom-created ones) pick
a specific result index (e.g. "the 2nd search result for 'Database'") and
verify the playlist count increased. The backend silently dedupes
re-attaching something already attached, so if two different tests attach
the *same* index, the second one becomes a false negative (count doesn't
increase, but not because attaching is broken -- it's already there). Since
nothing in this suite removes what it attaches to the shared curriculum
content, and the suite has been run many times against the same QA account,
low indexes accumulate "already attached" state over time. Current
mitigation: different specs use different indexes (see SELECTORS_REFERENCE.md
for which). This isn't a permanent fix -- eventually all low indexes will be
exhausted too. A real fix would need either a way to detect "is this already
attached" before choosing an index, or a way to clean up test-attached
resources, neither of which was built here.

## Allure reporting

Optional, additive, never affects the default Cypress terminal output.
- `npm run test:allure` — runs the suite recording Allure data
- `npm run allure:generate` — needs a JRE (`JAVA_HOME` set); builds the HTML
  report
- `npm run allure:open` — **serves** the report over local HTTP and opens
  it. Opening `allure-report/index.html` directly as a `file://` URL breaks
  it ("Failed to fetch" on every widget) -- the report needs to be served,
  it can't be opened as a static file. Always use `allure:open`, never
  double-click the HTML file.

## Running a single test without a grep plugin

No `cypress-grep` or similar plugin is installed. To run one or a few
specific `it()` blocks instead of a whole spec file, temporarily add
`.only` to those specific test(s) (`it.only(...)`), run, then **remove
every `.only`** afterward -- leaving one in silently disables every other
test in that file on every future run, including CI, with no error or
warning. Always grep the whole `cypress/e2e/` tree for `.only` before
considering a cleanup pass done:

```powershell
Select-String -Path "cypress/e2e/**/*.cy.js" -Pattern "\.only\(" -AllMatches
```
