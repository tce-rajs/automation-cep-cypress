// Page Object for the Video player --
// Test_Cases/05_Player/Video_Player_Test_Cases.xlsx (TC-VIDEO-001..017).
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

    // The video resource fetches its asset before the player chrome paints, so
    // the default 15s is not always enough -- that alone made the flow fail its
    // first attempt and pass on a retry.
    PlayerPage.shouldBeOpen(40000);
    // Player chrome up is not the same as media ready -- see waitForMedia.
    return this.waitForMedia();
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

  // ---- THE MEDIA ELEMENT IS INSIDE A SAME-ORIGIN IFRAME -------------------
  //
  // The previous video spec skipped every playback case, stating the resource
  // is "type tcevideo -- no HTML5 video element by design". The dump
  // (cypress/scratch/out/video-dump.json) shows why that looked true and why
  // it is not:
  //
  //   video_elements: 0      <- at TOP level, which is all it checked
  //   iframe_count: 1
  //   iframes[0].same_origin: true
  //   iframes[0].inner_has_video: TRUE   <- the <video> is one level down
  //
  // The player renders into a same-origin iframe with no src (written into
  // about:blank), so Cypress can reach straight into it. This is the third
  // module where "the player is an opaque embedded widget" turned out to mean
  // "nobody looked inside it" -- the quiz renderer and the code editor were
  // the other two.
  playerFrame() {
    return cy.get("iframe", { timeout: 20000 }).first();
  },

  // The media element itself, reached through the frame's document. Retried
  // via should() so it survives the frame still painting.
  videoEl() {
    return cy.get("body").then(($b) => {
      const video = this.mediaElement($b);
      expect(video, "a <video> element inside the player frame").to.exist;
      return cy.wrap(video, { log: false });
    });
  },

  // THREE separate states, and treating any of them as "ready" costs a run:
  //
  //   1. player chrome open  -- the frame may not exist yet
  //   2. <video> in the frame -- but duration is NaN and play() does nothing
  //   3. METADATA loaded      -- duration known, playback controllable
  //
  // Stopping at (1) made the flow skip its whole playback leg and pass anyway.
  // Stopping at (2) made it assert "expected NaN to be above 0" and only pass
  // on Cypress's third retry. This waits for (3).
  //
  // Polls, never asserts: a resource with no media element at all is a real
  // answer that playerKind() reports rather than fails on.
  mediaElement($body) {
    const frames = $body.find("iframe").toArray();
    for (const frame of frames) {
      try {
        const video = frame.contentDocument && frame.contentDocument.querySelector("video");
        if (video) return video;
      } catch (e) {
        // Cross-origin frame -- not reachable, so not assertable.
      }
    }
    return $body.find("video")[0] || null;
  },

  waitForMedia(maxAttempts = 20, attempt = 0) {
    return cy.get("body").then(($b) => {
      const video = this.mediaElement($b);
      // readyState >= 1 is HAVE_METADATA: duration is a real number from here.
      const ready = !!video && video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0;
      if (ready || attempt >= maxAttempts) return;
      cy.wait(1000);
      return this.waitForMedia(maxAttempts, attempt + 1);
    });
  },

  // Whether this resource rendered something with a real media element, or
  // only an embedded surface (the animation player). Asked rather than
  // assumed, since both answer to the same card type.
  playerKind() {
    return cy.get("body").then(($b) => {
      if (this.mediaElement($b)) return "html5";
      if ($b.find("iframe").length > 0) return "iframe";
      return "unknown";
    });
  },

  // The media element's own state is the ground truth for these cases -- far
  // more reliable than reading a rendered timestamp, and it does not depend on
  // any control being locatable.
  // cy.wrap() on a DOM node yields a jQuery object, so reading .currentTime
  // off the yielded subject gives undefined -- and a .then() that returns
  // undefined passes the ORIGINAL subject through, which is why the first
  // attempt asserted on "[object Object] to be a number". Everything below
  // goes through this unwrapper.
  withVideo(fn) {
    return this.videoEl().then((v) => fn(v[0] || v));
  },

  currentTime() {
    return this.withVideo((v) => v.currentTime);
  },

  duration() {
    return this.withVideo((v) => v.duration);
  },

  isPaused() {
    return this.withVideo((v) => v.paused);
  },

  isMuted() {
    return this.withVideo((v) => v.muted);
  },

  volume() {
    return this.withVideo((v) => v.volume);
  },

  // Playback is driven through the element's own API rather than a control
  // skin: these cases are about playback behaviour, and headless autoplay
  // policies make a programmatic play() the reliable trigger.
  play() {
    return this.withVideo((v) => {
      const started = v.play();
      // play() rejects if a policy blocks it; swallow so the assertion that
      // follows reports the real state instead of an unhandled rejection.
      if (started && started.catch) started.catch(() => {});
      return null;
    });
  },

  pause() {
    return this.withVideo((v) => {
      v.pause();
      return null;
    });
  },

  seekTo(seconds) {
    return this.withVideo((v) => {
      v.currentTime = seconds;
      return null;
    });
  },

  setVolume(level) {
    return this.withVideo((v) => {
      v.volume = level;
      return null;
    });
  },

  setMuted(muted) {
    return this.withVideo((v) => {
      v.muted = muted;
      return null;
    });
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
