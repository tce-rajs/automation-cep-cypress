import { PlaylistPage } from "./PlaylistPage";
import quizClass from "../config/quizClass";

export const QuizPlayerPage = {
  MCQ_QUIZ: "Play Quiz",
  OPEN_ENDED_QUIZ: "My Exercise",

  QUESTION_COUNT: 7,

  CARD_SELECTOR: '[data-qa-id="playlist-quiz-card"] .resource-card',
  card(title) {
    return title
      ? cy.contains('[data-qa-id="playlist-quiz-card"] .resource-card', title)
      : cy.get('[data-qa-id="playlist-quiz-card"] .resource-card').first();
  },

  cards() {
    return cy.get('[data-qa-id="playlist-quiz-card"]');
  },

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

  hasQuiz(title = this.MCQ_QUIZ) {
    return cy.get("body").then(($body) =>
      $body
        .find(this.CARD_SELECTOR)
        .toArray()
        .some((el) => (el.innerText || "").includes(title))
    );
  },

  settlePlaylist(maxAttempts = 12, attempt = 0) {
    return PlaylistPage.settle(maxAttempts, attempt);
  },

  ensureQuizAvailable(title = this.MCQ_QUIZ) {
    this.ensureDrawerVisible();
    return this.settlePlaylist().then(() =>
      this.hasQuiz(title).then((present) => {
        if (present) {
          cy.log(`F02 -> F03: "${title}" is already in the current Playlist -- opening directly, no curriculum navigation`);
          return cy.wrap({ navigated: false }, { log: false });
        }
        cy.log(`F02 -> F04: "${title}" is absent from the current Playlist -- navigating Grade/Subject/Chapter/Topic`);
        this.goToQuizClass();
        this.card(title).should("exist");
        return cy.wrap({ navigated: true }, { log: false });
      })
    );
  },

  open(title = this.MCQ_QUIZ) {
    this.ensureQuizAvailable(title);
    this.ensureDrawerVisible();
    this.card(title).click({ force: true });

    cy.get("lib-quiz-renderer", { timeout: 20000 }).should("exist");
    cy.wait(3000);
  },

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

  goToQuizClass() {
    PlaylistPage.goToClass(quizClass.grade, quizClass.division, quizClass.subject);
    PlaylistPage.goToChapterTopic(quizClass.chapterIndex, quizClass.topicIndex);
    PlaylistPage.ensureDrawerVisible();
    return this.settlePlaylist(8);
  },

  findPlaylistWithoutQuiz(maxChapters = 4) {
    PlaylistPage.openChaptersPopup();
    return cy
      .get('[data-qa-id="playlist-select-chapter"]')
      .its("length")
      .then((chapterCount) => {
        cy.get('[data-qa-id="playlist-chapter-topic-btn"]').click({ force: true });
        cy.wait(500);

        const limit = Math.min(chapterCount, maxChapters);
        const tryChapter = (index) => {
          if (index >= limit) return cy.wrap({ found: false, chapterIndex: null }, { log: false });
          PlaylistPage.goToChapterTopic(index, 0);
          this.settlePlaylist(4);
          return this.cardCount().then((quizCards) => {
            if (quizCards === 0) return cy.wrap({ found: true, chapterIndex: index }, { log: false });
            return tryChapter(index + 1);
          });
        };
        return tryChapter(1);
      });
  },

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

  correctOptions() {
    return cy.get(".quiz-options-group .option-content.correct");
  },

  incorrectOptions() {
    return cy.get(".quiz-options-group .option-content.incorrect");
  },

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

  previousControl() {
    return cy.get("li.page-item.previous-item");
  },

  nextControl() {
    return cy.get("li.page-item.next-item");
  },

  goNext() {
    this.nextControl().find("button").first().click({ force: true });
    cy.wait(2500);
  },

  goPrevious() {
    this.previousControl().find("button").first().click({ force: true });
    cy.wait(2500);
  },
};
