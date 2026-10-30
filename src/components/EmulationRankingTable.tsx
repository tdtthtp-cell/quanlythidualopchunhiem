import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Search,
  Filter,
  Download,
  Edit3,
  Eye,
  Send,
  ArrowUpDown,
  Sparkles,
  Users,
  CheckCircle,
  HelpCircle,
  Medal,
  Crown,
} from 'lucide-react';
import {
  Student,
  DailyLogEntry,
  StudentWeeklyScore,
  ClassConfig,
  ConductRank,
  GroupNumber,
  ManualScoreAdjustment,
  CurrentUser,
  PeriodScope,
  GroupPeriodSummary,
} from '../types';
import { exportWeeklyRankingToExcel, exportPeriodRankingToExcel } from '../utils/excel';
import { calculateStudentPeriodScores, calculateGroupPeriodSummaries } from '../utils/scoring';

interface EmulationRankingTableProps {
  scores: StudentWeeklyScore[];
  config: ClassConfig;
  currentUser: CurrentUser;
  students?: Student[];
  logs?: DailyLogEntry[];
  adjustments?: ManualScoreAdjustment[];
  onOpenReportModal: (studentId: string) => void;
  onOpenNotificationModal: (studentId: string) => void;
  onSaveManualAdjustment: (studentId: string, delta: number, reason: string) => void;
}

export const EmulationRankingTable: React.FC<EmulationRankingTableProps> = ({
  scores,
  config,
  currentUser,
  students = [],
  logs = [],
  adjustments = [],
  onOpenReportModal,
  onOpenNotificationModal,
  onSaveManualAdjustment,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodScope>('week');
  const [selectedGroup, setSelectedGroup] = useState<GroupNumber | 'all'>('all');
  const [selectedRank, setSelectedRank] = useState<ConductRank | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active student scores based on period
  const activeScores = useMemo(() => {
    if (selectedPeriod === 'week' || !students || students.length === 0) {
      return scores;
    }
    return calculateStudentPeriodScores(
      students,
      logs,
      adjustments,
      selectedPeriod,
      config.currentWeek,
      config.baseScore
    );
  }, [selectedPeriod, students, logs, adjustments, scores, config.currentWeek, config.baseScore]);

  // Group standings for this period
  const groupStandings = useMemo(() => {
    if (!students || students.length === 0) return [];
    return calculateGroupPeriodSummaries(
      students,
      logs,
      adjustments,
      selectedPeriod,
      config.currentWeek,
      config.baseScore
    );
  }, [students, logs, adjustments, selectedPeriod, config.currentWeek, config.baseScore]);

  // Manual edit modal state
  const [editingStudent, setEditingStudent] = useState<StudentWeeklyScore | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Filtered scores
  const filteredScores = useMemo(() => {
    return activeScores.filter((item) => {
      // Group filter
      if (selectedGroup !== 'all' && item.student.group !== selectedGroup) return false;

      // Rank filter
      if (selectedRank !== 'all' && item.conductRank !== selectedRank) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchCode = item.student.code.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }

      return true;
    });
  }, [scores, selectedGroup, selectedRank, searchQuery]);

  // Open manual adjust modal
  const handleOpenAdjust = (item: StudentWeeklyScore) => {
    setEditingStudent(item);
    setAdjustDelta(item.manualAdjustment || 0);
    setAdjustReason(item.manualReasons.join('; ') || '');
  };

  const handleSaveAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    onSaveManualAdjustment(editingStudent.student.id, Number(adjustDelta), adjustReason.trim());
    setEditingStudent(null);
  };

  const getRankBadgeStyle = (rank: ConductRank) => {
    switch (rank) {
      case 'Xuất sắc':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tốt':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Khá':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Trung bình':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Yếu':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Bảng Điểm Thi Đua & Xếp Hạng — {selectedPeriod === 'week' ? `Tuần ${config.currentWeek}` : selectedPeriod === 'semester1' ? 'Học Kỳ I (Tuần 1 - 18)' : 'Cả Năm Học (Tuần 1 - 35)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {selectedPeriod === 'week'
                ? 'Điểm chuẩn 100 điểm ban đầu. Tự động cộng thưởng, trừ phạt và đồng bộ theo tiêu chí tuần.'
                : 'Điểm trung bình tích luỹ theo từng tuần học, tổng hợp khen thưởng và vi phạm qua các tuần.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần {config.currentWeek}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('semester1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedPeriod === 'semester1'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Medal className="w-3.5 h-3.5 text-amber-500" />
                Học Kỳ I
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedPeriod === 'year'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-indigo-600" />
                Cả Năm
              </button>
            </div>

            {/* Excel Export */}
            <button
              onClick={() => {
                if (selectedPeriod === 'week') {
                  exportWeeklyRankingToExcel(filteredScores, config.currentWeek, config.className);
                } else if (selectedPeriod === 'semester1') {
                  exportPeriodRankingToExcel(filteredScores, 'Học_Kỳ_I', config.className);
                } else {
                  exportPeriodRankingToExcel(filteredScores, 'Cả_Năm_Học', config.className);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* 4 Groups Standings Quick Banner for the chosen period */}
        {groupStandings.length > 0 && (
          <div className="py-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Xếp hạng 4 Tổ ({selectedPeriod === 'week' ? `Tuần ${config.currentWeek}` : selectedPeriod === 'semester1' ? 'Học kỳ I' : 'Cả năm'}):
              </span>
              <span className="text-[11px] text-slate-400">
                Bấm vào từng tổ để lọc nhanh học sinh
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {groupStandings.map((g) => {
                const isSelected = selectedGroup === g.group;
                return (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setSelectedGroup(isSelected ? 'all' : g.group)}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500 shadow-xs'
                        : g.rank === 1
                        ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] font-black inline-flex items-center justify-center ${
                            g.rank === 1
                              ? 'bg-amber-400 text-white'
                              : g.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : g.rank === 3
                              ? 'bg-orange-300 text-amber-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {g.rank}
                        </span>
                        Tổ {g.group}
                      </span>
                      <span className="text-xs font-black text-slate-800">{g.avgScore}đ</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate" title={g.awardTitle}>
                      {g.awardTitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Groups filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Lọc Tổ:
            </span>
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Cả lớp ({activeScores.length})
            </button>
            {([1, 2, 3, 4] as GroupNumber[]).map((g) => {
              const groupCount = activeScores.filter((s) => s.student.group === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedGroup === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  Tổ {g} ({groupCount})
                </button>
              );
            })}
          </div>

          {/* Conduct Rank filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              aria-label="Lọc theo xếp loại"
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value as ConductRank | 'all')}
              className="bg-white text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 shadow-2xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="Xuất sắc">Xuất sắc (&gt;= 95đ)</option>
              <option value="Tốt">Tốt (85 - 94đ)</option>
              <option value="Khá">Khá (70 - 84đ)</option>
              <option value="Trung bình">Trung bình (50 - 69đ)</option>
              <option value="Yếu">Yếu (&lt; 50đ)</option>
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã HS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">Hạng</th>
                <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                <th className="py-3 px-3 text-center">Tổ</th>
                <th className="py-3 px-3 text-center">Gốc</th>
                <th className="py-3 px-3 text-center text-emerald-700">Thưởng (+)</th>
                <th className="py-3 px-3 text-center text-rose-700">Trừ (-)</th>
                <th className="py-3 px-3 text-center text-indigo-700">GVCN</th>
                <th className="py-3 px-4 text-center font-black">Tổng Điểm</th>
                <th className="py-3 px-3 text-center">Xếp Loại</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScores.map((item) => {
                const isTop3 = item.rank <= 3;

                return (
                  <tr
                    key={item.student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isTop3 ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Hạng */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          item.rank === 1
                            ? 'bg-amber-400 text-white shadow-xs'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : item.rank === 3
                            ? 'bg-orange-300 text-amber-900'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>

                    {/* Họ tên */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.student.code} • {item.student.role}
                      </div>
                    </td>

                    {/* Tổ */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Tổ {item.student.group}
                      </span>
                    </td>

                    {/* Điểm gốc */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-500">
                      {item.baseScore}
                    </td>

                    {/* Điểm thưởng */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-emerald-600">
                      {item.praisePoints > 0 ? `+${item.praisePoints}` : '0'}
                    </td>

                    {/* Điểm phạt */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-rose-500">
                      {item.deductionPoints > 0 ? `-${item.deductionPoints}` : '0'}
                    </td>

                    {/* GVCN chỉnh sửa */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-medium">
                      {item.manualAdjustment !== 0 ? (
                        <span
                          className={`font-bold ${
                            item.manualAdjustment > 0 ? 'text-indigo-600' : 'text-amber-600'
                          }`}
                          title={item.manualReasons.join('; ')}
                        >
                          {item.manualAdjustment > 0
                            ? `+${item.manualAdjustment}`
                            : item.manualAdjustment}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Tổng điểm */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                          item.totalScore >= 95
                            ? 'bg-purple-100 text-purple-900'
                            : item.totalScore >= 85
                            ? 'bg-emerald-100 text-emerald-900'
                            : item.totalScore >= 70
                            ? 'bg-blue-100 text-blue-900'
                            : item.totalScore >= 50
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {item.totalScore}
                      </span>
                    </td>

                    {/* Xếp loại */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRankBadgeStyle(
                          item.conductRank
                        )}`}
                      >
                        {item.conductRank}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      {/* Sửa điểm thủ công (GVCN) */}
                      {currentUser.role === 'teacher' && (
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="GVCN chỉnh sửa điểm thủ công"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Xem báo cáo PDF */}
                      <button
                        onClick={() => onOpenReportModal(item.student.id)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem phiếu báo cáo thi đua tuần"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Gửi Zalo/Email cho PH */}
                      <button
                        onClick={() => onOpenNotificationModal(item.student.id)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Gửi thông báo Zalo / Email cho phụ huynh"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Giáo Viên Chủ Nhiệm Chỉnh Sửa Điểm Thủ Công */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                GVCN Điều Chỉnh Điểm Thủ Công
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustmentSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">
                  {editingStudent.student.fullName}
                </div>
                <div className="text-slate-500 mt-0.5">
                  Mã: {editingStudent.student.code} • Tổ {editingStudent.student.group} • Tuần {config.currentWeek}
                </div>
                <div className="text-slate-600 mt-2 flex items-center gap-2">
                  <span>Điểm hiện tại: <strong>{editingStudent.totalScore}đ</strong></span>
                  <span>(Thưởng +{editingStudent.praisePoints}đ / Trừ -{editingStudent.deductionPoints}đ)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Điểm điều chỉnh (+ hoặc -):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nhập số dương (ví dụ: +2) nếu cộng thưởng đặc biệt; nhập số âm (ví dụ: -2) nếu trừ điểm kỷ luật.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do điều chỉnh (Bắt buộc để lưu vào biên bản):
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Đóng góp tích cực trong chương trình văn nghệ 20/11 của trường..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Lưu thay đổi điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
