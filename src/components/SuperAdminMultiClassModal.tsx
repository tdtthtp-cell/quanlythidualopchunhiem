import React, { useState } from 'react';
import {
  Crown,
  Building2,
  UserCheck,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  GraduationCap,
  ArrowRightLeft,
  Search,
} from 'lucide-react';
import {
  HomeroomClass,
  ClassConfig,
  AccessCodesConfig,
  Student,
  CurrentUser,
} from '../types';
import { SUPER_ADMIN_EMAIL } from '../firebase';

interface SuperAdminMultiClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeroomClasses: HomeroomClass[];
  currentConfig: ClassConfig;
  currentAccessCodes: AccessCodesConfig;
  students: Student[];
  currentUser: CurrentUser;
  onSaveHomeroomClass: (item: HomeroomClass) => void;
  onDeleteHomeroomClass: (classId: string) => void;
  onSwitchHomeroomClass: (item: HomeroomClass) => void;
  onUpdateStudentRole?: (studentId: string, newRole: string) => void;
}

export const SuperAdminMultiClassModal: React.FC<SuperAdminMultiClassModalProps> = ({
  isOpen,
  onClose,
  homeroomClasses,
  currentConfig,
  students,
  currentUser,
  onSaveHomeroomClass,
  onDeleteHomeroomClass,
  onSwitchHomeroomClass,
  onUpdateStudentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'officers' | 'new_class'>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    homeroomClasses.find((c) => c.className === currentConfig.className)?.id ||
      homeroomClasses[0]?.id ||
      'class_10a3'
  );
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Add / Edit Class Form State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [formClassName, setFormClassName] = useState('Lớp 10A4');
  const [formGrade, setFormGrade] = useState<'10' | '11' | '12'>('10');
  const [formAcademicYear, setFormAcademicYear] = useState(
    currentConfig.academicYear || '2024 - 2025'
  );
  const [formSchoolName, setFormSchoolName] = useState(
    currentConfig.schoolName || 'THPT Hoàng Thành'
  );
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formTeacherEmail, setFormTeacherEmail] = useState('');
  const [formTeacherPhone, setFormTeacherPhone] = useState('');
  const [formStudentCount, setFormStudentCount] = useState(40);
  const [formTeacherCode, setFormTeacherCode] = useState('CN2401');
  const [formMonitorCode, setFormMonitorCode] = useState('LT2401');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';
  const canManageClasses = isSuperAdmin || currentUser.role === 'teacher';

  const selectedClass =
    homeroomClasses.find((c) => c.id === selectedClassId) || homeroomClasses[0];

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const generateCode = (prefix: string) => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${num}`;
  };

  // Start adding new class
  const handleStartAddClass = () => {
    setEditingClassId(null);
    setFormClassName('');
    setFormGrade('10');
    setFormAcademicYear(currentConfig.academicYear || '2024 - 2025');
    setFormSchoolName(currentConfig.schoolName || 'THPT Hoàng Thành');
    setFormTeacherName('');
    setFormTeacherEmail('');
    setFormTeacherPhone('');
    setFormStudentCount(40);
    setFormTeacherCode(generateCode('CN'));
    setFormMonitorCode(generateCode('LT'));
    setActiveTab('new_class');
  };

  // Start editing existing class
  const handleStartEditClass = (cls: HomeroomClass) => {
    setEditingClassId(cls.id);
    setFormClassName(cls.className);
    setFormGrade(cls.grade);
    setFormAcademicYear(cls.academicYear);
    setFormSchoolName(cls.schoolName);
    setFormTeacherName(cls.homeroomTeacher);
    setFormTeacherEmail(cls.teacherEmail);
    setFormTeacherPhone(cls.teacherPhone);
    setFormStudentCount(cls.studentCount);
    setFormTeacherCode(cls.accessCodes.teacher);
    setFormMonitorCode(cls.accessCodes.monitor);
    setActiveTab('new_class');
  };

  // Save Class (Create or Update)
  const handleSaveClassForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassName.trim() || !formTeacherName.trim()) return;

    const existing = editingClassId
      ? homeroomClasses.find((c) => c.id === editingClassId)
      : undefined;

    const cleanCodePrefix =
      formClassName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(-4) || '10A';

    const newClassObj: HomeroomClass = {
      id: editingClassId || `class_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      className: formClassName.trim(),
      grade: formGrade,
      academicYear: formAcademicYear.trim() || '2024 - 2025',
      schoolName: formSchoolName.trim() || 'THPT Hoàng Thành',
      homeroomTeacher: formTeacherName.trim(),
      teacherEmail: formTeacherEmail.trim() || 'gvcn@edu.vn',
      teacherPhone: formTeacherPhone.trim() || '0901234567',
      studentCount: Number(formStudentCount) || 36,
      isActive: true,
      officers: existing?.officers || {
        monitorName: 'Chưa chỉ định',
        viceAcademicName: 'Chưa chỉ định',
        viceLaborName: 'Chưa chỉ định',
        redFlagName: 'Chưa chỉ định',
        team1LeaderName: 'Chưa chỉ định',
        team2LeaderName: 'Chưa chỉ định',
        team3LeaderName: 'Chưa chỉ định',
        team4LeaderName: 'Chưa chỉ định',
      },
      accessCodes: existing?.accessCodes
        ? {
            ...existing.accessCodes,
            teacher: formTeacherCode.trim().toUpperCase(),
            monitor: formMonitorCode.trim().toUpperCase(),
          }
        : {
            teacher: formTeacherCode.trim().toUpperCase() || `CN_${cleanCodePrefix}`,
            monitor: formMonitorCode.trim().toUpperCase() || `LT_${cleanCodePrefix}`,
            team1: `TO1_${cleanCodePrefix}`,
            team2: `TO2_${cleanCodePrefix}`,
            team3: `TO3_${cleanCodePrefix}`,
            team4: `TO4_${cleanCodePrefix}`,
          },
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    onSaveHomeroomClass(newClassObj);
    setSelectedClassId(newClassObj.id);
    setActiveTab('classes');
    showFeedback(
      editingClassId
        ? `Đã cập nhật thông tin ${newClassObj.className} thành công!`
        : `Đã tạo mới ${newClassObj.className} (GVCN: ${newClassObj.homeroomTeacher}) thành công!`
    );
  };

  // Update officer or access code for selectedClass
  const handleUpdateSelectedClassOfficer = (
    field: keyof HomeroomClass['officers'],
    value: string,
    studentId?: string,
    roleTitle?: string
  ) => {
    if (!selectedClass) return;
    const updated: HomeroomClass = {
      ...selectedClass,
      officers: {
        ...selectedClass.officers,
        [field]: value,
      },
    };
    onSaveHomeroomClass(updated);

    // If editing the active class and a student was chosen, also sync their student.role
    if (
      selectedClass.className === currentConfig.className &&
      studentId &&
      roleTitle &&
      onUpdateStudentRole
    ) {
      onUpdateStudentRole(studentId, roleTitle);
    }
    showFeedback(`Đã cập nhật phân quyền Ban cán sự lớp ${selectedClass.className}!`);
  };

  const handleUpdateSelectedClassCode = (
    codeKey: keyof AccessCodesConfig,
    newCode: string
  ) => {
    if (!selectedClass) return;
    const updated: HomeroomClass = {
      ...selectedClass,
      accessCodes: {
        ...selectedClass.accessCodes,
        [codeKey]: newCode.toUpperCase().trim(),
      },
    };
    onSaveHomeroomClass(updated);
  };

  const handleRandomizeAllOfficerCodes = (cls: HomeroomClass) => {
    const suffix = Math.floor(100 + Math.random() * 900);
    const updated: HomeroomClass = {
      ...cls,
      accessCodes: {
        ...cls.accessCodes,
        monitor: `LT${suffix}`,
        team1: `TO1_${suffix}`,
        team2: `TO2_${suffix}`,
        team3: `TO3_${suffix}`,
        team4: `TO4_${suffix}`,
      },
    };
    onSaveHomeroomClass(updated);
    showFeedback(`Đã cấp mới toàn bộ mã khóa Ban cán sự & 4 Tổ trưởng của ${cls.className}!`);
  };

  const buildHandoverMessage = (cls: HomeroomClass) => {
    return `👑 [BÀN GIAO PHÂN QUYỀN QUẢN LÝ THI ĐUA — ${cls.className.toUpperCase()}]
🏫 Trường: ${cls.schoolName} (${cls.academicYear})
👨‍🏫 GVCN phụ trách: ${cls.homeroomTeacher} (${cls.teacherEmail})
🔑 Mã khóa GVCN: ${cls.accessCodes.teacher}

📋 PHÂN QUYỀN BAN CÁN SỰ LỚP & 4 TỔ TRƯỞNG:
• Lớp trưởng: ${cls.officers.monitorName} — Mã đăng nhập: ${cls.accessCodes.monitor}
• Lớp phó học tập: ${cls.officers.viceAcademicName} — Mã đăng nhập: ${cls.accessCodes.monitor}
• Lớp phó lao động: ${cls.officers.viceLaborName} — Mã đăng nhập: ${cls.accessCodes.monitor}
• Đội trưởng Cờ đỏ: ${cls.officers.redFlagName} — Mã đăng nhập: ${cls.accessCodes.monitor}
• Tổ trưởng Tổ 1: ${cls.officers.team1LeaderName} — Mã đăng nhập: ${cls.accessCodes.team1}
• Tổ trưởng Tổ 2: ${cls.officers.team2LeaderName} — Mã đăng nhập: ${cls.accessCodes.team2}
• Tổ trưởng Tổ 3: ${cls.officers.team3LeaderName} — Mã đăng nhập: ${cls.accessCodes.team3}
• Tổ trưởng Tổ 4: ${cls.officers.team4LeaderName} — Mã đăng nhập: ${cls.accessCodes.team4}

📌 Hướng dẫn: Ban cán sự và Tổ trưởng chọn đúng vai trò trên thanh công cụ và nhập Mã đăng nhập để ghi sổ sinh hoạt lớp, phân công trực nhật và gửi nhắc việc.`;
  };

  const filteredClasses = homeroomClasses.filter((cls) => {
    if (!searchClassQuery.trim()) return true;
    const q = searchClassQuery.toLowerCase();
    return (
      cls.className.toLowerCase().includes(q) ||
      cls.homeroomTeacher.toLowerCase().includes(q) ||
      cls.grade.toLowerCase().includes(q)
    );
  });

  const isSelectedCurrentActive =
    selectedClass && selectedClass.className === currentConfig.className;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Trung Tâm Quản Trị Hệ Thống Đa Lớp & Phân Quyền Ban Cán Sự
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Super Admin • {SUPER_ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Quản lý nhiều lớp chủ nhiệm, điều phối Giáo viên chủ nhiệm và phân quyền trực tiếp cho Ban cán sự lớp & 4 Tổ trưởng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 text-sm font-bold"
          >
            ✕ Đóng
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Navigation Sub-tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'classes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Danh Sách Lớp Chủ Nhiệm ({homeroomClasses.length} lớp)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('officers')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'officers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Phân Quyền Ban Cán Sự Lớp & 4 Tổ Trưởng
            </button>

            {canManageClasses && (
              <button
                type="button"
                onClick={handleStartAddClass}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'new_class'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                {editingClassId ? 'Chỉnh Sửa Lớp Chủ Nhiệm' : '+ Thêm Lớp Chủ Nhiệm Mới'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Đang làm việc tại:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              {currentConfig.className} (GVCN: {currentConfig.homeroomTeacher})
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: MULTI-CLASS LIST & SWITCHER */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hệ Thống Quản Lý Nhiều Lớp Chủ Nhiệm ({homeroomClasses.length} lớp đang hoạt động)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Super Admin ({SUPER_ADMIN_EMAIL}) có thể chuyển đổi nhanh giữa các lớp chủ nhiệm, phân công GVCN và cấp mã khóa cho Ban cán sự từng lớp.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchClassQuery}
                    onChange={(e) => setSearchClassQuery(e.target.value)}
                    placeholder="Tìm tên lớp, khối, tên GVCN..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => {
                  const isCurrentActive = cls.className === currentConfig.className;
                  return (
                    <div
                      key={cls.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                        isCurrentActive
                          ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900">
                                {cls.className}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                Khối {cls.grade}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {cls.schoolName} • {cls.academicYear}
                            </span>
                          </div>

                          {isCurrentActive ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đang mở
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Đang hoạt động
                            </span>
                          )}
                        </div>

                        {/* Teacher & Officers Summary Box */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">GV chủ nhiệm:</span>
                            <strong className="text-slate-900">{cls.homeroomTeacher}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Sĩ số lớp:</span>
                            <strong className="text-indigo-700">
                              {isCurrentActive ? students.length : cls.studentCount} học sinh (4 Tổ)
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Lớp trưởng:</span>
                            <span className="font-semibold text-slate-800">
                              {cls.officers.monitorName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã GVCN / Lớp trưởng:</span>
                            <span className="font-mono font-bold text-indigo-700">
                              {cls.accessCodes.teacher} / {cls.accessCodes.monitor}
                            </span>
                          </div>
                        </div>

                        {/* 4 Team Leaders Preview */}
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 truncate">
                            <strong>Tổ 1:</strong> {cls.officers.team1LeaderName}
                          </div>
                          <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 truncate">
                            <strong>Tổ 2:</strong> {cls.officers.team2LeaderName}
                          </div>
                          <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 truncate">
                            <strong>Tổ 3:</strong> {cls.officers.team3LeaderName}
                          </div>
                          <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 truncate">
                            <strong>Tổ 4:</strong> {cls.officers.team4LeaderName}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          {!isCurrentActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchHomeroomClass(cls);
                                setSelectedClassId(cls.id);
                                showFeedback(
                                  `Đã chuyển không gian làm việc sang ${cls.className} (GVCN: ${cls.homeroomTeacher})!`
                                );
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xs transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Chuyển sang lớp này
                            </button>
                          ) : (
                            <div className="flex-1 text-center py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                              ✓ Lớp đang làm việc hiện tại
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              setActiveTab('officers');
                            }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-colors"
                            title="Phân quyền Ban cán sự lớp & 4 Tổ trưởng"
                          >
                            Phân quyền BCS
                          </button>
                        </div>

                        {canManageClasses && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(buildHandoverMessage(cls));
                                setCopiedId(cls.id);
                                setTimeout(() => setCopiedId(null), 2500);
                              }}
                              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              {copiedId === cls.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Đã chép thẻ bàn giao
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Sao chép mã bàn giao Zalo
                                </>
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditClass(cls)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200"
                                title="Chỉnh sửa thông tin lớp"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {homeroomClasses.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Bạn có chắc muốn xoá lớp chủ nhiệm "${cls.className}" khỏi danh sách đa lớp không?`
                                      )
                                    ) {
                                      onDeleteHomeroomClass(cls.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200"
                                  title="Xoá lớp"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PHÂN QUYỀN BAN CÁN SỰ LỚP & 4 TỔ TRƯỞNG */}
          {activeTab === 'officers' && selectedClass && (
            <div className="space-y-5">
              {/* Class Selector Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700">Chọn lớp cần phân quyền Ban cán sự:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {homeroomClasses.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          selectedClass.id === cls.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cls.className} ({cls.homeroomTeacher})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRandomizeAllOfficerCodes(selectedClass)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl font-bold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Đổi mới mã BCS & 4 Tổ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(buildHandoverMessage(selectedClass));
                      setCopiedId(`officers_${selectedClass.id}`);
                      setTimeout(() => setCopiedId(null), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-2xs transition-colors"
                  >
                    {copiedId === `officers_${selectedClass.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Đã chép bảng phân quyền!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Chép Bảng Phân Quyền Gửi Zalo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section 1: Ban Cán Sự Lớp (Lớp trưởng, Lớp phó, Cờ đỏ) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Ban Cán Sự Lớp — {selectedClass.className}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Quản lý chung toàn lớp, theo dõi nhật ký 4 tổ, phân công trực nhật & nhắc việc
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Mã khóa Ban Cán Sự:</span>
                      <input
                        type="text"
                        value={selectedClass.accessCodes.monitor}
                        onChange={(e) =>
                          handleUpdateSelectedClassCode('monitor', e.target.value)
                        }
                        className="w-28 text-center font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* 4 Key Class Officers */}
                  {(
                    [
                      {
                        field: 'monitorName',
                        label: 'Lớp trưởng (Quản lý chung 4 tổ)',
                        roleTitle: 'Lớp trưởng',
                      },
                      {
                        field: 'viceAcademicName',
                        label: 'Lớp phó Học tập (Theo dõi truy bài & học tập)',
                        roleTitle: 'Lớp phó học tập',
                      },
                      {
                        field: 'viceLaborName',
                        label: 'Lớp phó Lao động (Phụ trách trực nhật & vệ sinh)',
                        roleTitle: 'Cán sự vệ sinh',
                      },
                      {
                        field: 'redFlagName',
                        label: 'Đội trưởng Cờ đỏ (Kiểm tra chuyên cần & tác phong)',
                        roleTitle: 'Lớp trưởng',
                      },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.field}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{item.label}</span>
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          Đương nhiệm: {selectedClass.officers[item.field] || 'Chưa chỉ định'}
                        </span>
                      </div>

                      {isSelectedCurrentActive ? (
                        <select
                          aria-label={item.label}
                          value={selectedClass.officers[item.field]}
                          onChange={(e) => {
                            const st = students.find((s) => s.fullName === e.target.value);
                            handleUpdateSelectedClassOfficer(
                              item.field,
                              e.target.value,
                              st?.id,
                              item.roleTitle
                            );
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 min-w-[200px]"
                        >
                          <option value={selectedClass.officers[item.field]}>
                            {selectedClass.officers[item.field]}
                          </option>
                          {students.map((st) => (
                            <option key={st.id} value={st.fullName}>
                              {st.fullName} (Tổ {st.group} - {st.code})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedClass.officers[item.field]}
                          onChange={(e) =>
                            handleUpdateSelectedClassOfficer(item.field, e.target.value)
                          }
                          placeholder="Nhập họ tên học sinh..."
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 min-w-[200px]"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Section 2: 4 Tổ Trưởng (Tổ 1, 2, 3, 4) & Mã Khóa Từng Tổ */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Phân Quyền 4 Tổ Trưởng — {selectedClass.className}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Mỗi Tổ trưởng được cấp mã khóa riêng để chấm điểm tuyên dương / vi phạm của tổ mình
                        </p>
                      </div>
                    </div>
                  </div>

                  {(
                    [
                      {
                        group: 1,
                        field: 'team1LeaderName',
                        codeKey: 'team1',
                        label: 'Tổ trưởng Tổ 1',
                      },
                      {
                        group: 2,
                        field: 'team2LeaderName',
                        codeKey: 'team2',
                        label: 'Tổ trưởng Tổ 2',
                      },
                      {
                        group: 3,
                        field: 'team3LeaderName',
                        codeKey: 'team3',
                        label: 'Tổ trưởng Tổ 3',
                      },
                      {
                        group: 4,
                        field: 'team4LeaderName',
                        codeKey: 'team4',
                        label: 'Tổ trưởng Tổ 4',
                      },
                    ] as const
                  ).map((team) => {
                    const groupStudents = students.filter((s) => s.group === team.group);
                    return (
                      <div
                        key={team.group}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] flex items-center justify-center font-black">
                              {team.group}
                            </span>
                            {team.label}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] text-slate-500">Mã Tổ {team.group}:</span>
                            <input
                              type="text"
                              value={selectedClass.accessCodes[team.codeKey]}
                              onChange={(e) =>
                                handleUpdateSelectedClassCode(team.codeKey, e.target.value)
                              }
                              className="w-24 text-center font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-0.5 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500">
                            Học sinh giữ chức Tổ trưởng:
                          </span>
                          {isSelectedCurrentActive ? (
                            <select
                              aria-label={team.label}
                              value={selectedClass.officers[team.field]}
                              onChange={(e) => {
                                const st = groupStudents.find(
                                  (s) => s.fullName === e.target.value
                                );
                                handleUpdateSelectedClassOfficer(
                                  team.field,
                                  e.target.value,
                                  st?.id,
                                  'Tổ trưởng'
                                );
                              }}
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 min-w-[210px]"
                            >
                              <option value={selectedClass.officers[team.field]}>
                                {selectedClass.officers[team.field]}
                              </option>
                              {groupStudents.map((st) => (
                                <option key={st.id} value={st.fullName}>
                                  {st.fullName} ({st.code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={selectedClass.officers[team.field]}
                              onChange={(e) =>
                                handleUpdateSelectedClassOfficer(team.field, e.target.value)
                              }
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 min-w-[210px]"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADD / EDIT HOMEROOM CLASS */}
          {activeTab === 'new_class' && canManageClasses && (
            <form
              onSubmit={handleSaveClassForm}
              className="max-w-2xl mx-auto p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingClassId
                      ? 'Cập Nhật Thông Tin Lớp Chủ Nhiệm'
                      : 'Thêm Lớp Chủ Nhiệm Mới Vào Hệ Thống'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mở rộng hệ thống quản lý thi đua cho nhiều lớp chủ nhiệm trong trường
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Lớp <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    placeholder="VD: Lớp 10A4, Lớp 12A1..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp:</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value as '10' | '11' | '12')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sĩ số dự kiến:</label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={formStudentCount}
                    onChange={(e) => setFormStudentCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Trường:</label>
                  <input
                    type="text"
                    value={formSchoolName}
                    onChange={(e) => setFormSchoolName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Năm học:</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ tên GV Chủ Nhiệm <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Hải"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email GVCN:</label>
                  <input
                    type="email"
                    value={formTeacherEmail}
                    onChange={(e) => setFormTeacherEmail(e.target.value)}
                    placeholder="gvcn@edu.vn"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SĐT / Zalo GVCN:</label>
                  <input
                    type="text"
                    value={formTeacherPhone}
                    onChange={(e) => setFormTeacherPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã khóa đăng nhập GVCN:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTeacherCode}
                    onChange={(e) => setFormTeacherCode(e.target.value.toUpperCase())}
                    className="w-full bg-indigo-50 border border-indigo-300 rounded-xl px-3 py-2 font-mono font-bold text-indigo-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã khóa Ban Cán Sự Lớp (Lớp trưởng):
                  </label>
                  <input
                    type="text"
                    required
                    value={formMonitorCode}
                    onChange={(e) => setFormMonitorCode(e.target.value.toUpperCase())}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('classes')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  {editingClassId ? 'Lưu Cập Nhật Lớp' : 'Tạo Lớp Chủ Nhiệm Mới'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
