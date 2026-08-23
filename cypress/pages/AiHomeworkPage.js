// Page Object for AI Homework (AI-generated worksheet/homework builder ->
// assignment form), opened from the Toolbar's Magnet submenu.
//
// SOURCE-VERIFIED, DOM-UNCONFIRMED -- see the header comment in CompassPage.js
// for why (no QA login was available when this was written). Needs a real
// run to confirm.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/toolbar/toolbar.component.html (Magnet tool button)
//   projects/main/src/app/modules/toolbar/components/magnet-submenu/magnet-submenu.component.html
//   projects/main/src/app/modules/ai-homework/containers/select-worksheet-option/select-worksheet-option.component.html
//   projects/main/src/app/modules/ai-homework/containers/select-topics/select-topics.component.html
//   projects/main/src/app/modules/ai-homework/containers/worksheet-builder/worksheet-builder.component.html
//   projects/main/src/app/modules/ai-homework/containers/assign-homework/assign-homework.component.html
//
// IMPORTANT GAPS -- read before extending this file:
//   * Two sibling components exist with real data-qa-ids (select-worksheet,
//     preview-pdf) but are confirmed DEAD CODE -- not referenced anywhere in
//     the actual render tree (AiHomeworkComponent only ever renders
//     select-worksheet-option and assign-homework). Do not build tests
//     against `ai-homework-select-*` or `ai-homework-preview-*` selectors.
//   * "Question Builder swipe controls" are plain (click) arrow-icon buttons
//     (swipe-left/-right), NOT a real swipe gesture -- there is also a
//     genuine two-finger touch gesture handler for the same action, but this
//     suite uses the click buttons, per the same policy that skips CDK-drag
//     and long-press simulation elsewhere (see claude/APP_QUIRKS.md).
//   * `isLowerGrade` (grade-dependent) swaps the ENTIRE builder for
//     `app-lower-grade`, which has ZERO data-qa-id/data-testid/data-cy
//     attributes anywhere in its template or its 7 child templates
//     (letter-counting, object-collection, scene-counting, etc). A target
//     class/subject that resolves to a lower grade makes everything past
//     "Generate" unautomatable with real selectors. Confirm the target class
//     in cypress/config/targetClass.js is NOT a lower grade before trusting
//     the builder-flow methods below.
//   * Generate/Regenerate calls a real AI/RAG backend (POST /rag/worksheet or
//     /rag/visual-worksheet) -- expect this to be the slowest step; give it
//     a generous explicit wait/timeout rather than the short waits used
//     elsewhere in this suite.

export const AiHomeworkPage = {
  magnetToolBtn() {
    return cy.get('[data-qa-id="toolbar-tool-gtMagnet"]');
  },

  openMagnetSubmenu() {
    this.magnetToolBtn().should("be.visible").click({ force: true });
    cy.wait(800);
  },

  aiHomeworkSubmenuItem() {
    return cy.get('[data-qa-id="toolbar-magnet-gtAIWorksheet"]');
  },

  open() {
    this.openMagnetSubmenu();
    this.aiHomeworkSubmenuItem().should("be.visible").click({ force: true });
    cy.wait(1500);
  },

  // -- select-worksheet-option --
  selectChapterBtn() {
    return cy.get('[data-qa-id="ai-homework-option-select-chapter-btn"]');
  },

  homeworkTypeCard() {
    return cy.get('[data-qa-id="ai-homework-option-homework-select"]');
  },

  reviseTypeCard() {
    return cy.get('[data-qa-id="ai-homework-option-revise-select"]');
  },

  worksheetTypeCard() {
    return cy.get('[data-qa-id="ai-homework-option-worksheet-select"]');
  },

  homeworkObjectivePlus() {
    return cy.get('[data-qa-id="ai-homework-option-homework-objective-plus"]');
  },

  generateBtn() {
    return cy.get('[data-qa-id="ai-homework-option-generate-btn"]');
  },

  regenerateBtn() {
    return cy.get('[data-qa-id="ai-homework-option-regenerate-btn"]');
  },

  discardBtn() {
    return cy.get('[data-qa-id="ai-homework-option-discard-btn"]');
  },

  nextBtn() {
    return cy.get('[data-qa-id="ai-homework-option-next-btn"]');
  },

  // -- select-topics (side panel) --
  gradeSelect() {
    return cy.get('[data-qa-id="ai-homework-topics-grade-select"]');
  },

  subjectSelect() {
    return cy.get('[data-qa-id="ai-homework-topics-subject-select"]');
  },

  chapterRow(i) {
    return cy.get(`[data-qa-id="ai-homework-topics-chapter-${i}"]`);
  },

  topicsUpdateBtn() {
    return cy.get('[data-qa-id="ai-homework-topics-update-btn"]');
  },

  topicsCloseBtn() {
    return cy.get('[data-qa-id="ai-homework-topics-close-btn"]');
  },

  // -- worksheet-builder (higher grades only -- see isLowerGrade caveat above) --
  scqQuestion(i) {
    return cy.get(`[data-qa-id="ai-homework-builder-scq-question-${i}"]`);
  },

  scqSwipeRight(i) {
    return cy.get(`[data-qa-id="ai-homework-builder-scq-swipe-right-${i}"]`);
  },

  anyBuilderQuestions() {
    return cy.get(
      '[data-qa-id^="ai-homework-builder-scq-question-"], [data-qa-id^="ai-homework-builder-mcq-question-"], [data-qa-id^="ai-homework-builder-subjective-question-"]'
    );
  },

  // -- assign-homework --
  assignTitleInput() {
    return cy.get('[data-qa-id="ai-homework-assign-title-input"]');
  },

  assignClassCheckbox(i) {
    return cy.get(`[data-qa-id="ai-homework-assign-class-checkbox-${i}"]`);
  },

  assignDueRadio(i) {
    return cy.get(`[data-qa-id="ai-homework-assign-due-radio-${i}"]`);
  },

  assignPreviousBtn() {
    return cy.get('[data-qa-id="ai-homework-assign-previous-btn"]');
  },

  assignDiscardBtn() {
    return cy.get('[data-qa-id="ai-homework-assign-discard-btn"]');
  },

  assignSendBtn() {
    return cy.get('[data-qa-id="ai-homework-assign-send-btn"]');
  },
};
