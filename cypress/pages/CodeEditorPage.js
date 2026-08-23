// Page Object for the Code Editor player --
// Test_Cases/05_Player/Code_Editor_Test_Cases.xlsx.
//
// SAME DISCIPLINE AS QuizPlayerPage / WorksheetPlayerPage
// ------------------------------------------------------
// This workbook makes the same decision explicit that the quiz one does:
//   F02  Check current Playlist for Code Editor -> present: F03, absent: F04
//   F03  "Open Code Editor directly WITHOUT curriculum navigation."
//   F04  Navigate Grade -> Subject -> Chapter/Topic -> Playlist.
// So navigation lives behind the check, in ensureCodeEditorAvailable(), and
// never in a spec's beforeEach.
//
// TWO FACTS READ OFF A REAL RUN (cypress/scratch/out/player-audit-all.json,
// "code" section) rather than assumed:
//
//  1. A Code resource can be an ASSET card, not a resource card. With the
//     "Code" filter applied that audit recorded resource: 0, asset: 3 -- so
//     PlayerPage.openFirstResourceCard(), which only ever clicks
//     [data-qa-id="playlist-resource-card"], had nothing to click. CARD_SELECTOR
//     below covers both card types for that reason.
//  2. The player renders <tce-code-main> with iframes: 0 -- same-origin DOM,
//     like the quiz renderer -- but appeared_on_open was EMPTY: not one new
//     data-qa-id shows up when it opens. So the component is reachable in
//     principle, yet nothing inside it is mapped.
//
// EVERY SELECTOR BELOW WAS READ OFF THE LIVE DOM
// ----------------------------------------------
// Captured by cypress/scratch/code-editor-dump.cy.js and -dump2.cy.js, whose
// output is in cypress/scratch/out/. None is guessed -- the workbook's
// 06_Automation Mapping sheet requires exactly that ("none invented").
//
// The structural findings that made the rest possible:
//   - NO shadow DOM (host_has_shadow_root: false) and NO iframes at load, with
//     456 light-DOM nodes under <tce-code-main>. So the component is fully
//     queryable and the old spec's "owned by the external component" skips
//     were wrong in the same way the quiz module's were.
//   - The editor is MONACO (<app-monaco-editor>), so its own well-known
//     structure (.view-lines, .minimap) applies.
//   - The Settings panel carries REAL IDs: select#fontSize and
//     select#themeSelect. Those are the only stable hooks in the component;
//     everything else is located by class or by the label a user reads.
//
// BEHAVIOUR FACTS worth knowing before editing these tests:
//   - Run is a <div>, not a <button>, and its label FLIPS from "Run" to
//     "Rerun" once code has been executed. That flip is the cleanest proof
//     that execution actually happened.
//   - The output is a rendered PREVIEW IFRAME that does not exist until Run is
//     clicked (iframes: [] before, one ~253x402 iframe after). This resource is
//     a web/HTML example -- HTML/CSS/JavaScript tabs -- so "expected output"
//     means rendered DOM, NOT console text.
//   - The minimap starts DISABLED: .minimap exists but measures 0px wide.
//     Width, not presence, is what the toggle changes.
//   - Theme is applied as a class on .editor-wrapper (vs-dark by default).
//
// ONE TRAP WORTH RECORDING FOR THE MINIMAP CASE (TC-CODE-012): the WHITEBOARD
// has a minimap of its own, with data-qa-ids "minimap-container" and
// "minimap-canvas" (present in the audit while the code player was open). That
// is NOT the editor's minimap. A test that asserts on those ids will pass
// whether or not the editor's toggle does anything at all.

import { PlaylistPage } from "./PlaylistPage";
import { PlayerPage } from "./PlayerPage";

export const CodeEditorPage = {
  FILTER_TYPE: "Code",

  // HOW A CODE CARD IS IDENTIFIED -- and why this is not the type filter.
  //
  // The first real run of code-editor.cy.js opened a PDF worksheet and then
  // timed out waiting for the code bundle. The reason was structural: the old
  // selector matched ANY resource/asset card and was only correct while the
  // "Code" type filter happened to be applied. When that filter silently
  // no-ops -- menu not open, drawer hidden, a dialog in the way -- the presence
  // check counts PDFs as Code and clicks the first one. In the configured topic
  // that is 194 cards of which exactly 2 are Code, so it was near-guaranteed to
  // pick the wrong one.
  //
  // Cards carry an INTRINSIC type marker instead (cypress/scratch/out/
  // code-card-dump.json): every card has an img.type-icon whose src names its
  // type -- ic.code.svg here, ic.Worksheet.svg / ic.AVMediaVideo.svg for
  // others. Filtering the strip is now unnecessary: this selector is correct
  // no matter what filter state the account is in, which also removes the
  // filter-menu round trip from every test.
  TYPE_ICON: 'img.type-icon[src*="ic.code.svg"]',

  CARD_SELECTOR:
    '[data-qa-id="playlist-resource-card"]:has(img.type-icon[src*="ic.code.svg"]), ' +
    '[data-qa-id="playlist-asset-card"]:has(img.type-icon[src*="ic.code.svg"])',

  // The external web component the player mounts.
  COMPONENT: "tce-code-main",

  cards() {
    return cy.get(this.CARD_SELECTOR);
  },

  cardCount() {
    return cy.get("body").then(($body) => $body.find(this.CARD_SELECTOR).length);
  },

  // Kept only so specs that used to restore the type filter still can. Nothing
  // in this page object filters any more -- the type icon above makes it
  // unnecessary -- but an earlier spec run may have left a filter on the
  // account, and that persists.
  restoreFilter() {
    PlaylistPage.restoreAllFilter();
  },

  // Cards stream in after the topic's resource list resolves; a count taken in
  // that gap reads zero and would send the caller down the navigation branch
  // for no reason. Polls, never asserts -- zero really is a possible answer,
  // since most topics hold no Code resource at all.
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
  ensureCodeEditorAvailable() {
    PlaylistPage.ensureDrawerVisible();
    PlaylistPage.settle(6);
    this.settleCards();

    return this.cardCount().then((count) => {
      if (count > 0) {
        cy.log("F02 -> F03: a Code resource is already in the current Playlist -- opening directly, no curriculum navigation");
        return cy.wrap({ navigated: false }, { log: false });
      }

      // Before navigating anywhere, rule out the cheap explanation: another
      // spec (worksheet, video, TCE) may have left a type filter applied to
      // the account, which HIDES the Code cards rather than removing them.
      // Clearing it is a Playlist-level action, not curriculum navigation, so
      // it belongs on this side of the F02 decision -- and it saves a pointless
      // trip through Grade/Subject/Chapter/Topic.
      cy.log("No Code card visible -- clearing any leftover type filter before deciding to navigate");
      this.restoreFilter();
      this.settleCards();

      return this.cardCount().then((afterFilterReset) => {
        if (afterFilterReset > 0) {
          cy.log("F02 -> F03: the Code resource was here all along, hidden by a filter -- opening directly");
          return cy.wrap({ navigated: false }, { log: false });
        }
        return this.navigateToCodeEditor();
      });
    });
  },

  // F04 proper: the navigation branch, split out so ensureCodeEditorAvailable
  // reads as the decision it is.
  navigateToCodeEditor() {
    return cy.then(() => {
      cy.log("F02 -> F04: no Code resource in the current Playlist -- navigating");
      PlaylistPage.goToTargetClass();
      PlaylistPage.settle();
      this.settleCards();

      // Fallback: targetClass.js points at Physics (chapter 0 / topic 0),
      // which does NOT hold Code content -- Code Editor validation is
      // deliberately routed through Class 12A | Computer Science instead (per
      // instruction), confirmed to hold a real Code resource. If a class with
      // Code content is assigned to targetClass.js later, this second hop
      // stops firing.
      return this.cardCount().then((afterTarget) => {
        if (afterTarget === 0) {
          cy.log("Target topic holds no Code resource either -- falling back to Class 12A | Computer Science");
          PlaylistPage.goToComputerScienceCodeChapter();
          PlaylistPage.settle();
          this.settleCards();
        }
        this.cards().should("have.length.greaterThan", 0);
        return cy.wrap({ navigated: true }, { log: false });
      });
    });
  },

  // ---- Branch B support ---------------------------------------------------
  //
  // TC-CODE-002 needs test data D03, "Playlist without Code Editor". Unlike the
  // quiz module -- where every topic holds two quizzes and the absent case
  // could not be built at all -- Code resources are RARE on this account, so a
  // Code-free Playlist is the common case and the precondition is easy to
  // create honestly. Searched rather than hardcoded so it survives a
  // curriculum change.
  //
  // Each hop is just a count of type-icon-matched cards. Yields
  // { found, chapterIndex }.
  findPlaylistWithoutCodeEditor(maxChapters = 4) {
    PlaylistPage.openChaptersPopup();
    return cy
      .get('[data-qa-id="playlist-select-chapter"]')
      .its("length")
      .then((chapterCount) => {
        // Close the popup we opened only to count.
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
        cy.wait(500);

        const limit = Math.min(chapterCount, maxChapters);
        const tryChapter = (index) => {
          if (index >= limit) return cy.wrap({ found: false, chapterIndex: null }, { log: false });
          PlaylistPage.goToChapterTopic(index, 0);
          // Small budget: an empty result is what this is LOOKING for, so
          // there is no reason to wait out the full one for cards that are
          // not coming.
          this.settleCards(3);
          return this.cardCount().then((codeCards) => {
            if (codeCards === 0) return cy.wrap({ found: true, chapterIndex: index }, { log: false });
            return tryChapter(index + 1);
          });
        };
        return tryChapter(0);
      });
  },

  // ---- Opening and closing ------------------------------------------------

  // Clicks the Code card already on the strip. No navigation path at all: if
  // the precondition is not met this fails and says so rather than quietly
  // wandering off to find one.
  //
  // Waits for the EDITOR ITSELF, not for the bundle request. The first run of
  // this spec waited on an intercept of **/tce-code*/**, which fails the
  // second time the editor is opened in one browser session: the bundle is
  // then served from cache and no request fires at all (the same trap
  // APP_QUIRKS.md records for already-loaded UI). Waiting on the rendered
  // Monaco surface is both more accurate and cache-proof.
  openDirectly() {
    PlaylistPage.ensureDrawerVisible();
    this.cards().should("have.length.greaterThan", 0);

    // 194 cards in the configured topic, of which 2 are Code -- the card can
    // easily be scrolled out of view on the horizontal strip.
    this.cards().first().scrollIntoView();
    this.cards().first().click({ force: true });

    this.component().should("exist");
    // The component mounts showing "Loading Code Editor environment...", so
    // mounted is not ready; the painted editor is.
    cy.get(".monaco-editor", { timeout: 40000 }).should("be.visible");
    cy.get(".view-lines", { timeout: 20000 }).should("not.be.empty");
    return PlayerPage.shouldBeOpen();
  },

  // Establishes the precondition (navigating only if it is not already met)
  // and then opens. This is what a test that is not ABOUT the precondition
  // should call.
  open() {
    this.ensureCodeEditorAvailable();
    return this.openDirectly();
  },

  // <tce-code-main> mounts before its contents finish loading -- the audit
  // caught it still showing "Loading Code Editor environment..." -- so
  // "exists" is not "ready". Readiness itself needs a selector from inside the
  // component, which is what the dump is for; until then this asserts the
  // component is mounted and the player chrome is up, and nothing stronger.
  component() {
    return cy.get(this.COMPONENT, { timeout: 30000 });
  },

  shouldBeOpen() {
    this.component().should("exist");
    return PlayerPage.shouldBeOpen();
  },

  close() {
    PlayerPage.close();
    cy.wait(1000);
  },

  shouldBeClosed() {
    cy.get(this.COMPONENT).should("not.exist");
    return PlayerPage.shouldBeClosed();
  },

  // ---- E06: the editor surface -------------------------------------------

  editor() {
    return cy.get(".monaco-editor").first();
  },

  // Monaco paints the code into .view-lines. Reading textContent from it is
  // how "the code is displayed and readable" becomes an assertion instead of
  // a screenshot.
  editorText() {
    return cy.get(".view-lines").first().invoke("text");
  },

  // The web-dev language tabs (HTML / CSS / JavaScript); the selected one
  // carries .active.
  languageTabs() {
    return cy.get(".webdev-tab");
  },

  selectLanguageTab(name) {
    cy.contains(".webdev-tab", name).click({ force: true });
    cy.wait(1500);
  },

  // Monaco's real input target. Typing anywhere else is a no-op.
  typeInEditor(text) {
    cy.get("textarea.inputarea").first().type(text, { force: true, delay: 30, parseSpecialCharSequences: false });
    cy.wait(1000);
  },

  // ---- E07/E08: Run and its output ---------------------------------------
  //
  // A <div>, not a <button> -- .should("be.disabled") and similar button-only
  // assertions do not apply to it.
  runButton() {
    return cy.get(".generalBtns.runBtn");
  },

  run() {
    this.runButton().should("be.visible").click({ force: true });
    // The preview is rendered by the component; give it time to paint rather
    // than asserting into the gap.
    cy.wait(6000);
  },

  // The rendered preview. It does NOT exist before the first Run, which is
  // exactly what makes it a usable assertion.
  outputFrame() {
    return cy.get(this.COMPONENT).find("iframe");
  },

  // The preview iframe has no src (it is written into about:blank), so it is
  // same-origin and its document can be read directly.
  outputBody() {
    return this.outputFrame().its("0.contentDocument.body", { timeout: 15000 }).should("not.be.empty");
  },

  // ---- WHICH EDITOR OPENED ------------------------------------------------
  //
  // This account has (at least) TWO different Code resources, and they are
  // different products behind the same card type:
  //
  //   "web"     -- HTML/CSS/JavaScript tabs, output is a rendered PREVIEW
  //                IFRAME, no Force Stop control.
  //   "console" -- a Python IDE: no language tabs, output is TEXT, and it
  //                DOES have a Force Stop button next to Run.
  //
  // The first verification run proved why this matters: the spec assumed the
  // web resource and asserted "<!DOCTYPE html>", but the app was sitting on
  // the Python one, so six cases failed on content rather than on behaviour.
  // The F02 flow was right to use whatever Code resource was in the Playlist
  // -- the ASSERTIONS were wrong to assume which.
  //
  // It also disproved this file's earlier claim that no Force Stop exists:
  // that was true of the web editor only.
  editorKind() {
    return cy.get("body").then(($b) => ($b.find(".webdev-tab").length > 0 ? "web" : "console"));
  },

  // ---- E09: Force Stop (console editor only) ------------------------------

  forceStopButton() {
    return cy.contains(".generalBtns", "Force Stop");
  },

  hasForceStop() {
    return cy.get("body").then(($b) =>
      $b
        .find(".generalBtns")
        .toArray()
        .some((el) => /force\s*stop/i.test(el.textContent || ""))
    );
  },

  forceStop() {
    this.forceStopButton().click({ force: true });
    cy.wait(2500);
  },

  // ---- E08 for the console editor ----------------------------------------
  //
  // The text output pane. The rendered-preview accessor (outputBody) is for
  // the web editor; this one is for the Python IDE, whose output is plain
  // text in the right-hand split area.
  outputPaneText() {
    return cy.get(this.COMPONENT).then(($host) => {
      const areas = Array.from($host[0].querySelectorAll("as-split-area"));
      // The output pane is the one that is not the editor.
      const pane = areas.find((el) => !el.querySelector(".monaco-editor")) || areas[areas.length - 1];
      return pane ? this.normalize(pane.textContent) : "";
    });
  },

  // Monaco paints indentation and gaps as NON-BREAKING spaces, so text read
  // out of .view-lines does not compare equal to the same text elsewhere in
  // the DOM even when it looks identical. Everything that compares editor text
  // against output text has to go through this first.
  normalize(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  },

  // What this particular resource should print, derived from ITS OWN source
  // rather than hardcoded: the first string literal passed to print(). That
  // keeps TC-CODE-006 a real "expected output" assertion without pinning the
  // spec to one lesson's content.
  expectedPrintOutput() {
    return this.editorText().then((code) => {
      const match = /print\(\s*["']([^"']{3,})["']/.exec(this.normalize(code));
      return match ? this.normalize(match[1]) : null;
    });
  },

  // ---- E10-E14: the Settings panel ---------------------------------------

  settingsGear() {
    return cy.get(".gear-icon");
  },

  settingsPanel() {
    return cy.get(".settingView.floatingMenu");
  },

  openSettings() {
    this.settingsGear().click({ force: true });
    cy.wait(1500);
    return this.settingsPanel().should("be.visible");
  },

  closeSettings() {
    this.settingsGear().click({ force: true });
    cy.wait(1000);
  },

  // Both toggles are a checkbox inside the <label> that carries the visible
  // text, which is what a user actually clicks.
  settingCheckbox(labelText) {
    return cy.contains(".floatingControl label", labelText).find('input[type="checkbox"]');
  },

  toggleSetting(labelText) {
    cy.contains(".floatingControl label", labelText).click({ force: true });
    cy.wait(1500);
  },

  // Real ids, the only ones in the component.
  textSizeSelect() {
    return cy.get("select#fontSize");
  },

  themeSelect() {
    return cy.get("select#themeSelect");
  },

  // Monaco applies the chosen size to the painted lines, so the computed
  // font-size of .view-lines is the observable effect.
  editorFontSize() {
    return cy.get(".view-lines").first().then(($el) => getComputedStyle($el[0]).fontSize);
  },

  // The theme lands as a class on .editor-wrapper (vs-dark / vs-light /
  // hc-black), matching the <option> values.
  editorWrapperClass() {
    return cy.get(".editor-wrapper").first().invoke("attr", "class");
  },

  // The EDITOR's minimap -- not the whiteboard's (see the header). It is
  // always present in the DOM; disabled means zero width.
  minimapWidth() {
    return cy.get(this.COMPONENT).then(($host) => {
      const mm = $host[0].querySelector(".minimap");
      return mm ? mm.getBoundingClientRect().width : 0;
    });
  },
};
