// Page Object for the Weblink Player, opened from a Playlist asset card.
//
// CONFIRMED live (2026-08-22) at Class 12A | Computer Science | "14. Project
// Based Learning" | first topic -- see PlaylistPage.goToComputerScienceProjectChapter().
// The confirmed resource there is a YouTube video: its iframe `src` resolved
// to "https://www.youtube.com/embed/KT3OHnCach0" -- a real, live confirmation
// that the app's YouTube-embed rewrite (toYouTubeEmbed() in
// cep2-workspace's weblink.component.ts) is active for this resource.
//
// Source: cep2-workspace/projects/main/src/app/modules/common/players/weblink/weblink.component.html:
//   <div class="weblink-wrapper">
//     <div></div>                          <- iframe gets appended as this div's sibling
//     <img class="weblink-close-btn" alt="close-btn" ...>
//     <app-annotation></app-annotation>    <- canvas pixel inspection needed
//     <app-mini-toolbox></app-mini-toolbox>
//   </div>
// The iframe itself is created imperatively (renderer.createElement) and has
// no data-qa-id -- select on `.weblink-wrapper iframe`. Outer player wrapper
// carries `.player.weblink-player` (see ImagePlayerPage.js for why).

export const WeblinkPlayerPage = {
  ANY_CARD_SELECTOR: '[data-qa-id="playlist-resource-card"], [data-qa-id="playlist-asset-card"]',

  cards() {
    return cy.get(this.ANY_CARD_SELECTOR);
  },

  openFirst() {
    this.cards().first().click({ force: true });
  },

  wrapper() {
    return cy.get(".player.weblink-player");
  },

  iframe() {
    return cy.get(".weblink-wrapper iframe");
  },

  closeBtn() {
    return cy.get(".weblink-close-btn, img[alt='close-btn']").filter(":visible");
  },

  close() {
    this.closeBtn().first().click({ force: true });
    cy.wait(1000);
  },
};
