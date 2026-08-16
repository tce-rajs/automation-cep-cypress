// Page Object for the Add Resource menu and the Create Asset form reached
// from it. Used by add-resource.cy.js, create.cy.js, playlist.cy.js,
// player.cy.js and smoke.cy.js.

// Real fixture files (cypress/fixtures/sample.*) are used for these
// extensions whenever an exact byte size isn't required. Formats without a
// real fixture (office documents, mp4) fall back to a synthetic buffer --
// the app's validation only checks extension/mimetype/size, not real file
// structure, so this is a reasonable stand-in for those types.
const FIXTURE_FOR_EXT = { txt: "sample.txt", pdf: "sample.pdf", png: "sample.png", jpg: "sample.jpg", jpeg: "sample.jpg", gif: "sample.gif" };

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
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="add-resource-trigger"]:visible').length === 0) {
        cy.reload();
        cy.wait(3000);
      }
    });
    cy.get('[data-qa-id="add-resource-trigger"]', { timeout: 20000 }).should("be.visible").click({ force: true });
    cy.wait(800);
  },

  openCreateForm() {
    this.open();
    cy.get('[data-qa-id="add-resource-action-create"]').click({ force: true });
    cy.wait(1200);
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
    // A newly created asset auto-opens its own preview -- close it so the
    // Playlist bar underneath is free to interact with afterwards. Retries a
    // few times rather than checking once: the close icon can still be
    // rendering at a single fixed-delay check, especially under slow network.
    const closeIconSelector = 'img[alt="close-btn"], img[src*="closeIcon.png"], button.closeIcon';
    for (let i = 0; i < 4; i++) {
      cy.wait(500);
      cy.get("body").then(($body) => {
        const $visible = $body.find(closeIconSelector).filter(":visible");
        if ($visible.length > 0) {
          cy.wrap($visible.first()).click({ force: true });
          cy.wait(500);
        }
      });
    }
  },
};
