import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  Users,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  ShieldAlert,
  Send,
  Eye,
  Calendar,
  Medal,
  Crown,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  StudentWeeklyScore,
  GroupWeeklySummary,
  DailyLogEntry,
  ManualScoreAdjustment,
  ClassConfig,
  ConductRank,
  PeriodScope,
  GroupPeriodSummary,
} from '../types';
import { calculateGroupPeriodSummaries } from '../utils/scoring';

interface DashboardOverviewProps {
  scores: StudentWeeklyScore[];
  groupSummaries: GroupWeeklySummary[];
  logs: DailyLogEntry[];
  config: ClassConfig;
  students?: Student[];
  adjustments?: ManualScoreAdjustment[];
  onNavigateToTab: (tab: string) => void;
  onOpenReportForStudent: (studentId: string) => void;
  onOpenNotificationForStudent: (studentId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  scores,
  groupSummaries,
  logs,
  config,
  students = [],
  adjustments = [],
  onNavigateToTab,
  onOpenReportForStudent,
  onOpenNotificationForStudent,
}) => {
  const [groupViewPeriod, setGroupViewPeriod] = useState<PeriodScope>('week');
  // Calculations
  const totalStudents = scores.length || 1;
  const avgClassScore = Number(
    (scores.reduce((sum, s) => sum + s.totalScore, 0) / totalStudents).toFixed(1)
  );

  const weekLogs = logs.filter((l) => l.week === config.currentWeek && l.semester === config.currentSemester);
  const totalPraiseLogs = weekLogs.filter((l) => l.delta > 0).length;
  const totalDeductionLogs = weekLogs.filter((l) => l.delta < 0).length;

  // Rank breakdown counts
  const rankCounts: Record<ConductRank, number> = {
    'Xuất sắc': scores.filter((s) => s.conductRank === 'Xuất sắc').length,
    'Tốt': scores.filter((s) => s.conductRank === 'Tốt').length,
    'Khá': scores.filter((s) => s.conductRank === 'Khá').length,
    'Trung bình': scores.filter((s) => s.conductRank === 'Trung bình').length,
    'Yếu': scores.filter((s) => s.conductRank === 'Yếu').length,
  };

  const topLeadingGroup = groupSummaries[0];

  // Severe infractions in current week
  const severeLogs = weekLogs.filter(
    (l) =>
      l.criteriaName.includes('Sử dụng ĐT') ||
      l.criteriaName.includes('không phép') ||
      l.delta <= -3
  );

  // Top 5 students
  const topStudents = scores.slice(0, 5);

  // Students needing attention (score < 80 or high deductions)
  const studentsNeedingAttention = scores
    .filter((s) => s.totalScore < 85 || s.deductionPoints >= 3)
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, 5);

  // Top violation criteria
  const violationCounts: Record<string, number> = {};
  const praiseCounts: Record<string, number> = {};

  weekLogs.forEach((l) => {
    if (l.delta < 0) {
      violationCounts[l.criteriaName] = (violationCounts[l.criteriaName] || 0) + 1;
    } else {
      praiseCounts[l.criteriaName] = (praiseCounts[l.criteriaName] || 0) + 1;
    }
  });

  const sortedViolations = Object.entries(violationCounts).sort((a, b) => b[1] - a[1]);
  const sortedPraises = Object.entries(praiseCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if any severe violation */}
      {severeLogs.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-900 text-sm sm:text-base">
                  Cảnh báo vi phạm nghiêm trọng tuần {config.currentWeek} ({severeLogs.length} trường hợp)
                </span>
                <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Ưu tiên xử lý
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                Phát hiện các lỗi như sử dụng điện thoại sai quy định hoặc nghỉ không phép. Cần giáo viên chủ nhiệm nắm bắt và gửi thông báo cho phụ huynh.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('notifications')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Gửi cảnh báo Zalo/Email ngay
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Điểm TB Lớp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Điểm TB Lớp Tuần {config.currentWeek}
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{avgClassScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100 điểm chuẩn</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Tiến độ ổn định • {totalStudents} học sinh</span>
          </div>
        </div>

        {/* Card 2: Tổ Dẫn Đầu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tổ Dẫn Đầu Thi Đua
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">
              Tổ {topLeadingGroup?.group || 1}
            </span>
            <span className="text-xs font-bold text-slate-600">
              ({topLeadingGroup?.avgScore || 0} đ)
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            <span>+{topLeadingGroup?.totalPraise || 0} khen thưởng • -{topLeadingGroup?.totalDeductions || 0} trừ</span>
          </div>
        </div>

        {/* Card 3: Tỷ Lệ Tốt & Xuất Sắc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Xếp Loại Tốt / Xuất Sắc
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {Math.round(((rankCounts['Xuất sắc'] + rankCounts['Tốt']) / totalStudents) * 100)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({rankCounts['Xuất sắc'] + rankCounts['Tốt']}/{totalStudents} HS)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>{rankCounts['Xuất sắc']} Xuất sắc • {rankCounts['Tốt']} Tốt • {rankCounts['Khá']} Khá</span>
          </div>
        </div>

        {/* Card 4: Tổng Lượt Ghi Nhận */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Hoạt Động Tuần {config.currentWeek}
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-xl font-bold text-emerald-600">+{totalPraiseLogs}</span>
              <span className="text-[11px] text-slate-400 block">Tuyên dương</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-xl font-bold text-rose-500">-{totalDeductionLogs}</span>
              <span className="text-[11px] text-slate-400 block">Vi phạm</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng {weekLogs.length} lượt</span>
            <button
              onClick={() => onNavigateToTab('daily_logs')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Xem nhật ký →
            </button>
          </div>
        </div>
      </div>

      {/* Group Emulation Leaderboard (4 Tổ) with Semester 1 and Full Year Rankings */}
      {(() => {
        const periodSummaries: GroupPeriodSummary[] =
          groupViewPeriod === 'week' || !students || students.length === 0
            ? groupSummaries.map((g) => ({
                ...g,
                winWeeksCount: g.rank === 1 ? 1 : 0,
                awardTitle:
                  g.rank === 1
                    ? '🏆 Dẫn Đầu Tuần'
                    : g.rank === 2
                    ? '🥈 Hạng Nhì Tuần'
                    : g.rank === 3
                    ? '🥉 Hạng Ba Tuần'
                    : 'Hạng Tư',
                weeksEvaluated: 1,
              }))
            : calculateGroupPeriodSummaries(
                students,
                logs,
                adjustments || [],
                groupViewPeriod,
                config.currentWeek,
                config.baseScore
              );

        const evaluatedWeeksText =
          groupViewPeriod === 'week'
            ? `Tuần ${config.currentWeek}`
            : groupViewPeriod === 'semester1'
            ? `Học Kỳ I (Tuần 1 - 18)`
            : `Toàn Năm Học (Tuần 1 - 35)`;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Header & Period Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900">
                    Bảng Xếp Hạng Thi Đua 4 Tổ — {evaluatedWeeksText}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                    {groupViewPeriod === 'week' ? 'Theo tuần' : groupViewPeriod === 'semester1' ? 'Tích luỹ HK1' : 'Tích luỹ cả năm'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Đánh giá thi đua rèn luyện công bằng giữa các tổ dựa trên điểm trung bình thành viên, điểm khen và lỗi vi phạm
                </p>
              </div>

              {/* Segmented Period Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGroupViewPeriod('week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupViewPeriod === 'week'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Tuần {config.currentWeek}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupViewPeriod('semester1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    groupViewPeriod === 'semester1'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Medal className="w-3.5 h-3.5 text-amber-500" />
                  Học Kỳ I
                </button>
                <button
                  type="button"
                  onClick={() => setGroupViewPeriod('year')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    groupViewPeriod === 'year'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-indigo-600" />
                  Cả Năm Học
                </button>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {periodSummaries.map((g) => {
                const isFirst = g.rank === 1;
                const isSecond = g.rank === 2;
                const isThird = g.rank === 3;

                return (
                  <div
                    key={g.group}
                    className={`relative rounded-xl border p-4 transition-all ${
                      isFirst
                        ? 'bg-gradient-to-b from-amber-50/90 to-white border-amber-300 shadow-md ring-2 ring-amber-400/20'
                        : isSecond
                        ? 'bg-gradient-to-b from-slate-50 to-white border-slate-300 shadow-xs'
                        : isThird
                        ? 'bg-gradient-to-b from-orange-50/50 to-white border-orange-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Header Rank Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                            isFirst
                              ? 'bg-amber-400 text-white'
                              : isSecond
                              ? 'bg-slate-300 text-slate-800'
                              : isThird
                              ? 'bg-orange-300 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {g.rank}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">Tổ {g.group}</h3>
                          <span className="text-[10px] text-slate-400 block">
                            {g.memberCount} thành viên
                          </span>
                        </div>
                      </div>

                      {/* Best win weeks indicator */}
                      {g.winWeeksCount > 0 && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5"
                          title={`Số tuần Tổ ${g.group} dẫn đầu`}
                        >
                          <Trophy className="w-2.5 h-2.5 text-amber-600" />
                          {g.winWeeksCount} lần nhất
                        </span>
                      )}
                    </div>

                    {/* Award Title Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isFirst
                            ? 'bg-amber-100/90 text-amber-900 border border-amber-200'
                            : isSecond
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : isThird
                            ? 'bg-orange-100/70 text-orange-900 border border-orange-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {g.awardTitle}
                      </span>
                    </div>

                    {/* Avg Score */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">{g.avgScore}</span>
                        <span className="text-xs text-slate-400 font-semibold">
                          {groupViewPeriod === 'week' ? 'điểm TB tuần' : 'điểm TB tích luỹ'}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            g.avgScore >= 95
                              ? 'bg-emerald-500'
                              : g.avgScore >= 85
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, g.avgScore))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Praise & Deduction breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <span>+{g.totalPraise}</span>
                        <span className="text-slate-400 text-[10px] font-normal">thưởng</span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500 font-semibold justify-end">
                        <span>-{g.totalDeductions}</span>
                        <span className="text-slate-400 text-[10px] font-normal">vi phạm</span>
                      </div>
                    </div>

                    {/* Leading student */}
                    {g.topStudents[0] && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Tiêu biểu của tổ:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {g.topStudents[0].student.fullName} ({g.topStudents[0].totalScore}đ)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparative Head-to-Head Table for the 4 Groups */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                So sánh đối đầu 4 Tổ — {evaluatedWeeksText}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                      <th className="py-2.5 px-3 font-semibold">Tên Tổ</th>
                      <th className="py-2.5 px-3">Danh Hiệu Thi Đua</th>
                      <th className="py-2.5 px-3 text-center">Điểm TB</th>
                      <th className="py-2.5 px-3 text-center">Số Tuần Nhất</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">Tổng Khen (+)</th>
                      <th className="py-2.5 px-3 text-center text-rose-700">Tổng Trừ (-)</th>
                      <th className="py-2.5 px-3 text-center">Tỷ Lệ Thi Đua</th>
                      <th className="py-2.5 px-3 text-right">Gương Mặt Sáng Tổ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodSummaries.map((g) => (
                      <tr key={g.group} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black ${
                              g.rank === 1
                                ? 'bg-amber-400 text-white'
                                : g.rank === 2
                                ? 'bg-slate-300 text-slate-800'
                                : g.rank === 3
                                ? 'bg-orange-300 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {g.rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          Tổ {g.group} ({g.memberCount} HS)
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-700">{g.awardTitle}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                          {g.avgScore}đ
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                          {g.winWeeksCount} tuần
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                          +{g.totalPraise}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-500">
                          -{g.totalDeductions}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.avgScore >= 95
                                ? 'bg-purple-100 text-purple-800'
                                : g.avgScore >= 85
                                ? 'bg-emerald-100 text-emerald-800'
                                : g.avgScore >= 70
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {g.avgScore >= 95
                              ? 'Xuất sắc'
                              : g.avgScore >= 85
                              ? 'Tốt'
                              : g.avgScore >= 70
                              ? 'Khá'
                              : 'Trung bình'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                          {g.topStudents[0] ? g.topStudents[0].student.fullName : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2 Columns: Top Students & Attention Needed + Common Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Students of the Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Học Sinh Tiêu Biểu Xuất Sắc (Tuần {config.currentWeek})
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Gương sáng tuần
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topStudents.map((s, idx) => (
              <div
                key={s.student.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-400 text-white'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-orange-300 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {s.student.fullName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        Tổ {s.student.group}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Mã: {s.student.code} • {s.student.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm sm:text-base">
                      {s.totalScore}
                    </span>
                    <span className="text-[10px] text-emerald-600 block font-medium">
                      +{s.praisePoints}đ khen
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenReportForStudent(s.student.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Xem phiếu báo cáo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Học Sinh Cần Lưu Ý & Đôn Đốc
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Nhắc nhở
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {studentsNeedingAttention.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Không có học sinh nào bị trừ điểm nhiều trong tuần này!
              </div>
            ) : (
              studentsNeedingAttention.map((s) => (
                <div
                  key={s.student.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {s.student.fullName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        Tổ {s.student.group}
                      </span>
                    </div>
                    <span className="text-[11px] text-rose-600 font-medium">
                      Bị trừ: -{s.deductionPoints}đ • Điểm còn lại: {s.totalScore}đ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenNotificationForStudent(s.student.id)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-md border border-amber-200 flex items-center gap-1 transition-colors"
                      title="Gửi tin nhắn Zalo/Email cho phụ huynh"
                    >
                      <Send className="w-3 h-3" />
                      Nhắn PH
                    </button>
                    <button
                      onClick={() => onOpenReportForStudent(s.student.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem phiếu báo cáo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Violations and Praises Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most common violations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
            Các Lỗi Vi Phạm Phổ Biến Trong Tuần
          </h3>
          {sortedViolations.length === 0 ? (
            <p className="text-xs text-slate-400">Không có vi phạm nào.</p>
          ) : (
            <div className="space-y-2.5">
              {sortedViolations.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (sortedViolations[0][1] || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-rose-600 w-6 text-right">{count} lần</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most common praises */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Các Điểm Sáng Tuyên Dương Trong Tuần
          </h3>
          {sortedPraises.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có lượt tuyên dương nào.</p>
          ) : (
            <div className="space-y-2.5">
              {sortedPraises.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (sortedPraises[0][1] || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-emerald-600 w-6 text-right">{count} lần</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
