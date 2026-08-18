// Video Player -- Test_Cases/05_Player_new/Video_Player_Test_Cases.xlsx
// TC-VID-001 to TC-VID-016. This spec validates the VIDEO player only.
//
// CONFIRMED APP BEHAVIOUR (carried over from the original combined spec, not
// re-assumed): the one "Video" resource reachable in this curriculum renders
// through the same interactive tce-player pipeline as TCE resources ("Click
// Play to view the animation"), NOT a plain HTML5 <video>/video-js element.
// "tcevideo" and "video" are distinct resource types mapped to different
// players -- that is by design, not a gap. Every test case here that assumes
// video-js controls is therefore untestable against this resource, and is
// skipped with that reason rather than rewritten to pass against a different
// player.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";

describe("Video Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToKnownContentTopic();
    PlaylistPage.filterToType("Video");
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    PlaylistPage.restoreAllFilter();
  });

  it("TC-VID-001: Video resource opens its player", () => {
    // The animation player's instructional text is visibly rendered but
    // unreachable via cy.contains() even with Shadow DOM piercing -- likely a
    // dynamically-injected iframe. The confirmed close icon is the reliable
    // "opened" signal.
    PlayerPage.openFirstResourceCard();
    cy.wait(6000);
    PlayerPage.shouldBeOpen();
  });

  it("TC-VID-005: closing Video Player removes the wrapper", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(2500);
    PlayerPage.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-VID-006: closing Video restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      PlayerPage.openFirstResourceCard();
      cy.wait(6000);
      cy.get(PlayerPage.closeIconSelector(), { timeout: 15000 }).first().click({ force: true });
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  // --- Not automatable against this resource type -------------------------
  // Confirmed by the dev team: this resource is type "tcevideo", which routes
  // to the interactive animation player. There is no <video> element to
  // control, so playback/volume/fullscreen/seek cases cannot apply here.
  it.skip("TC-VID-002: standard video playback controls work (resource is 'tcevideo' -- no HTML5 video element by design)", () => {});
  it.skip("TC-VID-008: video play, pause and seek work (same reason as TC-VID-002)", () => {});
  it.skip("TC-VID-009: volume and fullscreen controls work (same reason as TC-VID-002)", () => {});

  // Annotation over video needs canvas pixel inspection -- the suite has no
  // visual-regression tooling. Note this is NOT the same as whiteboard
  // drawing, which IS automatable via the inner <svg> (see
  // toolbar-additional.cy.js); the video overlay is a separate surface.
  it.skip("TC-VID-003: pausing video exposes annotation overlay (needs canvas pixel inspection)", () => {});
  it.skip("TC-VID-004: drawing can be made on paused video frame (needs canvas pixel inspection)", () => {});
  it.skip("TC-VID-011: annotations survive play/pause and seeking (needs canvas pixel inspection)", () => {});
  it.skip("TC-VID-012: clearing annotations does not stop playback (needs canvas pixel inspection)", () => {});

  // Learning Shorts is a magnet-gated module -- it needs the magnet-enabled
  // PIN and class, which this account does not have. Blocked on credentials,
  // not on test code.
  it.skip("TC-VID-007: Learning Short opens in Video Player (Learning Shorts is magnet-gated -- needs the magnet PIN/class)", () => {});
  it.skip("TC-VID-010: a newly saved Learning Short is playable from Playlist (magnet-gated, as TC-VID-007)", () => {});

  // Needs controls/flows not yet located in the live DOM.
  it.skip("TC-VID-013: Pan tool disables video control interaction (no confirmed way to observe control interactivity in the injected player)", () => {});
  it.skip("TC-VID-014: two videos open together without cross-close (only one Video resource exists in this curriculum)", () => {});
  it.skip("TC-VID-015: Close All Resources stops all video playback ('Close All Resources' control not located in the live DOM)", () => {});
  it.skip("TC-VID-016: failed video load does not leave spinner indefinitely (needs a forced server failure; no confirmed way to fail one resource)", () => {});
});
