// Gallery module automation, based on Test_Cases/03_Add_Resource/Gallery_Test_Cases.xlsx
//
// Gallery's core behavior (confirmed during MOD-003 exploration): clicking
// an image attaches it directly to the Whiteboard canvas with no preview and
// no confirmation step, and the Gallery panel stays open for further
// selections.

import { GalleryPage } from "../../pages/GalleryPage";
import { LibraryPage } from "../../pages/LibraryPage";

describe("Gallery - Opening", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-GAL-001: opens from the Add Resource menu", () => {
    GalleryPage.open();
    cy.contains("Gallery").should("be.visible");
  });

  it("TC-GAL-002: shows curated images available for selection", () => {
    GalleryPage.open();
    cy.get('[data-qa-id^="gallery-image-card-"]').should("have.length.greaterThan", 0);
  });
});

describe("Gallery - Login guard", () => {
  it("TC-GAL-019: is unavailable to an unauthenticated user", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="add-resource-trigger"]').length).to.eq(0);
    });
  });

  it("TC-GAL-020: open Gallery closes when the login session ends", () => {
    cy.loginWithValidPin();
    cy.wait(1500);
    GalleryPage.open();
    cy.get('[data-qa-id^="gallery-image-card-"]').should("have.length.greaterThan", 0);
    // Clearing the auth keys alone doesn't do anything -- the app only reacts
    // once a request actually comes back 401, so clicking an image (which
    // fires the whiteboard-save request) right after is the trigger.
    cy.simulateSessionLoss();
    GalleryPage.firstImage().click({ force: true });
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });
});

describe("Gallery - Immediate attachment", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    GalleryPage.open();
  });

  it("TC-GAL-003: attaches a selected image to the Whiteboard canvas", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      cy.wait(2000);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-004: attaches the image immediately after a single click with no extra action", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.imageAt(1).click({ force: true });
      cy.wait(1500);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-005: does not open a preview before attaching the image", () => {
    GalleryPage.imageAt(2).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("not.exist");
    cy.get('[data-qa-id^="gallery-image-card-"]').should("have.length.greaterThan", 0);
  });

  it("TC-GAL-006: does not require confirmation before attachment", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.imageAt(3).click({ force: true });
      cy.wait(1500);
      cy.contains("Add to playlist", { matchCase: false }).should("not.exist");
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-007: draws the selected image directly onto the Whiteboard canvas", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="wb-drawing-container"] svg image, [data-qa-id="wb-drawing-container"] svg g').should("have.length.greaterThan", 0);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-015: shows no Add to Playlist confirmation for the selected image", () => {
    GalleryPage.imageAt(4).click({ force: true });
    cy.wait(1000);
    cy.contains("Add to playlist", { matchCase: false }).should("not.exist");
  });

  it("TC-GAL-016: shows no intermediate preview-confirmation step", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-021: requires no manual asset-creation step (no title/file/submit form)", () => {
    GalleryPage.firstImage().click({ force: true });
    cy.wait(1000);
    cy.get('input[formcontrolname="title"]').should("not.exist");
    cy.get(".add-custom-asset").should("not.exist");
  });
});

describe("Gallery - Multiple insertions and regression", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    GalleryPage.open();
  });

  it("TC-GAL-009: allows multiple images to be added sequentially", () => {
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.imageAt(0).click({ force: true });
      cy.wait(1500);
      GalleryPage.imageAt(1).click({ force: true });
      cy.wait(1500);
      GalleryPage.imageAt(2).click({ force: true });
      cy.wait(1500);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
  });

  it("TC-GAL-010: does not replace the first image when a second is selected", () => {
    GalleryPage.imageAt(0).click({ force: true });
    cy.wait(1500);
    GalleryPage.canvasElementCount().then((afterFirst) => {
      GalleryPage.imageAt(1).click({ force: true });
      cy.wait(1500);
      GalleryPage.canvasElementCount().should("be.greaterThan", afterFirst);
    });
  });

  it("TC-GAL-011: does not create an asset record via the asset API", () => {
    cy.intercept("POST", "**/serve/custom/asset").as("createAsset");
    GalleryPage.firstImage().click({ force: true });
    cy.wait(2000);
    cy.get("@createAsset.all").should("have.length", 0);
  });

  it("TC-GAL-017: does not block normal Whiteboard interaction after insertion", () => {
    GalleryPage.firstImage().click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="toolbar-tool-gtSelect"]').click({ force: true });
    cy.get('[data-qa-id="toolbar-tool-gtSelect"]').should("be.visible");
  });

  it("TC-GAL-018: does not remove existing Whiteboard content when a new image is inserted", () => {
    GalleryPage.imageAt(0).click({ force: true });
    cy.wait(1500);
    GalleryPage.canvasElementCount().then((afterFirst) => {
      GalleryPage.imageAt(1).click({ force: true });
      cy.wait(1500);
      GalleryPage.canvasElementCount().should("be.greaterThan", afterFirst);
    });
  });
});

describe("Gallery - Persistence", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-GAL-008: persists the inserted image in Whiteboard data after a reload", () => {
    GalleryPage.open();
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      cy.wait(2500);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
    cy.reload();
    cy.wait(5000);
    GalleryPage.canvasElementCount().should("be.greaterThan", 0);
  });

  it("TC-GAL-013: keeps a previously inserted image available after navigating away and back", () => {
    GalleryPage.open();
    GalleryPage.firstImage().click({ force: true });
    cy.wait(2500);
    GalleryPage.canvasElementCount().then((afterInsert) => {
      cy.reload();
      cy.wait(5000);
      GalleryPage.canvasElementCount().should("be.at.least", afterInsert - 2);
    });
  });

  // The mechanism is a POST fired by WhiteboardService.wbDataSync(). The path
  // was previously unconfirmed, so this asserted the URL merely "mentions
  // whiteboard" -- a guess, and a wrong one: the request always fired
  // correctly but went to /tce-teach-api/1/api/1/serve/wb, which contains no
  // "whiteboard" substring, so the test failed on a correct app behaviour.
  // The real path is now confirmed from the observed request, so assert that
  // instead of a guessed word.
  it("TC-GAL-012: Gallery insertion syncs to Whiteboard persistence via a save request", () => {
    cy.intercept("POST", "**").as("anyPost");
    GalleryPage.open();
    GalleryPage.firstImage().click({ force: true });
    cy.wait("@anyPost", { timeout: 20000 }).its("request.url").should("match", /\/serve\/wb\b/i);
  });
});

describe("Gallery vs Library behavior", () => {
  it("TC-GAL-014: attaches directly with no preview, unlike Library's preview + confirm flow", () => {
    cy.loginWithValidPin();
    cy.wait(1500);
    GalleryPage.open();
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      cy.wait(1500);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
    GalleryPage.close();

    LibraryPage.open();
    LibraryPage.search("Database");
    LibraryPage.firstResultCard().click({ force: true });
    cy.wait(2000);
    // Unlike Gallery's single-click attach, Library requires an explicit
    // Add to playlist confirmation -- the button is shown but the search
    // panel stays open and nothing is attached until it's clicked.
    cy.get('[data-qa-id="tce-library-pdf-add-playlist-btn"]').should("be.visible");
    cy.get('[data-qa-id="tce-library-search-input"]').should("exist");
  });
});
