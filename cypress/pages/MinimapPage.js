// Page Object for the Minimap (whiteboard bird's-eye-view panel), opened
// from the Toolbar's Zoom submenu.
//
// SOURCE-VERIFIED, DOM-UNCONFIRMED -- see the header comment in CompassPage.js
// for why (no QA login was available when this was written). Needs a real
// run to confirm.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/toolbar/toolbar.component.html (Zoom tool button)
//   projects/main/src/app/modules/toolbar/components/zoom-submenu/zoom-submenu.component.html
//   projects/main/src/app/modules/minimap/minimap.component.html
//   documentation/MINIMAP.md
//
// Confirmed facts from source:
//   * `[data-qa-id="minimap-container"]` is ALWAYS in the DOM (mounted once,
//     sibling to the toolbar in whiteboard.component.html) -- visibility is
//     expressed as a `.visible` class, not presence/absence. Assert on the
//     class, not `.should("exist")`.
//   * The minimap surface itself is a raw `<canvas>` -- its drawn CONTENT
//     (paths, viewport rectangle, player placeholders) cannot be verified
//     without pixel inspection, which this suite avoids elsewhere (see
//     claude/APP_QUIRKS.md). Only the canvas element's existence/size and the
//     header buttons have real selectors.
//   * "Player toggle" (`minimap-toggle-players-btn`) only renders when a
//     Player is already open elsewhere on screen (`openPlayerCount > 0`,
//     computed by scanning the live DOM for player elements) -- it is a
//     cross-module prerequisite, not something Minimap can set up alone.
//   * Reset has no direct data-qa-id-exposed result to assert on directly;
//     the most reliable indirect check is the Zoom submenu's own slider
//     value reading 100 afterward (`toolbar-zoom-slider`), since Reset calls
//     the same `emitWhiteboardZoom(100)` the slider reflects.

export const MinimapPage = {
  zoomToolBtn() {
    return cy.get('[data-qa-id="toolbar-tool-gtZoom"]');
  },

  openZoomSubmenu() {
    this.zoomToolBtn().should("be.visible").click({ force: true });
    cy.wait(800);
  },

  minimapToggleBtn() {
    return cy.get('[data-qa-id="toolbar-zoom-minimap-btn"]');
  },

  open() {
    this.openZoomSubmenu();
    this.minimapToggleBtn().should("be.visible").click({ force: true });
    cy.wait(1000);
  },

  container() {
    return cy.get('[data-qa-id="minimap-container"]');
  },

  canvas() {
    return cy.get('[data-qa-id="minimap-canvas"]');
  },

  togglePlayersBtn() {
    return cy.get('[data-qa-id="minimap-toggle-players-btn"]');
  },

  resetBtn() {
    return cy.get('[data-qa-id="minimap-reset-btn"]');
  },

  closeBtn() {
    return cy.get('[data-qa-id="minimap-close-btn"]');
  },

  close() {
    this.closeBtn().should("be.visible").click({ force: true });
    cy.wait(500);
  },

  zoomSlider() {
    return cy.get('[data-qa-id="toolbar-zoom-slider"]');
  },
};
