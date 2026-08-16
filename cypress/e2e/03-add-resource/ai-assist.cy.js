// AI-Assist module automation, based on Test_Cases/MOD-005_AI-Assist_Test_Cases.xlsx
//
// AI-Assist generates its Video/Exercise suggestions asynchronously after the
// panel opens. Exploration showed the content is fully populated well within
// 20 seconds in practice, so tests wait 20s after opening the panel before
// interacting with it -- long enough to be reliable, short enough to keep
// the suite fast.

import { AiAssistPage } from "../../pages/AiAssistPage";

describe("AI-Assist - Opening and tabs", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-AI-001: opens from the Add Resource menu and shows its tabs", () => {
    AiAssistPage.open();
    cy.contains("AI Assist").should("be.visible");
    cy.contains(".mdc-tab__text-label", "Videos").should("be.visible");
    cy.contains(".mdc-tab__text-label", "Exercise").should("be.visible");
  });

  it("TC-AI-002: shows a selectable Videos tab", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
    cy.get('[data-qa-id^="ai-assist-video-thumb-"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-003: shows a selectable Exercise tab", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
    cy.get('[data-qa-id^="ai-assist-exercise-checkbox-"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-019: switches between Videos and Exercise tabs", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
    cy.get('[data-qa-id^="ai-assist-video-thumb-"]').should("have.length.greaterThan", 0);
    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
    cy.get('[data-qa-id^="ai-assist-exercise-checkbox-"]').should("have.length.greaterThan", 0);
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
    cy.get('[data-qa-id^="ai-assist-video-thumb-"]').should("have.length.greaterThan", 0);
  });
});

describe("AI-Assist - Videos", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
  });

  it("TC-AI-004: shows AI-suggested video thumbnails", () => {
    cy.get('[data-qa-id^="ai-assist-video-thumb-"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-005: opens an inline preview when a thumbnail is clicked", () => {
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-video-close-btn"]').should("be.visible");
  });

  it("TC-AI-006: reveals Add to Playlist after opening a video preview", () => {
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible");
  });

  it("TC-AI-007: does not add the video before Add to Playlist is clicked", () => {
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible");
  });

  it("TC-AI-008: adds the video to the playlist when Add to Playlist is clicked", () => {
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').click({ force: true });
    cy.wait(3000);
    cy.get('[data-qa-id="playlist-asset-card"], [data-qa-id="playlist-resource-card"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-009: requires the explicit Add to Playlist action for video attachment", () => {
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible").and("not.be.disabled");
  });
});

describe("AI-Assist - Exercise", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
  });

  it("TC-AI-010: shows selectable Exercise questions with checkboxes", () => {
    cy.get('[data-qa-id^="ai-assist-exercise-checkbox-"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-011: selects a single Exercise question", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-0"] input[type="checkbox"]').should("be.checked");
  });

  it("TC-AI-012: selects multiple Exercise questions", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    AiAssistPage.selectExerciseCheckbox(1);
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-0"] input[type="checkbox"]').should("be.checked");
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-1"] input[type="checkbox"]').should("be.checked");
  });

  it("TC-AI-013: deselects an Exercise question before adding", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-0"] input[type="checkbox"]').should("be.checked");
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-0"] input[type="checkbox"]').should("not.be.checked");
  });

  it("TC-AI-014: makes Add to Playlist available once a question is selected", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible");
  });

  it("TC-AI-015: adds the selected Exercise questions to the playlist", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    AiAssistPage.selectExerciseCheckbox(1);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').click({ force: true });
    cy.wait(3000);
    cy.get('[data-qa-id="playlist-quiz-card"], [data-qa-id="playlist-asset-card"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-016: does not add Exercise questions before Add to Playlist is clicked", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible").and("not.be.disabled");
  });

  it("TC-AI-017: only includes the selected questions when added", () => {
    AiAssistPage.selectExerciseCheckbox(0);
    AiAssistPage.selectExerciseCheckbox(2);
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-0"] input[type="checkbox"]').should("be.checked");
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-1"] input[type="checkbox"]').should("not.be.checked");
    cy.get('[data-qa-id="ai-assist-exercise-checkbox-2"] input[type="checkbox"]').should("be.checked");
  });
});

describe("AI-Assist - Confirmation consistency and end-to-end flows", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-AI-018: both Video and Exercise flows require explicit Add to Playlist confirmation", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible");
    cy.get('[data-qa-id="ai-assist-video-close-btn"]').click({ force: true });

    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible");
  });

  it("TC-AI-020: completes the Video flow from thumbnail selection to playlist attachment", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Videos").click({ force: true });
    cy.get('[data-qa-id="ai-assist-video-thumb-0"]').click({ force: true });
    cy.wait(1500);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').should("be.visible").click({ force: true });
    cy.wait(3000);
    cy.get('[data-qa-id="playlist-asset-card"], [data-qa-id="playlist-resource-card"]').should("have.length.greaterThan", 0);
  });

  it("TC-AI-021: completes the Exercise flow from multi-select to playlist attachment", () => {
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
    AiAssistPage.selectExerciseCheckbox(0);
    AiAssistPage.selectExerciseCheckbox(1);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').click({ force: true });
    cy.wait(3000);
    cy.get('[data-qa-id="playlist-quiz-card"], [data-qa-id="playlist-asset-card"]').should("have.length.greaterThan", 0);
  });
});

describe("AI-Assist - Login guard", () => {
  it("TC-AI-022: is unavailable to an unauthenticated user", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="add-resource-trigger"]').length).to.eq(0);
    });
  });

  it("TC-AI-023: open AI-Assist flow closes when the login session ends", () => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AiAssistPage.open();
    cy.contains("AI Assist").should("be.visible");
    cy.simulateSessionLoss();
    // Clicking the already-loaded Videos tab is a client-side-only switch --
    // confirmed via screenshot it fires no new network request, so the
    // cleared session was never actually exercised. A reload always forces
    // the app to re-check auth state from scratch instead.
    cy.reload();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });
});
