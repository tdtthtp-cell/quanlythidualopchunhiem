import React from 'react';
import {
  Award,
  Calendar,
  Users,
  Settings,
  Bell,
  Sliders,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Send,
  Database,
  ChevronRight,
  BookOpen,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { ClassConfig, CurrentUser, UserRole, GroupNumber, AccessCodesConfig } from '../types';

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
  studentCount?: number;
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
  onOpenStudentMgmt,
  onOpenBackup,
  onOpenManageAccessCodes,
  studentCount = 0,
}) => {
  const weeks = Array.from({ length: 35 }, (_, i) => i + 1);

  const currentRoleValue =
    currentUser.role === 'teacher'
      ? 'teacher'
      : currentUser.role === 'team_leader'
      ? `team_leader_${currentUser.groupAccess}`
      : currentUser.role === 'class_monitor'
      ? 'class_monitor'
      : 'student';

  const handleSelectRole = (newRoleValue: string) => {
    if (newRoleValue === currentRoleValue) return;
    if (newRoleValue === 'student') {
      onChangeUser({
        role: 'student',
        name: 'Học sinh / Phụ huynh',
        groupAccess: 'all',
        title: 'Tra cứu kết quả rèn luyện',
      });
    } else {
      // Trigger access code authentication modal
      onRequestRoleChange(newRoleValue);
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Quản Lý Thi Đua Lớp Chủ Nhiệm
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {config.className}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                  Năm học {config.academicYear}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200" title="Dữ liệu được lưu trữ và tự động đồng bộ tức thì giữa điện thoại, máy tính và máy tính bảng qua Cloud Firestore">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đồng bộ đa thiết bị
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {config.schoolName} • GVCN: <span className="font-medium text-slate-700">{config.homeroomTeacher}</span>
              </p>
            </div>
          </div>

          {/* Quick Selectors: Week & Role & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Week & Semester Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <span className="text-xs font-semibold text-slate-500 pl-2 pr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tuần:
              </span>
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
                className="bg-white text-xs font-semibold text-indigo-700 border border-slate-200 rounded px-2 py-1 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} ({w <= 18 ? 'HK I' : 'HK II'})
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5">
                {config.currentWeek <= 18 ? 'Học kỳ 1 (18 tuần)' : 'Học kỳ 2 (17 tuần)'}
              </span>
            </div>

            {/* Role Switcher with Auth Protection */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <span className="text-xs font-semibold text-slate-500 pl-2 pr-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Quyền:
              </span>
              <select
                aria-label="Chọn vai trò người dùng"
                value={currentRoleValue}
                onChange={(e) => handleSelectRole(e.target.value)}
                className="bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded px-2 py-1 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="teacher">🎓 Giáo viên chủ nhiệm (Khóa mã)</option>
                <option value="team_leader_1">🚩 Tổ trưởng Tổ 1 (Khóa mã)</option>
                <option value="team_leader_2">🚩 Tổ trưởng Tổ 2 (Khóa mã)</option>
                <option value="team_leader_3">🚩 Tổ trưởng Tổ 3 (Khóa mã)</option>
                <option value="team_leader_4">🚩 Tổ trưởng Tổ 4 (Khóa mã)</option>
                <option value="class_monitor">⭐ Ban cán sự (Khóa mã)</option>
                <option value="student">👨‍👩‍👧 Học sinh / Phụ huynh (Công khai)</option>
              </select>
            </div>

            {/* Manage Access Codes Button (GVCN) */}
            <button
              onClick={onOpenManageAccessCodes}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors"
              title="Quản lý và cấp mã phân quyền đăng nhập cho cán bộ lớp"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mã Phân Quyền</span>
            </button>

            {/* Urgent Alerts Bell */}
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Thông báo tức thì vi phạm nghiêm trọng"
            >
              <Bell className="w-4 h-4" />
              {severeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {severeAlertCount}
                </span>
              )}
            </button>

            {/* Config & Backup Buttons */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={onOpenCriteriaConfig}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                title="Cấu hình tiêu chí chấm điểm"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenBackup}
                className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                title="Sao lưu & Đồng bộ dữ liệu"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Cài đặt thông tin lớp"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            Tổng quan & Thống kê
          </button>

          <button
            onClick={() => onSelectTab('daily_logs')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'daily_logs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Nhật ký sinh hoạt lớp (4 Tổ)
          </button>

          <button
            onClick={() => onSelectTab('emulation_table')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'emulation_table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bảng điểm & Xếp hạng tuần
          </button>

          <button
            onClick={() => onSelectTab('students')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Danh sách học sinh ({studentCount})
          </button>

          <button
            onClick={() => onSelectTab('notifications')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            Thông báo Zalo & Email
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            Xuất Báo Cáo PDF Cá Nhân
          </button>
        </nav>
      </div>

      {/* Role Notice Indicator */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="font-semibold uppercase tracking-wider text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
            Đang đăng nhập:
          </span>
          <span className="font-medium text-slate-900">
            {currentUser.title} — {currentUser.name}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {currentUser.role !== 'teacher' ? (
              <button
                onClick={() => onRequestRoleChange('teacher')}
                className="underline font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Đăng nhập quyền GVCN <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onOpenManageAccessCodes}
                className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> Đổi mã phân quyền cán bộ
              </button>
            )}

            <button
              onClick={() =>
                onChangeUser({
                  role: 'student',
                  name: 'Học sinh / Phụ huynh',
                  groupAccess: 'all',
                  title: 'Tra cứu kết quả rèn luyện',
                })
              }
              className="text-slate-400 hover:text-rose-600 flex items-center gap-1"
              title="Đăng xuất quyền để chuyển về chế độ tra cứu"
            >
              <LogOut className="w-3 h-3" /> Thoát quyền
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
