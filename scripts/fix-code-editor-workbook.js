const ExcelJS = require("exceljs");

async function main() {
  const file = "Test_Cases/05_Player/Code_Editor_Test_Cases.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const flow = wb.getWorksheet("01_Flow");
  flow.addRow(["F18", "Settings Integrity", "Change settings, then Run", "Execution still succeeds after a settings change."]);
  flow.addRow(["F19", "Error Handling", "Run syntactically invalid code", "Player does not freeze or crash; stays usable."]);

  const tc = wb.getWorksheet("03_Test Cases");
  tc.addRow(["TC-CODE-015", "Run persists after settings change", "Settings open.", "Theme + text-size change, then valid code", "Change Theme and Text Size, close Settings, Run, and verify execution still succeeds.", "Positive", "Medium", "F11,F18"]);
  tc.addRow(["TC-CODE-016", "Verify Close", "Code Editor open.", "N/A", "Click Close and verify wrapper is removed and prior Playlist/whiteboard state returns.", "Positive", "High", "F16"]);
  tc.addRow(["TC-CODE-017", "Verify Reopen", "Code Editor was closed.", "Same Code Editor resource", "Reopen the same Code Editor and verify it loads again.", "Positive", "Medium", "F16,F17"]);
  tc.addRow(["TC-CODE-018", "Invalid code is handled gracefully", "Code Editor open.", "Syntactically invalid code", "Type invalid code, Run, and verify the player does not freeze or crash and stays usable.", "Negative", "High", "F19"]);
  // Re-apply wrap/valign to the newly added rows to match the sheet's existing style.
  for (let r = 2; r <= tc.rowCount; r++) {
    tc.getRow(r).alignment = { vertical: "top", wrapText: true };
  }

  await wb.xlsx.writeFile(file);
  console.log("Code Editor workbook updated:", tc.rowCount - 1, "test cases,", flow.rowCount - 1, "flows");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
