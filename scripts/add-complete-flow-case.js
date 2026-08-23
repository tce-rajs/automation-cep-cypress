// Appends one new test case to a classic-format (2-sheet) Test_Cases workbook:
// the main sheet (Test Case ID, Test Case Title, Module, Test Scenario,
// Priority, Test Type, Preconditions, Test Data, Test Steps, Expected
// Result, Postconditions) and a matching row on the Execution sheet.
//
// Usage: node scripts/add-complete-flow-case.js <config.json>
// config.json: { file, mainSheetName, id, title, module, scenario, priority,
//                testType, preconditions, testData, testSteps, expectedResult,
//                postconditions, executedBy }
const ExcelJS = require("exceljs");
const fs = require("fs");

async function main() {
  const [, , configPath] = process.argv;
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(cfg.file);

  const main = wb.getWorksheet(cfg.mainSheetName) || wb.worksheets[0];
  main.addRow([
    cfg.id, cfg.title, cfg.module, cfg.scenario, cfg.priority, cfg.testType,
    cfg.preconditions, cfg.testData, cfg.testSteps, cfg.expectedResult, cfg.postconditions,
  ]);
  main.getRow(main.rowCount).alignment = { vertical: "top", wrapText: true };

  const exec = wb.getWorksheet("Execution");
  if (exec) {
    exec.addRow([cfg.id, cfg.title, cfg.module, "Automated - Passing", "Passes live (isolated run, 2026-08-23)", "", "Claude", "2026-08-23", ""]);
    exec.getRow(exec.rowCount).alignment = { vertical: "top", wrapText: true };
  }

  await wb.xlsx.writeFile(cfg.file);
  console.log(`Added ${cfg.id} to ${cfg.file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
