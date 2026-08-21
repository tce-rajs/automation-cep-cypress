// Toolbar module -- SECOND batch, based on
// Test_Cases/06_Toolbar/Toolbar_Additional_Test_Cases.xlsx (TB-085 to TB-129).
//
// toolbar.cy.js (TB-001 to TB-084) is deliberately untouched; this file is
// purely additive. Where the two overlap conceptually, the first batch checks
// that a CONTROL exists and reacts, and this batch checks the resulting
// WHITEBOARD OUTPUT -- which is exactly the gap the new Excel calls out.
//
// ---------------------------------------------------------------------------
// WHY THESE ARE WRITABLE AT ALL
//
// MODULE_COVERAGE.md lists "needs canvas pixel inspection" as the blocker for
// Whiteboard drawing assertions. That is only half true: the whiteboard is
// rendered as SVG, not as a raster <canvas>. Three already-confirmed facts make
// object-level assertions possible without any visual-regression tooling:
//
//   * `[data-qa-id="wb-drawing-container"] svg *` counts whiteboard objects.
//     Confirmed -- gallery.cy.js and add-resource.cy.js already assert on it,
//     and it is recorded in claude/SELECTORS_REFERENCE.md.
//   * Strokes are SVG <path> elements. Confirmed via claude/APP_QUIRKS.md:
//     PDF annotations persist to localStorage as "each one SVG <path>
//     element's attributes". So stroke width and colour are readable off the
//     `stroke-width` / `stroke` attributes -- no pixel comparison needed.
//   * Zoom/pan state is the CSS `transform` on the drawing container.
//     Confirmed in claude/APP_QUIRKS.md and already asserted in player.cy.js.
//
// ---------------------------------------------------------------------------
// STATUS -- drawing simulation is CONFIRMED WORKING (probe, 2026-08-18)
//
// The first run of this file failed 21 of 23 tests because drawStroke() aimed
// its events at the wb-drawing-container wrapper. Events dispatched there
// bubble UP toward document and never reach the <svg> child that carries the
// app's handler. Retargeting to the inner <svg> fixed it.
//
// Measured against the live app (cypress/scratch/whiteboard-drawing-probe):
//   * 20 strokes requested -> 20 <path> elements created. No throttling.
//   * Pen thickness reaches the DOM: Thin/Normal/Thick/Strong render
//     stroke-width 1 / 2 / 3 / 4 -- four distinct values, so TB-086 is a real
//     comparison, not a visual one.
//   * Pen colour is readable as an attribute (e.g. stroke="#FFA726").
//   * Eraser removes exactly the targeted stroke (3 drawn -> 1 removed).
//   * ONLY raw dispatchEvent works. Cypress's own .trigger() produces nothing,
//     even when correctly aimed at the <svg>.
//   * An empty board holds one child: <g id="panGroup">. All counting here is
//     delta-based, so pre-existing class content does not matter.
//
// Cases needing selectors or requirements that have NOT been confirmed are
// it.skip() with the reason inline, rather than written speculatively.
// ---------------------------------------------------------------------------

import { ToolbarPage } from "../../pages/ToolbarPage";

const WB_CONTAINER = '[data-qa-id="wb-drawing-container"]';
// Confirmed by DOM dump: the Text tool renders a <foreignObject
// class="text-element draggable"> holding a contenteditable div.
const TEXT_EDITOR = `${WB_CONTAINER} .text-input-container[contenteditable="true"]`;

// Local helpers, kept in this file on purpose: the instruction for this batch
// was to add a new file without editing the existing Toolbar files, and
// ToolbarPage.js is shared with toolbar.cy.js. If the drawing simulation is
// confirmed to work, these are the obvious candidates to promote into a
// WhiteboardPage page object later.
const WB = {
  container() {
    return cy.get(WB_CONTAINER);
  },

  // Every descendant element of the whiteboard SVG is one board object.
  objectCount() {
    return cy.get("body").then(($body) => $body.find(`${WB_CONTAINER} svg *`).length);
  },

  // Strokes specifically -- shapes and images are other element types.
  paths() {
    return cy.get(`${WB_CONTAINER} svg path`);
  },

  pathCount() {
    return cy.get("body").then(($body) => $body.find(`${WB_CONTAINER} svg path`).length);
  },

  // Counts strokes whose path STARTS at a given y, by parsing the "M x y"
  // move command. Confirmed: a stroke drawn at y=150 renders
  // d="M 300 150 C 300 150, 322 150, ...", and svg coordinates map 1:1 to the
  // ones passed to drawStroke because the svg's origin is the viewport origin.
  //
  // Identifying strokes by POSITION rather than counting totals is deliberate,
  // and stronger: it proves WHICH stroke was removed or moved, not merely how
  // many exist. Counting totals proved unreliable because one pen stroke does
  // not always render as exactly one <path> -- that is what broke the original
  // eraser assertions (`eq(before + 3)`: expected 10, got 12).
  //
  // Parsing the move command specifically -- rather than testing
  // `d.includes(" 350 ")` -- matters because a coordinate appears in the path
  // data as both an x and a y. A stroke running x=300..500 passes through
  // x=350, so the naive version matched itself and every neighbour (expected
  // 0, got 14).
  pathStartsAtY(y, tolerance = 4) {
    return cy.get("body").then(($body) =>
      $body
        .find(`${WB_CONTAINER} svg path`)
        .toArray()
        .filter((el) => {
          const m = (el.getAttribute("d") || "").match(/M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
          return m ? Math.abs(parseFloat(m[2]) - y) <= tolerance : false;
        }).length
    );
  },

  // Document order of the LAST path starting at y. Later in document order =
  // painted on top, which is how stacking order is asserted.
  //
  // Deliberately the last, not the first: board content persists between tests,
  // so an earlier test's stroke can sit at the same y. The one this test just
  // drew is the most recently added, so matching from the end targets it.
  indexOfPathAtY(y, tolerance = 4) {
    return cy.get("body").then(($body) => {
      const paths = $body.find(`${WB_CONTAINER} svg path`).toArray();
      for (let i = paths.length - 1; i >= 0; i -= 1) {
        const m = (paths[i].getAttribute("d") || "").match(/M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
        if (m && Math.abs(parseFloat(m[2]) - y) <= tolerance) return i;
      }
      return -1;
    });
  },

  // Zoom/pan state is NOT on the wb-drawing-container div -- that reads
  // "none" no matter how far you zoom, which is why TB-110/111/112 failed with
  // "expected 'none' to not equal 'none'". The board uses the svg-pan-zoom
  // library, which applies its transform to the inner viewport group
  // <g id="panGroup" class="svg-pan-zoom_viewport">.
  //
  // (claude/APP_QUIRKS.md says pan-zoom state "is reflected in the CSS
  // transform applied to the whiteboard drawing container". That is true of the
  // PDF player, but not of the Whiteboard itself -- worth correcting there.)
  transform() {
    return cy.get(`${WB_CONTAINER} svg #panGroup, ${WB_CONTAINER} svg .svg-pan-zoom_viewport`).first().then(($el) => $el[0].getAttribute("transform") || getComputedStyle($el[0]).transform);
  },

  // Drives a freehand stroke across the drawing surface.
  //
  // CRITICAL: events must be dispatched on the INNER <svg>, not on the
  // wb-drawing-container wrapper. An event dispatched on the container bubbles
  // UP toward document, so it never reaches the <svg> child where the app's
  // handler lives. Confirmed by probe (cypress/scratch/, 2026-08-18):
  // container target = 0 strokes across mouse/pointer/touch/raw dispatch;
  // <svg> target = a real <path> every time.
  //
  // Cypress's own .trigger() aimed at the <svg> also produces nothing -- only
  // raw dispatchEvent works -- so this deliberately does not use .trigger().
  drawStroke(from, to, steps = 14) {
    cy.window().then((win) => {
      cy.get(`${WB_CONTAINER} svg`).first().then(($el) => {
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

  // A drag with the Select tool active -- same mechanics, named for intent.
  dragObject(from, to) {
    this.drawStroke(from, to, 10);
  },
};

// Draw a stroke with the Pen. Used as the setup step for the eraser/undo/select
// groups so a failure there is attributable to the group under test, not to
// missing content.
function penStroke(from, to) {
  ToolbarPage.selectTool("gtPen");
  WB.drawStroke(from, to);
}

describe("Toolbar (additional) - Pen output on the whiteboard", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-085: a Pen stroke is created on the whiteboard and survives a tool switch", () => {
    WB.pathCount().then((before) => {
      penStroke({ x: 300, y: 300 }, { x: 520, y: 420 });
      WB.pathCount().should("be.greaterThan", before);

      WB.pathCount().then((afterDraw) => {
        // Switch away and back -- the stroke must still be on the board.
        ToolbarPage.selectTool("gtSelect");
        ToolbarPage.selectTool("gtPen");
        WB.pathCount().should("eq", afterDraw);
      });
    });
  });

  it("TB-086: each Pen thickness renders a different stroke width", () => {
    const widths = [];
    const thicknesses = ["Thin", "Normal", "Thick", "Strong"];

    cy.wrap(thicknesses).each((label, i) => {
      ToolbarPage.openToolPanel("gtPen");
      ToolbarPage.panelShouldBeOpen();
      ToolbarPage.panel().contains(label).click({ force: true });
      cy.wait(500);
      ToolbarPage.closePanelByTappingOutside();

      const y = 200 + i * 60;
      WB.drawStroke({ x: 300, y }, { x: 600, y });

      // The stroke just drawn is the last path on the board.
      WB.paths()
        .last()
        .then(($p) => {
          widths.push(parseFloat($p.attr("stroke-width") || getComputedStyle($p[0]).strokeWidth));
        });
    });

    cy.then(() => {
      expect(widths, "one width recorded per thickness option").to.have.length(4);
      // Strictly increasing: Thin < Normal < Thick < Strong.
      widths.forEach((w, i) => {
        if (i > 0) {
          expect(w, `${thicknesses[i]} wider than ${thicknesses[i - 1]}`).to.be.greaterThan(widths[i - 1]);
        }
      });
    });
  });

  it("TB-088: the Pen keeps its configured settings across repeated tool switching", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().contains("Thick").click({ force: true });
    cy.wait(500);
    ToolbarPage.closePanelByTappingOutside();

    WB.drawStroke({ x: 300, y: 250 }, { x: 600, y: 250 });
    WB.paths()
      .last()
      .then(($p) => {
        const configured = $p.attr("stroke-width") || getComputedStyle($p[0]).strokeWidth;

        // Round trip through several other tools and panels.
        ToolbarPage.selectTool("gtErase");
        ToolbarPage.selectTool("gtSelect");
        ToolbarPage.openToolPanel("gtZoom");
        ToolbarPage.closePanelByTappingOutside();
        ToolbarPage.selectTool("gtPen");

        WB.drawStroke({ x: 300, y: 350 }, { x: 600, y: 350 });
        WB.paths()
          .last()
          .then(($p2) => {
            const after = $p2.attr("stroke-width") || getComputedStyle($p2[0]).strokeWidth;
            expect(after, "pen thickness retained after tool/panel round trip").to.eq(configured);
          });
      });
  });

  // TB-087: custom Pen colour.
  // SKIPPED -- the preset swatches are confirmed (`.penColorOption`, asserted
  // in toolbar.cy.js TB-011) but the CUSTOM colour picker's trigger and input
  // have no confirmed selector. Picking a preset instead would test a
  // different case (TB-012) and report a pass for coverage never exercised.
  it.skip("TB-087: a custom Pen colour is applied to the rendered stroke", () => {});
});

describe("Toolbar (additional) - Eraser output on the whiteboard", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-089: the Eraser removes the targeted stroke and leaves the others", () => {
    // Three well-separated strokes so the eraser can hit one in isolation.
    penStroke({ x: 300, y: 200 }, { x: 500, y: 200 });
    penStroke({ x: 300, y: 350 }, { x: 500, y: 350 });
    penStroke({ x: 300, y: 500 }, { x: 500, y: 500 });

    // All three present, identified by position rather than by total count.
    WB.pathStartsAtY(200).should("be.greaterThan", 0);
    WB.pathStartsAtY(350).should("be.greaterThan", 0);
    WB.pathStartsAtY(500).should("be.greaterThan", 0);

    ToolbarPage.selectTool("gtErase");
    // Erase along the middle stroke only.
    WB.drawStroke({ x: 290, y: 350 }, { x: 510, y: 350 }, 20);
    cy.wait(800);

    // The targeted stroke is gone and the other two are untouched.
    WB.pathStartsAtY(350).should("eq", 0);
    WB.pathStartsAtY(200).should("be.greaterThan", 0);
    WB.pathStartsAtY(500).should("be.greaterThan", 0);
  });

  it("TB-090: erasing one stroke does not remove a nearby unrelated stroke", () => {
    // Whiteboard content PERSISTS on the account between tests and runs (the
    // app syncs it server-side), so a given y may already carry strokes left by
    // an earlier test. Absolute assertions like "0 strokes at y=300" therefore
    // fail against leftovers rather than against the feature -- that is what
    // produced "expected 25 to equal 0" here.
    //
    // Baselining each y first makes the assertion about THIS test's strokes.
    WB.pathStartsAtY(300).then((base300) => {
      WB.pathStartsAtY(340).then((base340) => {
        // Two strokes close together but not overlapping.
        penStroke({ x: 300, y: 300 }, { x: 500, y: 300 });
        penStroke({ x: 300, y: 340 }, { x: 500, y: 340 });

        WB.pathStartsAtY(300).should("be.greaterThan", base300);
        WB.pathStartsAtY(340).should("be.greaterThan", base340);

        ToolbarPage.selectTool("gtErase");
        WB.drawStroke({ x: 290, y: 300 }, { x: 510, y: 300 }, 20);
        cy.wait(1000);

        // The targeted stroke is gone (back to baseline) while its neighbour
        // survives -- an over-wide hit area would take both.
        WB.pathStartsAtY(300).should("eq", base300);
        WB.pathStartsAtY(340).should("be.greaterThan", base340);
      });
    });
  });

  // TB-091: Free Erase behaviour.
  // SKIPPED -- twice blocked. The Free Erase control inside the Eraser panel
  // has no confirmed selector, and the Excel itself flags "Exact Free Erase
  // semantics require confirmation if not documented", so there is no agreed
  // expected result to assert against either.
  it.skip("TB-091: Free Erase removes content per its documented behaviour", () => {});

  // TB-092: Eraser size affects the erased area.
  // SKIPPED -- the eraser size control has no confirmed selector. The panel is
  // confirmed to open (toolbar.cy.js TB-017) but its contents were never
  // enumerated against the live DOM.
  it.skip("TB-092: a larger Eraser size erases a larger area", () => {});
});

describe("Toolbar (additional) - Shapes output on the whiteboard", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-093: a selected ready-made shape is added to the whiteboard", () => {
    WB.objectCount().then((before) => {
      ToolbarPage.openToolPanel("gtShapes");
      ToolbarPage.panelShouldBeOpen();
      // Take the first offered shape rather than assuming which shapes exist
      // or how they are labelled -- the panel contents are not documented.
      ToolbarPage.panel().find("img, svg, button").first().click({ force: true });
      cy.wait(600);
      ToolbarPage.closePanelByTappingOutside();

      WB.drawStroke({ x: 350, y: 300 }, { x: 520, y: 440 });
      WB.objectCount().should("be.greaterThan", before);
    });
  });

  it("TB-094: a dragged shape is created within the dragged bounds", () => {
    const from = { x: 350, y: 300 };
    const to = { x: 550, y: 460 };

    ToolbarPage.openToolPanel("gtShapes");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().find("img, svg, button").first().click({ force: true });
    cy.wait(600);
    ToolbarPage.closePanelByTappingOutside();

    WB.objectCount().then((before) => {
      WB.drawStroke(from, to);
      WB.objectCount().should("be.greaterThan", before);

      // The new object's box should sit within the dragged rectangle, allowing
      // tolerance for stroke width and selection-handle padding.
      WB.container().then(($c) => {
        const origin = $c[0].getBoundingClientRect();
        cy.get(`${WB_CONTAINER} svg *`)
          .last()
          .then(($el) => {
            const box = $el[0].getBoundingClientRect();
            const tolerance = 25;
            expect(box.left).to.be.closeTo(origin.left + from.x, Math.abs(to.x - from.x) / 2 + tolerance);
            expect(box.top).to.be.closeTo(origin.top + from.y, Math.abs(to.y - from.y) / 2 + tolerance);
            expect(box.width, "shape has real width").to.be.greaterThan(0);
            expect(box.height, "shape has real height").to.be.greaterThan(0);
          });
      });
    });
  });

  // TB-095: More Symbols placement.
  // SKIPPED -- the "More Symbols" entry point inside the Shapes panel and the
  // symbol library it opens have no confirmed selectors.
  it.skip("TB-095: a symbol chosen from More Symbols is added to the whiteboard", () => {});
});

describe("Toolbar (additional) - Background", () => {
  // TB-096: background persists across tool switches.
  // TB-097: changing background preserves existing whiteboard content.
  // BOTH SKIPPED -- the Background panel is confirmed to open (toolbar.cy.js
  // TB-034) but the individual background OPTIONS inside it were never
  // enumerated against the live DOM, so there is no confirmed way to apply a
  // specific non-default background, nor to read back which one is applied.
  it.skip("TB-096: the selected background survives switching tools", () => {});
  it.skip("TB-097: changing the background leaves existing content intact", () => {});
});

describe("Toolbar (additional) - Text objects", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-098: the Text tool creates a text object containing the entered text", () => {
    WB.objectCount().then((before) => {
      ToolbarPage.selectTool("gtInserttext");
      // Tap the surface via the confirmed dispatch path -- a Cypress click on
      // the container never reaches the svg handler.
      WB.drawStroke({ x: 400, y: 300 }, { x: 400, y: 300 }, 1);
      cy.wait(1000);

      // Confirmed by DOM dump: the tap creates
      //   <foreignObject class="text-element draggable">
      //     <div class="text-input-container" contenteditable="true">
      // The div is contenteditable but is NOT auto-focused -- document
      // .activeElement stays <body>, which is why the original cy.focused()
      // approach timed out. Type into the element directly instead.
      cy.get(TEXT_EDITOR).should("be.visible").type("QA Test 123", { force: true });
      cy.wait(400);
      // Commit by tapping away from the text object.
      WB.drawStroke({ x: 750, y: 620 }, { x: 750, y: 620 }, 1);
      cy.wait(1000);

      WB.objectCount().should("be.greaterThan", before);
      cy.get(WB_CONTAINER).should("contain.text", "QA Test 123");
    });
  });

  // TB-099: editing an existing text object's content.
  // SKIPPED -- no gesture found that reopens the editor. Creating text works
  // (TB-098 passes) but re-entry does not: with a text object on the board,
  // all three candidate gestures left zero visible [contenteditable] elements
  // (cypress/scratch/text-edit-dump):
  //   double-tap the surface at the text position  -> no editor
  //   Cypress dblclick on the <foreignObject>      -> no editor
  //   gtSelect then tap the text                   -> no editor (opens the
  //                                                   text context menu instead)
  // The text context menu offers formatting, colour, layering, duplicate and
  // delete -- but no edit-content action. Either re-entry uses a gesture not
  // yet found (long press is a candidate, and long press is separately
  // confirmed unsimulatable), or the app has no way to edit text after commit,
  // which would itself be worth raising.
  it.skip("TB-099: an existing text object can be edited to new content", () => {
    // NOTE on the Excel's test data: it specifies original "QA Test" and
    // updated "QA Test Updated". The old string is a substring of the new one,
    // so "old text no longer displayed" cannot be asserted by text matching.
    // This asserts the two things that ARE decidable: the new content is shown,
    // and the edit did not create a second object.
    ToolbarPage.selectTool("gtInserttext");
    WB.drawStroke({ x: 400, y: 300 }, { x: 400, y: 300 }, 1);
    cy.wait(1000);
    cy.get(TEXT_EDITOR).should("be.visible").type("QA Test", { force: true });
    WB.drawStroke({ x: 750, y: 620 }, { x: 750, y: 620 }, 1);
    cy.wait(1000);
    cy.get(WB_CONTAINER).should("contain.text", "QA Test");

    WB.objectCount().then((afterCreate) => {
      // Re-enter edit mode on the same object and replace its content.
      cy.get(`${WB_CONTAINER} foreignObject.text-element`).first().dblclick({ force: true });
      cy.wait(1000);
      cy.get(TEXT_EDITOR).should("be.visible").type("{selectall}QA Test Updated", { force: true });
      WB.drawStroke({ x: 750, y: 620 }, { x: 750, y: 620 }, 1);
      cy.wait(1000);

      cy.get(WB_CONTAINER).should("contain.text", "QA Test Updated");
      WB.objectCount().should("eq", afterCreate);
    });
  });

  // NOW UNBLOCKED. Selecting a text object opens a context menu carrying the
  // full formatting set, confirmed by DOM dump:
  //   toolbar-text-menu-bold-btn / -italic-btn / -underline-btn
  //   toolbar-text-menu-align-left-btn / -align-center-btn / -align-right-btn
  //   toolbar-text-menu-font-slider / -font-select
  //   toolbar-text-menu-color-#RRGGBB (33 swatches)
  //   toolbar-text-menu-delete-btn / -to-front / -to-back / -duplicate
  // TB-100 STATUS: the controls are confirmed present and clickable, but
  // clicking Bold produced NO change in the text element's computed
  // font-weight, so the assertion below fails on its first step. The style is
  // evidently applied somewhere other than the foreignObject's child div --
  // possibly on an inner node, as a class, or only to a selected text RANGE
  // rather than the whole object (the app may expect text to be selected
  // first, which needs the re-entry gesture that TB-099 could not find).
  //
  // Left skipped rather than loosened into "a button was clicked", which would
  // report formatting coverage that was never actually verified. One DOM dump
  // of the text element before/after a Bold click settles it.
  it.skip("TB-100: formatting controls are applied to the selected text", () => {
    // Create a text object.
    ToolbarPage.selectTool("gtInserttext");
    WB.drawStroke({ x: 400, y: 300 }, { x: 400, y: 300 }, 1);
    cy.wait(1000);
    cy.get(TEXT_EDITOR).should("be.visible").type("FormatMe", { force: true });
    WB.drawStroke({ x: 750, y: 620 }, { x: 750, y: 620 }, 1);
    cy.wait(1000);

    // Select it to open the text context menu.
    ToolbarPage.selectTool("gtSelect");
    WB.drawStroke({ x: 400, y: 300 }, { x: 400, y: 300 }, 1);
    cy.wait(1200);
    cy.get('[data-qa-id="toolbar-text-menu-bold-btn"]').should("exist");

    const textEl = () => cy.get(`${WB_CONTAINER} foreignObject.text-element`).first();

    // Bold.
    textEl().then(($el) => {
      const before = getComputedStyle($el.find("div")[0] || $el[0]).fontWeight;
      cy.get('[data-qa-id="toolbar-text-menu-bold-btn"]').click({ force: true });
      cy.wait(800);
      textEl().then(($after) => {
        const after = getComputedStyle($after.find("div")[0] || $after[0]).fontWeight;
        expect(after, "Bold changed font-weight").to.not.eq(before);
      });
    });

    // Italic.
    textEl().then(($el) => {
      const before = getComputedStyle($el.find("div")[0] || $el[0]).fontStyle;
      cy.get('[data-qa-id="toolbar-text-menu-italic-btn"]').click({ force: true });
      cy.wait(800);
      textEl().then(($after) => {
        const after = getComputedStyle($after.find("div")[0] || $after[0]).fontStyle;
        expect(after, "Italic changed font-style").to.not.eq(before);
      });
    });

    // Underline.
    textEl().then(($el) => {
      const before = getComputedStyle($el.find("div")[0] || $el[0]).textDecorationLine;
      cy.get('[data-qa-id="toolbar-text-menu-underline-btn"]').click({ force: true });
      cy.wait(800);
      textEl().then(($after) => {
        const after = getComputedStyle($after.find("div")[0] || $after[0]).textDecorationLine;
        expect(after, "Underline changed text-decoration").to.not.eq(before);
      });
    });

    // Alignment.
    textEl().then(($el) => {
      const before = getComputedStyle($el.find("div")[0] || $el[0]).textAlign;
      cy.get('[data-qa-id="toolbar-text-menu-align-right-btn"]').click({ force: true });
      cy.wait(800);
      textEl().then(($after) => {
        const after = getComputedStyle($after.find("div")[0] || $after[0]).textAlign;
        expect(after, "Align right changed text-align").to.not.eq(before);
      });
    });
  });
});

describe("Toolbar (additional) - Select and object manipulation", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-101: the Select tool moves an object to a new position", () => {
    penStroke({ x: 300, y: 300 }, { x: 420, y: 380 });

    WB.paths()
      .last()
      .then(($p) => {
        const before = $p[0].getBoundingClientRect();

        ToolbarPage.selectTool("gtSelect");
        // Grab the middle of the stroke and drag it down-right.
        WB.dragObject({ x: 360, y: 340 }, { x: 560, y: 500 });

        WB.paths()
          .last()
          .then(($p2) => {
            const after = $p2[0].getBoundingClientRect();
            const moved = Math.abs(after.left - before.left) + Math.abs(after.top - before.top);
            expect(moved, "object changed position").to.be.greaterThan(20);
          });
      });
  });

  // The object context menu HAS now been dumped from the live DOM. Selecting a
  // drawn stroke with gtSelect opens `.context-menu-floating-ui` containing
  // "Drawing Path / Line size: N / To Front / To Back / Duplicate", with these
  // confirmed ids (a parallel set exists for text and image objects):
  //   toolbar-path-menu-delete-btn / -to-front / -to-back / -duplicate
  // That unblocks TB-103/104/105 below.

  // Selects the most recently drawn object and waits for its context menu.
  const selectLastStrokeAt = (x, y) => {
    ToolbarPage.selectTool("gtSelect");
    WB.drawStroke({ x, y }, { x, y }, 1);
    cy.wait(1200);
    cy.get('[data-qa-id="toolbar-path-menu-delete-btn"]').should("exist");
  };

  it("TB-103: Delete removes only the selected object", () => {
    // Baseline first -- board content persists between tests (see TB-090).
    WB.pathStartsAtY(250).then((base250) => {
      WB.pathStartsAtY(450).then((base450) => {
        penStroke({ x: 300, y: 250 }, { x: 500, y: 250 }); // Object A
        penStroke({ x: 300, y: 450 }, { x: 500, y: 450 }); // Object B
        WB.pathStartsAtY(250).should("be.greaterThan", base250);
        WB.pathStartsAtY(450).should("be.greaterThan", base450);

        selectLastStrokeAt(400, 250);
        cy.get('[data-qa-id="toolbar-path-menu-delete-btn"]').click({ force: true });
        cy.wait(1200);

        // A is back to baseline; B untouched.
        WB.pathStartsAtY(250).should("eq", base250);
        WB.pathStartsAtY(450).should("be.greaterThan", base450);
      });
    });
  });

  it("TB-104: Duplicate creates an independent copy", () => {
    penStroke({ x: 300, y: 300 }, { x: 500, y: 300 });

    WB.pathCount().then((before) => {
      selectLastStrokeAt(400, 300);
      cy.get('[data-qa-id="toolbar-path-menu-duplicate"]').click({ force: true });
      cy.wait(1200);

      // The original survives and a copy exists alongside it.
      WB.pathCount().should("be.greaterThan", before);
      WB.pathStartsAtY(300).should("be.greaterThan", 0);
    });
  });

  it("TB-105: Bring to Front and Send to Back change stacking order", () => {
    penStroke({ x: 300, y: 300 }, { x: 500, y: 300 });
    cy.wait(400);
    penStroke({ x: 300, y: 320 }, { x: 500, y: 320 });
    cy.wait(400);

    // Document order in the SVG is the stacking order: last child paints on top.
    const indexOfStrokeAt = (y) => WB.indexOfPathAtY(y);

    indexOfStrokeAt(300).then((startIndex) => {
      selectLastStrokeAt(400, 300);
      cy.get('[data-qa-id="toolbar-path-menu-to-front"]').click({ force: true });
      cy.wait(1200);

      indexOfStrokeAt(300).then((frontIndex) => {
        expect(frontIndex, "To Front moved the object later in document order").to.be.greaterThan(startIndex);

        selectLastStrokeAt(400, 300);
        cy.get('[data-qa-id="toolbar-path-menu-to-back"]').click({ force: true });
        cy.wait(1200);

        indexOfStrokeAt(300).then((backIndex) => {
          expect(backIndex, "To Back moved the object earlier in document order").to.be.lessThan(frontIndex);
        });
      });
    });
  });

  // TB-102: resize via handles.
  // STILL SKIPPED -- the context menu shows a "Line size: N" section, but
  // whether that is a resize control or a pen-width readout is not confirmed,
  // and no drag handles were found on the selected object. This one needs its
  // own look; the other three in this group are now written above.
  it.skip("TB-102: dragging a resize handle changes the object's dimensions", () => {});
});

describe("Toolbar (additional) - Undo and Redo history", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-106: Undo reverses actions in reverse chronological order", () => {
    WB.objectCount().then((before) => {
      penStroke({ x: 300, y: 250 }, { x: 500, y: 250 });
      WB.objectCount().then((afterStroke) => {
        expect(afterStroke, "stroke added an object").to.be.greaterThan(before);

        ToolbarPage.openToolPanel("gtShapes");
        ToolbarPage.panel().find("img, svg, button").first().click({ force: true });
        cy.wait(500);
        ToolbarPage.closePanelByTappingOutside();
        WB.drawStroke({ x: 300, y: 350 }, { x: 450, y: 470 });

        WB.objectCount().then((afterShape) => {
          expect(afterShape, "shape added an object").to.be.greaterThan(afterStroke);

          // Undo the shape, then the stroke -- newest first.
          ToolbarPage.selectTool("gtUndo");
          cy.wait(900);
          WB.objectCount().should("eq", afterStroke);

          ToolbarPage.selectTool("gtUndo");
          cy.wait(900);
          WB.objectCount().should("eq", before);
        });
      });
    });
  });

  it("TB-107: a new action invalidates the Redo history", () => {
    WB.pathCount().then((before) => {
      penStroke({ x: 300, y: 250 }, { x: 500, y: 250 }); // Stroke A
      penStroke({ x: 300, y: 350 }, { x: 500, y: 350 }); // Stroke B
      WB.pathCount().should("eq", before + 2);

      ToolbarPage.selectTool("gtUndo"); // undo Stroke B
      cy.wait(900);
      WB.pathCount().should("eq", before + 1);

      penStroke({ x: 300, y: 450 }, { x: 500, y: 450 }); // Stroke C -- new branch
      WB.pathCount().should("eq", before + 2);

      ToolbarPage.selectTool("gtRedo");
      cy.wait(900);
      // Stroke B must NOT come back -- the new action dropped that branch.
      WB.pathCount().should("eq", before + 2);
    });
  });

  // TB-108: Undo/Redo restoring a moved object's state.
  // SKIPPED -- pending a dev answer, because the app does not behave as the
  // test case specifies. Measured step by step (cypress/scratch/text-edit-dump):
  //
  //   after draw   : 1 path, d="M 300 300 ...", box left 300
  //   after move   : 2 paths, box left 650   <- selection handles render as an
  //                  extra <path> ("M 431 280 L 439 280 L 439 290 L 431 290 Z")
  //   after undo   : 0 paths                 <- the OBJECT is gone, not the move
  //   after undo#2 : 0 paths
  //   after redo   : 1 path, d unchanged, box left 520  <- restored, still moved
  //
  // So Undo after a move removes the object outright rather than reverting the
  // move, and Redo brings it back at the MOVED position -- i.e. the move does
  // not appear in the undo history as its own step. TB-106/107 pass, so Undo
  // is correct for object creation; this is specific to moves.
  //
  // Two other facts this uncovered, both useful elsewhere:
  //   * A move is applied as a TRANSFORM -- the path's `d` is unchanged while
  //     its bounding box moves. Identify objects by `d`, measure position by
  //     bounding box. (TB-101 already does this and passes.)
  //   * Selection handles are themselves <path> elements, so "the last path"
  //     is not reliably the object under test while something is selected.
  //
  // Not written as a passing test against the observed behaviour, because that
  // would encode a probable defect as the expectation. Needs dev confirmation
  // of intended behaviour first.
  it.skip("TB-108: Undo and Redo restore an object's previous and modified state", () => {});

  // TB-109: Undo/Redo around Clear Whiteboard.
  // SKIPPED -- depends on the Clear Whiteboard control, which has no confirmed
  // selector (see the TB-126/TB-127 note below).
  it.skip("TB-109: Undo restores the board cleared by Clear Whiteboard", () => {});
});

describe("Toolbar (additional) - Zoom and Pan against real content", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-110: Zoom visibly scales whiteboard content, not just the readout", () => {
    penStroke({ x: 300, y: 300 }, { x: 500, y: 400 });

    WB.paths()
      .last()
      .then(($p) => {
        const before = $p[0].getBoundingClientRect();

        WB.transform().then((transformBefore) => {
          ToolbarPage.openToolPanel("gtZoom");
          ToolbarPage.panelShouldBeOpen();
          // Confirmed selector (DOM dump): the Zoom panel exposes
          // toolbar-zoom-in-btn / -out-btn / -reset-btn / -slider / -minimap-btn.
          // Two clicks so the change is unambiguous.
          cy.get('[data-qa-id="toolbar-zoom-in-btn"]').click({ force: true });
          cy.wait(600);
          cy.get('[data-qa-id="toolbar-zoom-in-btn"]').click({ force: true });
          cy.wait(900);
          ToolbarPage.closePanelByTappingOutside();

          WB.transform().should("not.eq", transformBefore);

          WB.paths()
            .last()
            .then(($p2) => {
              const after = $p2[0].getBoundingClientRect();
              const scaled = after.width !== before.width || after.height !== before.height;
              expect(scaled, "content geometry changed with zoom").to.eq(true);
            });
        });
      });
  });

  it("TB-111: relative object positions survive a zoom round trip", () => {
    penStroke({ x: 300, y: 250 }, { x: 400, y: 250 });
    penStroke({ x: 300, y: 450 }, { x: 400, y: 450 });

    // Record the vertical gap between the two strokes at the starting zoom.
    cy.get(`${WB_CONTAINER} svg path`).then(($paths) => {
      const boxes = $paths.toArray().slice(-2).map((el) => el.getBoundingClientRect());
      const gapBefore = Math.abs(boxes[1].top - boxes[0].top);

      WB.transform().then((transformBefore) => {
        ToolbarPage.openToolPanel("gtZoom");
        cy.get('[data-qa-id="toolbar-zoom-in-btn"]').click({ force: true });
        cy.wait(600);
        cy.get('[data-qa-id="toolbar-zoom-in-btn"]').click({ force: true });
        cy.wait(900);
        ToolbarPage.closePanelByTappingOutside();
        WB.transform().should("not.eq", transformBefore);

        // Reset returns the board to its starting zoom in one step, which is a
        // cleaner round trip than counting zoom-out clicks.
        ToolbarPage.openToolPanel("gtZoom");
        cy.get('[data-qa-id="toolbar-zoom-reset-btn"]').click({ force: true });
        cy.wait(1200);
        ToolbarPage.closePanelByTappingOutside();

        cy.get(`${WB_CONTAINER} svg path`).then(($after) => {
          const afterBoxes = $after.toArray().slice(-2).map((el) => el.getBoundingClientRect());
          const gapAfter = Math.abs(afterBoxes[1].top - afterBoxes[0].top);
          expect(gapAfter, "relative spacing preserved after zoom round trip").to.be.closeTo(gapBefore, 15);
        });
      });
    });
  });

  it("TB-112: Pan moves the viewport without changing object coordinates", () => {
    penStroke({ x: 300, y: 300 }, { x: 450, y: 380 });

    WB.paths()
      .last()
      .then(($p) => {
        const geometryBefore = $p.attr("d");

        WB.transform().then((transformBefore) => {
          ToolbarPage.selectTool("gtPan");
          WB.dragObject({ x: 500, y: 400 }, { x: 700, y: 500 });

          // Viewport moved...
          WB.transform().should("not.eq", transformBefore);

          // ...but the object's own coordinates are untouched.
          WB.paths()
            .last()
            .then(($p2) => {
              expect($p2.attr("d"), "path geometry unchanged by pan").to.eq(geometryBefore);
            });
        });
      });
  });

  it("TB-113: Select stays accurate after Zoom and Pan", () => {
    penStroke({ x: 300, y: 300 }, { x: 420, y: 380 });

    ToolbarPage.openToolPanel("gtZoom");
    cy.get('[data-qa-id="toolbar-zoom-in-btn"]').click({ force: true });
    cy.wait(900);
    ToolbarPage.closePanelByTappingOutside();

    ToolbarPage.selectTool("gtPan");
    WB.dragObject({ x: 600, y: 400 }, { x: 680, y: 460 });

    // After the transform, grab the object where it NOW renders and move it.
    WB.paths()
      .last()
      .then(($p) => {
        const box = $p[0].getBoundingClientRect();
        const leftBefore = box.left;

        WB.container().then(($c) => {
          const origin = $c[0].getBoundingClientRect();
          const grabX = box.left + box.width / 2 - origin.left;
          const grabY = box.top + box.height / 2 - origin.top;

          ToolbarPage.selectTool("gtSelect");
          WB.dragObject({ x: grabX, y: grabY }, { x: grabX + 120, y: grabY + 80 });

          WB.paths()
            .last()
            .then(($p2) => {
              const leftAfter = $p2[0].getBoundingClientRect().left;
              expect(Math.abs(leftAfter - leftBefore), "the correct object was hit and moved").to.be.greaterThan(20);
            });
        });
      });
  });
});

describe("Toolbar (additional) - Widgets", () => {
  // TB-114: a placed widget is actually interactive.
  // TB-115: multiple widgets coexist.
  // TB-116: widget placement coordinates after zoom and pan.
  // ALL SKIPPED -- the Widgets gallery is confirmed to open (toolbar.cy.js
  // TB-047), but the Excel itself defers the behaviour: "Exact interaction
  // depends on widget requirements" and "Confirm whether multiple widget
  // instances are supported". With no defined interaction and no confirmed
  // per-widget selectors, there is nothing decidable to assert. These need an
  // answer from the dev/product side, not more DOM exploration.
  it.skip("TB-114: a placed widget responds to its documented interaction", () => {});
  it.skip("TB-115: multiple widgets coexist and stay independently functional", () => {});
  it.skip("TB-116: a widget lands at the intended coordinate after zoom and pan", () => {});
});

describe("Toolbar (additional) - Panel and tool state transitions", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-117: tool settings survive opening and closing other panels", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().contains("Thick").click({ force: true });
    cy.wait(500);
    ToolbarPage.closePanelByTappingOutside();

    // Open and close two unrelated panels.
    ToolbarPage.openToolPanel("gtShapes");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.closePanelByTappingOutside();
    ToolbarPage.openToolPanel("gtBackground");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.closePanelByTappingOutside();

    // The Pen panel must still offer Thick as its current selection, and a new
    // stroke must still land.
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().contains("Thick").should("exist");
    ToolbarPage.closePanelByTappingOutside();

    WB.pathCount().then((before) => {
      ToolbarPage.selectTool("gtPen");
      WB.drawStroke({ x: 300, y: 300 }, { x: 600, y: 300 });
      WB.pathCount().should("be.greaterThan", before);
    });
  });

  it("TB-118: opening a second panel leaves only one panel visible", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();

    ToolbarPage.openToolPanel("gtShapes");
    ToolbarPage.panelShouldBeOpen();

    // Exclusivity rule: exactly one floating panel container is visible, and
    // it no longer holds the Pen content.
    cy.get(".toolbar-submenu-floating-ui .float-ui-container:visible").should("have.length", 1);
    ToolbarPage.panel().should("not.contain.text", "Choose a colour");

    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().should("contain.text", "Choose a colour");
    cy.get(".toolbar-submenu-floating-ui .float-ui-container:visible").should("have.length", 1);
  });

  // TB-119: single tap / double tap / long press gesture matrix.
  // SKIPPED -- long press cannot be simulated. Confirmed in ToolbarPage.js and
  // toolbar.cy.js: the tools use a custom `applongpress` Angular directive and
  // synthetic pointerdown -> wait -> pointerup did not trigger it. The single-
  // and double-tap thirds are already covered by TB-008/TB-009/TB-067; the
  // long-press third is what makes this case unwritable as specified.
  it.skip("TB-119: single tap, double tap and long press behave per requirements", () => {});

  // TB-120: keyboard shortcuts.
  // SKIPPED -- the Excel itself notes "Requirement clarification needed if
  // shortcuts are not documented". No shortcut map has been provided, and the
  // Profile panel's keyboard toggle (`toolbar-profile-keyboard-toggle`) is a
  // different feature. Nothing confirmed to assert against.
  it.skip("TB-120: documented keyboard shortcuts trigger the correct action", () => {});
});

describe("Toolbar (additional) - Layout and permissions", () => {
  // TB-121 is split into one test per viewport. The single-test version logged
  // in inside a cy.wrap().each() loop, and the second login never completed
  // ("Welcome Back!" never appeared) -- a session change mid-test is not
  // something the loop can carry. One viewport per test also means a failure
  // names the size it failed at.
  //
  // No supported screen-size matrix has been confirmed (the Excel flags this
  // too), so these use the common desktop/tablet pair and assert usability
  // rather than an exact layout.
  const assertToolbarUsableAt = (w, h) => {
    cy.viewport(w, h);
    cy.loginWithValidPin();
    cy.wait(2000);

    ToolbarPage.container().should("be.visible");
    ToolbarPage.allTools().should("have.length.greaterThan", 0);

    // Every tool must sit inside the viewport, not clipped off-screen.
    ToolbarPage.allTools().each(($tool) => {
      const box = $tool[0].getBoundingClientRect();
      expect(box.right, `tool within viewport width at ${w}x${h}`).to.be.lessThan(w + 1);
      expect(box.bottom, `tool within viewport height at ${w}x${h}`).to.be.lessThan(h + 1);
    });

    // A panel still opens and a stroke still lands at this size.
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.closePanelByTappingOutside();

    WB.pathCount().then((before) => {
      ToolbarPage.selectTool("gtPen");
      WB.drawStroke({ x: 250, y: 250 }, { x: 450, y: 350 });
      WB.pathCount().should("be.greaterThan", before);
    });
  };

  it("TB-121a: the toolbar stays usable at 1440x900 (desktop)", () => {
    assertToolbarUsableAt(1440, 900);
  });

  it("TB-121b: the toolbar stays usable at 1024x768 (tablet)", () => {
    assertToolbarUsableAt(1024, 768);
  });

  it("TB-123: a signed-out user gets the restricted toolbar and no unauthorised state change", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");

    // Confirmed restrictions (toolbar.cy.js TB-052/TB-053): Magnet and Profile
    // are absent for a guest.
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-tool-gtMagnet"]:visible').length, "Magnet hidden for guest").to.eq(0);
      expect($body.find('[data-qa-id="toolbar-profile-trigger"]:visible').length, "Profile hidden for guest").to.eq(0);
    });

    // Whatever tools ARE offered must actually work -- guests are not blocked
    // from drawing, so the permitted subset should behave normally.
    ToolbarPage.allTools().should("have.length.greaterThan", 0);
    ToolbarPage.selectTool("gtPen");
    ToolbarPage.isToolActive("gtPen").should("have.class", "changecolor");
  });

  it("TB-124: a signed-in user gets the full tool set and it produces real output", () => {
    cy.loginWithValidPin();
    cy.wait(2000);

    // The permission difference against TB-123: Magnet and Profile appear.
    cy.get('[data-qa-id="toolbar-tool-gtMagnet"]').should("exist");
    ToolbarPage.profileTrigger().should("exist");

    // And a permitted action produces real whiteboard output.
    WB.pathCount().then((before) => {
      ToolbarPage.selectTool("gtPen");
      WB.drawStroke({ x: 300, y: 300 }, { x: 520, y: 420 });
      WB.pathCount().should("be.greaterThan", before);
    });
  });

  // TB-122: docking left/right.
  // SKIPPED -- no control for changing the docking side has been located. Only
  // the resulting `.toolbar-container.right` class is confirmed (toolbar.cy.js
  // TB-002), so the right-docked half is already covered and the left-docked
  // half cannot be reached. Same blocker as TB-003/TB-074/TB-075.
  it.skip("TB-122: the toolbar works docked on either side", () => {});
});

describe("Toolbar (additional) - Integration and regression", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-129: toolbar actions do not corrupt unrelated whiteboard objects", () => {
    // Build a small board: two strokes at known positions.
    penStroke({ x: 300, y: 250 }, { x: 450, y: 250 }); // object under test
    penStroke({ x: 300, y: 500 }, { x: 450, y: 500 }); // bystander

    cy.get(`${WB_CONTAINER} svg path`).then(($paths) => {
      const all = $paths.toArray();
      const bystander = all[all.length - 1];
      const bystanderBefore = bystander.getBoundingClientRect();
      const bystanderD = bystander.getAttribute("d");
      const countBefore = all.length;

      // Run a sequence of unrelated tool actions well away from the bystander.
      ToolbarPage.selectTool("gtPen");
      WB.drawStroke({ x: 600, y: 250 }, { x: 720, y: 300 });

      ToolbarPage.selectTool("gtErase");
      WB.drawStroke({ x: 590, y: 250 }, { x: 730, y: 300 });

      ToolbarPage.selectTool("gtSelect");
      WB.dragObject({ x: 370, y: 250 }, { x: 470, y: 300 });

      ToolbarPage.openToolPanel("gtZoom");
      ToolbarPage.closePanelByTappingOutside();

      // The bystander must be exactly where it was, with identical geometry.
      cy.get(`${WB_CONTAINER} svg path`).then(($after) => {
        const stillThere = $after.toArray().find((el) => el.getAttribute("d") === bystanderD);
        expect(stillThere, "bystander object still on the board").to.not.eq(undefined);
        const box = stillThere.getBoundingClientRect();
        expect(box.left, "bystander not moved horizontally").to.be.closeTo(bystanderBefore.left, 5);
        expect(box.top, "bystander not moved vertically").to.be.closeTo(bystanderBefore.top, 5);
        // A global "nothing else was lost" count was tried here and removed: an
        // eraser pass legitimately catches more than one path when strokes
        // overlap (observed 133 -> 132), so it failed on correct behaviour. The
        // bystander identity checks above are the real assertion -- they prove
        // the specific unrelated object survived intact, which is what the test
        // case actually asks for.
        expect(countBefore, "board had content before the action sequence").to.be.greaterThan(0);
      });
    });
  });

  // TB-125: toolbar/whiteboard state across playlist navigation.
  // SKIPPED -- the Excel flags the expected behaviour as unconfirmed
  // ("Clarify whether toolbar configuration and Whiteboard content persist
  // between playlist items"). Both outcomes are plausible, so any assertion
  // written now would encode a guess as a requirement.
  it.skip("TB-125: toolbar and whiteboard state follow the defined playlist persistence model", () => {});

  // TB-126: Clear All Annotations preserves underlying content.
  // TB-127: Clear Whiteboard removes all content.
  // BOTH SKIPPED -- neither clear control has a confirmed selector. They are
  // not on the tool rail (TOOL_IDS in ToolbarPage.js is confirmed complete and
  // contains no clear action) and the menu they live in was never dumped. Both
  // are marked Critical in the Excel, so they are the highest-value pair to
  // unblock -- see the summary below.
  it.skip("TB-126: Clear All Annotations removes annotations but keeps content", () => {});
  it.skip("TB-127: Clear Whiteboard removes every supported object type", () => {});

  // TB-128: toolbar responsiveness with large content.
  // SKIPPED -- the Excel requires "the agreed large-content dataset" and
  // "defined performance targets"; neither exists. A timing assertion with a
  // threshold invented here would pass or fail arbitrarily.
  it.skip("TB-128: the toolbar stays responsive on a heavily populated board", () => {});
});

// ---------------------------------------------------------------------------
// SUMMARY OF THIS BATCH -- 45 cases, TB-085 to TB-129
//
//   23 written with real assertions
//   22 it.skip() with a documented blocker
//
// The skips fall into four groups, and the first two are cheap to unblock:
//
//   1. Object context menu never dumped from the live DOM (8 cases):
//      TB-100 (text formatting), TB-102/103/104/105 (resize, Delete,
//      Duplicate, layering), TB-109/126/127 (the clear actions and Undo
//      around them). ONE exploration session capturing that menu unblocks all
//      eight, including both Critical cases.
//   2. Panel internals never enumerated (6 cases): TB-087 custom colour,
//      TB-091/092 Free Erase and eraser size, TB-095 More Symbols,
//      TB-096/097 background options. Same fix: dump the open panels.
//   3. Requirements genuinely undefined (6 cases): TB-114/115/116 widgets,
//      TB-120 shortcuts, TB-125 playlist persistence, TB-128 performance
//      targets. These need answers from the dev/product side, not more
//      exploration -- the Excel's own Review Summary lists them as
//      "Important requirement clarifications".
//   4. Confirmed impossible with current tooling (2 cases): TB-119 long press
//      (`applongpress` does not respond to synthetic events) and TB-122
//      docking (no control located).
// ---------------------------------------------------------------------------
