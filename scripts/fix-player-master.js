// Corrects two drifted sections of Player_Master_Test_Cases.xlsx's rollup sheets
// (All Test Cases + Execution): TC-CODE (was stale/incomplete: 12 rows, one with
// wrong content) and TC-QUIZ (had 6 phantom rows not present in the real Quiz
// workbook or the spec). Both individual source workbooks were confirmed correct
// against the live spec files, so they are the source of truth here.
const ExcelJS = require("exceljs");

const REPLACEMENTS = [
  {
    prefix: "TC-CODE",
    module: "Code Editor Player",
    file: "Test_Cases/05_Player/Code_Editor_Test_Cases.xlsx",
  },
  {
    prefix: "TC-QUIZ",
    module: "Quiz Player",
    file: "Test_Cases/05_Player/Quiz_Player_Test_Cases.xlsx",
  },
];

function typeToTestType(t) {
  if (!t) return "Functional";
  if (/negative/i.test(t)) return "Negative";
  if (/edge/i.test(t)) return "Edge Case";
  return "Functional";
}

async function loadReplacementRows(prefix, module, file) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const sheet = wb.getWorksheet("03_Test Cases");
  const header = sheet.getRow(1).values.map((v) => (v || "").toString());
  const idxOf = (name) => header.indexOf(name);
  const iId = idxOf("ID");
  const iScenario = idxOf("Scenario") > -1 ? idxOf("Scenario") : idxOf("Test Scenario");
  const iTitle = idxOf("Title");
  const iPre = idxOf("Preconditions");
  const iData = idxOf("Test Data");
  const iObjective = idxOf("Automation Objective");
  const iType = idxOf("Type");
  const iPriority = idxOf("Priority");

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const id = row.getCell(iId).value;
    if (!id || typeof id !== "string" || !id.startsWith(prefix + "-")) continue;
    const scenario = (iScenario > -1 ? row.getCell(iScenario).value : "") || "";
    const title = (iTitle > -1 ? row.getCell(iTitle).value : "") || scenario;
    const objective = (row.getCell(iObjective).value || "").toString();
    rows.push({
      id,
      title: title || scenario,
      module,
      scenario: scenario || title,
      priority: (row.getCell(iPriority).value || "P1").toString().replace(/^High$/i, "P0").replace(/^Medium$/i, "P1").replace(/^Low$/i, "P2"),
      testType: typeToTestType(row.getCell(iType).value),
      preconditions: (row.getCell(iPre).value || "").toString(),
      testData: (row.getCell(iData).value || "").toString(),
      testSteps: objective,
      expectedResult: objective.includes("->") ? objective.split("->").slice(-1)[0].trim().replace(/^verify\s*/i, "") : objective,
      postconditions: "",
    });
  }
  return rows;
}

async function main() {
  const file = "Test_Cases/05_Player/Player_Master_Test_Cases.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const allTC = wb.getWorksheet("All Test Cases");
  const exec = wb.getWorksheet("Execution");
  const summary = wb.getWorksheet("Master Summary");

  for (const { prefix, module, file: srcFile } of REPLACEMENTS) {
    const newRows = await loadReplacementRows(prefix, module, srcFile);

    // --- All Test Cases sheet: find first row of this prefix, remove the whole block, insert replacements there.
    let firstIdx = -1;
    let count = 0;
    for (let r = 2; r <= allTC.rowCount; r++) {
      const id = allTC.getRow(r).getCell(1).value;
      if (typeof id === "string" && id.startsWith(prefix + "-")) {
        if (firstIdx === -1) firstIdx = r;
        count++;
      }
    }
    if (firstIdx === -1) throw new Error("No existing rows found for " + prefix);
    for (let i = 0; i < count; i++) allTC.spliceRows(firstIdx, 1);
    const tcValues = newRows.map((r) => [
      r.id, r.title, r.module, r.scenario, r.priority, r.testType,
      r.preconditions, r.testData, r.testSteps, r.expectedResult, r.postconditions,
    ]);
    allTC.spliceRows(firstIdx, 0, ...tcValues);
    for (const row of tcValues.map((_, i) => allTC.getRow(firstIdx + i))) {
      row.alignment = { vertical: "top", wrapText: true };
    }

    // --- Execution sheet: same treatment, columns: ID, Title, Player/Module, Status, Actual, Defect, ExecutedBy, Date, Remarks
    let eFirst = -1, eCount = 0;
    for (let r = 2; r <= exec.rowCount; r++) {
      const id = exec.getRow(r).getCell(1).value;
      if (typeof id === "string" && id.startsWith(prefix + "-")) {
        if (eFirst === -1) eFirst = r;
        eCount++;
      }
    }
    if (eFirst === -1) throw new Error("No existing Execution rows found for " + prefix);
    for (let i = 0; i < eCount; i++) exec.spliceRows(eFirst, 1);
    const execValues = newRows.map((r) => [r.id, r.title, r.module, "Not Executed", "", "", "", "", ""]);
    exec.spliceRows(eFirst, 0, ...execValues);

    // --- Master Summary: update Test Case Count for this player.
    for (let r = 2; r <= summary.rowCount; r++) {
      const row = summary.getRow(r);
      if ((row.getCell(4).value || "").toString().includes(srcFile.split("/").pop())) {
        row.getCell(3).value = newRows.length;
      }
    }

    console.log(`${prefix}: replaced ${count} (TC sheet) / ${eCount} (Execution sheet) rows with ${newRows.length} correct rows`);
  }

  await wb.xlsx.writeFile(file);
  console.log("Player_Master_Test_Cases.xlsx corrected and saved.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
