// Reusable custom commands for the CEP whiteboard app login flow.
// Keeping these small and named after what they do so specs stay readable.

// Credentials come from cypress.env.json (gitignored) or CYPRESS_* environment
// variables -- never from source. Copy cypress.env.example.json to
// cypress.env.json to set them up locally.
//
// Read lazily inside a helper rather than at module load: Cypress.env() is
// populated by the time a command runs, and this keeps a missing value from
// silently becoming `undefined` typed into a field, which fails as a confusing
// UI error instead of a clear "credential not configured".
const cred = (key) => {
  const value = Cypress.env(key);
  if (!value) {
    throw new Error(
      `Missing credential "${key}". Copy cypress.env.example.json to cypress.env.json and fill it in, or set CYPRESS_${key}.`
    );
  }
  return value;
};

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
  cy.enterPin(cred("VALID_PIN"));
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
  cy.selectSchool(cred("SCHOOL_SEARCH_TERM"), cred("SCHOOL_NAME"));
  cy.get('[data-qa-id="login-pwd-username-input"]').type(cred("USERNAME"), { force: true });
  cy.get('[data-qa-id="login-pwd-password-input"]').type(cred("PASSWORD"), { force: true, log: false });
  cy.get('[data-qa-id="login-pwd-submit-button"]').click({ force: true });
  cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
});
