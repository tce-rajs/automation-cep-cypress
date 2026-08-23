const ExcelJS = require("exceljs");

async function dump(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  console.log(`\n========== ${filePath} ==========`);
  wb.eachSheet((sheet) => {
    console.log(`\n--- SHEET: "${sheet.name}" (${sheet.rowCount} rows, ${sheet.columnCount} cols) ---`);
    const maxRows = Math.min(sheet.rowCount, 15);
    for (let r = 1; r <= maxRows; r++) {
      const row = sheet.getRow(r);
      const vals = [];
      for (let c = 1; c <= sheet.columnCount; c++) {
        const cell = row.getCell(c);
        let v = cell.value;
        if (v && typeof v === "object" && v.richText) {
          v = v.richText.map((t) => t.text).join("");
        }
        vals.push(v === null || v === undefined ? "" : String(v).slice(0, 60));
      }
      console.log(`row${r}: ${JSON.stringify(vals)}`);
    }
  });
}

const target = process.argv[2];
dump(target).catch((e) => {
  console.error(e);
  process.exit(1);
});
