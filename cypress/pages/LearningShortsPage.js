// Page Object for Learning Shorts (screen recording -> title -> share with
// classes -> send), reachable either from the Toolbar's Magnet submenu (real
// recording) or from an owned Playlist asset's "Send" action (bypasses
// recording, reuses an existing video).
//
// SOURCE-VERIFIED, DOM-UNCONFIRMED -- see the header comment in CompassPage.js
// for why (no QA login was available when this was written). Needs a real
// run to confirm.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/toolbar/toolbar.component.html (Magnet tool button)
//   projects/main/src/app/modules/toolbar/components/magnet-submenu/magnet-submenu.component.html
//   projects/main/src/app/modules/learning-shorts/screen-recorder/screen-recorder.component.html
//   projects/main/src/app/modules/playlist/components/asset-card/asset-card.component.html
//
// IMPORTANT -- Record Start/Stop is real screen capture, not fakeable simply:
// `startScreenRecording()` calls `navigator.mediaDevices.getDisplayMedia()`
// (triggers a native OS/browser screen-picker Cypress cannot drive) combined
// with `getUserMedia({audio:true})` (mic permission). There is no app-level
// seam to intercept -- only stubbing `navigator.mediaDevices` via
// `cy.visit({ onBeforeLoad })` or launching Chrome with fake-media flags
// would unblock this, neither of which is set up in this suite yet. DO NOT
// click the Record Start button expecting it to proceed normally.
//
// The realistic core flow instead uses the OTHER entry point: an existing
// owned Playlist asset's overflow menu -> Send. This calls
// `showSendNoticeMode(resource)`, which sets revisionMode/isVideoReady
// directly and fetches the existing video via a plain `fetch()` -- no
// getUserMedia/getDisplayMedia involved at all. Its own precondition:
// `[data-qa-id="playlist-asset-overflow-icon-btn"]` only renders on a card
// where `asset.isOwner` is true AND `isOverflow` is true (asset-card.component.html
// lines 10-15) -- i.e. a video-type asset the current teacher created. This
// is not guaranteed to exist in the target class/topic; callers must check.

export const LearningShortsPage = {
  magnetToolBtn() {
    return cy.get('[data-qa-id="toolbar-tool-gtMagnet"]');
  },

  openMagnetSubmenu() {
    this.magnetToolBtn().should("be.visible").click({ force: true });
    cy.wait(800);
  },

  learningShortsSubmenuItem() {
    return cy.get('[data-qa-id="toolbar-magnet-gtScreenRecord"]');
  },

  openViaToolbar() {
    this.openMagnetSubmenu();
    this.learningShortsSubmenuItem().should("be.visible").click({ force: true });
    cy.wait(1500);
  },

  recordStartBtn() {
    return cy.get('[data-qa-id="learning-shorts-record-start-btn"]');
  },

  exitBtn() {
    return cy.get('[data-qa-id="learning-shorts-exit-btn"]');
  },

  recordStopBtn() {
    return cy.get('[data-qa-id="learning-shorts-record-stop-btn"]');
  },

  // Entry point B -- an owned, overflow-eligible asset card's "Send" action.
  // Returns via callback whether such a card exists, same branch pattern as
  // CompassPage.hasNoHomework.
  findOwnedOverflowAssetCard(callback) {
    cy.get("body").then(($body) => {
      const el = $body.find('[data-qa-id="playlist-asset-overflow-icon-btn"]').first();
      callback(el.length > 0 ? el : null);
    });
  },

  openViaExistingAsset() {
    cy.get('[data-qa-id="playlist-asset-overflow-icon-btn"]').first().click({ force: true });
    cy.wait(800);
    cy.get('[data-qa-id="playlist-asset-send-btn"]').should("be.visible").click({ force: true });
    cy.wait(1500);
  },

  titleInput() {
    return cy.get('[data-qa-id="learning-shorts-title-input"]');
  },

  deleteAttachmentBtn() {
    return cy.get('[data-qa-id="learning-shorts-delete-attachment-btn"]');
  },

  recaptureBtn() {
    return cy.get('[data-qa-id="learning-shorts-recapture-btn"]');
  },

  classOption(i) {
    return cy.get(`[data-qa-id="learning-shorts-class-option-${i}"]`);
  },

  classCheckbox(i) {
    return cy.get(`[data-qa-id="learning-shorts-class-checkbox-${i}"]`);
  },

  discardBtn() {
    return cy.get('[data-qa-id="learning-shorts-discard-btn"]');
  },

  saveToPlaylistBtn() {
    return cy.get('[data-qa-id="learning-shorts-save-playlist-btn"]');
  },

  saveAsRevisionBtn() {
    return cy.get('[data-qa-id="learning-shorts-save-revision-btn"]');
  },

  sendBtn() {
    return cy.get('[data-qa-id="learning-shorts-send-btn"]');
  },
};
