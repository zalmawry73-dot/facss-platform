/**
 * Central Business Logic for Training Attendance, Completion & Certificate Eligibility
 * Package D Requirement D11: Unifies completion and certificate eligibility rules in server-side logic.
 */

export interface EligibilityResult {
  isEligible: boolean;
  canIssueCertificate: boolean;
  reason?: string;
  attendancePct: number;
  totalSessions: number;
  attendedSessions: number;
  minRequiredAttendancePct: number;
  preEvalCompleted: boolean;
  postEvalCompleted: boolean;
}

export interface RegistrationForEligibility {
  id: string;
  status: string;
  course: {
    id: string;
    titleAr: string;
    hasCertificate: boolean;
    minAttendancePct?: number | null;
    requiresPreEval?: boolean | null;
    requiresPostEval?: boolean | null;
    sessions?: { id: string }[];
  };
  attendanceRecords?: { sessionId?: string | null; status: string }[];
  evaluations?: { type: string; status: string; score?: number | null }[];
  certificate?: { id: string; certificateNumber: string; isRevoked: boolean } | null;
}

/**
 * Centrally calculates attendance rate, completion eligibility, and certificate eligibility.
 */
export function checkCertificateEligibility(reg: RegistrationForEligibility): EligibilityResult {
  const minRequiredAttendancePct = reg.course.minAttendancePct ?? 75;
  const totalSessions = reg.course.sessions?.length || 0;
  
  const presentCount = (reg.attendanceRecords || []).filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;

  let attendancePct = 100;
  if (totalSessions > 0) {
    attendancePct = Math.round((presentCount / totalSessions) * 100);
  } else if ((reg.attendanceRecords || []).length > 0) {
    const totalRecords = reg.attendanceRecords!.length;
    attendancePct = Math.round((presentCount / totalRecords) * 100);
  }

  const preEvalCompleted = !reg.course.requiresPreEval || Boolean(
    reg.evaluations?.some((e) => e.type === 'PRE' && e.status === 'COMPLETED')
  );

  const postEvalCompleted = !reg.course.requiresPostEval || Boolean(
    reg.evaluations?.some((e) => e.type === 'POST' && e.status === 'COMPLETED')
  );

  // Failure reasons
  if (!reg.course.hasCertificate) {
    return {
      isEligible: false,
      canIssueCertificate: false,
      reason: 'هذه الدورة التدريبية لا تمنح شهادات تخرج',
      attendancePct,
      totalSessions,
      attendedSessions: presentCount,
      minRequiredAttendancePct,
      preEvalCompleted,
      postEvalCompleted,
    };
  }

  if (reg.certificate && !reg.certificate.isRevoked) {
    return {
      isEligible: true,
      canIssueCertificate: false,
      reason: `تم إصدار الشهادة مسبقاً برقم ${reg.certificate.certificateNumber}`,
      attendancePct,
      totalSessions,
      attendedSessions: presentCount,
      minRequiredAttendancePct,
      preEvalCompleted,
      postEvalCompleted,
    };
  }

  if (totalSessions > 0 && attendancePct < minRequiredAttendancePct) {
    return {
      isEligible: false,
      canIssueCertificate: false,
      reason: `نسبة الحضور الفعلية (${attendancePct}%) أقل من الحد الأدنى المطلوب (${minRequiredAttendancePct}%). تم حضور ${presentCount} من أصل ${totalSessions} جلسة.`,
      attendancePct,
      totalSessions,
      attendedSessions: presentCount,
      minRequiredAttendancePct,
      preEvalCompleted,
      postEvalCompleted,
    };
  }

  if (!preEvalCompleted) {
    return {
      isEligible: false,
      canIssueCertificate: false,
      reason: 'يجب إكمال التقييم القبلي (PRE-Evaluation) المطلوب للدورة أولاً',
      attendancePct,
      totalSessions,
      attendedSessions: presentCount,
      minRequiredAttendancePct,
      preEvalCompleted,
      postEvalCompleted,
    };
  }

  if (!postEvalCompleted) {
    return {
      isEligible: false,
      canIssueCertificate: false,
      reason: 'يجب إكمال التقييم البعدي (POST-Evaluation) المطلوب للدورة أولاً',
      attendancePct,
      totalSessions,
      attendedSessions: presentCount,
      minRequiredAttendancePct,
      preEvalCompleted,
      postEvalCompleted,
    };
  }

  return {
    isEligible: true,
    canIssueCertificate: true,
    attendancePct,
    totalSessions,
    attendedSessions: presentCount,
    minRequiredAttendancePct,
    preEvalCompleted,
    postEvalCompleted,
  };
}
