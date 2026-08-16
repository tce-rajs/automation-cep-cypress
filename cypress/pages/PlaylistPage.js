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

  // Navigates to Class 8A | Computer Science, "Photoshop" chapter, first
  // topic (2.1 Introduction to Photoshop) -- confirmed via direct
  // exploration to reliably contain Video/Worksheets/Quiz/Unsupported
  // resources. "Current topic" is server-tracked per account and drifts
  // between test runs, so this always navigates explicitly rather than
  // assuming whatever topic is currently active has the needed content.
  // Clicking an already-active chapter is a no-op that just closes the
  // popup, so it's only clicked when not already selected.
  goToKnownContentTopic() {
    this.openClassPopup();
    this.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', "Class 8").click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', "A").click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', "Computer Science").click({ force: true });
    cy.wait(2000);
    this.openChaptersPopup();
    cy.contains('[data-qa-id="playlist-select-chapter"]', "Photoshop").then(($chapter) => {
      if (!$chapter.hasClass("active")) {
        cy.wrap($chapter).click({ force: true });
        cy.wait(2000);
        this.openChaptersPopup();
      }
    });
    cy.get('[data-qa-id="playlist-select-topic"]').first().click({ force: true });
    cy.wait(2000);
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

  // Generic version of the chapter/topic-selection steps in
  // goToKnownContentTopic. Assumes the Class popup has already been closed
  // (i.e. call goToClass first if a specific class is also needed).
  goToChapterTopic(chapterName, topicIndex = 0) {
    this.openChaptersPopup();
    cy.contains('[data-qa-id="playlist-select-chapter"]', chapterName).then(($chapter) => {
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
    this.goToChapterTopic(targetClass.chapter, targetClass.topicIndex);
  },

  // Same pattern as goToKnownContentTopic, but for the "HTML" chapter's
  // first topic (7.1 Lists) -- confirmed to contain a Code-type resource.
  goToHtmlChapterFirstTopic() {
    this.openClassPopup();
    this.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', "Class 8").click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', "A").click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', "Computer Science").click({ force: true });
    cy.wait(2000);
    this.openChaptersPopup();
    cy.contains('[data-qa-id="playlist-select-chapter"]', "HTML").then(($chapter) => {
      if (!$chapter.hasClass("active")) {
        cy.wrap($chapter).click({ force: true });
        cy.wait(2000);
        this.openChaptersPopup();
      }
    });
    cy.get('[data-qa-id="playlist-select-topic"]').first().click({ force: true });
    cy.wait(2000);
  },
};
