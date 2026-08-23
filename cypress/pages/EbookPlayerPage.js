// Page Object for the E-book Player, opened from the Playlist's "E-Books"
// button (a per-CHAPTER flag, NOT a filterable resource-card type -- see
// cypress/pages/CompassPage.js-style source notes and e-book.component.ts
// in cep2-workspace for why this is architecturally different from every
// other player).
//
// CONFIRMED live (2026-08-22) at Class 12A | Physics | Chapter 14
// "Semiconductor Electronics..." | first topic -- book title "(CE Crystal)
// NCERT Physics Class 12", 15 chapters, 1 linked resource on the opened
// chapter. See PlaylistPage.js -- no dedicated nav helper was added there
// since this is reached via the E-Books button, not chapter/topic
// navigation like the other Computer-Science-based helpers.
//
// Source (relative to cep2-workspace):
//   projects/main/src/app/modules/playlist/containers/e-book/e-book.component.html (trigger)
//   projects/main/src/app/modules/player/container/ebook-player/ebook-player.component.ts (orchestrator)
//   projects/main/src/app/modules/player/container/ebook-player/chapter-list/chapter-list.component.html
//   projects/main/src/app/modules/player/container/ebook-player/resource-list/resource-list.component.html
//
// CONFIRMED structure: the player wrapper carries classes
// `.player.pdf-player.Ebook-pdf-player` (every player gets `.player.{type}`
// from the shared createPlayer() helper; ebook additionally gets
// `Ebook-pdf-player` -- see player.abstract.ts). Inside it: a PdfComponent
// (the SAME PDF.js-based viewer pdf-worksheet.cy.js already documents as
// having NO stable page-turning/toolbar selectors -- that limitation
// applies here too), a ChapterListComponent (left drawer), and a
// ResourceListComponent (right drawer). Chapter-linked resources reuse
// `app-resource-card`/`app-asset-card`/`app-quiz-card`, which carry the
// SAME data-qa-ids as the main Playlist strip.

export const EbookPlayerPage = {
  triggerBtn() {
    return cy.get('[data-qa-id="playlist-e-book-btn"]');
  },

  launchBtn() {
    return cy.get('[data-qa-id="playlist-e-book-launch-btn"]');
  },

  bookTitle() {
    return this.launchBtn().find(".book-title").invoke("text").invoke("trim");
  },

  // The PDF itself renders quickly, but the chapter list and resource list
  // both depend on getChapterList$ -- which fetches getEbookByChapterId for
  // EVERY chapter one at a time (concatMap, not parallel) before either
  // panel renders anything (see ebook-player.component.ts's getEbook()).
  // With 15 chapters here, a fixed short wait was confirmed flaky (some
  // runs the panels weren't there yet) -- poll for the chapter list instead
  // of guessing a wait long enough to always cover it.
  open() {
    this.triggerBtn().should("be.visible").click({ force: true });
    cy.wait(800);
    this.launchBtn().should("be.visible").click({ force: true });
    cy.get('[data-qa-id^="player-ebook-chapter-"]', { timeout: 25000 }).should("have.length.greaterThan", 0);
    cy.wait(1000);
  },

  wrapper() {
    return cy.get(".player.pdf-player.Ebook-pdf-player");
  },

  chapterListItems() {
    return cy.get('[data-qa-id^="player-ebook-chapter-"]');
  },

  chapterItem(index) {
    return this.chapterListItems().eq(index);
  },

  selectedChapterItem() {
    return cy.get('[data-qa-id^="player-ebook-chapter-"].selected');
  },

  chapterDrawerToggle() {
    return cy.get('[data-qa-id="player-ebook-chapter-drawer-toggle"]');
  },

  resourceDrawerToggle() {
    return cy.get('[data-qa-id="player-ebook-resource-drawer-toggle"]');
  },

  // ResourceListComponent fetches combinedResources in its OWN ngOnInit
  // subscription, independent of (and not blocked by) the chapter list's
  // readiness -- confirmed in resource-list.component.ts. open() only
  // guarantees the CHAPTER list has rendered; this needs its own generous
  // timeout since it was confirmed to sometimes still be loading past the
  // default 10s.
  resourceCards() {
    return cy.get(
      '.resources_list_right [data-qa-id="playlist-resource-card"], .resources_list_right [data-qa-id="playlist-asset-card"], .resources_list_right [data-qa-id="playlist-quiz-card"]',
      { timeout: 20000 }
    );
  },

  // "{{combinedResources.length}} Linked Resources" -- real text, no data-qa-id.
  linkedResourcesCountLabel() {
    return cy.get(".resource-list-header p.mat-body-3");
  },

  scrollUpBtn() {
    return cy.get('[data-qa-id="player-ebook-resource-scroll-up"]');
  },

  scrollDownBtn() {
    return cy.get('[data-qa-id="player-ebook-resource-scroll-down"]');
  },

  noResourcesMessage() {
    return cy.contains(".no-resources", "No resources found!");
  },
};
