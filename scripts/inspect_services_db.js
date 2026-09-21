// Script: inspect_services_db.js
// Purpose: Read-only inspection of current service categories and services in local DB
// No data modifications. Run: node scripts/inspect_services_db.js

'use strict';
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  // Safety check: ensure we're targeting local DB only
  const url = process.env.DATABASE_URL || '';
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  if (!isLocal) {
    console.error('ERROR: DATABASE_URL does not target localhost. Aborting.');
    process.exit(1);
  }
  console.log('OK: Targeting local database\n');

  // Count records
  const cats = await db.serviceCategory.count();
  const svcs = await db.service.count();
  const reqs = await db.serviceRequest.count();
  const docs = await db.serviceRequestDocument.count();
  const notes = await db.serviceRequestNote.count();
  console.log('--- Record Counts ---');
  console.log(`ServiceCategory: ${cats}`);
  console.log(`Service: ${svcs} (active: ${await db.service.count({ where: { isActive: true } })}, inactive: ${await db.service.count({ where: { isActive: false } })})`);
  console.log(`ServiceRequest: ${reqs}`);
  console.log(`ServiceRequestDocument: ${docs}`);
  console.log(`ServiceRequestNote: ${notes}`);
  console.log('');

  // Fetch categories
  const categories = await db.serviceCategory.findMany({
    select: { id: true, titleAr: true, titleEn: true, slug: true, order: true },
    orderBy: { order: 'asc' },
  });
  console.log('--- Service Categories ---');
  categories.forEach(c => console.log(`  [${c.id}] "${c.titleAr}" | "${c.titleEn}" | slug: ${c.slug} | order: ${c.order}`));
  console.log('');

  // Fetch services with category linkage
  const services = await db.service.findMany({
    select: { id: true, categoryId: true, titleAr: true, titleEn: true, slug: true, isActive: true, order: true },
    orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
  });
  console.log('--- Services ---');
  services.forEach(s => console.log(`  [${s.id}] catId:${s.categoryId} | active:${s.isActive} | "${s.titleAr}" | "${s.titleEn}" | slug:${s.slug}`));
  console.log('');

  // Check if any service requests reference any current services
  if (reqs > 0) {
    const reqSummary = await db.serviceRequest.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
    });
    console.log('--- Service Requests grouped by serviceId ---');
    reqSummary.forEach(r => console.log(`  serviceId: ${r.serviceId} => count: ${r._count.serviceId}`));
    console.log('');
  } else {
    console.log('--- No service requests in database ---\n');
  }
}

main()
  .catch(err => { console.error('FATAL:', err.message); process.exit(1); })
  .finally(() => db.$disconnect());
