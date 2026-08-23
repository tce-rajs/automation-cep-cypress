// Repairs an .xlsx whose internal zip relationship Targets are malformed
// (absolute package paths instead of relative ones -- confirmed root cause
// for Add_Resource_Test_Cases.xlsx and Create_Test_Cases.xlsx, both
// unreadable by exceljs/most standard tooling despite being valid-looking
// OOXML). Extracts each sheet's cell values by parsing the raw sheet XML
// directly (inline strings, no sharedStrings.xml present in the broken
// files), then writes a fresh, correctly-formed workbook via exceljs, which
// handles zip/path formatting correctly on write.
//
// Usage: node scripts/repair-xlsx.js <extracted-dir> <output.xlsx>
// <extracted-dir> must already be unzipped (see repair notes in PROJECT_NOTES.md
// or the session that produced this script for the extraction command).

const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

function parseSheetXml(xmlPath) {
  const xml = fs.readFileSync(xmlPath, "utf8");
  const rows = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowNum = parseInt(rowMatch[1], 10);
    const rowContent = rowMatch[2];
    const cells = {};
    const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*>(?:<is><t[^>]*>([\s\S]*?)<\/t><\/is>|<v>([\s\S]*?)<\/v>)?<\/c>/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowContent))) {
      const col = cellMatch[1];
      const text = cellMatch[3] !== undefined ? cellMatch[3] : cellMatch[4];
      cells[col] = text
        ? text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, "&")
        : "";
    }
    rows[rowNum] = cells;
  }
  // Determine max column letter used.
  let maxCol = "A";
  for (const r of rows) {
    if (!r) continue;
    for (const col of Object.keys(r)) {
      if (col.length > maxCol.length || (col.length === maxCol.length && col > maxCol)) maxCol = col;
    }
  }
  const colToIdx = (col) => {
    let idx = 0;
    for (const ch of col) idx = idx * 26 + (ch.charCodeAt(0) - 64);
    return idx;
  };
  const maxIdx = colToIdx(maxCol);

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    if (!rows[r]) {
      out.push(null);
      continue;
    }
    const arr = [];
    for (let c = 1; c <= maxIdx; c++) {
      const colLetter = String.fromCharCode(64 + c); // only handles A-Z, sufficient here
      arr.push(rows[r][colLetter] || "");
    }
    out.push(arr);
  }
  return out;
}

async function main() {
  const [, , extractedDir, outputPath] = process.argv;

  const workbookXml = fs.readFileSync(path.join(extractedDir, "xl", "workbook.xml"), "utf8");
  const sheetNames = [...workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g)].map((m) => m[1]);

  const relsXml = fs.readFileSync(path.join(extractedDir, "xl", "_rels", "workbook.xml.rels"), "utf8");
  const relMap = {};
  for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) relMap[m[1]] = m[2];
  for (const m of relsXml.matchAll(/Target="([^"]+)"[^>]*Id="(rId\d+)"/g)) relMap[m[2]] = m[1];

  const wb = new ExcelJS.Workbook();
  const sheetFiles = fs
    .readdirSync(path.join(extractedDir, "xl", "worksheets"))
    .filter((f) => f.endsWith(".xml"))
    .sort();

  sheetFiles.forEach((file, i) => {
    const name = sheetNames[i] || file;
    const rows = parseSheetXml(path.join(extractedDir, "xl", "worksheets", file));
    const sheet = wb.addWorksheet(name);
    for (const row of rows) {
      if (row === null) {
        sheet.addRow([]);
      } else {
        sheet.addRow(row);
      }
    }
    if (rows[0]) {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      rows[0].forEach((col, idx) => {
        let maxLen = String(col || "").length;
        for (const r of rows) {
          if (!r) continue;
          const v = r[idx];
          const len = v ? String(v).length : 0;
          if (len > maxLen) maxLen = len;
        }
        sheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 2, 10), 60);
      });
      for (let r = 2; r <= rows.length; r++) {
        sheet.getRow(r).alignment = { vertical: "top", wrapText: true };
      }
    }
  });

  await wb.xlsx.writeFile(outputPath);
  console.log(`Repaired workbook written to ${outputPath} (${sheetFiles.length} sheets)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
