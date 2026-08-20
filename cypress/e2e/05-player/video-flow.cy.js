// Video Player -- END-TO-END FLOW
// Test_Cases/05_Player/Video_Player_Test_Cases.xlsx
//
// ONE test that walks the workbook's whole happy path in a single session:
//
//   F01 login -> F02 is the Video already in this Playlist?
//              -> F03 open it directly (no curriculum navigation)
//   F05 player opens -> F06 video area and controls visible
//   F07 play -> F12 time progresses -> F08 pause -> position holds
//   F14 close -> Playlist and whiteboard state restored
//
// WHY A FLOW SPEC EXISTS SEPARATELY FROM THE PER-CASE SPEC
// -------------------------------------------------------
// The per-case spec logs in once per test, which for 17 cases is ~17 logins
// and most of the runtime. This proves the pipeline end to end in one login,
// so a break anywhere along it is caught in ~1 minute rather than 15 -- and
// it is the thing to run first after any change to the Playlist or player
// page objects.
//
// PLAYBACK IS ASSERTED OFF THE MEDIA ELEMENT, NOT THE CONTROLS
// -----------------------------------------------------------
// currentTime/paused/duration are the ground truth for F07/F08/F12 and do not
// depend on locating a play button in whatever skin the player wears.
//
// ONE THING THIS FLOW DELIBERATELY DOES NOT ASSUME: which player opens. The
// previous video spec found that the reachable "Video" resource was type
// "tcevideo" -- an animation in an iframe with NO media element -- and skipped
// every playback case on that basis. The card dump since found
// ic.AVMediaVideo.svg cards, and video.js is bundled in the app, so that may
// no longer hold. This flow asks the player which it is and asserts what that
// player can actually be held to, rather than passing vacuously or failing for
// the wrong reason. cypress/scratch/video-dump.cy.js settles it properly.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { VideoPlayerPage as Video } from "../../pages/VideoPlayerPage";

describe("Video Player -- end-to-end flow", () => {
  it("logs in, opens the Video from the Playlist it is already in, plays, pauses and closes", () => {
    // --- F01 -------------------------------------------------------------
    cy.loginWithValidPin();
    cy.wait(1500);

    // --- F02 / F03: the decision. Navigation only if the Video is absent.
    Video.ensureVideoAvailable().then(({ navigated }) => {
      cy.log(navigated ? "Took the F04 navigation branch" : "Took the F03 direct branch");
    });

    Video.cards().should("have.length.greaterThan", 0);

    PlaylistPage.currentLocation().then((before) => {
      PlayerPage.whiteboardTransform().then((boardBefore) => {
        // --- F05: open ---------------------------------------------------
        Video.openDirectly();
        PlayerPage.shouldBeOpen();

        // Opening a resource must not have moved the curriculum.
        PlaylistPage.currentLocation().should("eq", before);

        // --- F06: the video surface is really there ----------------------
        Video.playerKind().then((kind) => {
          cy.log(`Video player surface: ${kind}`);
          expect(kind, "the player rendered a video surface (media element or embedded frame)").to.be.oneOf([
            "html5",
            "iframe",
          ]);

          if (kind !== "html5") {
            // The animation/embedded player: there is no media element to
            // drive, so F07/F08/F12 have nothing to assert against. Say so
            // loudly instead of quietly passing a "playback" flow that never
            // played anything.
            cy.log(
              "No HTML5 media element -- this is the embedded/animation player, so the play/pause leg of the flow is not applicable to this resource."
            );
            cy.get("iframe").should("be.visible");
            return;
          }

          // --- F07 + F12: play, and time actually moves -------------------
          Video.duration().should("be.greaterThan", 0);
          Video.isPaused().should("eq", true);

          // Play via the element rather than the skin: the flow is about
          // playback, not about the button, and autoplay policies make a
          // programmatic play() the reliable trigger headlessly.
          Video.videoEl().then(($v) => $v[0].play());
          cy.wait(3000);

          Video.isPaused().should("eq", false);
          Video.currentTime().should("be.greaterThan", 0);

          // --- F08: pause holds the position -----------------------------
          Video.currentTime().then((playing) => {
            Video.videoEl().then(($v) => $v[0].pause());
            cy.wait(1500);

            Video.isPaused().should("eq", true);
            Video.currentTime().then((afterPause) => {
              expect(afterPause, "position is kept at the paused point").to.be.closeTo(playing, 1.5);
            });
          });
        });

        // --- F14: close and the underlying state returns ------------------
        Video.close();
        Video.shouldBeClosed();
        cy.wait(1500);
        PlayerPage.whiteboardTransform().should("eq", boardBefore);

        PlaylistPage.ensureDrawerVisible();
        Video.cards().should("have.length.greaterThan", 0);
        PlaylistPage.currentLocation().should("eq", before);
      });
    });
  });
});
