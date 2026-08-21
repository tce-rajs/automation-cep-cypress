// Unsupported File Player -- Test_Cases/05_Player/Unsupported_Player_Test_Cases.xlsx
// TC-UNS-001 to TC-UNS-014. This spec validates the UNSUPPORTED player only.
//
// CONFIRMED, and worth stating because it looks like a defect: the .txt
// upload preview is EXPECTED behaviour. `.txt` is a valid upload type but has
// no dedicated previewer, so opening it correctly shows the "UNSUPPORTED
// FILE" fallback with a Download button. AddResourcePage.createThrowawayAsset()
// relies on exactly that, which is what makes this player testable at all --
// no unsupported resource ships in the curriculum, so each test creates one.
//
// CONFIRMED download mechanics: downloadFile() fires an interceptable HTTP GET
// (fetching the file as a blob) BEFORE it triggers the browser save. That GET
// is what the download tests assert on -- detecting a real file save from
// headless Cypress is not reliable.

import { AddResourcePage } from "../../pages/AddResourcePage";
import { PlayerPage } from "../../pages/PlayerPage";

describe("Unsupported Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
  });

  // A newly created asset does not reliably auto-open its own preview, so
  // each test clicks it explicitly by title.
  const openThrowaway = (label) => {
    const title = `${label} ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    cy.contains('[data-qa-id="playlist-asset-card"]', title).click({ force: true });
    cy.wait(1500);
    return cy.wrap(title);
  };

  it("TC-UNS-001, 002: an unsupported resource opens the player with its fallback message", () => {
    openThrowaway("Unsupported Player Test");
    cy.contains("UNSUPPORTED FILE").should("be.visible");
  });

  it("TC-UNS-003: a Download button is displayed", () => {
    openThrowaway("Unsupported Download Test");
    cy.contains("button", "Download").should("be.visible");
  });

  it("TC-UNS-004: Download initiates a file download", () => {
    openThrowaway("Unsupported Download Trigger Test");
    cy.intercept("GET", "**/fileservice/**").as("downloadFile");
    cy.contains("button", "Download").click({ force: true });
    cy.wait("@downloadFile", { timeout: 10000 });
  });

  it("TC-UNS-005: closing Unsupported Player removes the wrapper", () => {
    openThrowaway("Unsupported Close Test");
    cy.get(PlayerPage.closeIconSelector()).first().click({ force: true });
    cy.wait(1000);
    cy.contains("UNSUPPORTED FILE").should("not.exist");
  });

  it("TC-UNS-006: closing Unsupported restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      openThrowaway("Unsupported PanZoom Test");
      cy.contains("UNSUPPORTED FILE").should("be.visible");
      cy.get(PlayerPage.closeIconSelector()).first().click({ force: true });
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  it("TC-UNS-009: downloading the same unsupported file twice works", () => {
    openThrowaway("Unsupported Double Download Test");
    cy.intercept("GET", "**/fileservice/**").as("downloadFile");
    cy.contains("button", "Download").click({ force: true });
    cy.wait("@downloadFile", { timeout: 10000 });
    cy.wait(1000);
    // The second download must fire its own request -- a one-shot handler
    // would silently do nothing here.
    cy.contains("button", "Download").click({ force: true });
    cy.wait("@downloadFile", { timeout: 10000 });
  });

  it("TC-UNS-011: the Download button stays reachable at a smaller viewport", () => {
    // The Excel asks about zoom levels; viewport size is the equivalent this
    // suite can control deterministically. The point of the case -- the
    // control does not get clipped away -- still holds.
    cy.viewport(1024, 768);
    openThrowaway("Unsupported Viewport Test");
    cy.contains("button", "Download")
      .should("be.visible")
      .then(($btn) => {
        const box = $btn[0].getBoundingClientRect();
        expect(box.right, "Download button within viewport width").to.be.lessThan(1025);
        expect(box.bottom, "Download button within viewport height").to.be.lessThan(769);
      });
  });

  // --- Blocked -------------------------------------------------------------
  // TC-UNS-007/008 need to inspect the SAVED file (its name and contents).
  // The download is intercepted as an HTTP GET before the browser save, and
  // Cypress cannot read what the browser ultimately wrote to disk in this
  // setup, so filename and content cannot be verified.
  it.skip("TC-UNS-007: download preserves the original filename (cannot inspect the browser-saved file)", () => {});
  it.skip("TC-UNS-008: downloaded file contains the original content (cannot inspect the browser-saved file)", () => {});

  it.skip("TC-UNS-010: annotation can be drawn and cleared in the Unsupported Player (needs canvas pixel inspection)", () => {});
  it.skip("TC-UNS-012: the unsupported player is selected only for unsupported mappings (needs the full resource-type -> player mapping, which is not documented)", () => {});
  it.skip("TC-UNS-013: Close All Resources removes the Unsupported Player ('Close All Resources' control not located in the live DOM)", () => {});
  it.skip("TC-UNS-014: Clear Whiteboard removes the Unsupported Player (Clear Whiteboard control not located -- same blocker as TB-127)", () => {});
});
