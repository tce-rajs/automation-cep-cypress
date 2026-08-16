// Page Object for the Sign In modal (Guest Mode banner, PIN login, Password
// login) and the toolbar's sign-out action. Used by login.cy.js and
// referenced by the shared login commands in cypress/support/commands.js.

export const LoginPage = {
  guestModeMessage() {
    return cy.contains("You are currently in Guest Mode.");
  },

  signInModalContainer() {
    return cy.get('[data-qa-id="login-auth-modal-container"]');
  },

  signInTitle() {
    return cy.get(".sign-in-title");
  },

  authTitleText() {
    return cy.get('[data-qa-id="login-auth-title-text"]');
  },

  authSubtitleText() {
    return cy.get('[data-qa-id="login-auth-subtitle-text"]');
  },

  authToggleButton() {
    return cy.get('[data-qa-id="login-auth-toggle-button"]');
  },

  // PIN login
  pinInstructionText() {
    return cy.get('[data-qa-id="login-pin-instruction-text"]');
  },

  pinPasswordLink() {
    return cy.get('[data-qa-id="login-pin-password-link"]');
  },

  pinDigitInput(index) {
    return cy.get(`[data-qa-id="login-pin-digit-input-${index}"]`);
  },

  // Password login
  schoolSelect() {
    return cy.get('[data-qa-id="login-pwd-school-select"]');
  },

  usernameInput() {
    return cy.get('[data-qa-id="login-pwd-username-input"]');
  },

  passwordInput() {
    return cy.get('[data-qa-id="login-pwd-password-input"]');
  },

  submitButton() {
    return cy.get('[data-qa-id="login-pwd-submit-button"]');
  },

  pinLink() {
    return cy.get('[data-qa-id="login-pwd-pin-link"]');
  },

  // Toolbar / sign out
  profileTrigger() {
    return cy.get('[data-qa-id="toolbar-profile-trigger"], [data-qa-id="toolbar-user-avatar"]').first();
  },

  signOutButton() {
    return cy.get('[data-qa-id="toolbar-profile-signout-btn"]');
  },

  signOutConfirmButton() {
    return cy.contains("button", "Sign Out", { timeout: 10000 });
  },

  // Full sign-out flow, reused across several tests.
  signOut() {
    this.profileTrigger().click({ force: true });
    this.signOutButton().click({ force: true });
    this.signOutConfirmButton().click({ force: true });
  },
};
