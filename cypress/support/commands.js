// Reusable custom commands for the CEP whiteboard app login flow.
// Keeping these small and named after what they do so specs stay readable.

const VALID_PIN = "75583";
const SCHOOL_NAME = "Velammal School";
const SCHOOL_SEARCH_TERM = "velammal";
const USERNAME = "support.admin";
const PASSWORD = "Tce#12345";

Cypress.Commands.add("visitApp", () => {
  cy.visit("/teach/whiteboard");
});

// Opens the app in Guest Mode and clicks the partial Sign In panel
// so the full Sign In modal (PIN login by default) is shown.
Cypress.Commands.add("openSignInModal", () => {
  cy.visitApp();
  cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  cy.get(".sign-in-title").click({ force: true });
  cy.get('[data-qa-id="login-auth-title-text"]').should("contain.text", "Sign In");
});

// Types a PIN one digit at a time into the 5 PIN boxes.
Cypress.Commands.add("enterPin", (pin) => {
  pin.split("").forEach((digit, index) => {
    cy.get(`[data-qa-id="login-pin-digit-input-${index}"]`).type(digit, { force: true });
  });
});

// Full end-to-end login using the valid PIN, ending on the Dashboard.
Cypress.Commands.add("loginWithValidPin", () => {
  cy.openSignInModal();
  cy.enterPin(VALID_PIN);
  cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
});

// Searches for a school in the School field and clicks the matching option.
Cypress.Commands.add("selectSchool", (searchTerm, optionText) => {
  cy.get('[data-qa-id="login-pwd-school-select"]').click({ force: true });
  cy.get('[data-qa-id="login-pwd-school-select"] input').type(searchTerm, { force: true });
  cy.contains(".ng-option", optionText, { timeout: 10000 }).click();
});

// Simulates the session ending mid-action by clearing the two localStorage
// keys the app's auth state depends on. Confirmed via source review: any
// request that comes back 401 after this makes ErrorInterceptor call
// authService.logout() unconditionally, so this reliably reproduces
// "session ended while the user was doing something" without waiting for a
// real timeout.
Cypress.Commands.add("simulateSessionLoss", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("token");
    win.localStorage.removeItem("clientId");
  });
});

// Full end-to-end login using valid Password credentials, ending on the Dashboard.
Cypress.Commands.add("loginWithValidPassword", () => {
  cy.openSignInModal();
  cy.get('[data-qa-id="login-pin-password-link"]').click({ force: true });
  cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
  cy.get('[data-qa-id="login-pwd-username-input"]').type(USERNAME, { force: true });
  cy.get('[data-qa-id="login-pwd-password-input"]').type(PASSWORD, { force: true });
  cy.get('[data-qa-id="login-pwd-submit-button"]').click({ force: true });
  cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
});
