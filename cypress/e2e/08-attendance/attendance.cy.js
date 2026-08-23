// Attendance module -- based on Test_Cases/08_Attendance/Attendance_Test_Cases.xlsx
// (added 2026-08-23; this module had zero Test_Cases documentation before).
// Test case IDs below match that workbook's 03_Test Cases sheet.
//
// SELECTOR SOURCE: see the header comment in cypress/pages/AttendancePage.js
// -- these `data-qa-id`s were read from cep2-workspace's Angular source.
//
// CONFIRMED live 2026-08-22: the Magnet submenu on this account (Class 12A |
// Physics, and consistent with the Attendance-less options seen elsewhere)
// only ever lists three items -- Notice (AI Notices), Learning Shorts, and
// Homework (AI Homework). No "Attendance" row appears at all, so
// `isAttendanceAvailabe` never resolves true for anything reachable on this
// account. This is a real, confirmed content/config gap, not a selector
// problem -- ATT-001 checks for the row and logs+skips rather than failing
// hard, so this spec stays green until an account/class with Attendance
// enabled is found.
//
// SCOPE IS DELIBERATELY THIN: the actual attendance-taking UI (student rows,
// present/absent toggles, submit) is rendered by a separate micro-frontend
// ("tce-attendance") loaded at runtime as a Custom Element -- its markup does
// not exist anywhere in cep2-workspace's source, so there is nothing to read
// real selectors from. Per this project's "verify, don't guess" rule (see
// claude/README.md), this spec only covers what's actually visible in the
// host app's own source: opening the panel and seeing its container render.
// Do NOT extend this file with guessed selectors for the inner student
// list/toggles/submit button -- see AttendancePage.js for what would be
// needed to unblock that (either live DOM inspection, or locating the
// separate tce-attendance source repo).

import { PlaylistPage } from "../../pages/PlaylistPage";
import { AttendancePage } from "../../pages/AttendancePage";

describe("Attendance - Core flow", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(2000);
    PlaylistPage.goToTargetClass();
  });

  it("ATT-001: opens Attendance from the Magnet tool and renders its panel", function () {
    // 1. Magnet tool is available (requires an Academic Year to be set on
    // the account -- same gate the Toolbar spec's TB-054-060 notes are
    // pending on).
    AttendancePage.magnetToolBtn().should("be.visible");

    // 2. Opens the submenu -- CONFIRMED to only ever list Notice/Learning
    // Shorts/Homework on this account, so check before asserting.
    AttendancePage.openMagnetSubmenu();
    cy.get("body").then(($body) => {
      if ($body.find('[data-qa-id="toolbar-magnet-gtAttendance"]').length === 0) {
        cy.log(
          "CONFIRMED (2026-08-22): this account's Magnet submenu never lists Attendance " +
            "(only Notice/Learning Shorts/Homework) -- isAttendanceAvailabe never resolves true here."
        );
        this.skip();
        return;
      }

      AttendancePage.attendanceSubmenuItem().should("be.visible");

      // 3. Selecting it mounts the Attendance panel and its container renders.
      AttendancePage.attendanceSubmenuItem().click({ force: true });
      cy.wait(1500);
      AttendancePage.container().should("exist");
    });
  });
});

describe("Attendance - Login guard", () => {
  it("ATT-012: is unavailable to an unauthenticated user", () => {
    cy.visitApp();
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.find('[data-qa-id="toolbar-tool-gtMagnet"]').length).to.eq(0);
    });
  });
});

// ---------------------------------------------------------------------------
// NOT YET AUTOMATED -- and deliberately not written as guesses.
//
// Everything inside the attendance panel (student list, present/absent
//   toggles, "mark all present", Submit): no selectors exist in
//   cep2-workspace's source for this -- it's rendered by a separately built
//   "tce-attendance" web component loaded at runtime, communicating with the
//   host app via postMessage-style custom events rather than Angular
//   template bindings. Needs either a live DOM inspection session or the
//   separate tce-attendance source repo before this can be written for real.
//
// Close Attendance dialog (attendance-close-dialog-close-icon /
//   -cancel-btn / -confirm-btn, AttendancePage.closeDialogAppeared): real
//   selectors exist and are wired up in AttendancePage.js, but triggering
//   the close flow from a test requires first interacting with the inner
//   web component's own close/back control -- which is exactly the
//   unverifiable surface above. Cannot be exercised until that's unblocked.
//
// isClassTeacher branch (dialog shown vs. skipped): confirmed in source that
//   this depends on whether the signed-in teacher is the class teacher for
//   the selected class, which is unconfirmed for the current QA account/
//   target class in cypress/config/targetClass.js.
//
// Empty-student-list teardown behaviour: attendance.component.ts shows a
//   snackbar and self-closes if the class has zero enrolled students. Worth
//   a dedicated negative test once a QA class with no students is confirmed
//   to exist, rather than assumed.
// ---------------------------------------------------------------------------
