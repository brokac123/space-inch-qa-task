// Turns the mochawesome JSON report into a GitHub Actions job summary.
const fs = require('fs');
const path = require('path');

const reportPath = path.join('cypress', 'reports', 'index.json');
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function collectTests(suite) {
  let tests = suite.tests || [];
  const nestedSuites = suite.suites || [];
  nestedSuites.forEach(function (nested) {
    tests = tests.concat(collectTests(nested));
  });
  return tests;
}

function buildSummary(report) {
  const stats = report.stats;
  const seconds = (stats.duration / 1000).toFixed(1);
  const lines = [];

  lines.push('## GSRI API test results');
  lines.push('');
  lines.push('| Total | Passed | Failed | Duration |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(`| ${stats.tests} | ${stats.passes} | ${stats.failures} | ${seconds}s |`);
  lines.push('');
  lines.push('| Spec | Tests | Passed | Failed |');
  lines.push('| --- | --- | --- | --- |');

  const failedTests = [];

  report.results.forEach(function (specResult) {
    let tests = specResult.tests || [];
    (specResult.suites || []).forEach(function (suite) {
      tests = tests.concat(collectTests(suite));
    });

    const passed = tests.filter(function (test) {
      return test.pass;
    });
    const failed = tests.filter(function (test) {
      return test.fail;
    });
    failed.forEach(function (test) {
      failedTests.push(test.fullTitle);
    });

    const specName = path.basename(specResult.file);
    lines.push(`| ${specName} | ${tests.length} | ${passed.length} | ${failed.length} |`);
  });

  if (failedTests.length > 0) {
    lines.push('');
    lines.push('### Failed tests');
    failedTests.forEach(function (title) {
      lines.push(`- ${title}`);
    });
  }

  lines.push('');
  lines.push('_Full HTML report: see the `test-report` artifact of this run._');

  return lines.join('\n');
}

if (!fs.existsSync(reportPath)) {
  console.error(`No report found at ${reportPath}`);
  process.exit(0);
}

const summary = buildSummary(JSON.parse(fs.readFileSync(reportPath, 'utf8')));

if (summaryPath) {
  fs.appendFileSync(summaryPath, summary + '\n');
} else {
  console.log(summary);
}
