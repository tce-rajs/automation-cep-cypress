# Test Cases

One folder per module, numbered in the order a user meets them in the app.
**One workbook per module** — the current revision. Superseded revisions live in
`_archive/` rather than being deleted, because no two of them are byte-identical:
each is a different revision, so dropping one loses content.

```
01_Login/          02_Navigation/     03_Add_Resource/
04_Playlist/       05_Player/         06_Toolbar/
07_Compass/         08_Attendance/       09_Minimap/
10_AI_Notices/      11_Learning_Shorts/  12_AI_Homework/
13_Whiteboard/      14_Account_Management/
_archive/
```

**07_Compass through 13_Whiteboard added 2026-08-23** — these seven modules had zero
Test_Cases documentation before (each spec file's own header comment said so).
Written using the same 8-sheet flow-based structure as the reworked
Quiz/Code-Editor/Video workbooks (01_Flow, 02_Flow Branch, 03_Test Cases,
04_Automation Steps, 05_Data-State Coverage, 06_Automation Mapping,
07_Test Data, 08_Summary), grounded in cep2-workspace source plus everything
already confirmed live through 2026-08-23. Each workbook's 03_Test Cases sheet
has an "Automation Status" column marking exactly which cases are already
automated, which are blocked (and why — missing selector, missing test data,
confirmed dead code, external micro-frontend), and which are unblocked but not
yet written.

**14_Account_Management added 2026-08-23** — same 8-sheet structure. This module
(Change Password, Change PIN, MFA, the toolbar profile popover) previously had
zero documentation AND zero automation despite being security-relevant. 19 of
28 cases are automated and live-verified; the rest are blocked on either a
QA account in a specific server-flagged state (no known account qualifies) or
would destroy the shared QA credentials the whole suite depends on if run for
real — see the workbook and `claude/CREDENTIAL_HISTORY.md` (gitignored, real
secrets) for the one deliberate exception run against the isolated run-folder
account only.

## Which spec reads which workbook

Every spec names its workbook on line 1. After any move here, re-check the
references — seven specs were found pointing at `Test_Cases/MOD-00x_*.xlsx`
files that had stopped existing in an earlier reorganisation, and nothing had
noticed because a stale comment breaks silently.

```bash
# Every workbook reference in the codebase, checked against disk
grep -rho "Test_Cases/[^\")\` ]*\.xlsx" cypress claude *.md | sort -u \
  | while read f; do [ -f "$f" ] && echo "OK  $f" || echo "BROKEN $f"; done
```

## `_archive/`

- **`05_Player_v1/`** — the original player set. Superseded for every module
  that also appears in `05_Player/`.
- **`05_Player_v2/`** — the Quiz and Video workbooks that `05_Player_v1` replaced
  and that the 2026-08 reworks have since replaced in turn.

Archived workbooks are kept for traceability: several specs cite the older
revision by name to explain that its test-case IDs mean something different.
**Do not cross-reference IDs between revisions** — e.g. the old `TC-CODE-006`
was "closing removes the wrapper" while the current one is "verify expected
output".

## Reworked workbooks

`05_Player/Quiz_Player_Test_Cases.xlsx`, `Code_Editor_Test_Cases.xlsx` and
`Video_Player_Test_Cases.xlsx` share a structure the older ones lack: a
`01_Flow` sheet, a `02_Flow Branch` sheet, and per-step automation mapping.

The flow sheets encode **decisions, not steps**. F02 in each is "is the resource
already in the current Playlist?" — branch A opens it directly and explicitly
forbids curriculum navigation; branch B navigates. Specs must implement that as
a runtime check (see `ensureQuizAvailable` / `ensureCodeEditorAvailable` /
`ensureVideoAvailable` in `cypress/pages/`), never as an unconditional
`goToTargetClass()` in `beforeEach`.

The `06_Automation Mapping` sheet requires selectors to be mapped from the live
DOM with **none invented**. Where a selector has not been observed yet, the case
stays pending with the element it needs named, rather than being written against
a guess.
