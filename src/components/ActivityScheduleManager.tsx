import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  BellRing,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Filter,
  Search,
  Sparkles,
  Users,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Mail,
  ExternalLink,
  Lock,
  RefreshCw,
  Sun,
  Moon,
  Flag,
  ListTodo,
} from 'lucide-react';
import {
  ScheduledActivity,
  ScheduleFrequency,
  ScheduleCategory,
  DayOfWeek,
  GroupNumber,
  Student,
  ClassConfig,
  CurrentUser,
  NotificationRecord,
} from '../types';
import { getDayLabelVi } from '../utils/scoring';

interface ActivityScheduleManagerProps {
  activities: ScheduledActivity[];
  students: Student[];
  config: ClassConfig;
  currentUser: CurrentUser;
  onSaveActivity: (activity: ScheduledActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onRecordNotification: (record: Omit<NotificationRecord, 'id' | 'createdAt'>) => void;
}

const CATEGORY_CONFIG: Record<
  ScheduleCategory,
  { label: string; badgeClass: string; dotClass: string }
> = {
  cleaning: {
    label: 'Trực nhật & Vệ sinh',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  academic: {
    label: 'Học tập & Truy bài',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  discipline: {
    label: 'Nề nếp & Tác phong',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  movement: {
    label: 'Phong trào & Ngoại khóa',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  meeting: {
    label: 'Sinh hoạt & Hội họp',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  other: {
    label: 'Hoạt động khác',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
};

const DAYS_LIST: { id: DayOfWeek | 'All'; label: string }[] = [
  { id: 'All', label: 'Mọi ngày (Thứ 2 - Thứ 7)' },
  { id: 'Monday', label: 'Thứ Hai' },
  { id: 'Tuesday', label: 'Thứ Ba' },
  { id: 'Wednesday', label: 'Thứ Tư' },
  { id: 'Thursday', label: 'Thứ Năm' },
  { id: 'Friday', label: 'Thứ Sáu' },
  { id: 'Saturday', label: 'Thứ Bảy' },
];

export const ActivityScheduleManager: React.FC<ActivityScheduleManagerProps> = ({
  activities,
  students,
  config,
  currentUser,
  onSaveActivity,
  onDeleteActivity,
  onRecordNotification,
}) => {
  // Permission check: Only authorized roles can add/edit/delete/toggle/remind
  const canManageSchedule =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'teacher' ||
    currentUser.role === 'team_leader' ||
    currentUser.role === 'class_monitor' ||
    (currentUser.role === 'delegated' &&
      (currentUser.delegatedPermissions?.canManageSchedule !== false &&
        (currentUser.delegatedPermissions?.canLogDaily ||
          currentUser.delegatedPermissions?.canSendNotice)));

  // Active frequency tab
  const [frequencyTab, setFrequencyTab] = useState<'all' | ScheduleFrequency>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ScheduleCategory>('all');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal State (Add / Edit Activity)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFrequency, setFormFrequency] = useState<ScheduleFrequency>('daily');
  const [formCategory, setFormCategory] = useState<ScheduleCategory>('cleaning');
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek | 'All'>('Monday');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(15);
  const [formMonth, setFormMonth] = useState<number>(11);
  const [formWeek, setFormWeek] = useState<number>(config.currentWeek);
  const [formTimeSlot, setFormTimeSlot] = useState('06:45 - 07:00');
  const [formSession, setFormSession] = useState<'morning' | 'afternoon' | 'all_day'>('morning');
  const [formAssignedScope, setFormAssignedScope] = useState<'all' | 'group' | 'officers' | 'individual'>('group');
  const [formAssignedGroup, setFormAssignedGroup] = useState<GroupNumber>(1);
  const [formSelectedStudentIds, setFormSelectedStudentIds] = useState<string[]>([]);
  const [assignGroupFilter, setAssignGroupFilter] = useState<'all' | GroupNumber>('all');
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [formPriority, setFormPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [formStatus, setFormStatus] = useState<'pending' | 'in_progress' | 'completed' | 'overdue'>('pending');
  const [formAutoRemind, setFormAutoRemind] = useState(true);

  // Reminder Modal State
  const [remindingActivity, setRemindingActivity] = useState<ScheduledActivity | null>(null);
  const [isBatchRemindModalOpen, setIsBatchRemindModalOpen] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [browserPushFeedback, setBrowserPushFeedback] = useState<string | null>(null);
  const [selectedRecipientStudentId, setSelectedRecipientStudentId] = useState<string>('');
  const [remindGroupFilter, setRemindGroupFilter] = useState<'all' | GroupNumber>('all');
  const [remindStudentSearch, setRemindStudentSearch] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const dailyCount = activities.filter((a) => a.frequency === 'daily').length;
    const weeklyCount = activities.filter((a) => a.frequency === 'weekly').length;
    const monthlyCount = activities.filter((a) => a.frequency === 'monthly').length;
    const completedCount = activities.filter((a) => a.status === 'completed').length;
    const pendingCount = activities.filter((a) => a.status !== 'completed').length;
    const totalRemindersSent = activities.reduce((acc, a) => acc + (a.reminderCount || 0), 0);
    return {
      total,
      dailyCount,
      weeklyCount,
      monthlyCount,
      completedCount,
      pendingCount,
      totalRemindersSent,
      completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  }, [activities]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (frequencyTab !== 'all' && act.frequency !== frequencyTab) return false;
      if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
      if (selectedStatusFilter !== 'all' && act.status !== selectedStatusFilter) return false;

      if (selectedScopeFilter !== 'all') {
        if (selectedScopeFilter === 'officers' && act.assignedScope !== 'officers') return false;
        if (selectedScopeFilter === 'class_all' && act.assignedScope !== 'all') return false;
        if (selectedScopeFilter.startsWith('group_')) {
          const g = Number(selectedScopeFilter.replace('group_', ''));
          if (act.assignedScope !== 'group' || act.assignedGroup !== g) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchTime = act.timeSlot.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTime) return false;
      }

      return true;
    });
  }, [activities, frequencyTab, selectedCategory, selectedStatusFilter, selectedScopeFilter, searchQuery]);

  // Format assigned target text
  const getAssignedTargetLabel = (act: ScheduledActivity) => {
    if (act.assignedScope === 'all') return `Toàn bộ tập thể ${config.className}`;
    if (act.assignedScope === 'officers') return 'Ban cán sự lớp & 4 Tổ trưởng';
    if (act.assignedScope === 'group') return `Tổ ${act.assignedGroup || 1}`;
    if (act.assignedScope === 'individual') {
      if (act.assignedStudentNames && act.assignedStudentNames.length > 0) {
        return `Cá nhân: ${act.assignedStudentNames.join(', ')}`;
      }
      return 'Học sinh được phân công';
    }
    return 'Cả lớp';
  };

  // Format schedule timing badge
  const getScheduleTimingLabel = (act: ScheduledActivity) => {
    if (act.frequency === 'daily') {
      const dayLabel =
        !act.dayOfWeek || act.dayOfWeek === 'All'
          ? 'Hằng ngày (Thứ 2 - Thứ 7)'
          : `Hằng ngày (${getDayLabelVi(act.dayOfWeek as DayOfWeek)})`;
      return `${dayLabel} • ${act.timeSlot}`;
    }
    if (act.frequency === 'weekly') {
      const dayLabel =
        act.dayOfWeek && act.dayOfWeek !== 'All'
          ? getDayLabelVi(act.dayOfWeek as DayOfWeek)
          : 'Định kỳ mỗi tuần';
      return `Hằng tuần (${dayLabel}${act.week ? ` - Tuần ${act.week}` : ''}) • ${act.timeSlot}`;
    }
    if (act.frequency === 'monthly') {
      return `Hằng tháng (Ngày ${act.dayOfMonth || 15}${
        act.month ? `/${act.month}` : ' mỗi tháng'
      }) • ${act.timeSlot}`;
    }
    return act.timeSlot;
  };

  // Open Add Modal
  const handleOpenAddModal = (defaultFreq?: ScheduleFrequency) => {
    setEditingActivityId(null);
    setFormTitle('');
    setFormDesc('');
    setFormFrequency(defaultFreq || (frequencyTab === 'all' ? 'daily' : frequencyTab));
    setFormCategory('cleaning');
    setFormDayOfWeek('Monday');
    setFormDayOfMonth(15);
    setFormMonth(11);
    setFormWeek(config.currentWeek);
    setFormTimeSlot('06:45 - 07:00');
    setFormSession('morning');
    setFormAssignedScope(
      currentUser.role === 'team_leader' && currentUser.groupAccess && currentUser.groupAccess !== 'all'
        ? 'group'
        : 'all'
    );
    setFormAssignedGroup(
      currentUser.role === 'team_leader' && currentUser.groupAccess && currentUser.groupAccess !== 'all'
        ? currentUser.groupAccess
        : 1
    );
    setFormSelectedStudentIds([]);
    setAssignGroupFilter(
      currentUser.role === 'team_leader' && currentUser.groupAccess && currentUser.groupAccess !== 'all'
        ? currentUser.groupAccess
        : 'all'
    );
    setAssignStudentSearch('');
    setFormPriority('normal');
    setFormStatus('pending');
    setFormAutoRemind(true);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (act: ScheduledActivity) => {
    setEditingActivityId(act.id);
    setFormTitle(act.title);
    setFormDesc(act.description);
    setFormFrequency(act.frequency);
    setFormCategory(act.category);
    setFormDayOfWeek(act.dayOfWeek || 'Monday');
    setFormDayOfMonth(act.dayOfMonth || 15);
    setFormMonth(act.month || 11);
    setFormWeek(act.week || config.currentWeek);
    setFormTimeSlot(act.timeSlot);
    setFormSession(act.session);
    setFormAssignedScope(act.assignedScope);
    setFormAssignedGroup(act.assignedGroup || 1);
    setFormSelectedStudentIds(act.assignedStudentIds || []);
    setAssignGroupFilter('all');
    setAssignStudentSearch('');
    setFormPriority(act.priority);
    setFormStatus(act.status);
    setFormAutoRemind(act.autoRemind);
    setIsFormModalOpen(true);
  };

  // Save Activity Submit
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const existing = editingActivityId
      ? activities.find((a) => a.id === editingActivityId)
      : undefined;

    const assignedStudents = students.filter((s) => formSelectedStudentIds.includes(s.id));

    const activityObj: ScheduledActivity = {
      id: editingActivityId || `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: formTitle.trim(),
      description: formDesc.trim(),
      frequency: formFrequency,
      category: formCategory,
      dayOfWeek: formFrequency !== 'monthly' ? formDayOfWeek : undefined,
      dayOfMonth: formFrequency === 'monthly' ? Number(formDayOfMonth) : undefined,
      month: formFrequency === 'monthly' ? Number(formMonth) : undefined,
      week: formFrequency === 'weekly' ? Number(formWeek) : undefined,
      timeSlot: formTimeSlot.trim() || '07:00',
      session: formSession,
      assignedScope: formAssignedScope,
      assignedGroup: formAssignedScope === 'group' ? formAssignedGroup : undefined,
      assignedStudentIds: formAssignedScope === 'individual' ? formSelectedStudentIds : undefined,
      assignedStudentNames:
        formAssignedScope === 'individual' ? assignedStudents.map((s) => s.fullName) : undefined,
      status: formStatus,
      priority: formPriority,
      autoRemind: formAutoRemind,
      reminderCount: existing ? existing.reminderCount : 0,
      lastRemindedAt: existing?.lastRemindedAt,
      createdBy: existing ? existing.createdBy : `${currentUser.name} (${currentUser.title})`,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    onSaveActivity(activityObj);
    setIsFormModalOpen(false);
  };

  // Quick Toggle Status
  const handleToggleStatus = (act: ScheduledActivity) => {
    if (!canManageSchedule) return;
    const nextStatus: ScheduledActivity['status'] =
      act.status === 'completed'
        ? 'pending'
        : act.status === 'pending'
        ? 'in_progress'
        : 'completed';
    onSaveActivity({
      ...act,
      status: nextStatus,
    });
  };

  // Generate reminder message for a single activity
  const buildReminderMessage = (act: ScheduledActivity) => {
    const freqLabel =
      act.frequency === 'daily'
        ? 'LỊCH HOẠT ĐỘNG HẰNG NGÀY'
        : act.frequency === 'weekly'
        ? 'LỊCH CÔNG TÁC HẰNG TUẦN'
        : 'KẾ HOẠCH HOẠT ĐỘNG HẰNG THÁNG';
    const priorityTag =
      act.priority === 'urgent'
        ? '🔴 [KHẨN CẤP]'
        : act.priority === 'high'
        ? '🟠 [QUAN TRỌNG]'
        : '🔵 [NHẮC VIỆC]';

    return `${priorityTag} THÔNG BÁO NHẮC VIỆC — ${freqLabel} (${config.className.toUpperCase()})
📌 Công việc: ${act.title}
⏰ Thời gian thực hiện: ${getScheduleTimingLabel(act)}
👥 Bộ phận phụ trách: ${getAssignedTargetLabel(act)}
📝 Nội dung chi tiết: ${act.description || 'Thực hiện nghiêm túc theo phân công của lớp.'}
📊 Trạng thái hiện tại: ${
      act.status === 'completed'
        ? 'Đã hoàn thành'
        : act.status === 'in_progress'
        ? 'Đang triển khai'
        : 'Chưa hoàn thành — Đề nghị thực hiện đúng giờ!'
    }

Đề nghị các tổ trưởng và học sinh được phân công hoàn thành nhiệm vụ và báo cáo kết quả cho GVCN ${config.homeroomTeacher}.`;
  };

  // Generate batch reminder message for all pending activities
  const buildBatchReminderMessage = () => {
    const pendingList = activities.filter((a) => a.status !== 'completed');
    const lines = pendingList.map(
      (a, idx) =>
        `${idx + 1}. [${
          a.frequency === 'daily' ? 'Hằng ngày' : a.frequency === 'weekly' ? 'Hằng tuần' : 'Hằng tháng'
        }] ${a.title}\n   • Thời gian: ${getScheduleTimingLabel(a)}\n   • Phụ trách: ${getAssignedTargetLabel(a)}`
    );

    return `🔔 [TỔNG HỢP NHẮC VIỆC ĐỊNH KỲ LỚP ${config.className.toUpperCase()} — TUẦN ${config.currentWeek}]
Kính gửi Ban cán sự lớp, 4 Tổ trưởng và toàn thể học sinh ${config.className},
Dưới đây là danh sách ${pendingList.length} lịch hoạt động cần triển khai và hoàn thành:

${lines.join('\n\n')}

⚠️ Lưu ý: Các tổ trưởng đôn đốc thành viên thực hiện nghiêm túc, đúng khung giờ quy định để cộng điểm thi đua tuần.
Trân trọng, GVCN ${config.homeroomTeacher}.`;
  };

  // Open single reminder modal
  const handleOpenReminder = (act: ScheduledActivity) => {
    setRemindingActivity(act);
    setCopiedReminder(false);
    setBrowserPushFeedback(null);

    // Preselect a relevant student for direct Zalo/Email if applicable
    if (act.assignedScope === 'group' && act.assignedGroup) {
      const leader =
        students.find((s) => s.group === act.assignedGroup && s.role === 'Tổ trưởng') ||
        students.find((s) => s.group === act.assignedGroup);
      setSelectedRecipientStudentId(leader?.id || students[0]?.id || '');
    } else if (act.assignedScope === 'individual' && act.assignedStudentIds?.[0]) {
      setSelectedRecipientStudentId(act.assignedStudentIds[0]);
    } else {
      const monitor =
        students.find((s) => s.role === 'Lớp trưởng') || students[0];
      setSelectedRecipientStudentId(monitor?.id || '');
    }
  };

  // Trigger Reminder Recording + Increment reminderCount
  const handleConfirmSendReminder = (
    act: ScheduledActivity,
    channel: 'zalo_copy' | 'zalo_direct' | 'email' | 'push'
  ) => {
    const msg = buildReminderMessage(act);
    const nowIso = new Date().toISOString();

    if (channel === 'zalo_copy') {
      navigator.clipboard.writeText(msg);
      setCopiedReminder(true);
      setTimeout(() => setCopiedReminder(false), 2500);
    }

    const targetStudent = students.find((s) => s.id === selectedRecipientStudentId);

    if (channel === 'zalo_direct' && targetStudent) {
      navigator.clipboard.writeText(msg);
      const phone = (targetStudent.zaloPhone || targetStudent.parentPhone || '').replace(/\D/g, '');
      window.open(`https://zalo.me/${phone}`, '_blank', 'noopener,noreferrer');
    }

    if (channel === 'email') {
      const subject = encodeURIComponent(
        `[Nhắc việc ${config.className}] ${act.title} - ${getScheduleTimingLabel(act)}`
      );
      const body = encodeURIComponent(msg);
      const email = targetStudent?.parentEmail || config.teacherEmail || '';
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }

    if (channel === 'push') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Nhắc việc ${config.className}: ${act.title}`, {
          body: `${getAssignedTargetLabel(act)} • ${getScheduleTimingLabel(act)}`,
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(`Nhắc việc ${config.className}: ${act.title}`, {
              body: `${getAssignedTargetLabel(act)} • ${getScheduleTimingLabel(act)}`,
            });
          }
        });
      }
      setBrowserPushFeedback(
        `Đã phát thông báo nhắc việc tức thì tới "${getAssignedTargetLabel(act)}" và lưu vào nhật ký thông báo!`
      );
    }

    // Update activity reminder count & timestamp
    onSaveActivity({
      ...act,
      reminderCount: (act.reminderCount || 0) + 1,
      lastRemindedAt: nowIso,
    });

    // Record in Notification History
    onRecordNotification({
      studentId: targetStudent?.id || 'class_all',
      studentName: getAssignedTargetLabel(act),
      type: 'reminder',
      title: `Nhắc việc (${
        act.frequency === 'daily' ? 'Hằng ngày' : act.frequency === 'weekly' ? 'Hằng tuần' : 'Hằng tháng'
      }): ${act.title}`,
      message: msg,
      recipientContact:
        targetStudent?.zaloPhone || targetStudent?.parentPhone || getAssignedTargetLabel(act),
      status: channel === 'zalo_copy' ? 'copied' : 'sent',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Kế Hoạch & Lịch Hoạt Động Hằng Ngày, Tuần, Tháng
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý lịch trực nhật, truy bài, sinh hoạt lớp, hoạt động chủ điểm tháng và gửi thông báo nhắc việc tự động
                </p>
              </div>
            </div>
          </div>

          {canManageSchedule ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsBatchRemindModalOpen(true);
                  setCopiedReminder(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <BellRing className="w-4 h-4" />
                Gửi Nhắc Việc Hàng Loạt ({stats.pendingCount})
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Lên Lịch Hoạt Động Mới
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Chế độ xem lịch công tác (Chỉ GVCN & Cán bộ lớp mới có quyền tạo lịch & nhắc việc)</span>
            </div>
          )}
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">
                Tổng lịch hoạt động
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {stats.total} <span className="text-xs font-semibold text-slate-500">nhiệm vụ</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {stats.dailyCount} Ngày • {stats.weeklyCount} Tuần • {stats.monthlyCount} Tháng
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 block">
                Tiến độ hoàn thành
              </span>
              <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                {stats.completedCount}/{stats.total}{' '}
                <span className="text-xs font-bold">({stats.completionRate}%)</span>
              </span>
              <span className="text-[10px] text-emerald-600">
                Đã thực hiện đúng tiến độ
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 block">
                Đang chờ & Cần nhắc việc
              </span>
              <span className="text-xl font-black text-amber-900 mt-0.5 block">
                {stats.pendingCount} <span className="text-xs font-semibold">hoạt động</span>
              </span>
              <span className="text-[10px] text-amber-700">
                Sẵn sàng gửi thông báo Zalo/Email
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-purple-700 block">
                Lượt thông báo nhắc việc
              </span>
              <span className="text-xl font-black text-purple-900 mt-0.5 block">
                {stats.totalRemindersSent} <span className="text-xs font-semibold">lượt gửi</span>
              </span>
              <span className="text-[10px] text-purple-600">
                Đồng bộ nhật ký thông báo lớp
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Frequency Sub-Tabs (Tất cả / Hằng ngày / Hằng tuần / Hằng tháng) */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setFrequencyTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                frequencyTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFrequencyTab('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                frequencyTab === 'daily'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Lịch Hằng Ngày ({stats.dailyCount})
            </button>
            <button
              type="button"
              onClick={() => setFrequencyTab('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                frequencyTab === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Lịch Hằng Tuần ({stats.weeklyCount})
            </button>
            <button
              type="button"
              onClick={() => setFrequencyTab('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                frequencyTab === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Lịch Hằng Tháng ({stats.monthlyCount})
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo bộ phận phụ trách"
              value={selectedScopeFilter}
              onChange={(e) => setSelectedScopeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="class_all">Toàn thể lớp</option>
              <option value="officers">Ban cán sự & Tổ trưởng</option>
              <option value="group_1">Tổ 1</option>
              <option value="group_2">Tổ 2</option>
              <option value="group_3">Tổ 3</option>
              <option value="group_4">Tổ 4</option>
            </select>

            <select
              aria-label="Lọc theo nhóm hoạt động"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'all' | ScheduleCategory)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Mọi loại hoạt động</option>
              <option value="cleaning">Trực nhật & Vệ sinh</option>
              <option value="academic">Học tập & Truy bài</option>
              <option value="discipline">Nề nếp & Tác phong</option>
              <option value="movement">Phong trào & Ngoại khóa</option>
              <option value="meeting">Sinh hoạt & Hội họp</option>
              <option value="other">Hoạt động khác</option>
            </select>

            <select
              aria-label="Lọc theo trạng thái"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chưa thực hiện</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Đã hoàn thành</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên hoạt động..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cards Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            Không tìm thấy lịch hoạt động phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Bạn có thể chuyển sang tab khác hoặc thêm lịch hoạt động mới cho lớp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const catInfo = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.other;
            const isCompleted = act.status === 'completed';
            const isInProgress = act.status === 'in_progress';

            return (
              <div
                key={act.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-2xs ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : act.priority === 'urgent'
                    ? 'border-rose-200 hover:border-rose-300'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  {/* Card Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Frequency Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          act.frequency === 'daily'
                            ? 'bg-blue-100 text-blue-800'
                            : act.frequency === 'weekly'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {act.frequency === 'daily'
                          ? 'Hằng Ngày'
                          : act.frequency === 'weekly'
                          ? 'Hằng Tuần'
                          : 'Hằng Tháng'}
                      </span>

                      {/* Category Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${catInfo.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${catInfo.dotClass}`}></span>
                        {catInfo.label}
                      </span>

                      {/* Priority Badge */}
                      {act.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          🔥 Khẩn cấp
                        </span>
                      )}
                      {act.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⭐ Quan trọng
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div>
                      {canManageSchedule ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act)}
                          title="Nhấn để chuyển nhanh trạng thái thực hiện"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : isInProgress
                              ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Đã hoàn thành
                            </>
                          ) : isInProgress ? (
                            <>
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              Đang thực hiện
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 text-amber-600" />
                              Chưa thực hiện
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isInProgress
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isCompleted
                            ? 'Đã hoàn thành'
                            : isInProgress
                            ? 'Đang thực hiện'
                            : 'Chưa thực hiện'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`font-bold text-sm sm:text-base ${
                      isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {act.description}
                  </p>

                  {/* Timing & Assignee Info Box */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold">{getScheduleTimingLabel(act)}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-500 ml-auto">
                        {act.session === 'morning'
                          ? '☀️ Buổi sáng'
                          : act.session === 'afternoon'
                          ? '🌤️ Buổi chiều'
                          : '📅 Cả ngày'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Phụ trách:{' '}
                        <strong className="text-slate-900">{getAssignedTargetLabel(act)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Reminder Info & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {act.reminderCount > 0 ? (
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Đã nhắc việc {act.reminderCount} lần
                        {act.lastRemindedAt &&
                          ` (${new Date(act.lastRemindedAt).toLocaleDateString('vi-VN')})`}
                      </span>
                    ) : (
                      <span>Người tạo: {act.createdBy}</span>
                    )}
                  </div>

                  {canManageSchedule && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenReminder(act)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                        title="Gửi thông báo nhắc việc qua Zalo, Email hoặc Thông báo đẩy"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        Gửi nhắc việc
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(act)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                        title="Chỉnh sửa lịch hoạt động"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Bạn có chắc muốn xoá lịch hoạt động: "${act.title}" không?`
                            )
                          ) {
                            onDeleteActivity(act.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                        title="Xoá lịch hoạt động"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SCHEDULED ACTIVITY */}
      {isFormModalOpen && canManageSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingActivityId ? 'Chỉnh Sửa Lịch Hoạt Động' : 'Lên Lịch Hoạt Động Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập lịch công tác hằng ngày, tuần, tháng và phân công nhắc việc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveSubmit}
              className="overflow-y-auto py-4 space-y-4 flex-1 text-xs"
            >
              {/* Frequency Selector Pills */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chu kỳ lặp lại lịch hoạt động <span className="text-rose-500">*</span>:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'daily', label: 'Hằng Ngày', desc: 'Trực nhật, truy bài, điểm danh' },
                      { id: 'weekly', label: 'Hằng Tuần', desc: 'Chào cờ, sinh hoạt lớp, chốt sổ' },
                      { id: 'monthly', label: 'Hằng Tháng', desc: 'Chủ điểm tháng, bình bầu, phong trào' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormFrequency(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formFrequency === item.id
                          ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên hoạt động / Công việc <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: Trực nhật lớp, Tổng hợp điểm thi đua tuần, Sinh hoạt chủ điểm..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhóm hoạt động:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ScheduleCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="cleaning">Trực nhật & Vệ sinh</option>
                    <option value="academic">Học tập & Truy bài</option>
                    <option value="discipline">Nề nếp & Tác phong</option>
                    <option value="movement">Phong trào & Ngoại khóa</option>
                    <option value="meeting">Sinh hoạt & Hội họp</option>
                    <option value="other">Hoạt động khác</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết / Yêu cầu cần hoàn thành:
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Nhập hướng dẫn cụ thể, tiêu chí kiểm tra hoặc lưu ý cho tổ/cá nhân phụ trách..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic Timing Fields based on Frequency */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {formFrequency !== 'monthly' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thứ thực hiện trong tuần:
                    </label>
                    <select
                      value={formDayOfWeek}
                      onChange={(e) => setFormDayOfWeek(e.target.value as DayOfWeek | 'All')}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                    >
                      {DAYS_LIST.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày thực hiện trong tháng:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={formDayOfMonth}
                        onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-900"
                      />
                      <span className="text-slate-500">/ Tháng</span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={formMonth}
                        onChange={(e) => setFormMonth(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khung giờ / Tiết học:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    placeholder="VD: 06:40 - 07:00 hoặc Tiết 5"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Buổi học trong ngày:
                  </label>
                  <select
                    value={formSession}
                    onChange={(e) =>
                      setFormSession(e.target.value as 'morning' | 'afternoon' | 'all_day')
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="morning">☀️ Buổi sáng</option>
                    <option value="afternoon">🌤️ Buổi chiều</option>
                    <option value="all_day">📅 Cả ngày</option>
                  </select>
                </div>
              </div>

              {/* Assignment Scope (Cả lớp / Tổ 1-4 / Ban cán sự / Cá nhân) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phân công cho đối tượng:
                    </label>
                    <select
                      value={formAssignedScope}
                      onChange={(e) =>
                        setFormAssignedScope(
                          e.target.value as 'all' | 'group' | 'officers' | 'individual'
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                    >
                      <option value="all">Toàn thể lớp ({config.className})</option>
                      <option value="group">Theo Tổ (Tổ 1, 2, 3, 4)</option>
                      <option value="officers">Ban cán sự lớp & 4 Tổ trưởng</option>
                      <option value="individual">Chỉ định Học sinh cụ thể</option>
                    </select>
                  </div>

                  {formAssignedScope === 'group' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Chọn Tổ phụ trách:
                      </label>
                      <select
                        value={formAssignedGroup}
                        onChange={(e) => setFormAssignedGroup(Number(e.target.value) as GroupNumber)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-indigo-700"
                      >
                        <option value={1}>Tổ 1</option>
                        <option value={2}>Tổ 2</option>
                        <option value={3}>Tổ 3</option>
                        <option value={4}>Tổ 4</option>
                      </select>
                    </div>
                  )}
                </div>

                {formAssignedScope === 'individual' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block font-semibold text-slate-700">
                        Chọn học sinh nhận nhiệm vụ ({formSelectedStudentIds.length} học sinh đã chọn):
                      </label>
                      {formSelectedStudentIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormSelectedStudentIds([])}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline"
                        >
                          Bỏ chọn tất cả ({formSelectedStudentIds.length})
                        </button>
                      )}
                    </div>

                    {/* Selected Students Quick Tags */}
                    {formSelectedStudentIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg max-h-20 overflow-y-auto">
                        {students
                          .filter((s) => formSelectedStudentIds.includes(s.id))
                          .map((st) => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 text-[11px] font-semibold shadow-2xs"
                            >
                              {st.fullName} (Tổ {st.group})
                              <button
                                type="button"
                                onClick={() =>
                                  setFormSelectedStudentIds((prev) =>
                                    prev.filter((id) => id !== st.id)
                                  )
                                }
                                className="text-slate-400 hover:text-rose-600 ml-0.5 font-bold"
                                title="Bỏ chọn học sinh này"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Group Filter Buttons + Fast Search Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3 text-indigo-600" />
                          Lọc Tổ:
                        </span>
                        {(['all', 1, 2, 3, 4] as const).map((g) => {
                          const count =
                            g === 'all'
                              ? students.length
                              : students.filter((s) => s.group === g).length;
                          const isActive = assignGroupFilter === g;
                          return (
                            <button
                              key={String(g)}
                              type="button"
                              onClick={() => setAssignGroupFilter(g)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {g === 'all' ? `Cả lớp (${count})` : `Tổ ${g} (${count})`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Search Input */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={assignStudentSearch}
                          onChange={(e) => setAssignStudentSearch(e.target.value)}
                          placeholder="Tìm nhanh tên hoặc mã học sinh (VD: An, HS1001)..."
                          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {assignStudentSearch && (
                          <button
                            type="button"
                            onClick={() => setAssignStudentSearch('')}
                            className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filtered Student List & Quick Select Filtered Button */}
                    {(() => {
                      const filteredAssignStudents = students.filter((st) => {
                        if (assignGroupFilter !== 'all' && st.group !== assignGroupFilter) {
                          return false;
                        }
                        if (assignStudentSearch.trim()) {
                          const q = assignStudentSearch.toLowerCase().trim();
                          const matchName = st.fullName.toLowerCase().includes(q);
                          const matchCode = st.code.toLowerCase().includes(q);
                          const matchRole = (st.role || '').toLowerCase().includes(q);
                          if (!matchName && !matchCode && !matchRole) return false;
                        }
                        return true;
                      });

                      const allFilteredSelected =
                        filteredAssignStudents.length > 0 &&
                        filteredAssignStudents.every((s) =>
                          formSelectedStudentIds.includes(s.id)
                        );

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                            <span>
                              Hiển thị <strong>{filteredAssignStudents.length}</strong> học sinh
                              {assignGroupFilter !== 'all' ? ` thuộc Tổ ${assignGroupFilter}` : ''}
                              {assignStudentSearch ? ` khớp từ khóa "${assignStudentSearch}"` : ''}
                            </span>
                            {filteredAssignStudents.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const filteredIds = filteredAssignStudents.map((s) => s.id);
                                  if (allFilteredSelected) {
                                    setFormSelectedStudentIds((prev) =>
                                      prev.filter((id) => !filteredIds.includes(id))
                                    );
                                  } else {
                                    setFormSelectedStudentIds((prev) =>
                                      Array.from(new Set([...prev, ...filteredIds]))
                                    );
                                  }
                                }}
                                className="font-bold text-indigo-600 hover:text-indigo-800"
                              >
                                {allFilteredSelected
                                  ? 'Bỏ chọn danh sách đang lọc'
                                  : `+ Chọn tất cả (${filteredAssignStudents.length} HS đang lọc)`}
                              </button>
                            )}
                          </div>

                          <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {filteredAssignStudents.length === 0 ? (
                              <div className="col-span-2 py-6 text-center text-slate-400 text-xs">
                                Không tìm thấy học sinh nào khớp với bộ lọc Tổ / từ khóa tìm kiếm.
                              </div>
                            ) : (
                              filteredAssignStudents.map((st) => {
                                const checked = formSelectedStudentIds.includes(st.id);
                                return (
                                  <label
                                    key={st.id}
                                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                                      checked
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                        : 'border-transparent hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormSelectedStudentIds((prev) => [...prev, st.id]);
                                          } else {
                                            setFormSelectedStudentIds((prev) =>
                                              prev.filter((id) => id !== st.id)
                                            );
                                          }
                                        }}
                                        className="rounded text-indigo-600 shrink-0"
                                      />
                                      <div className="truncate">
                                        <span className="block truncate">{st.fullName}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          {st.code} • {st.role}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        checked
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      Tổ {st.group}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mức độ ưu tiên:
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(e.target.value as 'normal' | 'high' | 'urgent')
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="normal">🔵 Bình thường</option>
                    <option value="high">⭐ Quan trọng</option>
                    <option value="urgent">🔥 Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trạng thái thực hiện:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(
                        e.target.value as 'pending' | 'in_progress' | 'completed' | 'overdue'
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="pending">⏳ Chưa thực hiện</option>
                    <option value="in_progress">🔄 Đang thực hiện</option>
                    <option value="completed">✅ Đã hoàn thành</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAutoRemind}
                      onChange={(e) => setFormAutoRemind(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700">
                      Bật thông báo nhắc việc tự động
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingActivityId ? 'Lưu Cập Nhật Lịch' : 'Tạo Lịch Hoạt Động'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND SINGLE TASK REMINDER */}
      {remindingActivity && canManageSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Gửi Thông Báo Nhắc Việc
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhắc nhở qua Zalo, Email hoặc phát thông báo đẩy tức thì
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemindingActivity(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {browserPushFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{browserPushFeedback}</span>
              </div>
            )}

            {/* Recipient Student Selector for Direct Zalo / Email with Group Filter & Search */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700">
                Chọn học sinh / đại diện nhận tin nhắn trực tiếp (Lọc theo Tổ & Tìm nhanh):
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 1, 2, 3, 4] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    onClick={() => setRemindGroupFilter(g)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                      remindGroupFilter === g
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'all' ? 'Cả lớp' : `Tổ ${g}`}
                  </button>
                ))}
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
                  <input
                    type="text"
                    value={remindStudentSearch}
                    onChange={(e) => setRemindStudentSearch(e.target.value)}
                    placeholder="Gõ tên học sinh để lọc nhanh..."
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900"
                  />
                </div>
              </div>
              <select
                value={selectedRecipientStudentId}
                onChange={(e) => setSelectedRecipientStudentId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900"
              >
                {students
                  .filter((st) => {
                    if (remindGroupFilter !== 'all' && st.group !== remindGroupFilter) return false;
                    if (remindStudentSearch.trim()) {
                      const q = remindStudentSearch.toLowerCase().trim();
                      return (
                        st.fullName.toLowerCase().includes(q) ||
                        st.code.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} — Tổ {st.group} ({st.role}) • Zalo: {st.zaloPhone || st.parentPhone}
                    </option>
                  ))}
              </select>
            </div>

            {/* Preview Message */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1">
                Nội dung thông báo nhắc việc:
              </span>
              <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap font-sans text-slate-800 leading-relaxed max-h-56 overflow-y-auto">
                {buildReminderMessage(remindingActivity)}
              </pre>
            </div>

            {/* Multi-channel Send Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmSendReminder(remindingActivity, 'zalo_copy')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                {copiedReminder ? (
                  <>
                    <Check className="w-4 h-4" />
                    Đã sao chép nội dung!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Sao chép gửi Nhóm Zalo
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSendReminder(remindingActivity, 'zalo_direct')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Mở Zalo người phụ trách
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSendReminder(remindingActivity, 'email')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                Gửi qua Email
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSendReminder(remindingActivity, 'push')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                <BellRing className="w-4 h-4" />
                Phát Thông Báo Đẩy & Lưu Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH REMINDER FOR ALL PENDING ACTIVITIES */}
      {isBatchRemindModalOpen && canManageSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Gửi Nhắc Việc Hàng Loạt ({stats.pendingCount} nhiệm vụ chưa hoàn thành)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tổng hợp tất cả lịch hoạt động hằng ngày, tuần, tháng chưa hoàn tất để đôn đốc cả lớp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchRemindModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap font-sans text-slate-800 leading-relaxed max-h-64 overflow-y-auto">
              {buildBatchReminderMessage()}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchRemindModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const msg = buildBatchReminderMessage();
                  navigator.clipboard.writeText(msg);
                  setCopiedReminder(true);
                  onRecordNotification({
                    studentId: 'class_all',
                    studentName: `Toàn thể lớp ${config.className}`,
                    type: 'reminder',
                    title: `Nhắc việc hàng loạt (${stats.pendingCount} hoạt động định kỳ)`,
                    message: msg,
                    recipientContact: `Nhóm Zalo ${config.className}`,
                    status: 'copied',
                  });
                  setTimeout(() => setCopiedReminder(false), 2500);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
              >
                {copiedReminder ? (
                  <>
                    <Check className="w-4 h-4" />
                    Đã sao chép & Lưu nhật ký nhắc việc!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Sao chép Bản Tin Nhắc Việc Gửi Zalo Lớp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
