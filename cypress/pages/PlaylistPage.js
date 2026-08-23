// Page Object for the Playlist drawer: Chapter/Topic navigation, Grade/
// Subject/Class switching, the "..." Filter Resources dialog, and the
// Show/Hide/Pin drawer controls. Used by navigation.cy.js, playlist.cy.js
// and player.cy.js.

import targetClass from "../config/targetClass";

export const PlaylistPage = {
  openClassPopup() {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
  },

  openAllMyClassesTab() {
    cy.contains(".mdc-tab__text-label", "All My Classes").click({ force: true });
  },

  // A click on this button can land mid-animation right after a previous
  // popup-closing action and toggle the popup closed instead of open --
  // confirmed via direct exploration. The open animation needs time to
  // render before we can tell whether the click worked, so we wait first;
  // checking immediately after the click reads the popup as "not open" and
  // the retry click then closes a popup that was actually still opening.
  openChaptersPopup() {
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.wait(600);
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="playlist-select-chapter"]').length === 0) {
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
        cy.wait(600);
      }
    });
    cy.get('[data-qa-id="playlist-select-chapter"]').should("have.length.greaterThan", 0);
  },

  // The Playlist drawer's hidden/visible state persists on the account and
  // survives both a page reload and a fresh login, and navigating to a class
  // or topic does NOT restore it. While it is hidden, `.resource-nav-wrapper`
  // (which contains the Add Resource FAB) is set to opacity 0, so the FAB is
  // in the DOM but unusable -- confirmed via a state dump: assetCardCount 162
  // (topic not empty) and chapterPopupOpen false (no popup), yet
  // wrapperClass "resource-nav-wrapper hidden" and drawerBtnText "SHOW".
  //
  // Several Playlist tests legitimately leave the drawer hidden (Show/Hide/Pin
  // TC-SHP-001/002, and the auto-hide-on-selection cases TC-SHP-004/TC-OR-004),
  // and nothing puts it back -- which silently breaks every later spec that
  // needs the FAB. Call this before reaching for the FAB rather than assuming
  // whatever state the previous spec happened to leave behind.
  //
  // The button reads "SHOW" when the drawer is hidden and "HIDE" when visible.
  ensureDrawerVisible() {
    cy.get('[data-qa-id="playlist-drawer-btn"]', { timeout: 20000 }).then(($btn) => {
      if ($btn.text().toUpperCase().includes("SHOW")) {
        cy.wrap($btn).click({ force: true });
        cy.wait(1000);
      }
    });
  },

  // Every card type the resource strip can hold. Used to tell "the Playlist
  // has not finished rendering yet" from "this Playlist really is empty".
  ANY_CARD_SELECTOR:
    '[data-qa-id="playlist-quiz-card"], [data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"]',

  // Cards stream in after the topic's resource list resolves, so a check that
  // runs the instant the whiteboard paints reads an empty strip. Any test that
  // decides something from card presence -- "is the resource I need already
  // here, or must I navigate?" -- must settle first, or it takes the wrong
  // branch for a reason that has nothing to do with the app.
  //
  // Polls, never asserts: an empty Playlist is a legitimate answer, not a
  // failure, so this must not fail on its own. maxAttempts is a budget --
  // callers that EXPECT an empty strip should pass a smaller one, since they
  // burn the whole thing every time.
  settle(maxAttempts = 12, attempt = 0) {
    return cy.get("body").then(($body) => {
      if ($body.find(this.ANY_CARD_SELECTOR).length > 0 || attempt >= maxAttempts) return;
      cy.wait(1000);
      return this.settle(maxAttempts, attempt + 1);
    });
  },

  // Where the app currently is, read off the two Playlist header buttons.
  // Lets a test PROVE that it navigated nowhere (capture before, assert
  // unchanged after) instead of just commenting that it did not.
  currentLocation() {
    return cy
      .get('[data-qa-id="playlist-current-grade-subject-btn"]')
      .invoke("text")
      .then((classText) =>
        cy
          .get('[data-qa-id="playlist-chapter-topic-btn"]')
          .invoke("text")
          .then((topicText) => `${classText.trim()} | ${topicText.trim()}`)
      );
  },

  openFilterMenu() {
    cy.get('[data-qa-id="playlist-resource-nav-filter-menu"]').click({ force: true });
    cy.wait(800);
  },

  toggleAllFilterRow() {
    return cy.get(".select-filter-list--heading mat-list-option");
  },

  filterToType(typeName) {
    this.openFilterMenu();
    this.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    cy.contains('[data-qa-id="playlist-filter-menu-select"]', typeName).click({ force: true });
    cy.wait(500);
  },

  restoreAllFilter() {
    this.openFilterMenu();
    this.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
    this.toggleAllFilterRow().click({ force: true });
    cy.wait(300);
  },

  // Was hardcoded to Class 8A | Computer Science, "Photoshop" chapter -- a
  // chapter chosen for its CONTENT (Video/Worksheets/Quiz/Unsupported). That
  // chapter does not exist on the current QA account (Goyal Brothers), whose
  // curriculum is entirely different, so the old target broke every caller.
  //
  // Now resolves to the configured class's first chapter/topic, same as
  // goToTargetClass(). Retained as a separate method because its 12 call
  // sites in playlist.cy.js and player.cy.js express a distinct intent
  // ("somewhere with real resources"), and because the content guarantee may
  // be restored later by pointing targetClass.js at a richer chapter.
  //
  // CAVEAT: the old Video/Worksheets/Quiz/Unsupported guarantee no longer
  // holds. Tests that need a specific resource type may now find none.
  goToKnownContentTopic() {
    this.goToTargetClass();
  },

  // Generic version of the class-selection steps in goToKnownContentTopic,
  // parameterized so any spec can point at whichever class it needs instead
  // of the one hardcoded class above.
  goToClass(grade, division, subject) {
    this.openClassPopup();
    this.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', grade).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', division).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', subject).click({ force: true });
    cy.wait(2000);
  },

  // Switches to any subject OTHER than the configured one, resolved at
  // runtime so it survives a curriculum change. Needed by tests that must
  // observe a fresh curriculum-book fetch: the app caches the book per
  // subject, so re-selecting the same class/chapter/topic fires no request at
  // all (see APP_QUIRKS.md -- "clicking an already-loaded UI element doesn't
  // always fire a new network request"). Changing subject reliably does.
  goToOtherSubject() {
    this.openClassPopup();
    this.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', targetClass.grade).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', targetClass.division).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-subject-btn"]').then(($subjects) => {
      const other = $subjects.toArray().find((el) => el.innerText.trim() !== targetClass.subject);
      expect(other, `a subject other than "${targetClass.subject}"`).to.exist;
      cy.wrap(other).click({ force: true });
    });
    cy.wait(2500);
  },

  // Generic version of the chapter/topic-selection steps in
  // goToKnownContentTopic. Assumes the Class popup has already been closed
  // (i.e. call goToClass first if a specific class is also needed).
  // `chapter` may be a chapter NAME (string) or an INDEX (number, 0 = first).
  // Index is preferred: chapter names are curriculum-specific and vanish when
  // the QA account is pointed at a different school, whereas "the first
  // chapter" always resolves to something real.
  goToChapterTopic(chapter = 0, topicIndex = 0) {
    this.openChaptersPopup();
    const chapterEl =
      typeof chapter === "number"
        ? cy.get('[data-qa-id="playlist-select-chapter"]').eq(chapter)
        : cy.contains('[data-qa-id="playlist-select-chapter"]', chapter);
    chapterEl.then(($chapter) => {
      if (!$chapter.hasClass("active")) {
        cy.wrap($chapter).click({ force: true });
        cy.wait(2000);
        this.openChaptersPopup();
      }
    });
    cy.get('[data-qa-id="playlist-select-topic"]').eq(topicIndex).click({ force: true });
    cy.wait(2000);
    // Selecting a Topic (unlike a Chapter) does not auto-close this popup --
    // confirmed via screenshot: it was still open afterwards, which hides
    // the Add Resource FAB entirely since the app hides it behind any open
    // popup. The toggle button closes it on a second click.
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="playlist-select-chapter"]').length > 0) {
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
        cy.wait(500);
      }
    });
  },

  // Navigates to whatever class/chapter/topic is configured in
  // cypress/config/targetClass.js. This is the one to call from a test that
  // needs to run "in the class my boss gave me" -- update that config file
  // when a new class is assigned, and every spec using this method picks up
  // the change automatically.
  goToTargetClass() {
    this.goToClass(targetClass.grade, targetClass.division, targetClass.subject);
    this.goToChapterTopic(targetClass.chapterIndex, targetClass.topicIndex);
    // This is the suite's "put me in a known state" entry point, so it also
    // establishes drawer visibility rather than inheriting whatever the
    // previous spec left behind. Without this, a test that asserts on the FAB
    // directly (e.g. TC-AR-001) fails even though nothing is wrong with it,
    // because Playlist's Show/Hide tests left the drawer hidden on the account.
    this.ensureDrawerVisible();
  },

  // Targets Class 12A | Computer Science | "2. Exception Handling in Python"
  // (chapter index 1), specifically for Code Editor validation -- per
  // instruction, Computer Science in 12A is reserved for this rather than
  // folded into the Physics/Chemistry-based targetClass.js.
  //
  // CONFIRMED live via cypress/scratch/explore-12a.cy.js (2026-08-22): this
  // chapter's first topic holds 4 resource cards whose type-icons are
  // Worksheet, Video, Code (ic.code.svg), Worksheet -- a real Code-type
  // resource, not a guess. Chapters 7 ("Searching") and 8 ("Understanding
  // Data") also showed a Code icon if this one ever stops holding one.
  //
  // Replaces the old goToHtmlChapterFirstTopic(), which pointed at Class 8A |
  // Computer Science | "HTML" -- stale after the 2026-08-22 retarget to 12A.
  goToComputerScienceCodeChapter() {
    this.goToClass("Class 12", "A", "Computer Science");
    this.goToChapterTopic(1, 0);
    this.ensureDrawerVisible();
  },

  // Targets Class 12A | Computer Science | "14. Project Based Learning"
  // (chapter index 13) | its first topic, "14.1 Approaches for Solving
  // Project" -- a QA-curated topic (support.admin account) that holds ALL
  // SIX filterable resource types at once, confirmed live via the Filter
  // Resources count dump: Video (1), Worksheets (2), Images (1), Quiz (1),
  // Weblink (1), Code (1). Used by ImagePlayerPage/WeblinkPlayerPage since
  // Image/Weblink resources exist nowhere else confirmed on this account.
  //
  // CONFIRMED: unlike curriculum-native resources (which render as
  // [data-qa-id="playlist-resource-card"]), every resource at this topic
  // renders as [data-qa-id="playlist-asset-card"] instead -- consistent with
  // this being teacher/admin-uploaded custom content rather than textbook
  // curriculum. Callers must select on playlist-asset-card here, not
  // playlist-resource-card.
  goToComputerScienceProjectChapter() {
    this.goToClass("Class 12", "A", "Computer Science");
    this.goToChapterTopic(13, 0);
    this.ensureDrawerVisible();
  },

  // Targets Class 12A | Physics | Chapter 14 "Semiconductor Electronics..."
  // | its first topic -- the one confirmed live (via user-provided
  // screenshot, then cypress/scratch/out/explore-ebook.json) to have an
  // E-book: "(CE Crystal) NCERT Physics Class 12", 15 chapters, 1 linked
  // resource on the chapter opened by default. E-book is a per-chapter flag
  // (hasEbook), not a filterable resource type -- see EbookPlayerPage.js.
  goToPhysicsEbookChapter() {
    this.goToClass("Class 12", "A", "Physics");
    this.goToChapterTopic(13, 0);
    this.ensureDrawerVisible();
  },
};
