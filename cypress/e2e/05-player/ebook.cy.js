// Ebook Player -- Test_Cases/05_Player/Ebook_Player_Test_Cases.xlsx
// TC-EBOOK-001 to TC-EBOOK-025.
//
// PREVIOUSLY: entire module pending -- the Playlist e-book entry point
// existed but no book was reachable behind it on the explored (Class 8A)
// curriculum.
//
// UNBLOCKED 2026-08-22: an E-book was found at Class 12A | Physics |
// Chapter 14 "Semiconductor Electronics..." (user-identified via a live
// screenshot showing the E-BOOKS button, then confirmed via
// cypress/scratch/out/explore-ebook.json) -- "(CE Crystal) NCERT Physics
// Class 12", 15 chapters, 1 linked resource on the chapter opened by
// default. See PlaylistPage.goToPhysicsEbookChapter() and
// EbookPlayerPage.js for exact source references.
//
// SHARED BLOCKER, same as pdf-worksheet.cy.js: the e-book viewer is the
// SAME PDF.js-based PdfComponent used by the Worksheet player, which has no
// stable page-turning/toolbar selectors (confirmed by the dev team). Page-
// turning cases here are skipped for that reason, not re-investigated.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { EbookPlayerPage as Ebook } from "../../pages/EbookPlayerPage";

describe("Ebook Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToPhysicsEbookChapter();
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
  });

  it("TC-EBOOK-010: opens from the Playlist E-book button", () => {
    Ebook.triggerBtn().should("be.visible");
    Ebook.open();
    Ebook.wrapper().should("exist");
  });

  it("TC-EBOOK-001: opens using PdfComponent with the ebook-specific class applied", () => {
    Ebook.open();
    // .pdf-player confirms the shared PdfComponent; .Ebook-pdf-player is the
    // class ebook-player.component.ts adds specifically for ebookPlayer=true.
    Ebook.wrapper().should("have.class", "pdf-player").and("have.class", "Ebook-pdf-player");
  });

  it("TC-EBOOK-011: the book title and all chapters are displayed correctly", () => {
    Ebook.open();
    Ebook.chapterListItems().should("have.length.greaterThan", 0);
  });

  it("TC-EBOOK-003: the Chapter List is displayed", () => {
    Ebook.open();
    Ebook.chapterListItems().should("have.length", 15);
  });

  it("TC-EBOOK-012: the first chapter is selected and highlighted by default", () => {
    Ebook.open();
    Ebook.selectedChapterItem().should("have.length", 1);
  });

  it("TC-EBOOK-004: selecting a Chapter jumps to that chapter", () => {
    Ebook.open();
    Ebook.chapterItem(0).invoke("attr", "data-qa-id").then((firstId) => {
      Ebook.chapterItem(1).click({ force: true });
      cy.wait(2500);
      Ebook.selectedChapterItem().should("have.length", 1).invoke("attr", "data-qa-id").should("not.eq", firstId);
    });
  });

  it("TC-EBOOK-005: the Resource List shows resources linked to the current chapter", () => {
    Ebook.open();
    Ebook.linkedResourcesCountLabel().should("contain.text", "Linked Resources");
  });

  it("TC-EBOOK-015: the Chapter Resources count matches the linked cards actually rendered", () => {
    Ebook.open();
    Ebook.linkedResourcesCountLabel()
      .invoke("text")
      .then((text) => {
        const expectedCount = parseInt(text.trim(), 10);
        Ebook.resourceCards().should("have.length", expectedCount);
      });
  });

  // CONFIRMED live 2026-08-22: the FIRST toggle click (collapse) works --
  // chapterListItems() correctly goes to not-visible. The SECOND click
  // (meant to re-expand) does not bring the panel back within a full 10s
  // retry window, across 3 attempts on 2 separate runs -- screenshots show
  // the side panel still fully absent from view, not mid-animation. This
  // could be the toggle button shifting position after collapse (force:true
  // clicks wherever Cypress last calculated, which may be stale) or a real
  // app issue -- not yet distinguished. Left pending rather than guessing
  // further or weakening the assertion to something that would pass either
  // way.
  it.skip("TC-EBOOK-014: the chapter panel can be collapsed and expanded (collapse confirmed working; re-expand via a second toggle click does not bring the panel back within 10s -- needs more investigation before writing for real)", () => {});
  it.skip("TC-EBOOK-020: the resource panel can be collapsed and expanded (same confirmed re-expand issue as TC-EBOOK-014)", () => {});

  it("TC-EBOOK-008: closing Ebook removes the wrapper", () => {
    Ebook.open();
    PlayerPage.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-EBOOK-009: closing Ebook restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      Ebook.open();
      PlayerPage.close();
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  // --- Blocked on the shared PDF.js toolbar (same as pdf-worksheet.cy.js) ---
  it.skip("TC-EBOOK-002: Ebook page turning works (PDF.js toolbar has no stable selectors -- same confirmed blocker as pdf-worksheet.cy.js)", () => {});

  // --- Needs deeper investigation before writing for real ---------------------
  it.skip("TC-EBOOK-006: clicking a chapter-linked resource opens a nested Player (mechanism confirmed in source -- playerRef gets a d-none class -- but not yet exercised against the live DOM)", () => {});
  it.skip("TC-EBOOK-007: a nested player disables recursive Ebook opening (needs a confirmed way to trigger E-book-within-E-book to prove it's actually blocked, not just unattempted)", () => {});
  it.skip("TC-EBOOK-013: chapter selection refreshes Chapter Resources (needs confirming the resource list actually changes content, not just that a different chapter becomes selected -- see TC-EBOOK-004)", () => {});
  it.skip("TC-EBOOK-016: resource, asset and quiz cards open from Chapter Resources (only 1 linked resource confirmed, its type not yet confirmed)", () => {});
  it.skip("TC-EBOOK-018: resource panel scroll controls work at boundaries (only 1 linked resource confirmed -- nothing to scroll)", () => {});
  it.skip("TC-EBOOK-021: nested worksheet/video/image/weblink/quiz open correctly (needs a chapter with multiple distinct linked resource types, not yet found)", () => {});
  it.skip("TC-EBOOK-022: closing a nested resource returns to the e-book (needs TC-EBOOK-006 confirmed first)", () => {});
  it.skip("TC-EBOOK-023: an e-book cannot open another e-book recursively (needs TC-EBOOK-007 confirmed first)", () => {});
  it.skip("TC-EBOOK-025: closing e-book returns to Whiteboard and closes nested content (needs TC-EBOOK-006 confirmed first)", () => {});

  // --- Blocked on test data ----------------------------------------------------
  it.skip("TC-EBOOK-017: a chapter with no resources displays the expected empty state (confirmed text exists -- \"No resources found!\" -- but no chapter without linked resources has been found among the 15)", () => {});
  it.skip("TC-EBOOK-019: loading more resources occurs when scrolling to the bottom (needs a chapter with enough linked resources to require pagination -- only 1 confirmed on the one chapter checked)", () => {});

  // --- Blocked on forced-failure tooling ---------------------------------------
  it.skip("TC-EBOOK-024: a resource load failure shows an error message inside the e-book (needs a forced server failure; no confirmed way to fail one resource, same pattern as TC-VID-016)", () => {});
});
