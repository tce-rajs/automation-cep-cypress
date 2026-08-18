# Test Data Footprint — what the suite writes, and where

Record of every place this suite creates or attaches data on the QA account,
so cleanup automation can be built to remove exactly what we added and nothing
else.

**Why this exists:** nothing in the suite currently removes what it creates.
One topic's playlist was measured at **162 resources** during debugging — a
real lesson would have 5–10. The rest is accumulated test data. It has already
caused four test failures (TC-LIB-016, TC-LIB-029, TC-AR-026, TC-NAV-025),
because the backend silently de-duplicates re-attaching something already
attached, so "playlist count increased" assertions stop being true.

> **Account note:** the PIN currently in use belongs to a personal account.
> Cleanup must therefore only ever remove items this suite created — never
> pre-existing curriculum content.

---

## 1. Where the data lands

Almost everything is written to the class configured in
[cypress/config/targetClass.js](cypress/config/targetClass.js):

| Field | Current value |
|---|---|
| Grade | Class 8 |
| Division | A |
| Subject | Computer Science |
| Chapter | index 0 → **MS Access** |
| Topic | index 0 → **1.1 Introduction to Database** |

Two exceptions write elsewhere:

| Helper | Location | Used by |
|---|---|---|
| `PlaylistPage.goToHtmlChapterFirstTopic()` | Class 8A / Computer Science / **HTML** chapter, first topic | `player.cy.js` (Code Editor tests) |
| `PlaylistPage.goToOtherSubject()` | Class 8A / **a different subject** (first non-Computer-Science) | TC-RLL-006, TC-NAV-025 — navigation only, **writes nothing** |

---

## 2. What gets created — custom assets (file uploads)

These are **new records owned by the test account**. They are the safest thing
to delete: the suite made them, nobody else uses them.

**Identifying marker:** the title ends with a millisecond timestamp
(`Date.now()` via `AddResourcePage.uniqueSuffix()`).

Known title prefixes:

| Prefix | Spec |
|---|---|
| `Cypress Automated Asset ` | add-resource |
| `Boundary File ` | add-resource |
| `Business Rule Check Asset ` | add-resource |
| `Share On Asset ` / `Share Off Asset ` | add-resource |
| `Create Module Valid Asset ` | create |
| `Edit Mode Check ` / `Edit Replace Check ` / `Edit Invalid Check ` | create |
| `Failed Create Test ` | create |
| `Session Loss Check ` | create |
| `Playlist Add Test ` / `Playlist Attach Check ` / `Playlist Open Test ` / `Playlist Receive Test ` / `Playlist Remove Test ` | playlist |
| `Unsupported Player Test ` / `Unsupported Close Test ` / `Unsupported Download Test ` / `Unsupported Download Trigger Test ` | player |
| `Upload Then Record Asset ` | player |
| `Smoke Demo Asset ` | smoke |

**A regex that matches all of them and nothing else:**
```
/^(Cypress Automated Asset|Boundary File|Business Rule Check Asset|Share (On|Off) Asset|Create Module Valid Asset|Edit (Mode|Replace|Invalid) Check|Failed Create Test|Session Loss Check|Playlist (Add|Attach|Open|Receive|Remove) (Test|Check)|Unsupported (Player|Close|Download|Download Trigger) Test|Upload Then Record Asset|Smoke Demo Asset) \d{13}$/
```

### ⚠ Assets WITHOUT a unique suffix

A few tests submit a fixed title, so they create a **new duplicate every run**
and cannot be told apart from each other:

| Title | Spec | Line |
|---|---|---|
| `Valid Title` | add-resource | 122 |
| `Valid Title` | create | 143 |
| `Create Boundary File` | create | 166 |

**Recommended change:** give these `uniqueSuffix()` too, so every asset the
suite creates is identifiable. Until then, cleanup should treat these three
titles as test data only if the owner is the automation account.

*(`abc`, `ab`, `a`, `Too Big File` and `Create Too Big File` are typed but the
submission is rejected by validation, so no asset is created.)*

---

## 3. What gets attached — existing resources

These are **NOT ours to delete blindly**. Attaching links an existing
curriculum resource to the playlist; the resource itself belongs to the
curriculum. Cleanup should remove the *attachment*, never the resource.

| Source | Search term / selection | Specs | Approx. attach calls |
|---|---|---|---|
| **TCE Library** | search `"Database"`, first unattached result | add-resource (5), ai-assist (11), gallery (2), library (12), smoke (2) | ~32 |
| **AI-Assist** | generated Exercise / Video suggestions for the current topic | add-resource (4), ai-assist (11), gallery (1), smoke (1) | ~17 |
| **Whiteboard** | current whiteboard saved to the playlist | add-resource (5) | ~5 |

**Gallery** inserts images onto the **whiteboard canvas**, not the playlist —
it leaves no playlist record, though a subsequent whiteboard save would.

---

## 4. What cleanup automation needs

1. **A detach helper.** The suite has none. The UI path is the card's overflow
   menu → Remove → confirm, already implemented as
   `AddResourcePage.openAssetCardMenu(title)` plus
   `playlist-asset-remove-btn` / `playlist-asset-remove-confirm-btn`.
2. **A safety rule:** only remove cards whose title matches the regex above,
   or that are owned by the automation account. Never remove by index or
   position.
3. **Where to run it:** an `after()` hook per spec is cleanest, but a
   standalone maintenance spec (run on demand) is safer to build first — it
   can be reviewed in dry-run mode before it deletes anything.
4. **Dry run first.** Log what would be deleted and check the list by hand
   before enabling deletion. The account is personal; a wrong regex removes
   real content.

### Known blocker

`TC-RMR-002` (remove a custom asset) currently **fails** — the remove flow is
the exact mechanism cleanup would rely on, and it is not yet working
reliably. Two fix attempts have failed; the cause is still unconfirmed.
**Cleanup automation should not be built until that flow is understood**,
otherwise the cleanup will silently fail and leave the account filling up.
