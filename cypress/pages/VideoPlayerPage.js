// Page Object for the Video player --
// Test_Cases/video player/Video_Player_Test_Cases.xlsx (TC-VIDEO-001..017).
//
// SAME DISCIPLINE AS THE OTHER PLAYER PAGES
// -----------------------------------------
// This workbook carries the same decision as the quiz and code editor ones:
//   F02  Check whether the Video is in the current Playlist
//        -> present: F03 "open directly WITHOUT curriculum navigation"
//        -> absent:  F04 navigate Grade -> Subject -> Chapter/Topic
// So navigation lives behind the check, in ensureVideoAvailable(), never in a
// spec's beforeEach.
//
// HOW A VIDEO CARD IS IDENTIFIED
// ------------------------------
// By its intrinsic type icon, the same marker the code editor module now uses:
// every Playlist card carries an img.type-icon whose src names its type
// (cypress/scratch/out/code-card-dump.json). ic.AVMediaVideo.svg is the video
// one. This is deliberately NOT the "Video" type filter -- filtering silently
// no-ops often enough that the code editor spec opened a PDF and waited for a
// code bundle that was never coming. The icon is correct regardless of what
// filter state the account is in.
//
// THE OPEN QUESTION THIS FILE DOES NOT YET ANSWER
// -----------------------------------------------
// The previous video spec recorded that the one "Video" resource it could
// reach is type "tcevideo" -- an interactive animation ("Click Play to view
// the animation") rendered in an IFRAME, with video_elements: 0 in the audit
// (cypress/scratch/out/player-audit-all.json). Against that resource there is
// no HTML5 video element, so Play/Pause/Seek/Volume/Mute/Fullscreen
// (TC-VIDEO-004..011, 014..016) have nothing to drive, and it skipped them.
//
// That may or may not still be the whole story: the card dump shows
// ic.AVMediaVideo.svg cards in the configured topic, and video.js styles
// (vjs-styles-defaults) ARE bundled in this app -- both of which suggest a
// real media player exists for some resources. Which resource type the target
// topic actually holds is what cypress/scratch/video-dump.cy.js settles, and
// the playback helpers below are written against the standard HTML5/video.js
// surface so they work the moment such a resource is in reach.
//
// Nothing here asserts that a <video> exists. The E2E flow checks first and
// says plainly which player it got.

import { PlaylistPage } from "./PlaylistPage";
import { PlayerPage } from "./PlayerPage";

export const VideoPlayerPage = {
  TYPE_ICON: 'img.type-icon[src*="ic.AVMediaVideo.svg"]',

  CARD_SELECTOR:
    '[data-qa-id="playlist-resource-card"]:has(img.type-icon[src*="ic.AVMediaVideo.svg"]), ' +
    '[data-qa-id="playlist-asset-card"]:has(img.type-icon[src*="ic.AVMediaVideo.svg"])',

  cards() {
    return cy.get(this.CARD_SELECTOR);
  },

  cardCount() {
    return cy.get("body").then(($body) => $body.find(this.CARD_SELECTOR).length);
  },

  // Clears a type filter another spec may have left applied -- a filter HIDES
  // cards rather than removing them, so it must be ruled out before concluding
  // "no video here" and navigating.
  restoreFilter() {
    PlaylistPage.restoreAllFilter();
  },

  // Cards stream in after the topic's resource list resolves. Polls, never
  // asserts: zero is a legitimate answer.
  settleCards(maxAttempts = 6, attempt = 0) {
    return cy.get("body").then(($body) => {
      if ($body.find(this.CARD_SELECTOR).length > 0 || attempt >= maxAttempts) return;
      cy.wait(1000);
      return this.settleCards(maxAttempts, attempt + 1);
    });
  },

  // ---- F02: the decision, not a step --------------------------------------
  //
  // Yields { navigated: boolean } so a test can assert which branch it took.
  ensureVideoAvailable() {
    PlaylistPage.ensureDrawerVisible();
    PlaylistPage.settle(6);
    this.settleCards();

    return this.cardCount().then((count) => {
      if (count > 0) {
        cy.log("F02 -> F03: a Video is already in the current Playlist -- opening directly, no curriculum navigation");
        return cy.wrap({ navigated: false }, { log: false });
      }

      cy.log("No Video card visible -- clearing any leftover type filter before deciding to navigate");
      this.restoreFilter();
      this.settleCards();

      return this.cardCount().then((afterFilterReset) => {
        if (afterFilterReset > 0) {
          cy.log("F02 -> F03: the Video was here all along, hidden by a filter -- opening directly");
          return cy.wrap({ navigated: false }, { log: false });
        }

        cy.log("F02 -> F04: no Video in the current Playlist -- navigating");
        PlaylistPage.goToTargetClass();
        PlaylistPage.settle();
        this.settleCards();
        this.cards().should("have.length.greaterThan", 0);
        return cy.wrap({ navigated: true }, { log: false });
      });
    });
  },

  // ---- Opening and closing ------------------------------------------------

  // Clicks the video card already on the strip. No navigation path at all.
  openDirectly() {
    PlaylistPage.ensureDrawerVisible();
    this.cards().should("have.length.greaterThan", 0);

    // The strip is long and horizontal; a card that exists can be scrolled
    // out of view.
    this.cards().first().scrollIntoView();
    this.cards().first().click({ force: true });

    return PlayerPage.shouldBeOpen();
  },

  open() {
    this.ensureVideoAvailable();
    return this.openDirectly();
  },

  close() {
    PlayerPage.close();
    cy.wait(1000);
  },

  shouldBeClosed() {
    return PlayerPage.shouldBeClosed();
  },

  // ---- Which player actually opened --------------------------------------
  //
  // Two different players can answer to a "video" card (see the header), and
  // they support completely different assertions. Rather than assume, ask --
  // and let the test say which one it got.
  playerKind() {
    return cy.get("body").then(($b) => {
      if ($b.find("video").length > 0) return "html5";
      if ($b.find("iframe").length > 0) return "iframe";
      return "unknown";
    });
  },

  // ---- HTML5 / video.js surface ------------------------------------------
  //
  // Used only once playerKind() reports "html5". Written against the standard
  // media element rather than any app-specific wrapper, since the element's
  // own API is what the workbook's cases are really about.
  videoEl() {
    return cy.get("video", { timeout: 20000 }).first();
  },

  // The media element's own state is the ground truth for these cases -- far
  // more reliable than reading a rendered timestamp, and it does not depend on
  // any control being locatable.
  currentTime() {
    return this.videoEl().then(($v) => $v[0].currentTime);
  },

  duration() {
    return this.videoEl().then(($v) => $v[0].duration);
  },

  isPaused() {
    return this.videoEl().then(($v) => $v[0].paused);
  },

  isMuted() {
    return this.videoEl().then(($v) => $v[0].muted);
  },

  volume() {
    return this.videoEl().then(($v) => $v[0].volume);
  },

  // video.js renders its own control bar; these are its standard classes.
  // Confirmed present in the app bundle (vjs-styles-defaults), but which of
  // them this player actually shows is for the dump to establish.
  playToggle() {
    return cy.get(".vjs-play-control");
  },

  progressBar() {
    return cy.get(".vjs-progress-control .vjs-progress-holder");
  },

  muteToggle() {
    return cy.get(".vjs-mute-control");
  },

  fullscreenToggle() {
    return cy.get(".vjs-fullscreen-control");
  },
};
