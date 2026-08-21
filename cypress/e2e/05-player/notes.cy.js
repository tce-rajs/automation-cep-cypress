// Notes Player -- Test_Cases/05_Player/Notes_Player_Test_Cases.xlsx
// TC-NOT-001 to TC-NOT-008. This spec validates the NOTES player only.
//
// ENTIRE MODULE PENDING -- blocked on test data, not on test code.
//
// No Notes-type resource exists in the explored curriculum. Additionally 
// the dev team has noted the Notes player looks unfinished -- it loads the 
// resource URL string straight into an iframe instead of fetching note 
// content, and has no editing UI. Worth confirming it is meant to be 
// tested before seeding content for it.
//
// Every case is listed individually rather than lumped into one skip, so the
// pending count is accurate and each case can be enabled the moment content
// exists. Nothing here is written speculatively: once a Notes resource is
// seeded into QA, these need real selectors confirmed against the live DOM
// before the bodies are filled in.

describe("Notes Player (pending -- no Notes resource in the curriculum)", () => {
  it.skip("TC-NOT-001: Verify Notes resource opens Notes Player", () => {});
  it.skip("TC-NOT-002: Verify Notes Player creates iframe imperatively", () => {});
  it.skip("TC-NOT-003: Verify current Notes implementation uses the resource URL string in iframe blob", () => {});
  it.skip("TC-NOT-004: Verify Notes editing is not treated as a confirmed capability", () => {});
  it.skip("TC-NOT-005: Verify closing Notes removes wrapper", () => {});
  it.skip("TC-NOT-006: Verify closing Notes restores prior Whiteboard pan/zoom", () => {});
  it.skip("TC-NOT-007: Verify Notes player does not expose an editing UI", () => {});
  it.skip("TC-NOT-008: Verify closing Notes restores prior board view when it is the last player", () => {});
});
