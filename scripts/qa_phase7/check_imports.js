const fs = require('fs');
const path = require('path');

const targetBases = [
  'dispatch-engine',
  'equipment-rules',
  'kpi-engine',
  'rbac',
  'alert-snapshot',
  'crypto',
  'sla-engine',
  'incident-attachments',
  'training-rules',
  'validations/admin',
  'validations/alerts',
  'validations/incidents'
];

function searchFiles(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === '.qa_app' || f === '.qa_app_ts') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      results.push(...searchFiles(p));
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.mjs')) {
      results.push(p);
    }
  }
  return results;
}

const allFiles = searchFiles('.');
console.log('Total source files scanned:', allFiles.length);

const explicitJsRequires = [];
const extensionlessImports = [];

for (const file of allFiles) {
  // skip the 12 js files themselves
  if (file.startsWith('lib\\') && file.endsWith('.js')) continue;
  if (file.startsWith('scripts\\qa_phase7\\')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  for (const base of targetBases) {
    const jsPattern = new RegExp(`['"][^'"]*${base}\\.js['"]`, 'g');
    if (jsPattern.test(content)) {
      explicitJsRequires.push({ file, base });
    }
    const noExtPattern = new RegExp(`['"][^'"]*${base}['"]`, 'g');
    if (noExtPattern.test(content)) {
      extensionlessImports.push({ file, base });
    }
  }
}

console.log('Explicit .js requires:', explicitJsRequires);
console.log('Total extensionless imports referring to these modules:', extensionlessImports.length);
