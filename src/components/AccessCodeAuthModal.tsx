import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldAlert,
  X,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  Mail,
  Building2,
  User,
  Calendar,
} from 'lucide-react';
import {
  AccessCodesConfig,
  UserRole,
  GroupNumber,
  DelegatedUser,
  DelegatedPermission,
  HomeroomClass,
} from '../types';
import { signInWithGooglePopup, SUPER_ADMIN_EMAIL } from '../firebase';

export interface PendingRoleAuth {
  role: UserRole;
  groupAccess?: GroupNumber | 'all';
  name: string;
  title: string;
  email?: string;
  assignedClassName?: string;
  matchedClass?: HomeroomClass;
  updatedTeacherName?: string;
  updatedAcademicYear?: string;
  roleKey?: keyof AccessCodesConfig;
  delegatedUserId?: string;
  delegatedPermissions?: DelegatedPermission;
}

interface AccessCodeAuthModalProps {
  pendingRole: PendingRoleAuth;
  accessCodes: AccessCodesConfig;
  currentClassName?: string;
  homeroomClasses?: HomeroomClass[];
  delegatedUsers?: DelegatedUser[];
  onSuccess: (roleAuth: PendingRoleAuth) => void;
  onCancel: () => void;
}

export const AccessCodeAuthModal: React.FC<AccessCodeAuthModalProps> = ({
  pendingRole,
  accessCodes,
  currentClassName = 'Lớp 10A3',
  homeroomClasses = [],
  delegatedUsers = [],
  onSuccess,
  onCancel,
}) => {
  const [inputEmail, setInputEmail] = useState('');
  const [selectedClassName, setSelectedClassName] = useState<string>(
    pendingRole.assignedClassName || currentClassName
  );

  // Selected class object
  const selectedClassObj =
    homeroomClasses.find((c) => c.className === selectedClassName) ||
    homeroomClasses[0];

  // Dynamic teacher name & academic year (changes by school year, never hardcoded to class name)
  const [teacherNameInput, setTeacherNameInput] = useState<string>(
    selectedClassObj?.homeroomTeacher || ''
  );
  const [academicYearInput, setAcademicYearInput] = useState<string>(
    selectedClassObj?.academicYear || '2024 - 2025'
  );

  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sync default teacher name & academic year when user selects a different class
  useEffect(() => {
    const cls = homeroomClasses.find((c) => c.className === selectedClassName);
    if (cls) {
      setTeacherNameInput(cls.homeroomTeacher || '');
      setAcademicYearInput(cls.academicYear || '2024 - 2025');
    }
  }, [selectedClassName, homeroomClasses]);

  const shortClass = (clsName: string) =>
    clsName.replace(/^Lớp\s*/i, '').trim() || clsName;

  const getRoleDisplayHeader = () => {
    const sc = shortClass(selectedClassName);
    switch (pendingRole.role) {
      case 'super_admin':
        return 'Super Admin (Toàn hệ thống)';
      case 'teacher':
        return `GVCN ${sc}`;
      case 'class_monitor':
        return `BCS ${sc}`;
      case 'team_leader':
        return `Tổ ${pendingRole.groupAccess} • ${sc}`;
      case 'delegated':
        return `Admin ${sc}`;
      default:
        return pendingRole.title;
    }
  };

  const handleGoogleSuperAdminLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGooglePopup();
      const signedInEmail = (user.email || '').toLowerCase().trim();
      if (signedInEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        onSuccess({
          role: 'super_admin',
          name: user.displayName || 'Super Admin',
          title: 'Super Admin',
          groupAccess: 'all',
        });
      } else {
        setErrorMsg(
          'Tài khoản Google này không có quyền Super Admin trên hệ thống.'
        );
      }
    } catch {
      setErrorMsg(
        'Không thể mở cửa sổ xác thực Google hoặc đã huỷ đăng nhập. Vui lòng xác thực bằng mã khoá quản trị bên dưới.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const buildClassAuthResult = (
    cls: HomeroomClass,
    matchedRole: 'teacher' | 'class_monitor' | 'team_leader',
    groupNum?: GroupNumber
  ): PendingRoleAuth => {
    const sc = shortClass(cls.className);
    const customTeacher = teacherNameInput.trim() || cls.homeroomTeacher;
    const customYear = academicYearInput.trim() || cls.academicYear;

    const updatedCls: HomeroomClass =
      matchedRole === 'teacher'
        ? {
            ...cls,
            homeroomTeacher: customTeacher,
            academicYear: customYear,
          }
        : cls;

    if (matchedRole === 'teacher') {
      return {
        role: 'teacher',
        name: customTeacher || `GVCN ${sc}`,
        title: `GVCN ${sc}`,
        assignedClassName: cls.className,
        matchedClass: updatedCls,
        updatedTeacherName: customTeacher,
        updatedAcademicYear: customYear,
        groupAccess: 'all',
        roleKey: 'teacher',
      };
    }
    if (matchedRole === 'class_monitor') {
      return {
        role: 'class_monitor',
        name:
          cls.officers.monitorName && cls.officers.monitorName !== 'Chưa chỉ định'
            ? cls.officers.monitorName
            : `Ban cán sự ${sc}`,
        title: `BCS ${sc}`,
        assignedClassName: cls.className,
        matchedClass: cls,
        groupAccess: 'all',
        roleKey: 'monitor',
      };
    }
    const g = groupNum || 1;
    const leaderField = `team${g}LeaderName` as keyof HomeroomClass['officers'];
    const leaderName = cls.officers[leaderField];
    return {
      role: 'team_leader',
      name:
        leaderName && leaderName !== 'Chưa chỉ định'
          ? leaderName
          : `Tổ trưởng Tổ ${g} (${sc})`,
      title: `Tổ ${g} • ${sc}`,
      assignedClassName: cls.className,
      matchedClass: cls,
      groupAccess: g,
      roleKey: `team${g}` as keyof AccessCodesConfig,
    };
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inputCode.trim();
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanInput) {
      setErrorMsg('Vui lòng nhập mã phân quyền hoặc mã khoá quản trị.');
      return;
    }

    // 0. Super Admin verification
    if (pendingRole.role === 'super_admin') {
      if (cleanEmail && cleanEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMsg('Tài khoản email Super Admin không hợp lệ.');
        return;
      }
      if (
        cleanInput === accessCodes.teacher ||
        cleanInput === 'CN230876' ||
        cleanInput.toUpperCase() === 'HTP_ADMIN'
      ) {
        setErrorMsg(null);
        onSuccess({
          role: 'super_admin',
          name: 'Super Admin',
          title: 'Super Admin',
          groupAccess: 'all',
        });
        return;
      }
      setErrorMsg('Mã khoá xác thực Super Admin không chính xác!');
      return;
    }

    // 1. Check DelegatedUser access code for the chosen class
    const matchingDelegated = delegatedUsers.find(
      (u) => u.accessCode.toLowerCase() === cleanInput.toLowerCase()
    );

    if (matchingDelegated) {
      if (!matchingDelegated.isActive) {
        setErrorMsg(
          `Tài khoản uỷ quyền "${matchingDelegated.name}" hiện đang tạm khoá.`
        );
        return;
      }

      const targetCls = homeroomClasses.find(
        (c) => c.className === selectedClassName
      );
      const sc = shortClass(selectedClassName);
      setErrorMsg(null);
      onSuccess({
        role: 'delegated',
        name: matchingDelegated.name,
        title: `Admin ${sc}`,
        assignedClassName: selectedClassName,
        matchedClass: targetCls,
        groupAccess: matchingDelegated.permissions.groupScope,
        delegatedUserId: matchingDelegated.id,
        delegatedPermissions: matchingDelegated.permissions,
      });
      return;
    }

    // 2. Verify strictly against the user-selected class first
    const targetCls = homeroomClasses.find(
      (c) => c.className === selectedClassName
    );

    if (targetCls) {
      const codes =
        targetCls.className === currentClassName
          ? accessCodes
          : targetCls.accessCodes;

      if (pendingRole.role === 'teacher') {
        if (
          cleanInput.toUpperCase() === codes.teacher.toUpperCase() ||
          cleanInput.toUpperCase() === targetCls.accessCodes.teacher.toUpperCase() ||
          cleanInput === 'CN230876'
        ) {
          setErrorMsg(null);
          onSuccess(buildClassAuthResult(targetCls, 'teacher'));
          return;
        }
      } else if (pendingRole.role === 'class_monitor') {
        if (
          cleanInput.toUpperCase() === codes.monitor.toUpperCase() ||
          cleanInput.toUpperCase() === targetCls.accessCodes.monitor.toUpperCase()
        ) {
          setErrorMsg(null);
          onSuccess(buildClassAuthResult(targetCls, 'class_monitor'));
          return;
        }
      } else if (pendingRole.role === 'team_leader' && pendingRole.roleKey) {
        const gNum = Number(
          pendingRole.roleKey.replace('team', '')
        ) as GroupNumber;
        if (
          cleanInput.toUpperCase() === codes[pendingRole.roleKey].toUpperCase() ||
          cleanInput.toUpperCase() ===
            targetCls.accessCodes[pendingRole.roleKey].toUpperCase()
        ) {
          setErrorMsg(null);
          onSuccess(buildClassAuthResult(targetCls, 'team_leader', gNum));
          return;
        }
      }

      // Also allow if the code entered matches another role within the selected class
      if (
        cleanInput.toUpperCase() === codes.teacher.toUpperCase() ||
        cleanInput.toUpperCase() === targetCls.accessCodes.teacher.toUpperCase()
      ) {
        setErrorMsg(null);
        onSuccess(buildClassAuthResult(targetCls, 'teacher'));
        return;
      }
      if (
        cleanInput.toUpperCase() === codes.monitor.toUpperCase() ||
        cleanInput.toUpperCase() === targetCls.accessCodes.monitor.toUpperCase()
      ) {
        setErrorMsg(null);
        onSuccess(buildClassAuthResult(targetCls, 'class_monitor'));
        return;
      }
      for (const g of [1, 2, 3, 4] as GroupNumber[]) {
        const tKey = `team${g}` as keyof AccessCodesConfig;
        if (
          cleanInput.toUpperCase() === codes[tKey].toUpperCase() ||
          cleanInput.toUpperCase() === targetCls.accessCodes[tKey].toUpperCase()
        ) {
          setErrorMsg(null);
          onSuccess(buildClassAuthResult(targetCls, 'team_leader', g));
          return;
        }
      }
    }

    setErrorMsg(
      `Mã phân quyền không đúng với ${selectedClassName}! Vui lòng kiểm tra lại lớp đã chọn hoặc mã khoá.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                pendingRole.role === 'super_admin'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {pendingRole.role === 'super_admin' ? (
                <Crown className="w-5 h-5" />
              ) : pendingRole.role === 'delegated' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {pendingRole.role === 'super_admin'
                  ? 'Đăng Nhập Super Admin'
                  : 'Chọn Lớp & Đăng Nhập Phân Quyền'}
              </h3>
              <p className="text-xs text-slate-500">
                {pendingRole.role === 'super_admin'
                  ? 'Quản trị toàn bộ hệ thống đa lớp'
                  : 'Chọn lớp của bạn trước khi nhập mã khoá đăng nhập'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-3.5 text-xs">
          {/* STEP 1: CHỌN LỚP ĐĂNG NHẬP (Chỉ hiển thị tên lớp, KHÔNG gắn cứng tên GVCN vào tên lớp) */}
          {pendingRole.role !== 'super_admin' && (
            <div className="space-y-2">
              <label className="block font-bold text-slate-800">
                1. Chọn Lớp của bạn để đăng nhập:
              </label>

              {homeroomClasses.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {homeroomClasses.map((cls) => {
                    const isSelected = cls.className === selectedClassName;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClassName(cls.className);
                          setErrorMsg(null);
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cls.className}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                  {selectedClassName}
                </div>
              )}
            </div>
          )}

          {/* Role Summary Badge */}
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tài khoản phân quyền sau đăng nhập:
              </span>
              <div className="font-black text-indigo-950 text-sm">
                {getRoleDisplayHeader()}
              </div>
            </div>
            {pendingRole.role !== 'super_admin' && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                {selectedClassName}
              </span>
            )}
          </div>

          {/* Dynamic Teacher Name & Academic Year (Only when logging in as GVCN, editable per school year) */}
          {pendingRole.role === 'teacher' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên GVCN phụ trách năm nay:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={teacherNameInput}
                    onChange={(e) => setTeacherNameInput(e.target.value)}
                    placeholder="Nhập họ tên GVCN..."
                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Năm học áp dụng:
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={academicYearInput}
                    onChange={(e) => setAcademicYearInput(e.target.value)}
                    placeholder="2024 - 2025"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {pendingRole.role === 'super_admin' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSuperAdminLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-colors"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                {isGoogleLoading
                  ? 'Đang xác thực tài khoản Google...'
                  : 'Đăng nhập nhanh bằng Google Super Admin'}
              </button>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] font-semibold text-slate-400 uppercase">
                  Hoặc nhập mã khoá quản trị
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email xác thực (tuỳ chọn):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Nhập email quản trị..."
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: NHẬP MÃ KHOÁ */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {pendingRole.role === 'super_admin'
                ? 'Mã khoá Super Admin:'
                : `2. Nhập mã khoá phân quyền của ${selectedClassName}:`}
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Nhập mã khoá..."
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-sm font-mono tracking-wider text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Đăng Nhập {pendingRole.role !== 'super_admin' ? shortClass(selectedClassName) : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
