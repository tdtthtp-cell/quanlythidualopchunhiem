import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, X, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';
import { AccessCodesConfig, UserRole, GroupNumber, DelegatedUser, DelegatedPermission } from '../types';

export interface PendingRoleAuth {
  role: UserRole;
  groupAccess?: GroupNumber | 'all';
  name: string;
  title: string;
  roleKey?: keyof AccessCodesConfig;
  delegatedUserId?: string;
  delegatedPermissions?: DelegatedPermission;
}

interface AccessCodeAuthModalProps {
  pendingRole: PendingRoleAuth;
  accessCodes: AccessCodesConfig;
  delegatedUsers?: DelegatedUser[];
  onSuccess: (roleAuth: PendingRoleAuth) => void;
  onCancel: () => void;
}

export const AccessCodeAuthModal: React.FC<AccessCodeAuthModalProps> = ({
  pendingRole,
  accessCodes,
  delegatedUsers = [],
  onSuccess,
  onCancel,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inputCode.trim();

    if (!cleanInput) {
      setErrorMsg('Vui lòng nhập mã phân quyền hoặc mã uỷ quyền.');
      return;
    }

    // 1. Check if input matches any DelegatedUser access code
    const matchingDelegated = delegatedUsers.find(
      (u) => u.accessCode.toLowerCase() === cleanInput.toLowerCase()
    );

    if (matchingDelegated) {
      if (!matchingDelegated.isActive) {
        setErrorMsg(`Tài khoản uỷ quyền của "${matchingDelegated.name}" hiện đang bị tạm khoá bởi Giáo viên chủ nhiệm.`);
        return;
      }

      setErrorMsg(null);
      onSuccess({
        role: 'delegated',
        name: matchingDelegated.name,
        title: matchingDelegated.title,
        groupAccess: matchingDelegated.permissions.groupScope,
        delegatedUserId: matchingDelegated.id,
        delegatedPermissions: matchingDelegated.permissions,
      });
      return;
    }

    // 2. If standard role requested, check standard role key
    if (pendingRole.roleKey) {
      const expectedCode = accessCodes[pendingRole.roleKey];
      if (cleanInput === expectedCode) {
        setErrorMsg(null);
        onSuccess(pendingRole);
        return;
      }
    }

    // 3. Fallback check: Did user type teacher code or another standard code while in this modal?
    if (cleanInput === accessCodes.teacher) {
      setErrorMsg(null);
      onSuccess({
        role: 'teacher',
        name: 'Giáo Viên Chủ Nhiệm',
        title: 'Giáo viên chủ nhiệm (Toàn quyền)',
        groupAccess: 'all',
        roleKey: 'teacher',
      });
      return;
    }

    setErrorMsg(
      'Mã phân quyền không chính xác! Vui lòng liên hệ Giáo viên chủ nhiệm để nhận mã truy cập hoặc mã uỷ quyền mới nhất.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              {pendingRole.role === 'delegated' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {pendingRole.role === 'delegated'
                  ? 'Đăng Nhập Quyền Uỷ Quyền'
                  : 'Xác Thực Mã Phân Quyền'}
              </h3>
              <p className="text-xs text-slate-500">
                Bảo mật hệ thống thi đua lớp học
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vai trò yêu cầu đăng nhập:
            </span>
            <div className="font-bold text-indigo-900 text-sm">{pendingRole.title}</div>
            <div className="text-slate-500 text-[11px]">{pendingRole.name}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Nhập mã phân quyền hoặc mã uỷ quyền do GVCN cấp:
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Nhập mã truy cập / PIN..."
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-sm font-mono tracking-wider text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Hệ thống tự động nhận diện mã cán bộ lớp hoặc mã người được uỷ quyền.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Xác Nhận Đăng Nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
