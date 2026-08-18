// Page Object for the Add Resource menu and the Create Asset form reached
// from it. Used by add-resource.cy.js, create.cy.js, playlist.cy.js,
// player.cy.js and smoke.cy.js.

// Real fixture files (cypress/fixtures/sample.*) are used for these
// extensions whenever an exact byte size isn't required. Formats without a
// real fixture (office documents, mp4) fall back to a synthetic buffer --
// the app's validation only checks extension/mimetype/size, not real file
// structure, so this is a reasonable stand-in for those types.
const FIXTURE_FOR_EXT = { txt: "sample.txt", pdf: "sample.pdf", png: "sample.png", jpg: "sample.jpg", jpeg: "sample.jpg", gif: "sample.gif" };

import { PlaylistPage } from "./PlaylistPage";

export const AddResourcePage = {
  // The QA backend appears to silently de-duplicate a submission that reuses
  // the exact same Title/filename as an earlier run, so every created asset
  // gets a unique suffix to avoid collisions between repeated test runs.
  uniqueSuffix() {
    return `${Date.now()}`;
  },

  open() {
    // The trigger's wrapper can still be mid-transition (opacity 0, class
    // "hidden") right after navigating to a class/topic -- wait for it to
    // actually be visible before clicking instead of assuming a fixed delay
    // is always enough. If it's still not visible after 15s, the page is
    // more genuinely stuck (not just mid-animation) -- a reload reliably
    // clears that, same as other stuck-state recoveries in this suite.
    // A hidden Playlist drawer keeps the FAB's wrapper at opacity 0, and that
    // state survives the reload below -- so restore the drawer first, or the
    // reload just reproduces the same invisible FAB.
    PlaylistPage.ensureDrawerVisible();
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="add-resource-trigger"]:visible').length === 0) {
        cy.reload();
        cy.wait(3000);
        PlaylistPage.ensureDrawerVisible();
      }
    });
    // Deliberately NOT { force: true }. ensureDrawerVisible() above guarantees
    // the FAB is genuinely visible, so forcing would only suppress Cypress's
    // actionability checks -- and those checks are what tell us the truth. A
    // forced click on a hidden or covered FAB silently does nothing and the
    // test then fails several steps later with a misleading error. That is
    // exactly how the hidden-drawer bug (and the DropIt panel covering the FAB
    // in TC-AR-048) stayed hard to diagnose.
    cy.get('[data-qa-id="add-resource-trigger"]', { timeout: 20000 }).should("be.visible").click();
    cy.wait(800);
  },

  openCreateForm() {
    this.open();
    cy.get('[data-qa-id="add-resource-action-create"]').click({ force: true });
    cy.wait(1200);
  },

  // Opens a playlist card's "Choose Action" overflow menu (the entry point for
  // both Edit and Remove). Scrolls the card into view first: the playlist
  // drawer scrolls horizontally, and a freshly created asset lands off-screen
  // once enough cards have accumulated during a run. Clicking its overflow
  // button then silently does nothing, and the test fails later with a
  // confusing "expected to find :visible" or a missing form field rather than
  // "the card wasn't reachable". Caused TC-CREATE-032/033 and TC-RMR-002.
  openAssetCardMenu(title) {
    cy.contains('[data-qa-id="playlist-asset-card"]', title).scrollIntoView();
    cy.wait(300);
    cy.contains('[data-qa-id="playlist-asset-card"]', title)
      .find('[data-qa-id="playlist-asset-overflow-icon-btn"]')
      .click({ force: true });
    cy.wait(500);
  },

  attachFile(fileName, mimeType, sizeInBytes) {
    const ext = fileName.split(".").pop().toLowerCase();
    if (!sizeInBytes && FIXTURE_FOR_EXT[ext]) {
      cy.fixture(FIXTURE_FOR_EXT[ext], "base64").then((base64Content) => {
        cy.get('input[type="file"]').selectFile(
          { contents: Cypress.Buffer.from(base64Content, "base64"), fileName, mimeType },
          { force: true }
        );
      });
      return;
    }
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.alloc(sizeInBytes || 1024), fileName, mimeType },
      { force: true }
    );
  },

  // Fills and submits the Create form with a unique title and a real
  // attached .txt file -- the common path used by every "just get a
  // throwaway asset onto the Playlist" scenario across specs.
  createThrowawayAsset(title) {
    this.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(title);
    this.attachFile(`asset-${this.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
    this.closeAutoPreview();
  },

  // A newly created asset auto-opens its own preview -- for the .txt we
  // upload that is the "UNSUPPORTED FILE" viewer. It overlays the Playlist
  // drawer, and while it is open every card control is present in the DOM but
  // none are :visible. That is exactly how TC-RMR-002 failed: 32 remove
  // buttons found, 0 visible.
  //
  // The previous version ran a fixed 4 iterations of 500ms and gave up. Under
  // a slow response the whole loop could complete before the preview had even
  // rendered, so nothing was ever clicked and the overlay stayed up. This
  // waits longer, and then ASSERTS the drawer is actually interactable -- so
  // a future failure points at the overlay instead of surfacing as a
  // confusing "expected to find :visible" three lines later.
  closeAutoPreview() {
    const closeIconSelector = 'img[alt="close-btn"], img[src*="closeIcon.png"], button.closeIcon';
    for (let i = 0; i < 8; i++) {
      cy.wait(750);
      cy.get("body").then(($body) => {
        const $visible = $body.find(closeIconSelector).filter(":visible");
        if ($visible.length > 0) {
          cy.wrap($visible.first()).click({ force: true });
          cy.wait(500);
        }
      });
    }
    cy.get('[data-qa-id="playlist-asset-card"]', { timeout: 15000 })
      .filter(":visible")
      .should("have.length.greaterThan", 0);
  },
};
