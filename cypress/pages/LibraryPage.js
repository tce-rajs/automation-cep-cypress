// Page Object for the TCE resource Library panel (search, preview,
// attach-to-playlist). Used by library.cy.js and gallery.cy.js (for the
// Gallery-vs-Library comparison test).

export const LibraryPage = {
  open() {
    cy.get('[data-qa-id="add-resource-trigger"]').click({ force: true });
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

  playlistAssetCount() {
    return cy.get('[data-qa-id="playlist-asset-card"]').its("length");
  },
};
