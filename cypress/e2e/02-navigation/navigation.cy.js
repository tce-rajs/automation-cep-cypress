// Navigation module automation, based on Test_Cases/MOD-002_Navigation_Test_Cases.xlsx
// All tests log in first (via cy.loginWithValidPin) since navigation only
// makes sense for an authenticated user.

const GRADE_1 = "Class 8";
const DIVISION = "A";
const SUBJECT_1 = "Science";
const GRADE_2 = "Class 4";
const SUBJECT_2 = "Mathematics";

import { PlaylistPage } from "../../pages/PlaylistPage";

describe("Navigation - Dashboard and Current Class", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
  });

  it("TC-NAV-001: shows the last-used class on the Dashboard after login", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("be.visible");
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible");
  });

  it("TC-NAV-002: opens the Class Popup when Current Class is clicked", () => {
    PlaylistPage.openClassPopup();
    cy.contains(".mdc-tab__text-label", "Recent Classes").should("be.visible");
    cy.contains(".mdc-tab__text-label", "All My Classes").should("be.visible");
  });

  it("TC-NAV-003: selects the Recent Classes tab by default", () => {
    PlaylistPage.openClassPopup();
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-004: lists the recent classes in the Recent Classes tab", () => {
    PlaylistPage.openClassPopup();
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').should("have.length.greaterThan", 0);
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').first().should("be.visible");
  });

  it("TC-NAV-005: selects a class from Recent Classes", () => {
    PlaylistPage.openClassPopup();
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).invoke("text").then((className) => {
      const normalized = className.trim();
      cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").should((currentText) => {
        // "Class 4 | A | Mathematics" style text becomes "Class 4A | Mathematics" style label
        const gradeWord = normalized.split("|")[0].trim();
        expect(currentText).to.contain(gradeWord.replace("Class ", ""));
      });
    });
  });
});

describe("Navigation - All My Classes (Grade / Division / Subject)", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    PlaylistPage.openClassPopup();
    PlaylistPage.openAllMyClassesTab();
  });

  it("TC-NAV-006: switches to the All My Classes tab", () => {
    cy.get('[data-qa-id="common-select-grade-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-007: shows the available Grades", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).should("be.visible");
  });

  it("TC-NAV-008: selects a Grade", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-division-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-009: refreshes the Division list when the Grade changes", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-division-btn"]').should("have.length.greaterThan", 0);

    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_2).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-division-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-010: selects a Division", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-subject-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-011: refreshes the Subject list based on Grade and Division", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', SUBJECT_1).should("be.visible");
  });

  it("TC-NAV-012: selects a Subject", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', SUBJECT_1).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("contain.text", SUBJECT_1);
  });

  it("TC-NAV-013: updates the Current Class after a full Grade -> Division -> Subject selection", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', SUBJECT_1).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]')
      .should("contain.text", "8")
      .and("contain.text", SUBJECT_1);
  });

  it("TC-NAV-014: resets Division/Subject selection when the Grade changes", () => {
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', SUBJECT_1).click({ force: true });
    cy.wait(1000);

    PlaylistPage.openClassPopup();
    PlaylistPage.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_2).click({ force: true });
    cy.wait(1000);
    cy.get('[data-qa-id="common-select-division-btn"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-015: switches between Recent Classes and All My Classes tabs", () => {
    cy.get('[data-qa-id="common-select-grade-btn"]').should("be.visible");
    cy.contains(".mdc-tab__text-label", "Recent Classes").click({ force: true });
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').should("have.length.greaterThan", 0);
  });
});

describe("Navigation - Chapters and Topics", () => {
  // Locked onto the configured target class (cypress/config/targetClass.js)
  // instead of whatever class the account happened to leave active last, so
  // these results are reproducible for whichever class/chapter/topic is
  // currently assigned for testing.
  beforeEach(() => {
    cy.loginWithValidPin();
    PlaylistPage.goToTargetClass();
  });

  it("TC-NAV-016: shows the Current Chapter on the Dashboard", () => {
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
  });

  it("TC-NAV-017: opens the Chapters popup when Current Chapter is clicked", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]').should("have.length.greaterThan", 0);
    cy.get('[data-qa-id="playlist-select-topic"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-018: highlights the currently selected Chapter", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"].active').should("have.length", 1);
  });

  // Note: clicking a Chapter row immediately jumps to that chapter's default
  // topic and closes the whole popup, so it must be reopened to inspect
  // Chapter/Topic list state afterwards. Clicking a Topic row updates the
  // content but keeps the popup open.

  it("TC-NAV-019: shows Topics that correspond to the selected Chapter", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-020: selects a Chapter", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().invoke("text").then((chapterText) => {
      const chapterName = chapterText.trim();
      cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
      cy.wait(2000);
      PlaylistPage.openChaptersPopup();
      cy.get('[data-qa-id="playlist-select-chapter"].active').should("contain.text", chapterName);
    });
  });

  it("TC-NAV-021: selects a Topic", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible");
  });

  it("TC-NAV-022: refreshes the playlist when a different Topic is selected", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().find("[matlistitemtitle]").invoke("text").then((topicText) => {
      const topicName = topicText.trim();
      cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("contain.text", topicName);
    });
  });

  it("TC-NAV-023: updates the Topic list when the Chapter changes", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]').should("have.length.greaterThan", 0);
  });

  it("TC-NAV-024: updates Current Chapter/Topic info after a selection", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("not.be.empty");
  });
});

describe("Navigation - Switching classes end to end", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
  });

  it("TC-NAV-025: switching to a different class updates Current Class", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").then((before) => {
      PlaylistPage.openClassPopup();
      cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(2).click({ force: true });
      cy.wait(2000);
      cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").should("not.equal", before.trim());
    });
  });

  it("TC-NAV-026: switching class refreshes the Chapter/Topic content", () => {
    PlaylistPage.openClassPopup();
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(2).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
  });

  it("TC-NAV-027: selecting a recent class updates the active class and its content", () => {
    PlaylistPage.openClassPopup();
    cy.get('[data-qa-id="playlist-recently-selected-class-btn"]').eq(1).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("be.visible");
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
  });

  it("TC-NAV-028: completes the full All My Classes navigation flow", () => {
    PlaylistPage.openClassPopup();
    PlaylistPage.openAllMyClassesTab();
    cy.contains('[data-qa-id="common-select-grade-btn"]', GRADE_1).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-division-btn"]', DIVISION).click({ force: true });
    cy.wait(1000);
    cy.contains('[data-qa-id="common-select-subject-btn"]', SUBJECT_1).click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').should("contain.text", SUBJECT_1);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
  });

  it("TC-NAV-029: completes the full Chapter -> Topic navigation flow", () => {
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-chapter"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    PlaylistPage.openChaptersPopup();
    cy.get('[data-qa-id="playlist-select-topic"]').should("have.length.greaterThan", 0);
    cy.get('[data-qa-id="playlist-select-topic"]:not(.active)').first().click({ force: true });
    cy.wait(2000);
    cy.get('[data-qa-id="playlist-chapter-topic-btn"]').should("be.visible").and("not.be.empty");
  });
});
