// Page Object for the Gallery panel (curated images, attach-on-click to the
// Whiteboard canvas). Used by gallery.cy.js.

export const GalleryPage = {
  open() {
    cy.get('[data-qa-id="add-resource-trigger"]').click({ force: true });
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
