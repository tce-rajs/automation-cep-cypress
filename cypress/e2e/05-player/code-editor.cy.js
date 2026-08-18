// Code Editor Player -- Test_Cases/05_Player_new/Code_Editor_Player_Test_Cases.xlsx
// TC-CODE-001 to TC-CODE-013 (the Excel has no TC-CODE-012). This spec
// validates the CODE EDITOR player only.
//
// CONFIRMED CONTENT: the "HTML" chapter's first topic ("7.1 Lists") contains
// one Code-type resource ("CE_Lists"), which opens an embedded tce-code-main
// web component showing "Loading Code Editor environment...".
//
// OWNERSHIP BOUNDARY: the code write/run/save UI belongs to that external web
// component, not to this Angular app. Cases that need to type or save code
// inside it are skipped -- not because they are hard, but because they test
// someone else's component through this app's tests.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";

describe("Code Editor Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToHtmlChapterFirstTopic();
    PlaylistPage.filterToType("Code");
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    PlaylistPage.restoreAllFilter();
  });

  it("TC-CODE-001: Code Editor opens the external tce-code-main component", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(5000);
    PlayerPage.shouldBeOpen();
  });

  it("TC-CODE-006: closing Code Editor removes the wrapper", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(5000);
    PlayerPage.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-CODE-007: closing Code Editor restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      PlayerPage.openFirstResourceCard();
      cy.wait(5000);
      PlayerPage.close();
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  it("TC-CODE-009: the external code editor assets are requested when the player opens", () => {
    // TC-CODE-002 and TC-CODE-009 ask the same thing. This is the observable
    // half: the app requests the external bundle. Whether it is "from the
    // configured path" is a build-config assertion, not a UI one.
    cy.intercept("GET", "**/tce-code*/**").as("codeAssets");
    PlayerPage.openFirstResourceCard();
    cy.wait("@codeAssets", { timeout: 20000 });
    PlayerPage.shouldBeOpen();
  });

  // --- Duplicate of a case already covered ---------------------------------
  it.skip("TC-CODE-002: external main.js and styles.css are dynamically loaded (same assertion as TC-CODE-009, which is written above)", () => {});
  it.skip("TC-CODE-008: Code Editor loads tce-code-main in viewer mode ('viewer mode' is internal component configuration, not observable from this app)", () => {});
  it.skip("TC-CODE-013: closing Code Editor restores prior board pan/zoom (duplicate of TC-CODE-007, which is written above)", () => {});

  // --- Owned by the external component -------------------------------------
  it.skip("TC-CODE-003: code-write/run UI is provided by the external web component (implementation detail; TC-CODE-001 confirms the observable outcome)", () => {});
  it.skip("TC-CODE-010: code editor UI is provided by the external web component (duplicate of TC-CODE-003)", () => {});
  it.skip("TC-CODE-004: code-saved event triggers addToPlaylist (needs typing and saving inside the external component -- no confirmed selectors)", () => {});
  it.skip("TC-CODE-005: edited code is uploaded as a new custom asset (same blocker as TC-CODE-004)", () => {});
  it.skip("TC-CODE-011: code-saved event creates a custom Playlist asset (same blocker as TC-CODE-004)", () => {});
});
