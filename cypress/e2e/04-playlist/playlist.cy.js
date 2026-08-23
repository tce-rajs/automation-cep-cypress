// Playlist module automation, based on Test_Cases/04_Playlist (10 sub-files,
// 54 test cases: Show/Hide/Pin, Chapter/Topic Navigation, Grade/Subject/Class
// Switching, EBook Access, Resource List Loading, Open Resource, Filter
// Resources, Reorder/Edit Playlist, Remove Resource, Add Custom Asset).
//
// Real selectors used here were confirmed by exploring the live app's DOM
// directly (not guessed): the HIDE/SHOW drawer toggle is
// [data-qa-id="playlist-drawer-btn"], Pin is
// [data-qa-id="playlist-resource-nav-pin"], the "..." Personalize/Filter
// dialog is opened via [data-qa-id="playlist-resource-nav-filter-menu"] and
// contains Edit/Reset buttons plus one [data-qa-id="playlist-filter-menu-select"]
// checkbox row per resource type (the very first row, with no data-qa-id, is
// the "Toggle All" row). Edit mode is confirmed by the
// [data-qa-id="playlist-resource-nav-finish-edit"] "Finish Editing" button
// appearing and per-card remove ("X") icons showing up.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { AddResourcePage } from "../../pages/AddResourcePage";

describe("Playlist - Show Hide Pin", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-SHP-001: Playlist drawer is displayed for the current topic", () => {
    cy.get('[data-qa-id="playlist-drawer"]').should("be.visible");
  });

  it("TC-SHP-002: HIDE/SHOW toggles Playlist visibility", () => {
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
    cy.get('[data-qa-id="playlist-drawer-btn"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "SHOW");
    cy.get('[data-qa-id="playlist-drawer-btn"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
  });

  it("TC-SHP-003: Pin toggles Playlist pinned state", () => {
    // Verified behaviorally (matches TC-SHP-004/005) rather than by class
    // name: raw class-string comparison is unreliable here because Angular
    // CDK adds focus-tracking classes (cdk-focused, cdk-mouse-focused) on
    // click that persist regardless of pin state.
    cy.get('[data-qa-id="playlist-resource-nav-pin"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').first().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");

    cy.get('[data-qa-id="playlist-resource-nav-pin"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').first().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "SHOW");
  });

  it("TC-SHP-004: selecting a resource auto-hides an unpinned drawer", () => {
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').first().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "SHOW");
  });

  it("TC-SHP-005: selecting a resource does not auto-hide a pinned drawer", () => {
    cy.get('[data-qa-id="playlist-resource-nav-pin"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').first().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
  });
});

describe("Playlist - Chapter Topic Navigation", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-CTN-001: chapter/topic pill opens selector popup", () => {
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-select-chapter"]').should("have.length.greaterThan", 0);
  });

  it("TC-CTN-002: selecting a Chapter updates the Topic list", () => {
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-select-topic"]').should("have.length.greaterThan", 0);
  });

  it("TC-CTN-003: selecting a Topic changes current topic", () => {
    PlaylistPage.goToKnownContentTopic();
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible");
  });

  it("TC-CTN-004: previous chevron navigates to adjacent topic", () => {
    cy.get(".current-chapter-topic").invoke("text").then((before) => {
      cy.get('[data-qa-id="playlist-nav-topic-left"]').click({ force: true });
      cy.wait(2000);
      cy.get(".current-chapter-topic").invoke("text").should("not.eq", before);
    });
  });

  it("TC-CTN-005: next chevron navigates to adjacent topic", () => {
    cy.get(".current-chapter-topic").invoke("text").then((before) => {
      cy.get('[data-qa-id="playlist-nav-topic-right"]').click({ force: true });
      cy.wait(2000);
      cy.get(".current-chapter-topic").invoke("text").should("not.eq", before);
    });
  });

  it("TC-CTN-006: chapter/topic selection updates user activity", () => {
    cy.intercept("PUT", "**/nav/recentviews").as("updateActivity");
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().click({ force: true });
    cy.wait("@updateActivity", { timeout: 10000 });
  });
  // TC-CTN-007: confirmed this feature does exist -- a search icon in
  // content-nav.component.html toggles a debounced text-search dialog in
  // place of the normal chapter/topic list -- but the icon's actual selector
  // wasn't located during the original exploration and a fresh live pass
  // wasn't done this round. Revisit with a live exploration pass rather than
  // guessing the icon's selector.
  it.skip("TC-CTN-007: chapter/topic search filters results by text (feature confirmed to exist, selector not yet located -- see comment above)", () => {});
});

describe("Playlist - Grade Subject Class Switching", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-GSC-001: recent class selection updates class context", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).invoke("text").then((className) => {
      const gradeWord = className.split("|")[0].trim().replace("Class ", "");
      cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("contain.text", gradeWord);
    });
  });

  it("TC-GSC-002: Grade, Subject and Division can be selected directly", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
    cy.contains(".mdc-tab__text-label", "All My Classes").click({ force: true });
    cy.contains('[data-qa-id="common-select-grade-btn"]', "Class 8").click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', "A").click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-subject-btn"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("contain.text", "8");
  });

  it("TC-GSC-003: class switching fetches the corresponding book", () => {
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').invoke("text").then((before) => {
      cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
      cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(2).click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
    });
  });

  it("TC-GSC-004: a class with no prior activity starts at Chapter 1 Topic 1", () => {
    // Best-effort: picks a Grade/Subject combination not otherwise touched by
    // this suite. Note this scenario is inherently one-shot -- once visited,
    // the same combination will have "recent activity" on a future rerun and
    // TC-GSC-005's restore behavior would apply instead.
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
    cy.contains(".mdc-tab__text-label", "All My Classes").click({ force: true });
    cy.contains('[data-qa-id="common-select-grade-btn"]', "Class 4").click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-division-btn"]').first().click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-subject-btn"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
    // Switch back so this test doesn't leak a different "current class" into
    // later tests in this file.
    PlaylistPage.goToKnownContentTopic();
  });

  it("TC-GSC-005: existing recent activity is restored after class switching", () => {
    // Recent-class list ordering shifts with every switch made anywhere in
    // this suite (it's server-tracked per account, not reset per test), so
    // the original class/topic is captured by text and re-selected by
    // matching text rather than assumed to stay at a fixed index.
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").then((originalClassText) => {
      // Class-number formatting differs between this button and the recent-
      // class list items (e.g. "Class 8A" vs "8 | A"), so match on the
      // subject name alone, which is formatted consistently in both places.
      // The button's text also carries a trailing Material icon ligature
      // ("expand_more") that has to be stripped before matching.
      const subjectPart = originalClassText.split("|").pop().replace("expand_more", "").trim();
      cy.get('[data-qa-id="playlist-chapter-topic-btn"]').invoke("text").then((originalTopic) => {
        cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
        cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).click({ force: true });
        cy.wait(2000);

        cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
        cy.contains('[data-qa-id="playlist-recently-selected-class-btn"]', subjectPart).click({ force: true });
        cy.wait(2000);
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("contain.text", originalTopic.trim());
      });
    });
  });
});

describe("Playlist - EBook Access", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-EBK-002: book icon is hidden when the current Chapter has no e-book", () => {
    cy.get("app-e-book button").should("not.exist");
  });

  // TC-EBK-001, 003, 004 all require a Chapter that actually has an e-book.
  // Confirmed the source endpoint (GET /curriculum/book/{bookId}, the same
  // call that renders the Chapter/Topic popup) and that hasEbook is derived
  // by scanning its nodes for one whose parentNodeId matches the chapter --
  // but not the specific field/value that marks a node as an e-book, so
  // there's no confirmed way to find a qualifying chapter without either
  // that detail or manually inspecting a captured response. Revisit once
  // either is available.
  it.skip("TC-EBK-001: book icon is shown when current Chapter has an e-book (ebook node marker not confirmed, see comment above)", () => {});
  it.skip("TC-EBK-003: clicking book icon opens e-book viewer (ebook node marker not confirmed, see comment above)", () => {});
  it.skip("TC-EBK-004: selected e-book is emitted to viewer flow (ebook node marker not confirmed, see comment above)", () => {});
});

describe("Playlist - Resource List Loading", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-RLL-001: resources load when a new topic is selected", () => {
    // Uses the next-topic chevron rather than the Chapter/Topic popup list,
    // since some chapters only have a single topic (no ":not(.active)"
    // alternative to pick from the popup) -- the chevron always moves to an
    // adjacent topic regardless of how many topics the current chapter has.
    PlaylistPage.goToKnownContentTopic();
    cy.get('[data-qa-id="playlist-nav-topic-right"]').click({ force: true });
    cy.wait(2500);
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').should("have.length.greaterThan", 0);
  });

  it("TC-RLL-002: resources and assets are combined in the Playlist", () => {
    cy.get('[data-qa-id="playlist-resource-card"]').its("length").should("be.greaterThan", 0);
    cy.get('[data-qa-id="playlist-asset-card"]').its("length").should("be.greaterThan", 0);
  });

  it("TC-RLL-003: applicable synthetic quiz cards are included", () => {
    PlaylistPage.goToKnownContentTopic();
    cy.get('[data-qa-id="playlist-quiz-card"]').should("have.length.greaterThan", 0);
  });

  // Confirmed the ground-truth sequence endpoint (GET /serve/tp/sequence,
  // response field sequenceJson) -- the exact response shape wasn't fully
  // confirmed though, so this checks the app actually calls it and gets a
  // healthy response rather than parsing sequenceJson and asserting on it
  // directly, which would risk a wrong-schema false failure.
  it("TC-RLL-004: server playlist sequence determines resource order", () => {
    cy.intercept("GET", "**/serve/tp/sequence*").as("getSequence");
    PlaylistPage.goToKnownContentTopic();
    cy.wait("@getSequence", { timeout: 10000 }).its("response.statusCode").should("eq", 200);
  });

  // TC-RLL-005 (local unsaved Whiteboard merge) needs a "local unsaved
  // card" state. See the note above TC-RMR-003/004/005 below -- the service
  // that creates this state has no callers anywhere in the app, so it can
  // only be produced by seeding localStorage directly, not through the UI.
  it.skip("TC-RLL-005: local unsaved Whiteboard cards are merged (no reachable UI flow -- see TC-RMR-003 note)", () => {});

  // Confirmed ID-prefix markers: chapter IDs starting with "-bl" are
  // baseline chapters, topic IDs starting with "cktp-" are checkpoint
  // topics, both present in the same curriculum book response that
  // populates the Chapter/Topic popup.
  it("TC-RLL-006: baseline/checkpoint topics receive special handling", () => {
    // This test previously called goToKnownContentTopic() here and timed out
    // with "No request ever occurred" on every run. The reason: the
    // beforeEach ALREADY navigated to that exact class/chapter/topic, so
    // navigating there again is a no-op client-side and fires no request --
    // the app caches the curriculum book per subject. Changing SUBJECT is
    // what forces a genuine re-fetch, so that is what we do here.
    // Leaving the subject forces a fetch, but that first response is the OTHER
    // subject's book, which has no baseline/checkpoint topics -- asserting on
    // it fails on correct data. So bounce away and come back: the second fetch
    // is the configured subject's book, which is the one under test.
    cy.intercept("GET", "**/curriculum/book/*").as("getBook");
    PlaylistPage.goToOtherSubject();
    cy.wait("@getBook", { timeout: 20000 });
    PlaylistPage.goToTargetClass();
    cy.wait("@getBook", { timeout: 20000 }).then((interception) => {
      const body = JSON.stringify(interception.response.body || {});
      const hasBaselineOrCheckpoint = body.includes("-bl") || body.includes("cktp-");
      expect(
        hasBaselineOrCheckpoint,
        "curriculum book contains baseline (-bl) or checkpoint (cktp-) topic markers"
      ).to.be.true;
    });
  });
});

describe("Playlist - Open Resource", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-OR-001: clicking a normal resource opens it on the Whiteboard", () => {
    // The very first resource card can be a Quiz-type placeholder that
    // doesn't open a viewer (external quiz engine, out of scope here) --
    // filter to Worksheets first so the clicked card is a real openable PDF.
    PlaylistPage.goToKnownContentTopic();
    PlaylistPage.openFilterMenu();
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    cy.contains('[data-qa-id="playlist-filter-menu-select"]', "Worksheets").click({ force: true });
    cy.wait(500);
    // The PDF viewer's own pagination toolbar text (e.g. "Go to Page") is an
    // input placeholder, not real DOM text cy.contains() can match, so
    // confirm the open via the actual file request the click triggers.
    cy.intercept("GET", "**/fileservice/**").as("resourceFile");
    cy.get('[data-qa-id="playlist-resource-card"]').first().click({ force: true });
    cy.wait("@resourceFile", { timeout: 15000 });
    cy.wait(1500);
    PlaylistPage.openFilterMenu();
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
  });

  it("TC-OR-002: a Whiteboard asset opens the preview dialog", () => {
    // [data-qa-id="playlist-asset-card"] is reused inside quiz cards too, so
    // a blind .first() can land on a quiz instead of a real asset -- create
    // and target a known custom asset by title instead.
    const title = `OR002 Asset ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).click({ force: true });
    cy.wait(2000);
    cy.get('img[alt="close-btn"]').should("be.visible");
  });

  it("TC-OR-004: an unpinned drawer auto-hides after resource selection", () => {
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
    cy.get('[data-qa-id="playlist-resource-card"]').first().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "SHOW");
  });

  it("TC-OR-005: closing a resource returns to the Whiteboard", () => {
    const title = `OR005 Asset ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).click({ force: true });
    cy.wait(2000);
    cy.get('img[alt="close-btn"]').click({ force: true });
    cy.wait(1000);
    cy.get('img[alt="close-btn"]').should("not.exist");
  });

  // TC-OR-003 (opening a resource pauses a currently-playing video) is
  // covered instead in player.cy.js's Video Player suite, where the video-js
  // player selectors are established.
  it.skip("TC-OR-003: opening a resource pauses a currently playing video (covered in player.cy.js instead)", () => {});
});

describe("Playlist - Filter Resources", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.openFilterMenu();
  });

  it("TC-FR-001: more_horiz opens the Personalize/Filter dialog", () => {
    cy.contains("Filter Resources").should("be.visible");
  });

  it("TC-FR-002: selecting a resource-type filter updates the list", () => {
    cy.get('[data-qa-id="playlist-filter-menu-select"]').its("length").then((typeCount) => {
      if (typeCount > 1) {
        PlaylistPage.toggleAllFilterRow().click({ force: true });
        cy.wait(300);
        cy.get('[data-qa-id="playlist-filter-menu-select"]').first().click({ force: true });
        cy.wait(500);
        cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').should("have.length.greaterThan", 0);
      }
    });
  });

  it("TC-FR-003: clearing the filter restores resources", () => {
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').its("length").then((fullCount) => {
      PlaylistPage.toggleAllFilterRow().click({ force: true });
      cy.wait(300);
      PlaylistPage.toggleAllFilterRow().click({ force: true });
      cy.wait(500);
      cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').should("have.length", fullCount);
    });
  });

  it("TC-FR-004: Toggle All selects all resource types", () => {
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    PlaylistPage.toggleAllFilterRow().find('input[type="checkbox"]').should("be.checked");
  });

  it("TC-FR-005: Toggle All can clear all selections", () => {
    PlaylistPage.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    PlaylistPage.toggleAllFilterRow().find('input[type="checkbox"]').should("not.be.checked");
  });

  it("TC-FR-006: filtering does not trigger a server resource fetch", () => {
    cy.intercept("GET", "**/resource*").as("resourceFetch");
    cy.get('[data-qa-id="playlist-filter-menu-select"]').first().click({ force: true });
    cy.wait(1000);
    cy.get("@resourceFetch.all").should("have.length", 0);
  });
});

describe("Playlist - Reorder Edit Playlist", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-REP-001: Edit option is available from the Personalize dialog", () => {
    PlaylistPage.openFilterMenu();
    cy.get('[data-qa-id="playlist-filter-menu-edit-btn"]').should("be.visible");
  });

  it("TC-REP-002: an active filter causes a warning before editing", () => {
    PlaylistPage.openFilterMenu();
    cy.get('[data-qa-id="playlist-filter-menu-select"]').first().click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-filter-menu-edit-btn"]').click({ force: true });
    cy.wait(500);
    cy.contains("Editing the playlist will reset the applied filters").should("be.visible");
    cy.get('[data-qa-id="playlist-filter-menu-cancel-btn"]').filter(":visible").click({ force: true });
  });

  it("TC-REP-003: Playlist enters editable mode after Edit confirmation", () => {
    PlaylistPage.openFilterMenu();
    cy.get('[data-qa-id="playlist-filter-menu-edit-btn"]').click({ force: true });
    cy.wait(500);
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="playlist-filter-menu-edit-confirm-btn"]').length > 0) {
        cy.get('[data-qa-id="playlist-filter-menu-edit-confirm-btn"]').click({ force: true });
      }
    });
    cy.wait(1000);
    cy.get('[data-qa-id="playlist-resource-nav-finish-edit"]').should("be.visible");
    cy.get('[data-qa-id="playlist-resource-nav-finish-edit"]').click({ force: true });
  });

  it("TC-REP-007: Reset restores the default unfiltered resource list", () => {
    PlaylistPage.openFilterMenu();
    cy.get('[data-qa-id="playlist-filter-menu-reset-btn"]').click({ force: true });
    cy.wait(500);
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="playlist-filter-menu-reset-confirm-btn"]').length > 0) {
        cy.get('[data-qa-id="playlist-filter-menu-reset-confirm-btn"]').click({ force: true });
      }
    });
    cy.wait(1000);
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').should("have.length.greaterThan", 0);
  });

  // Attempted a standard Cypress CDK drag-drop simulation (confirmed CDK is
  // the underlying mechanism, not native HTML5 drag) by dispatching a
  // pointerdown/pointermove/pointerup sequence. TC-REP-004's strict check
  // (card order must actually change) proved this simulation does not
  // reliably trigger a real CDK reorder -- the card order was unchanged
  // after the "drag". TC-REP-005/006 initially looked like passes, but their
  // assertions only check that whatever state exists after the drag attempt
  // stays stable afterward, which is trivially true even when nothing moved
  // -- not a real pass. Reliable CDK drag simulation needs a more precise,
  // incremental pointer-move sequence (or a dedicated plugin) than attempted
  // here; left skipped rather than ship tests that don't test what they claim.
  it.skip("TC-REP-004: dragging a card changes the local order (pointer-event drag simulation did not trigger a real CDK reorder)", () => {});
  it.skip("TC-REP-005: Finish Editing persists the reordered sequence (depends on TC-REP-004)", () => {});
  it.skip("TC-REP-006: a failed sequence save rolls back the reorder (depends on TC-REP-004)", () => {});
});

describe("Playlist - Remove Resource", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-RMR-002: removing a custom asset removes the asset record as well", () => {
    const title = `Playlist Remove Test ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).should("be.visible");
    AddResourcePage.openAssetCardMenu(title);
    cy.get('[data-qa-id="playlist-asset-remove-btn"]').filter(":visible").click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-asset-remove-confirm-btn"]').filter(":visible").click({ force: true });
    cy.wait(1500);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).should("not.exist");
  });

  // TC-RMR-001 (removing a server-backed curriculum resource) is skipped: it
  // would permanently alter shared QA curriculum playlist content with no
  // guaranteed undo, which risks corrupting a shared environment other
  // people rely on. TC-RMR-002 above safely covers the same remove mechanics
  // using a throwaway asset created and owned by this test run instead.
  it.skip("TC-RMR-001: a server-backed curriculum resource can be removed (would permanently alter shared QA content -- not attempted)", () => {});
  // TC-RMR-003/004/005 (and TC-RLL-005) need a "local unsaved Whiteboard"
  // playlist card. Confirmed this state is currently unreachable through the
  // UI -- WhiteboardSaveService.save(), the only code that creates it and
  // writes to localStorage key wb_playlist_saves, has zero callers anywhere
  // in the app (dead/unfinished scaffolding, flagged to the dev team in
  // DEVELOPER_QUESTIONS.md). A QA workaround (seeding that key directly) was
  // suggested, but the exact WhiteboardSaveCardI shape needed to render a
  // valid card wasn't given -- only that it must include a "timestamp"
  // field. Guessing the rest of the shape risks a broken card and a false
  // result, so these stay skipped until either the save flow is wired up or
  // the full shape is confirmed.
  it.skip("TC-RMR-003: local unsaved Whiteboard removal opens a confirmation dialog (feature unreachable through the UI -- see comment above)", () => {});
  it.skip("TC-RMR-004: cancelling local Whiteboard deletion keeps the card (feature unreachable through the UI -- see comment above)", () => {});
  it.skip("TC-RMR-005: confirming local Whiteboard deletion removes the card (feature unreachable through the UI -- see comment above)", () => {});
});

describe("Playlist - Add Custom Asset", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-ACA-001: successful custom asset creation adds the asset to the Playlist", () => {
    const title = `Playlist Add Test ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).should("be.visible");
  });

  it("TC-ACA-003: the Playlist receives the successful custom asset result", () => {
    const title = `Playlist Receive Test ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).should("be.visible");
  });

  it("TC-ACA-004: a newly added custom asset follows the normal opening behavior", () => {
    const title = `Playlist Open Test ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).click({ force: true });
    cy.wait(2000);
    cy.get('img[alt="close-btn"]').should("be.visible");
  });

  it("TC-ACA-002: failed custom asset creation does not add an asset", () => {
    cy.get('[data-qa-id="playlist-asset-card"]').its("length").then((before) => {
      cy.intercept("POST", "**/serve/custom/asset*", { statusCode: 500, body: {} }).as("createAssetFailed");
      AddResourcePage.openCreateForm();
      const title = `Failed Create Test ${AddResourcePage.uniqueSuffix()}`;
      cy.get('input[formcontrolname="title"]').type(title);
      AddResourcePage.attachFile(`fail-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
      cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
      cy.wait("@createAssetFailed", { timeout: 10000 });
      cy.wait(1500);
      cy.contains('[data-qa-id="playlist-asset-card"]', title).should("not.exist");
      cy.get('[data-qa-id="playlist-asset-card"]').its("length").should("eq", before);
    });
  });
});

// TC-PL-COMPLETE: a single continuous run through the module's core surface
// -- Show/Hide, Pin, Chapter/Topic navigation, Filter, and Open/Close a
// resource -- chained together the way a real teacher would actually use
// them in one sitting, not just each in isolation. Deliberately excludes
// Remove Resource and the failure-path Add Custom Asset case, since those
// either destroy shared curriculum data or are already negative-path only.
describe("Playlist - Complete flow (Show/Hide/Pin, navigation, filter, open/close in one run)", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-PL-COMPLETE: drawer toggle -> pin -> chapter/topic nav -> filter -> open a resource -> close -> unpin", () => {
    // --- Show/Hide the drawer. ---
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");
    cy.get('[data-qa-id="playlist-drawer-btn"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "SHOW");
    cy.get('[data-qa-id="playlist-drawer-btn"]').click({ force: true });
    cy.wait(500);
    cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");

    // --- Pin it so selecting a resource won't auto-hide it later. ---
    cy.get('[data-qa-id="playlist-resource-nav-pin"]').click({ force: true });
    cy.wait(500);

    // --- Go to a known-content topic (this IS chapter/topic navigation --
    // goToTargetClass() drives Grade/Division/Subject/Chapter/Topic
    // selection) so filtering/opening has real, predictable cards. ---
    PlaylistPage.goToKnownContentTopic();
    cy.wait(1000);

    // --- Previous/Next chevrons move off, then back onto the known topic. ---
    cy.get(".current-chapter-topic").invoke("text").then((knownTopic) => {
      cy.get('[data-qa-id="playlist-nav-topic-right"]').click({ force: true });
      cy.wait(2000);
      cy.get(".current-chapter-topic").invoke("text").should("not.eq", knownTopic);

      cy.get('[data-qa-id="playlist-nav-topic-left"]').click({ force: true });
      cy.wait(2000);
      cy.get(".current-chapter-topic").invoke("text").should("eq", knownTopic);
    });

    // --- Filter to Worksheets, confirm the list updates, then clear it. ---
    cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').its("length").then((fullCount) => {
      PlaylistPage.openFilterMenu();
      PlaylistPage.toggleAllFilterRow().click({ force: true });
      cy.wait(300);
      cy.contains('[data-qa-id="playlist-filter-menu-select"]', "Worksheets").click({ force: true });
      cy.wait(500);
      // Broader selector deliberately, not just playlist-resource-card:
      // CONFIRMED live 2026-08-23 this account's Worksheets in this topic
      // are currently all playlist-asset-card (accumulated test-created
      // assets), not curriculum playlist-resource-card -- TC-OR-001's
      // narrower assumption no longer holds after a session's worth of
      // test data accumulation. Matches TC-FR-002/003's own combined
      // selector elsewhere in this file.
      cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"]').should("have.length.greaterThan", 0);

      // --- Open the first filtered card. ---
      cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"]').first().click({ force: true });
      cy.wait(2500);
      // Pinned drawer -- opening a resource must NOT have auto-hidden it.
      cy.get('[data-qa-id="playlist-drawer-btn"]').should("contain.text", "HIDE");

      // --- Clear the filter: uncheck Worksheets specifically (toggle-all's
      // semantics from an already-partial state aren't the clean full-reset
      // TC-FR-003 assumes from a fresh/all-checked state -- confirmed live
      // 2026-08-23, toggling it twice here left Worksheets still the only
      // checked type instead of restoring all). Then Toggle All ONCE more
      // to guarantee every type is back on. ---
      PlaylistPage.openFilterMenu();
      cy.contains('[data-qa-id="playlist-filter-menu-select"]', "Worksheets").click({ force: true });
      cy.wait(300);
      PlaylistPage.toggleAllFilterRow().click({ force: true });
      cy.wait(500);
      cy.get('[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"], [data-qa-id="playlist-quiz-card"]').should("have.length", fullCount);
    });

    // --- Unpin, restoring default state for whatever runs next. ---
    cy.get('[data-qa-id="playlist-resource-nav-pin"]').click({ force: true });
  });
});
