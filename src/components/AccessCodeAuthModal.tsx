import React, { useState } from 'react';
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
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const shortClass = (clsName: string) =>
    clsName.replace(/^Lớp\s*/i, '').trim() || clsName;

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
        'Không thể mở cửa sổ xác thực Google hoặc đã huỷ đăng nhập. Vui lòng xác thực bằng tài khoản Super Admin và mã khoá bên dưới.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Helper to build authenticated role result for a matched HomeroomClass
  const buildClassAuthResult = (
    cls: HomeroomClass,
    matchedRole: 'teacher' | 'class_monitor' | 'team_leader',
    groupNum?: GroupNumber
  ): PendingRoleAuth => {
    const sc = shortClass(cls.className);
    if (matchedRole === 'teacher') {
      return {
        role: 'teacher',
        name: cls.homeroomTeacher || `GVCN ${sc}`,
        title: `GVCN ${sc}`,
        assignedClassName: cls.className,
        matchedClass: cls,
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
      setErrorMsg(
        'Mã khoá xác thực Super Admin không chính xác!'
      );
      return;
    }

    // 1. Check DelegatedUser access code (Admin / Người được uỷ quyền)
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

    // 2. Check against the selected class (and fallback to all homeroomClasses so GVCN/BCS code of any class automatically logs into that class)
    const targetCls = homeroomClasses.find(
      (c) => c.className === selectedClassName
    );
    const orderedClasses: HomeroomClass[] = [
      ...(targetCls ? [targetCls] : []),
      ...homeroomClasses.filter((c) => c.className !== selectedClassName),
    ];

    for (const cls of orderedClasses) {
      const codes =
        cls.className === currentClassName ? accessCodes : cls.accessCodes;

      // Check requested roleKey first on this class
      if (
        pendingRole.roleKey &&
        cleanInput.toUpperCase() === codes[pendingRole.roleKey].toUpperCase()
      ) {
        setErrorMsg(null);
        if (pendingRole.roleKey === 'teacher') {
          onSuccess(buildClassAuthResult(cls, 'teacher'));
          return;
        }
        if (pendingRole.roleKey === 'monitor') {
          onSuccess(buildClassAuthResult(cls, 'class_monitor'));
          return;
        }
        const gNum = Number(
          pendingRole.roleKey.replace('team', '')
        ) as GroupNumber;
        onSuccess(buildClassAuthResult(cls, 'team_leader', gNum));
        return;
      }

      // Also check if code matches any role of this class (auto-detect GVCN / BCS / Tổ trưởng 1..4)
      if (cleanInput.toUpperCase() === codes.teacher.toUpperCase()) {
        setErrorMsg(null);
        onSuccess(buildClassAuthResult(cls, 'teacher'));
        return;
      }
      if (cleanInput.toUpperCase() === codes.monitor.toUpperCase()) {
        setErrorMsg(null);
        onSuccess(buildClassAuthResult(cls, 'class_monitor'));
        return;
      }
      for (const g of [1, 2, 3, 4] as GroupNumber[]) {
        const tKey = `team${g}` as keyof AccessCodesConfig;
        if (cleanInput.toUpperCase() === codes[tKey].toUpperCase()) {
          setErrorMsg(null);
          onSuccess(buildClassAuthResult(cls, 'team_leader', g));
          return;
        }
      }
    }

    // 3. Fallback check if homeroomClasses is empty
    if (pendingRole.roleKey) {
      const expectedCode = accessCodes[pendingRole.roleKey];
      if (cleanInput.toUpperCase() === expectedCode.toUpperCase()) {
        setErrorMsg(null);
        onSuccess({
          ...pendingRole,
          assignedClassName: currentClassName,
        });
        return;
      }
    }

    setErrorMsg(
      'Mã phân quyền không chính xác! Vui lòng kiểm tra lại lớp được phân công hoặc liên hệ GVCN.'
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
                  : pendingRole.role === 'delegated'
                  ? 'Đăng Nhập Admin / Uỷ Quyền'
                  : 'Đăng Nhập Phân Quyền Lớp'}
              </h3>
              <p className="text-xs text-slate-500">
                {pendingRole.role === 'super_admin'
                  ? 'Quản trị hệ thống đa lớp & phân quyền chung'
                  : 'Tài khoản thuộc lớp nào chỉ hiển thị dữ liệu lớp đó'}
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
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quyền đăng nhập:
              </span>
              <div className="font-bold text-indigo-950 text-sm">
                {pendingRole.title}
              </div>
            </div>
            {pendingRole.role !== 'super_admin' && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                {selectedClassName}
              </span>
            )}
          </div>

          {/* Class selector for non-Super-Admin roles so GVCN / BCS logs directly into their assigned class */}
          {pendingRole.role !== 'super_admin' && homeroomClasses.length > 1 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lớp được phân công phụ trách:
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={selectedClassName}
                  onChange={(e) => {
                    setSelectedClassName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {homeroomClasses.map((cls) => (
                    <option key={cls.id} value={cls.className}>
                      {cls.className} (GVCN: {cls.homeroomTeacher})
                    </option>
                  ))}
                </select>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {pendingRole.role === 'super_admin'
                ? 'Mã khoá Super Admin:'
                : 'Mã khoá phân quyền:'}
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
              Đăng Nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
