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
    // Allure reporting is optional and additive: it only activates when a
    // run is started with --env allure=true (see the npm "test:allure"
    // script). Cypress's own default report/output is unaffected either way.
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      return config;
    },
  },
});
