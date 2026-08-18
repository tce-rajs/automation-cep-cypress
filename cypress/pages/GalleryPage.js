// Page Object for the Gallery panel (curated images, attach-on-click to the
// Whiteboard canvas). Used by gallery.cy.js.

import { PlaylistPage } from "./PlaylistPage";

export const GalleryPage = {
  open() {
    // The FAB sits inside the Playlist drawer's wrapper, so a hidden drawer
    // makes this click a no-op against an opacity-0 element.
    PlaylistPage.ensureDrawerVisible();
    // No { force: true } -- see the note in AddResourcePage.open().
    cy.get('[data-qa-id="add-resource-trigger"]', { timeout: 20000 }).should("be.visible").click();
    cy.wait(800);
    cy.get('[data-qa-id="add-resource-action-gallery"]').click({ force: true });
    cy.wait(1200);
  },

  close() {
    cy.get('[data-qa-id="gallery-close-btn"]').click({ force: true });
  },

  firstImage() {
    return cy.get('[data-qa-id^="gallery-image-card-"]').first();
  },

  imageAt(index) {
    return cy.get('[data-qa-id^="gallery-image-card-"]').eq(index);
  },

  canvasElementCount() {
    return cy.get('[data-qa-id="wb-drawing-container"] svg *').its("length");
  },
};
