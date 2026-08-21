// Page Object for the shared resource-player viewer (the wrapper that opens
// for Video/PDF/Quiz/TCE/Code Editor/Unsupported resources). Used by
// player.cy.js.

export const PlayerPage = {
  // The close ("X") control varies by player type, all confirmed via direct
  // DOM exploration: Unsupported-file and Code Editor both use
  // img[alt="close-btn"] (with different underlying image files); the
  // TCE/Video-rendered player uses the same closeIcon.png image but with no
  // alt attribute; the PDF/Worksheet player uses a completely different
  // control (a real <button title="close" class="closeIcon btn">).
  closeIconSelector() {
    return 'img[alt="close-btn"], img[src*="closeIcon.png"], button.closeIcon';
  },

  closeIfOpen() {
    for (let i = 0; i < 4; i++) {
      cy.get("body").then(($body) => {
        const $visible = $body.find(this.closeIconSelector()).filter(":visible");
        if ($visible.length > 0) {
          cy.wrap($visible.first()).click({ force: true });
          cy.wait(500);
        }
      });
    }
  },

  // Shared by the per-type player specs (video.cy.js, pdf-worksheet.cy.js,
  // ...). Each spec covers ONE player type, but "does it open" and "does
  // closing restore the board" are asked identically by every type's test
  // cases, so the mechanics live here and the specs keep only the parts that
  // are specific to their own player.
  openFirstResourceCard() {
    cy.get('[data-qa-id="playlist-resource-card"]').first().click({ force: true });
  },

  shouldBeOpen(timeout = 15000) {
    cy.get(this.closeIconSelector(), { timeout }).should("be.visible");
  },

  close() {
    cy.get(this.closeIconSelector()).first().click({ force: true });
    cy.wait(1000);
  },

  shouldBeClosed() {
    cy.get(this.closeIconSelector()).should("not.exist");
  },

  // Whiteboard pan/zoom, used by every type's "closing restores prior
  // pan/zoom" case. NOTE: this reads the CONTAINER's CSS transform, which is
  // what the players manipulate. The Whiteboard's OWN drawing pan/zoom lives
  // on <g id="panGroup"> instead (see toolbar-additional.cy.js) -- different
  // mechanism, do not confuse the two.
  whiteboardTransform() {
    return cy.get('[data-qa-id="wb-drawing-container"]').then(($el) => getComputedStyle($el[0]).transform);
  },
};
