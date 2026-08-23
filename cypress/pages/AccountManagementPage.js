// Page Object for the User Profile popover reached from the toolbar avatar --
// Change Password, Change PIN, Sign Out, and the theme/keyboard toggles.
//
// LIVE-VERIFIED 2026-08-23 against the real DOM for everything under the
// "Menu", "Password", and "PIN" areas of
// Test_Cases/14_Account_Management/Account_Management_Test_Cases.xlsx.
//
// TWO-LEVEL POPOVER, confirmed live -- easy to get wrong:
//   1. toolbar-user-avatar (the outer avatar icon in the main toolbar) opens
//      a FLAT list: "Signed in as <name> >", Dark Mode, Virtual Keyboard,
//      Classroom Mode, Sign Out, Share your feedback, Whiteboard History/
//      build info.
//   2. Clicking the "Signed in as <name> >" row -- which itself carries
//      data-qa-id="toolbar-profile-trigger" -- drills INTO a second view:
//      the Account/Profile tab group (user-profile-tab-account /
//      -tab-profile). Change Password/PIN live one level deeper than the
//      outer menu, not beside Dark Mode/Sign Out.
// Both clicks are required in sequence to reach Change Password/PIN; only
// the first is needed for Dark Mode/Keyboard/Sign Out/Release Notes.
//
// Naming trap worth remembering: once inside the tab group, "Account" is
// NOT where Change Password/PIN live -- that tab is curriculum preferences
// (Preferred Resource Type, Subjects). Change Password/PIN are both under
// "Profile". Confirmed live: the two tab-label spans carry IDENTICAL classes
// regardless of which is selected ("tab-label ng-star-inserted") -- there is
// no data-qa-id-attached class to assert "active" against; assert on which
// tab's CONTENT is showing instead (e.g. "Prefered Resource Type" text vs.
// the Change Password/PIN links).
//
// CONFIRMED LIVE BUG (2026-08-23): UserProfileTabComponent.isPasswordOrOtpOpen
// is defined in source as (isPasswordFormShown && isPinFromShown) -- an
// AND, not an OR. Live behavior matches that source reading: opening Change
// Password leaves the "Change PIN" entry link visible and clickable right
// alongside the open form (confirmed via a direct :visible check, not
// assumed) -- see ACC-017.
//
// The "Login-time forced flows" (forced Change Password on a default
// password, first-time PIN setup wizard, Register/Verify MFA) are
// SOURCE-VERIFIED ONLY against cep2-workspace -- no known QA account reaches
// any of those server-flagged states, so none of it has been exercised
// live. See claude/PROJECT_NOTES.md's "Automating a module with no QA login
// available" convention. Selectors for those are included here for when an
// account in the right state becomes available, but treat them as
// unconfirmed until then.

export const AccountManagementPage = {
  // --- Entry / tabs -----------------------------------------------------
  avatarTrigger() {
    return cy.get('[data-qa-id="toolbar-user-avatar"]');
  },

  drilldownTrigger() {
    return cy.get('[data-qa-id="toolbar-profile-trigger"]');
  },

  accountTab() {
    return cy.get('[data-qa-id="user-profile-tab-account"]');
  },

  profileTab() {
    return cy.get('[data-qa-id="user-profile-tab-profile"]');
  },

  // Opens the outer flat menu only (Dark Mode / Keyboard / Sign Out / etc).
  openProfileMenu() {
    this.avatarTrigger().click({ force: true });
  },

  // Opens the outer menu, then drills into the Account/Profile tab group.
  openProfileTabs() {
    this.avatarTrigger().click({ force: true });
    cy.wait(300);
    this.drilldownTrigger().click({ force: true });
  },

  // --- Change Password (Profile tab, logged-in/voluntary flow) ----------
  openChangePasswordLink() {
    return cy.get('[data-qa-id="user-profile-open-change-password"]');
  },

  changePasswordForm() {
    return cy.get('[data-qa-id="user-profile-pwd-form"]');
  },

  currentPasswordInput() {
    return cy.get('[data-qa-id="user-profile-current-pwd-input"]');
  },

  newPasswordInput() {
    return cy.get('[data-qa-id="user-profile-new-pwd-input"]');
  },

  repeatPasswordInput() {
    return cy.get('[data-qa-id="user-profile-repeat-pwd-input"]');
  },

  changePasswordCancelBtn() {
    return cy.get('[data-qa-id="user-profile-pwd-cancel-btn"]');
  },

  changePasswordSaveBtn() {
    return cy.get('[data-qa-id="user-profile-pwd-save-btn"]');
  },

  // --- Change PIN (Profile tab, logged-in/voluntary flow) ----------------
  openChangePinLink() {
    return cy.get('[data-qa-id="user-profile-open-change-pin"]');
  },

  currentPinBox(index) {
    return cy.get(`[data-qa-id="user-profile-current-pin-input-${index}"]`);
  },

  newPinBox(index) {
    return cy.get(`[data-qa-id="user-profile-new-pin-input-${index}"]`);
  },

  repeatPinBox(index) {
    return cy.get(`[data-qa-id="user-profile-repeat-pin-input-${index}"]`);
  },

  pinAutoGenerateLink() {
    return cy.get('[data-qa-id="user-profile-pin-autogen-link"]');
  },

  changePinCancelBtn() {
    return cy.get('[data-qa-id="user-profile-pin-cancel-btn"]');
  },

  changePinSaveBtn() {
    return cy.get('[data-qa-id="user-profile-pin-save-btn"]');
  },

  // --- Account tab toggles/actions ---------------------------------------
  // Both toggles carry their data-qa-id directly on the <input
  // type="checkbox"> itself (custom "ios-switch" CSS, not mat-slide-toggle)
  // -- read/assert .prop("checked") directly, no nested .find("input").
  darkModeToggle() {
    return cy.get('[data-qa-id="toolbar-profile-dark-mode-toggle"]');
  },

  virtualKeyboardToggle() {
    return cy.get('[data-qa-id="toolbar-profile-keyboard-toggle"]');
  },

  classroomModeSwitcher() {
    return cy.get('[data-qa-id="toolbar-profile-planning-mode"]');
  },

  signOutBtn() {
    return cy.get('[data-qa-id="toolbar-profile-signout-btn"]');
  },

  buildInfoBtn() {
    return cy.get('[data-qa-id="toolbar-profile-build-btn"]');
  },

  // --- Login-time forced flows (SOURCE-VERIFIED ONLY, see header) --------
  forcedChangePasswordContainer() {
    return cy.get('[data-qa-id="login-change-pwd-container"]');
  },

  firstTimePinNewBox(index) {
    return cy.get(`[data-qa-id="login-change-pin-new-input-${index}"]`);
  },

  registerMfaForm() {
    return cy.get('[data-qa-id="login-register-mfa-form"]');
  },

  verifyMfaForm() {
    return cy.get('[data-qa-id="login-verify-mfa-form"]');
  },
};
