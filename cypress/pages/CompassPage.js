// Page Object for the Compass module (the floating button on the whiteboard/
// player screen that opens AnalyseIt / ExploreIt / Revision Tests).
//
// IMPORTANT -- how these selectors were confirmed: unlike the rest of this
// suite (selectors dumped from the LIVE DOM, per claude/README.md), no QA
// login credentials were available in this environment when this file was
// written. Every `data-qa-id` below was instead read directly out of the
// app's own Angular source in the sibling cep2-workspace repo, which is an
// equally valid "don't guess" source -- but it has NOT yet been cross-checked
// against the live app. Treat this file as "source-verified, DOM-unconfirmed"
// until the first real run against QA. If a selector below doesn't match what
// the live DOM shows, fix it here rather than assuming the test is wrong.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/whiteboard/whiteboard.component.html (mount point)
//   projects/main/src/app/modules/compass/compass.component.html
//   projects/main/src/app/modules/compass/containers/assignment-details/assignment-details.component.html
//   projects/main/src/app/modules/compass/containers/assignment-list/assignment-list.component.html
//   projects/main/src/app/modules/compass/containers/assignment-questions/assignment-questions.component.html
//
// Confirmed facts from source (see compass.component.ts):
//   * The trigger button only renders when `isMagnetAvailable` is true --
//     same class of curriculum-gated visibility as the Toolbar's Magnet tool
//     (see claude/MODULE_COVERAGE.md, TB-054-060 in toolbar.cy.js).
//   * "Analyseit" only renders when the teacher is assigned to the current
//     class/subject (`analyzeIt`).
//   * Assignment content depends on `this.assignments` being non-empty; when
//     empty the app shows the no-homework prompt instead -- a real branch in
//     the app, not a bug, so tests must check which one occurred rather than
//     assuming either one (same pattern as the Quiz F02 branch check
//     documented in Test_Cases/README.md).
//   * "Exploreit" widget tiles and "Revision Tests" each have their own,
//     independent data gate (widgets.length / studentTests.length).

export const CompassPage = {
  triggerBtn() {
    return cy.get('[data-qa-id="compass-trigger-btn"]');
  },

  open() {
    this.triggerBtn().should("be.visible").click({ force: true });
    cy.wait(1000);
  },

  analyseItItem() {
    return cy.get('[data-qa-id="compass-analyseit-item"]');
  },

  openAnalyseIt() {
    this.analyseItItem().should("be.visible").click({ force: true });
    cy.wait(1500);
  },

  noHomeworkPrompt() {
    return cy.get('[data-qa-id="compass-no-homework-create"]');
  },

  // True/false via a Cypress-chained callback -- callers branch on this the
  // same way the Quiz spec branches on the F02 "already in Playlist?" check.
  //
  // CONFIRMED live 2026-08-23: `compass-no-homework-create` (compass.component.html)
  // never actually renders in practice, even when assignments.length === 0 --
  // clicking the AnalyseIt item opens the SEPARATE `compassAssignmentDetailRef`
  // floating popover (assignment-details.component.html), which mounts NO
  // content at all (an empty Angular comment placeholder) when there is no
  // real assignment data, rather than showing any no-homework messaging.
  // `compass-detail-view-list-btn` only exists inside that popover when a
  // real assignment loaded, so its absence is the reliable "no homework"
  // signal on this account/class, not the no-homework-create div.
  hasNoHomework(callback) {
    cy.wait(500);
    cy.get("body").then(($body) => {
      callback($body.find('[data-qa-id="compass-detail-view-list-btn"]').length === 0);
    });
  },

  detailCancelBtn() {
    return cy.get('[data-qa-id="compass-detail-cancel-btn"]');
  },

  viewListBtn() {
    return cy.get('[data-qa-id="compass-detail-view-list-btn"]');
  },

  viewQuestionsBtn() {
    return cy.get('[data-qa-id="compass-detail-view-questions-btn"]');
  },

  assignmentRows() {
    return cy.get('[data-qa-id^="compass-list-assignment-"]');
  },

  listCancelBtn() {
    return cy.get('[data-qa-id="compass-list-cancel-btn"]');
  },

  toggleAnswerBtn() {
    return cy.get('[data-qa-id="compass-question-toggle-answer-btn"]');
  },

  exploreItWidgetTiles() {
    return cy.get('[data-qa-id^="compass-exploreit-widget-"]');
  },

  openWidgetsLink() {
    return cy.get('[data-qa-id="compass-exploreit-open-widgets"]');
  },

  revisionTestsItem() {
    return cy.get('[data-qa-id="compass-revision-tests-item"]');
  },
};
