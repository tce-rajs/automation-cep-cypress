// Page Object for the Whiteboard shell itself (header, clock, drawing
// surface, Guest/Welcome-Back/First-time-user states) -- NOT the Toolbar,
// Player, or Minimap, which are separate modules with their own page objects
// even though they render inside app-whiteboard's template.
//
// SOURCE-VERIFIED against cep2-workspace's
// projects/main/src/app/modules/whiteboard/whiteboard.component.html, plus
// everything already confirmed live through 2026-08-23 (the header/drawing
// container/welcome-back elements have all appeared incidentally in
// screenshots taken during other modules' investigations this session).
//
// CONFIRMED GAPS -- see Test_Cases/13_Whiteboard/Whiteboard_Test_Cases.xlsx
// for the full finding on each:
//   * The dock-toggle button (leftRightBtn) and the first-time-user "Choose a
//     class" button both carry NO data-qa-id -- class-selector only.
//   * onChooseAClass() is an empty method body in source; whether the
//     floatUi directive on the same element still opens the popover
//     independently has not been confirmed live.
//   * The entire "saved whiteboard" pipeline (WhiteboardSaveService.save() ->
//     Playlist card -> WhiteboardPreviewDialogComponent) is confirmed
//     unreachable: .save() has zero callers anywhere in the app source.

export const WhiteboardPage = {
  headerLogoContainer() {
    return cy.get('[data-qa-id="wb-header-logo-container"]');
  },

  headerVersionText() {
    return cy.get('[data-qa-id="wb-header-version-text"]');
  },

  headerCalendarContainer() {
    return cy.get('[data-qa-id="wb-header-calendar-container"]');
  },

  welcomeBackContainer() {
    return cy.get('[data-qa-id="wb-welcome-back-container"]');
  },

  welcomeBackTitle() {
    return cy.get('[data-qa-id="wb-welcome-back-title"]');
  },

  drawingContainer() {
    return cy.get('[data-qa-id="wb-drawing-container"]');
  },

  // No data-qa-id exists on either -- documented gap, not a guess. Class
  // selectors only, per Test_Cases/13_Whiteboard's 06_Automation Mapping.
  dockToggleBtn() {
    return cy.get(".leftRightBtn");
  },

  firstTimeUserMessage() {
    return cy.get(".first-time-user-message");
  },

  chooseAClassBtn() {
    return cy.get(".choose-class");
  },

  // --- Drawing surface interaction ---------------------------------------
  // Promoted from toolbar-additional.cy.js's local `WB` helper (CONFIRMED
  // WORKING against the live app, probe 2026-08-18/2026-08-23) -- see that
  // file's header comment for the full history of why this works without
  // any pixel/visual-regression tooling: the board is SVG, not a raster
  // <canvas>, so strokes are real <path> elements with readable attributes.
  // toolbar-additional.cy.js keeps its own copy rather than importing this
  // one, to avoid touching a file with 46 already-passing tests; new work
  // should use this page-object version instead of duplicating further.

  // Every descendant element of the whiteboard SVG is one board object.
  objectCount() {
    return cy.get('[data-qa-id="wb-drawing-container"] svg *').its("length");
  },

  paths() {
    return cy.get('[data-qa-id="wb-drawing-container"] svg path');
  },

  pathCount() {
    return cy.get("body").then(($body) => $body.find('[data-qa-id="wb-drawing-container"] svg path').length);
  },

  // Drives a freehand stroke (or a straight line, for text-like "writing")
  // across the drawing surface. CRITICAL: events must be dispatched on the
  // INNER <svg>, not the wb-drawing-container wrapper -- events on the
  // wrapper bubble UP toward document and never reach the app's handler.
  // Only raw dispatchEvent works; Cypress's own .trigger() produces nothing
  // even when aimed correctly at the <svg>.
  drawStroke(from, to, steps = 14) {
    cy.window().then((win) => {
      cy.get('[data-qa-id="wb-drawing-container"] svg').first().then(($el) => {
        const el = $el[0];
        const rect = el.getBoundingClientRect();

        const fire = (types, x, y) => {
          types.forEach((type) => {
            const Ctor = type.startsWith("pointer") ? win.PointerEvent : win.MouseEvent;
            el.dispatchEvent(
              new Ctor(type, {
                bubbles: true,
                cancelable: true,
                composed: true,
                clientX: rect.left + x,
                clientY: rect.top + y,
                buttons: 1,
                button: 0,
                pointerId: 1,
                pointerType: "mouse",
                isPrimary: true,
              })
            );
          });
        };

        fire(["pointerover", "pointerenter", "pointerdown", "mousedown"], from.x, from.y);
        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          fire(["pointermove", "mousemove"], from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
        }
        fire(["pointerup", "mouseup"], to.x, to.y);
      });
    });
    cy.wait(700);
  },

  // Draws one line of "writing" at the given y, made of several SHORT
  // adjacent strokes rather than one long one.
  //
  // CONFIRMED live 2026-08-23: stroke length affects whether the Eraser can
  // remove it. A single long stroke (~700px, x:240->960) draws fine
  // (path count goes up) but an Eraser pass along the exact same line
  // removes NOTHING -- confirmed in isolation, baseline 0 -> after-draw 1 ->
  // after-erase STILL 1. The same test with a short stroke (~200px, matching
  // toolbar-additional.cy.js's TB-089/090 exactly) erases correctly:
  // baseline 0 -> after-draw 1 -> after-erase 0. Segment width here (200px)
  // matches that confirmed-working length.
  //
  // wordCount short segments per line -- returns the x-ranges drawn, so a
  // caller can target ONE specific segment with the Eraser afterward (a
  // real "erase part of the line", not the whole thing).
  writeLine(y, startX = 250, wordCount = 3, wordWidth = 200, gap = 40) {
    const segments = [];
    let x = startX;
    for (let i = 0; i < wordCount; i += 1) {
      const segStart = x;
      const segEnd = x + wordWidth;
      this.drawStroke({ x: segStart, y }, { x: segEnd, y }, 20);
      segments.push({ x1: segStart, x2: segEnd, y });
      x = segEnd + gap;
    }
    return segments;
  },
};
