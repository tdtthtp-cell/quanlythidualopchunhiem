import React, { useRef, useState } from 'react';
import { Database, Download, Upload, RotateCcw, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { exportFullBackupJSON, resetAllToDefaults } from '../utils/storage';

interface BackupSyncModalProps {
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupSyncModal: React.FC<BackupSyncModalProps> = ({ onClose, onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExport = () => {
    exportFullBackupJSON();
    setStatusMsg('Đã tạo và tải xuống bản sao lưu toàn bộ cơ sở dữ liệu (.json)!');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.students && Array.isArray(parsed.students)) {
          localStorage.setItem('thidua_students_v1', JSON.stringify(parsed.students));
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          localStorage.setItem('thidua_categories_v1', JSON.stringify(parsed.categories));
        }
        if (parsed.criteria && Array.isArray(parsed.criteria)) {
          localStorage.setItem('thidua_criteria_v1', JSON.stringify(parsed.criteria));
        }
        if (parsed.logs && Array.isArray(parsed.logs)) {
          localStorage.setItem('thidua_logs_v1', JSON.stringify(parsed.logs));
        }
        if (parsed.adjustments && Array.isArray(parsed.adjustments)) {
          localStorage.setItem('thidua_adjustments_v1', JSON.stringify(parsed.adjustments));
        }
        if (parsed.config && parsed.config.className) {
          localStorage.setItem('thidua_config_v1', JSON.stringify(parsed.config));
        }

        setStatusMsg('Khôi phục cơ sở dữ liệu thành công từ file sao lưu!');
        onDataRestored();
        setTimeout(() => {
          setStatusMsg(null);
          onClose();
        }, 1200);
      } catch (err) {
        console.error(err);
        setStatusMsg('Lỗi định dạng file sao lưu JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ xoá toàn bộ dữ liệu hiện tại và khôi phục về danh sách mẫu ban đầu (36 học sinh, 4 tổ, tuần 8). Bạn có chắc chắn muốn tiếp tục?'
      )
    ) {
      resetAllToDefaults();
      setStatusMsg('Đã khôi phục toàn bộ hệ thống về trạng thái mẫu ban đầu.');
      onDataRestored();
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Sao Lưu, Đồng Bộ & Bảo Mật Dữ Liệu
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Privacy & Security Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900">Bảo mật dữ liệu cá nhân học sinh</h4>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Toàn bộ dữ liệu điểm số, thông tin phụ huynh và sổ nhật ký rèn luyện được lưu trữ an toàn trong trình duyệt cục bộ, hỗ trợ truy cập tốc độ cao và hoàn toàn bảo mật.
              </p>
            </div>
          </div>

          {/* Backup Action */}
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Xuất bản sao lưu dữ liệu (.json)</h4>
                <p className="text-slate-500 mt-0.5">
                  Tải về máy toàn bộ dữ liệu học sinh, tiêu chí chấm điểm, điểm thi đua và lịch sử nhật ký.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                Tải Sao Lưu
              </button>
            </div>
          </div>

          {/* Restore Action */}
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Khôi phục từ file sao lưu</h4>
                <p className="text-slate-500 mt-0.5">
                  Đồng bộ lại dữ liệu đã sao lưu trước đó từ file .json vào hệ thống.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                Chọn File Khôi Phục
              </button>
            </div>
          </div>

          {/* Reset Action */}
          <div className="p-4 border border-rose-100 bg-rose-50/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Khôi phục về dữ liệu mẫu</h4>
                <p className="text-rose-700 mt-0.5">
                  Xoá các thay đổi và nạp lại 36 học sinh lớp 10A1 cùng tiêu chí chuẩn theo ảnh gốc.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Đặt Lại
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
