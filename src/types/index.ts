export type GroupNumber = 1 | 2 | 3 | 4;

export type StudentRole = 'Học sinh' | 'Tổ trưởng' | 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó lao động' | 'Cán sự cờ đỏ';

export interface Student {
  id: string;
  code: string; // Mã số học sinh, ví dụ HS1001
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob?: string;
  group: GroupNumber;
  role: StudentRole;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  zaloPhone?: string;
  address?: string;
}

export interface CriteriaCategory {
  id: string;
  name: string; // Học tập, Chuyên cần, Nền nếp, Vệ sinh, Tác phong, Hoạt động, Tự quản
  maxPoints: number; // 30, 15, 20, 10, 10, 10, 5 = 100
  color: string;
}

export interface CriteriaItem {
  id: string;
  codeName: string; // Mã nội dung: e.g. "Nghỉ có phép", "Không thuộc bài"
  category: string; // Phù hợp với name của CriteriaCategory
  delta: number; // e.g. -1, -2, -3, +1, +2, +3, +5
  type: 'deduction' | 'praise'; // Điểm trừ hoặc tuyên dương
  isSevere?: boolean; // Vi phạm nghiêm trọng (cần thông báo tức thì cho GVCN)
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface DailyLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  group: GroupNumber;
  date: string; // YYYY-MM-DD
  week: number; // 1 -> 35
  semester: 1 | 2;
  dayOfWeek: DayOfWeek;
  session: 'morning' | 'afternoon'; // Buổi sáng / Buổi chiều (ngày học 2 buổi)
  period: number; // 1..5 (tối đa 5 tiết mỗi buổi)
  criteriaId: string;
  criteriaName: string;
  category: string;
  delta: number;
  note?: string;
  loggedByRole: string; // e.g., 'Tổ trưởng Tổ 1', 'GVCN'
  loggedByName: string;
  createdAt: string;
}

export interface ManualScoreAdjustment {
  id: string;
  studentId: string;
  week: number;
  semester: 1 | 2;
  delta: number; // Điểm điều chỉnh thủ công của GVCN
  reason: string;
  adjustedBy: string;
  updatedAt: string;
}

export type ConductRank = 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';

export interface StudentWeeklyScore {
  student: Student;
  week: number;
  semester: 1 | 2;
  baseScore: number; // 100
  praisePoints: number;
  deductionPoints: number;
  manualAdjustment: number;
  manualReasons: string[];
  totalScore: number;
  rank: number;
  conductRank: ConductRank;
  logCount: number;
  categoryBreakdown: Record<string, { praise: number; deduction: number; net: number }>;
  logs: DailyLogEntry[];
}

export interface GroupWeeklySummary {
  group: GroupNumber;
  memberCount: number;
  avgScore: number;
  totalPraise: number;
  totalDeductions: number;
  topStudents: StudentWeeklyScore[];
  attentionStudents: StudentWeeklyScore[];
  rank: number;
}

export type PeriodScope = 'week' | 'semester1' | 'semester2' | 'year';

export interface GroupPeriodSummary extends GroupWeeklySummary {
  winWeeksCount: number; // Số tuần đứng hạng nhất
  awardTitle: string;    // Danh hiệu thi đua (Cờ đầu, Tiên tiến...)
  weeksEvaluated: number;
}

export type UserRole = 'teacher' | 'team_leader' | 'class_monitor' | 'student';

export interface CurrentUser {
  role: UserRole;
  name: string;
  groupAccess?: GroupNumber | 'all'; // Tổ trưởng chỉ phụ trách tổ của mình hoặc có thể xem cả lớp
  title: string;
}

export interface ClassConfig {
  schoolName: string;
  className: string;
  academicYear: string;
  homeroomTeacher: string;
  teacherEmail: string;
  teacherPhone: string;
  currentWeek: number; // 1 - 35 (HK1: 1-18, HK2: 19-35)
  currentSemester: 1 | 2;
  baseScore: number; // 100
}

export interface NotificationRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: 'zalo' | 'email' | 'instant_violation' | 'reminder';
  title: string;
  message: string;
  recipientContact: string;
  createdAt: string;
  status: 'sent' | 'copied' | 'ready';
}

export interface AccessCodesConfig {
  teacher: string; // Mã GVCN
  team1: string;   // Mã Tổ trưởng Tổ 1
  team2: string;   // Mã Tổ trưởng Tổ 2
  team3: string;   // Mã Tổ trưởng Tổ 3
  team4: string;   // Mã Tổ trưởng Tổ 4
  monitor: string; // Mã Ban cán sự lớp
}

