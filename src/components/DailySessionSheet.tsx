import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Search,
  Sun,
  Moon,
  Users,
  ShieldAlert,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import {
  Student,
  DailyLogEntry,
  CriteriaItem,
  GroupNumber,
  CurrentUser,
  ClassConfig,
  DayOfWeek,
} from '../types';
import { getDayLabelVi } from '../utils/scoring';

interface DailySessionSheetProps {
  students: Student[];
  logs: DailyLogEntry[];
  criteria: CriteriaItem[];
  currentUser: CurrentUser;
  config: ClassConfig;
  onAddLog: (log: Omit<DailyLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteLog: (id: string) => void;
  onOpenNotificationModal?: (studentId: string, violationNote: string) => void;
}

export const DailySessionSheet: React.FC<DailySessionSheetProps> = ({
  students,
  logs,
  criteria,
  currentUser,
  config,
  onAddLog,
  onDeleteLog,
  onOpenNotificationModal,
}) => {
  // View mode: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedSession, setSelectedSession] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [selectedGroup, setSelectedGroup] = useState<GroupNumber | 'all'>(
    currentUser.role === 'team_leader' && currentUser.groupAccess && currentUser.groupAccess !== 'all'
      ? currentUser.groupAccess
      : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'deduction' | 'praise'>('deduction');

  // Form state
  const [formGroup, setFormGroup] = useState<GroupNumber | 'all'>('all');
  const [formStudentId, setFormStudentId] = useState('');
  const [formCriteriaId, setFormCriteriaId] = useState('');
  const [formSession, setFormSession] = useState<'morning' | 'afternoon'>('morning');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formNote, setFormNote] = useState('');

  const daysList: { id: DayOfWeek; label: string }[] = [
    { id: 'Monday', label: 'Thứ Hai' },
    { id: 'Tuesday', label: 'Thứ Ba' },
    { id: 'Wednesday', label: 'Thứ Tư' },
    { id: 'Thursday', label: 'Thứ Năm' },
    { id: 'Friday', label: 'Thứ Sáu' },
    { id: 'Saturday', label: 'Thứ Bảy' },
  ];

  // Filter criteria by deduction/praise
  const filteredCriteria = useMemo(() => {
    return criteria.filter((c) => c.type === modalType);
  }, [criteria, modalType]);

  // Filter students for modal dropdown by formGroup
  const modalStudents = useMemo(() => {
    if (formGroup === 'all') return students;
    return students.filter((s) => s.group === formGroup);
  }, [students, formGroup]);

  // Filter logs for display
  const displayedLogs = useMemo(() => {
    return logs.filter((log) => {
      // Semester filter
      if (log.semester !== config.currentSemester) return false;

      // View mode filters
      if (viewMode === 'day') {
        if (log.dayOfWeek !== selectedDay) return false;
        if (log.week !== config.currentWeek) return false;
      } else if (viewMode === 'week') {
        if (log.week !== config.currentWeek) return false;
      }
      // in month mode: includes all 4 weeks of the month or all logs of current semester

      // Session filter
      if (selectedSession !== 'all' && log.session !== selectedSession) return false;

      // Group filter
      if (selectedGroup !== 'all' && log.group !== selectedGroup) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = log.studentName.toLowerCase().includes(q);
        const matchCriteria = log.criteriaName.toLowerCase().includes(q);
        const matchNote = (log.note || '').toLowerCase().includes(q);
        if (!matchStudent && !matchCriteria && !matchNote) return false;
      }

      return true;
    });
  }, [logs, config, viewMode, selectedDay, selectedSession, selectedGroup, searchQuery]);

  // Open modal handler
  const handleOpenModal = (type: 'deduction' | 'praise') => {
    setModalType(type);
    const availableCrit = criteria.filter((c) => c.type === type);
    setFormCriteriaId(availableCrit[0]?.id || '');

    // Default to currently selected group or team leader's group
    const initialGroup =
      selectedGroup !== 'all'
        ? selectedGroup
        : currentUser.role === 'team_leader' && currentUser.groupAccess && currentUser.groupAccess !== 'all'
        ? currentUser.groupAccess
        : 'all';

    setFormGroup(initialGroup);

    const defaultGroupStudents =
      initialGroup !== 'all'
        ? students.filter((s) => s.group === initialGroup)
        : students;

    setFormStudentId(defaultGroupStudents[0]?.id || students[0]?.id || '');
    setFormDay(selectedDay);
    setFormSession(selectedSession === 'afternoon' ? 'afternoon' : 'morning');
    setFormPeriod(1);
    setFormNote('');
    setIsModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formStudentId);
    const cr = criteria.find((c) => c.id === formCriteriaId);
    if (!st || !cr) return;

    onAddLog({
      studentId: st.id,
      studentName: st.fullName,
      group: st.group,
      date: formDate,
      week: config.currentWeek,
      semester: config.currentSemester,
      dayOfWeek: formDay,
      session: formSession,
      period: Number(formPeriod),
      criteriaId: cr.id,
      criteriaName: cr.codeName,
      category: cr.category,
      delta: cr.delta,
      note: formNote.trim(),
      loggedByRole: currentUser.title,
      loggedByName: currentUser.name,
    });

    setIsModalOpen(false);

    // If severe violation, prompt quick notification to parents
    if (cr.isSevere && onOpenNotificationModal) {
      if (confirm(`Học sinh ${st.fullName} bị ghi nhận lỗi nghiêm trọng: "${cr.codeName}". Bạn có muốn mở ngay hộp thoại gửi tin nhắn Zalo/Email cho phụ huynh không?`)) {
        onOpenNotificationModal(st.id, cr.codeName);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Nhật Ký Sinh Hoạt Lớp — Lịch Học 2 Buổi / 5 Tiết
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân chia theo 4 tổ. Cán bộ tổ và GVCN ghi nhận vi phạm và biểu dương việc tốt theo tiết học thực tế.
            </p>
          </div>

          {/* Action Buttons: Add Violation / Add Praise */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenModal('praise')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Tuyên dương việc tốt
            </button>
            <button
              onClick={() => handleOpenModal('deduction')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              - Ghi nhận vi phạm
            </button>
          </div>
        </div>

        {/* View Mode & Day Tabs */}
        <div className="pt-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'day' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Ngày Học
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'week' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lịch Tuần {config.currentWeek}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'month' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng / Học kỳ
            </button>
          </div>

          {/* Days bar (when viewMode is 'day') */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {daysList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedDay === d.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Session Switcher: Sáng / Chiều */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setSelectedSession('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedSession === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả 2 buổi
            </button>
            <button
              onClick={() => setSelectedSession('morning')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedSession === 'morning' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Sáng (Tiết 1-5)
            </button>
            <button
              onClick={() => setSelectedSession('afternoon')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedSession === 'afternoon' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              Chiều (Tiết 1-5)
            </button>
          </div>
        </div>

        {/* Group Selector & Search */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Groups 1, 2, 3, 4 filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Tổ:
            </span>
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Tất cả 4 tổ
            </button>
            {([1, 2, 3, 4] as GroupNumber[]).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedGroup === g
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                Tổ {g}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm học sinh, lỗi, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh Sách Ghi Nhận ({displayedLogs.length} mục)
            </span>
            {viewMode === 'day' && (
              <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                {getDayLabelVi(selectedDay)} — Tuần {config.currentWeek}
              </span>
            )}
          </div>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Chưa có ghi nhận nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không có lượt vi phạm hoặc tuyên dương nào khớp với bộ lọc ngày, buổi hoặc tổ đã chọn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4">Thời Gian & Buổi</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-4">Tổ</th>
                  <th className="py-3 px-4">Tiêu Chí (Mã nội dung)</th>
                  <th className="py-3 px-4 text-center">Điểm +/-</th>
                  <th className="py-3 px-4">Nội Dung Chi Tiết / Ghi Chú</th>
                  <th className="py-3 px-4">Người Ghi Nhận</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLogs.map((log) => {
                  const isPraise = log.delta > 0;
                  const isSevere = log.criteriaName.includes('Sử dụng ĐT') || log.criteriaName.includes('không phép') || log.delta <= -3;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Thời gian */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {getDayLabelVi(log.dayOfWeek)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          {log.session === 'morning' ? (
                            <span className="text-amber-600 font-medium">Sáng (Tiết {log.period})</span>
                          ) : (
                            <span className="text-indigo-600 font-medium">Chiều (Tiết {log.period})</span>
                          )}
                          <span>• Tuần {log.week}</span>
                        </div>
                      </td>

                      {/* Học sinh */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.studentName}</div>
                        <div className="text-[10px] text-slate-400">{log.studentId}</div>
                      </td>

                      {/* Tổ */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          Tổ {log.group}
                        </span>
                      </td>

                      {/* Tiêu chí */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isPraise ? 'text-emerald-700' : 'text-slate-800'
                            }`}
                          >
                            {log.criteriaName}
                          </span>
                          {isSevere && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                              Nghiêm trọng
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{log.category}</span>
                      </td>

                      {/* Điểm +/- */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-black text-xs ${
                            isPraise
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPraise ? `+${log.delta}` : log.delta}đ
                        </span>
                      </td>

                      {/* Ghi chú */}
                      <td className="py-3 px-4 max-w-xs text-slate-600">
                        {log.note || <span className="text-slate-300 italic">Không có ghi chú</span>}
                      </td>

                      {/* Người ghi nhận */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        <div className="font-medium text-slate-700">{log.loggedByName}</div>
                        <div className="text-[10px] text-slate-400">{log.loggedByRole}</div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xoá mục ghi nhận này của học sinh "${log.studentName}" không?`)) {
                              onDeleteLog(log.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xoá mục này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Thêm Ghi Nhận Vi Phạm / Tuyên Dương */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                {modalType === 'praise' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Tuyên Dương Việc Tốt (Điểm Cộng)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Ghi Nhận Vi Phạm (Điểm Trừ)</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              {/* Chọn Tổ và Chọn học sinh theo tổ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tổ sinh hoạt:
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as GroupNumber);
                      setFormGroup(val);
                      const filtered = val === 'all' ? students : students.filter((s) => s.group === val);
                      if (filtered.length > 0) {
                        setFormStudentId(filtered[0].id);
                      }
                    }}
                    className="w-full bg-indigo-50/60 border border-indigo-200 rounded-lg p-2 font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Tất cả ({students.length} HS)</option>
                    {([1, 2, 3, 4] as GroupNumber[]).map((g) => (
                      <option key={g} value={g}>
                        Tổ {g} ({students.filter((s) => s.group === g).length} HS)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn Học Sinh ({modalStudents.length} học sinh):
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    {modalStudents.length === 0 ? (
                      <option value="">(Không có học sinh trong tổ này)</option>
                    ) : (
                      modalStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.code} - Tổ {s.group} - {s.role})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Chọn tiêu chí */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiêu chí chấm điểm (Tự động đồng bộ theo cấu hình):
                </label>
                <select
                  value={formCriteriaId}
                  onChange={(e) => setFormCriteriaId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  {filteredCriteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.category}] {c.codeName} ({c.delta > 0 ? `+${c.delta}` : c.delta} điểm)
                    </option>
                  ))}
                </select>
              </div>

              {/* Thời gian: Ngày, Buổi, Tiết học */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ:</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  >
                    {daysList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Buổi học:</label>
                  <select
                    value={formSession}
                    onChange={(e) => setFormSession(e.target.value as 'morning' | 'afternoon')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="morning">Buổi sáng</option>
                    <option value="afternoon">Buổi chiều</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết học (1-5):</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={1}>Tiết 1</option>
                    <option value={2}>Tiết 2</option>
                    <option value={3}>Tiết 3</option>
                    <option value={4}>Tiết 4</option>
                    <option value={5}>Tiết 5</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú chi tiết */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả cụ thể / Ghi chú:
                </label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Môn Toán, quên không làm câu 4 sách bài tập; hoặc xung phong giải bài khó..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Người ghi nhận info */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                Ghi nhận bởi: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.title})
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg font-semibold shadow-xs transition-colors ${
                    modalType === 'praise'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
