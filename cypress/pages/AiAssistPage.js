// Page Object for the AI Assist panel (Video/Exercise suggestions). Used by
// ai-assist.cy.js.

import { PlaylistPage } from "./PlaylistPage";

export const AiAssistPage = {
  // AI-Assist generates its Video/Exercise suggestions asynchronously after the
  // panel opens.
  //
  // This used to end in a blind `cy.wait(20000)`. That was both slower and less
  // reliable than it looks: every test that opens the panel paid the full 20s
  // even when content arrived in two, and on a slow run 20s still might not be
  // enough -- a fixed wait cannot be right in both cases. With ~20 opens across
  // this spec that was ~7 minutes of dead waiting per run.
  //
  // Waiting for the CONTENT instead is faster in the common case and more
  // tolerant in the slow one. The generous timeout is the ceiling, not the cost.
  open() {
    // The FAB sits inside the Playlist drawer's wrapper, so a hidden drawer
    // makes this click a no-op against an opacity-0 element.
    PlaylistPage.ensureDrawerVisible();
    // No { force: true }: the drawer is restored above, so if the FAB still
    // isn't clickable we want Cypress to say so plainly rather than fire a
    // click into a hidden element and fail later somewhere confusing.
    cy.get('[data-qa-id="add-resource-trigger"]', { timeout: 20000 }).should("be.visible").click();
    cy.wait(800);
    cy.get('[data-qa-id="add-resource-action-ai-assist"]').click({ force: true });

    // The panel frame appears first; the suggestions land afterwards. Wait for
    // the suggestions themselves -- either tab's content proves generation
    // finished.
    cy.contains("AI Assist", { timeout: 30000 }).should("be.visible");
    cy.get('[data-qa-id^="ai-assist-video-thumb-"], [data-qa-id^="ai-assist-exercise-checkbox-"]', {
      timeout: 45000,
    }).should("have.length.greaterThan", 0);
  },

  selectExerciseCheckbox(index) {
    cy.get(`[data-qa-id="ai-assist-exercise-checkbox-${index}"]`).find('input[type="checkbox"]').click({ force: true });
  },

  // Playlist cards currently attached. Used to assert that an add actually
  // added -- see the note in ai-assist.cy.js about why `greaterThan(0)` was
  // not a real assertion.
  playlistAssetCount() {
    return cy.get("body").then(($body) => $body.find('[data-qa-id="playlist-asset-card"]').length);
  },

  playlistCardCount() {
    return cy
      .get("body")
      .then(
        ($body) =>
          $body.find('[data-qa-id="playlist-asset-card"], [data-qa-id="playlist-resource-card"], [data-qa-id="playlist-quiz-card"]').length
      );
  },
};
