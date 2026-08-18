// Page Object for the TCE resource Library panel (search, preview,
// attach-to-playlist). Used by library.cy.js and gallery.cy.js (for the
// Gallery-vs-Library comparison test).

import { PlaylistPage } from "./PlaylistPage";

export const LibraryPage = {
  open() {
    // The FAB sits inside the Playlist drawer's wrapper, so a hidden drawer
    // makes this click a no-op against an opacity-0 element.
    PlaylistPage.ensureDrawerVisible();
    // No { force: true } -- see the note in AddResourcePage.open().
    cy.get('[data-qa-id="add-resource-trigger"]', { timeout: 20000 }).should("be.visible").click();
    cy.wait(800);
    cy.get('[data-qa-id="add-resource-action-library"]').click({ force: true });
    cy.wait(1200);
  },

  // Library appears to fire a default auto-search for the current lesson
  // topic when it first opens. If that slower response lands after our own
  // search and overwrites the result view, re-click search once to force
  // our term to win.
  search(term) {
    cy.get('[data-qa-id="tce-library-search-input"]').clear().type(term);
    cy.get('[data-qa-id="tce-library-search-btn"]').click({ force: true });
    cy.wait(2500);
    cy.get("body").then(($body) => {
      const text = $body.text();
      const noResultForOurTerm = text.includes(`No result found for ${term}`);
      const hasCards = $body.find('[data-qa-id="tce-library-resource-card"]').length > 0;
      if (!noResultForOurTerm && !hasCards) {
        cy.get('[data-qa-id="tce-library-search-btn"]').click({ force: true });
        cy.wait(2500);
      }
    });
  },

  firstResultCard() {
    return cy.get('[data-qa-id="tce-library-resource-card"]').first();
  },

  resultCardAt(index) {
    return cy.get('[data-qa-id="tce-library-resource-card"]').eq(index);
  },

  // Yields the index of the first search result that is NOT already on the
  // playlist. The backend silently dedupes re-attaching a resource that is
  // already attached, so the playlist count doesn't grow and an
  // "attach worked" assertion fails even though attaching is fine.
  //
  // Nothing in this suite removes what it attaches to shared curriculum
  // content, so any hardcoded index inevitably rots -- index 0 was consumed,
  // then 1 (TC-LIB-016), then 3 (TC-AR-026). Choosing at runtime ends that
  // cycle instead of deferring it one index at a time.
  firstUnattachedResultIndex() {
    return cy.get("body").then(($body) => {
      const attached = Array.from($body.find('[data-qa-id="playlist-asset-card"]')).map((el) =>
        el.innerText.trim().toLowerCase()
      );
      return cy.get('[data-qa-id="tce-library-resource-card"]').then(($cards) => {
        const index = $cards.toArray().findIndex((el) => {
          const title = el.innerText.trim().toLowerCase();
          return title && !attached.some((t) => t.includes(title) || title.includes(t));
        });
        expect(index, "a search result not already attached to the playlist").to.be.greaterThan(-1);
        return index;
      });
    });
  },

  playlistAssetCount() {
    return cy.get('[data-qa-id="playlist-asset-card"]').its("length");
  },
};
