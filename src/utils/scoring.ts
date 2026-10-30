import {
  Student,
  DailyLogEntry,
  ManualScoreAdjustment,
  StudentWeeklyScore,
  GroupWeeklySummary,
  GroupNumber,
  ConductRank,
} from '../types';

export function calculateConductRank(totalScore: number): ConductRank {
  if (totalScore >= 95) return 'Xuất sắc';
  if (totalScore >= 85) return 'Tốt';
  if (totalScore >= 70) return 'Khá';
  if (totalScore >= 50) return 'Trung bình';
  return 'Yếu';
}

export function calculateStudentWeeklyScores(
  students: Student[],
  logs: DailyLogEntry[],
  adjustments: ManualScoreAdjustment[],
  week: number,
  semester: 1 | 2 = 1,
  baseScore: number = 100
): StudentWeeklyScore[] {
  // Filter logs for this week and semester
  const weekLogs = logs.filter((l) => l.week === week && l.semester === semester);
  const weekAdjustments = adjustments.filter((a) => a.week === week && a.semester === semester);

  const scores: StudentWeeklyScore[] = students.map((student) => {
    const studentLogs = weekLogs.filter((l) => l.studentId === student.id);
    const studentAdjs = weekAdjustments.filter((a) => a.studentId === student.id);

    let praisePoints = 0;
    let deductionPoints = 0;
    const categoryBreakdown: Record<string, { praise: number; deduction: number; net: number }> = {};

    studentLogs.forEach((log) => {
      const cat = log.category || 'Khác';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { praise: 0, deduction: 0, net: 0 };
      }

      if (log.delta > 0) {
        praisePoints += log.delta;
        categoryBreakdown[cat].praise += log.delta;
      } else {
        deductionPoints += Math.abs(log.delta);
        categoryBreakdown[cat].deduction += Math.abs(log.delta);
      }
      categoryBreakdown[cat].net += log.delta;
    });

    const manualAdjustment = studentAdjs.reduce((sum, adj) => sum + adj.delta, 0);
    const manualReasons = studentAdjs.map((a) => a.reason).filter(Boolean);

    // Total formula: 100 + praises - deductions + manualAdjustment
    const calculatedTotal = baseScore + praisePoints - deductionPoints + manualAdjustment;
    const totalScore = Math.max(0, calculatedTotal);

    return {
      student,
      week,
      semester,
      baseScore,
      praisePoints,
      deductionPoints,
      manualAdjustment,
      manualReasons,
      totalScore,
      rank: 0, // assigned after sorting
      conductRank: calculateConductRank(totalScore),
      logCount: studentLogs.length,
      categoryBreakdown,
      logs: studentLogs,
    };
  });

  // Sort descending by totalScore, then praisePoints descending, then deduction ascending
  scores.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.praisePoints !== a.praisePoints) return b.praisePoints - a.praisePoints;
    return a.deductionPoints - b.deductionPoints;
  });

  // Assign rankings (handling ties)
  scores.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scores;
}

export function calculateGroupSummaries(studentScores: StudentWeeklyScore[]): GroupWeeklySummary[] {
  const groups: GroupNumber[] = [1, 2, 3, 4];

  const summaries: GroupWeeklySummary[] = groups.map((g) => {
    const groupMembers = studentScores.filter((s) => s.student.group === g);
    const memberCount = groupMembers.length;

    if (memberCount === 0) {
      return {
        group: g,
        memberCount: 0,
        avgScore: 0,
        totalPraise: 0,
        totalDeductions: 0,
        topStudents: [],
        attentionStudents: [],
        rank: g,
      };
    }

    const totalScoreSum = groupMembers.reduce((sum, m) => sum + m.totalScore, 0);
    const totalPraise = groupMembers.reduce((sum, m) => sum + m.praisePoints, 0);
    const totalDeductions = groupMembers.reduce((sum, m) => sum + m.deductionPoints, 0);
    const avgScore = Number((totalScoreSum / memberCount).toFixed(1));

    // Sort group members to get top and those needing attention
    const sortedMembers = [...groupMembers].sort((a, b) => b.totalScore - a.totalScore);
    const topStudents = sortedMembers.slice(0, 3);
    const attentionStudents = sortedMembers.filter((m) => m.deductionPoints > 0 || m.totalScore < 85);

    return {
      group: g,
      memberCount,
      avgScore,
      totalPraise,
      totalDeductions,
      topStudents,
      attentionStudents,
      rank: 0,
    };
  });

  // Sort groups by avgScore descending
  summaries.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return a.totalDeductions - b.totalDeductions;
  });

  summaries.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return summaries;
}

/**
 * Determine weeks to evaluate for a given period scope
 */
export function getWeeksForPeriod(
  period: 'week' | 'semester1' | 'semester2' | 'year',
  currentWeek: number,
  logs: DailyLogEntry[] = []
): number[] {
  if (period === 'week') return [currentWeek];

  const maxLogWeek = logs.length > 0 ? Math.max(...logs.map((l) => l.week)) : 1;
  const highestWeek = Math.max(currentWeek, maxLogWeek);

  if (period === 'semester1') {
    // Weeks 1 to 18 (at least up to highest recorded or currentWeek in HK1, or 18 if in HK2)
    const endWeek = highestWeek > 18 ? 18 : Math.max(1, Math.min(18, highestWeek));
    return Array.from({ length: endWeek }, (_, i) => i + 1);
  }

  if (period === 'semester2') {
    // Weeks 19 to 35
    const startWeek = 19;
    const endWeek = Math.max(19, Math.min(35, highestWeek));
    const length = endWeek - startWeek + 1;
    return Array.from({ length }, (_, i) => startWeek + i);
  }

  // Full Year: weeks 1 to highest active week (max 35)
  const endWeek = Math.max(1, Math.min(35, highestWeek));
  return Array.from({ length: endWeek }, (_, i) => i + 1);
}

/**
 * Calculate cumulative scores for students across a period (Tuần, Học kỳ I, Cả năm)
 */
export function calculateStudentPeriodScores(
  students: Student[],
  logs: DailyLogEntry[],
  adjustments: ManualScoreAdjustment[],
  period: 'week' | 'semester1' | 'semester2' | 'year',
  currentWeek: number,
  baseScore: number = 100
): StudentWeeklyScore[] {
  if (period === 'week') {
    const sem: 1 | 2 = currentWeek <= 18 ? 1 : 2;
    return calculateStudentWeeklyScores(students, logs, adjustments, currentWeek, sem, baseScore);
  }

  const evalWeeks = getWeeksForPeriod(period, currentWeek, logs);
  const weeksCount = evalWeeks.length || 1;

  // Calculate scores for each week
  const weeklyScoresMap = new Map<number, StudentWeeklyScore[]>();
  evalWeeks.forEach((w) => {
    const sem: 1 | 2 = w <= 18 ? 1 : 2;
    weeklyScoresMap.set(w, calculateStudentWeeklyScores(students, logs, adjustments, w, sem, baseScore));
  });

  // Aggregate across weeks for each student
  const aggregated: StudentWeeklyScore[] = students.map((student) => {
    let sumScore = 0;
    let totalPraise = 0;
    let totalDeduction = 0;
    let totalManual = 0;
    const manualReasons: string[] = [];
    const allStudentLogs: DailyLogEntry[] = [];
    const categoryBreakdown: Record<string, { praise: number; deduction: number; net: number }> = {};

    evalWeeks.forEach((w) => {
      const weekScores = weeklyScoresMap.get(w);
      const studentScore = weekScores?.find((s) => s.student.id === student.id);
      if (studentScore) {
        sumScore += studentScore.totalScore;
        totalPraise += studentScore.praisePoints;
        totalDeduction += studentScore.deductionPoints;
        totalManual += studentScore.manualAdjustment;
        manualReasons.push(...studentScore.manualReasons);
        allStudentLogs.push(...studentScore.logs);

        Object.entries(studentScore.categoryBreakdown).forEach(([cat, b]) => {
          if (!categoryBreakdown[cat]) {
            categoryBreakdown[cat] = { praise: 0, deduction: 0, net: 0 };
          }
          categoryBreakdown[cat].praise += b.praise;
          categoryBreakdown[cat].deduction += b.deduction;
          categoryBreakdown[cat].net += b.net;
        });
      } else {
        sumScore += baseScore;
      }
    });

    const avgScore = Number((sumScore / weeksCount).toFixed(1));

    return {
      student,
      week: currentWeek,
      semester: period === 'semester2' ? 2 : 1,
      baseScore,
      praisePoints: totalPraise,
      deductionPoints: totalDeduction,
      manualAdjustment: totalManual,
      manualReasons: Array.from(new Set(manualReasons)),
      totalScore: avgScore,
      rank: 0,
      conductRank: calculateConductRank(avgScore),
      logCount: allStudentLogs.length,
      categoryBreakdown,
      logs: allStudentLogs,
    };
  });

  // Sort descending by average score, then praises descending, then deductions ascending
  aggregated.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.praisePoints !== a.praisePoints) return b.praisePoints - a.praisePoints;
    return a.deductionPoints - b.deductionPoints;
  });

  aggregated.forEach((item, index) => {
    item.rank = index + 1;
  });

  return aggregated;
}

/**
 * Calculate comprehensive group emulation rankings for a period (Tuần, Học kỳ I, Cả năm)
 */
export function calculateGroupPeriodSummaries(
  students: Student[],
  logs: DailyLogEntry[],
  adjustments: ManualScoreAdjustment[],
  period: 'week' | 'semester1' | 'semester2' | 'year',
  currentWeek: number,
  baseScore: number = 100
): import('../types').GroupPeriodSummary[] {
  const groups: GroupNumber[] = [1, 2, 3, 4];
  const evalWeeks = getWeeksForPeriod(period, currentWeek, logs);
  const weeksCount = evalWeeks.length || 1;

  // Track weekly winning group
  const winCounts: Record<GroupNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  evalWeeks.forEach((w) => {
    const sem: 1 | 2 = w <= 18 ? 1 : 2;
    const weekScores = calculateStudentWeeklyScores(students, logs, adjustments, w, sem, baseScore);
    const weekGroups = calculateGroupSummaries(weekScores);
    if (weekGroups.length > 0 && weekGroups[0].memberCount > 0) {
      winCounts[weekGroups[0].group] = (winCounts[weekGroups[0].group] || 0) + 1;
    }
  });

  // Period scores for each student
  const studentPeriodScores = calculateStudentPeriodScores(
    students,
    logs,
    adjustments,
    period,
    currentWeek,
    baseScore
  );

  const summaries = groups.map((g) => {
    const groupMembers = studentPeriodScores.filter((s) => s.student.group === g);
    const memberCount = groupMembers.length;

    if (memberCount === 0) {
      return {
        group: g,
        memberCount: 0,
        avgScore: 0,
        totalPraise: 0,
        totalDeductions: 0,
        topStudents: [],
        attentionStudents: [],
        rank: g,
        winWeeksCount: 0,
        awardTitle: 'Chưa có thành viên',
        weeksEvaluated: weeksCount,
      };
    }

    const totalScoreSum = groupMembers.reduce((sum, m) => sum + m.totalScore, 0);
    const totalPraise = groupMembers.reduce((sum, m) => sum + m.praisePoints, 0);
    const totalDeductions = groupMembers.reduce((sum, m) => sum + m.deductionPoints, 0);
    const avgScore = Number((totalScoreSum / memberCount).toFixed(1));

    const sortedMembers = [...groupMembers].sort((a, b) => b.totalScore - a.totalScore);
    const topStudents = sortedMembers.slice(0, 3);
    const attentionStudents = sortedMembers.filter((m) => m.deductionPoints > 0 || m.totalScore < 85);

    return {
      group: g,
      memberCount,
      avgScore,
      totalPraise,
      totalDeductions,
      topStudents,
      attentionStudents,
      rank: 0,
      winWeeksCount: winCounts[g] || 0,
      awardTitle: '',
      weeksEvaluated: weeksCount,
    };
  });

  // Sort groups by avgScore descending, then totalDeductions ascending, then totalPraise descending
  summaries.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (a.totalDeductions !== b.totalDeductions) return a.totalDeductions - b.totalDeductions;
    return b.totalPraise - a.totalPraise;
  });

  // Assign ranks and titles
  summaries.forEach((s, idx) => {
    s.rank = idx + 1;
    if (idx === 0) {
      if (period === 'semester1') {
        s.awardTitle = '🏆 Cờ Thi Đua Dẫn Đầu Học Kỳ I';
      } else if (period === 'year') {
        s.awardTitle = '👑 Đơn Vị Xuất Sắc Nhất Cả Năm';
      } else {
        s.awardTitle = '🏆 Tổ Dẫn Đầu Thi Đua Tuần';
      }
    } else if (idx === 1) {
      s.awardTitle = '🥈 Tổ Tiên Tiến Xuất Sắc';
    } else if (idx === 2) {
      s.awardTitle = '🥉 Tổ Vững Mạnh Nền Nếp';
    } else {
      s.awardTitle = '🚩 Tổ Cần Tăng Tốc Thi Đua';
    }
  });

  return summaries;
}

// Convert day of week into Vietnamese label
export function getDayLabelVi(day: string): string {
  switch (day) {
    case 'Monday':
      return 'Thứ Hai';
    case 'Tuesday':
      return 'Thứ Ba';
    case 'Wednesday':
      return 'Thứ Tư';
    case 'Thursday':
      return 'Thứ Năm';
    case 'Friday':
      return 'Thứ Sáu';
    case 'Saturday':
      return 'Thứ Bảy';
    default:
      return day;
  }
}

