const fs = require('fs');
const { execSync } = require('child_process');

const files = [
  'lib/alerts/dispatch-engine.js',
  'lib/equipment-rules.js',
  'lib/kpi-engine.js',
  'lib/rbac.js',
  'lib/security/alert-snapshot.js',
  'lib/security/crypto.js',
  'lib/sla-engine.js',
  'lib/storage/incident-attachments.js',
  'lib/training-rules.js',
  'lib/validations/admin.js',
  'lib/validations/alerts.js',
  'lib/validations/incidents.js'
];

console.log('Total files to evaluate:', files.length);

for (const f of files) {
  const ts = f.replace(/\.js$/, '.ts');
  const jsStat = fs.statSync(f);
  const tsStat = fs.statSync(ts);
  
  let gitJs = 'N/A';
  let gitTs = 'N/A';
  try {
    gitJs = execSync(`git log -n 1 --format="%ci (%h)" -- "${f}"`, { encoding: 'utf8' }).trim();
    gitTs = execSync(`git log -n 1 --format="%ci (%h)" -- "${ts}"`, { encoding: 'utf8' }).trim();
  } catch(e) {}
  
  // Read first few lines of JS and TS
  const jsHead = fs.readFileSync(f, 'utf8').slice(0, 150).replace(/\r?\n/g, ' ');
  const tsHead = fs.readFileSync(ts, 'utf8').slice(0, 150).replace(/\r?\n/g, ' ');

  console.log(`\n========================================`);
  console.log(`JS: ${f}`);
  console.log(`TS: ${ts}`);
  console.log(`JS commit: ${gitJs} | Size: ${jsStat.size} bytes`);
  console.log(`TS commit: ${gitTs} | Size: ${tsStat.size} bytes`);
  console.log(`JS snippet: ${jsHead}`);
  console.log(`TS snippet: ${tsHead}`);
}
