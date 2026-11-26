import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Share2,
  UserCheck,
  UserPlus,
  Users,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { AccessCodesConfig, DelegatedUser, DelegatedPermission, GroupNumber } from '../types';
import { DEFAULT_ACCESS_CODES } from '../utils/storage';

interface ManageAccessCodesModalProps {
  accessCodes: AccessCodesConfig;
  delegatedUsers: DelegatedUser[];
  className: string;
  teacherName: string;
  onUpdateAccessCodes: (newCodes: AccessCodesConfig) => void;
  onSaveDelegatedUser: (user: DelegatedUser) => void;
  onDeleteDelegatedUser: (userId: string) => void;
  onClose: () => void;
}

export const ManageAccessCodesModal: React.FC<ManageAccessCodesModalProps> = ({
  accessCodes,
  delegatedUsers,
  className,
  teacherName,
  onUpdateAccessCodes,
  onSaveDelegatedUser,
  onDeleteDelegatedUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'delegated'>('delegated');
  const [codes, setCodes] = useState<AccessCodesConfig>({ ...accessCodes });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAllStatus, setCopiedAllStatus] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Delegation Edit/Add Form State
  const [isEditingDelegated, setIsEditingDelegated] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [delName, setDelName] = useState('');
  const [delTitle, setDelTitle] = useState('');
  const [delAccessCode, setDelAccessCode] = useState('');
  const [delIsActive, setDelIsActive] = useState(true);
  const [delNotes, setDelNotes] = useState('');
  const [delGroupScope, setDelGroupScope] = useState<GroupNumber | 'all'>('all');
  const [delCanLog, setDelCanLog] = useState(true);
  const [delCanEdit, setDelCanEdit] = useState(true);
  const [delCanDelete, setDelCanDelete] = useState(false);
  const [delCanAdjust, setDelCanAdjust] = useState(false);
  const [delCanSendNotice, setDelCanSendNotice] = useState(true);

  // State to toggle code visibility in cards
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

  const toggleCodeVisibility = (id: string) => {
    setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomCode = (prefix: string) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}_${randomDigits}`;
  };

  const handleRandomize = (key: keyof AccessCodesConfig, prefix: string) => {
    setCodes((prev) => ({
      ...prev,
      [key]: generateRandomCode(prefix),
    }));
  };

  const handleCopySingle = (code: string, keyName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllForZalo = () => {
    const text = `🔐 [DANH SÁCH MÃ PHÂN QUYỀN LỚP ${className.toUpperCase()}]
Kính gửi Ban cán sự và các Tổ trưởng, dưới đây là mã phân quyền đăng nhập chấm điểm thi đua:

1. Giáo viên chủ nhiệm: ${codes.teacher}
2. Tổ trưởng Tổ 1: ${codes.team1}
3. Tổ trưởng Tổ 2: ${codes.team2}
4. Tổ trưởng Tổ 3: ${codes.team3}
5. Tổ trưởng Tổ 4: ${codes.team4}
6. Ban cán sự (Lớp trưởng / Lớp phó / Cờ đỏ): ${codes.monitor}

⚠️ Lưu ý: Các bạn bảo mật mã phân quyền của tổ mình, không chia sẻ ra ngoài.
Trân trọng, GVCN ${teacherName}.`;

    navigator.clipboard.writeText(text);
    setCopiedAllStatus(true);
    setTimeout(() => setCopiedAllStatus(false), 3000);
  };

  const handleSaveStandardCodes = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccessCodes(codes);
    setSaveSuccessMsg('Đã lưu và cập nhật mã phân quyền cán bộ lớp thành công!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Khôi phục tất cả mã cán bộ lớp về mã mặc định ban đầu?')) {
      setCodes(DEFAULT_ACCESS_CODES);
    }
  };

  // Delegated user handlers
  const handleOpenAddDelegated = () => {
    setEditingUserId(null);
    setDelName('');
    setDelTitle('Giáo viên bộ môn');
    setDelAccessCode(generateRandomCode('UQ_BM'));
    setDelIsActive(true);
    setDelNotes('');
    setDelGroupScope('all');
    setDelCanLog(true);
    setDelCanEdit(true);
    setDelCanDelete(false);
    setDelCanAdjust(false);
    setDelCanSendNotice(true);
    setIsEditingDelegated(true);
  };

  const handleOpenEditDelegated = (user: DelegatedUser) => {
    setEditingUserId(user.id);
    setDelName(user.name);
    setDelTitle(user.title);
    setDelAccessCode(user.accessCode);
    setDelIsActive(user.isActive);
    setDelNotes(user.notes || '');
    setDelGroupScope(user.permissions.groupScope);
    setDelCanLog(user.permissions.canLogDaily);
    setDelCanEdit(user.permissions.canEditLogs);
    setDelCanDelete(user.permissions.canDeleteLogs);
    setDelCanAdjust(user.permissions.canAdjustScores);
    setDelCanSendNotice(user.permissions.canSendNotice);
    setIsEditingDelegated(true);
  };

  const handleSaveDelegatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delName.trim() || !delAccessCode.trim()) {
      alert('Vui lòng nhập họ tên và mã khoá truy cập.');
      return;
    }

    const newUser: DelegatedUser = {
      id: editingUserId || `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: delName.trim(),
      title: delTitle.trim() || 'Người được uỷ quyền',
      accessCode: delAccessCode.trim(),
      isActive: delIsActive,
      notes: delNotes.trim(),
      createdAt: editingUserId
        ? (delegatedUsers.find((u) => u.id === editingUserId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      delegatedBy: `${teacherName} (GVCN)`,
      permissions: {
        canLogDaily: delCanLog,
        canEditLogs: delCanEdit,
        canDeleteLogs: delCanDelete,
        canAdjustScores: delCanAdjust,
        canSendNotice: delCanSendNotice,
        groupScope: delGroupScope,
      },
    };

    onSaveDelegatedUser(newUser);
    setIsEditingDelegated(false);
    setSaveSuccessMsg(`Đã ${editingUserId ? 'cập nhật' : 'uỷ quyền'} thành công cho ${newUser.name}!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleToggleDelegatedActive = (user: DelegatedUser) => {
    const updated = { ...user, isActive: !user.isActive };
    onSaveDelegatedUser(updated);
    setSaveSuccessMsg(`Đã ${updated.isActive ? 'kích hoạt lại' : 'tạm khoá'} tài khoản uỷ quyền ${user.name}`);
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleDeleteDelegated = (user: DelegatedUser) => {
    if (confirm(`Bạn có chắc chắn muốn thu hồi và xoá uỷ quyền của: "${user.name} - ${user.title}"?`)) {
      onDeleteDelegatedUser(user.id);
      setSaveSuccessMsg(`Đã thu hồi uỷ quyền của ${user.name}`);
      setTimeout(() => setSaveSuccessMsg(null), 2000);
    }
  };

  const handleCopyDelegatedNotice = (user: DelegatedUser) => {
    const scopeLabel = user.permissions.groupScope === 'all' ? 'Toàn bộ lớp (Tổ 1 - 4)' : `Tổ ${user.permissions.groupScope}`;
    const perms: string[] = [];
    if (user.permissions.canLogDaily) perms.push('Ghi nhận vi phạm & tuyên dương');
    if (user.permissions.canEditLogs) perms.push('Chỉnh sửa nhật ký');
    if (user.permissions.canDeleteLogs) perms.push('Xoá nhật ký');
    if (user.permissions.canAdjustScores) perms.push('Điều chỉnh điểm thi đua');
    if (user.permissions.canSendNotice) perms.push('Gửi thông báo Zalo/Email phụ huynh');

    const message = `📋 [THÔNG BÁO UỶ QUYỀN HỆ THỐNG THI ĐUA LỚP ${className.toUpperCase()}]
Kính gửi: ${user.name} (${user.title})
Thầy/Cô Bồ Công Lâm (GVCN) đã cấp quyền truy cập hệ thống quản lý thi đua lớp:

🔑 Mã khoá đăng nhập (PIN): ${user.accessCode}
📍 Phạm vi phụ trách: ${scopeLabel}
🛡️ Các quyền được giao:
- ${perms.join('\n- ')}
${user.notes ? `📌 Ghi chú: ${user.notes}` : ''}

🔗 Vui lòng truy cập hệ thống và chọn mục "Đăng nhập mã uỷ quyền" để bắt đầu làm việc.
Trân trọng cảm ơn Thầy/Cô!`;

    navigator.clipboard.writeText(message);
    setCopiedKey(user.id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const rolesConfigList: {
    key: keyof AccessCodesConfig;
    label: string;
    subLabel: string;
    prefix: string;
    color: string;
  }[] = [
    {
      key: 'teacher',
      label: 'Giáo Viên Chủ Nhiệm',
      subLabel: 'Toàn quyền: cấu hình, duyệt điểm, sửa thủ công, xuất báo cáo, uỷ quyền',
      prefix: 'CN',
      color: 'indigo',
    },
    {
      key: 'team1',
      label: 'Tổ Trưởng Tổ 1',
      subLabel: 'Quyền ghi nhận vi phạm & việc tốt cho các thành viên Tổ 1',
      prefix: 'TO1',
      color: 'blue',
    },
    {
      key: 'team2',
      label: 'Tổ Trưởng Tổ 2',
      subLabel: 'Quyền ghi nhận vi phạm & việc tốt cho các thành viên Tổ 2',
      prefix: 'TO2',
      color: 'blue',
    },
    {
      key: 'team3',
      label: 'Tổ Trưởng Tổ 3',
      subLabel: 'Quyền ghi nhận vi phạm & việc tốt cho các thành viên Tổ 3',
      prefix: 'TO3',
      color: 'blue',
    },
    {
      key: 'team4',
      label: 'Tổ Trưởng Tổ 4',
      subLabel: 'Quyền ghi nhận vi phạm & việc tốt cho các thành viên Tổ 4',
      prefix: 'TO4',
      color: 'blue',
    },
    {
      key: 'monitor',
      label: 'Ban Cán Sự Lớp (Lớp trưởng, Lớp phó, Cờ đỏ)',
      subLabel: 'Theo dõi chung, ghi nhận các tiết học, trực nhật, nề nếp toàn lớp',
      prefix: 'BCS',
      color: 'purple',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Phân Quyền & Uỷ Quyền Người Dùng Lớp
              </h3>
              <p className="text-xs text-slate-500">
                Được quản lý độc quyền bởi GVCN: <span className="font-semibold text-slate-700">{teacherName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('delegated');
              setIsEditingDelegated(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs border-b-2 transition-colors ${
              activeTab === 'delegated'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Uỷ Quyền Người Dùng Khác
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
              {delegatedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('standard');
              setIsEditingDelegated(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs border-b-2 transition-colors ${
              activeTab === 'standard'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Mã Cán Bộ Lớp Mặc Định
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shrink-0 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: UỶ QUYỀN NGƯỜI DÙNG KHÁC */}
        {activeTab === 'delegated' && !isEditingDelegated && (
          <div className="overflow-y-auto py-3 space-y-4 flex-1 text-xs">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Uỷ Quyền Cán Bộ & Giáo Viên Khác
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Cấp quyền truy cập cho GV Bộ Môn, Cán bộ Giám thị, Thư ký nề nếp hoặc Trợ giảng với các quyền hạn chi tiết do GVCN chỉ định.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddDelegated}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs transition-colors shrink-0 self-start sm:self-center"
              >
                <UserPlus className="w-4 h-4" />
                + Thêm Người Uỷ Quyền
              </button>
            </div>

            {/* List of Delegated Users */}
            {delegatedUsers.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">Chưa có người dùng uỷ quyền nào</p>
                <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto">
                  Nhấn vào nút &ldquo;+ Thêm Người Uỷ Quyền&rdquo; để cấp quyền cho Giáo viên bộ môn, Cán bộ giám thị hoặc Cán bộ đoàn trường.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {delegatedUsers.map((user) => {
                  const isVisible = visibleCodes[user.id] || false;
                  const isCopied = copiedKey === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition-all ${
                        user.isActive
                          ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {user.title}
                            </span>
                            {user.isActive ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Đang hoạt động
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                Tạm khóa
                              </span>
                            )}
                          </div>

                          {user.notes && (
                            <p className="text-slate-500 text-[11px] italic">
                              &ldquo;{user.notes}&rdquo;
                            </p>
                          )}

                          <div className="text-[10px] text-slate-400">
                            Cấp bởi: {user.delegatedBy || teacherName} • {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyDelegatedNotice(user)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            title="Sao chép toàn bộ thông tin tài khoản để gửi Zalo cho người được uỷ quyền"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                            {isCopied ? 'Đã sao chép tin nhắn!' : 'Gửi Zalo'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditDelegated(user)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                            title="Chỉnh sửa thông tin & phân quyền"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleDelegatedActive(user)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              user.isActive
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            }`}
                            title={user.isActive ? 'Tạm khóa quyền' : 'Kích hoạt lại quyền'}
                          >
                            {user.isActive ? (
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDelegated(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                            title="Xóa và thu hồi uỷ quyền vĩnh viễn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Code and Scope bar */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* PIN Code */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600 text-[11px]">Mã khoá (PIN):</span>
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 tracking-wider">
                            {isVisible ? user.accessCode : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCodeVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title={isVisible ? 'Ẩn mã' : 'Hiện mã'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopySingle(user.accessCode, user.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Chép mã PIN"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Badges of Permissions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Phạm vi: {user.permissions.groupScope === 'all' ? 'Toàn lớp' : `Tổ ${user.permissions.groupScope}`}
                          </span>
                          {user.permissions.canLogDaily && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              ✓ Ghi nhật ký
                            </span>
                          )}
                          {user.permissions.canEditLogs && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
                              ✓ Sửa nhật ký
                            </span>
                          )}
                          {user.permissions.canDeleteLogs && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              ✓ Xóa nhật ký
                            </span>
                          )}
                          {user.permissions.canAdjustScores && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              ✓ Chỉnh điểm thi đua
                            </span>
                          )}
                          {user.permissions.canSendNotice && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Gửi Zalo/Email
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1 - SUB-FORM: THÊM / SỬA NGƯỜI ĐƯỢC UỶ QUYỀN */}
        {activeTab === 'delegated' && isEditingDelegated && (
          <form onSubmit={handleSaveDelegatedSubmit} className="overflow-y-auto py-3 space-y-4 flex-1 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                {editingUserId ? 'Chỉnh Sửa Người Được Uỷ Quyền' : 'Thêm Người Dùng Uỷ Quyền Mới'}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingDelegated(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Quay lại danh sách
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên người được uỷ quyền <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy Nguyễn Văn Hưng, Cô Lê Thu Hà..."
                  value={delName}
                  onChange={(e) => setDelName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chức danh / Danh xưng nhiệm vụ:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giáo viên bộ môn Tiếng Anh, Giám thị khối, Thư ký..."
                  value={delTitle}
                  onChange={(e) => setDelTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Mã khoá truy cập (PIN) <span className="text-rose-500">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => setDelAccessCode(generateRandomCode('UQ_GV'))}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="VD: UQ_TOAN10"
                  value={delAccessCode}
                  onChange={(e) => setDelAccessCode(e.target.value.trim())}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 tracking-wider focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phạm vi tổ quản lý:
                </label>
                <select
                  value={delGroupScope}
                  onChange={(e) => setDelGroupScope(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GroupNumber))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Toàn bộ lớp (Tổ 1, 2, 3, 4)</option>
                  <option value="1">Chỉ phụ trách Tổ 1</option>
                  <option value="2">Chỉ phụ trách Tổ 2</option>
                  <option value="3">Chỉ phụ trách Tổ 3</option>
                  <option value="4">Chỉ phụ trách Tổ 4</option>
                </select>
              </div>
            </div>

            {/* Permissions Checkboxes */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 block text-xs">
                Cấp quyền chi tiết cho người được uỷ quyền:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={delCanLog}
                    onChange={(e) => setDelCanLog(e.target.checked)}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Ghi nhận nhật ký hàng ngày</span>
                    <span className="text-[11px] text-slate-500">Cho phép thêm vi phạm hoặc tuyên dương việc tốt</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={delCanEdit}
                    onChange={(e) => setDelCanEdit(e.target.checked)}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Chỉnh sửa nhật ký đã ghi</span>
                    <span className="text-[11px] text-slate-500">Cho phép sửa tiêu chí, buổi học, tiết học, ghi chú</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={delCanDelete}
                    onChange={(e) => setDelCanDelete(e.target.checked)}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Xoá mục nhật ký</span>
                    <span className="text-[11px] text-slate-500">Cho phép xoá hẳn dòng vi phạm hoặc tuyên dương</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={delCanAdjust}
                    onChange={(e) => setDelCanAdjust(e.target.checked)}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Điều chỉnh điểm thi đua thủ công</span>
                    <span className="text-[11px] text-slate-500">Được phép cộng/trừ điểm trực tiếp như GVCN</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={delCanSendNotice}
                    onChange={(e) => setDelCanSendNotice(e.target.checked)}
                    className="rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Gửi thông báo Zalo / Email phụ huynh</span>
                    <span className="text-[11px] text-slate-500">Được phép sao chép tin nhắn Zalo hoặc gửi email cho phụ huynh</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú nhiệm vụ / Lý do uỷ quyền:
                </label>
                <input
                  type="text"
                  placeholder="VD: Quản lý nề nếp tiết Tiếng Anh; Hỗ trợ tuần hội thao..."
                  value={delNotes}
                  onChange={(e) => setDelNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái kích hoạt:
                </label>
                <select
                  value={delIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setDelIsActive(e.target.value === 'active')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="active">🟢 Đang hoạt động (Kích hoạt ngay)</option>
                  <option value="inactive">⚪ Tạm khóa (Chưa cho truy cập)</option>
                </select>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingDelegated(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu & Cấp Quyền Uỷ Quyền
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MÃ CÁN BỘ LỚP MẶC ĐỊNH */}
        {activeTab === 'standard' && (
          <form onSubmit={handleSaveStandardCodes} className="overflow-y-auto py-3 space-y-3.5 flex-1 text-xs">
            {/* Quick share button */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-indigo-900 font-medium">
                <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Gửi nhanh danh sách mã phân quyền cho các cán bộ lớp</span>
              </div>
              <button
                type="button"
                onClick={handleCopyAllForZalo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs transition-colors shrink-0"
              >
                {copiedAllStatus ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Đã chép danh sách!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép gửi Zalo
                  </>
                )}
              </button>
            </div>

            {/* List of roles and codes */}
            <div className="space-y-2.5">
              {rolesConfigList.map((item) => {
                const currentValue = codes[item.key];
                const isCopied = copiedKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.subLabel}</p>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleRandomize(item.key, item.prefix)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors"
                          title="Tạo mã ngẫu nhiên mới"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          Tạo ngẫu nhiên
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopySingle(currentValue, item.key)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors"
                          title="Sao chép mã này"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {isCopied ? 'Đã chép' : 'Chép'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                        Mã truy cập:
                      </span>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          setCodes({
                            ...codes,
                            [item.key]: e.target.value.trim(),
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục mã ban đầu
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu Thay Đổi Mã
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
