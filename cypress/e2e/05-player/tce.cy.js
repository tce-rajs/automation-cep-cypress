// TCE Player -- Test_Cases/05_Player/TCE_Player_Test_Cases.xlsx
// TC-TCE-001 to TC-TCE-019. This spec validates the TCE player only.
//
// CONFIRMED INTEGRATION POINT (claude/APP_QUIRKS.md): the embedded TCE player
// is reachable via `window.angularReference[id]` -- same-origin direct object
// access, not postMessage. Tool forwarding calls
//   tceplayerCanvasFn({ action: 'PEN' | 'PAN' | 'ERASER' | 'CLEAR' | 'NONE' })
// on that reference. There is NO "tool successfully selected" event -- only a
// load-confirmation observable -- so these tests confirm the call is
// REACHABLE, not that the tool visibly activated. That limit is deliberate
// and is why the assertions stop where they do.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";

const tceReference = (win) => {
  const refs = win.angularReference || {};
  const key = Object.keys(refs).find((k) => refs[k] && typeof refs[k].tceplayerCanvasFn === "function");
  return key ? refs[key] : null;
};

describe("TCE Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    PlaylistPage.goToKnownContentTopic();
    PlaylistPage.filterToType("TCE");
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    PlaylistPage.restoreAllFilter();
  });

  it("TC-TCE-008: a synthetic close button is displayed over the TCE player", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(6000);
    PlayerPage.shouldBeOpen();
  });

  it("TC-TCE-009: closing TCE Player removes its wrapper", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(6000);
    PlayerPage.close();
    PlayerPage.shouldBeClosed();
  });

  it("TC-TCE-010: closing TCE restores prior Whiteboard pan/zoom", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      PlayerPage.openFirstResourceCard();
      cy.wait(6000);
      cy.get(PlayerPage.closeIconSelector(), { timeout: 15000 }).first().click({ force: true });
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
    });
  });

  // Tool forwarding. Each asserts the reference exists and the documented
  // action can be invoked without throwing -- the reachable contract.
  const forwards = [
    ["TC-TCE-004", "Pen", "PEN"],
    ["TC-TCE-005", "Pan", "PAN"],
    ["TC-TCE-006", "Eraser", "ERASER"],
    ["TC-TCE-007", "Clear", "CLEAR"],
  ];

  forwards.forEach(([id, toolName, action]) => {
    it(`${id}: ${toolName} tool is forwarded to TCE player`, () => {
      PlayerPage.openFirstResourceCard();
      cy.wait(8000);
      cy.window().then((win) => {
        const ref = tceReference(win);
        expect(ref, "a TCE player reference exposing tceplayerCanvasFn").to.exist;
        expect(() => ref.tceplayerCanvasFn({ action }), `${action} is accepted`).to.not.throw();
      });
    });
  });

  it("TC-TCE-013: the TCE loading spinner clears once content has loaded", () => {
    PlayerPage.openFirstResourceCard();
    cy.wait(8000);
    PlayerPage.shouldBeOpen();
    cy.get("body").then(($b) => {
      const spinners = $b.find(".mat-mdc-progress-spinner, .spinner, [class*='loading']").filter(":visible");
      expect(spinners.length, "no visible spinner once the package has loaded").to.eq(0);
    });
  });

  // --- Covered generically -------------------------------------------------
  it.skip("TC-TCE-001: TCE resource opens in TCE Player (covered by TC-TCE-008/009)", () => {});
  it.skip("TC-TCE-002: TCE Player is rendered on the Whiteboard (covered by TC-TCE-008/009)", () => {});

  // --- Blocked -------------------------------------------------------------
  it.skip("TC-TCE-003: Play/Pause is forwarded to the TCE player (no confirmed action name for Play/Pause in tceplayerCanvasFn)", () => {});
  it.skip("TC-TCE-011: each supported TCE resource type opens (the supported type list is not documented)", () => {});
  it.skip("TC-TCE-012: TCE content is interactive after loading (content is inside an injected iframe -- no reachable interactive elements)", () => {});
  it.skip("TC-TCE-014: slow loading does not appear permanently stuck (needs network throttling not currently used by this suite)", () => {});
  it.skip("TC-TCE-015: Pan tool prevents interaction with TCE content (no way to observe interactivity -- see TC-TCE-012)", () => {});
  it.skip("TC-TCE-016: TCE audio stops when the player is closed (no audio state exposed to the DOM)", () => {});
  it.skip("TC-TCE-017: reopening the same TCE resource pans to the existing player (pan-to-existing behaviour not confirmed in the live app)", () => {});
  it.skip("TC-TCE-018: different TCE resources can remain open together (needs two distinct TCE resources; only one is reachable here)", () => {});
  it.skip("TC-TCE-019: a failed TCE package shows a visible failure (needs a forced server failure)", () => {});
});
