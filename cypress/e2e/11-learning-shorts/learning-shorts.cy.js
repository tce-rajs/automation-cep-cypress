// Learning Shorts module -- based on Test_Cases/11_Learning_Shorts/Learning_Shorts_Test_Cases.xlsx
// (added 2026-08-23; this module had zero Test_Cases documentation before).
//
// SELECTOR SOURCE: see the header comment in cypress/pages/LearningShortsPage.js
// -- these `data-qa-id`s were read from cep2-workspace's Angular source, not
// the live DOM. Needs a real run to confirm.
//
// WHY THIS SPEC USES THE PLAYLIST-ASSET ENTRY POINT, NOT RECORD START/STOP:
// the toolbar entry point's Record Start button calls the browser's real
// getDisplayMedia() (screen share) + getUserMedia() (mic) -- a native OS
// picker Cypress cannot drive, with no app-level seam to intercept. Recording
// stays untested for that reason (see LearningShortsPage.js). The OTHER
// entry point -- an owned Playlist asset's overflow menu -> Send -- reuses an
// existing video via a plain fetch() and involves no media APIs at all,
// making the Title / Attachments / Share-with-Classes / Send half of this
// module genuinely automatable.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { LearningShortsPage } from "../../pages/LearningShortsPage";

describe("Learning Shorts - Core flow", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
  });

  it("LS-001: the recording panel opens from the Magnet toolbar with Start/Exit visible", () => {
    LearningShortsPage.openViaToolbar();
    LearningShortsPage.recordStartBtn().should("be.visible");
    LearningShortsPage.exitBtn().should("be.visible");
    // Not clicking Start -- see the module header comment on why.
  });

  it("LS-002: sending an existing owned asset opens the revision form with a class picked", () => {
    // Precondition check, not a guess: the Send action only exists on a
    // card where the current teacher owns an overflow-eligible asset. If
    // none exists in the target class/topic, this is a real "nothing to
    // test yet" state, not a broken test -- same as MODULE_COVERAGE.md's
    // "resource type absent from curriculum" cases.
    //
    // CONFIRMED 2026-08-23: `.first()` over ALL overflow-eligible owned
    // assets can land on a non-video card (e.g. a Worksheet PDF) once the
    // topic accumulates other owned content -- clicking that card's
    // overflow icon opens the PDF itself instead of a Send dropdown, since
    // its overflow icon sits inside the card's own click target. Filtering
    // to Video first keeps `.first()` restricted to video-type cards, which
    // is what this flow (and LearningShortsPage.openViaExistingAsset's
    // playlist-asset-send-btn) actually expects.
    PlaylistPage.filterToType("Video");
    LearningShortsPage.findOwnedOverflowAssetCard((card) => {
      if (!card) {
        cy.log("No owned, overflow-eligible asset in this class/topic -- nothing to send. Skipping.");
        return;
      }

      LearningShortsPage.openViaExistingAsset();
      LearningShortsPage.titleInput().should("be.visible").and("not.have.value", "");

      cy.get("body").then(($body) => {
        const hasClasses = $body.find('[data-qa-id^="learning-shorts-class-checkbox-"]').length > 0;
        if (!hasClasses) {
          cy.log('No classes available ("Sorry, no classes found!") -- Send stays disabled by design.');
          return;
        }
        LearningShortsPage.classCheckbox(0).check({ force: true });
        LearningShortsPage.sendBtn().should("be.visible").and("not.be.disabled");
        // Deliberately not clicking Send -- this would really dispatch an
        // assignment/revision to a class on the shared QA account, the same
        // "would destroy/pollute shared QA data" caution MODULE_COVERAGE.md
        // already applies elsewhere (TC-AR destructive-removal cases).
      });
    });
  });

  it("LS-006: Exit before recording closes the panel with no video produced", () => {
    LearningShortsPage.openViaToolbar();
    LearningShortsPage.exitBtn().should("be.visible").click({ force: true });
    cy.wait(500);
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="learning-shorts-record-start-btn"]').length).to.eq(0);
      expect($body.find('[data-qa-id="learning-shorts-exit-btn"]').length).to.eq(0);
    });
  });

  it("LS-012: Discard exits the compose form without saving or sending", () => {
    PlaylistPage.filterToType("Video");
    LearningShortsPage.findOwnedOverflowAssetCard((card) => {
      if (!card) {
        cy.log("No owned, overflow-eligible asset in this class/topic -- nothing to send. Skipping.");
        return;
      }
      LearningShortsPage.openViaExistingAsset();
      LearningShortsPage.titleInput().should("be.visible");
      LearningShortsPage.discardBtn().should("be.visible").click({ force: true });
      cy.wait(500);
      cy.get("body").then(($body) => {
        expect($body.find('[data-qa-id="learning-shorts-title-input"]').length).to.eq(0);
      });
    });
  });
});

describe("Learning Shorts - Login guard", () => {
  it("LS-013: is unavailable to an unauthenticated user", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-tool-gtMagnet"]').length).to.eq(0);
    });
  });
});

// ---------------------------------------------------------------------------
// NOT YET AUTOMATED -- and deliberately not written as guesses.
//
// Record Start/Stop: real getDisplayMedia()/getUserMedia() calls with no
//   app-level seam to intercept. Would need either stubbing
//   navigator.mediaDevices in cy.visit({ onBeforeLoad }) with a synthetic
//   MediaStream (e.g. canvas.captureStream()), or launching Chrome with
//   --use-fake-ui-for-media-stream / --use-fake-device-for-media-stream /
//   --auto-select-desktop-capture-source -- neither set up in this project's
//   Cypress config yet.
//
// Save to Playlist (learning-shorts-save-playlist-btn) and Save & Send as
//   Revision (learning-shorts-save-revision-btn): both only reachable after
//   a real recording completes (isVideoReady from Record Stop), which is
//   blocked by the above.
//
// Actually submitting Send (learning-shorts-send-btn click): would create a
//   real assignment/revision on the shared QA account's classes -- left
//   verified-but-unclicked (asserted enabled) rather than exercised, same
//   caution as other destructive/data-creating actions in this suite.
//
// Delete Attachment / Recapture (learning-shorts-delete-attachment-btn /
//   -recapture-btn): only rendered in revisionMode with isAttachmentDeleted
//   state -- reachable from LS-002's flow but not yet exercised; a natural
//   next addition once the Send precondition (LS-002) is confirmed to
//   reliably find a card on a real run.
// ---------------------------------------------------------------------------
