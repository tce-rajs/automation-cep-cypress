// Generic writer: reads a JSON file describing sheets and writes an .xlsx
// workbook matching this project's "reworked" Test_Cases convention
// (bold header row, column widths sized to content, freeze header row).
//
// JSON shape:
// { "sheets": [ { "name": "01_Flow", "columns": ["Flow ID", ...], "rows": [[...], ...] }, ... ] }
//
// Usage: node scripts/write-xlsx.js <input.json> <output.xlsx>

const ExcelJS = require("exceljs");
const fs = require("fs");

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const wb = new ExcelJS.Workbook();
  for (const sheetDef of data.sheets) {
    const sheet = wb.addWorksheet(sheetDef.name);
    sheet.addRow(sheetDef.columns);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", wrapText: false };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const r of sheetDef.rows) {
      sheet.addRow(r);
    }

    // Size columns to content, capped for readability.
    sheetDef.columns.forEach((col, i) => {
      const idx = i + 1;
      let maxLen = String(col).length;
      for (const r of sheetDef.rows) {
        const v = r[i];
        const len = v === null || v === undefined ? 0 : String(v).length;
        if (len > maxLen) maxLen = len;
      }
      sheet.getColumn(idx).width = Math.min(Math.max(maxLen + 2, 10), 60);
    });

    // Wrap text on longer descriptive columns for readability.
    for (let r = 2; r <= sheetDef.rows.length + 1; r++) {
      const row = sheet.getRow(r);
      row.alignment = { vertical: "top", wrapText: true };
    }
  }

  fs.mkdirSync(require("path").dirname(outputPath), { recursive: true });
  await wb.xlsx.writeFile(outputPath);
  console.log(`Wrote ${outputPath} (${data.sheets.length} sheets)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
