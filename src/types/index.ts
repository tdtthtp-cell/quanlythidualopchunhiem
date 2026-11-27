export type GroupNumber = 1 | 2 | 3 | 4;

export type StudentRole = 'Học sinh' | 'Tổ trưởng' | 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó lao động' | 'Cán sự cờ đỏ';

export interface Student {
  id: string;
  code: string; // Mã số học sinh, ví dụ HS1001
  fullName: string;
  className?: string; // Lớp chủ nhiệm, ví dụ "Lớp 10A3", "Lớp 10A1"
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

export type UserRole =
  | 'super_admin'
  | 'teacher'
  | 'team_leader'
  | 'class_monitor'
  | 'student'
  | 'delegated';

export interface DelegatedPermission {
  canLogDaily: boolean;      // Ghi nhận vi phạm & tuyên dương việc tốt
  canEditLogs: boolean;      // Chỉnh sửa nhật ký đã ghi
  canDeleteLogs: boolean;    // Xóa nhật ký đã ghi
  canAdjustScores: boolean;  // Điều chỉnh điểm rèn luyện thi đua (thủ công)
  canSendNotice: boolean;    // Gửi thông báo Zalo / Email cho phụ huynh
  canManageSchedule?: boolean; // Lên lịch hoạt động & gửi nhắc việc
  groupScope: GroupNumber | 'all'; // Phạm vi tổ được phân công (Tổ 1-4 hoặc Cả lớp)
}

export interface DelegatedUser {
  id: string;
  name: string;              // Họ và tên người được uỷ quyền
  title: string;             // Chức danh/Nhiệm vụ (VD: GVBM Toán, Giám thị khối, Thư ký...)
  accessCode: string;        // Mã PIN / khoá truy cập uỷ quyền
  permissions: DelegatedPermission;
  isActive: boolean;         // Trạng thái kích hoạt (true/false)
  notes?: string;            // Ghi chú nhiệm vụ
  createdAt: string;
  delegatedBy?: string;      // GVCN cấp quyền
}

export interface CurrentUser {
  role: UserRole;
  name: string;
  email?: string;
  assignedClassName?: string; // Lớp được phân công (VD: "Lớp 10A1", "Lớp 10A3"); Super Admin thấy tất cả lớp
  groupAccess?: GroupNumber | 'all'; // Tổ trưởng chỉ phụ trách tổ của mình hoặc có thể xem cả lớp
  title: string;
  delegatedPermissions?: DelegatedPermission;
  delegatedUserId?: string;
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

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export type ScheduleCategory =
  | 'cleaning'
  | 'academic'
  | 'discipline'
  | 'movement'
  | 'meeting'
  | 'other';

export interface ScheduledActivity {
  id: string;
  title: string;
  description: string;
  frequency: ScheduleFrequency;
  category: ScheduleCategory;
  dayOfWeek?: DayOfWeek | 'All'; // Áp dụng cho lịch Hằng ngày / Hằng tuần
  dayOfMonth?: number;           // Áp dụng cho lịch Hằng tháng (Ngày 1..31)
  month?: number;                // Tháng áp dụng (1..12) hoặc định kỳ mỗi tháng
  week?: number;                 // Tuần học áp dụng (1..35)
  timeSlot: string;              // Khung giờ / hạn chót (VD: "06:45 - 07:05", "Tiết 5 Thứ Bảy")
  session: 'morning' | 'afternoon' | 'all_day';
  assignedScope: 'all' | 'group' | 'officers' | 'individual';
  assignedGroup?: GroupNumber;
  assignedStudentIds?: string[];
  assignedStudentNames?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'normal' | 'high' | 'urgent';
  autoRemind: boolean;
  lastRemindedAt?: string;
  reminderCount: number;
  createdBy: string;
  createdAt: string;
}

export interface ClassOfficersAssignment {
  monitorName: string;       // Lớp trưởng
  viceAcademicName: string;  // Lớp phó học tập
  viceLaborName: string;     // Lớp phó lao động
  redFlagName: string;       // Cán sự cờ đỏ
  team1LeaderName: string;   // Tổ trưởng Tổ 1
  team2LeaderName: string;   // Tổ trưởng Tổ 2
  team3LeaderName: string;   // Tổ trưởng Tổ 3
  team4LeaderName: string;   // Tổ trưởng Tổ 4
}

export interface HomeroomClass {
  id: string;
  className: string;         // VD: "Lớp 10A3", "Lớp 10A1", "Lớp 11A2"
  grade: '10' | '11' | '12';
  academicYear: string;
  schoolName: string;
  homeroomTeacher: string;
  teacherEmail: string;
  teacherPhone: string;
  accessCodes: AccessCodesConfig;
  officers: ClassOfficersAssignment;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
}

