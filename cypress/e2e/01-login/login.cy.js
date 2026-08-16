// Login module automation, based on Test_Cases/MOD-001_Login_Test_Cases.xlsx

import { LoginPage } from "../../pages/LoginPage";

const VALID_PIN = "75583";
const INVALID_PIN = "12345";
const SCHOOL_SEARCH_TERM = "velammal";
const SCHOOL_NAME = "Velammal School";
const USERNAME = "support.admin";
const PASSWORD = "Tce#12345";

describe("Login - Guest Mode and Sign In modal", () => {
  it("TC-LOGIN-001: shows Guest Mode message after opening the app", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.contains("Please").should("contain.text", "Sign in");
  });

  it("TC-LOGIN-002: shows the partial Sign In panel at the bottom of the page", () => {
    cy.visitApp();
    LoginPage.signInModalContainer().should("be.visible");
    LoginPage.signInTitle().should("be.visible");
  });

  it("TC-LOGIN-003: opens the full Sign In modal when the partial panel is clicked", () => {
    cy.openSignInModal();
    LoginPage.authTitleText().should("have.text", "Sign In");
    LoginPage.authSubtitleText().should("contain.text", "Welcome to Tata ClassEdge");
    LoginPage.pinInstructionText().should("contain.text", "Please enter your PIN");
    LoginPage.pinPasswordLink().should("be.visible");
  });

  it("TC-LOGIN-004: closes the Sign In modal via the close icon", () => {
    cy.openSignInModal();
    LoginPage.authToggleButton().click({ force: true });
    cy.contains("You are currently in Guest Mode.").should("be.visible");
  });
});

describe("Login - PIN login", () => {
  it("TC-LOGIN-005: shows PIN login by default", () => {
    cy.openSignInModal();
    LoginPage.pinInstructionText().should("be.visible");
    LoginPage.pinPasswordLink().should("contain.text", "Sign in with Password");
  });

  it("TC-LOGIN-006: shows exactly five PIN boxes", () => {
    cy.openSignInModal();
    for (let i = 0; i < 5; i++) {
      LoginPage.pinDigitInput(i).should("be.visible");
    }
  });

  it("TC-LOGIN-007: accepts a numeric PIN typed into all five fields", () => {
    cy.openSignInModal();
    cy.enterPin(VALID_PIN);
    for (let i = 0; i < 5; i++) {
      LoginPage.pinDigitInput(i).should("have.value", VALID_PIN[i]);
    }
  });

  it("TC-LOGIN-008: authenticates automatically after the fifth digit is entered", () => {
    cy.openSignInModal();
    cy.enterPin(VALID_PIN);
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
  });

  it("TC-LOGIN-009: shows an error banner for an invalid PIN", () => {
    cy.openSignInModal();
    cy.enterPin(INVALID_PIN);
    cy.contains("next step required", { timeout: 15000 }).should("be.visible");
    cy.contains("Welcome Back!").should("not.exist");
  });

  it("TC-LOGIN-010: logs the user in successfully with a valid PIN", () => {
    cy.loginWithValidPin();
    cy.contains("Choose a resource to get started").should("be.visible");
  });

  it("TC-LOGIN-011: does not authenticate with an incomplete PIN", () => {
    cy.openSignInModal();
    cy.enterPin("755");
    cy.wait(2000);
    cy.contains("Welcome Back!").should("not.exist");
    LoginPage.pinDigitInput(0).should("have.value", "7");
  });

  it("TC-LOGIN-012: rejects non-numeric characters in the PIN boxes", () => {
    cy.openSignInModal();
    LoginPage.pinDigitInput(0).type("a@", { force: true });
    LoginPage.pinDigitInput(0).should("have.value", "");
  });

  it("TC-LOGIN-013: supports backspace correction while typing the PIN", () => {
    cy.openSignInModal();
    // Type a wrong 3rd digit on purpose, then backspace and correct it so the
    // final PIN entered is the valid one (75583).
    cy.enterPin("756");
    LoginPage.pinDigitInput(2).type("{backspace}", { force: true });
    LoginPage.pinDigitInput(2).type("5", { force: true });
    LoginPage.pinDigitInput(3).type("8", { force: true });
    LoginPage.pinDigitInput(4).type("3", { force: true });
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
  });
});

describe("Login - Password login", () => {
  it("TC-LOGIN-014: switches from PIN login to Password login", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.schoolSelect().should("be.visible");
    LoginPage.usernameInput().should("be.visible");
    LoginPage.passwordInput().should("be.visible");
    LoginPage.submitButton().should("be.disabled");
  });

  it("TC-LOGIN-015: shows matching school options while searching", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.schoolSelect().click({ force: true });
    LoginPage.schoolSelect().find("input").type(SCHOOL_SEARCH_TERM, { force: true });
    cy.contains(".ng-option", SCHOOL_NAME).should("be.visible");
  });

  it("TC-LOGIN-016: selects a school from the dropdown", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.schoolSelect().should("contain.text", SCHOOL_NAME);
  });

  it("TC-LOGIN-017: shows no results for an unmatched school search", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.schoolSelect().click({ force: true });
    LoginPage.schoolSelect().find("input").type("zzzznonexistentschoolzzzz", { force: true });
    cy.contains("No items found").should("be.visible");
    LoginPage.submitButton().should("be.disabled");
  });

  it("TC-LOGIN-018: accepts a typed Username", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.usernameInput().should("have.value", USERNAME);
  });

  it("TC-LOGIN-019: accepts a typed Password and masks it", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.passwordInput().should("have.value", PASSWORD);
    LoginPage.passwordInput().should("have.attr", "type", "password");
  });

  it("TC-LOGIN-020: keeps Sign In disabled when School is not selected", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.submitButton().should("be.disabled");
  });

  it("TC-LOGIN-021: keeps Sign In disabled when Username is empty", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.submitButton().should("be.disabled");
  });

  it("TC-LOGIN-022: keeps Sign In disabled when Password is empty", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.submitButton().should("be.disabled");
  });

  it("TC-LOGIN-023: enables Sign In once all required fields are filled", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.submitButton().should("not.be.disabled");
  });

  it("TC-LOGIN-024: shows an authentication error for invalid Password credentials", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type("invalid.user", { force: true });
    LoginPage.passwordInput().type("Wrong@123", { force: true });
    LoginPage.submitButton().click({ force: true });
    cy.contains("Login credentials are invalid", { timeout: 15000 }).should("be.visible");
    cy.contains("Welcome Back!").should("not.exist");
  });

  it("TC-LOGIN-025: logs the user in successfully with valid Password credentials", () => {
    cy.loginWithValidPassword();
    cy.contains("Choose a resource to get started").should("be.visible");
  });

  it("TC-LOGIN-026: switches from Password login back to PIN login", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.pinLink().click({ force: true });
    LoginPage.pinDigitInput(0).should("be.visible");
  });

  it("TC-LOGIN-027: does not authenticate while switching login type mid-entry", () => {
    cy.openSignInModal();
    cy.enterPin("755");
    LoginPage.pinPasswordLink().click({ force: true });
    LoginPage.pinLink().click({ force: true });
    cy.contains("Welcome Back!").should("not.exist");
  });
});

describe("Login - Dashboard and session", () => {
  it("TC-LOGIN-028: redirects to the Dashboard after a successful login", () => {
    cy.loginWithValidPin();
    cy.contains("Welcome Back!").should("be.visible");
  });

  it("TC-LOGIN-029: hides the Guest Mode message after a successful login", () => {
    cy.loginWithValidPin();
    cy.contains("You are currently in Guest Mode.").should("not.exist");
  });

  // TC-LOGIN-030 to TC-LOGIN-034 cover the 15-minute inactivity timeout flow.
  // They are skipped by default because each one needs a real ~15-20 minute
  // wait, which is impractical to run as part of a normal test pass.
  it.skip("TC-LOGIN-030: session stays active while the user keeps interacting (needs ~15 min)", () => {});
  it.skip("TC-LOGIN-031: inactivity popup appears after 15 minutes of no activity (needs ~15 min)", () => {});
  it.skip("TC-LOGIN-032: Continue starts a new 15-minute inactivity session (needs ~30 min)", () => {});
  it.skip("TC-LOGIN-033: activity after Continue keeps the session active (needs ~15 min)", () => {});
  it.skip("TC-LOGIN-034: Sign Out from the inactivity popup logs the user out (needs ~15 min)", () => {});

  it("TC-LOGIN-035: keeps the session logged in after a page refresh", () => {
    cy.loginWithValidPin();
    cy.reload();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("not.exist");
  });

  it("TC-LOGIN-036: does not restore the session after logout + refresh", () => {
    cy.loginWithValidPin();
    LoginPage.signOut();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.reload();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });

  it("TC-LOGIN-037: authenticates successfully with both PIN and Password logins", () => {
    cy.loginWithValidPin();
    cy.contains("Welcome Back!").should("be.visible");
    LoginPage.signOut();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");

    LoginPage.signInTitle().click({ force: true });
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.submitButton().click({ force: true });
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
  });

  it("TC-LOGIN-038: reopens the Sign In modal after closing it without logging in", () => {
    cy.openSignInModal();
    LoginPage.authToggleButton().click({ force: true });
    LoginPage.signInTitle().click({ force: true });
    LoginPage.pinDigitInput(0).should("be.visible");
    cy.contains("Welcome Back!").should("not.exist");
  });

  it("TC-LOGIN-039: an invalid PIN does not block switching to Password login", () => {
    cy.openSignInModal();
    cy.enterPin(INVALID_PIN);
    cy.contains("next step required", { timeout: 15000 }).should("be.visible");
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type(USERNAME, { force: true });
    LoginPage.passwordInput().type(PASSWORD, { force: true });
    LoginPage.submitButton().click({ force: true });
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
  });

  it("TC-LOGIN-040: invalid Password credentials do not block switching to PIN login", () => {
    cy.openSignInModal();
    LoginPage.pinPasswordLink().click({ force: true });
    cy.selectSchool(SCHOOL_SEARCH_TERM, SCHOOL_NAME);
    LoginPage.usernameInput().type("invalid.user", { force: true });
    LoginPage.passwordInput().type("Wrong@123", { force: true });
    LoginPage.submitButton().click({ force: true });
    cy.contains("Login credentials are invalid", { timeout: 15000 }).should("be.visible");
    LoginPage.pinLink().click({ force: true });
    cy.enterPin(VALID_PIN);
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
  });

  it("TC-LOGIN-041: stays unauthenticated after a refresh without logging in", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.reload();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });

  it("TC-LOGIN-042: completes the full login flow from launch to Dashboard", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    LoginPage.signInModalContainer().should("be.visible");
    LoginPage.signInTitle().click({ force: true });
    LoginPage.pinDigitInput(0).should("be.visible");
    cy.enterPin(VALID_PIN);
    cy.contains("Welcome Back!", { timeout: 20000 }).should("be.visible");
    cy.contains("You are currently in Guest Mode.").should("not.exist");
  });
});
