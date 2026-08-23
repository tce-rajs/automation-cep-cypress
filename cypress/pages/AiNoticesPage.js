// Page Object for AI Notices (capture handwritten/drawn whiteboard content
// via OCR, then compose and send a notice), opened from the Toolbar's Magnet
// submenu.
//
// SOURCE-VERIFIED, DOM-UNCONFIRMED -- see the header comment in CompassPage.js
// for why (no QA login was available when this was written). Needs a real
// run to confirm.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/toolbar/toolbar.component.html (Magnet tool button)
//   projects/main/src/app/modules/toolbar/components/magnet-submenu/magnet-submenu.component.html
//   projects/main/src/app/modules/ai-notices/ai-notices.component.ts (NOTE: .html is empty --
//     everything here is built imperatively as raw SVG, appended to the whiteboard)
//   projects/main/src/app/modules/ai-notices/containers/notice-form-dialog/notice-form-dialog.component.html
//
// IMPORTANT GAPS -- read before extending this file:
//   1. There is NO simpler entry into the compose form than: open AI Notices
//      -> drag a selection rectangle over whiteboard content -> click an
//      approve button. That approve/discard button pair (and the resize
//      handles) are created via `document.createElementNS(...)` with zero
//      data-qa-id/id/stable selector of any kind -- confirmed by reading the
//      full ai-notices.component.ts. There is no reliable way to click them
//      in Cypress without guessing screen coordinates relative to a
//      just-drawn selection, which this project's "verify, don't guess" rule
//      does not allow presenting as confirmed.
//   2. Approving triggers a REAL, synchronous OCR call (POST
//      .../ocr/text-recognition/check_text) before the compose dialog even
//      opens -- there is no way to reach the dialog without it.
//   3. Rephrase / Translate / Grammar are CURRENTLY DEAD CODE: the HTTP calls
//      backing onParaphrasing()/onTranslateSelect()/onGrammar() are commented
//      out in notice-form-dialog.component.ts. Clicking these buttons does
//      nothing observable (translate/grammar even leave their loader stuck
//      true). This is a real app bug/incompleteness, not a test gap -- see
//      the module spec file for how it's recorded.
//   4. The rich-text editor's inner contenteditable div (`.ql-editor`) comes
//      from the third-party ngx-quill library, not this app's own template --
//      inferred from the library's known rendering pattern, not confirmed
//      with a data-qa-id in this repo.

export const AiNoticesPage = {
  magnetToolBtn() {
    return cy.get('[data-qa-id="toolbar-tool-gtMagnet"]');
  },

  openMagnetSubmenu() {
    this.magnetToolBtn().should("be.visible").click({ force: true });
    cy.wait(800);
  },

  aiNoticesSubmenuItem() {
    return cy.get('[data-qa-id="toolbar-magnet-gtAINotices"]');
  },

  open() {
    this.openMagnetSubmenu();
    this.aiNoticesSubmenuItem().should("be.visible").click({ force: true });
    cy.wait(1000);
  },

  // -- Everything below here requires the compose dialog to already be open,
  // which (per the gaps above) cannot currently be reached from a Cypress
  // test. Kept here, wired to real selectors, for the day the approve-button
  // gap is unblocked (e.g. dev team adds a data-qa-id to it).
  titleInput() {
    return cy.get('[data-qa-id="ai-notices-title-input"]');
  },

  editor() {
    return cy.get('[data-qa-id="ai-notices-description-editor"] .ql-editor');
  },

  recaptureBtn() {
    return cy.get('[data-qa-id="ai-notices-recapture-btn"]');
  },

  classCheckbox(i) {
    return cy.get(`[data-qa-id="ai-notices-class-checkbox-${i}"]`);
  },

  closeBtn() {
    return cy.get('[data-qa-id="ai-notices-close-btn"]');
  },

  paraphraseBtn() {
    return cy.get('[data-qa-id="ai-notices-paraphrase-btn"]');
  },

  translateBtn() {
    return cy.get('[data-qa-id="ai-notices-translate-btn"]');
  },

  grammarBtn() {
    return cy.get('[data-qa-id="ai-notices-grammar-btn"]');
  },

  sendBtn() {
    return cy.get('[data-qa-id="ai-notices-send-btn"]');
  },
};
