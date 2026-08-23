// Weblink Player -- Test_Cases/05_Player/Weblink_Player_Test_Cases.xlsx
// TC-WEB-001 to TC-WEB-015.
//
// PREVIOUSLY: entire module pending -- no Weblink-type resource existed
// anywhere in the explored curriculum (Class 8A account).
//
// UNBLOCKED 2026-08-22: after the retarget to Class 12A, one confirmed
// Weblink resource was found at Computer Science | "14. Project Based
// Learning" | first topic -- a QA-curated topic (support.admin account).
// CONFIRMED live: this resource is a YouTube link, and its iframe `src`
// resolves to "https://www.youtube.com/embed/KT3OHnCach0" -- direct evidence
// the app's YouTube-embed rewrite (toYouTubeEmbed() in cep2-workspace's
// weblink.component.ts) is active. See
// PlaylistPage.goToComputerScienceProjectChapter() and WeblinkPlayerPage.js.
// Only ONE Weblink resource is confirmed on this account, so anything
// needing two (TC-WEB-008) stays blocked.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { WeblinkPlayerPage as Weblink } from "../../pages/WeblinkPlayerPage";

describe("Weblink Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToComputerScienceProjectChapter();
    PlaylistPage.filterToType("Weblink");
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    PlaylistPage.restoreAllFilter();
  });

  it("TC-WEB-001: Weblink opens inside an iframe on the Whiteboard", () => {
    Weblink.cards().should("have.length", 1);
    Weblink.openFirst();
    cy.wait(5000);
    Weblink.wrapper().should("exist");
    Weblink.iframe().should("exist");
  });

  it("TC-WEB-002: a YouTube URL is rewritten to its embed form", () => {
    Weblink.openFirst();
    cy.wait(5000);
    Weblink.iframe().should("have.attr", "src").and("match", /^https:\/\/www\.youtube\.com\/embed\//);
  });

  // "Available" here means the annotation/toolbox components are mounted
  // and reachable, per confirmed DOM structure (<app-annotation>,
  // <app-mini-toolbox> both present in a live dump) -- distinct from
  // actually verifying drawn pixels, which this suite has no tooling for.
  it("TC-WEB-003: an annotation overlay is available over the Weblink iframe", () => {
    Weblink.openFirst();
    cy.wait(5000);
    Weblink.wrapper().find("app-annotation").should("exist");
    Weblink.wrapper().find("app-mini-toolbox").should("exist");
  });

  it("TC-WEB-004: closing Weblink Player removes the wrapper", () => {
    Weblink.openFirst();
    cy.wait(5000);
    Weblink.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-WEB-005: closing Weblink restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      Weblink.openFirst();
      cy.wait(5000);
      Weblink.close();
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  // --- Covered elsewhere -----------------------------------------------------
  it.skip("TC-WEB-007: stored Weblink is resolved before page is loaded (same confirmed mechanism as TC-WEB-002 -- the app fetches/decodes the URL before setting the iframe src)", () => {});

  // --- Blocked on canvas pixel inspection ------------------------------------
  it.skip("TC-WEB-011: annotations remain fixed while page content scrolls (needs canvas pixel inspection)", () => {});
  it.skip("TC-WEB-012: clearing annotations keeps Weblink loaded (needs a drawn annotation first -- same blocker)", () => {});

  // --- Blocked on test data ---------------------------------------------------
  it.skip("TC-WEB-006: a spinner is shown while the page is loading (timing-dependent -- no confirmed selector for the ngx-spinner instance, and the load is usually too fast to reliably catch)", () => {});
  it.skip("TC-WEB-008: the current stored Weblink loads instead of a previous cached link (needs a second, distinct Weblink resource -- only one confirmed on this account, same class of blocker TC-VID-014 had before the Video fix)", () => {});
  it.skip("TC-WEB-014: an unreachable Weblink does not leave a spinner indefinitely (needs a confirmed broken-URL resource; no forced-failure tooling for this)", () => {});
  it.skip("TC-WEB-015: a site that refuses framing leaves the player open without crashing (needs a confirmed X-Frame-Options-restricted resource; the one confirmed resource is a YouTube embed, which is designed to be frameable)", () => {});

  // --- Blocked on cross-origin iframe content --------------------------------
  it.skip("TC-WEB-009: links and controls inside the Weblink respond (cross-origin YouTube iframe -- Cypress cannot reach into its content, same class of blocker as TC-TCE-012)", () => {});
  it.skip("TC-WEB-010: Pan tool prevents interaction with the framed page (no confirmed way to observe iframe interactivity, same blocker as TC-TCE-015)", () => {});

  // --- Blocked on unconfirmed selector -----------------------------------------
  it.skip("TC-WEB-013: closing Weblink from the Playlist closes the same player (needs the asset card's own close/remove control confirmed against the live DOM -- not yet done)", () => {});
});
