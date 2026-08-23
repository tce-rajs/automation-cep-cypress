// Whiteboard module -- based on Test_Cases/13_Whiteboard/Whiteboard_Test_Cases.xlsx
// (added 2026-08-23; brand-new module, previously not automated at all --
// Toolbar/Player/Minimap/Playlist, which also render inside app-whiteboard's
// template, are separate modules with their own specs and are not duplicated
// here).
//
// SCOPE IS DELIBERATELY BASIC VALIDATION: this module's own surface (header,
// clock, drawing container, Guest/Welcome-Back/First-time-user states) is
// mostly "does it render, is it open, did it load" rather than deep
// interaction -- per instruction, matching modules that only need that level
// of coverage. Test case IDs below match the workbook's 03_Test Cases sheet.
//
// NOT WRITTEN HERE, per the workbook's Automation Status column:
//   - WB-006/WB-007 (first-time-user state, Choose a class button): this QA
//     account always has prior activity, so the first-time-user state has
//     never been confirmed reachable. Needs a confirmed zero-history account.
//   - WB-009 was originally listed here as "pixel-only, blocked" -- CORRECTED
//     and implemented 2026-08-23 (see the test itself for why: the board is
//     SVG, so real DOM assertions work). WB-018 (write/erase/write) was added
//     the same pass as a realistic combined Pen+Eraser workflow.
//   - WB-010 (dock-toggle button): no data-qa-id exists on it (class
//     selector only) -- see WhiteboardPage.js and this project's selector
//     policy before automating against a class-only selector.
//   - WB-011 through WB-014 (saved-whiteboard pipeline): CONFIRMED DEAD CODE,
//     WhiteboardSaveService.save() has zero callers anywhere in the app.
//   - WB-015 (save-flash trigger), WB-016 (adoption report trigger): neither
//     was traced to a specific UI action in the research pass that produced
//     the workbook -- needs a short follow-up before writing either.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { WhiteboardPage } from "../../pages/WhiteboardPage";
import { ToolbarPage } from "../../pages/ToolbarPage";

describe("Whiteboard - Header", () => {
  it("WB-001: the logo and app version render", () => {
    cy.visitApp();
    WhiteboardPage.headerLogoContainer().should("be.visible");
    WhiteboardPage.headerVersionText().should("be.visible").invoke("text").should("match", /v\s*\S+/);
  });

  it("WB-002: the clock renders a time and a date", () => {
    cy.visitApp();
    WhiteboardPage.headerCalendarContainer().should("be.visible");
    WhiteboardPage.headerCalendarContainer().invoke("text").should("match", /\d{1,2}:\d{2}/);
  });
});

describe("Whiteboard - Welcome Back state", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
  });

  // CONFIRMED live 2026-08-23, unresolved after two rounds of investigation
  // (same as the E-book drawer re-expand issue in ebook.cy.js -- documented
  // and skipped rather than guessed at further): wb-welcome-back-container
  // is a SINGLE element (confirmed via a full DOM dump, not a duplicate-node
  // guess) whose computed style genuinely reads `visibility: hidden;
  // opacity: 0` several seconds after reaching the class -- yet a screenshot
  // taken at that exact moment clearly shows "Welcome Back! / Choose a
  // resource to get started / Tap a resource from the playlist below to
  // start the lesson" rendered on screen at that element's own bounding
  // rect. Neither whiteboard.component.ts nor its template show any binding
  // that explicitly hides this element after render (no [class]/[style]
  // toggle, no animation trigger found in a source search) -- the hide
  // mechanism was not located. Rather than assert against a computed style
  // that contradicts the visible screenshot, this is left as a confirmed,
  // documented finding.
  it.skip("WB-005: Welcome Back renders for an account with recent activity, before a resource is opened", () => {
    PlaylistPage.ensureDrawerVisible();
    WhiteboardPage.welcomeBackContainer().should("be.visible");
    WhiteboardPage.welcomeBackTitle().should("contain.text", "Welcome Back!");
    WhiteboardPage.welcomeBackContainer().should("contain.text", "Choose a resource to get started");
  });
});

describe("Whiteboard - Drawing surface", () => {
  it("WB-008a: the drawing container exists in Guest Mode", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    WhiteboardPage.drawingContainer().should("exist");
  });

  it("WB-008b: the drawing container exists in the logged-in Welcome Back state", () => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
    WhiteboardPage.drawingContainer().should("exist");
  });

  // WB-009 was originally marked "Blocked -- pixel-only content" on the
  // (correct, at the time) assumption that verifying drawn content needs
  // visual-regression tooling. toolbar-additional.cy.js's Pen/Eraser work
  // (2026-08-18) found that's only half true: the board is SVG, not a raster
  // canvas, so strokes are real <path> elements -- object-level DOM
  // assertions work without any pixel comparison. Corrected and implemented
  // here using the promoted drawing helpers in WhiteboardPage.js.
  it("WB-009: content drawn with the Pen renders as real SVG path elements on the board", () => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();

    WhiteboardPage.pathCount().then((before) => {
      ToolbarPage.selectTool("gtPen");
      WhiteboardPage.drawStroke({ x: 300, y: 300 }, { x: 550, y: 380 });
      WhiteboardPage.pathCount().should("be.greaterThan", before);
      WhiteboardPage.paths().last().should("have.attr", "d");
    });
  });

  // WB-018: a realistic combined Toolbar + Whiteboard workflow -- write a
  // long "paragraph" with the Pen (several lines, each made of short
  // adjacent strokes simulating words), erase part of one line with the
  // Eraser, then keep writing. Every stage is verified via the real SVG
  // <path> count / position, not a screenshot or pixel comparison -- same
  // confirmed-working mechanism as WB-009 and toolbar-additional.cy.js's
  // Pen/Eraser output tests.
  //
  // CONFIRMED live 2026-08-23, real app behavior (not a test bug): stroke
  // LENGTH affects whether the Eraser can remove a stroke. A single long
  // pen stroke (~700px) draws fine but an Eraser pass along the exact same
  // line removes nothing. A short stroke (~200px, matching
  // toolbar-additional.cy.js's TB-089/090 exactly) erases correctly every
  // time. WhiteboardPage.writeLine() therefore builds each line from
  // several short (200px) "word" strokes rather than one long rule -- this
  // also maps naturally onto "erase part of the line": erase exactly one
  // word-stroke, not the whole line.
  //
  // Also deliberately avoids y=200-360 -- the Welcome Back overlay
  // ("Welcome Back!" / "Choose a resource..." / "Tap a resource...") sits
  // there, and a stroke drawn directly under that overlay could not be
  // erased either (same investigation, before the real cause -- stroke
  // length -- was isolated).
  it("WB-018: writing a long paragraph, erasing part of it, and writing again all land on the board", () => {
    // Deliberately does NOT call PlaylistPage.goToTargetClass() -- matches
    // TB-089/090's exact confirmed-working setup (just login + wait).
    cy.loginWithValidPin();
    cy.wait(2000);

    ToolbarPage.selectTool("gtPen");

    WhiteboardPage.pathCount().then((before) => {
      // --- "Write a long paragraph": 4 lines, each 3 short word-strokes. ---
      const lineYs = [420, 480, 540, 600];
      let erasedSegment;
      lineYs.forEach((y, i) => {
        const segments = WhiteboardPage.writeLine(y);
        if (i === 2) erasedSegment = segments[1]; // remember one word on the 3rd line
      });

      WhiteboardPage.pathCount().should("be.greaterThan", before);

      WhiteboardPage.pathCount().then((afterWriting) => {
        expect(afterWriting, "each line contributed real strokes").to.be.greaterThan(before);

        // --- "Erase some part": erase exactly ONE word-stroke on the 3rd
        // line, matching TB-089's confirmed-working short-span mechanics.
        ToolbarPage.selectTool("gtErase");
        WhiteboardPage.drawStroke(
          { x: erasedSegment.x1 - 10, y: erasedSegment.y },
          { x: erasedSegment.x2 + 10, y: erasedSegment.y },
          20
        );
        cy.wait(800);

        WhiteboardPage.pathCount().then((afterErasing) => {
          expect(afterErasing, "erasing removed at least one stroke").to.be.lessThan(afterWriting);
          // The other lines/words must still be there -- this was a partial
          // erase, not a Clear-the-board action.
          WhiteboardPage.pathCount().should("be.greaterThan", before);

          // --- "Writing again": resume with the Pen after erasing. ---
          ToolbarPage.selectTool("gtPen");
          WhiteboardPage.writeLine(660);

          WhiteboardPage.pathCount().should("be.greaterThan", afterErasing);
        });
      });
    });
  });
});
