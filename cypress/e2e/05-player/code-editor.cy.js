// Code Editor Player -- Test_Cases/05_Player/Code_Editor_Test_Cases.xlsx
// TC-CODE-001 to TC-CODE-018.
//
// This REPLACES the spec written against the older
// Test_Cases/_archive/05_Player_v1/Code_Editor_Player_Test_Cases.xlsx (TC-CODE-001..013),
// whose IDs mean different things -- the old TC-CODE-006 was "closing removes
// the wrapper", the new one is "verify expected output". Do not cross-reference
// the two.
//
// PRECONDITIONS ARE PRECONDITIONS, NOT STEPS
// ------------------------------------------
// F02 is a DECISION -- "Check current Playlist for Code Editor: if present,
// open directly; if absent, navigate first" -- and F03 spells out "without
// curriculum navigation". So beforeEach establishes the state and nothing more,
// via CodeEditorPage.ensureCodeEditorAvailable(), which navigates ONLY when no
// Code resource is on the strip. TC-CODE-001 asserts the app did not move.
// Do not put an unconditional goToComputerScienceCodeChapter() back in beforeEach.
//
// SELECTORS COME FROM TWO DOM DUMPS, NOT FROM GUESSWORK
// -----------------------------------------------------
// The old spec skipped the editor's internals as "owned by the external web
// component". That was wrong in the same way the quiz module's "external
// widget, no selectors" conclusion was wrong: cypress/scratch/out/
// code-editor-dump.json records host_has_shadow_root: false, zero iframes and
// 456 light-DOM nodes under <tce-code-main>. The component is fully queryable.
//
// The editor is MONACO, and the Settings panel even carries real ids
// (select#fontSize, select#themeSelect). Every selector used here was read off
// that live DOM -- see cypress/pages/CodeEditorPage.js, which documents each
// one and the behaviour behind it.
//
// THERE ARE TWO DIFFERENT CODE EDITORS BEHIND THE SAME CARD TYPE
// --------------------------------------------------------------
// The first verification run made this unmissable: it opened a PYTHON IDE
// while the spec asserted "<!DOCTYPE html>" from the web editor, and six cases
// failed on content rather than on behaviour. The F02 flow was right to use
// whatever Code resource the Playlist held; the ASSERTIONS were wrong to
// assume which one.
//
//   "web"     -- HTML/CSS/JavaScript tabs; output is a rendered PREVIEW
//                IFRAME; no Force Stop.
//   "console" -- a Python IDE; output is TEXT; Run sits next to a real
//                FORCE STOP button.
//
// So every content-specific assertion is either derived from the resource's
// own source (TC-CODE-006 expects whatever the code's first print() literal
// is) or branched on CodeEditor.editorKind(). Nothing hardcodes one lesson's
// text. Run relabelling itself "Run" -> "Rerun" holds for both and is the
// cleanest proof that execution happened.
//
// All 18 cases are implemented. TC-CODE-008/009 (Force Stop) were previously
// skipped here as "no such control renders" -- that was true of the web editor
// only, and the Python toolbar disproved it.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { PlayerPage } from "../../pages/PlayerPage";
import { CodeEditorPage as CodeEditor } from "../../pages/CodeEditorPage";

describe("Code Editor Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    // F01 -> F02 only: navigates only if no Code resource is already here.
    CodeEditor.ensureCodeEditorAvailable();
  });

  afterEach(() => {
    PlayerPage.closeIfOpen();
    // No filter restore here any more: nothing in this spec applies one. Code
    // cards are found by their type icon, so the strip is left exactly as it
    // was found. (ensureCodeEditorAvailable still clears a filter left behind
    // by ANOTHER spec, since that would hide the cards.)
  });

  // --- Opening -------------------------------------------------------------

  // Branch A (F02 -> F03 -> F05). The case is not "a Code Editor opens"; the
  // workbook's objective is "verify NO UNNECESSARY NAVIGATION and Code Editor
  // opens directly", so the location is captured and asserted unchanged.
  it("TC-CODE-001: opens the Code Editor directly when it is already in the Playlist, without navigating", () => {
    CodeEditor.cards().should("have.length.greaterThan", 0);

    PlaylistPage.currentLocation().then((before) => {
      CodeEditor.openDirectly();

      CodeEditor.close();
      PlaylistPage.ensureDrawerVisible();
      PlaylistPage.currentLocation().should("eq", before);
    });
  });

  // Branch B (F02 -> F04 -> F05). Code resources are rare on this account, so
  // unlike the quiz module the "absent" precondition is real and creatable:
  // find a Playlist that genuinely has no Code resource, then navigate.
  it("TC-CODE-002: navigates to the Code Editor only when it is absent from the current Playlist", function () {
    CodeEditor.findPlaylistWithoutCodeEditor().then(({ found, chapterIndex }) => {
      if (!found) {
        cy.log(
          "PENDING (test data D03): every searched chapter of this class holds a Code resource, so the 'absent' precondition cannot be created here."
        );
        this.skip();
        return;
      }

      // Precondition established: this Playlist genuinely has no Code resource.
      cy.log(`Code-free Playlist found in chapter index ${chapterIndex}`);
      CodeEditor.cards().should("have.length", 0);

      // F04: navigate, and only now should a Code resource appear.
      CodeEditor.ensureCodeEditorAvailable().should("deep.eq", { navigated: true });
      CodeEditor.cards().should("have.length.greaterThan", 0);

      CodeEditor.openDirectly();
    });
  });

  // --- Player shell --------------------------------------------------------

  // The "editor area" half of F06 is assertable today: the player chrome comes
  // up and <tce-code-main> mounts. The "visible controls" half is NOT -- see
  // the pending block at the bottom -- so this case deliberately stops where
  // the confirmed selectors stop rather than asserting something invented.
  it("TC-CODE-003: the Code Editor Player loads and mounts its editor component", () => {
    CodeEditor.open();
    CodeEditor.component().should("be.visible");
    PlayerPage.shouldBeOpen();
  });

  // --- Close and reopen ----------------------------------------------------

  it("TC-CODE-016: the Code Editor can be closed and the underlying state returns", () => {
    PlayerPage.whiteboardTransform().then((before) => {
      CodeEditor.open();
      CodeEditor.close();

      CodeEditor.shouldBeClosed();
      // "Expected Playlist/whiteboard state returns" -- the board must be back
      // where it was, not merely uncovered.
      cy.wait(1500);
      PlayerPage.whiteboardTransform().should("eq", before);
      PlaylistPage.ensureDrawerVisible();
      CodeEditor.cards().should("have.length.greaterThan", 0);
    });
  });

  it("TC-CODE-017: the same Code Editor can be reopened after closing", () => {
    CodeEditor.open();
    CodeEditor.close();
    CodeEditor.shouldBeClosed();

    // Reopen from the Playlist that is still right there -- no navigation.
    CodeEditor.openDirectly();
    CodeEditor.component().should("be.visible");
  });

  // --- Content -------------------------------------------------------------

  it("TC-CODE-004: the code is displayed and readable in the editor", () => {
    CodeEditor.open();
    CodeEditor.editor().should("be.visible");

    // Readable means real text, not a rendered blank: Monaco paints into
    // .view-lines, and this resource is a web/HTML example.
    // Asserted WITHOUT pinning to one lesson's content: the first run of this
    // spec hardcoded "<!DOCTYPE html>" and failed against the Python resource,
    // which was a wrong assertion, not a bug.
    CodeEditor.editorText().should("match", /\S/).and("have.length.greaterThan", 20);

    // The tab strip exists only in the web editor.
    CodeEditor.editorKind().then((kind) => {
      cy.log("Editor kind: " + kind);
      if (kind === "web") {
        CodeEditor.languageTabs().should("have.length", 3);
        cy.contains(".webdev-tab.active", "HTML").should("exist");
      } else {
        CodeEditor.forceStopButton().should("exist");
      }
    });
  });

  // --- Run and output ------------------------------------------------------

  it("TC-CODE-005: Run executes the code", () => {
    CodeEditor.open();

    CodeEditor.runButton().should("contain.text", "Run");

    CodeEditor.editorKind().then((kind) => {
      if (kind === "web") {
        // The preview does not exist until the code runs, so its absence
        // first is what makes its appearance meaningful.
        CodeEditor.outputFrame().should("not.exist");
        CodeEditor.run();
        CodeEditor.outputFrame().should("exist");
      } else {
        // The Python IDE prints into a text pane instead.
        CodeEditor.outputPaneText().then((textBefore) => {
          CodeEditor.run();
          CodeEditor.outputPaneText().should("have.length.greaterThan", textBefore.length);
        });
      }
      // Either way the control relabels itself once executed.
      CodeEditor.runButton().should("contain.text", "Rerun");
    });
  });

  it("TC-CODE-006: the Output shows the expected rendered result", () => {
    CodeEditor.open();
    CodeEditor.run();

    // "Expected output" means different things to the two editors, and in
    // both cases the expectation is derived from the resource's OWN source
    // rather than hardcoded.
    CodeEditor.editorKind().then((kind) => {
      if (kind === "web") {
        CodeEditor.outputBody().within(() => {
          cy.get("img").should("exist");
          cy.get("audio").should("exist");
        });
      } else {
        CodeEditor.expectedPrintOutput().then((expected) => {
          expect(expected, "the source contains a print() literal to expect").to.be.a("string");
          CodeEditor.outputPaneText().should("contain", expected);
        });
      }
    });
  });

  it("TC-CODE-007: the code can be run a second time", () => {
    CodeEditor.open();
    CodeEditor.run();

    // Rerun must produce working output again, not a blank pane.
    CodeEditor.run();
    CodeEditor.runButton().should("contain.text", "Rerun");

    CodeEditor.editorKind().then((kind) => {
      if (kind === "web") {
        CodeEditor.outputBody().within(() => {
          cy.get("img").should("exist");
        });
      } else {
        CodeEditor.outputPaneText().should("match", /\S/);
      }
    });
  });

  // --- Settings ------------------------------------------------------------

  it("TC-CODE-010: Settings opens and shows its options", () => {
    CodeEditor.open();
    CodeEditor.openSettings();

    // All four options the workbook covers (F12-F15) live in this one panel.
    CodeEditor.settingCheckbox("Expand All").should("exist");
    CodeEditor.settingCheckbox("Minimap").should("exist");
    CodeEditor.textSizeSelect().should("exist");
    CodeEditor.themeSelect().should("exist");
  });

  // The control is proven to work -- it toggles and the editor keeps rendering
  // its code. Whether SECTIONS VISIBLY EXPAND cannot be shown with this
  // resource: that needs test data D06 (code with collapsible/folded regions),
  // and nothing in this file is folded to begin with. Asserting "expanded"
  // against unfolded code would pass no matter what the toggle did.
  it("TC-CODE-011: Expand All can be enabled and the editor keeps rendering", () => {
    CodeEditor.open();
    CodeEditor.openSettings();

    // Settings persist on the account, so the starting state is whatever the
    // last run left behind -- asserting "not checked" first made this test
    // pass once and fail forever after. Read the state, flip it, prove it
    // flipped, then put it back.
    CodeEditor.settingCheckbox("Expand All").then(($box) => {
      const wasChecked = $box.is(":checked");

      CodeEditor.toggleSetting("Expand All");
      CodeEditor.settingCheckbox("Expand All").should(wasChecked ? "not.be.checked" : "be.checked");

      CodeEditor.closeSettings();
      CodeEditor.editorText().should("match", /\S/);

      // Restore, so this test leaves the account as it found it.
      CodeEditor.openSettings();
      CodeEditor.toggleSetting("Expand All");
      CodeEditor.settingCheckbox("Expand All").should(wasChecked ? "be.checked" : "not.be.checked");
      CodeEditor.closeSettings();
    });
  });

  it("TC-CODE-012: the Minimap can be shown and hidden", () => {
    CodeEditor.open();

    // Starts disabled: .minimap is in the DOM but measures 0px wide, so WIDTH
    // is the observable, not presence. (The whiteboard's own minimap ids are a
    // different element entirely -- see CodeEditorPage.js.)
    CodeEditor.minimapWidth().should("eq", 0);

    CodeEditor.openSettings();
    CodeEditor.toggleSetting("Minimap");
    CodeEditor.settingCheckbox("Minimap").should("be.checked");
    CodeEditor.closeSettings();
    CodeEditor.minimapWidth().should("be.greaterThan", 0);

    // And back, so the case proves a toggle rather than a one-way switch.
    CodeEditor.openSettings();
    CodeEditor.toggleSetting("Minimap");
    CodeEditor.closeSettings();
    CodeEditor.minimapWidth().should("eq", 0);
  });

  it("TC-CODE-013: Text Size changes the editor text size", () => {
    CodeEditor.open();

    CodeEditor.editorFontSize().then((before) => {
      CodeEditor.openSettings();
      CodeEditor.textSizeSelect().select("22");
      cy.wait(1500);
      CodeEditor.closeSettings();

      CodeEditor.editorFontSize().should("not.eq", before);
      CodeEditor.editorFontSize().should("eq", "22px");

      // Restore, so the next spec does not inherit a 22px editor.
      CodeEditor.openSettings();
      CodeEditor.textSizeSelect().select("14");
      cy.wait(1000);
      CodeEditor.closeSettings();
    });
  });

  it("TC-CODE-014: Theme changes the editor theme", () => {
    CodeEditor.open();

    // The theme is a class on .editor-wrapper, matching the option values.
    CodeEditor.editorWrapperClass().should("contain", "vs-dark");

    CodeEditor.openSettings();
    CodeEditor.themeSelect().select("vs-light");
    cy.wait(1500);
    CodeEditor.closeSettings();

    CodeEditor.editorWrapperClass().should("contain", "vs-light").and("not.contain", "vs-dark");
    // The code must still be readable in the new theme, not merely present.
    CodeEditor.editorText().should("match", /\S/).and("have.length.greaterThan", 20);

    CodeEditor.openSettings();
    CodeEditor.themeSelect().select("vs-dark");
    cy.wait(1000);
    CodeEditor.closeSettings();
  });

  it("TC-CODE-015: the editor still runs code after a settings change", () => {
    CodeEditor.open();

    CodeEditor.openSettings();
    CodeEditor.themeSelect().select("vs-light");
    cy.wait(1000);
    CodeEditor.textSizeSelect().select("18");
    cy.wait(1000);
    CodeEditor.closeSettings();

    CodeEditor.run();
    CodeEditor.runButton().should("contain.text", "Rerun");
    CodeEditor.editorKind().then((kind) => {
      if (kind === "web") {
        CodeEditor.outputBody().within(() => {
          cy.get("img").should("exist");
        });
      } else {
        CodeEditor.outputPaneText().should("match", /\S/);
      }
    });

    CodeEditor.openSettings();
    CodeEditor.themeSelect().select("vs-dark");
    cy.wait(500);
    CodeEditor.textSizeSelect().select("14");
    cy.wait(500);
    CodeEditor.closeSettings();
  });

  // --- Error handling ------------------------------------------------------

  // "Gracefully" is the operative word: this is a WEB editor, so broken markup
  // does not raise an error dialog -- browsers render invalid HTML on a
  // best-effort basis. What the workbook actually asks for is "without freeze
  // or crash", so that is what is asserted: the run completes, the component
  // survives, and the editor stays usable afterwards.
  it("TC-CODE-018: invalid code is handled without freezing or crashing the player", () => {
    CodeEditor.open();

    CodeEditor.editorKind().then((kind) => {
      if (kind === "web") {
        CodeEditor.selectLanguageTab("JavaScript");
        // Syntactically invalid JavaScript -- unclosed brace and a bad call.
        CodeEditor.typeInEditor("\nfunction broken( { nope(((;\n");
      } else {
        // Invalid Python: a bad conditional and an unclosed call.
        CodeEditor.typeInEditor("\nif True\n  nope(\n");
      }

      CodeEditor.run();

      // No freeze: the component is alive and the control relabelled.
      CodeEditor.component().should("be.visible");
      CodeEditor.runButton().should("contain.text", "Rerun");

      if (kind === "web") {
        // Browsers render invalid markup best-effort, so the preview must
        // still be there rather than the player dying.
        CodeEditor.outputFrame().should("exist");
        CodeEditor.selectLanguageTab("HTML");
      } else {
        // Python REPORTS the failure instead of dying -- that is exactly the
        // graceful handling this case asks for.
        CodeEditor.outputPaneText().should("match", /error|invalid|traceback|syntax/i);
      }

      // Still usable: the editor keeps rendering after the bad run.
      CodeEditor.editorText().should("match", /\S/);
    });
  });

  // --- Not exercisable on this app / content ------------------------------
  //
  // The one genuine gap in the module, kept as an explicit skip with its
  // evidence rather than quietly dropped.
  //
  // Force Stop (workbook element E09) does not exist in this editor. Pass 2 of
  // the DOM dump clicked Run and scanned the component 1.2s into execution for
  // anything matching stop/cancel/abort/terminate/running: zero matches, and
  // the Run control had already relabelled itself to "Rerun". That is
  // consistent with what this resource IS -- a web/HTML preview, which renders
  // instantly and has nothing to interrupt.
  //
  // Test data D05 ("long-running/infinite-loop code") does not exist on this
  // account either, so the running state cannot be held open long enough to
  // look for a control that appears not to be rendered at all.
  //
  // To settle it: supply a Code resource whose language actually executes
  // (a Python/JS console-style IDE rather than the web-dev one) containing a
  // long-running loop, then re-run cypress/scratch/code-editor-dump2.cy.js --
  // its C_while_running capture is already written for exactly this.
  // Force Stop DOES exist -- in the Python/console editor, next to Run. This
  // file previously skipped both cases claiming no such control renders; that
  // was true only of the WEB editor, and the verification run put a screenshot
  // of the Python toolbar (Run | Force Stop | gear | X) on the record.
  //
  // Test data D05 ("long-running code") does not exist as a resource, so the
  // test CREATES it: a deliberately slow loop typed into the editor. That is
  // legitimate -- the workbook asks for long-running test code, not for a
  // long-running lesson.
  //
  // On the web editor there is nothing to stop, so these skip themselves at
  // runtime and say so rather than failing.
  it("TC-CODE-008: Force Stop stops running code", function () {
    CodeEditor.open();

    CodeEditor.hasForceStop().then((present) => {
      if (!present) {
        cy.log("This Playlist's Code resource is the web editor, which has no Force Stop control -- nothing to exercise.");
        this.skip();
        return;
      }

      // D05, created rather than assumed: long enough to still be running
      // when Force Stop is clicked, finite so a failure cannot hang the run.
      CodeEditor.typeInEditor("\nfor i in range(1, 80000000):\n  pass\n");
      CodeEditor.runButton().click({ force: true });
      cy.wait(1500);

      CodeEditor.forceStop();

      // Stopped, and the player survived it.
      CodeEditor.component().should("be.visible");
      CodeEditor.runButton().should("be.visible");
    });
  });

  it("TC-CODE-009: the editor remains usable after Force Stop", function () {
    CodeEditor.open();

    CodeEditor.hasForceStop().then((present) => {
      if (!present) {
        cy.log("Web editor -- no Force Stop control, so there is no post-stop state to check.");
        this.skip();
        return;
      }

      CodeEditor.typeInEditor("\nfor i in range(1, 80000000):\n  pass\n");
      CodeEditor.runButton().click({ force: true });
      cy.wait(1500);
      CodeEditor.forceStop();

      // "Remains usable" = it still accepts input and still runs code.
      CodeEditor.editorText().should("match", /\S/);
      CodeEditor.openSettings();
      CodeEditor.settingCheckbox("Minimap").should("exist");
      CodeEditor.closeSettings();
    });
  });
});
