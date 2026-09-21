import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ROLES, assertApiCapability } from '@/lib/rbac';
import { validateRiskInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/risks/[id]
 * Fetch full details of an operational risk, including mitigations and historical assessments.
 * Protected by VIEW_RISK_REGISTER capability.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.VIEW_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const risk = await prisma.operationalRisk.findUnique({
      where: { id: params.id },
      include: {
        incident: {
          select: {
            id: true,
            incidentNumber: true,
            category: true,
            status: true,
            governorate: true,
            district: true,
            incidentDate: true,
            redactedVersions: {
              where: { isCurrent: true },
              select: {
                redactedTitleAr: true,
                redactedTitleEn: true,
                safeAreaScopeAr: true,
              },
            },
          },
        },
        mitigations: {
          orderBy: { createdAt: 'desc' },
        },
        assessments: {
          orderBy: { assessedAt: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!risk) {
      return NextResponse.json({ error: 'قيد الخطر غير موجود في المنظومة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, risk });
  } catch (error: any) {
    console.error('Error fetching risk details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/risks/[id]
 * Update operational parameters of a risk.
 * Protected by MANAGE_RISK_REGISTER capability.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const existingRisk = await prisma.operationalRisk.findUnique({
      where: { id: params.id },
    });

    if (!existingRisk) {
      return NextResponse.json({ error: 'قيد الخطر غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Partial update validation
    const updateData: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 5) {
        return NextResponse.json({ error: 'العنوان يجب أن يحتوي على 5 أحرف على الأقل' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length < 10) {
        return NextResponse.json({ error: 'الوصف المنقح يجب أن يحتوي على 10 أحرف على الأقل' }, { status: 400 });
      }
      updateData.description = body.description.trim();
    }

    if (body.category !== undefined) {
      updateData.category = body.category;
    }

    if (body.governorate !== undefined) {
      updateData.governorate = body.governorate.trim();
    }

    if (body.district !== undefined) {
      updateData.district = body.district ? String(body.district).trim() : null;
    }

    if (body.generalLocation !== undefined) {
      updateData.generalLocation = body.generalLocation ? String(body.generalLocation).trim() : null;
    }

    if (body.targetResolutionDate !== undefined) {
      updateData.targetResolutionDate = body.targetResolutionDate ? new Date(body.targetResolutionDate) : null;
    }

    const updatedRisk = await prisma.operationalRisk.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPDATE_OPERATIONAL_RISK',
      entityType: 'OperationalRisk',
      entityId: updatedRisk.id,
      details: JSON.stringify({
        riskNumber: updatedRisk.riskNumber,
        updatedFields: Object.keys(updateData),
      }),
    });

    return NextResponse.json({ success: true, risk: updatedRisk });
  } catch (error: any) {
    console.error('Error updating risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/risks/[id]
 * Delete operational risk. Restricted to SUPER_ADMIN.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'حذف قيود المخاطر محصور بمسؤولي الإدارة العليا حصراً' }, { status: 403 });
    }

    const risk = await prisma.operationalRisk.findUnique({
      where: { id: params.id },
      select: { id: true, riskNumber: true },
    });

    if (!risk) {
      return NextResponse.json({ error: 'قيد الخطر غير موجود' }, { status: 404 });
    }

    await prisma.operationalRisk.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'DELETE_OPERATIONAL_RISK',
      entityType: 'OperationalRisk',
      entityId: params.id,
      details: JSON.stringify({ riskNumber: risk.riskNumber }),
    });

    return NextResponse.json({ success: true, message: 'تم حذف قيد الخطر بنجاح' });
  } catch (error: any) {
    console.error('Error deleting risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
