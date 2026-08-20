# Test Cases

One folder per module, numbered in the order a user meets them in the app.
**One workbook per module** — the current revision. Superseded revisions live in
`_archive/` rather than being deleted, because no two of them are byte-identical:
each is a different revision, so dropping one loses content.

```
01_Login/          02_Navigation/     03_Add_Resource/
04_Playlist/       05_Player/         06_Toolbar/
_archive/
```

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
