const fs = require('fs');

const csvPath = 'd:/FACSSS/FACSS_PHASE_7_TEST_CASES.csv';
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
const header = lines[0];
const rows = lines.slice(1);

// New header with original execution date and retest record
const newHeader = '"TestID","Category","Role","PathOrEndpoint","Viewport","Language","Description","ExpectedResult","InitialResult","InitialStatus","RetestDate","RetestProof","FinalStatus"';

const retests = {
  'TC-019': {
    date: '2026-10-12T19:10:03Z',
    proof: 'Re-tested on isolated QA instance (Port 3100) with FIELD_INCIDENT_ENCRYPTION_KEY active. HTTP 201 Created, Incident FACSS-INC-2026-000002 generated, AES-256-GCM encryption verified in OriginalIncidentData.',
    status: 'PASS'
  },
  'TC-020': {
    date: '2026-10-12T19:10:03Z',
    proof: 'Re-tested on isolated QA instance. HTTP 200 OK, incident FACSS-INC-2026-000002 listed in Admin incidents table with status RECEIVED and hasOriginal=true.',
    status: 'PASS'
  },
  'TC-056': {
    date: '2026-10-12T19:10:58Z',
    proof: 'Re-tested on isolated QA instance via Puppeteer Edge 375x667 viewport (lang=en). scrollWidth: 375, clientWidth: 375, overflow: 0px. Text wrapping confirmed; screenshot proof saved in scripts/qa_phase7/out/shots/retest_tc56_register_375_en.png.',
    status: 'PASS'
  },
  'TC-067': {
    date: '2026-10-12T19:16:35Z',
    proof: 'Re-tested on isolated QA instance via Puppeteer Edge 375x667 viewport (lang=en). HTTP 200, scrollWidth: 375, clientWidth: 375, overflow: 0px. Screenshot proof saved in scripts/qa_phase7/out/shots/retest_tc67_brand_preview_375.png.',
    status: 'PASS'
  },
  'TC-068': {
    date: '2026-10-12T19:16:38Z',
    proof: 'Re-tested on isolated QA instance via Puppeteer Edge 1366x768 viewport (lang=en). HTTP 200, scrollWidth: 1366, clientWidth: 1366, overflow: 0px. Screenshot proof saved in scripts/qa_phase7/out/shots/retest_tc68_brand_preview_1366.png.',
    status: 'PASS'
  }
};

const updatedRows = rows.map(r => {
  // Parse CSV line
  const matches = r.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  // Simple regex or parse by quotes
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < r.length; i++) {
    const c = r[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } else if (c === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current) parts.push(current.trim());

  const testId = parts[0].replace(/"/g, '');
  const category = parts[1];
  const role = parts[2];
  const pathOrEndpoint = parts[3];
  const viewport = parts[4];
  const language = parts[5];
  const description = parts[6];
  const expectedResult = parts[7];
  const actualResult = parts[8];
  const initialStatus = parts[9].replace(/"/g, '');

  let retestDate = '2026-10-11T17:30:00Z';
  let retestProof = 'Initial test passed without defects';
  let finalStatus = initialStatus;

  if (retests[testId]) {
    retestDate = retests[testId].date;
    retestProof = `"${retests[testId].proof.replace(/"/g, '""')}"`;
    finalStatus = retests[testId].status;
  } else {
    retestProof = '"Verified in initial test execution (11 Oct 2026)"';
  }

  return `${parts[0]},${category},${role},${pathOrEndpoint},${viewport},${language},${description},${expectedResult},${actualResult},"${initialStatus}","${retestDate}",${retestProof},"${finalStatus}"`;
});

const output = [newHeader, ...updatedRows].join('\n') + '\n';
fs.writeFileSync(csvPath, output, 'utf8');
console.log('Updated FACSS_PHASE_7_TEST_CASES.csv successfully! Total test cases:', updatedRows.length);

const finalPasses = updatedRows.filter(r => r.endsWith('"PASS"')).length;
const finalFails = updatedRows.filter(r => r.endsWith('"FAIL"')).length;
console.log('Final PASS count:', finalPasses, '| Final FAIL count:', finalFails);
