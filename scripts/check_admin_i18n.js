/**
 * FACSS Platform — Admin i18n Translation Integrity Checker
 * Validates that all static tx('...') keys in production admin code exist in ADMIN_EN dictionary.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT_DIR, 'lib', 'admin-i18n', 'dictionary.ts');

// 1. Parse dictionary
const dictContent = fs.readFileSync(DICT_PATH, 'utf-8');
const entryPattern = /^\s*["'](.*?)["']\s*:\s*["'](.*?)["'],?\s*$/gm;

const adminEn = {};
const duplicates = [];
const seenKeys = new Set();

let match;
while ((match = entryPattern.exec(dictContent)) !== null) {
  const k = match[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  const v = match[2].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  if (seenKeys.has(k)) {
    duplicates.push(k);
  }
  seenKeys.add(k);
  adminEn[k] = v;
}

function isKeyTranslated(key) {
  if (adminEn[key] !== undefined) return true;
  const trimmed = key.replace(/\s*[*:]\s*$/, '').trim();
  if (adminEn[trimmed] !== undefined) return true;
  if (adminEn[`${trimmed} *`] !== undefined) return true;
  return false;
}

// 2. Scan active codebase (app, components, lib, contexts)
const TARGET_DIRS = ['app', 'components', 'lib', 'contexts'];
const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', '.qa_app', '.qa_app_ts', 'FACSS_I18N_AUDIT']);

const txStaticPattern = /\btx\(\s*(["'`])((?:(?!\1|\\).|\\.)*)\1/g;
const missingByFile = {};
const allKeys = new Set();
const missingKeys = new Set();

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (EXCLUDE_DIRS.has(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip dictionary and index itself
      if (fullPath.includes(path.join('lib', 'admin-i18n'))) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.includes('tx(') && !content.includes('useAdminT')) continue;

      const relPath = path.relative(ROOT_DIR, fullPath);
      let m;
      txStaticPattern.lastIndex = 0;
      while ((m = txStaticPattern.exec(content)) !== null) {
        let k = m[2];
        k = k.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\`/g, '`').replace(/\\\\/g, '\\');
        allKeys.add(k);
        if (!isKeyTranslated(k)) {
          missingKeys.add(k);
          if (!missingByFile[relPath]) missingByFile[relPath] = [];
          missingByFile[relPath].push(k);
        }
      }
    }
  }
}

for (const sub of TARGET_DIRS) {
  walk(path.join(ROOT_DIR, sub));
}

console.log('====================================================');
console.log(' FACSS Admin i18n Translation Integrity Verification');
console.log('====================================================');
console.log(`- Total Keys in ADMIN_EN:           ${Object.keys(adminEn).length}`);
console.log(`- Duplicate Keys in ADMIN_EN:       ${duplicates.length}`);
console.log(`- Total Unique Static tx() Keys:    ${allKeys.size}`);
console.log(`- Total Missing Keys Detected:      ${missingKeys.size}`);
console.log('----------------------------------------------------');

if (duplicates.length > 0) {
  console.warn('WARNING: Duplicate keys found in dictionary:');
  duplicates.forEach((d) => console.warn(`  ! "${d}"`));
}

if (missingKeys.size > 0) {
  console.error('ERROR: Found missing translation keys:');
  for (const [file, keys] of Object.entries(missingByFile)) {
    console.error(`\nIn file: ${file} (${keys.length} missing)`);
    keys.forEach((k) => console.error(`  - "${k}"`));
  }
  process.exit(1);
} else {
  console.log('SUCCESS: All static tx() keys are 100% covered in ADMIN_EN!');
  console.log('Zero missing keys. Phase 2 dictionary integrity verified.');
  process.exit(0);
}
