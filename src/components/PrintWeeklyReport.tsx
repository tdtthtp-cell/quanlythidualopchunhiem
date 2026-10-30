import React, { useState } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Award,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import {
  StudentWeeklyScore,
  ClassConfig,
  CriteriaCategory,
} from '../types';
import { getDayLabelVi } from '../utils/scoring';

interface PrintWeeklyReportProps {
  scores: StudentWeeklyScore[];
  config: ClassConfig;
  categories: CriteriaCategory[];
  initialStudentId?: string;
  onBack?: () => void;
}

export const PrintWeeklyReport: React.FC<PrintWeeklyReportProps> = ({
  scores,
  config,
  categories,
  initialStudentId,
  onBack,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || scores[0]?.student.id || ''
  );
  const [printAllMode, setPrintAllMode] = useState<boolean>(false);
  const [teacherComment, setTeacherComment] = useState<string>(
    'Em có ý thức rèn luyện tốt, tích cực tham gia các phong trào của lớp. Cần tiếp tục phát huy trong tuần tới!'
  );

  const currentScore = scores.find((s) => s.student.id === selectedStudentId) || scores[0];

  const handlePrint = () => {
    window.print();
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Xuất sắc':
        return 'text-purple-700 bg-purple-50 border-purple-300';
      case 'Tốt':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'Khá':
        return 'text-blue-700 bg-blue-50 border-blue-300';
      case 'Trung bình':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      default:
        return 'text-rose-700 bg-rose-50 border-rose-300';
    }
  };

  // Render Single Student Report
  const renderStudentReport = (scoreItem: StudentWeeklyScore) => {
    const student = scoreItem.student;

    return (
      <div
        key={student.id}
        className="print-container bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto print-page-break my-4 text-slate-800"
      >
        {/* National Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {config.schoolName}
            </h4>
            <h5 className="text-sm font-bold text-slate-900 uppercase">
              LỚP: {config.className} — NĂM HỌC {config.academicYear}
            </h5>
            <p className="text-[11px] text-slate-500">GVCN: {config.homeroomTeacher}</p>
          </div>

          <div className="text-center hidden sm:block">
            <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <h5 className="text-xs font-semibold italic text-slate-700">
              Độc lập - Tự do - Hạnh phúc
            </h5>
            <div className="w-24 h-0.5 bg-slate-800 mx-auto mt-1"></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
            PHIẾU BÁO CÁO THI ĐUA & RÈN LUYỆN HỌC SINH
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-indigo-700 mt-1">
            TUẦN {config.currentWeek} ({config.currentWeek <= 18 ? 'HỌC KỲ I' : 'HỌC KỲ II'}) — NĂM HỌC {config.academicYear}
          </p>
        </div>

        {/* Student Info Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Họ và tên học sinh</span>
            <span className="font-bold text-sm text-slate-900">{student.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Mã số HS / Chức vụ</span>
            <span className="font-semibold text-slate-800">
              {student.code} • {student.role}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tổ sinh hoạt</span>
            <span className="font-semibold text-slate-800">Tổ {student.group}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Phụ huynh & SĐT</span>
            <span className="font-semibold text-slate-800">
              {student.parentName} ({student.parentPhone})
            </span>
          </div>
        </div>

        {/* Score Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Điểm Gốc</span>
            <span className="text-base font-bold text-slate-700">{scoreItem.baseScore}</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Khen Thưởng (+)</span>
            <span className="text-base font-black text-emerald-700">+{scoreItem.praisePoints}</span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[10px] text-rose-700 font-semibold uppercase block">Vi Phạm (-)</span>
            <span className="text-base font-black text-rose-700">-{scoreItem.deductionPoints}</span>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Điều Chỉnh GVCN</span>
            <span className="text-base font-bold text-indigo-700">
              {scoreItem.manualAdjustment >= 0 ? `+${scoreItem.manualAdjustment}` : scoreItem.manualAdjustment}
            </span>
          </div>
          <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-xl">
            <span className="text-[10px] text-purple-700 font-bold uppercase block">TỔNG ĐIỂM</span>
            <span className="text-xl font-black text-purple-900">{scoreItem.totalScore}</span>
          </div>
          <div className={`p-3 border rounded-xl flex flex-col justify-center items-center ${getRankColor(scoreItem.conductRank)}`}>
            <span className="text-[10px] font-bold uppercase block">XẾP LOẠI</span>
            <span className="text-sm font-black uppercase">{scoreItem.conductRank}</span>
            <span className="text-[10px] mt-0.5">Hạng #{scoreItem.rank}</span>
          </div>
        </div>

        {/* Detailed Logs Table for this student */}
        <div className="mb-6">
          <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider mb-2">
            I. BẢNG KÊ CHI TIẾT CÁC LƯỢT GHI NHẬN TRONG TUẦN (2 BUỔI / NGÀY)
          </h4>
          {scoreItem.logs.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              Trong tuần không ghi nhận vi phạm hay tuyên dương phát sinh nào.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2 px-3">Thứ / Ngày</th>
                    <th className="py-2 px-3">Buổi & Tiết</th>
                    <th className="py-2 px-3">Nội dung ghi nhận (Tiêu chí)</th>
                    <th className="py-2 px-3 text-center">Điểm +/-</th>
                    <th className="py-2 px-3">Ghi chú cụ thể</th>
                    <th className="py-2 px-3">Người ghi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scoreItem.logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {getDayLabelVi(log.dayOfWeek)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {log.session === 'morning' ? 'Sáng' : 'Chiều'} (Tiết {log.period})
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {log.criteriaName}
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span
                          className={log.delta > 0 ? 'text-emerald-700' : 'text-rose-700'}
                        >
                          {log.delta > 0 ? `+${log.delta}` : log.delta}đ
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 italic">
                        {log.note || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {log.loggedByName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Teacher notes & Signatures */}
        <div className="mb-8">
          <h4 className="font-bold text-xs uppercase text-slate-800 tracking-wider mb-2">
            II. NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM
          </h4>
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 italic">
            "{teacherComment}"
          </div>
        </div>

        {/* 3-column Signatures */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-slate-200">
          <div>
            <p className="font-bold text-slate-800 uppercase">HỌC SINH</p>
            <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="font-medium text-slate-700">{student.fullName}</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase">PHỤ HUYNH HỌC SINH</p>
            <p className="text-[10px] text-slate-400 italic">(Ký xác nhận đã xem)</p>
            <div className="h-16"></div>
            <p className="font-medium text-slate-700">{student.parentName}</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="text-[10px] text-slate-400 italic">(Ký và duyệt điểm)</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900">{config.homeroomTeacher}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Quay lại"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              Kết Xuất Báo Cáo PDF Định Kỳ Cá Nhân & Cả Lớp
            </h2>
            <p className="text-xs text-slate-500">
              Xuất mẫu phiếu rèn luyện thi đua tuần theo chuẩn mẫu sư phạm học đường
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Student Selector */}
          {!printAllMode && (
            <select
              aria-label="Chọn học sinh để in phiếu"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              {scores.map((s) => (
                <option key={s.student.id} value={s.student.id}>
                  {s.student.fullName} ({s.totalScore}đ - Hạng {s.rank} - Tổ {s.student.group})
                </option>
              ))}
            </select>
          )}

          {/* Toggle All vs Single */}
          <button
            onClick={() => setPrintAllMode(!printAllMode)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              printAllMode
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {printAllMode ? `✓ Đang chọn in cả lớp (${scores.length} HS)` : 'In hàng loạt cả lớp'}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            In Phiếu / Lưu PDF (Ctrl + P)
          </button>
        </div>
      </div>

      {/* Teacher Comment Customizer (no-print) */}
      <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <label className="block font-semibold text-slate-700 mb-1">
          Lời phê / Nhận xét của Giáo viên chủ nhiệm (Áp dụng lên phiếu):
        </label>
        <input
          type="text"
          value={teacherComment}
          onChange={(e) => setTeacherComment(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Render Document(s) */}
      <div>
        {printAllMode ? (
          <div>{scores.map((s) => renderStudentReport(s))}</div>
        ) : (
          renderStudentReport(currentScore)
        )}
      </div>
    </div>
  );
};
