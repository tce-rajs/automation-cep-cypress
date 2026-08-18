// Toolbar module automation, based on Test_Cases/05_Toolbar/Toolbar_Test_Cases.xlsx
//
// NOTE ON FOLDER NUMBERING: the Excel lives in Test_Cases/05_Toolbar/ but
// 05-player/ already exists here, so this spec is 06-toolbar/ to avoid two
// different modules sharing a number. The Excel folder should probably be
// renamed 06_Toolbar for consistency.
//
// This is the FIRST batch of Toolbar coverage. Every selector used here was
// confirmed by dumping the live DOM, per the project rule in claude/README.md.
// Cases that need interactions or evidence not yet confirmed are listed at the
// bottom of this file rather than written speculatively.

import { ToolbarPage, TOOL_IDS } from "../../pages/ToolbarPage";

describe("Toolbar - Display and docking", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-001: displays the vertical toolbar on the whiteboard", () => {
    ToolbarPage.container().should("exist");
    ToolbarPage.allTools().should("have.length.greaterThan", 0);
  });

  it("TB-002: docks the toolbar to the right by default", () => {
    // Docking side is expressed as a class on the container: "toolbar-container right".
    ToolbarPage.container().should("have.class", "right");
  });

  it("TB-004: shows the configured tools in the expected order", () => {
    ToolbarPage.allTools().should("have.length", TOOL_IDS.length);
    ToolbarPage.allTools().then(($tools) => {
      const actual = $tools.toArray().map((el) => el.getAttribute("data-qa-id").replace("toolbar-tool-", ""));
      expect(actual).to.deep.equal(TOOL_IDS);
    });
  });

  it("TB-005: does not render a tool that is not configured", () => {
    // Every rendered tool must be one of the known configured tools -- an
    // unknown id would mean the configuration is not being respected.
    ToolbarPage.allTools().then(($tools) => {
      const rendered = $tools.toArray().map((el) => el.getAttribute("data-qa-id").replace("toolbar-tool-", ""));
      rendered.forEach((id) => expect(TOOL_IDS).to.include(id));
    });
  });
});

describe("Toolbar - Active tool", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-007: has Select as the default active tool", () => {
    // The active tool is marked by `.toolpadding.changecolor` on an inner
    // element -- the outer .tool-container class never changes.
    ToolbarPage.isToolActive("gtSelect").should("have.class", "changecolor");
  });

  it("TB-006: keeps exactly one tool active at a time", () => {
    ToolbarPage.activeTools().should("have.length", 1);
    ToolbarPage.selectTool("gtPen");
    ToolbarPage.activeTools().should("have.length", 1);
    ToolbarPage.selectTool("gtShapes");
    ToolbarPage.activeTools().should("have.length", 1);
  });

  it("TB-008: selects the Pen on a single tap", () => {
    ToolbarPage.selectTool("gtPen");
    ToolbarPage.isToolActive("gtPen").should("have.class", "changecolor");
    ToolbarPage.isToolActive("gtSelect").should("not.have.class", "changecolor");
  });

  it("TB-016: selects the Eraser on a single tap", () => {
    ToolbarPage.selectTool("gtErase");
    ToolbarPage.isToolActive("gtErase").should("have.class", "changecolor");
  });

  it("TB-067: a single tap selects the tool without opening its panel", () => {
    // Confirmed: after a single tap the settings panel is still display:none.
    // This is what makes TB-008/009 (single vs double tap) distinct cases.
    ToolbarPage.selectTool("gtPen");
    ToolbarPage.isToolActive("gtPen").should("have.class", "changecolor");
    ToolbarPage.panelShouldBeClosed();
  });
});

describe("Toolbar - Tool panels", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-009: opens the Pen settings panel on a double tap", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().should("contain.text", "Choose a colour");
  });

  it("TB-011: offers preset Pen colours", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().find(".penColorOption").should("have.length.greaterThan", 1);
    // Exactly one preset is marked as the current selection.
    ToolbarPage.panel().find(".penColorOption.selected").should("have.length", 1);
  });

  it("TB-013: offers Pen thickness options", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ["Thin", "Normal", "Thick", "Strong"].forEach((size) => {
      ToolbarPage.panel().should("contain.text", size);
    });
  });

  it("TB-017: opens the Eraser settings panel on a double tap", () => {
    ToolbarPage.openToolPanel("gtErase");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-029: opens the Shapes panel", () => {
    ToolbarPage.openToolPanel("gtShapes");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-034: opens the Background panel", () => {
    ToolbarPage.openToolPanel("gtBackground");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-037: opens the Zoom panel", () => {
    ToolbarPage.openToolPanel("gtZoom");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-047: opens the Widgets gallery", () => {
    ToolbarPage.openToolPanel("gtWidgets");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-070: reopens a panel after it has been closed", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.closePanelByTappingOutside();
    ToolbarPage.panelShouldBeClosed();
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
  });

  it("TB-071: opening a second panel replaces the first", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.panel().should("contain.text", "Choose a colour");

    ToolbarPage.openToolPanel("gtBackground");
    ToolbarPage.panelShouldBeOpen();
    // Only one submenu container exists, so "replaced" means its contents
    // changed -- the Pen-specific heading must be gone.
    ToolbarPage.panel().should("not.contain.text", "Choose a colour");
  });

  it("TB-072: closes the panel when tapping outside it", () => {
    ToolbarPage.openToolPanel("gtPen");
    ToolbarPage.panelShouldBeOpen();
    ToolbarPage.closePanelByTappingOutside();
    ToolbarPage.panelShouldBeClosed();
  });
});

describe("Toolbar - Zoom readout", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-038: shows the current zoom percentage on the rail", () => {
    ToolbarPage.zoomLabel().should("match", /\d+%/);
  });
});

describe("Toolbar - Profile", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
  });

  it("TB-065: opens the Profile panel", () => {
    ToolbarPage.openProfile();
    ToolbarPage.profilePanel().should("be.visible");
  });

  it("TB-066: shows the Profile options", () => {
    ToolbarPage.openProfile();
    cy.get('[data-qa-id="toolbar-profile-signout-btn"]').should("exist");
    cy.get('[data-qa-id="toolbar-profile-dark-mode-toggle"]').should("exist");
    cy.get('[data-qa-id="toolbar-profile-keyboard-toggle"]').should("exist");
    cy.get('[data-qa-id="toolbar-profile-feedback-btn"]').should("exist");
  });
});

describe("Toolbar - Signed-out behaviour", () => {
  it("TB-053: hides the Profile control when signed out", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-profile-trigger"]:visible').length).to.eq(0);
      expect($body.find('[data-qa-id="toolbar-user-avatar"]:visible').length).to.eq(0);
    });
  });

  it("TB-052: hides the Magnet tool when signed out", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-tool-gtMagnet"]:visible').length).to.eq(0);
    });
  });
});

// ---------------------------------------------------------------------------
// NOT YET AUTOMATED -- and deliberately not written as guesses.
//
// Long press (TB-010, TB-018, TB-068): the tool elements carry a custom
//   `applongpress` Angular directive. Synthetic pointerdown/mousedown -> wait
//   -> pointerup/mouseup did NOT trigger it (panel stayed closed), the same
//   class of problem as the CDK drag simulation in claude/APP_QUIRKS.md.
//   Faking these with a double tap would report a pass for an interaction
//   that was never exercised.
//
// Drawing/annotation outcomes (TB-014, TB-021-TB-028, TB-030-TB-033, TB-051,
//   TB-063, TB-064, TB-076-TB-079): these need marks actually drawn on the
//   whiteboard canvas and then inspected. The suite has no canvas
//   pixel-inspection tooling -- the same blocker as TC-VID-003/004 and
//   TC-PDF-006/007 in player.cy.js.
//
// Docking left (TB-003, TB-074, TB-075): no control for changing the docking
//   side has been located yet; only the resulting `.toolbar-container.right`
//   class is confirmed. Needs further exploration.
//
// Magnet eligibility (TB-054-TB-060): depends on academic-year and attendance
//   state on the account, which has not been confirmed for this QA user.
//
// Undo/Redo initial state (TB-061, TB-062): the tools render with no disabled
//   attribute and no distinguishing class in the dump, so "disabled" is not
//   yet observable. Needs exploration of how the app expresses that state.
// ---------------------------------------------------------------------------
