import React, { useState, useRef, useEffect } from 'react';
import {
  Award,
  Calendar,
  CalendarClock,
  Users,
  Settings,
  Bell,
  Sliders,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Send,
  Database,
  BookOpen,
  KeyRound,
  LogOut,
  Crown,
  Building2,
  ChevronDown,
  UserCheck,
  Check,
} from 'lucide-react';
import {
  ClassConfig,
  CurrentUser,
  DelegatedUser,
  HomeroomClass,
} from '../types';

interface HeaderNavProps {
  config: ClassConfig;
  onUpdateConfig: (newConfig: ClassConfig) => void;
  currentUser: CurrentUser;
  onChangeUser: (user: CurrentUser) => void;
  onRequestRoleChange: (roleValue: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  severeAlertCount: number;
  onOpenAlerts: () => void;
  onOpenSettings: () => void;
  onOpenCriteriaConfig: () => void;
  onOpenStudentMgmt: () => void;
  onOpenBackup: () => void;
  onOpenManageAccessCodes: () => void;
  onOpenSuperAdminModal?: () => void;
  onSwitchHomeroomClass?: (cls: HomeroomClass) => void;
  homeroomClasses?: HomeroomClass[];
  studentCount?: number;
  delegatedUsers?: DelegatedUser[];
  pendingScheduleCount?: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  config,
  onUpdateConfig,
  currentUser,
  onChangeUser,
  onRequestRoleChange,
  activeTab,
  onSelectTab,
  severeAlertCount,
  onOpenAlerts,
  onOpenSettings,
  onOpenCriteriaConfig,
  onOpenBackup,
  onOpenManageAccessCodes,
  onOpenSuperAdminModal,
  onSwitchHomeroomClass,
  homeroomClasses = [],
  studentCount = 0,
  delegatedUsers = [],
  pendingScheduleCount = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const weeks = Array.from({ length: 35 }, (_, i) => i + 1);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isTeacher = currentUser.role === 'teacher';
  const isSuperOrTeacher = isSuperAdmin || isTeacher;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Format short class code: "Lớp 10A3" -> "10A3"
  const getShortClass = (clsName?: string) => {
    const raw = clsName || currentUser.assignedClassName || config.className || '10A3';
    return raw.replace(/^Lớp\s*/i, '').trim() || raw;
  };

  const activeShortClass = getShortClass(
    currentUser.assignedClassName || config.className
  );

  // Concise role label for the compact "Nút Quyền" button (NO email shown)
  const getShortRoleButtonLabel = (): string => {
    switch (currentUser.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'teacher':
        return `GVCN ${activeShortClass}`;
      case 'class_monitor':
        return `BCS ${activeShortClass}`;
      case 'team_leader':
        return `Tổ ${currentUser.groupAccess} • ${activeShortClass}`;
      case 'delegated':
        return `Admin ${activeShortClass}`;
      default:
        return `Xem • ${activeShortClass}`;
    }
  };

  const currentRoleValue =
    currentUser.role === 'super_admin'
      ? 'super_admin'
      : currentUser.role === 'teacher'
      ? 'teacher'
      : currentUser.role === 'team_leader'
      ? `team_leader_${currentUser.groupAccess}`
      : currentUser.role === 'class_monitor'
      ? 'class_monitor'
      : currentUser.role === 'delegated'
      ? 'delegated_prompt'
      : 'student';

  const handleSelectRole = (newRoleValue: string) => {
    setIsMenuOpen(false);
    if (newRoleValue === 'student') {
      onChangeUser({
        role: 'student',
        name: 'Học sinh / Phụ huynh',
        groupAccess: 'all',
        title: 'Chế độ xem tra cứu',
      });
    } else {
      onRequestRoleChange(newRoleValue);
    }
  };

  // Permission flags for visible tabs
  const canSeeNotificationsTab =
    isSuperOrTeacher ||
    currentUser.role === 'class_monitor' ||
    (currentUser.role === 'delegated' &&
      Boolean(currentUser.delegatedPermissions?.canSendNotice));

  const canSeeReportsTab =
    isSuperOrTeacher || currentUser.role === 'class_monitor';

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Top Row: Title on Left, Week + Unified Role/Function Button on Right */}
        <div className="flex items-center justify-between py-2.5 gap-3 border-b border-slate-100">
          {/* Left: App Title & Current Class */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  Thi Đua Lớp Chủ Nhiệm
                </h1>
                <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">
                  · {config.className}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {config.schoolName} · Năm học {config.academicYear} · GVCN:{' '}
                <span className="font-semibold text-slate-700">
                  {config.homeroomTeacher}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Week Selector, Bell (if permitted), and Single Unified Role & Functions Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Compact Week Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
              <select
                aria-label="Chọn tuần học"
                value={config.currentWeek}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  const semester = w <= 18 ? 1 : 2;
                  onUpdateConfig({
                    ...config,
                    currentWeek: w,
                    currentSemester: semester,
                  });
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} ({w <= 18 ? 'HK I' : 'HK II'})
                  </option>
                ))}
              </select>
            </div>

            {/* Urgent Alerts Bell (Only shown for roles with notification access) */}
            {canSeeNotificationsTab && (
              <button
                type="button"
                onClick={onOpenAlerts}
                className="relative p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                title="Thông báo vi phạm cần lưu ý"
              >
                <Bell className="w-4 h-4" />
                {severeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white tabular-nums">
                    {severeAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* SINGLE UNIFIED ROLE & FUNCTIONS BUTTON ("Nút Quyền") */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
                  currentUser.role === 'super_admin'
                    ? 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
                    : currentUser.role === 'teacher'
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                    : currentUser.role === 'class_monitor' ||
                      currentUser.role === 'team_leader'
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : currentUser.role === 'delegated'
                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Mở bảng phân quyền & các chức năng theo vai trò"
              >
                {currentUser.role === 'super_admin' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{getShortRoleButtonLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>

              {/* POPOVER MENU: ROLE-SCOPED FUNCTIONS & COMPACT ACCOUNT SWITCHER */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs">
                  {/* 1. Current Active Role Summary (Compact, No Email) */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xs">
                          {getShortRoleButtonLabel()}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-semibold truncate">
                          {currentUser.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {isSuperAdmin
                          ? `Quản trị toàn hệ thống (${homeroomClasses.length} lớp)`
                          : `Phạm vi: ${
                              currentUser.assignedClassName || config.className
                            } ${
                              currentUser.groupAccess &&
                              currentUser.groupAccess !== 'all'
                                ? `• Tổ ${currentUser.groupAccess}`
                                : '• Toàn lớp'
                            }`}
                      </p>
                    </div>

                    {currentUser.role !== 'student' && (
                      <button
                        type="button"
                        onClick={() => handleSelectRole('student')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-bold text-[11px] shrink-0 transition-colors"
                        title="Đăng xuất về chế độ Xem"
                      >
                        <LogOut className="w-3 h-3" />
                        Thoát
                      </button>
                    )}
                  </div>

                  {/* 2. Super Admin Only: Quick Multi-Class Switcher */}
                  {isSuperAdmin && homeroomClasses.length > 1 && (
                    <div className="p-3 border-b border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                        <span>Chuyển lớp làm việc (Super Admin):</span>
                        <span className="text-indigo-600 font-semibold">
                          {homeroomClasses.length} lớp
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {homeroomClasses.map((cls) => {
                          const isCurrent = cls.className === config.className;
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => {
                                if (onSwitchHomeroomClass) {
                                  onSwitchHomeroomClass(cls);
                                }
                                setIsMenuOpen(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {getShortClass(cls.className)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Role-Scoped Management Functions (Only displayed for authorized roles) */}
                  {isSuperOrTeacher && (
                    <div className="p-2 border-b border-slate-100 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isSuperAdmin
                          ? 'Chức năng Quản trị Đa Lớp'
                          : `Chức năng Quản lý ${activeShortClass}`}
                      </div>

                      {onOpenSuperAdminModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenSuperAdminModal();
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-amber-50 text-slate-800 hover:text-amber-900 font-semibold transition-colors text-left"
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              {isSuperAdmin
                                ? 'Quản lý Đa Lớp & Phân quyền BCS'
                                : `Phân quyền Ban cán sự ${activeShortClass}`}
                            </span>
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenManageAccessCodes();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 font-semibold transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>
                            Mã khóa Cán bộ & Uỷ quyền ({activeShortClass})
                          </span>
                        </span>
                        {delegatedUsers.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold tabular-nums">
                            {delegatedUsers.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenCriteriaConfig();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-left"
                      >
                        <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Cấu hình tiêu chí chấm điểm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Cài đặt thông tin lớp {activeShortClass}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-left"
                      >
                        <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sao lưu & Khôi phục dữ liệu</span>
                      </button>
                    </div>
                  )}

                  {/* 4. Switch Role / Login Section (Short, concise labels, NO email) */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chuyển đổi quyền sử dụng
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectRole('super_admin')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-bold border text-left transition-colors ${
                          currentRoleValue === 'super_admin'
                            ? 'bg-slate-900 text-amber-300 border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Super Admin</span>
                        </span>
                        {currentRoleValue === 'super_admin' && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectRole('teacher')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-bold border text-left transition-colors ${
                          currentRoleValue === 'teacher'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="truncate">
                          GVCN {activeShortClass}
                        </span>
                        {currentRoleValue === 'teacher' && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectRole('class_monitor')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-bold border text-left transition-colors ${
                          currentRoleValue === 'class_monitor'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="truncate">BCS {activeShortClass}</span>
                        {currentRoleValue === 'class_monitor' && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectRole('delegated_prompt')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-bold border text-left transition-colors ${
                          currentUser.role === 'delegated'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1 truncate">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Admin / Uỷ quyền</span>
                        </span>
                        {currentUser.role === 'delegated' && (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>
                    </div>

                    {/* 4 Team Leaders Compact Row */}
                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {([1, 2, 3, 4] as const).map((g) => {
                        const val = `team_leader_${g}`;
                        const active = currentRoleValue === val;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleSelectRole(val)}
                            className={`py-1.5 px-1 rounded-lg font-bold text-center border transition-colors ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Tổ {g}
                          </button>
                        );
                      })}
                    </div>

                    {/* Public Viewer Mode */}
                    <button
                      type="button"
                      onClick={() => handleSelectRole('student')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold border transition-colors ${
                        currentRoleValue === 'student'
                          ? 'bg-slate-200 text-slate-900 border-slate-300'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span>Chế độ Xem (Học sinh / Phụ huynh)</span>
                      {currentRoleValue === 'student' && (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role-Filtered Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Tổng quan
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('daily_logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'daily_logs'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Nhật ký sinh hoạt
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Lịch & Nhắc việc
            {pendingScheduleCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                  activeTab === 'schedule'
                    ? 'bg-white text-indigo-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingScheduleCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('emulation_table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'emulation_table'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Bảng điểm tuần
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('students')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Học sinh ({studentCount})
          </button>

          {canSeeNotificationsTab && (
            <button
              type="button"
              onClick={() => onSelectTab('notifications')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Thông báo PH
            </button>
          )}

          {canSeeReportsTab && (
            <button
              type="button"
              onClick={() => onSelectTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Báo cáo PDF
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
