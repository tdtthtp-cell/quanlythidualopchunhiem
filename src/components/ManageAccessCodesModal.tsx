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
} from 'lucide-react';
import { AccessCodesConfig } from '../types';
import { DEFAULT_ACCESS_CODES } from '../utils/storage';

interface ManageAccessCodesModalProps {
  accessCodes: AccessCodesConfig;
  className: string;
  onUpdateAccessCodes: (newCodes: AccessCodesConfig) => void;
  onClose: () => void;
}

export const ManageAccessCodesModal: React.FC<ManageAccessCodesModalProps> = ({
  accessCodes,
  className,
  onUpdateAccessCodes,
  onClose,
}) => {
  const [codes, setCodes] = useState<AccessCodesConfig>({ ...accessCodes });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAllStatus, setCopiedAllStatus] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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
Trân trọng, GVCN.`;

    navigator.clipboard.writeText(text);
    setCopiedAllStatus(true);
    setTimeout(() => setCopiedAllStatus(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccessCodes(codes);
    setSaveSuccessMsg('Đã lưu và cập nhật mã phân quyền thành công!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (confirm('Khôi phục tất cả mã phân quyền về mã mặc định ban đầu?')) {
      setCodes(DEFAULT_ACCESS_CODES);
    }
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
      subLabel: 'Toàn quyền: cấu hình, duyệt điểm, sửa thủ công, xuất báo cáo',
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
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Quản Lý & Cấp Mã Phân Quyền Cán Bộ Lớp
              </h3>
              <p className="text-xs text-slate-500">
                Chỉ Giáo viên chủ nhiệm mới có quyền cấp và thay đổi mã phân quyền này
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="overflow-y-auto py-3 space-y-3.5 flex-1 text-xs">
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
      </div>
    </div>
  );
};
