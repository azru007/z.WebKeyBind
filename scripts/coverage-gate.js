/**
 * Requirements Coverage and Traceability Gate Script
 *
 * Scans the tests/ directory for JSDoc-style requirement tags (@req) and test case IDs (@testId),
 * matches them against the baseline requirement specification, and enforces coverage policies.
 *
 * Baseline requirements:
 * - z.WebKeyBind_01: Manifest & Target Browser Compatibility
 * - z.WebKeyBind_02: Shortcut Key Activation & Deactivation
 * - z.WebKeyBind_03: Manual Shortcut Creation, Editing & Settings UI
 * - z.WebKeyBind_04: Element Identifier Capture & Healing Engine
 * - z.WebKeyBind_05: Multi-Language Localization System
 * - z.WebKeyBind_06: Backup and Restore / JSON Import & Export
 * - z.WebKeyBind_07: Shortcut Table Operations & CRUD Lifecycle
 * - z.WebKeyBind_08: Accessibility Compliance Engine (WCAG 2.1 AA)
 */

const fs = require("fs");
const path = require("path");

const BASELINE_REQUIREMENTS = [
  "z.WebKeyBind_01",
  "z.WebKeyBind_02",
  "z.WebKeyBind_03",
  "z.WebKeyBind_04",
  "z.WebKeyBind_05",
  "z.WebKeyBind_06",
  "z.WebKeyBind_07",
  "z.WebKeyBind_08"
];

const TESTS_DIR = path.resolve(__dirname, "..", "tests");
const REPORT_OUTPUT = path.resolve(__dirname, "..", "coverage-report.json");

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith(".js") || file.endsWith(".spec.js") || file.endsWith(".test.js")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function parseTestFiles() {
  const files = walkDir(TESTS_DIR);
  const results = [];
  const reqCoverage = {};
  const testIds = new Set();
  const duplicates = [];

  BASELINE_REQUIREMENTS.forEach((req) => {
    reqCoverage[req] = {
      tests: [],
      covered: false
    };
  });

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(path.resolve(__dirname, ".."), file);

    // Look for JSDoc or comments containing @req tags
    // E.g., * @req z.WebKeyBind_01
    const reqRegex = /@req\s+(z\.WebKeyBind_\d+)/g;
    let match;
    const fileReqs = new Set();
    while ((match = reqRegex.exec(content)) !== null) {
      fileReqs.add(match[1]);
    }

    // Look for JSDoc or comments containing @testId tags
    // E.g., * @testId WK-URL-01
    const testIdRegex = /@testId\s+(WK-[A-Za-z0-9-]+)/g;
    const fileTestIds = [];
    while ((match = testIdRegex.exec(content)) !== null) {
      const tid = match[1];
      if (testIds.has(tid)) {
        duplicates.push({ testId: tid, file: relativePath });
      }
      testIds.add(tid);
      fileTestIds.push(tid);
    }

    if (fileReqs.size > 0 || fileTestIds.length > 0) {
      results.push({
        file: relativePath,
        requirements: Array.from(fileReqs),
        testIds: fileTestIds
      });

      fileReqs.forEach((req) => {
        if (reqCoverage[req]) {
          reqCoverage[req].tests.push({
            file: relativePath,
            testIds: fileTestIds
          });
          reqCoverage[req].covered = true;
        } else {
          // Documented requirement is not in the baseline list
          console.warn(`Warning: Found unrecognized requirement tag ${req} in ${relativePath}`);
        }
      });
    }
  });

  return { results, reqCoverage, testIds: Array.from(testIds), duplicates };
}

function main() {
  console.log("=== Requirements Traceability Matrix & Coverage Gate ===");
  const { results, reqCoverage, testIds, duplicates } = parseTestFiles();

  console.log(`Total Test Files Analyzed: ${results.length}`);
  console.log(`Unique Test IDs Found: ${testIds.length}`);

  if (duplicates.length > 0) {
    console.error("\nError: Duplicate Test IDs Detected!");
    duplicates.forEach((d) => {
      console.error(`- Duplicate ID: ${d.testId} in file: ${d.file}`);
    });
    process.exit(1);
  }

  let uncoveredCount = 0;
  console.log("\nCoverage Status:");
  BASELINE_REQUIREMENTS.forEach((req) => {
    const status = reqCoverage[req].covered;
    const testCount = reqCoverage[req].tests.reduce((acc, t) => acc + t.testIds.length, 0);
    console.log(`- [${status ? "PASS" : "FAIL"}] ${req}: Covered by ${testCount} test case assertions.`);
    if (!status) {
      uncoveredCount++;
    }
  });

  const report = {
    generatedAt: new Date().toISOString(),
    totalTestFiles: results.length,
    totalTestIds: testIds.length,
    requirementsCoverage: reqCoverage,
    testFileMappings: results
  };

  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2));
  console.log(`\nTraceability report generated at: ${REPORT_OUTPUT}`);

  if (uncoveredCount > 0) {
    console.error(`\nError: Gate Failed. ${uncoveredCount} baseline requirements are uncovered!`);
    process.exit(1);
  }

  console.log("\nAll baseline requirements successfully traced to test cases. Coverage Gate Passed!");
  process.exit(0);
}

if (require.main === module) {
  main();
}
