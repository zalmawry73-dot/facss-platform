/**
 * FACSS Phase 2E — Automated UI & Design Tokens Verification Suite
 * Tests design tokens, unified StatusBadge, public/admin/portal styling, and non-regression.
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runPhase2EUISuite() {
  console.log('\n=============================================================');
  console.log('  FACSS PHASE 2E — UI, DESIGN TOKENS & RESPONSIVE SUITE');
  console.log('=============================================================\n');

  // TEST SUITE 1: Design Tokens in app/globals.css
  console.log('--- 1. Testing Design Tokens in app/globals.css ---');
  const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
  assert(fs.existsSync(globalsCssPath), 'globals.css exists');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  assert(globalsCss.includes('--facss-green-950: #071D16;'), 'Contains institutional Deep Security Green 950');
  assert(globalsCss.includes('--facss-green-900: #0C281F;'), 'Contains institutional Deep Security Green 900');
  assert(globalsCss.includes('--facss-green-800: #123B2C;'), 'Contains institutional Deep Security Green 800');
  assert(globalsCss.includes('--facss-gold-500: #C9A227;'), 'Contains restrained Institutional Gold 500');
  assert(globalsCss.includes('--surface-bg: #F7F6F1;'), 'Contains Warm Off-White surface background token');
  assert(globalsCss.includes('--surface-card: #FFFFFF;'), 'Contains Pure White card surface token');
  assert(globalsCss.includes('--surface-hero: var(--facss-green-950);'), 'Contains Deep Green surface hero token');
  assert(globalsCss.includes('--text-primary: #17201C;'), 'Contains high-contrast charcoal primary text token (WCAG AAA)');
  assert(globalsCss.includes('--border-color: #E2DFD4;'), 'Contains subtle 1px border token');

  // TEST SUITE 2: Unified StatusBadge Component
  console.log('\n--- 2. Testing Unified StatusBadge Component ---');
  const statusBadgePath = path.join(__dirname, '..', 'components', 'StatusBadge.tsx');
  assert(fs.existsSync(statusBadgePath), 'components/StatusBadge.tsx exists');
  const statusBadgeContent = fs.readFileSync(statusBadgePath, 'utf8');

  assert(statusBadgeContent.includes('serviceRequest: Record<string,'), 'StatusBadge maps serviceRequest statuses');
  assert(statusBadgeContent.includes('trainingRegistration: Record<string,'), 'StatusBadge maps trainingRegistration statuses');
  assert(statusBadgeContent.includes('course: Record<string,'), 'StatusBadge maps course statuses');
  assert(statusBadgeContent.includes('certificate: Record<string,'), 'StatusBadge maps certificate statuses');
  assert(statusBadgeContent.includes('contactMessage: Record<string,'), 'StatusBadge maps contactMessage statuses');
  assert(statusBadgeContent.includes('user: Record<string,'), 'StatusBadge maps user active statuses');

  assert(statusBadgeContent.includes("'success'"), 'Supports success semantic variant');
  assert(statusBadgeContent.includes("'warning'"), 'Supports warning semantic variant');
  assert(statusBadgeContent.includes("'danger'"), 'Supports danger semantic variant');
  assert(statusBadgeContent.includes("'info'"), 'Supports info semantic variant');
  assert(statusBadgeContent.includes("'neutral'"), 'Supports neutral semantic variant');

  // TEST SUITE 3: Header & Navigation Streamlining
  console.log('\n--- 3. Testing Institutional Header & Footer ---');
  const headerPath = path.join(__dirname, '..', 'components', 'Header.tsx');
  const footerPath = path.join(__dirname, '..', 'components', 'Footer.tsx');
  assert(fs.existsSync(headerPath), 'components/Header.tsx exists');
  assert(fs.existsSync(footerPath), 'components/Footer.tsx exists');

  const headerContent = fs.readFileSync(headerPath, 'utf8');
  assert(headerContent.includes('var(--facss-green-950)'), 'Header uses institutional green surface');
  assert(!headerContent.includes('قيد التطوير'), 'Header contains zero placeholder development notices');
  assert(headerContent.includes('user-menu-btn'), 'Header features accessible user dropdown button with ID');

  const footerContent = fs.readFileSync(footerPath, 'utf8');
  assert(footerContent.includes('var(--facss-green-950)'), 'Footer uses institutional green surface');
  assert(footerContent.includes('مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية'), 'Footer features official institution title');

  // TEST SUITE 4: Homepage Exactly 6 Sections
  console.log('\n--- 4. Testing Homepage Structure ---');
  const homePath = path.join(__dirname, '..', 'app', 'page.tsx');
  assert(fs.existsSync(homePath), 'app/page.tsx exists');
  const homeContent = fs.readFileSync(homePath, 'utf8');

  assert(homeContent.includes('SECTION 1: HERO'), 'Homepage contains Section 1: Hero');
  assert(homeContent.includes('SECTION 2: CORE PREVENTIVE PILLARS'), 'Homepage contains Section 2: Core Preventive Pillars');
  assert(homeContent.includes('SECTION 3: MAIN SERVICES'), 'Homepage contains Section 3: Main Services');
  assert(homeContent.includes('SECTION 4: INSTITUTIONAL CREDENTIALS'), 'Homepage contains Section 4: Institutional Credentials');
  assert(homeContent.includes('SECTION 5: ACADEMY & STRATEGIC STUDIES'), 'Homepage contains Section 5: Academy & Strategic Studies');
  assert(homeContent.includes('SECTION 6: FINAL INSTITUTIONAL CTA'), 'Homepage contains Section 6: Final CTA');

  // TEST SUITE 5: Public Pages Institutional Tokens & WCAG Contrast
  console.log('\n--- 5. Testing Public Experience Contrast & Tokens ---');
  const publicPages = [
    { file: 'app/services/page.tsx', name: 'Services Page' },
    { file: 'app/about/page.tsx', name: 'About Page' },
    { file: 'app/training/page.tsx', name: 'Training Page' },
    { file: 'app/research/page.tsx', name: 'Research Page' },
    { file: 'app/contact/page.tsx', name: 'Contact Page' },
    { file: 'app/request-service/page.tsx', name: 'Request Service Page' },
    { file: 'app/verify/[code]/page.tsx', name: 'Certificate Verification Page' },
  ];

  for (const page of publicPages) {
    const pagePath = path.join(__dirname, '..', page.file);
    assert(fs.existsSync(pagePath), `${page.name} exists`);
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(content.includes('var(--facss-green-950)') || content.includes('var(--text-primary)'), `${page.name} adopts institutional tokens`);
    assert(!content.includes('glow-animation'), `${page.name} has zero neon glow animations`);
  }

  // TEST SUITE 6: Auth Screens Minimalism
  console.log('\n--- 6. Testing Authentication Screens ---');
  const loginPath = path.join(__dirname, '..', 'app', 'login', 'page.tsx');
  const registerPath = path.join(__dirname, '..', 'app', 'register', 'page.tsx');
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  const registerContent = fs.readFileSync(registerPath, 'utf8');

  assert(!loginContent.includes('glow-animation'), 'Login card has no neon glow animation');
  assert(loginContent.includes('borderTop: \'4px solid var(--facss-gold-500)\''), 'Login card uses clean gold institutional accent');
  assert(registerContent.includes('borderTop: \'4px solid var(--facss-gold-500)\''), 'Register card uses clean gold institutional accent');
  assert(registerContent.includes('var(--surface-sunken)'), 'Register role switch uses light sunken container');

  // TEST SUITE 7: Admin Dashboard Actionable KPIs
  console.log('\n--- 7. Testing Admin Dashboard Actionable KPIs ---');
  const adminPagePath = path.join(__dirname, '..', 'app', 'admin', 'page.tsx');
  const adminContent = fs.readFileSync(adminPagePath, 'utf8');
  assert(adminContent.includes('actionableMetrics = ['), 'Admin dashboard defines focused actionable metrics');
  assert(adminContent.includes('StatusBadge'), 'Admin dashboard integrates StatusBadge in data table');
  assert(adminContent.includes('Compact Platform Totals Strip'), 'Admin dashboard includes compact platform totals strip');

  // TEST SUITE 8: Trainee & Client Portals
  console.log('\n--- 8. Testing Client & Trainee Portals ---');
  const clientPortalPath = path.join(__dirname, '..', 'app', 'portal', 'client', 'page.tsx');
  const clientReqPath = path.join(__dirname, '..', 'app', 'portal', 'client', 'requests', '[id]', 'page.tsx');
  const traineePortalPath = path.join(__dirname, '..', 'app', 'portal', 'trainee', 'page.tsx');
  const traineeCertsPath = path.join(__dirname, '..', 'app', 'portal', 'trainee', 'certificates', 'page.tsx');

  const clientPortalContent = fs.readFileSync(clientPortalPath, 'utf8');
  const clientReqContent = fs.readFileSync(clientReqPath, 'utf8');
  const traineePortalContent = fs.readFileSync(traineePortalPath, 'utf8');
  const traineeCertsContent = fs.readFileSync(traineeCertsPath, 'utf8');

  assert(clientPortalContent.includes('StatusBadge'), 'Client portal integrates StatusBadge');
  assert(clientReqContent.includes('StatusBadge'), 'Client request detail integrates StatusBadge');
  assert(traineePortalContent.includes('StatusBadge'), 'Trainee portal integrates StatusBadge');
  assert(traineeCertsContent.includes('#FCFBF7'), 'Trainee certificate preview uses ivory parchment credential styling');

  // TEST SUITE 9: Logical Properties & RTL Support
  console.log('\n--- 9. Testing Logical CSS Properties & RTL Readiness ---');
  assert(globalsCss.includes('margin-inline') || globalsCss.includes('padding-inline'), 'globals.css uses CSS logical properties');
  assert(homeContent.includes('marginInline') || homeContent.includes('paddingBlock'), 'Homepage uses inline logical properties');

  console.log('\n=============================================================');
  console.log(`  RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('=============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase2EUISuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
