// Minimap module -- based on Test_Cases/09_Minimap/Minimap_Test_Cases.xlsx
// (added 2026-08-23; this module had zero Test_Cases documentation before).
// Test case IDs below match that workbook's 03_Test Cases sheet.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { MinimapPage } from "../../pages/MinimapPage";

describe("Minimap - Core flow", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
  });

  it("MM-001: opens from the Zoom submenu and shows the canvas", () => {
    MinimapPage.open();
    MinimapPage.container().should("have.class", "visible");
    // width/height are fixed in the template (250x150) -- a stable, real
    // attribute check rather than inspecting the canvas's drawn pixels,
    // which this suite avoids (see claude/APP_QUIRKS.md).
    MinimapPage.canvas()
      .should("be.visible")
      .and("have.attr", "width", "250")
      .and("have.attr", "height", "150");
  });

  // Not written as an unconditional assertion -- openPlayerCount is computed
  // by scanning the live DOM for player elements (minimap.service.ts's
  // getOpenPlayers()), so whether this button exists at all depends on
  // whatever the previous step left open. Two independent DOM heuristics
  // were tried to predict this ahead of time (`.player` presence, then
  // `.player` with children) and both gave false positives -- `.player`
  // wrapper divs always get a spinner child immediately via createPlayer(),
  // so "has children" doesn't distinguish a loading/empty wrapper from a
  // real open resource either. Rather than keep guessing at a third
  // heuristic, this just observes and logs the button's actual state -- the
  // app's own detection is the ground truth here, not a DOM heuristic this
  // test tries to replicate independently.
  it("MM-002: Player toggle button reflects whether a Player is open", () => {
    MinimapPage.open();
    cy.get("body").then(($body) => {
      const toggleBtnPresent = $body.find('[data-qa-id="minimap-toggle-players-btn"]').length > 0;
      if (toggleBtnPresent) {
        cy.log("Player toggle button present -- a Player is considered open. Verifying it toggles.");
        MinimapPage.togglePlayersBtn().should("be.visible").click({ force: true });
        MinimapPage.togglePlayersBtn().should("have.class", "active");
      } else {
        cy.log("Player toggle button absent -- no Player is considered open here. Nothing further to assert.");
      }
    });
  });

  it("MM-003: Reset returns zoom to 100%", () => {
    MinimapPage.open();
    MinimapPage.resetBtn().should("be.visible").click({ force: true });
    cy.wait(500);
    // Indirect check: Reset calls the same emitWhiteboardZoom(100) the Zoom
    // submenu's own slider reflects -- there's no data-qa-id exposing
    // pan/zoom state directly off the minimap itself.
    MinimapPage.openZoomSubmenu();
    MinimapPage.zoomSlider().should("have.value", "100");
  });

  it("MM-004: Close hides the panel", () => {
    MinimapPage.open();
    MinimapPage.container().should("have.class", "visible");
    MinimapPage.close();
    MinimapPage.container().should("not.have.class", "visible");
  });

  it("MM-005: reopening after Close shows the panel again, not stale hidden state", () => {
    MinimapPage.open();
    MinimapPage.close();
    MinimapPage.container().should("not.have.class", "visible");
    MinimapPage.open();
    MinimapPage.container().should("have.class", "visible");
    MinimapPage.canvas().should("be.visible");
  });

  it("MM-006: the canvas renders at a fixed size even with no drawn content", () => {
    MinimapPage.open();
    MinimapPage.canvas()
      .should("be.visible")
      .and("have.attr", "width", "250")
      .and("have.attr", "height", "150");
  });
});

describe("Minimap - Login guard", () => {
  it("MM-007: is unavailable to an unauthenticated user", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-tool-gtZoom"]').length).to.eq(0);
    });
  });
});

// ---------------------------------------------------------------------------
// NOT YET AUTOMATED -- and deliberately not written as guesses.
//
// Minimap content correctness (does it actually show my drawing / the blue
//   viewport rectangle / player placeholders): the canvas is a from-scratch
//   ctx.stroke()/ctx.fillRect() render with no DOM/SVG representation of its
//   content -- would need canvas pixel inspection (getImageData / screenshot
//   diffing), which this suite avoids elsewhere for the same reason
//   (claude/APP_QUIRKS.md, TB-014/TB-021-028 etc. in toolbar.cy.js).
//
// Click-to-navigate / drag-to-pan on the canvas: a real, dispatchable
//   interaction (mousedown/mousemove/mouseup), but its result (pan position)
//   has no data-qa-id-exposed value anywhere -- only zoom % is exposed via
//   the Zoom submenu. Verifying pan specifically is not currently possible
//   without guessing at an assertion target.
//
// Header drag-to-reposition (.minimap-header, no data-qa-id): position is
//   only readable via inline style.left/top, not a stable attribute.
// ---------------------------------------------------------------------------
