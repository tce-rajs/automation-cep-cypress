// Cross-checks a "Master" workbook (Master Summary + All Test Cases sheets)
// against a folder of spec files, grouping by ID prefix (e.g. TC-TCE-001).
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// masterFile -> { specDir, mapping: prefix -> specFile }
const jobs = [
  {
    masterFile: "Test_Cases/04_Playlist/Playlist_Master_Test_Cases.xlsx",
    specFiles: ["cypress/e2e/04-playlist/playlist.cy.js"],
  },
  {
    masterFile: "Test_Cases/05_Player/Player_Master_Test_Cases.xlsx",
    mapping: {
      "TCE": "cypress/e2e/05-player/tce.cy.js",
      "PDF": "cypress/e2e/05-player/pdf-worksheet.cy.js",
      "WORK": "cypress/e2e/05-player/pdf-worksheet.cy.js",
      "VID": "cypress/e2e/05-player/video.cy.js",
      "IMG": "cypress/e2e/05-player/image.cy.js",
      "WEB": "cypress/e2e/05-player/weblink.cy.js",
      "QUIZ": "cypress/e2e/05-player/quiz.cy.js",
      "CHK": "cypress/e2e/05-player/checkpoints.cy.js",
      "NOT": "cypress/e2e/05-player/notes.cy.js",
      "EBOOK": "cypress/e2e/05-player/ebook.cy.js",
      "CODE": "cypress/e2e/05-player/code-editor.cy.js",
      "UNS": "cypress/e2e/05-player/unsupported.cy.js",
    },
  },
];

function idsFromSpecFiles(files, prefix) {
  const ids = new Set();
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, "utf8");
    const re = new RegExp(escapeRegex(prefix) + "-[0-9]+[a-z]?", "g");
    for (const m of content.match(re) || []) ids.add(m);
  }
  return ids;
}

async function main() {
  for (const job of jobs) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(job.masterFile);
    const sheet = wb.getWorksheet("All Test Cases");
    const byPrefix = {};
    for (let r = 2; r <= sheet.rowCount; r++) {
      const v = sheet.getRow(r).getCell(1).value;
      if (!v || typeof v !== "string") continue;
      const m = v.match(/^TC-([A-Z]+)-[0-9]+[a-z]?$/);
      if (!m) continue;
      const prefix = "TC-" + m[1];
      (byPrefix[prefix] = byPrefix[prefix] || new Set()).add(v);
    }

    console.log("\n=========", job.masterFile, "=========");
    for (const [prefix, wbIds] of Object.entries(byPrefix)) {
      let specFiles;
      if (job.specFiles) specFiles = job.specFiles;
      else {
        const short = prefix.replace("TC-", "");
        const f = job.mapping[short];
        specFiles = f ? [f] : [];
      }
      const specIds = idsFromSpecFiles(specFiles, prefix);
      const inWbNotSpec = [...wbIds].filter((x) => !specIds.has(x));
      const inSpecNotWb = [...specIds].filter((x) => !wbIds.has(x));
      console.log(`  ${prefix}: workbook=${wbIds.size} spec=${specIds.size} files=[${specFiles.join(",")}]`);
      if (inWbNotSpec.length) console.log("    IN WORKBOOK NOT IN SPEC:", inWbNotSpec.sort().join(", "));
      if (inSpecNotWb.length) console.log("    IN SPEC NOT IN WORKBOOK:", inSpecNotWb.sort().join(", "));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
