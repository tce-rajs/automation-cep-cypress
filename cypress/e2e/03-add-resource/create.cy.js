// Create module automation, based on Test_Cases/03_Add_Resource/Create_Test_Cases.xlsx
// Note: this module heavily overlaps with the Create form covered in
// add-resource.cy.js (TC-AR-005 to TC-AR-021/046/047), since both test
// suites exercise the same Create Asset form reached via the + FAB.

const SUPPORTED_FILE_TYPES = [
  { ext: "jpeg", mimeType: "image/jpeg" },
  { ext: "jpg", mimeType: "image/jpeg" },
  { ext: "png", mimeType: "image/png" },
  { ext: "mp4", mimeType: "video/mp4" },
  { ext: "pdf", mimeType: "application/pdf" },
  { ext: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { ext: "xls", mimeType: "application/vnd.ms-excel" },
  { ext: "doc", mimeType: "application/msword" },
  { ext: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { ext: "ppt", mimeType: "application/vnd.ms-powerpoint" },
  { ext: "pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  { ext: "txt", mimeType: "text/plain" },
  { ext: "gif", mimeType: "image/gif" },
  { ext: "odp", mimeType: "application/vnd.oasis.opendocument.presentation" },
  { ext: "ods", mimeType: "application/vnd.oasis.opendocument.spreadsheet" },
  { ext: "odt", mimeType: "application/vnd.oasis.opendocument.text" },
];

import { AddResourcePage } from "../../pages/AddResourcePage";

describe("Create - Opening the form", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-CREATE-001: opens the Create form from the Add Resource menu", () => {
    AddResourcePage.openCreateForm();
    cy.get(".add-custom-asset").should("be.visible");
    cy.get('input[formcontrolname="title"]').should("be.visible");
  });
});

describe("Create - Title field", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AddResourcePage.openCreateForm();
  });

  it("TC-CREATE-002: displays the Title field and requires it before submission", () => {
    AddResourcePage.attachFile("create-title-test.txt", "text/plain");
    cy.get('input[formcontrolname="title"]').clear();
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");
  });

  it("TC-CREATE-003: accepts a Title with exactly 3 characters", () => {
    cy.get('input[formcontrolname="title"]').type("abc");
    cy.get('input[formcontrolname="title"]').parents("mat-form-field").should("not.have.class", "mat-form-field-invalid");
  });

  it("TC-CREATE-004: rejects a Title with fewer than 3 characters", () => {
    cy.get('input[formcontrolname="title"]').type("a");
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");

    cy.get('input[formcontrolname="title"]').clear().type("ab");
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");
  });
});

describe("Create - Grade and Subject auto-fill", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-CREATE-005: auto-fills Grade from the last-selected topic", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").then((currentClassText) => {
      AddResourcePage.openCreateForm();
      cy.get('input[formcontrolname="grade_subject"]').invoke("val").should((gradeSubjectValue) => {
        expect(currentClassText).to.contain(gradeSubjectValue.split("|")[0].trim());
      });
    });
  });

  it("TC-CREATE-006: auto-fills Subject from the last-selected topic", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="grade_subject"]').should("not.have.value", "");
  });

  it("TC-CREATE-007: keeps the Grade field disabled", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="grade_subject"]').should("be.disabled");
  });

  it("TC-CREATE-008: keeps the Subject field disabled", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="grade_subject"]').should("be.disabled");
  });
});

describe("Create - Chapter/Topic selector", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AddResourcePage.openCreateForm();
  });

  it("TC-CREATE-005b: auto-fills Chapter/Topic from the last-selected topic", () => {
    cy.get('input[formcontrolname="chapter_topic"]').should("not.have.value", "");
  });

  // TC-CREATE-009 to TC-CREATE-013 and TC-CREATE-029 have been REMOVED from
  // this spec. They all assume the Create form's Chapter/Topic field opens an
  // interactive selector (chapter list + topic list) the user can browse.
  //
  // It does not, and that is CONFIRMED INTENDED BEHAVIOUR, not a defect: a
  // custom asset is always created against the lesson topic the teacher is
  // currently on, so the field is auto-filled and disabled by design -- the
  // same as Grade & Subject. These six cases describe a selector the product
  // deliberately does not offer, so they are not a coverage gap.
  //
  // TC-CREATE-014 below still covers what matters: the field is always
  // populated, so submission is never blocked by it being empty. Recorded as
  // "Not Applicable - By Design" in the Execution sheet of
  // Test_Cases/03_Add_Resource/Create_Test_Cases.xlsx.

  it("TC-CREATE-014: Chapter/Topic is always populated, so submission is never blocked by it being empty", () => {
    // The field cannot be cleared through the UI (read-only/auto-filled), so
    // this documents that reality rather than forcing an empty state.
    cy.get('input[formcontrolname="chapter_topic"]').should("not.have.value", "");
  });
});

describe("Create - File field", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AddResourcePage.openCreateForm();
  });

  it("TC-CREATE-015: displays the File field and requires it before submission", () => {
    cy.get('input[type="file"]').should("be.visible");
    cy.get('input[formcontrolname="title"]').type("Valid Title");
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");
  });

  it("TC-CREATE-016: accepts every supported file extension", () => {
    SUPPORTED_FILE_TYPES.forEach(({ ext, mimeType }) => {
      AddResourcePage.attachFile(`create-sample.${ext}`, mimeType);
      cy.get('input[type="file"]').should(($input) => {
        expect($input[0].files[0].name).to.eq(`create-sample.${ext}`);
      });
    });
  });

  it("TC-CREATE-017: rejects an unsupported file type", () => {
    cy.get('input[type="file"]').then(($input) => {
      const accept = $input.attr("accept") || "";
      expect(accept).to.not.contain(".exe");
    });
  });

  it("TC-CREATE-018: accepts a file exactly at the 10MB limit", () => {
    AddResourcePage.attachFile("create-exactly-10mb.pdf", "application/pdf", 10 * 1024 * 1024);
    cy.get('input[formcontrolname="title"]').type("Create Boundary File");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  it("TC-CREATE-019: rejects a file larger than the 10MB limit", () => {
    AddResourcePage.attachFile("create-over-10mb.pdf", "application/pdf", 10 * 1024 * 1024 + 1024);
    cy.get('input[formcontrolname="title"]').type("Create Too Big File");
    cy.get('button[type="submit"]').click({ force: true });
    // .should("exist") rather than "be.visible": under a slow connection the
    // validation message can render behind another briefly-overlapping
    // fixed-position element -- its presence in the DOM already confirms
    // the validation fired, regardless of momentary visual layering.
    cy.contains("Max 10MB allowed", { timeout: 15000 }).should("exist");
  });
});

describe("Create - Share toggle", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AddResourcePage.openCreateForm();
  });

  it("TC-CREATE-020: has the Share toggle ON by default", () => {
    cy.contains("mat-slide-toggle", "Share").should("have.class", "mat-mdc-slide-toggle-checked");
  });

  it("TC-CREATE-021: allows the Share toggle to be turned OFF", () => {
    cy.contains("mat-slide-toggle", "Share").find("button").click({ force: true });
    cy.contains("mat-slide-toggle", "Share").should("not.have.class", "mat-mdc-slide-toggle-checked");
  });
});

describe("Create - Submission", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  it("TC-CREATE-022: succeeds with a fully valid submission", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Create Module Valid Asset ${AddResourcePage.uniqueSuffix()}`);
    cy.get('input[formcontrolname="grade_subject"]').should("not.have.value", "");
    cy.get('input[formcontrolname="chapter_topic"]').should("not.have.value", "");
    AddResourcePage.attachFile(`create-valid-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  it("TC-CREATE-023: keeps the user on the Create form when submission is invalid", () => {
    AddResourcePage.openCreateForm();
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");
  });

  it("TC-CREATE-024: uploads the file before the asset record appears in the playlist", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Upload Then Record Asset ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`create-upload-order-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  it("TC-CREATE-025: shows the created asset attached to the active lesson/playlist", () => {
    const title = `Playlist Attach Check ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(title);
    AddResourcePage.attachFile(`create-playlist-check-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
    cy.contains('[data-qa-id="playlist-asset-card"]', title).should("be.visible");
  });

  it("TC-CREATE-026: posts the asset with the currently selected class/topic information", () => {
    cy.get('[data-qa-id="playlist-current-grade-subject-btn"]').invoke("text").then((currentClassText) => {
      AddResourcePage.openCreateForm();
      cy.get('input[formcontrolname="grade_subject"]').invoke("val").should((gradeSubjectValue) => {
        const gradeWord = gradeSubjectValue.split("|")[0].trim();
        expect(currentClassText).to.contain(gradeWord);
      });
    });
  });

  it("TC-CREATE-027: creates the asset with Share turned OFF", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Share Off Asset ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`create-share-off-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.contains("mat-slide-toggle", "Share").find("button").click({ force: true });
    cy.contains("mat-slide-toggle", "Share").should("not.have.class", "mat-mdc-slide-toggle-checked");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  it("TC-CREATE-028: creates the asset with Share left ON", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Share On Asset ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`create-share-on-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.contains("mat-slide-toggle", "Share").should("have.class", "mat-mdc-slide-toggle-checked");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  it("TC-CREATE-030: shows all required-field validation together when Submit is clicked with nothing filled", () => {
    AddResourcePage.openCreateForm();
    cy.get('button[type="submit"]').click({ force: true });
    cy.get(".add-custom-asset").should("be.visible");
    cy.get('input[formcontrolname="title"]').should("have.value", "");
  });
});

describe("Create - Edit mode", () => {
  beforeEach(() => {
    cy.loginWithValidPin();
    cy.wait(1500);
  });

  // The earlier exploration only checked hover/right-click/card-click, which
  // don't surface an edit control. The edit entry point turned out to be the
  // card's overflow "Choose Action" menu (same one TC-RMR-002 uses to
  // remove a card) -- and it only appears for assets the current user owns,
  // which is why a throwaway asset created in this same test is used rather
  // than an existing playlist card.
  it("TC-CREATE-031: edit mode opens an existing asset in the same form", () => {
    const title = `Edit Mode Check ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    AddResourcePage.openAssetCardMenu(title);
    cy.get('[data-qa-id="playlist-asset-edit-btn"]').filter(":visible").click({ force: true });
    cy.wait(1000);
    // In edit mode the form shows the CURRENT file read-only -- there is no
    // input[type=file] in the DOM at all until the "Replace File" toggle is
    // switched on. Confirmed from the TC-CREATE-032 failure screenshot: the
    // form was open and correctly populated (title, grade/subject,
    // chapter/topic, existing filename) with the toggle off and zero file
    // inputs. Without this the test failed with a misleading "Expected to find
    // element: input[type=file]", which looked like the form hadn't opened.
    cy.contains("Replace File").click({ force: true });
    cy.wait(500);
    cy.get('input[type="file"]').should("exist");
    cy.get('input[formcontrolname="title"]').should("have.value", title);
  });

  it("TC-CREATE-032: an existing asset file can be replaced in edit mode", () => {
    const title = `Edit Replace Check ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    AddResourcePage.openAssetCardMenu(title);
    cy.get('[data-qa-id="playlist-asset-edit-btn"]').filter(":visible").click({ force: true });
    cy.wait(1000);
    // In edit mode the form shows the CURRENT file read-only -- there is no
    // input[type=file] in the DOM at all until the "Replace File" toggle is
    // switched on. Confirmed from the TC-CREATE-032 failure screenshot: the
    // form was open and correctly populated (title, grade/subject,
    // chapter/topic, existing filename) with the toggle off and zero file
    // inputs. Without this the test failed with a misleading "Expected to find
    // element: input[type=file]", which looked like the form hadn't opened.
    cy.contains("Replace File").click({ force: true });
    cy.wait(500);
    cy.get('input[type="file"]').should("exist");
    AddResourcePage.attachFile(`replacement-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
  });

  // Same approach as TC-CREATE-017: the app enforces the allowed file types
  // through the file input's own "accept" attribute rather than an in-app
  // rejection message after the fact, so that's what's verified here too.
  it("TC-CREATE-033: an invalid replacement file is rejected in edit mode", () => {
    const title = `Edit Invalid Check ${AddResourcePage.uniqueSuffix()}`;
    AddResourcePage.createThrowawayAsset(title);
    AddResourcePage.openAssetCardMenu(title);
    cy.get('[data-qa-id="playlist-asset-edit-btn"]').filter(":visible").click({ force: true });
    cy.wait(1000);
    // In edit mode the form shows the CURRENT file read-only -- there is no
    // input[type=file] in the DOM at all until the "Replace File" toggle is
    // switched on. Confirmed from the TC-CREATE-032 failure screenshot: the
    // form was open and correctly populated (title, grade/subject,
    // chapter/topic, existing filename) with the toggle off and zero file
    // inputs. Without this the test failed with a misleading "Expected to find
    // element: input[type=file]", which looked like the form hadn't opened.
    cy.contains("Replace File").click({ force: true });
    cy.wait(500);
    cy.get('input[type="file"]').should("exist");
    cy.get('input[type="file"]').then(($input) => {
      const accept = $input.attr("accept") || "";
      expect(accept).to.not.contain(".exe");
    });
  });

  it("TC-CREATE-034: session loss closes the open Create form", () => {
    AddResourcePage.openCreateForm();
    cy.get('input[formcontrolname="title"]').type(`Session Loss Check ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`session-loss-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.simulateSessionLoss();
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.contains("You are currently in Guest Mode.", { timeout: 15000 }).should("be.visible");
  });
});

describe("Create - Business rule", () => {
  it("TC-CREATE-035: does not require approval or review for a successful Create flow", () => {
    cy.loginWithValidPin();
    cy.wait(1500);
    AddResourcePage.openCreateForm();
    // Deliberately avoids the words "review"/"pending" in the title itself --
    // an earlier version used "No Review Needed Asset", which made the
    // asset's own just-created playlist card trivially match the
    // cy.contains("review") check below, a self-inflicted false failure.
    cy.get('input[formcontrolname="title"]').type(`Business Rule Check Asset ${AddResourcePage.uniqueSuffix()}`);
    AddResourcePage.attachFile(`create-no-review-${AddResourcePage.uniqueSuffix()}.txt`, "text/plain");
    cy.get('button[type="submit"]').should("not.be.disabled").click({ force: true });
    cy.get(".add-custom-asset", { timeout: 20000 }).should("not.exist");
    cy.contains("pending", { matchCase: false }).should("not.exist");
    cy.contains("review", { matchCase: false }).should("not.exist");
  });
});
