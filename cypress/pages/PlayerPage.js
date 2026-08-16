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
};
