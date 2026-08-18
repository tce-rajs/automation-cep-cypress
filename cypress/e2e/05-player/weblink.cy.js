// Weblink Player -- Test_Cases/05_Player_new/Weblink_Player_Test_Cases.xlsx
// TC-WEB-001 to TC-WEB-015. This spec validates the WEBLINK player only.
//
// ENTIRE MODULE PENDING -- blocked on test data, not on test code.
//
// No Weblink-type resource exists anywhere in the explored curriculum -- 
// same confirmation method as the Image player.
//
// Every case is listed individually rather than lumped into one skip, so the
// pending count is accurate and each case can be enabled the moment content
// exists. Nothing here is written speculatively: once a Weblink resource is
// seeded into QA, these need real selectors confirmed against the live DOM
// before the bodies are filled in.

describe("Weblink Player (pending -- no Weblink resource in the curriculum)", () => {
  it.skip("TC-WEB-001: Verify Weblink opens inside iframe on Whiteboard", () => {});
  it.skip("TC-WEB-002: Verify YouTube URL is rewritten to embed form", () => {});
  it.skip("TC-WEB-003: Verify annotation overlay is available over Weblink iframe", () => {});
  it.skip("TC-WEB-004: Verify closing Weblink Player removes wrapper", () => {});
  it.skip("TC-WEB-005: Verify closing Weblink restores prior Whiteboard pan/zoom", () => {});
  it.skip("TC-WEB-006: Verify Weblink spinner is shown while page is loading", () => {});
  it.skip("TC-WEB-007: Verify stored Weblink is resolved before page is loaded", () => {});
  it.skip("TC-WEB-008: Verify current stored Weblink is loaded instead of a previous cached link", () => {});
  it.skip("TC-WEB-009: Verify links and controls inside Weblink respond", () => {});
  it.skip("TC-WEB-010: Verify Pan tool prevents interaction with framed page", () => {});
  it.skip("TC-WEB-011: Verify annotations remain fixed while page content scrolls", () => {});
  it.skip("TC-WEB-012: Verify clearing annotations keeps Weblink loaded", () => {});
  it.skip("TC-WEB-013: Verify closing Weblink from Playlist closes player", () => {});
  it.skip("TC-WEB-014: Verify unreachable Weblink does not leave spinner indefinitely", () => {});
  it.skip("TC-WEB-015: Verify site that refuses framing leaves player open without crashing", () => {});
});
