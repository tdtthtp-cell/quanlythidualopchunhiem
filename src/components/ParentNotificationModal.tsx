import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  ExternalLink,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import {
  StudentWeeklyScore,
  ClassConfig,
  NotificationRecord,
  DailyLogEntry,
} from '../types';

interface ParentNotificationModalProps {
  scores: StudentWeeklyScore[];
  logs: DailyLogEntry[];
  config: ClassConfig;
  initialStudentId?: string;
  onClose?: () => void;
  onRecordNotification?: (record: Omit<NotificationRecord, 'id' | 'createdAt'>) => void;
}

export const ParentNotificationModal: React.FC<ParentNotificationModalProps> = ({
  scores,
  logs,
  config,
  initialStudentId,
  onClose,
  onRecordNotification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'periodic' | 'instant' | 'reminder'>('periodic');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || scores[0]?.student.id || ''
  );
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Current selected student score
  const scoreItem = scores.find((s) => s.student.id === selectedStudentId) || scores[0];
  const student = scoreItem?.student;

  // Severe infractions in current week
  const weekLogs = logs.filter((l) => l.week === config.currentWeek && l.semester === config.currentSemester);
  const severeViolations = weekLogs.filter(
    (l) =>
      l.criteriaName.includes('Sử dụng ĐT') ||
      l.criteriaName.includes('không phép') ||
      l.delta <= -3
  );

  // Students with pending tasks (homework, cleaning, uniform)
  const taskViolations = weekLogs.filter(
    (l) =>
      l.criteriaName.includes('BTVN') ||
      l.criteriaName.includes('Vệ sinh') ||
      l.criteriaName.includes('đồng phục')
  );

  // Generate Zalo message template for periodic report
  const generateZaloPeriodicMessage = () => {
    if (!student || !scoreItem) return '';

    const infractions = scoreItem.logs
      .filter((l) => l.delta < 0)
      .map((l) => ` - ${l.criteriaName} (${l.delta}đ): ${l.note || 'Lỗi ghi nhận'}`)
      .join('\n');

    const praises = scoreItem.logs
      .filter((l) => l.delta > 0)
      .map((l) => ` + ${l.criteriaName} (+${l.delta}đ): ${l.note || 'Khen ngợi'}`)
      .join('\n');

    return `📢 [THÔNG BÁO THI ĐUA ĐỊNH KỲ TUẦN ${config.currentWeek} - ${config.className}]
Kính gửi Phụ huynh em: ${student.fullName} (Mã HS: ${student.code} - Tổ ${student.group})

Trường: ${config.schoolName}
Giáo viên chủ nhiệm: ${config.homeroomTeacher} - SĐT: ${config.teacherPhone}

Kính gửi Quý phụ huynh kết quả rèn luyện và thi đua tuần ${config.currentWeek}:
⭐ Điểm thi đua tuần: ${scoreItem.totalScore} / 100 điểm
🏆 Xếp loại hạnh kiểm: ${scoreItem.conductRank} (Hạng ${scoreItem.rank}/${scores.length})
${praises ? `\n🌟 Tuyên dương biểu dương:\n${praises}` : ''}
${infractions ? `\n⚠️ Các điểm cần chấn chỉnh:\n${infractions}` : '\n✅ Trong tuần em chấp hành rất tốt mọi nề nếp và nội quy lớp.'}

Kính mong Phụ huynh phối hợp cùng nhà trường đôn đốc, động viên em tiếp tục phấn đấu học tập và rèn luyện tốt trong tuần tới.
Trân trọng cảm ơn Quý phụ huynh!`;
  };

  // Generate Email template
  const generateEmailSubject = () => {
    return `[${config.className}] Báo Cáo Thi Đua Tuần ${config.currentWeek} - Học sinh ${student?.fullName}`;
  };

  const handleCopyZalo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);

    if (onRecordNotification && student) {
      onRecordNotification({
        studentId: student.id,
        studentName: student.fullName,
        type: 'zalo',
        title: `Báo cáo thi đua tuần ${config.currentWeek}`,
        message: text,
        recipientContact: student.zaloPhone || student.parentPhone,
        status: 'copied',
      });
    }
  };

  const handleOpenZaloChat = (phone: string, text: string) => {
    handleCopyZalo(text);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://zalo.me/${cleanPhone}`, '_blank');
  };

  const handleSendEmail = (email: string, subject: string, body: string) => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    if (onRecordNotification && student) {
      onRecordNotification({
        studentId: student.id,
        studentName: student.fullName,
        type: 'email',
        title: subject,
        message: body,
        recipientContact: email,
        status: 'sent',
      });
    }
  };

  const currentZaloText = generateZaloPeriodicMessage();

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Trung Tâm Thông Báo Zalo & Email Phụ Huynh
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gửi thông báo kết quả thi đua định kỳ tuần, cảnh báo vi phạm tức thì và nhắc nhở học sinh tự động.
            </p>
          </div>

          {/* Sub-tab pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('periodic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'periodic'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Báo Cáo Định Kỳ Tuần
            </button>
            <button
              onClick={() => setActiveSubTab('instant')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'instant'
                  ? 'bg-white text-rose-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Cảnh Báo Tức Thì ({severeViolations.length})
            </button>
            <button
              onClick={() => setActiveSubTab('reminder')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'reminder'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              Nhắc Nhở Nhiệm Vụ ({taskViolations.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Periodic Report for Parent */}
        {activeSubTab === 'periodic' && (
          <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student selection list */}
            <div className="lg:col-span-1 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn Học Sinh Để Gửi Báo Cáo:
              </label>
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {scores.map((s) => {
                  const isSelected = s.student.id === selectedStudentId;
                  return (
                    <button
                      key={s.student.id}
                      onClick={() => setSelectedStudentId(s.student.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{s.student.fullName}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          Tổ {s.student.group} • {s.student.parentPhone}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs block">{s.totalScore}đ</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {s.conductRank}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Preview & Action Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Mẫu Tin Nhắn Zalo Chuẩn Hóa Cho Phụ Huynh: {student?.fullName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    SĐT Zalo: <strong className="text-slate-900">{student?.zaloPhone || student?.parentPhone}</strong>
                  </span>
                </div>

                <div className="mt-3">
                  <textarea
                    rows={12}
                    readOnly
                    value={currentZaloText}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none"
                  />
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyZalo(currentZaloText)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      {copiedStatus ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Đã sao chép vào bộ nhớ tạm!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Sao chép tin nhắn Zalo
                        </>
                      )}
                    </button>

                    {/* Open Zalo Chat Direct */}
                    <button
                      onClick={() =>
                        handleOpenZaloChat(
                          student?.zaloPhone || student?.parentPhone || '',
                          currentZaloText
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Mở Zalo nhắn cho Phụ huynh
                    </button>
                  </div>

                  {/* Send Email Direct */}
                  <button
                    onClick={() =>
                      handleSendEmail(
                        student?.parentEmail || '',
                        generateEmailSubject(),
                        currentZaloText
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-600" />
                    Gửi Email ({student?.parentEmail || 'Chưa có email'})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Instant Alerts for Severe Infractions */}
        {activeSubTab === 'instant' && (
          <div className="pt-4 space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  <strong>Thông báo khẩn cấp:</strong> Dành cho giáo viên chủ nhiệm nắm bắt ngay và phối hợp với phụ huynh khi học sinh vi phạm nghiêm trọng (Sử dụng điện thoại trái phép, nghỉ không phép...).
                </span>
              </div>
            </div>

            {severeViolations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Không có vi phạm nghiêm trọng nào trong tuần {config.currentWeek}!
              </div>
            ) : (
              <div className="space-y-3">
                {severeViolations.map((log) => {
                  const targetStudent = scores.find((s) => s.student.id === log.studentId)?.student;
                  const alertMessage = `🚨 [CẢNH BÁO VI PHẠM TỨC THÌ]
Kính gửi Phụ huynh em: ${log.studentName} (Lớp ${config.className})
Hôm nay (${log.date} - ${log.session === 'morning' ? 'Sáng' : 'Chiều'} Tiết ${log.period}), nhà trường ghi nhận em vi phạm:
❌ Hành vi: "${log.criteriaName}" (${log.delta} điểm).
Chi tiết: ${log.note || 'Vi phạm nội quy học đường'}.
Đề nghị Quý phụ huynh trao đổi và nhắc nhở em để không tái phạm.
GVCN: ${config.homeroomTeacher} (${config.teacherPhone}).`;

                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{log.studentName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {log.criteriaName} ({log.delta}đ)
                          </span>
                          <span className="text-slate-400 text-xs">
                            {log.session === 'morning' ? 'Sáng' : 'Chiều'} Tiết {log.period}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 italic">
                          "{log.note || 'Không có ghi chú thêm'}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Phụ huynh: {targetStudent?.parentName} • SĐT: {targetStudent?.parentPhone} • Người ghi: {log.loggedByName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            handleOpenZaloChat(
                              targetStudent?.zaloPhone || targetStudent?.parentPhone || '',
                              alertMessage
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Báo PH qua Zalo ngay
                        </button>
                        <button
                          onClick={() => handleCopyZalo(alertMessage)}
                          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sao chép tin nhắn cảnh báo"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Automatic Reminders for Incomplete Tasks */}
        {activeSubTab === 'reminder' && (
          <div className="pt-4 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Nhắc nhở tự động:</strong> Gửi thông báo đôn đốc những học sinh chưa hoàn thành nhiệm vụ được giao (Bài tập về nhà, trực nhật vệ sinh phòng học, trang phục...).
            </div>

            {taskViolations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Tất cả học sinh đều hoàn thành tốt nhiệm vụ trong tuần!
              </div>
            ) : (
              <div className="space-y-3">
                {taskViolations.map((log) => {
                  const targetStudent = scores.find((s) => s.student.id === log.studentId)?.student;
                  const reminderMessage = `🔔 [NHẮC NHỞ HOÀN THÀNH NHIỆM VỤ LỚP ${config.className}]
Thân gửi em: ${log.studentName} (Tổ ${log.group})
Ban cán sự lớp và GVCN nhắc em:
📌 Nhiệm vụ cần hoàn thành: ${log.criteriaName}
Chi tiết: ${log.note || 'Cần bổ sung và sửa chữa ngay trong buổi học tiếp theo'}.
Mong em khẩn trương hoàn thành để được cộng điểm thi đua rèn luyện!`;

                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{log.studentName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {log.criteriaName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{log.note || 'Chưa hoàn thành nhiệm vụ được giao'}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            handleOpenZaloChat(
                              targetStudent?.zaloPhone || targetStudent?.parentPhone || '',
                              reminderMessage
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi nhắc nhở Zalo
                        </button>
                        <button
                          onClick={() => handleCopyZalo(reminderMessage)}
                          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sao chép nội dung nhắc nhở"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
