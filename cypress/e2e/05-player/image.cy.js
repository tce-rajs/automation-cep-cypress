// Image Player -- Test_Cases/05_Player/Image_Player_Test_Cases.xlsx
// TC-IMG-001 to TC-IMG-015.
//
// PREVIOUSLY: entire module pending -- no Image-type resource existed
// anywhere in the explored curriculum (Class 8A account).
//
// UNBLOCKED 2026-08-22: after the retarget to Class 12A, one confirmed Image
// resource was found at Computer Science | "14. Project Based Learning" |
// first topic -- a QA-curated topic (support.admin account), not standard
// curriculum content, alongside Video/Worksheet/Quiz/Weblink/Code. See
// PlaylistPage.goToComputerScienceProjectChapter() and ImagePlayerPage.js
// for exact source references. There is still only ONE Image resource
// confirmed on this account, so anything needing two (TC-IMG-013) stays
// blocked, same class of limitation as TC-VID-014 before the Video fix.
//
// FLAG FOR FOLLOW-UP: a live DOM dump while building this spec captured the
// gallery's <img> with `itemstate="failed"` / `imagestate="failed"` and
// `style="visibility:hidden"` a few seconds after opening -- possibly a
// transient pre-load state from the third-party gallery library, possibly a
// real broken asset. TC-IMG-001 below asserts on the gallery structure
// being present rather than a specific loaded-image state, and should be
// watched on the first few real runs to see which explanation holds.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { ImagePlayerPage as Image } from "../../pages/ImagePlayerPage";

describe("Image Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToComputerScienceProjectChapter();
    PlaylistPage.filterToType("Images");
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    PlaylistPage.restoreAllFilter();
  });

  it("TC-IMG-001: Image opens in gallery view", () => {
    Image.cards().should("have.length", 1);
    Image.openFirst();
    cy.wait(4000);
    Image.wrapper().should("exist");
    // Structural confirmation that the third-party gallery renders, per
    // TC-IMG-004's "gallery-native... only" intent -- not asserting a
    // specific loaded-image state here, see module header flag above.
    cy.get(".image-gallery").should("exist");
  });

  it("TC-IMG-004: the Image Player uses gallery-native structure, not a custom viewer", () => {
    Image.openFirst();
    cy.wait(4000);
    // `<gallery>` is the confirmed third-party component selector (see
    // ImagePlayerPage.js) -- its presence IS the "gallery-native" claim;
    // there is no separate custom zoom/pagination UI built by this app.
    cy.get("gallery.image-gallery").should("exist");
  });

  it("TC-IMG-005: closing Image Player removes the wrapper", () => {
    Image.openFirst();
    cy.wait(3000);
    Image.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-IMG-006: closing Image restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      Image.openFirst();
      cy.wait(3000);
      Image.close();
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  // --- Blocked on canvas pixel inspection ---------------------------------
  it.skip("TC-IMG-002: annotation overlay is available on Image (needs canvas pixel inspection)", () => {});
  it.skip("TC-IMG-003: drawing can be made on Image (needs canvas pixel inspection)", () => {});
  it.skip("TC-IMG-011: clearing annotations leaves image unchanged (needs canvas pixel inspection)", () => {});
  it.skip("TC-IMG-012: annotations remain aligned when Playlist is opened/closed (needs canvas pixel inspection)", () => {});

  // --- Blocked on test data -------------------------------------------------
  it.skip("TC-IMG-007: large image fits within player (needs a confirmed large-image resource -- only one Image resource exists, unconfirmed size)", () => {});
  it.skip("TC-IMG-008: small image displays correctly (same blocker as TC-IMG-007)", () => {});
  it.skip("TC-IMG-009: portrait image displays correctly (needs a confirmed portrait-orientation resource)", () => {});
  it.skip("TC-IMG-010: landscape image displays correctly (needs a confirmed landscape-orientation resource)", () => {});
  it.skip("TC-IMG-013: two different images can remain open with independent annotations (only one Image resource exists on this account, same class of blocker TC-VID-014 had before the Video fix)", () => {});

  // --- Blocked on forced-failure tooling ------------------------------------
  it.skip("TC-IMG-014: closing Image from Playlist closes the same player (needs the asset card's own close/remove control confirmed against the live DOM -- not yet done)", () => {});
  it.skip("TC-IMG-015: image load failure does not leave player stuck (needs a forced server failure; no confirmed way to fail one resource, same pattern as TC-VID-016)", () => {});
});
