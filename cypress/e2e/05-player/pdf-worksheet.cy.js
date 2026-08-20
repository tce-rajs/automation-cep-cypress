// PDF / Worksheet Player -- Test_Cases/05_Player/PDF_Worksheet_Player_Test_Cases.xlsx
// TC-PDF-001 to TC-PDF-022. This spec validates the PDF/Worksheet player only.
//
// PRECONDITIONS ARE PRECONDITIONS, NOT STEPS
// ------------------------------------------
// Every case in this workbook starts from "PDF/Worksheet resource available"
// -- a STATE the test needs, not an instruction to go and re-create that state
// from scratch. The previous version of this spec ran
// PlaylistPage.goToKnownContentTopic() in beforeEach on every single test
// regardless of where the app already was, which is the same mistake the quiz
// spec had: the app reopens the last-used class after login, so the worksheet
// is nearly always already on the strip in front of it, and re-navigating only
// adds ~8s per test plus several more ways to fail for reasons that have
// nothing to do with the PDF player.
//
// The decision now lives in WorksheetPlayerPage.ensureWorksheetAvailable():
// check the current Playlist first, navigate ONLY if no worksheet is there.
// TC-PDF-001 asserts that the direct path really did navigate nowhere.
// Do not put an unconditional goToKnownContentTopic() back in beforeEach.
//
// How "is this card a worksheet?" is answered without inventing a selector:
// via the app's own Filter Resources -> "Worksheet". That is a Playlist-level
// filter, not curriculum navigation -- see WorksheetPlayerPage.js.
//
// CONFIRMED BLOCKER for most of this module: the PDF toolbar is rendered by
// PDF.js and its controls carry no stable test hooks. Prev/Next have NO
// attributes at all; orientation, print and the answer-key toggle carry only
// a `title` attribute plus generic CSS classes -- no data-qa-id, no id, no
// reliable aria-label. Per the dev team's own recommendation, `title` is not
// treated as a stable hook here. Text assertions do not work either: "Go to
// Page" is an input placeholder, not a text node.
//
// Everything blocked on that is skipped with the same reason. One developer
// change (adding data-qa-id to the PDF toolbar) unblocks the largest group.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { WorksheetPlayerPage as Worksheet } from "../../pages/WorksheetPlayerPage";

describe("PDF Worksheet Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    // Establishes the precondition and NOTHING MORE: navigates only if this
    // Playlist has no worksheet in it.
    Worksheet.ensureWorksheetAvailable();
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    // The type filter persists on the account, so it must be put back or every
    // later spec starts with a Playlist showing worksheets only.
    Worksheet.restoreFilter();
  });

  // The case is "the worksheet opens in the PDF Player", and its precondition
  // is that the resource is already available -- so the location the app is
  // sitting on is captured first and asserted unchanged, proving the open
  // needed no curriculum navigation. Without that, this test passes just as
  // happily when the suite wandered off to find a worksheet and came back.
  it("TC-PDF-001: PDF/Worksheet opens in the PDF Player, from the Playlist already open", () => {
    Worksheet.cards().should("have.length.greaterThan", 0);

    PlaylistPage.currentLocation().then((before) => {
      Worksheet.openDirectly();
      PlayerPage.shouldBeOpen();

      PlayerPage.close();
      PlaylistPage.ensureDrawerVisible();
      PlaylistPage.currentLocation().should("eq", before);
    });
  });

  it("TC-PDF-009: closing PDF Player removes the wrapper", () => {
    Worksheet.open();
    PlayerPage.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-PDF-010: closing PDF restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      Worksheet.open();
      PlayerPage.close();
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  it("TC-PDF-012: a worksheet renders its document without a navigation error", () => {
    // What IS assertable without the toolbar: the document canvas renders and
    // the player stays open (no error state, no permanent spinner).
    Worksheet.open();
    cy.wait(1500);
    PlayerPage.shouldBeOpen();
    // PDF.js paints pages onto <canvas> elements inside the player.
    cy.get("canvas").should("have.length.greaterThan", 0);
  });

  it("TC-PDF-022: worksheet load does not leave a permanent spinner", () => {
    Worksheet.open();
    cy.wait(3000);
    // Once the fetch resolves the player must be in a settled state -- open,
    // with content, and no loading indicator still showing.
    PlayerPage.shouldBeOpen();
    cy.get("body").then(($b) => {
      const spinners = $b.find(".mat-mdc-progress-spinner, .spinner, [class*='loading']").filter(":visible");
      expect(spinners.length, "no visible spinner after the document loaded").to.eq(0);
    });
  });

  // --- Blocked on missing test hooks in the PDF.js toolbar ----------------
  it.skip("TC-PDF-002: PDF page navigation works (Prev/Next have no attributes at all -- needs data-qa-id)", () => {});
  it.skip("TC-PDF-003: orientation toggle works (only a title attribute -- needs data-qa-id)", () => {});
  it.skip("TC-PDF-004: Print action is available (only a title attribute -- needs data-qa-id)", () => {});
  it.skip("TC-PDF-005: answer-key toggle works (only a title attribute -- needs data-qa-id)", () => {});
  it.skip("TC-PDF-011: all pages of a multi-page worksheet render (needs page navigation -- see TC-PDF-002)", () => {});
  it.skip("TC-PDF-014: continuous scrolling works with page controls (needs page controls -- see TC-PDF-002)", () => {});
  it.skip("TC-PDF-015: next/previous stop at document boundaries (needs page controls -- see TC-PDF-002)", () => {});
  it.skip("TC-PDF-016: worksheet without an answer version hides the answer-key toggle (needs the toggle located -- see TC-PDF-005)", () => {});
  it.skip("TC-PDF-017: first answer-key request performs a lazy load (needs the answer-key toggle -- see TC-PDF-005)", () => {});
  it.skip("TC-PDF-018: switching answers/questions preserves the correct worksheet (needs the answer-key toggle)", () => {});

  // --- Blocked on canvas pixel inspection ---------------------------------
  it.skip("TC-PDF-006: Pen annotation can be drawn on PDF (needs canvas pixel inspection)", () => {});
  it.skip("TC-PDF-007: Eraser removes PDF annotation (needs canvas pixel inspection)", () => {});
  it.skip("TC-PDF-019: question annotations remain predictable when switching answer key (needs annotation drawing + the answer-key toggle)", () => {});
  it.skip("TC-PDF-020: orientation change keeps annotations aligned (needs annotation drawing + orientation control)", () => {});
  it.skip("TC-PDF-021: annotations stay attached to the correct page after navigation (needs annotation drawing + page controls)", () => {});

  // --- Other blockers ------------------------------------------------------
  // The localStorage schema IS confirmed (a JSON array of LZString
  // compressToUTF16 strings, one per SVG <path>'s attributes, keyed by
  // assetId) -- but writing the test needs a real annotation to exist first,
  // which is TC-PDF-006's blocker.
  it.skip("TC-PDF-008: PDF annotations persist in localStorage (schema confirmed; creating a real annotation is blocked by TC-PDF-006)", () => {});
  it.skip("TC-PDF-013: worksheet is sharp at default zoom (subjective/visual -- needs image-quality tooling, no defined threshold)", () => {});
});
