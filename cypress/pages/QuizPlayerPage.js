// Page Object for the Quiz Player, written for the reworked test cases in
// Test_Cases/quiz player rework/Quiz_Player_Test_Cases_Reworked.xlsx.
//
// WHY THIS FILE EXISTS AT ALL
// ---------------------------
// claude/APP_QUIRKS.md said the quiz UI is an "externally-loaded embedded
// widget ... the button itself has no selector in this codebase", and the old
// quiz.cy.js skipped 24 of its 28 cases on that basis. That note is accurate
// about SOURCE OWNERSHIP, but it was read as "not reachable from a test",
// which is a different claim and is not true.
//
// Direct exploration (cypress/scratch/quiz-*.cy.js) established:
//   - ZERO iframes. The renderer is same-origin Angular DOM in the main
//     document, so Cypress can query all of it.
//   - Components are lib-quiz-renderer > lib-std-quiz (multiple choice) or
//     lib-open-ended-question, plus app-quiz-action-nav / app-nav-pagination.
// Every selector below was read off the live DOM. None is guessed -- the
// workbook's 06_Automation Mapping sheet requires exactly that.
//
// CONTENT FACTS (QA account, Class 8A | Computer Science, chapter 0/topic 0,
// i.e. the configured targetClass):
//   "Play Quiz"   -> multiple choice, 5 questions, all text question + text
//                    options. The only MCQ quiz found.
//                    Known answers: Q1 = A, Q2 = C, Q3 = A.
//   "My Exercise" -> open ended, 18 questions, "Show Answer" only, NO options.
//
// BEHAVIOUR FACTS worth knowing before editing these tests:
//   - Options are Angular Material CHECKBOXES, but behave as SINGLE-ANSWER:
//     selecting a second option clears the first. Confirmed, not assumed.
//   - "Submit Answer" is disabled until something is selected. Do NOT force
//     click it while disabled -- a forced click fires the handler anyway and
//     reveals the answer, which is unreachable for a real user and silently
//     corrupts every later assertion.
//   - Once a question is submitted OR revealed, Submit/Show Answer are both
//     replaced by a single "Next Question" button and the question locks.
//   - That lock does not survive a new session, so tests stay repeatable.

import { PlaylistPage } from "./PlaylistPage";

export const QuizPlayerPage = {
  // Content fixtures, kept here so a curriculum change is a one-place edit.
  MCQ_QUIZ: "Play Quiz",
  OPEN_ENDED_QUIZ: "My Exercise",
  KNOWN_ANSWERS: { 1: "A", 2: "C", 3: "A" },

  // ---- Playlist side ------------------------------------------------------

  // [data-qa-id="playlist-quiz-card"] is the outer <app-quiz-card> wrapper and
  // is a no-op if clicked; the real target is the inner .resource-card
  // (claude/APP_QUIRKS.md:36). Re-confirmed during this exploration.
  CARD_SELECTOR: '[data-qa-id="playlist-quiz-card"] .resource-card',
  card(title) {
    return title
      ? cy.contains('[data-qa-id="playlist-quiz-card"] .resource-card', title)
      : cy.get('[data-qa-id="playlist-quiz-card"] .resource-card').first();
  },

  cards() {
    return cy.get('[data-qa-id="playlist-quiz-card"]');
  },

  // Opening a quiz needs the drawer visible: while hidden the cards sit at
  // opacity 0 and the click is a silent no-op. The first exploration run died
  // exactly there and looked like "the quiz will not open".
  //
  // The drawer auto-hides again as soon as a resource opens, so this runs
  // before EVERY open, not once per spec.
  ensureDrawerVisible() {
    cy.get('[data-qa-id="playlist-drawer-btn"]', { timeout: 20000 }).then(($btn) => {
      if ($btn.text().toUpperCase().includes("SHOW")) {
        cy.wrap($btn).click({ force: true });
        cy.wait(1000);
      }
    });
  },

  cardCount() {
    return cy.get("body").then(($body) => $body.find(this.CARD_SELECTOR).length);
  },

  // True/false for "is this quiz in the Playlist that is open RIGHT NOW",
  // decided from the DOM without navigating anything.
  hasQuiz(title = this.MCQ_QUIZ) {
    return cy.get("body").then(($body) =>
      $body
        .find(this.CARD_SELECTOR)
        .toArray()
        .some((el) => (el.innerText || "").includes(title))
    );
  },

  // Waiting for the resource strip to render is not quiz-specific -- every
  // player type has to do it before deciding "is my resource already here?",
  // so it lives on PlaylistPage. Kept as a thin alias because this spec reads
  // better with the quiz vocabulary.
  settlePlaylist(maxAttempts = 12, attempt = 0) {
    return PlaylistPage.settle(maxAttempts, attempt);
  },

  // ---- F02: the decision, not a step --------------------------------------
  //
  // Workbook 01_Flow / 02_Flow Branch:
  //   F02  Check whether Quiz exists in current Playlist -> YES: F03, NO: F04
  //   F03  Quiz already exists -> "Open Quiz directly; DO NOT NAVIGATE CURRICULUM."
  //   F04  Quiz does not exist -> Grade -> Subject -> Chapter/Topic -> Playlist
  //
  // Calling PlaylistPage.goToTargetClass() unconditionally in a beforeEach
  // violates TC-QUIZ-001's precondition: it forces the navigation path on
  // every run, so branch A is never actually exercised and the suite cannot
  // tell the two branches apart. Navigation belongs HERE, behind the check.
  //
  // Yields { navigated: boolean } so a test can assert which branch it took.
  ensureQuizAvailable(title = this.MCQ_QUIZ) {
    this.ensureDrawerVisible();
    return this.settlePlaylist().then(() =>
      this.hasQuiz(title).then((present) => {
        if (present) {
          cy.log(`F02 -> F03: "${title}" is already in the current Playlist -- opening directly, no curriculum navigation`);
          return cy.wrap({ navigated: false }, { log: false });
        }
        cy.log(`F02 -> F04: "${title}" is absent from the current Playlist -- navigating Grade/Subject/Chapter/Topic`);
        PlaylistPage.goToTargetClass();
        this.settlePlaylist();
        this.card(title).should("exist");
        return cy.wrap({ navigated: true }, { log: false });
      })
    );
  },

  // Clicks the card in whatever Playlist is currently open. Navigates only if
  // the quiz is not there -- see ensureQuizAvailable.
  open(title = this.MCQ_QUIZ) {
    this.ensureQuizAvailable(title);
    this.ensureDrawerVisible();
    this.card(title).click({ force: true });
    // The renderer fetches its question set before painting.
    cy.get("lib-quiz-renderer", { timeout: 20000 }).should("exist");
    cy.wait(3000);
  },

  // Branch A only: fails rather than silently navigating if the precondition
  // ("Quiz visible in the current Playlist") is not actually met.
  openDirectly(title = this.MCQ_QUIZ) {
    this.ensureDrawerVisible();
    this.settlePlaylist();
    this.hasQuiz(title).should(
      "eq",
      true,
      `precondition for the direct path: "${title}" is in the current Playlist`
    );
    this.card(title).click({ force: true });
    cy.get("lib-quiz-renderer", { timeout: 20000 }).should("exist");
    cy.wait(3000);
  },

  currentLocation() {
    return PlaylistPage.currentLocation();
  },

  // ---- Branch B support ---------------------------------------------------
  //
  // TC-QUIZ-002 needs test data D03, "Playlist without Quiz", which the
  // configured target topic cannot supply (it always holds two quizzes).
  // Rather than skip the case outright, look for a quiz-free Playlist in the
  // other chapters of the same class. Bounded, because each hop is a real
  // navigation costing several seconds.
  //
  // Yields { found, chapterIndex }. found === false means this account has no
  // quiz-free Playlist within the search budget -- the case is then pending on
  // test data, not failing.
  findPlaylistWithoutQuiz(maxChapters = 4) {
    PlaylistPage.openChaptersPopup();
    return cy
      .get('[data-qa-id="playlist-select-chapter"]')
      .its("length")
      .then((chapterCount) => {
        // Close the popup we opened just to count.
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
        cy.wait(500);

        const limit = Math.min(chapterCount, maxChapters);
        // Chapter 0 is the configured target and is known to hold quizzes,
        // so the search starts at 1.
        const tryChapter = (index) => {
          if (index >= limit) return cy.wrap({ found: false, chapterIndex: null }, { log: false });
          PlaylistPage.goToChapterTopic(index, 0);
          this.settlePlaylist(6);
          return this.cardCount().then((quizCards) => {
            if (quizCards === 0) return cy.wrap({ found: true, chapterIndex: index }, { log: false });
            return tryChapter(index + 1);
          });
        };
        return tryChapter(1);
      });
  },

  // ---- Player chrome ------------------------------------------------------

  // Both are <button class="closeIcon btn">; the split-screen one carries the
  // extra m-r4 class and an inline SVG. Told apart by class, never by index.
  closeButton() {
    return cy.get("button.closeIcon.btn").not(".m-r4").first();
  },

  splitScreenButton() {
    return cy.get("button.closeIcon.btn.m-r4").first();
  },

  close() {
    this.closeButton().click({ force: true });
    cy.wait(1500);
  },

  // ---- Question and options ----------------------------------------------

  // .qb-tempalete is the app's own spelling. Do not "fix" it.
  question() {
    return cy.get(".qb-mcq.qb-tempalete");
  },

  options() {
    return cy.get(".quiz-options-group .option-content");
  },

  optionLabels() {
    return cy.get(".quiz-options-group .option-content .option-label");
  },

  optionTexts() {
    return cy.get(".quiz-options-group .option-content .option-text");
  },

  // The clickable target is the Material label. Confirmed by trying every
  // candidate: label.mdc-label, the native input and .option-content-wrapper
  // all work; the .option-content div itself and .mat-mdc-checkbox do NOT.
  selectOption(index) {
    this.options().eq(index).find("label.mdc-label").first().click({ force: true });
    cy.wait(800);
  },

  optionIsSelected(index) {
    return this.options().eq(index).find("input").should("be.checked");
  },

  optionIsNotSelected(index) {
    return this.options().eq(index).find("input").should("not.be.checked");
  },

  // Result markers land as plain "correct" / "incorrect" classes on the
  // .option-content element once the answer is submitted or revealed.
  correctOptions() {
    return cy.get(".quiz-options-group .option-content.correct");
  },

  incorrectOptions() {
    return cy.get(".quiz-options-group .option-content.incorrect");
  },

  // ---- Action buttons -----------------------------------------------------
  //
  // None carries a data-qa-id, so they are located by visible label -- which
  // is what a user reads anyway.
  submitButton() {
    return cy.contains("button", "Submit Answer");
  },

  showAnswerButton() {
    return cy.contains("button", "Show Answer");
  },

  nextQuestionButton() {
    return cy.contains("button", "Next Question");
  },

  submit() {
    this.submitButton().should("not.be.disabled").click({ force: true });
    cy.wait(2500);
  },

  showAnswer() {
    this.showAnswerButton().click({ force: true });
    cy.wait(2000);
  },

  // ---- Question navigation ------------------------------------------------
  //
  // The clickable element is button.mypage-link. The surrounding li.page-item
  // is NOT clickable -- clicking it silently does nothing, which cost one
  // wasted exploration run.
  //
  // Use cy.contains(selector, content), NOT cy.get(sel).contains(content):
  // the latter scopes the search to the FIRST matched element (a chevron)
  // instead of searching the whole set.
  questionNumber(n) {
    return cy.contains("button.mypage-link", new RegExp("^\\s*" + n + "\\s*$"));
  },

  goToQuestion(n) {
    this.questionNumber(n).click({ force: true });
    cy.wait(2500);
  },

  currentQuestionNumber() {
    return cy.get("li.page-item.number-item.current").invoke("text").invoke("trim");
  },

  questionCount() {
    return cy.get("li.page-item.number-item").its("length");
  },

  // Chevrons live in the same pagination strip; disabled state is a
  // .pagination-disable class on the li, not a disabled attribute.
  previousControl() {
    return cy.get("li.page-item.previous-item");
  },

  nextControl() {
    return cy.get("li.page-item.next-item");
  },

  // The chevrons are the SAME li-wrapping-a-button trap as the numbers: the
  // li.page-item is inert and clicking it does nothing at all. Clicking the
  // li made TC-QUIZ-017/018 fail outright, and -- worse -- made TC-QUIZ-019/020
  // pass vacuously, because "the question did not change" is trivially true
  // when the click never fired. Always click the inner button.
  goNext() {
    this.nextControl().find("button").first().click({ force: true });
    cy.wait(2500);
  },

  goPrevious() {
    this.previousControl().find("button").first().click({ force: true });
    cy.wait(2500);
  },
};
