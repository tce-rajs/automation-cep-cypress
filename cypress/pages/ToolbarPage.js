// Page Object for the Whiteboard Toolbar (the vertical tool rail), based on
// Test_Cases/06_Toolbar/Toolbar_Test_Cases.xlsx.
//
// Every selector below was confirmed by dumping the live DOM (see the project
// rule in claude/README.md -- verify, don't guess). Confirmed facts:
//
//   * The rail lives in `.toolbar-container`, whose SECOND class is the docking
//     side: "toolbar-container right" by default.
//   * Each tool is `[data-qa-id="toolbar-tool-gtXxx"]` (also `id="tool-gtXxx"`),
//     with the outer class always "tool-container" -- it does NOT change when
//     the tool is selected.
//   * The ACTIVE tool is marked on an inner element instead: the active tool
//     contains `.toolpadding.changecolor`. At rest that is gtSelect.
//   * A SINGLE tap selects a tool. It does NOT open the tool's settings panel;
//     the panel stays display:none. A DOUBLE tap opens it. (Long press is
//     documented as another way in, but see the note on longPress below.)
//   * The settings panel is `.toolbar-submenu-floating-ui .float-ui-container`,
//     which is display:none/aria-hidden=true while closed and
//     display:block/opacity:1/aria-hidden=false while open. Its inner content
//     is `.subToolBar.open`.

export const TOOL_IDS = [
  "gtSelect",
  "gtWidgets",
  "gtBackground",
  "gtPan",
  "gtInserttext",
  "gtPen",
  "gtErase",
  "gtShapes",
  "gtZoom",
  "gtMagnet",
  "gtUndo",
  "gtRedo",
];

export const ToolbarPage = {
  container() {
    return cy.get(".toolbar-container");
  },

  rail() {
    return cy.get(".toolbar-container .tool").first();
  },

  tool(toolId) {
    return cy.get(`[data-qa-id="toolbar-tool-${toolId}"]`);
  },

  allTools() {
    return cy.get('[data-qa-id^="toolbar-tool-"]');
  },

  // Selecting a tool is a single tap; the settings panel does not open.
  selectTool(toolId) {
    this.tool(toolId).click({ force: true });
    cy.wait(600);
  },

  // Opening a tool's settings panel needs a double tap -- confirmed: after a
  // single tap the panel was still display:none, after a double tap it was
  // display:block / aria-hidden="false".
  openToolPanel(toolId) {
    this.tool(toolId).dblclick({ force: true });
    cy.wait(1200);
  },

  // The active tool carries `.toolpadding.changecolor` on an inner element.
  activeTools() {
    return cy.get('[data-qa-id^="toolbar-tool-"] .toolpadding.changecolor');
  },

  isToolActive(toolId) {
    return this.tool(toolId).find(".toolpadding");
  },

  panel() {
    return cy.get(".toolbar-submenu-floating-ui .float-ui-container");
  },

  panelShouldBeOpen() {
    this.panel().should("have.attr", "aria-hidden", "false").and("be.visible");
  },

  panelShouldBeClosed() {
    this.panel().should("have.attr", "aria-hidden", "true");
  },

  // Closes an open panel by tapping the whiteboard away from the rail.
  closePanelByTappingOutside() {
    cy.get("body").click(200, 400, { force: true });
    cy.wait(800);
  },

  // The zoom percentage is rendered as text inside the rail (e.g. "100%").
  zoomLabel() {
    return this.rail().invoke("text");
  },

  profileTrigger() {
    return cy.get('[data-qa-id="toolbar-profile-trigger"], [data-qa-id="toolbar-user-avatar"]').first();
  },

  openProfile() {
    this.profileTrigger().click({ force: true });
    cy.wait(1000);
  },

  profilePanel() {
    return cy.get(".user-profile-floating-ui .float-ui-container");
  },

  // NOT IMPLEMENTED: long press (TB-010, TB-018, TB-068).
  // The tool elements carry a custom Angular directive (`applongpress`), and
  // dispatching synthetic pointerdown/mousedown -> wait -> pointerup/mouseup
  // did NOT trigger it -- the panel stayed closed. This is the same class of
  // problem as the CDK drag simulation recorded in claude/APP_QUIRKS.md.
  // Double tap is a confirmed working alternative for opening panels, so the
  // long-press-specific cases are left unautomated rather than faked with a
  // double tap, which would report a pass for an interaction never tested.
};
