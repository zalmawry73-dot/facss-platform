const fs = require('fs');

const content = fs.readFileSync('d:/FACSSS/FACSS_PHASE_7_TEST_CASES.csv', 'utf8');
const lines = content.split('\n').filter(l => l.trim().length > 0);
const header = lines[0];
const data = lines.slice(1);

console.log('Header:', header);
console.log('Total test cases in CSV:', data.length);

const fails = data.filter(l => l.includes(',"FAIL"'));
const passes = data.filter(l => l.includes(',"PASS"'));

console.log('Passes:', passes.length);
console.log('Fails:', fails.length);

console.log('\n--- Details of Fails ---');
fails.forEach((f, idx) => console.log(`${idx + 1}: ${f}`));
