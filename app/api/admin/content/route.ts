import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertApiCapability, CAPABILITIES } from '@/lib/rbac';
import { getCurrentUser } from '@/lib/auth';

// Helper to get session from request cookies
async function getSessionFromRequest(req: NextRequest) {
  return await getCurrentUser(true);
}

// ─────────────────────────────────────────────────────────
// GET /api/admin/content?section=principles
// Returns all ContentBlock records, optionally filtered by section
// ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const authCheck = await assertApiCapability(session, CAPABILITIES.MANAGE_CONTENT);
  if (!authCheck.authorized) return authCheck.response!;

  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');

  try {
    let blocks: any[];
    if ((prisma as any).contentBlock) {
      blocks = await (prisma as any).contentBlock.findMany({
        where: section ? { section } : {},
        orderBy: [{ section: 'asc' }, { order: 'asc' }],
      });
    } else {
      if (section) {
        blocks = await prisma.$queryRaw<any[]>`
          SELECT * FROM "ContentBlock"
          WHERE "section" = ${section}
          ORDER BY "section" ASC, "order" ASC
        `;
      } else {
        blocks = await prisma.$queryRaw<any[]>`
          SELECT * FROM "ContentBlock"
          ORDER BY "section" ASC, "order" ASC
        `;
      }
    }
    return NextResponse.json({ blocks });
  } catch (err: any) {
    console.error('GET contentBlock error:', err);
    return NextResponse.json({ error: 'فشل تحميل المحتوى', details: err?.message || String(err) }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/admin/content — Create new ContentBlock
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const authCheck = await assertApiCapability(session, CAPABILITIES.MANAGE_CONTENT);
  if (!authCheck.authorized) return authCheck.response!;

  try {
    const body = await req.json();
    const { section, key, titleAr, titleEn, descriptionAr, descriptionEn, icon, link, order, isVisible } = body;

    if (!section || typeof section !== 'string' || section.length > 60) {
      return NextResponse.json({ error: 'section مطلوب وأقل من 60 حرف' }, { status: 400 });
    }
    if (!key || typeof key !== 'string' || key.length > 80) {
      return NextResponse.json({ error: 'key مطلوب وأقل من 80 حرف' }, { status: 400 });
    }

    // Check duplicate
    let existing: any = null;
    if ((prisma as any).contentBlock) {
      existing = await (prisma as any).contentBlock.findUnique({
        where: { section_key: { section, key } },
      });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id" FROM "ContentBlock" WHERE "section" = ${section} AND "key" = ${key} LIMIT 1
      `;
      existing = rows[0] || null;
    }

    if (existing) {
      return NextResponse.json({ error: 'هذا المفتاح موجود بالفعل في هذا القسم' }, { status: 409 });
    }

    const orderVal = typeof order === 'number' ? order : 0;
    const isVisVal = typeof isVisible === 'boolean' ? isVisible : true;
    const updater = session?.fullName || 'Admin';

    let block: any;
    if ((prisma as any).contentBlock) {
      block = await (prisma as any).contentBlock.create({
        data: {
          section,
          key,
          titleAr: titleAr?.trim() || null,
          titleEn: titleEn?.trim() || null,
          descriptionAr: descriptionAr?.trim() || null,
          descriptionEn: descriptionEn?.trim() || null,
          icon: icon?.trim() || null,
          link: link?.trim() || null,
          order: orderVal,
          isVisible: isVisVal,
          updatedByName: updater,
        },
      });
    } else {
      const newId = 'cb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const rows = await prisma.$queryRaw<any[]>`
        INSERT INTO "ContentBlock" (
          "id", "section", "key", "titleAr", "titleEn", "descriptionAr", "descriptionEn",
          "icon", "link", "order", "isVisible", "updatedByName", "createdAt", "updatedAt"
        ) VALUES (
          ${newId}, ${section}, ${key}, ${titleAr?.trim() || null}, ${titleEn?.trim() || null},
          ${descriptionAr?.trim() || null}, ${descriptionEn?.trim() || null},
          ${icon?.trim() || null}, ${link?.trim() || null}, ${orderVal}, ${isVisVal},
          ${updater}, NOW(), NOW()
        ) RETURNING *
      `;
      block = rows[0];
    }

    return NextResponse.json({ block }, { status: 201 });
  } catch (err: any) {
    console.error('[content POST]', err);
    return NextResponse.json({ error: 'فشل إنشاء العنصر', details: err?.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/content — Update existing ContentBlock
// Body: { id, ...fields }
// ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const authCheck = await assertApiCapability(session, CAPABILITIES.MANAGE_CONTENT);
  if (!authCheck.authorized) return authCheck.response!;

  try {
    const body = await req.json();
    const { id, titleAr, titleEn, descriptionAr, descriptionEn, icon, link, order, isVisible } = body;

    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });
    }

    let existing: any = null;
    if ((prisma as any).contentBlock) {
      existing = await (prisma as any).contentBlock.findUnique({ where: { id } });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ContentBlock" WHERE "id" = ${id} LIMIT 1
      `;
      existing = rows[0] || null;
    }

    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    }

    const updater = session?.fullName || 'Admin';
    let block: any;

    if ((prisma as any).contentBlock) {
      const updateData: Record<string, any> = {
        updatedByName: updater,
      };

      if (titleAr !== undefined) updateData.titleAr = titleAr?.trim() || null;
      if (titleEn !== undefined) updateData.titleEn = titleEn?.trim() || null;
      if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr?.trim() || null;
      if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn?.trim() || null;
      if (icon !== undefined) updateData.icon = icon?.trim() || null;
      if (link !== undefined) updateData.link = link?.trim() || null;
      if (typeof order === 'number') updateData.order = order;
      if (typeof isVisible === 'boolean') updateData.isVisible = isVisible;

      block = await (prisma as any).contentBlock.update({ where: { id }, data: updateData });
    } else {
      const nextTitleAr = titleAr !== undefined ? (titleAr?.trim() || null) : existing.titleAr;
      const nextTitleEn = titleEn !== undefined ? (titleEn?.trim() || null) : existing.titleEn;
      const nextDescAr = descriptionAr !== undefined ? (descriptionAr?.trim() || null) : existing.descriptionAr;
      const nextDescEn = descriptionEn !== undefined ? (descriptionEn?.trim() || null) : existing.descriptionEn;
      const nextIcon = icon !== undefined ? (icon?.trim() || null) : existing.icon;
      const nextLink = link !== undefined ? (link?.trim() || null) : existing.link;
      const nextOrder = typeof order === 'number' ? order : existing.order;
      const nextIsVisible = typeof isVisible === 'boolean' ? isVisible : existing.isVisible;

      const rows = await prisma.$queryRaw<any[]>`
        UPDATE "ContentBlock" SET
          "titleAr" = ${nextTitleAr},
          "titleEn" = ${nextTitleEn},
          "descriptionAr" = ${nextDescAr},
          "descriptionEn" = ${nextDescEn},
          "icon" = ${nextIcon},
          "link" = ${nextLink},
          "order" = ${nextOrder},
          "isVisible" = ${nextIsVisible},
          "updatedByName" = ${updater},
          "updatedAt" = NOW()
        WHERE "id" = ${id}
        RETURNING *
      `;
      block = rows[0];
    }

    return NextResponse.json({ block });
  } catch (err: any) {
    console.error('[content PATCH]', err);
    return NextResponse.json({ error: 'فشل تحديث العنصر', details: err?.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/content?id=xxx
// ─────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const authCheck = await assertApiCapability(session, CAPABILITIES.MANAGE_CONTENT);
  if (!authCheck.authorized) return authCheck.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });
  }

  try {
    let existing: any = null;
    if ((prisma as any).contentBlock) {
      existing = await (prisma as any).contentBlock.findUnique({ where: { id } });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ContentBlock" WHERE "id" = ${id} LIMIT 1
      `;
      existing = rows[0] || null;
    }

    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    }

    // Protect core identity items from deletion
    const PROTECTED_KEYS = ['vision', 'mission', 'about_paragraph_1', 'about_paragraph_2', 'why_us'];
    if (existing.section === 'identity' && PROTECTED_KEYS.includes(existing.key)) {
      return NextResponse.json({ error: 'لا يمكن حذف عناصر الهوية الأساسية. يمكنك إخفاؤها فقط.' }, { status: 403 });
    }

    if ((prisma as any).contentBlock) {
      await (prisma as any).contentBlock.delete({ where: { id } });
    } else {
      await prisma.$executeRaw`DELETE FROM "ContentBlock" WHERE "id" = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[content DELETE]', err);
    return NextResponse.json({ error: 'فشل حذف العنصر', details: err?.message }, { status: 500 });
  }
}
