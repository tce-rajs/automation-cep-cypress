// Page Object for the Image Player, opened from a Playlist asset card.
//
// CONFIRMED live (2026-08-22) at Class 12A | Computer Science | "14. Project
// Based Learning" | first topic -- see PlaylistPage.goToComputerScienceProjectChapter().
// No other confirmed Image resource exists on this account.
//
// Source: cep2-workspace/projects/main/src/app/modules/player/container/image-player/
// (image-player.component.ts has an EMPTY .html -- built imperatively) wraps
// the shared ImageGalleryComponent
// (common/players/image-gallery/image-gallery.component.html):
//   <div class="image-wrapper">
//     <gallery class="image-gallery">...</gallery>          <- third-party lib, no data-qa-id
//     <div class="image-close-btn"><img alt="close-btn" ...></div>
//     <app-annotation></app-annotation>                      <- canvas pixel inspection needed
//     <app-mini-toolbox></app-mini-toolbox>
//   </div>
// The outer player wrapper also carries `.player.image-player` (every
// player type gets `.player.{type}` from the shared createPlayer() helper
// in player.abstract.ts).
//
// The gallery itself is a third-party Angular gallery library (`<gallery>`,
// `gallery-core`, `gallery-slider`, `gallery-item`, `gallery-image` -- no
// data-qa-id anywhere in it, confirmed via live DOM dump). Its real image
// element is `.image-gallery img.g-image-item`.

export const ImagePlayerPage = {
  ANY_CARD_SELECTOR: '[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"]',

  cards() {
    return cy.get(this.ANY_CARD_SELECTOR);
  },

  openFirst() {
    this.cards().first().click({ force: true });
  },

  wrapper() {
    return cy.get(".player.image-player");
  },

  galleryImage() {
    return cy.get(".image-gallery img.g-image-item");
  },

  closeBtn() {
    return cy.get(".image-close-btn img, img[alt='close-btn']").filter(":visible");
  },

  close() {
    this.closeBtn().first().click({ force: true });
    cy.wait(1000);
  },
};
