// AI Notices module -- based on Test_Cases/10_AI_Notices/AI_Notices_Test_Cases.xlsx
// (added 2026-08-23; this module had zero Test_Cases documentation before).
// Test case IDs below match that workbook's 03_Test Cases sheet.
//
// SELECTOR SOURCE: see the header comment in cypress/pages/AiNoticesPage.js
// -- read from cep2-workspace's Angular source, not the live DOM. Needs a
// real run to confirm.
//
// SCOPE IS DELIBERATELY VERY THIN. Unlike Compass/Minimap/Learning Shorts,
// this module has no reachable "core flow" past the trigger button, because:
//   - The ONLY way into the compose form is: drag-select whiteboard content
//     -> click an approve button that is raw SVG with zero selector of any
//     kind (created via document.createElementNS, no data-qa-id/id).
//     Guessing its screen position relative to a just-drawn selection is
//     exactly the kind of guess this project's "verify, don't guess" rule
//     forbids presenting as a real, confirmed test.
//   - Approving also requires a real, synchronous OCR backend round-trip
//     before the dialog even opens -- there is no way to reach the compose
//     form's Title/Editor/Share-with-Classes/Send fields without both of the
//     above.
// Per claude/README.md's core rule, this is recorded as a genuine, confirmed
// blocker rather than worked around with an unconfirmed coordinate guess.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { AiNoticesPage } from "../../pages/AiNoticesPage";

describe("AI Notices - Reachability", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
  });

  it("AIN-001: AI Notices is reachable from the Magnet toolbar", () => {
    AiNoticesPage.magnetToolBtn().should("be.visible");
    AiNoticesPage.open();
    // Nothing further to assert from here without the drag-select + OCR
    // round trip -- see the module header comment.
  });
});

describe("AI Notices - Login guard", () => {
  it("AIN-016: is unavailable to an unauthenticated user", () => {
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
// Everything past the trigger (drag-select on the whiteboard canvas, the
//   approve/discard buttons, the OCR round trip, and therefore the entire
//   compose form -- Title, Editor, Share with Classes, Send): blocked on the
//   approve button having no selector at all. Unblocking this needs either a
//   data-qa-id added to that SVG button by the dev team, or a confirmed,
//   reliable way to compute its on-screen position (not a guess) -- e.g. if
//   it always renders at a fixed offset from the selection rectangle's
//   corner, confirmed against the live DOM first.
//
// Rephrase / Translate / Grammar (ai-notices-paraphrase-btn / -translate-btn
//   / -grammar-btn): CONFIRMED DEAD CODE as of this writing -- the HTTP calls
//   backing all three are commented out in notice-form-dialog.component.ts.
//   Clicking them currently does nothing observable (Translate/Grammar even
//   leave their own loading state stuck true, since it's never reset).
//   Writing a "pass" for clicking these would report success for behavior
//   that doesn't exist. Recommend flagging to the dev team; re-visit once
//   real implementations land (or are confirmed dead intentionally, in which
//   case the buttons themselves should probably be removed).
//
// Send (ai-notices-send-btn): creates a real notice via POST /2/noticeboard
//   on the shared QA account -- would need the same "don't pollute shared
//   data" caution as other destructive/creating actions in this suite, in
//   addition to being unreachable per the blocker above.
// ---------------------------------------------------------------------------
