// Image Player -- Test_Cases/05_Player_new/Image_Player_Test_Cases.xlsx
// TC-IMG-001 to TC-IMG-015. This spec validates the IMAGE player only.
//
// ENTIRE MODULE PENDING -- blocked on test data, not on test code.
//
// No Image-type resource exists anywhere in the explored curriculum. 
// Confirmed by filtering the Playlist to every available type across the 
// target class and the HTML chapter -- the Image filter returns nothing, 
// so there is no resource to open.
//
// Every case is listed individually rather than lumped into one skip, so the
// pending count is accurate and each case can be enabled the moment content
// exists. Nothing here is written speculatively: once a Image resource is
// seeded into QA, these need real selectors confirmed against the live DOM
// before the bodies are filled in.

describe("Image Player (pending -- no Image resource in the curriculum)", () => {
  it.skip("TC-IMG-001: Verify Image opens in gallery view", () => {});
  it.skip("TC-IMG-002: Verify annotation overlay is available on Image", () => {});
  it.skip("TC-IMG-003: Verify drawing can be made on Image", () => {});
  it.skip("TC-IMG-004: Verify Image Player uses gallery-native zoom/pagination behavior only", () => {});
  it.skip("TC-IMG-005: Verify closing Image Player removes wrapper", () => {});
  it.skip("TC-IMG-006: Verify closing Image restores prior Whiteboard pan/zoom", () => {});
  it.skip("TC-IMG-007: Verify large image fits within player", () => {});
  it.skip("TC-IMG-008: Verify small image displays correctly", () => {});
  it.skip("TC-IMG-009: Verify portrait image displays correctly", () => {});
  it.skip("TC-IMG-010: Verify landscape image displays correctly", () => {});
  it.skip("TC-IMG-011: Verify clearing annotations leaves image unchanged", () => {});
  it.skip("TC-IMG-012: Verify annotations remain aligned when Playlist is opened/closed", () => {});
  it.skip("TC-IMG-013: Verify two different images can remain open with independent annotations", () => {});
  it.skip("TC-IMG-014: Verify closing Image from Playlist closes the same player", () => {});
  it.skip("TC-IMG-015: Verify image load failure does not leave player stuck", () => {});
});
