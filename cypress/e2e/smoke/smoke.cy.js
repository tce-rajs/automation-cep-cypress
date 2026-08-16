// Smoke / demo suite -- NOT based on a Test_Cases Excel file. This is a
// quick end-to-end walk through the main happy path of every module in one
// continuous session, meant for fast sanity checks or live demos instead of
// running the full regression suite (login, navigation, add-resource,
// create, ai-assist, gallery, library, playlist, player).
//
// Run just this file with:
//   npx cypress run --spec cypress/e2e/smoke.cy.js
//   npx cypress open   (then pick smoke.cy.js for a visual walkthrough)

import { AddResourcePage } from "../../pages/AddResourcePage";
import { AiAssistPage } from "../../pages/AiAssistPage";
import { GalleryPage } from "../../pages/GalleryPage";
import { LibraryPage } from "../../pages/LibraryPage";

describe("Smoke - Core flow across every module", () => {
  it("logs in, navigates, and adds a resource through every Add Resource path", () => {
    // 1. Login
    cy.loginWithValidPin();
    cy.contains("Choose a resource to get started").should("be.visible");

    // 2. Navigation - switch class, then pick a chapter/topic
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);

    // 3. Add Resource - Create: fill the form and submit a real file
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Smoke Demo Asset ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`smoke-demo-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");

    // 4. AI-Assist: select an Exercise question and add it to the playlist
    AiAssistPage.open();
    cy.contains(".mdc-tab__text-label", "Exercise").click({ force: true });
    AiAssistPage.selectExerciseCheckbox(0);
    cy.get('[data-qa-id="ai-assist-add-playlist-btn"]').click({ force: true });
    cy.wait(3000);

    // 5. Gallery: attach an image straight to the Whiteboard canvas
    GalleryPage.open();
    GalleryPage.canvasElementCount().then((before) => {
      GalleryPage.firstImage().click({ force: true });
      cy.wait(2000);
      GalleryPage.canvasElementCount().should("be.greaterThan", before);
    });
    GalleryPage.close();

    // 6. Library: search, preview, and attach an existing resource
    LibraryPage.open();
    LibraryPage.search("Database");
    LibraryPage.resultCardAt(3).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="tce-library-pdf-add-playlist-btn"]').click({ force: true });
    cy.wait(2500);

    // 7. Sign out to close the demo cleanly
    cy.get('[data-qa-id="toolbar-profile-trigger"], [data-qa-id="toolbar-user-avatar"]').first().click({ force: true });
    cy.get('[data-qa-id="toolbar-profile-signout-btn"]').click({ force: true });
    cy.contains("button", "Sign Out", { timeout: 10000 }).click({ force: true });
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });
});
