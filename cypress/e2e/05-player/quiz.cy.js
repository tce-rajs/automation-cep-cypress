import { PlaylistPage } from "../../pages/PlaylistPage";
import { QuizPlayerPage as Quiz } from "../../pages/QuizPlayerPage";

describe("Quiz Player", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);

    Quiz.ensureQuizAvailable(Quiz.MCQ_QUIZ);
  });

  it("TC-QUIZ-001: opens a Quiz directly when it already exists in the Playlist, without navigating", () => {
    Quiz.ensureDrawerVisible();
    Quiz.settlePlaylist();
    Quiz.cards().should("have.length.greaterThan", 0);

    Quiz.card(Quiz.MCQ_QUIZ).scrollIntoView().should("be.visible");

    Quiz.currentLocation().then((before) => {
      Quiz.openDirectly(Quiz.MCQ_QUIZ);
      Quiz.question().should("be.visible");

      Quiz.close();
      Quiz.ensureDrawerVisible();
      Quiz.currentLocation().should("eq", before);
    });
  });

  it("TC-QUIZ-002: navigates to the Quiz only when it is absent from the current Playlist", function () {
    Quiz.findPlaylistWithoutQuiz().then(({ found, chapterIndex }) => {
      if (!found) {
        cy.log("PENDING (test data D03): no quiz-free Playlist found within the search budget.");
        this.skip();
        return;
      }
      cy.log(`Quiz-free Playlist found in chapter index ${chapterIndex}`);
      Quiz.cards().should("have.length", 0);

      PlaylistPage.currentLocation().then((beforeNavigation) => {
        Quiz.ensureQuizAvailable(Quiz.MCQ_QUIZ).should("deep.eq", { navigated: true });

        PlaylistPage.currentLocation().should("not.eq", beforeNavigation);
        Quiz.card(Quiz.MCQ_QUIZ).should("exist").scrollIntoView().should("be.visible");

        Quiz.openDirectly(Quiz.MCQ_QUIZ);
        Quiz.question().should("be.visible");
      });
    });
  });

  it("TC-QUIZ-004: the Quiz Player loads with its question and options visible", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.question().should("be.visible").invoke("text").should("have.length.greaterThan", 0);
    Quiz.options().should("have.length.greaterThan", 1);
    Quiz.submitButton().should("exist");
  });

  it("TC-QUIZ-005: renders a text question with text options", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    Quiz.question().invoke("text").should("match", /\S/);

    Quiz.options().should("have.length.greaterThan", 1);
    Quiz.options().then(($options) => {
      Quiz.optionLabels().should("have.length", $options.length);
      Quiz.optionTexts().should("have.length", $options.length);
    });
    Quiz.optionTexts().each(($el) => {
      expect($el.text().trim(), "option text is not empty").to.match(/\S/);
    });
  });

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

    Quiz.optionIsNotSelected(0);
  });

  it("TC-QUIZ-011: Submit Answer is unavailable while nothing is selected", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    Quiz.submitButton().should("be.disabled");
    Quiz.correctOptions().should("not.exist");
    Quiz.incorrectOptions().should("not.exist");
  });

  // CONFIRMED live 2026-08-22: Quiz.ANSWERS was hardcoded against the quiz
  // that quizClass.js used to point at (Class 7A | English Language). After
  // retargeting quizClass.js to Class 12A | Computer Science (a different
  // quiz, different correct answers), those hardcoded indices went stale --
  // exactly the kind of staleness a static answer map risks whenever the
  // target class changes. Both cases below now discover the real correct
  // index live via Show Answer first, rather than trusting a map.
  it("TC-QUIZ-012: submitting the correct answer marks it Correct", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);
    Quiz.showAnswer();
    Quiz.correctOptions().should("have.length", 1);
    Quiz.correctOptions()
      .invoke("index")
      .then((correctIndex) => {
        // Reopen fresh so Show Answer's revealed state doesn't interfere
        // with a normal submit-based flow.
        Quiz.close();
        Quiz.open(Quiz.MCQ_QUIZ);
        Quiz.goToQuestion(1);

        Quiz.selectOption(correctIndex);
        Quiz.submit();

        Quiz.options().eq(correctIndex).should("have.class", "correct");
        Quiz.incorrectOptions().should("not.exist");
      });
  });

  it("TC-QUIZ-013: submitting a wrong answer marks it Incorrect and shows the correct one", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);
    Quiz.showAnswer();
    Quiz.correctOptions()
      .invoke("index")
      .then((correctIndex) => {
        const wrongIndex = correctIndex === 0 ? 1 : 0;

        Quiz.close();
        Quiz.open(Quiz.MCQ_QUIZ);
        Quiz.goToQuestion(1);

        Quiz.selectOption(wrongIndex);
        Quiz.submit();

        Quiz.options().eq(wrongIndex).should("have.class", "incorrect");
        Quiz.options().eq(correctIndex).should("have.class", "correct");
      });
  });

  it("TC-QUIZ-014: Next Question appears after submitting and moves to the next question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);
    Quiz.goToQuestion(1);
    // Correctness doesn't matter for this case -- any selected option works.
    Quiz.selectOption(0);
    Quiz.submit();

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

    // Exactly one option gets marked correct -- which one is real app data,
    // not something to hardcode (see TC-QUIZ-012's note on why the old
    // static ANSWERS map went stale).
    Quiz.correctOptions().should("have.length", 1);
  });

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

  it("TC-QUIZ-019: Previous cannot move before the first question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

    Quiz.goToQuestion(2);
    Quiz.goPrevious();
    Quiz.currentQuestionNumber().should("eq", "1");

    Quiz.previousControl().should("have.class", "pagination-disable");
    Quiz.previousControl().find("button").should("be.disabled");
    Quiz.currentQuestionNumber().should("eq", "1");
  });

  it("TC-QUIZ-020: Next cannot move beyond the last question", () => {
    Quiz.open(Quiz.MCQ_QUIZ);

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

  it.skip("TC-QUIZ-003: AIR Card appears when the Quiz is opened (no AIR Card appears for either quiz in this curriculum; the variant is chosen inside the player from the question set and cannot be forced -- claude/APP_QUIRKS.md)", () => {});

  it.skip("TC-QUIZ-006: image question with text options (PENDING -- workbook coverage C02; no image content in this class, 30/30 questions scanned)", () => {});
  it.skip("TC-QUIZ-007: text question with image options (PENDING -- workbook coverage C03; no image content in this class, 30/30 questions scanned)", () => {});
  it.skip("TC-QUIZ-008: image question with image options (PENDING -- workbook coverage C04; no image content in this class, 30/30 questions scanned)", () => {});
});
