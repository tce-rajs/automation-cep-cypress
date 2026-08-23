const ExcelJS = require("exceljs");
const fs = require("fs");

const pairs = [
  ["Test_Cases/02_Navigation/Navigation_Test_Cases.xlsx", "cypress/e2e/02-navigation/navigation.cy.js", "TC-NAV"],
  ["Test_Cases/03_Add_Resource/AI_Assist_Test_Cases.xlsx", "cypress/e2e/03-add-resource/ai-assist.cy.js", "TC-AI"],
  ["Test_Cases/03_Add_Resource/Gallery_Test_Cases.xlsx", "cypress/e2e/03-add-resource/gallery.cy.js", "TC-AR"],
  ["Test_Cases/03_Add_Resource/Library_Test_Cases.xlsx", "cypress/e2e/03-add-resource/library.cy.js", "TC-LIB"],
  ["Test_Cases/06_Toolbar/Toolbar_Test_Cases.xlsx", "cypress/e2e/06-toolbar/toolbar.cy.js", "TB"],
  ["Test_Cases/06_Toolbar/Toolbar_Additional_Test_Cases.xlsx", "cypress/e2e/06-toolbar/toolbar-additional.cy.js", "TB"],
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function idsFromSpec(file, prefix) {
  const content = fs.readFileSync(file, "utf8");
  const re = new RegExp(escapeRegex(prefix) + "-[0-9]+[a-z]?", "g");
  return new Set(content.match(re) || []);
}

async function main() {
  for (const [wbFile, specFile, prefix] of pairs) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(wbFile);
    const sheet = wb.worksheets[0];
    const wbIds = new Set();
    for (let r = 1; r <= sheet.rowCount; r++) {
      const v = sheet.getRow(r).getCell(1).value;
      if (v && typeof v === "string" && v.startsWith(prefix + "-")) wbIds.add(v);
    }
    const specIds = idsFromSpec(specFile, prefix);
    const inWbNotSpec = [...wbIds].filter((x) => !specIds.has(x));
    const inSpecNotWb = [...specIds].filter((x) => !wbIds.has(x));
    console.log("===", wbFile, "===");
    console.log("  workbook count:", wbIds.size, " spec count:", specIds.size);
    if (inWbNotSpec.length) console.log("  IN WORKBOOK, NOT IN SPEC:", inWbNotSpec.sort().join(", "));
    if (inSpecNotWb.length) console.log("  IN SPEC, NOT IN WORKBOOK:", inSpecNotWb.sort().join(", "));
  }
}

main();
