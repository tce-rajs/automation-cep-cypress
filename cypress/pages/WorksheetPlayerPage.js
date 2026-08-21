// Page Object for the PLAYLIST side of the PDF / Worksheet player --
// everything needed to establish the workbook's preconditions
// (Test_Cases/05_Player/PDF_Worksheet_Player_Test_Cases.xlsx, every case
// of which starts from "PDF/Worksheet resource available") WITHOUT doing more
// than the precondition asks for.
//
// SAME DISCIPLINE AS QuizPlayerPage
// --------------------------------
// A precondition is a CHECK first and a navigation only if the check fails.
// The old pdf-worksheet.cy.js beforeEach ran PlaylistPage.goToKnownContentTopic()
// on every single test regardless of where the app already was, which is the
// same mistake the quiz spec had: it re-navigates the curriculum to reach a
// resource that is, nearly always, already on the strip in front of it. The
// app reopens the last-used class after login, so after one run the target
// Playlist IS the Playlist -- navigating again only adds ~8s per test and
// several more chances to fail for reasons unrelated to the PDF player.
//
// HOW A WORKSHEET IS IDENTIFIED
// -----------------------------
// Playlist cards do NOT expose their resource type in any confirmed
// attribute, and the workbook forbids inventing selectors, so the app's own
// Filter Resources -> "Worksheet" is used as the type test: with that filter
// applied, every [data-qa-id="playlist-resource-card"] left on the strip is a
// worksheet. Note this is a PLAYLIST-level filter, not curriculum navigation
// -- it does not move the teacher off the class they are on, which is why it
// is allowed inside the "do not navigate" branch.
//
// The filter persists on the account, so specs must restore it (see
// restoreFilter) exactly as the previous version did.

import { PlaylistPage } from "./PlaylistPage";
import { PlayerPage } from "./PlayerPage";

export const WorksheetPlayerPage = {
  FILTER_TYPE: "Worksheet",
  CARD_SELECTOR: '[data-qa-id="playlist-resource-card"]',

  // The PDF viewer's own text is not reliably real DOM text, so the file
  // fetch is what confirms a document actually loaded. Registered before the
  // click, never after.
  FILE_REQUEST: "**/fileservice/**",

  cards() {
    return cy.get(this.CARD_SELECTOR);
  },

  cardCount() {
    return cy.get("body").then(($body) => $body.find(this.CARD_SELECTOR).length);
  },

  // Narrows the strip to worksheets only. Idempotent enough to call again
  // after navigating: filterToType always toggles all off first.
  applyFilter() {
    PlaylistPage.filterToType(this.FILTER_TYPE);
  },

  restoreFilter() {
    PlaylistPage.restoreAllFilter();
  },

  // The filtered strip re-renders after the menu closes, and reading the count
  // during that gap sees zero worksheets in a topic that has several -- which
  // would send the caller down the navigation branch for no reason. Poll,
  // never assert: zero really is a possible answer here.
  settleFiltered(maxAttempts = 5, attempt = 0) {
    return cy.get("body").then(($body) => {
      if ($body.find(this.CARD_SELECTOR).length > 0 || attempt >= maxAttempts) return;
      cy.wait(1000);
      return this.settleFiltered(maxAttempts, attempt + 1);
    });
  },

  // ---- The precondition decision, not a step ------------------------------
  //
  // "PDF/Worksheet resource available" means: is one on the Playlist that is
  // open RIGHT NOW? Yes -> use it. No -> and only then -> navigate to the
  // configured target class and look again.
  //
  // Yields { navigated: boolean } so a test can assert which branch it took.
  ensureWorksheetAvailable() {
    PlaylistPage.ensureDrawerVisible();
    // A small settle budget: the whole point of the next step is that an empty
    // result is a legitimate answer, so there is no reason to wait out the
    // full budget for cards that are not coming.
    PlaylistPage.settle(6);
    this.applyFilter();
    this.settleFiltered();

    return this.cardCount().then((count) => {
      if (count > 0) {
        cy.log(`"${this.FILTER_TYPE}" resource is already in the current Playlist -- opening directly, no curriculum navigation`);
        return cy.wrap({ navigated: false }, { log: false });
      }

      cy.log(`No "${this.FILTER_TYPE}" resource in the current Playlist -- navigating to the target class`);
      // Navigate with the filter off, so the destination Playlist is judged on
      // what it actually holds rather than on a filter left over from here.
      this.restoreFilter();
      PlaylistPage.goToTargetClass();
      PlaylistPage.settle();
      this.applyFilter();
      this.settleFiltered();
      this.cards().should("have.length.greaterThan", 0);
      return cy.wrap({ navigated: true }, { log: false });
    });
  },

  // ---- Opening -----------------------------------------------------------

  // Clicks the worksheet already on the strip and waits for its document to
  // load. No navigation path at all: if the precondition is not met this
  // fails and says so, rather than quietly wandering off to find one.
  openDirectly() {
    PlaylistPage.ensureDrawerVisible();
    this.cards().should("have.length.greaterThan", 0);

    cy.intercept("GET", this.FILE_REQUEST).as("resourceFile");
    PlayerPage.openFirstResourceCard();
    cy.wait("@resourceFile", { timeout: 15000 });
    cy.wait(1000);
    return PlayerPage.shouldBeOpen();
  },

  // Establishes the precondition (navigating only if it is not already met)
  // and then opens. This is what the body of a test that is not ABOUT the
  // precondition should call.
  open() {
    this.ensureWorksheetAvailable();
    return this.openDirectly();
  },
};
