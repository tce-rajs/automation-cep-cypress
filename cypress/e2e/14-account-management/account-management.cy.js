// Account Management module -- based on
// Test_Cases/14_Account_Management/Account_Management_Test_Cases.xlsx
// (added 2026-08-23; brand-new module, previously zero automation or
// documentation despite being security-relevant -- see MODULE_COVERAGE.md's
// "Biggest coverage gaps" item 4).
//
// SCOPE: the "Menu" / "Password" / "PIN" / "Menu toggles" / "Menu actions"
// areas -- everything reachable from the toolbar profile popover while
// already logged in. Test case IDs below match the workbook's 03_Test Cases
// sheet.
//
// TWO-LEVEL POPOVER -- see AccountManagementPage.js's header comment before
// touching this file. Dark Mode/Keyboard/Sign Out/Release Notes are one
// click deep (openProfileMenu); Change Password/PIN and the Account/Profile
// tabs are two clicks deep (openProfileTabs).
//
// DELIBERATELY NOT SUBMITTED HERE, ever: a real, successful Save on either
// Change Password or Change PIN. Both force-logout AND permanently change
// the credentials of whichever QA account runs them -- this suite's own
// cy.loginWithValidPin() depends on the PIN staying what it is for every
// other spec in the run. See ACC-010/ACC-016 in the workbook for the full
// reasoning; this is the same "would destroy shared QA data" blocker class
// already documented in MODULE_COVERAGE.md. (A one-off REAL Change PIN run,
// with before/after values logged, WAS executed 2026-08-23 -- see
// claude/CREDENTIAL_HISTORY.md -- against the then-separate run-folder QA
// account, never this main folder's. That run folder has since been
// deleted, so no isolated account currently exists to repeat this or do
// Change Password the same way; recreate one before attempting either for
// real again.)
//
// NOT WRITTEN HERE, per the workbook's Automation Status column:
//   - ACC-020 (Classroom Mode navigation): external micro-frontend, out of
//     this repo's scope.
//   - ACC-024 through ACC-028 (all "Login-time forced flows" -- forced
//     Change Password on a default password, first-time PIN setup wizard,
//     Register/Verify MFA): none of the known QA accounts are in the
//     server-flagged state needed to reach any of these. Selectors are
//     SOURCE-VERIFIED ONLY (cep2-workspace) -- see AccountManagementPage.js's
//     header comment before ever automating against them.

import { AccountManagementPage } from "../../pages/AccountManagementPage";

describe("Account Management - Profile menu", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
  });

  it("ACC-001: the avatar opens the flat menu, and drilling in reaches the tabs", () => {
    AccountManagementPage.openProfileMenu();
    AccountManagementPage.drilldownTrigger().should("be.visible");
    AccountManagementPage.signOutBtn().should("be.visible");

    AccountManagementPage.drilldownTrigger().click({ force: true });
    AccountManagementPage.accountTab().should("be.visible");
    AccountManagementPage.profileTab().should("be.visible");
  });

  it("ACC-002: the Account tab is selected by default, showing curriculum preferences", () => {
    AccountManagementPage.openProfileTabs();
    cy.contains("Prefered Resource Type").should("be.visible");
    // mat-tab keeps inactive tab content in the DOM (not removed, just
    // hidden) -- assert not-visible, not not-exist.
    cy.get('[data-qa-id="user-profile-open-change-password"]').should("not.be.visible");
  });

  it("ACC-003: Change Password/PIN live under Profile, not Account", () => {
    AccountManagementPage.openProfileTabs();
    cy.get('[data-qa-id="user-profile-open-change-password"]').should("not.be.visible");
    cy.get('[data-qa-id="user-profile-open-change-pin"]').should("not.be.visible");

    AccountManagementPage.profileTab().click({ force: true });
    AccountManagementPage.openChangePasswordLink().should("be.visible");
    AccountManagementPage.openChangePinLink().should("be.visible");
  });
});

describe("Account Management - Change Password", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    AccountManagementPage.openProfileTabs();
    AccountManagementPage.profileTab().click({ force: true });
    AccountManagementPage.openChangePasswordLink().click({ force: true });
  });

  it("ACC-004: opening the form shows all 3 fields", () => {
    AccountManagementPage.changePasswordForm().should("be.visible");
    AccountManagementPage.currentPasswordInput().should("be.visible");
    AccountManagementPage.newPasswordInput().should("be.visible");
    AccountManagementPage.repeatPasswordInput().should("be.visible");
  });

  it("ACC-005: Save is disabled on an empty form", () => {
    AccountManagementPage.changePasswordSaveBtn().should("be.disabled");
  });

  it("ACC-006: a weak new password keeps Save disabled", () => {
    AccountManagementPage.currentPasswordInput().type("Whatever123!", { force: true });
    AccountManagementPage.newPasswordInput().type("abc123", { force: true });
    AccountManagementPage.repeatPasswordInput().type("abc123", { force: true });
    AccountManagementPage.changePasswordSaveBtn().should("be.disabled");
  });

  it("ACC-007: New password equal to Current password is rejected", () => {
    // A pure client-side comparison between the two typed fields (source:
    // "New password cannot be same as old password") -- no real current
    // password value is needed, just the same arbitrary string in both.
    const same = "SameStrongPass1!";
    AccountManagementPage.currentPasswordInput().type(same, { force: true });
    AccountManagementPage.newPasswordInput().type(same, { force: true });
    AccountManagementPage.repeatPasswordInput().type(same, { force: true });
    AccountManagementPage.changePasswordSaveBtn().should("be.disabled");
  });

  it("ACC-008: Repeat not matching New keeps Save disabled", () => {
    AccountManagementPage.currentPasswordInput().type("Whatever123!", { force: true });
    AccountManagementPage.newPasswordInput().type("StrongPass1!", { force: true });
    AccountManagementPage.repeatPasswordInput().type("DifferentPass2!", { force: true });
    AccountManagementPage.changePasswordSaveBtn().should("be.disabled");
  });

  it("ACC-009: Cancel closes the form without submitting anything", () => {
    cy.intercept("PUT", "**/auth/school/user/password").as("changePassword");
    AccountManagementPage.currentPasswordInput().type("Whatever123!", { force: true });
    AccountManagementPage.newPasswordInput().type("StrongPass1!", { force: true });
    AccountManagementPage.repeatPasswordInput().type("StrongPass1!", { force: true });
    AccountManagementPage.changePasswordCancelBtn().click({ force: true });
    AccountManagementPage.changePasswordForm().should("not.exist");
    cy.get("@changePassword.all").should("have.length", 0);
  });

  it("ACC-017: opening Change Password leaves Change PIN's own entry link visible too (isPasswordOrOtpOpen finding)", () => {
    // Source: UserProfileTabComponent.isPasswordOrOtpOpen = isPasswordFormShown
    // && isPinFromShown (AND, not OR). CONFIRMED live: with only Change
    // Password open, the Change PIN entry link stays visible and clickable
    // right alongside it -- a real (if minor) UI inconsistency, not a guess.
    AccountManagementPage.changePasswordForm().should("be.visible");
    AccountManagementPage.openChangePinLink().should("be.visible");
  });
});

describe("Account Management - Change PIN", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    AccountManagementPage.openProfileTabs();
    AccountManagementPage.profileTab().click({ force: true });
    AccountManagementPage.openChangePinLink().click({ force: true });
  });

  it("ACC-011: opening the form shows all 3 PIN groups", () => {
    for (let i = 0; i < 5; i++) {
      AccountManagementPage.currentPinBox(i).should("be.visible");
      AccountManagementPage.newPinBox(i).should("be.visible");
      AccountManagementPage.repeatPinBox(i).should("be.visible");
    }
  });

  it("ACC-012: Auto-Generate fills only the New PIN boxes", () => {
    AccountManagementPage.pinAutoGenerateLink().click({ force: true });
    for (let i = 0; i < 5; i++) {
      AccountManagementPage.newPinBox(i).invoke("val").should("match", /^\d$/);
      AccountManagementPage.currentPinBox(i).invoke("val").should("eq", "");
      AccountManagementPage.repeatPinBox(i).invoke("val").should("eq", "");
    }
  });

  it("ACC-013: Save is disabled on an empty form", () => {
    AccountManagementPage.changePinSaveBtn().should("be.disabled");
  });

  it("ACC-014: New/Repeat PIN mismatch keeps Save disabled", () => {
    ["1", "2", "3", "4", "5"].forEach((d, i) => AccountManagementPage.currentPinBox(i).type(d, { force: true }));
    ["6", "7", "8", "9", "0"].forEach((d, i) => AccountManagementPage.newPinBox(i).type(d, { force: true }));
    ["1", "1", "1", "1", "1"].forEach((d, i) => AccountManagementPage.repeatPinBox(i).type(d, { force: true }));
    AccountManagementPage.changePinSaveBtn().should("be.disabled");
  });

  it("ACC-015: Cancel closes the form without submitting anything", () => {
    cy.intercept("PUT", "**/auth/school/user/pin").as("changePin");
    AccountManagementPage.pinAutoGenerateLink().click({ force: true });
    AccountManagementPage.changePinCancelBtn().click({ force: true });
    cy.get('[data-qa-id="user-profile-new-pin-input-0"]').should("not.exist");
    cy.get("@changePin.all").should("have.length", 0);
  });
});

describe("Account Management - Menu toggles and actions", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    AccountManagementPage.openProfileMenu();
  });

  it("ACC-018: Dark Mode toggle flips its own checked state", () => {
    // data-qa-id is on the <input type="checkbox"> itself (custom "ios-switch"
    // CSS, not a Material component) -- no need to .find("input").
    AccountManagementPage.darkModeToggle().then(($el) => {
      const before = $el.prop("checked");
      AccountManagementPage.darkModeToggle().click({ force: true });
      AccountManagementPage.darkModeToggle().should(($after) => {
        expect($after.prop("checked")).to.eq(!before);
      });
      // Restore, so the next spec does not inherit a flipped theme.
      AccountManagementPage.darkModeToggle().click({ force: true });
    });
  });

  it("ACC-019: Virtual Keyboard toggle flips and persists across popover close/reopen", () => {
    AccountManagementPage.virtualKeyboardToggle().then(($el) => {
      const before = $el.prop("checked");
      AccountManagementPage.virtualKeyboardToggle().click({ force: true });
      AccountManagementPage.virtualKeyboardToggle().should(($after) => {
        expect($after.prop("checked")).to.eq(!before);
      });

      cy.get("body").click(200, 200, { force: true }); // close the popover
      cy.wait(300);
      AccountManagementPage.openProfileMenu();
      AccountManagementPage.virtualKeyboardToggle().should(($reopened) => {
        expect($reopened.prop("checked")).to.eq(!before);
      });

      // Restore, so the next spec does not inherit a flipped keyboard setting.
      AccountManagementPage.virtualKeyboardToggle().click({ force: true });
    });
  });

  it("ACC-021: Sign Out asks for confirmation before signing out", () => {
    AccountManagementPage.signOutBtn().click({ force: true });
    cy.get(".cdk-overlay-container", { timeout: 5000 }).should("be.visible").within(() => {
      cy.contains("button", "Sign Out").should("be.visible");
      cy.contains(/cancel/i).should("exist").click({ force: true });
    });
    // Dismissed via Cancel, not confirmed -- still logged in (no Guest Mode banner).
    cy.contains("You are currently in Guest Mode.").should("not.exist");
  });

  it("ACC-022: confirming Sign Out logs the user out", () => {
    AccountManagementPage.signOutBtn().click({ force: true });
    cy.get(".cdk-overlay-container").contains("button", "Sign Out", { timeout: 5000 }).click({ force: true });
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });

  it("ACC-023: the build/version button opens a Release Notes dialog", () => {
    // CONFIRMED live: the dialog's markdown content renders inside a Shadow
    // DOM web component (1 shadow host found under .cdk-overlay-container,
    // 0 iframes) -- cy.contains() cannot see text inside a shadow root, so
    // this asserts on the reachable overlay chrome (Close button) instead of
    // the "Release Notes" heading text itself.
    AccountManagementPage.buildInfoBtn().click({ force: true });
    cy.get(".cdk-overlay-container", { timeout: 15000 })
      .should("be.visible")
      .find("button")
      .contains(/close/i)
      .should("be.visible")
      .click({ force: true });
    cy.get(".cdk-overlay-container button:contains('Close')").should("not.exist");
  });
});
