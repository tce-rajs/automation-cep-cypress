// Quiz Player -- Test_Cases/quiz player rework/Quiz_Player_Test_Cases_Reworked.xlsx
// TC-QUIZ-001 to TC-QUIZ-022.
//
// This REPLACES the spec written against the older
// Test_Cases/05_Player_new/Quiz_Player_Test_Cases.xlsx (TC-QUIZ-001..028),
// whose IDs mean different things. Do not cross-reference the two.
//
// The old spec skipped 24 of its 28 cases on the grounds that the quiz UI is
// an "externally-loaded widget with no selector in this codebase". Direct
// exploration showed that conclusion was too strong: the renderer is
// SAME-ORIGIN Angular DOM with zero iframes, so Cypress can query all of it.
// Selectors and behaviour facts are documented in cypress/pages/QuizPlayerPage.js;
// all of them were read off the live DOM, none invented, per the workbook's
// 06_Automation Mapping instruction.
//
// THREE PLACES THE WORKBOOK DOES NOT MATCH THE APP, each skipped below with
// its reason rather than quietly reinterpreted:
//
//  1. The AIR Card (F05/F06, TC-QUIZ-003/004) never appears. Both quizzes in
//     this curriculum load straight into the renderer. claude/APP_QUIRKS.md
//     explains why: the Air Card variant is chosen inside the player from the
//     question set (single SCQ), so it is not a property of the resource and
//     cannot be forced from a test.
//  2. Content coverage C02/C03/C04 (image question and/or image options,
//     TC-QUIZ-006/007/008) has no matching content on this account. The only
//     MCQ quiz is 5 text/text questions.
//  3. TC-QUIZ-002's precondition (test data D03, "Playlist without Quiz") is
//     not available in the configured target topic, which always contains two
//     quizzes. The test now SEARCHES the other chapters of the same class for
//     a quiz-free Playlist and runs branch B against it; if this account has
//     none within the search budget it reports itself pending on test data
//     rather than passing vacuously.
//
// PRECONDITIONS ARE PRECONDITIONS, NOT STEPS
// ------------------------------------------
// F02 is a DECISION: "Check whether Quiz exists in current Playlist -- if YES
// go to F03, if NO go to F04", and F03 says in as many words "Open Quiz
// directly; DO NOT navigate curriculum". An earlier version of this spec called
// PlaylistPage.goToTargetClass() unconditionally in beforeEach, which forces
// the F04 navigation path on every single test -- TC-QUIZ-001's whole point
// (branch A) was never exercised, and TC-QUIZ-002 could not be told apart from
// it. The decision now lives in QuizPlayerPage.ensureQuizAvailable(), which
// navigates ONLY when the quiz is genuinely absent, and TC-QUIZ-001 asserts
// that the app did not move.

import { PlaylistPage } from "../../pages/PlaylistPage";
import { QuizPlayerPage as Quiz } from "../../pages/QuizPlayerPage";

describe("Quiz Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    // F01 -> F02 only. This establishes the precondition ("a Playlist holding
    // the Quiz is open") and NOTHING MORE: it navigates the curriculum only if
    // the quiz is not already in the Playlist the app came back to. Do not put
    // an unconditional goToTargetClass() here again.
    Quiz.ensureQuizAvailable(Quiz.MCQ_QUIZ);
  });

  // --- Opening the quiz ----------------------------------------------------

  // Branch A (F02 -> F03 -> F05). The case is not "a quiz opens"; it is "the
  // quiz opens WITHOUT any curriculum navigation", so the class/chapter/topic
  // the app is sitting on is captured first and asserted unchanged afterwards.
  // Without that assertion this test passes just as happily on the navigation
  // path and stops being TC-QUIZ-001 at all.
  it("TC-QUIZ-001: opens a Quiz directly when it already exists in the Playlist, without navigating", () => {
    Quiz.ensureDrawerVisible();
    Quiz.settlePlaylist();
    Quiz.cards().should("have.length.greaterThan", 0);
    // The Playlist is a horizontally scrolling strip inside a position:fixed
    // ancestor, so a card that exists can still be scrolled out of view --
    // asserting visibility without scrolling to it first fails on the quiz
    // cards, which sit at the far end of the strip.
    Quiz.card(Quiz.MCQ_QUIZ).scrollIntoView().should("be.visible");

    Quiz.currentLocation().then((before) => {
      // openDirectly() clicks the card only; it has no navigation path at all
      // and fails outright if the precondition is not met.
      Quiz.openDirectly(Quiz.MCQ_QUIZ);
      Quiz.question().should("be.visible");

      Quiz.close();
      Quiz.ensureDrawerVisible();
      Quiz.currentLocation().should("eq", before);
    });
  });

  // Branch B (F02 -> F04 -> F05). The precondition is a Playlist with NO quiz,
  // which the configured target topic cannot provide, so one is looked for in
  // the other chapters of the same class. If the account has none, the case is
  // marked pending at runtime -- a missing D03 fixture is a test-data gap, and
  // reporting it as a pass would be a lie.
  it("TC-QUIZ-002: navigates to the Quiz only when it is absent from the current Playlist", function () {
    Quiz.findPlaylistWithoutQuiz().then(({ found, chapterIndex }) => {
      if (!found) {
        cy.log(
          "PENDING (test data D03): no quiz-free Playlist found in the searched chapters of this class, so the 'quiz is absent' precondition cannot be created here."
        );
        this.skip();
        return;
      }

      // Precondition established: this Playlist genuinely has no quiz.
      cy.log(`Quiz-free Playlist found in chapter index ${chapterIndex}`);
      Quiz.cards().should("have.length", 0);

      // F04: Grade -> Subject -> Chapter/Topic -> Playlist.
      PlaylistPage.goToTargetClass();
      Quiz.settlePlaylist();

      // The quiz appears only after that navigation.
      Quiz.card(Quiz.MCQ_QUIZ).should("exist").scrollIntoView().should("be.visible");

      Quiz.openDirectly(Quiz.MCQ_QUIZ);
      Quiz.question().should("be.visible");
    });
  });

  it("TC-QUIZ-004: the Quiz Player loads with its question and options visible", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().should("be.visible").invoke("text").should("have.length.greaterThan", 0);
    Quiz.options().should("have.length.greaterThan", 1);
    Quiz.submitButton().should("exist");
  });

  // --- Content rendering ---------------------------------------------------

  it("TC-QUIZ-005: renders a text question with text options", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    Quiz.question().invoke("text").should("match", /\S/);

    // Every option must carry both its A/B/C/D label and readable text.
    Quiz.options().should("have.length", 4);
    Quiz.optionLabels().should("have.length", 4);
    Quiz.optionTexts().each(($el) => {
      expect($el.text().trim(), "option text is not empty").to.match(/\S/);
    });
  });

  // --- Answer selection ----------------------------------------------------

  it("TC-QUIZ-009: an option can be selected and shows as selected", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.selectOption(0);
    Quiz.optionIsSelected(0);
  });

  it("TC-QUIZ-010: changing the selection clears the previous one", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.selectOption(0);
    Quiz.optionIsSelected(0);

    Quiz.selectOption(1);
    Quiz.optionIsSelected(1);
    // Single-answer behaviour, despite the checkbox markup.
    Quiz.optionIsNotSelected(0);
  });

  it("TC-QUIZ-011: Submit Answer is unavailable while nothing is selected", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    // The real-user-observable behaviour is that the control is disabled.
    // Force-clicking it anyway fires the handler and reveals the answer --
    // that is a test artefact, not app behaviour, so it is not asserted here.
    Quiz.submitButton().should("be.disabled");
    Quiz.correctOptions().should("not.exist");
    Quiz.incorrectOptions().should("not.exist");
  });

  // --- Results -------------------------------------------------------------

  it("TC-QUIZ-012: submitting the correct answer marks it Correct", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);

    // Q1's correct answer is A (index 0) -- confirmed by reveal.
    Quiz.selectOption(0);
    Quiz.submit();

    Quiz.options().eq(0).should("have.class", "correct");
    Quiz.incorrectOptions().should("not.exist");
  });

  it("TC-QUIZ-013: submitting a wrong answer marks it Incorrect and shows the correct one", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);

    // B (index 1) is wrong for Q1; A is right.
    Quiz.selectOption(1);
    Quiz.submit();

    Quiz.options().eq(1).should("have.class", "incorrect");
    Quiz.options().eq(0).should("have.class", "correct");
  });

  it("TC-QUIZ-014: Next Question appears after submitting and moves to the next question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);
    Quiz.selectOption(0);
    Quiz.submit();

    // Submitting replaces Submit/Show Answer with a single Next Question.
    Quiz.submitButton().should("not.exist");
    Quiz.nextQuestionButton().should("be.visible").click({ force: true });
    cy.wait(2500);

    Quiz.currentQuestionNumber().should("eq", "2");
  });

  it("TC-QUIZ-015: Show Answer reveals the correct option", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(2);

    Quiz.correctOptions().should("not.exist");
    Quiz.showAnswer();

    // Q2's correct answer is C (index 2).
    Quiz.correctOptions().should("have.length", 1);
    Quiz.options().eq(2).should("have.class", "correct");
  });

  // --- Question navigation -------------------------------------------------

  it("TC-QUIZ-016: a question number opens that question and updates the indicator", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().invoke("text").then((firstQuestion) => {
      Quiz.goToQuestion(3);
      Quiz.currentQuestionNumber().should("eq", "3");
      Quiz.question().invoke("text").should("not.eq", firstQuestion);
    });
  });

  it("TC-QUIZ-017: Next moves to the following question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.currentQuestionNumber().should("eq", "1");
    Quiz.goNext();
    Quiz.currentQuestionNumber().should("eq", "2");
  });

  it("TC-QUIZ-018: Previous moves back to the preceding question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(2);
    Quiz.currentQuestionNumber().should("eq", "2");

    Quiz.goPrevious();
    Quiz.currentQuestionNumber().should("eq", "1");
  });

  // Both boundary cases assert that the control is GENUINELY UNUSABLE, rather
  // than clicking it and checking nothing moved.
  //
  // Why: the chevron at a boundary carries pointer-events:none and a real
  // disabled attribute, so a user cannot click it at all. Forcing the click
  // past that does fire the handler, and it leaves the pagination in a state
  // no user can reach -- the .current class is stripped from every item.
  // Asserting against that would be testing an artefact of the test itself.
  // (The same force-click trap applies to Submit Answer -- see TC-QUIZ-011.)
  //
  // Each case still proves the control WORKS away from the boundary first,
  // otherwise "cannot move" would pass even if the control were simply broken.

  it("TC-QUIZ-019: Previous cannot move before the first question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    // Positive control: Previous genuinely works away from the boundary.
    Quiz.goToQuestion(2);
    Quiz.goPrevious();
    Quiz.currentQuestionNumber().should("eq", "1");

    // At the boundary it is disabled, so the move is impossible by design.
    Quiz.previousControl().should("have.class", "pagination-disable");
    Quiz.previousControl().find("button").should("be.disabled");
    Quiz.currentQuestionNumber().should("eq", "1");
  });

  it("TC-QUIZ-020: Next cannot move beyond the last question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    // Positive control: Next genuinely works away from the boundary.
    Quiz.goNext();
    Quiz.currentQuestionNumber().should("eq", "2");

    Quiz.questionCount().then((last) => {
      Quiz.goToQuestion(last);
      Quiz.currentQuestionNumber().should("eq", String(last));

      Quiz.nextControl().should("have.class", "pagination-disable");
      Quiz.nextControl().find("button").should("be.disabled");
      Quiz.currentQuestionNumber().should("eq", String(last));
    });
  });

  // --- Close and reopen ----------------------------------------------------

  it("TC-QUIZ-021: the Quiz can be closed and the Playlist returns", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().should("be.visible");

    Quiz.close();

    cy.get(".qb-mcq.qb-tempalete").should("not.exist");
    Quiz.ensureDrawerVisible();
    Quiz.cards().should("have.length.greaterThan", 0);
  });

  it("TC-QUIZ-022: the same Quiz can be reopened after closing", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().should("be.visible");
    Quiz.close();
    cy.get(".qb-mcq.qb-tempalete").should("not.exist");

    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().should("be.visible");
    Quiz.options().should("have.length.greaterThan", 1);
  });

  // --- Not exercisable on this app / account -------------------------------
  //
  // Left as explicit skips with reasons, per the project's convention of
  // documenting gaps rather than deleting cases.

  it.skip("TC-QUIZ-003: AIR Card appears when the Quiz is opened (no AIR Card appears for either quiz in this curriculum; the variant is chosen inside the player from the question set and cannot be forced -- claude/APP_QUIRKS.md)", () => {});

  // PENDING CONTENT, not a limitation of the app or the framework. Image
  // questions render as ordinary <img> inside the renderer and would be
  // straightforward to assert -- there is simply nothing to point at here.
  //
  // Evidence: every question in the configured class was walked and scanned --
  // "Play Quiz" 5/5 (multiple choice) and "My Exercise" 25/25 (open ended),
  // 30 questions in total. Zero <img> elements anywhere inside
  // lib-quiz-renderer, on questions or options.
  //
  // To enable: supply a class/chapter/topic holding a quiz with image content,
  // add it to cypress/config/targetClass.js, and these become assertions on
  // Quiz.question() img / Quiz.options() img exactly like TC-QUIZ-005.
  it.skip("TC-QUIZ-006: image question with text options (PENDING -- workbook coverage C02; no image content in this class, 30/30 questions scanned)", () => {});
  it.skip("TC-QUIZ-007: text question with image options (PENDING -- workbook coverage C03; no image content in this class, 30/30 questions scanned)", () => {});
  it.skip("TC-QUIZ-008: image question with image options (PENDING -- workbook coverage C04; no image content in this class, 30/30 questions scanned)", () => {});
});
