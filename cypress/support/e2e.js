import "./commands";
// Allure reporting support (optional, additive) -- only writes report data
// when a run is started with --env allure=true. Cypress's own default
// report is completely unaffected by this import either way.
import "@shelex/cypress-allure-plugin";

// The app under test occasionally throws unrelated console errors (e.g. from
// third-party widgets). Don't let those unrelated errors fail our UI tests.
Cypress.on("uncaught:exception", () => false);
