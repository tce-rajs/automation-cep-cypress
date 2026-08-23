// Page Object for Attendance (opened via the Toolbar's Magnet tool).
//
// SOURCE-VERIFIED, DOM-UNCONFIRMED -- see the header comment in CompassPage.js
// for why: no QA login was available when this was written, so these
// `data-qa-id`s were read directly from cep2-workspace's Angular source
// rather than dumped from the live DOM. Treat as unconfirmed until a real run.
//
// Source files (relative to cep2-workspace):
//   projects/main/src/app/modules/toolbar/toolbar.component.html (Magnet tool button)
//   projects/main/src/app/modules/toolbar/components/magnet-submenu/magnet-submenu.component.html
//   projects/main/src/app/modules/attendance/attendance.component.html
//   projects/main/src/app/modules/attendance/close-attendance-dialog/close-attendance-dialog.component.html
//
// IMPORTANT GAP -- read before extending this file: the actual attendance-
// taking UI (student rows, present/absent toggles, a "mark all present"
// control, the submit button) is NOT in this repo's Angular source. It's
// rendered by a separately-built micro-frontend ("tce-attendance"), loaded at
// runtime as a Custom Element (`<app-attendance>`) via injected <script>/
// <link> tags, and it talks to the host app over postMessage-style events
// (INIT_ATTENDANCE / ATTENDANCE_SUBMITTED / REQUEST_CLOSE_ATTENDANCE / etc,
// see attendance.component.ts) -- not Angular template bindings. There is no
// source anywhere under cep2-workspace to read selectors from for that inner
// content. This is the same class of blocker MODULE_COVERAGE.md already
// documents for other "owned by an external micro-frontend" cases -- do NOT
// guess selectors for the student list/toggles/submit button. If it turns out
// to render inside a Shadow DOM, `cy.get(...).shadow()` will be needed and
// this file's scope will need revisiting entirely.
//
// Confirmed gating conditions (attendance.component.ts / magnet-submenu.component.ts):
//   * Magnet tool button only renders if an Academic Year is present (isAyPresent).
//   * "Attendance" submenu row only renders if a class/subject is selected
//     (isAttendanceAvailabe), and shows a "Pending" badge (no qa-id) if
//     today's attendance hasn't been submitted yet.
//   * The confirmation dialog on close only appears if the signed-in teacher
//     IS the class teacher (isClassTeacher) -- otherwise closeAttendance()
//     fires directly with no dialog. Tests must branch on which happened.
//   * An empty enrolled-student list makes the component tear itself down
//     immediately (shows a snackbar, calls closeAttendance()) -- same class
//     of missing-curriculum-data blocker documented in MODULE_COVERAGE.md.

export const AttendancePage = {
  magnetToolBtn() {
    return cy.get('[data-qa-id="toolbar-tool-gtMagnet"]');
  },

  openMagnetSubmenu() {
    this.magnetToolBtn().should("be.visible").click({ force: true });
    cy.wait(800);
  },

  attendanceSubmenuItem() {
    return cy.get('[data-qa-id="toolbar-magnet-gtAttendance"]');
  },

  open() {
    this.openMagnetSubmenu();
    this.attendanceSubmenuItem().should("be.visible").click({ force: true });
    cy.wait(1500);
  },

  container() {
    return cy.get('[data-qa-id="attendance-container"]');
  },

  closeDialogCloseIcon() {
    return cy.get('[data-qa-id="attendance-close-dialog-close-icon"]');
  },

  closeDialogCancelBtn() {
    return cy.get('[data-qa-id="attendance-close-dialog-cancel-btn"]');
  },

  closeDialogConfirmBtn() {
    return cy.get('[data-qa-id="attendance-close-dialog-confirm-btn"]');
  },

  // The dialog only appears for the class teacher -- callers branch on this,
  // same pattern as CompassPage.hasNoHomework.
  closeDialogAppeared(callback) {
    cy.wait(500);
    cy.get("body").then(($body) => {
      callback($body.find('[data-qa-id="attendance-close-dialog-confirm-btn"]').length > 0);
    });
  },
};
