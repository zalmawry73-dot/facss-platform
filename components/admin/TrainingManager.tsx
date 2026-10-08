'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  Filter,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Award,
  UserCheck,
  UserX,
  Loader2,
  ShieldAlert,
  Calendar,
  CheckSquare,
  FileText,
  BarChart2,
  RefreshCw,
  GraduationCap,
  BookOpen,
  FileCheck2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminTabs,
  AdminAlert,
  AdminModal,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminCheckbox,
} from '@/components/admin/ui';
import TrainersManager from './training/TrainersManager';
import MaterialsManager from './training/MaterialsManager';
import TnaManager from './training/TnaManager';
import TrainingReportModal from './training/TrainingReportModal';

interface Category {
  id: string;
  titleAr: string;
  titleEn: string;
}

interface CourseItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  trainerName: string;
  startDate?: string | null;
  endDate?: string | null;
  duration: string;
  location: string;
  capacity: number;
  status: string;
  categoryId: string;
  hasCertificate: boolean;
  requiresPreEval?: boolean;
  requiresPostEval?: boolean;
  minAttendancePct?: number;
  courseType?: string;
  deliveryMode?: string;
  clientId?: string | null;
  objectivesAr?: string | null;
  targetAudienceAr?: string | null;
  category: { id: string; titleAr: string };
  registrationsCount?: number;
}

interface RegistrationItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  courseId: string;
  certificate?: {
    id: string;
    certificateNumber: string;
    isRevoked: boolean;
  } | null;
}

interface SessionItem {
  id: string;
  courseId: string;
  sessionNumber: number;
  title: string;
  sessionDate: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  totalRecorded?: number;
  presentCount?: number;
  absentCount?: number;
  excusedCount?: number;
}

interface AttendanceRosterItem {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  registrationStatus: string;
  attendanceId: string | null;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | null;
  notes: string | null;
  sessionDate?: string;
  modifiedById?: string | null;
  modifiedAt?: string | null;
  modifiedReason?: string | null;
}

interface AttendanceSummaryItem {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  registrationStatus: string;
  totalSessions: number;
  recordedSessions: number;
  presentCount: number;
  excusedCount: number;
  absentCount: number;
  attendancePct: number;
  minRequiredPct: number;
  isEligible: boolean;
}

interface EvaluationRosterItem {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  preEvaluation: {
    id: string;
    score: number | null;
    maxScore: number;
    status: string;
    notes?: string | null;
  } | null;
  postEvaluation: {
    id: string;
    score: number | null;
    maxScore: number;
    status: string;
    notes?: string | null;
  } | null;
  deltaScore: number | null;
}

interface Props {
  initialCourses: CourseItem[];
  categories: Category[];
}

const STATUS_LABELS: Record<string, string> = {
  get PENDING() { return tx("قيد المراجعة"); },
  get REVIEWING() { return tx("تحت المراجعة"); },
  get ACCEPTED() { return tx("مقبول"); },
  get REJECTED() { return tx("مرفوض"); },
  get WAITLIST() { return tx("قائمة انتظار"); },
  get COMPLETED() { return tx("أتم التدريب"); },
  get OPEN() { return tx("مفتوح للتسجيل"); },
  get CLOSED() { return tx("مغلق"); },
  get DRAFT() { return tx("مسودة"); },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  REVIEWING: '#3B82F6',
  ACCEPTED: '#22C55E',
  REJECTED: '#EF4444',
  WAITLIST: '#A855F7',
  COMPLETED: '#10B981',
  OPEN: '#22C55E',
  CLOSED: '#64748B',
  DRAFT: '#F59E0B',
};

export default function TrainingManager({ initialCourses, categories }: Props) {
  const { tx, txLocale, isAr } = useAdminT();
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'courses' | 'registrations' | 'sessions' | 'attendance' | 'evaluations' | 'trainers' | 'materials' | 'tna'>('courses');
  const [reportModalCourseId, setReportModalCourseId] = useState<string | null>(null);

  // Registration State
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regCourseFilter, setRegCourseFilter] = useState('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sessions State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [sessionForm, setSessionForm] = useState({
    sessionNumber: 1,
    title: '',
    sessionDate: new Date().toISOString().substring(0, 10),
    startTime: '09:00',
    endTime: '13:00',
    notes: '',
  });

  // Attendance State
  const [attendanceMode, setAttendanceMode] = useState<'roster' | 'summary'>('roster');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [attendanceRoster, setAttendanceRoster] = useState<AttendanceRosterItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryItem[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [rosterDraft, setRosterDraft] = useState<Record<string, { status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; notes: string }>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Attendance Correction Modal
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRosterItem | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<'PRESENT' | 'ABSENT' | 'EXCUSED'>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Evaluation State
  const [evaluations, setEvaluations] = useState<EvaluationRosterItem[]>([]);
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);
  const [evalModalTarget, setEvalModalTarget] = useState<{ registrationId: string; traineeName: string; type: 'PRE' | 'POST'; currentScore?: number | null; maxScore?: number; notes?: string } | null>(null);
  const [evalForm, setEvalForm] = useState({ score: '', maxScore: 100, notes: '' });
  const [savingEval, setSavingEval] = useState(false);

  // Course Form State
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    trainerName: '',
    duration: tx("20 ساعة تدريبية (5 أيام)"),
    location: tx("قاعة المركز المتكامل للتدريب - خور مكسر"),
    capacity: 25,
    status: 'OPEN',
    categoryId: categories[0]?.id || '',
    startDate: '',
    endDate: '',
    hasCertificate: true,
    requiresPreEval: false,
    requiresPostEval: false,
    minAttendancePct: 75,
  });

  // Load Sessions for selected course
  const loadSessions = async (courseId: string) => {
    if (!courseId) return;
    setSessionsLoading(true);
    try {
      const res = await fetch(`/api/admin/training/${courseId}/sessions`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load Attendance
  const loadAttendance = async (courseId: string, sessionId?: string) => {
    if (!courseId) return;
    setAttendanceLoading(true);
    try {
      if (attendanceMode === 'roster' && sessionId) {
        const res = await fetch(`/api/admin/training/${courseId}/attendance?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.success) {
          setAttendanceRoster(data.roster || []);
          // Initialize draft
          const draft: Record<string, { status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; notes: string }> = {};
          (data.roster || []).forEach((item: AttendanceRosterItem) => {
            draft[item.registrationId] = {
              status: item.status || 'PRESENT',
              notes: item.notes || '',
            };
          });
          setRosterDraft(draft);
        }
      } else {
        const res = await fetch(`/api/admin/training/${courseId}/attendance`);
        const data = await res.json();
        if (data.success) {
          setAttendanceSummary(data.summary || []);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load Evaluations
  const loadEvaluations = async (courseId: string) => {
    if (!courseId) return;
    setEvaluationsLoading(true);
    try {
      const res = await fetch(`/api/admin/training/${courseId}/evaluations`);
      const data = await res.json();
      if (data.success) {
        setEvaluations(data.roster || []);
      }
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setEvaluationsLoading(false);
    }
  };

  // Watch course selection changes
  useEffect(() => {
    if (activeTab === 'sessions' && selectedCourseId) {
      loadSessions(selectedCourseId);
    } else if (activeTab === 'attendance' && selectedCourseId) {
      loadSessions(selectedCourseId).then(() => {
        loadAttendance(selectedCourseId, selectedSessionId);
      });
    } else if (activeTab === 'evaluations' && selectedCourseId) {
      loadEvaluations(selectedCourseId);
    }
  }, [activeTab, selectedCourseId]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedCourseId && selectedSessionId && attendanceMode === 'roster') {
      loadAttendance(selectedCourseId, selectedSessionId);
    }
  }, [selectedSessionId, attendanceMode]);

  // ============================
  // COURSE MANAGEMENT
  // ============================
  const openCreateModal = () => {
    setEditingCourse(null);
    setForm({
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
      trainerName: '',
      duration: tx("20 ساعة تدريبية (5 أيام)"),
      location: tx("قاعة المركز المتكامل للتدريب - خور مكسر"),
      capacity: 25,
      status: 'OPEN',
      categoryId: categories[0]?.id || '',
      startDate: '',
      endDate: '',
      hasCertificate: true,
      requiresPreEval: false,
      requiresPostEval: false,
      minAttendancePct: 75,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: CourseItem) => {
    setEditingCourse(c);
    setForm({
      titleAr: c.titleAr,
      titleEn: c.titleEn,
      descriptionAr: c.descriptionAr,
      descriptionEn: c.descriptionEn,
      trainerName: c.trainerName,
      duration: c.duration,
      location: c.location,
      capacity: c.capacity,
      status: c.status,
      categoryId: c.categoryId,
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      hasCertificate: c.hasCertificate,
      requiresPreEval: c.requiresPreEval ?? false,
      requiresPostEval: c.requiresPostEval ?? false,
      minAttendancePct: c.minAttendancePct ?? 75,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const url = editingCourse ? `/api/admin/training/${editingCourse.id}` : '/api/admin/training';
      const method = editingCourse ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشلت العملية"));
      if (editingCourse) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id ? { ...data.course, registrationsCount: c.registrationsCount } : c
          )
        );
        setFeedback({ type: 'success', message: tx("تم تحديث البرنامج [{0}] بنجاح", data.course.titleAr) });
      } else {
        setCourses((prev) => [{ ...data.course, registrationsCount: 0 }, ...prev]);
        setFeedback({ type: 'success', message: tx("تم إنشاء البرنامج [{0}] بنجاح", data.course.titleAr) });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================
  // REGISTRATIONS
  // ============================
  const loadRegistrations = async () => {
    setRegLoading(true);
    try {
      const res = await fetch('/api/admin/training/registrations');
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setRegLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'registrations' && registrations.length === 0) {
      loadRegistrations();
    } else if (tab === 'sessions') {
      loadSessions(selectedCourseId || courses[0]?.id || '');
    } else if (tab === 'attendance') {
      loadSessions(selectedCourseId || courses[0]?.id || '');
    } else if (tab === 'evaluations') {
      loadEvaluations(selectedCourseId || courses[0]?.id || '');
    }
  };

  const handleRegistrationAction = async (regId: string, newStatus: string, adminNotes?: string) => {
    setActionLoading(regId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/training/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشلت العملية"));
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
      );
      setFeedback({ type: 'success', message: data.message || tx("تم تحديث الحالة إلى [{0}]", newStatus) });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueCertificate = async (regId: string, grade?: string) => {
    setActionLoading(regId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/training/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId, grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل إصدار الشهادة"));
      setFeedback({ type: 'success', message: data.message || tx("تم إصدار الشهادة بنجاح") });
      await loadRegistrations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // ============================
  // SESSIONS MANAGEMENT
  // ============================
  const openCreateSessionModal = () => {
    setEditingSession(null);
    const nextNumber = sessions.length > 0 ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1 : 1;
    setSessionForm({
      sessionNumber: nextNumber,
      title: tx("الجلسة رقم {0}", nextNumber),
      sessionDate: new Date().toISOString().substring(0, 10),
      startTime: '09:00',
      endTime: '13:00',
      notes: '',
    });
    setIsSessionModalOpen(true);
  };

  const openEditSessionModal = (s: SessionItem) => {
    setEditingSession(s);
    setSessionForm({
      sessionNumber: s.sessionNumber,
      title: s.title,
      sessionDate: s.sessionDate.substring(0, 10),
      startTime: s.startTime || '',
      endTime: s.endTime || '',
      notes: s.notes || '',
    });
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const url = editingSession
        ? `/api/admin/training/${selectedCourseId}/sessions/${editingSession.id}`
        : `/api/admin/training/${selectedCourseId}/sessions`;
      const method = editingSession ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل حفظ الجلسة"));

      setFeedback({ type: 'success', message: data.message || tx("تم حفظ الجلسة بنجاح") });
      setIsSessionModalOpen(false);
      await loadSessions(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(tx("هل أنت متأكد من حذف هذه الجلسة التدريبية وسجلات حضورها؟"))) return;
    try {
      const res = await fetch(`/api/admin/training/${selectedCourseId}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل حذف الجلسة"));
      setFeedback({ type: 'success', message: tx("تم حذف الجلسة بنجاح") });
      await loadSessions(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // ============================
  // ATTENDANCE MANAGEMENT
  // ============================
  const handleBatchSaveAttendance = async () => {
    if (!selectedSessionId || !selectedCourseId) return;
    setSavingAttendance(true);
    setFeedback(null);
    try {
      const records = Object.entries(rosterDraft).map(([regId, val]) => ({
        registrationId: regId,
        status: val.status,
        notes: val.notes || null,
      }));

      const res = await fetch(`/api/admin/training/${selectedCourseId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          records,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تسجيل الحضور"));
      setFeedback({ type: 'success', message: data.message || tx("تم حفظ كشف الحضور بنجاح") });
      await loadAttendance(selectedCourseId, selectedSessionId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleCorrectAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !correctionTarget.attendanceId) return;
    setCorrecting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/training/${selectedCourseId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: correctionTarget.attendanceId,
          status: correctionStatus,
          modifiedReason: correctionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تصحيح الحضور"));
      setFeedback({ type: 'success', message: tx("تم تصحيح سجل الحضور وتوثيق السبب في مسار التدقيق") });
      setCorrectionTarget(null);
      await loadAttendance(selectedCourseId, selectedSessionId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setCorrecting(false);
    }
  };

  // ============================
  // EVALUATION MANAGEMENT
  // ============================
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalModalTarget) return;
    setSavingEval(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/training/${selectedCourseId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: evalModalTarget.registrationId,
          type: evalModalTarget.type,
          score: evalForm.score !== '' ? Number(evalForm.score) : null,
          maxScore: Number(evalForm.maxScore) || 100,
          notes: evalForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل حفظ نتيجة التقييم"));
      setFeedback({ type: 'success', message: tx("تم حفظ نتيجة التقييم بنجاح") });
      setEvalModalTarget(null);
      await loadEvaluations(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingEval(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      c.trainerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRegistrations = registrations.filter((r) => {
    const matchesCourse = regCourseFilter === 'ALL' || r.courseId === regCourseFilter;
    const matchesStatus = regStatusFilter === 'ALL' || r.status === regStatusFilter;
    return matchesCourse && matchesStatus;
  });

  const currentSelectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div>
      {/* Feedback Alert */}
      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Admin Page Header */}
      <AdminPageHeader
        title={tx("إدارة برامج التدريب والتأهيل الأمني")}
        description={tx("إدارة الدورات، تحديد نسب الحضور، الجلسات التدريبية، كشوفات الحضور، والتقييمات")}
        actions={
          activeTab === 'courses' ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              {tx("إضافة برنامج تدريبي جديد")}
            </AdminButton>
          ) : activeTab === 'sessions' ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={openCreateSessionModal}
            >
              {tx("إضافة جلسة تدريبية")}
            </AdminButton>
          ) : null
        }
      />

      {/* Tab Switcher */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminTabs
          tabs={[
            { id: 'courses', label: tx("إدارة الدورات"), icon: Users, count: courses.length },
            { id: 'trainers', label: tx("سجل المدربين"), icon: GraduationCap },
            { id: 'materials', label: tx("المواد التدريبية"), icon: BookOpen },
            { id: 'tna', label: tx("تقييم الاحتياجات TNA"), icon: FileCheck2 },
            { id: 'registrations', label: tx("طلبات التسجيل"), icon: UserCheck },
            { id: 'sessions', label: tx("الجلسات التدريبية"), icon: Calendar },
            { id: 'attendance', label: tx("كشف الحضور والغياب"), icon: CheckSquare },
            { id: 'evaluations', label: tx("التقييمات القبلية والبعدية"), icon: BarChart2 },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => handleTabChange(tabId as any)}
        />
      </div>

      {/* ============================
          TAB 1: COURSES MANAGEMENT
          ============================ */}
      {activeTab === 'courses' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
                  {tx("تصفية وفرز الدورات التدريبية")}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {tx("البحث باسم الدورة أو المحاضر وفرز الحالات")}
                </span>
              </div>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder={tx("بحث باسم الدورة أو المحاضر...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--color-gold)" />
                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: '160px' }}>
                  <option value="ALL">{tx("جميع الحالات")}</option>
                  <option value="OPEN">{tx("مفتوح (OPEN)")}</option>
                  <option value="DRAFT">{tx("مسودة (DRAFT)")}</option>
                  <option value="FULL">{tx("مكتمل (FULL)")}</option>
                  <option value="ONGOING">{tx("جاري (ONGOING)")}</option>
                  <option value="COMPLETED">{tx("منتهي (COMPLETED)")}</option>
                  <option value="CANCELLED">{tx("ملغي (CANCELLED)")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لم يتم العثور على برامج تدريبية مطابقة.")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{tx("اسم الدورة التدريبية")}</th>
                      <th>{tx("التصنيف")}</th>
                      <th>{tx("المحاضر")}</th>
                      <th>{tx("شروط الأهلية")}</th>
                      <th>{tx("الحالة")}</th>
                      <th>{tx("المقاعد")}</th>
                      <th>{tx("الإجراءات")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id}>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>{course.titleAr}</span>
                            {course.courseType === 'PRIVATE_CLIENT' ? (
                              <span className="badge" style={{ background: '#3B82F620', color: '#3B82F6', fontSize: '0.72rem' }}>
                                دورة خاصة لعميل
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#22C55E20', color: '#22C55E', fontSize: '0.72rem' }}>
                                عامة
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.titleEn}</span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-gold)' }}>
                            {course.category?.titleAr || tx("عام")}
                          </span>
                        </td>
                        <td>{course.trainerName}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--color-gold-light)' }}>
                              {tx("حضور:")} {course.minAttendancePct ?? 75}{tx("% كحد أدنى")}
                            </span>
                            {course.requiresPostEval && (
                              <span style={{ color: '#22c55e' }}>{tx("شرط تقييم بعدي")}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${STATUS_COLORS[course.status] || '#666'}20`,
                              color: STATUS_COLORS[course.status] || '#FFF',
                              border: `1px solid ${STATUS_COLORS[course.status] || '#666'}50`,
                            }}
                          >
                            {STATUS_LABELS[course.status] || course.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                              {course.registrationsCount || 0}
                            </span>{' '}
                            / {course.capacity}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => openEditModal(course)}
                              title={tx("تعديل الدورة")}
                            />
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={<Calendar size={14} />}
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                handleTabChange('sessions');
                              }}
                              title={tx("إدارة الجلسات")}
                            />
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={<FileText size={14} />}
                              onClick={() => setReportModalCourseId(course.id)}
                              title="تقرير اكتمال التدريب"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB 2: REGISTRATIONS MANAGEMENT
          ============================ */}
      {activeTab === 'registrations' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("إدارة طلبات تسجيل المتدربين")}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tx("مراجعة طلبات الالتحاق، القبول والرفض، وإصدار الشهادات للمجتازين المستوفين للشروط")}
                </span>
              </div>
              <AdminButton
                variant="outline"
                size="sm"
                icon={<RefreshCw size={15} style={{ animation: regLoading ? 'spin 1s linear infinite' : 'none' }} />}
                onClick={loadRegistrations}
                disabled={regLoading}
              >
                {tx("تحديث القائمة")}
              </AdminButton>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--color-gold)" />
                <select className="form-control" value={regCourseFilter} onChange={(e) => setRegCourseFilter(e.target.value)} style={{ minWidth: '200px' }}>
                  <option value="ALL">{tx("جميع الدورات التدريبية")}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.titleAr}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select className="form-control" value={regStatusFilter} onChange={(e) => setRegStatusFilter(e.target.value)} style={{ minWidth: '160px' }}>
                  <option value="ALL">{tx("جميع الحالات")}</option>
                  <option value="PENDING">{tx("قيد المراجعة")}</option>
                  <option value="REVIEWING">{tx("تحت المراجعة")}</option>
                  <option value="ACCEPTED">{tx("مقبول")}</option>
                  <option value="WAITLIST">{tx("قائمة انتظار")}</option>
                  <option value="COMPLETED">{tx("أتم التدريب")}</option>
                  <option value="REJECTED">{tx("مرفوض")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {regLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                <p>{tx("جاري تحميل طلبات التسجيل...")}</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لا توجد طلبات تسجيل مطابقة.")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{tx("اسم المتدرب")}</th>
                      <th>{tx("معلومات الاتصال")}</th>
                      <th>{tx("الدورة")}</th>
                      <th>{tx("الحالة")}</th>
                      <th>{tx("الشهادة المعتمدة")}</th>
                      <th>{tx("الإجراءات")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => {
                      const course = courses.find((c) => c.id === reg.courseId);
                      return (
                        <tr key={reg.id}>
                          <td style={{ fontWeight: 700 }}>{reg.fullName}</td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{reg.email}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reg.phone}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{course?.titleAr || '-'}</div>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: `${STATUS_COLORS[reg.status] || '#666'}20`,
                                color: STATUS_COLORS[reg.status] || '#FFF',
                                border: `1px solid ${STATUS_COLORS[reg.status] || '#666'}50`,
                              }}
                            >
                              {STATUS_LABELS[reg.status] || reg.status}
                            </span>
                          </td>
                          <td>
                            {reg.certificate ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold-light)', fontSize: '0.85rem' }}>
                                <Award size={15} />
                                <span>{reg.certificate.certificateNumber}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx("لم تصدر")}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {reg.status === 'PENDING' && (
                                <>
                                  <AdminButton
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleRegistrationAction(reg.id, 'ACCEPTED')}
                                    disabled={actionLoading === reg.id}
                                    loading={actionLoading === reg.id}
                                  >
                                    {tx("قبول")}
                                  </AdminButton>
                                  <AdminButton
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRegistrationAction(reg.id, 'REJECTED')}
                                    disabled={actionLoading === reg.id}
                                  >
                                    {tx("رفض")}
                                  </AdminButton>
                                </>
                              )}
                              {reg.status === 'ACCEPTED' && (
                                <AdminButton
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleRegistrationAction(reg.id, 'COMPLETED')}
                                  disabled={actionLoading === reg.id}
                                  loading={actionLoading === reg.id}
                                >
                                  {tx("إتمام الدورة")}
                                </AdminButton>
                              )}
                              {reg.status === 'COMPLETED' && !reg.certificate && (
                                <AdminButton
                                  variant="primary"
                                  size="sm"
                                  icon={<Award size={13} />}
                                  onClick={() => handleIssueCertificate(reg.id)}
                                  disabled={actionLoading === reg.id}
                                  loading={actionLoading === reg.id}
                                >
                                  {tx("إصدار الشهادة")}
                                </AdminButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB 3: SESSIONS MANAGEMENT
          ============================ */}
      {activeTab === 'sessions' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("إدارة الجلسات التدريبية")}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tx("تحديد جدول الجلسات اليومية، عناوين المحاضرات، ومواعيد الانعقاد لكل دورة")}
                </span>
              </div>
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={openCreateSessionModal}
              >
                {tx("إضافة جلسة تدريبية جديدة")}
              </AdminButton>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tx("اختر الدورة:")}</span>
              <select
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ minWidth: '260px' }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.titleAr}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            {sessionsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                <p>{tx("جاري تحميل الجلسات...")}</p>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لم يتم إنشاء جلسات تدريبية لهذه الدورة بعد.")}</p>
                <div style={{ marginTop: '1rem' }}>
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon={<Plus size={15} />}
                    onClick={openCreateSessionModal}
                  >
                    {tx("إضافة أول جلسة")}
                  </AdminButton>
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{tx("عنوان الجلسة")}</th>
                      <th>{tx("التاريخ والوقت")}</th>
                      <th>{tx("الحضور المسجل")}</th>
                      <th>{tx("الملاحظات")}</th>
                      <th>{tx("الإجراءات")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 800, color: 'var(--color-gold)' }}>{tx("الجلسة")} {s.sessionNumber}</td>
                        <td style={{ fontWeight: 700 }}>{s.title}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{new Date(s.sessionDate).toLocaleDateString(txLocale("ar-YE"))}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {s.startTime || '-'} — {s.endTime || '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: '#22c55e' }}>{tx("حاضر:")} {s.presentCount || 0}</span>
                            <span style={{ color: '#ef4444' }}>{tx("غائب:")} {s.absentCount || 0}</span>
                            <span style={{ color: '#f59e0b' }}>{tx("معذور:")} {s.excusedCount || 0}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.notes || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => openEditSessionModal(s)}
                              title={tx("تعديل الجلسة")}
                            />
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={<CheckSquare size={14} />}
                              onClick={() => {
                                setSelectedSessionId(s.id);
                                handleTabChange('attendance');
                              }}
                              title={tx("تسجيل الحضور")}
                            />
                            <AdminButton
                              variant="danger"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              onClick={() => handleDeleteSession(s.id)}
                              title={tx("حذف الجلسة")}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB 4: ATTENDANCE MANAGEMENT
          ============================ */}
      {activeTab === 'attendance' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("كشف الحضور والغياب والتحقق من الأهلية")}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tx("تسجيل الحضور لكل جلسة، حساب نسبة الحضور الإجمالية، وتصحيح السجلات بمسار تدقيق معتمد")}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <AdminButton
                  variant={attendanceMode === 'roster' ? 'primary' : 'outline'}
                  size="sm"
                  icon={<CheckSquare size={15} />}
                  onClick={() => setAttendanceMode('roster')}
                >
                  {tx("كشف جلسة معينة")}
                </AdminButton>
                <AdminButton
                  variant={attendanceMode === 'summary' ? 'primary' : 'outline'}
                  size="sm"
                  icon={<BarChart2 size={15} />}
                  onClick={() => setAttendanceMode('summary')}
                >
                  {tx("الملخص العام والأهلية")}
                </AdminButton>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx("الدورة:")}</span>
                <select
                  className="form-control"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{ minWidth: '220px' }}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.titleAr}</option>
                  ))}
                </select>
              </div>

              {attendanceMode === 'roster' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx("الجلسة:")}</span>
                  <select
                    className="form-control"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    style={{ minWidth: '220px' }}
                  >
                    {sessions.length === 0 ? (
                      <option value="">{tx("لا توجد جلسات")}</option>
                    ) : (
                      sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {tx("الجلسة")} {s.sessionNumber}: {s.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {attendanceMode === 'roster' ? (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {tx("كشف حضور المتدربين المقبولين للجلسة المحددة")}
                </div>
                {attendanceRoster.length > 0 && (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon={<Check size={15} />}
                    loading={savingAttendance}
                    onClick={handleBatchSaveAttendance}
                    disabled={savingAttendance}
                  >
                    {tx("حفظ كشف الحضور بالكامل")}
                  </AdminButton>
                )}
              </div>

              {attendanceLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                  <p>{tx("جاري تحميل كشف الحضور...")}</p>
                </div>
              ) : attendanceRoster.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>{tx("لا يوجد متدربون مقبولون في هذه الدورة حتى الآن.")}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{tx("اسم المتدرب")}</th>
                        <th>{tx("بيانات الاتصال")}</th>
                        <th>{tx("الحالة المحددة")}</th>
                        <th>{tx("ملاحظات الجلسة")}</th>
                        <th>{tx("سجل التدقيق / التصحيح")}</th>
                        <th>{tx("إجراء التصحيح")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRoster.map((item) => {
                        const currentDraft = rosterDraft[item.registrationId] || { status: 'PRESENT', notes: '' };
                        return (
                          <tr key={item.registrationId}>
                            <td style={{ fontWeight: 700 }}>{item.fullName}</td>
                            <td style={{ fontSize: '0.85rem' }}>{item.email}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {(['PRESENT', 'EXCUSED', 'ABSENT'] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      setRosterDraft({
                                        ...rosterDraft,
                                        [item.registrationId]: { ...currentDraft, status: st },
                                      })
                                    }
                                    style={{
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.75rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      border: '1px solid transparent',
                                      fontWeight: currentDraft.status === st ? 800 : 500,
                                      background:
                                        currentDraft.status === st
                                          ? st === 'PRESENT'
                                            ? '#22c55e'
                                            : st === 'EXCUSED'
                                            ? '#f59e0b'
                                            : '#ef4444'
                                          : 'rgba(255,255,255,0.06)',
                                      color: currentDraft.status === st ? (st === 'PRESENT' ? '#000' : '#FFF') : 'var(--text-muted)',
                                    }}
                                  >
                                    {st === 'PRESENT' ? tx("حاضر") : st === 'EXCUSED' ? tx("معذور") : tx("غائب")}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={tx("ملاحظة اختيارية...")}
                                value={currentDraft.notes}
                                onChange={(e) =>
                                  setRosterDraft({
                                    ...rosterDraft,
                                    [item.registrationId]: { ...currentDraft, notes: e.target.value },
                                  })
                                }
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', minWidth: '140px' }}
                              />
                            </td>
                            <td>
                              {item.modifiedReason ? (
                                <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                  <div>{tx("مصحح:")} {item.modifiedReason}</div>
                                  <div style={{ opacity: 0.7 }}>{item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString(txLocale("ar-YE")) : ''}</div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx("أصلي")}</span>
                              )}
                            </td>
                            <td>
                              {item.attendanceId && (
                                <AdminButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCorrectionTarget(item);
                                    setCorrectionStatus(item.status || 'PRESENT');
                                    setCorrectionReason('');
                                  }}
                                >
                                  {tx("تصحيح بمبرر")}
                                </AdminButton>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', margin: 0 }}>
                  {tx("ملخص نسب الحضور وأهلية إصدار الشهادات للدورة")}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>
                  {tx("الحد الأدنى المطلوب:")} {currentSelectedCourse?.minAttendancePct ?? 75}%
                </span>
              </div>

              {attendanceLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                  <p>{tx("جاري تحميل الملخص...")}</p>
                </div>
              ) : attendanceSummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>{tx("لا توجد بيانات حضور مسجلة لهذه الدورة بعد.")}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{tx("اسم المتدرب")}</th>
                        <th>{tx("الجلسات المسجلة")}</th>
                        <th>{tx("حاضر")}</th>
                        <th>{tx("غائب")}</th>
                        <th>{tx("معذور")}</th>
                        <th>{tx("نسبة الحضور %")}</th>
                        <th>{tx("أهلية الشهادة")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSummary.map((sum) => (
                        <tr key={sum.registrationId}>
                          <td style={{ fontWeight: 700 }}>{sum.fullName}</td>
                          <td>{sum.recordedSessions} {tx("من")} {sum.totalSessions}</td>
                          <td style={{ color: '#22c55e', fontWeight: 700 }}>{sum.presentCount}</td>
                          <td style={{ color: '#ef4444' }}>{sum.absentCount}</td>
                          <td style={{ color: '#f59e0b' }}>{sum.excusedCount}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(sum.attendancePct, 100)}%`,
                                    height: '100%',
                                    background: sum.isEligible ? '#22c55e' : '#ef4444',
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 800, color: sum.isEligible ? '#22c55e' : '#ef4444' }}>
                                {sum.attendancePct}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: sum.isEligible ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: sum.isEligible ? '#22c55e' : '#ef4444',
                                border: `1px solid ${sum.isEligible ? '#22c55e' : '#ef4444'}50`,
                              }}
                            >
                              {sum.isEligible ? tx("مستوفٍ لنسبة الحضور") : tx("غير مؤهل (حضور ضعيف)")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================
          TAB 5: EVALUATIONS MANAGEMENT
          ============================ */}
      {activeTab === 'evaluations' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("التقييمات القبلية والبعدية للمتدربين")}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tx("قياس الأثر التدريبي ومستوى تطور المتدرب بين الاختبار القبلي (Pre-Eval) والبعدي (Post-Eval)")}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx("الدورة:")}</span>
                <select
                  className="form-control"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{ minWidth: '240px' }}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.titleAr}</option>
                  ))}
                </select>
              </div>

              {currentSelectedCourse && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: currentSelectedCourse.requiresPreEval ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: currentSelectedCourse.requiresPreEval ? '#22c55e' : 'var(--text-muted)' }}>
                    {tx("تقييم قبلي:")} {currentSelectedCourse.requiresPreEval ? tx("مطلوب") : tx("اختياري")}
                  </span>
                  <span className="badge" style={{ background: currentSelectedCourse.requiresPostEval ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: currentSelectedCourse.requiresPostEval ? '#22c55e' : 'var(--text-muted)' }}>
                    {tx("تقييم بعدي:")} {currentSelectedCourse.requiresPostEval ? tx("إلزامي للشهادة") : tx("اختياري")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            {evaluationsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                <p>{tx("جاري تحميل نتائج التقييمات...")}</p>
              </div>
            ) : evaluations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لا يوجد متدربون مقبولون في هذه الدورة.")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{tx("اسم المتدرب")}</th>
                      <th>{tx("التقييم القبلي (PRE)")}</th>
                      <th>{tx("التقييم البعدي (POST)")}</th>
                      <th>{tx("معدل التطور (+/-)")}</th>
                      <th>{tx("حالة الأهلية للشهادة")}</th>
                      <th>{tx("تسجيل / تعديل الدرجة")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((ev) => {
                      const postRequired = currentSelectedCourse?.requiresPostEval;
                      const hasPostPassed = ev.postEvaluation && ev.postEvaluation.status === 'COMPLETED';
                      return (
                        <tr key={ev.registrationId}>
                          <td style={{ fontWeight: 700 }}>{ev.fullName}</td>
                          <td>
                            {ev.preEvaluation && ev.preEvaluation.score !== null ? (
                              <span style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>
                                {ev.preEvaluation.score} / {ev.preEvaluation.maxScore}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx("لم يُؤدَّ")}</span>
                            )}
                          </td>
                          <td>
                            {ev.postEvaluation && ev.postEvaluation.score !== null ? (
                              <span style={{ fontWeight: 700, color: '#22c55e' }}>
                                {ev.postEvaluation.score} / {ev.postEvaluation.maxScore}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx("لم يُؤدَّ")}</span>
                            )}
                          </td>
                          <td>
                            {ev.deltaScore !== null ? (
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: ev.deltaScore >= 0 ? '#22c55e' : '#ef4444',
                                }}
                              >
                                {ev.deltaScore >= 0 ? `+${ev.deltaScore}` : ev.deltaScore} {tx("نقطة")}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td>
                            {postRequired ? (
                              <span
                                className="badge"
                                style={{
                                  background: hasPostPassed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                  color: hasPostPassed ? '#22c55e' : '#ef4444',
                                  border: `1px solid ${hasPostPassed ? '#22c55e' : '#ef4444'}50`,
                                }}
                              >
                                {hasPostPassed ? tx("مستوفٍ لشرط التقييم البعدي") : tx("مطلوب إكمال التقييم")}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx("غير مشروط")}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <AdminButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEvalModalTarget({
                                    registrationId: ev.registrationId,
                                    traineeName: ev.fullName,
                                    type: 'PRE',
                                    currentScore: ev.preEvaluation?.score,
                                    maxScore: ev.preEvaluation?.maxScore || 100,
                                    notes: ev.preEvaluation?.notes || '',
                                  });
                                  setEvalForm({
                                    score: ev.preEvaluation?.score !== null && ev.preEvaluation?.score !== undefined ? String(ev.preEvaluation.score) : '',
                                    maxScore: ev.preEvaluation?.maxScore || 100,
                                    notes: ev.preEvaluation?.notes || '',
                                  });
                                }}
                              >
                                {tx("قبلي (PRE)")}
                              </AdminButton>
                              <AdminButton
                                variant="success"
                                size="sm"
                                onClick={() => {
                                  setEvalModalTarget({
                                    registrationId: ev.registrationId,
                                    traineeName: ev.fullName,
                                    type: 'POST',
                                    currentScore: ev.postEvaluation?.score,
                                    maxScore: ev.postEvaluation?.maxScore || 100,
                                    notes: ev.postEvaluation?.notes || '',
                                  });
                                  setEvalForm({
                                    score: ev.postEvaluation?.score !== null && ev.postEvaluation?.score !== undefined ? String(ev.postEvaluation.score) : '',
                                    maxScore: ev.postEvaluation?.maxScore || 100,
                                    notes: ev.postEvaluation?.notes || '',
                                  });
                                }}
                              >
                                {tx("بعدي (POST)")}
                              </AdminButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB 6: TRAINERS REGISTRY
          ============================ */}
      {activeTab === 'trainers' && (
        <TrainersManager courses={courses.map((c) => ({ id: c.id, titleAr: c.titleAr }))} />
      )}

      {/* ============================
          TAB 7: TRAINING MATERIALS
          ============================ */}
      {activeTab === 'materials' && (
        <MaterialsManager courses={courses.map((c) => ({ id: c.id, titleAr: c.titleAr, courseType: c.courseType }))} />
      )}

      {/* ============================
          TAB 8: TRAINING NEEDS ASSESSMENT (TNA)
          ============================ */}
      {activeTab === 'tna' && (
        <TnaManager courses={courses.map((c) => ({ id: c.id, titleAr: c.titleAr }))} />
      )}

      {/* Training Report Modal */}
      {reportModalCourseId && (
        <TrainingReportModal
          courseId={reportModalCourseId}
          isOpen={Boolean(reportModalCourseId)}
          onClose={() => setReportModalCourseId(null)}
        />
      )}

      {/* ============================
          MODAL: CREATE / EDIT COURSE
          ============================ */}
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCourse ? tx("تعديل البرنامج التدريبي") : tx("إضافة برنامج تدريبي جديد")}
          description={tx("تحديد البيانات الأكاديمية والمدرب والمقاعد ومعايير الاستحقاق")}
          maxWidth="760px"
        >
          <form onSubmit={handleSubmitCourse}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("اسم البرنامج (بالعربية)")}
                required
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder={tx("مثال: دورة حماية المنشآت الحيوية")}
              />
              <AdminInput
                label={tx("اسم البرنامج (بالإنجليزية)")}
                required
                isLtr
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="e.g. Critical Infrastructure Protection"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminSelect
                label={tx("تصنيف البرنامج")}
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isAr ? cat.titleAr : (cat.titleEn || cat.titleAr)}
                  </option>
                ))}
              </AdminSelect>
              <AdminInput
                label={tx("اسم المدرب / المحاضر")}
                required
                value={form.trainerName}
                onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
                placeholder={tx("مثال: عقيد / ناصر سالم اليافعي")}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("المدة التدريبية")}
                required
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder={tx("5 أيام (25 ساعة)")}
              />
              <AdminInput
                label={tx("سعة المقاعد")}
                required
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
              <AdminSelect
                label={tx("الحالة")}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="OPEN">{tx("مفتوح (OPEN)")}</option>
                <option value="DRAFT">{tx("مسودة (DRAFT)")}</option>
                <option value="FULL">{tx("مكتمل (FULL)")}</option>
                <option value="ONGOING">{tx("جاري (ONGOING)")}</option>
                <option value="COMPLETED">{tx("منتهي (COMPLETED)")}</option>
                <option value="CANCELLED">{tx("ملغي (CANCELLED)")}</option>
              </AdminSelect>
            </div>

            {/* Attendance and Evaluation Settings */}
            <div
              style={{
                padding: '1.25rem',
                background: 'var(--surface-bg)',
                borderRadius: '8px',
                border: '1px solid var(--admin-card-border)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--brand-gold-600, #d97706)', marginBottom: '0.85rem' }}>
                {tx("معايير استحقاق الشهادة والأهلية الأكاديمية")}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                <AdminInput
                  label={tx("نسبة الحضور المطلوبة (%)")}
                  required
                  type="number"
                  min={0}
                  max={100}
                  value={form.minAttendancePct}
                  onChange={(e) => setForm({ ...form, minAttendancePct: Number(e.target.value) })}
                />
                <div style={{ paddingTop: '1.2rem' }}>
                  <AdminCheckbox
                    id="requiresPreEval"
                    label={tx("إلزامية التقييم القبلي")}
                    checked={form.requiresPreEval}
                    onChange={(checked) => setForm({ ...form, requiresPreEval: checked })}
                  />
                </div>
                <div style={{ paddingTop: '1.2rem' }}>
                  <AdminCheckbox
                    id="requiresPostEval"
                    label={tx("إلزامية التقييم البعدي للشهادة")}
                    checked={form.requiresPostEval}
                    onChange={(checked) => setForm({ ...form, requiresPostEval: checked })}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <AdminInput
                label={tx("مكان الانعقاد")}
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("تاريخ البدء")}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <AdminInput
                label={tx("تاريخ الانتهاء")}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <AdminTextarea
                label={tx("الوصف التفصيلي (بالعربية)")}
                required
                rows={3}
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <AdminTextarea
                label={tx("الوصف بالإنجليزية")}
                required
                rows={2}
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-card-border)' }}>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? tx("جاري الحفظ...") : editingCourse ? tx("حفظ التعديلات") : tx("إنشاء الدورة")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ============================
          MODAL: SESSION CREATE / EDIT
          ============================ */}
      {isSessionModalOpen && (
        <AdminModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          title={editingSession ? tx("تعديل الجلسة التدريبية") : tx("إضافة جلسة تدريبية جديدة")}
          description={tx("تحديد توقيت ومحاور الجلسة التدريبية")}
          maxWidth="580px"
        >
          <form onSubmit={handleSaveSession}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("رقم الجلسة (ترتيب)")}
                required
                type="number"
                min={1}
                value={sessionForm.sessionNumber}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionNumber: Number(e.target.value) })}
              />
              <AdminInput
                label={tx("تاريخ الانعقاد")}
                required
                type="date"
                value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <AdminInput
                label={tx("عنوان وموضوع الجلسة")}
                required
                value={sessionForm.title}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                placeholder={tx("مثال: إجراءات التفتيش الأمني والتحكم بالمداخل")}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("وقت البدء")}
                type="time"
                value={sessionForm.startTime}
                onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
              />
              <AdminInput
                label={tx("وقت الانتهاء")}
                type="time"
                value={sessionForm.endTime}
                onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <AdminTextarea
                label={tx("ملاحظات ومحاور الجلسة")}
                rows={2}
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                placeholder={tx("أي توجيهات أو تجهيزات خاصة بالجلسة...")}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-card-border)' }}>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSessionModalOpen(false)}
                disabled={submitting}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? tx("جاري الحفظ...") : editingSession ? tx("تحديث الجلسة") : tx("إنشاء الجلسة")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ============================
          MODAL: ATTENDANCE CORRECTION
          ============================ */}
      {correctionTarget && (
        <AdminModal
          isOpen={Boolean(correctionTarget)}
          onClose={() => setCorrectionTarget(null)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} color="#f59e0b" />
              <span>{tx("تصحيح سجل حضور رسمي")}</span>
            </div>
          }
          description={
            <span>
              {tx("تعديل سجل الحضور للمتدرب:")}{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{correctionTarget.fullName}</strong>
            </span>
          }
          maxWidth="520px"
        >
          <AdminAlert variant="warning">
            {tx("يتطلب النظام تسجيل سبب التعديل ومبرره لتوثيق مسار التدقيق الرسمي (Audit Trail).")}
          </AdminAlert>

          <form onSubmit={handleCorrectAttendance}>
            <div style={{ marginBottom: '1rem' }}>
              <AdminSelect
                label={tx("الحالة المصححة")}
                required
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value as any)}
              >
                <option value="PRESENT">{tx("حاضر (PRESENT)")}</option>
                <option value="EXCUSED">{tx("معذور رسمي (EXCUSED)")}</option>
                <option value="ABSENT">{tx("غائب (ABSENT)")}</option>
              </AdminSelect>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <AdminTextarea
                label={tx("سبب ومبرر التصحيح الإلزامي")}
                rows={3}
                required
                placeholder={tx("مثال: تقديم تقرير طبي معتمد يبرر الغياب أو تصحيح خطأ رصد ورقي...")}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-card-border)' }}>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCorrectionTarget(null)}
                disabled={correcting}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                loading={correcting}
                disabled={correcting}
              >
                {tx("اعتماد التصحيح ومسار التدقيق")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ============================
          MODAL: EVALUATION SCORE
          ============================ */}
      {evalModalTarget && (
        <AdminModal
          isOpen={Boolean(evalModalTarget)}
          onClose={() => setEvalModalTarget(null)}
          title={
            <span>
              {tx("تسجيل تقييم")} {evalModalTarget.type === 'PRE' ? tx("قبلي (Pre-Eval)") : tx("بعدي (Post-Eval)")}
            </span>
          }
          description={
            <span>
              {tx("المتدرب:")} <strong style={{ color: 'var(--text-primary)' }}>{evalModalTarget.traineeName}</strong>
            </span>
          }
          maxWidth="500px"
        >
          <form onSubmit={handleSaveEvaluation}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <AdminInput
                label={tx("الدرجة المحرزة")}
                required
                type="number"
                step="0.5"
                min={0}
                max={evalForm.maxScore}
                value={evalForm.score}
                onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                placeholder={tx("مثال: 85")}
              />
              <AdminInput
                label={tx("الدرجة القصوى")}
                required
                type="number"
                min={1}
                value={evalForm.maxScore}
                onChange={(e) => setEvalForm({ ...evalForm, maxScore: Number(e.target.value) })}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <AdminTextarea
                label={tx("ملاحظات التقييم والتوصيات")}
                rows={2}
                placeholder={tx("ملاحظات أداء المتدرب...")}
                value={evalForm.notes}
                onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--admin-card-border)' }}>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEvalModalTarget(null)}
                disabled={savingEval}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                loading={savingEval}
                disabled={savingEval}
              >
                {tx("حفظ الدرجة")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
