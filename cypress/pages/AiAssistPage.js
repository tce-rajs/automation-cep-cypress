// Page Object for the AI Assist panel (Video/Exercise suggestions). Used by
// ai-assist.cy.js.

export const AiAssistPage = {
  // AI-Assist generates its Video/Exercise suggestions asynchronously after
  // the panel opens. Exploration showed the content is fully populated well
  // within 20 seconds in practice, so this waits 20s after opening before
  // interacting with it -- long enough to be reliable, short enough to keep
  // the suite fast.
  open() {
    cy.get('[data-qa-id="add-resource-trigger"]').click({ force: true });
    cy.wait(800);
    cy.get('[data-qa-id="add-resource-action-ai-assist"]').click({ force: true });
    cy.wait(20000);
  },

  selectExerciseCheckbox(index) {
    cy.get(`[data-qa-id="ai-assist-exercise-checkbox-${index}"]`).find('input[type="checkbox"]').click({ force: true });
  },
};
