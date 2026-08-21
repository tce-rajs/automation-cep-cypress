const { defineConfig } = require("cypress");
const allureWriter = require("@shelex/cypress-allure-plugin/writer");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://ce-qa-school.devstudi.com",
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    // This suite runs against a live, shared QA environment with no mocking,
    // so a slow response is not a test failure -- but without retries it
    // permanently is. In the 2026-08-17 full run, two transient blips (a login
    // that missed the 20s "Welcome Back!" wait, and a cy.visit() that exceeded
    // the 30s page-load timeout) failed 5 tests outright and cascaded 5 more
    // into skipped, because both landed inside a beforeEach hook.
    //
    // runMode 2 = up to two extra attempts headlessly (CI and `npm test`).
    // openMode 0 = no retries in the interactive GUI, so a developer debugging
    // a test sees the real first failure instead of a masked one.
    //
    // NOTE: retries hide genuine flakiness as well as environmental noise. A
    // test that only passes on attempt 2 or 3 is still a problem -- Allure
    // flags retried tests, so check for them rather than assuming green means
    // healthy.
    retries: {
      runMode: 2,
      openMode: 0,
    },
    // Allure reporting is optional and additive: it only activates when a
    // run is started with --env allure=true (see the npm "test:allure"
    // script). Cypress's own default report/output is unaffected either way.
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      return config;
    },
  },
});
