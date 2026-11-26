import {
  Student,
  CriteriaCategory,
  CriteriaItem,
  DailyLogEntry,
  ManualScoreAdjustment,
  ClassConfig,
  NotificationRecord,
  AccessCodesConfig,
  DelegatedUser,
  ScheduledActivity,
} from '../types';
import { DEFAULT_CRITERIA_CATEGORIES, DEFAULT_CRITERIA_ITEMS } from '../data/defaultCriteria';
import { DEFAULT_STUDENTS } from '../data/defaultStudents';
import {
  DEFAULT_CLASS_CONFIG,
  DEFAULT_DAILY_LOGS,
  DEFAULT_MANUAL_ADJUSTMENTS,
} from '../data/defaultLogs';

export const DEFAULT_ACCESS_CODES: AccessCodesConfig = {
  teacher: 'CN230876',
  team1: 'TO1_2025',
  team2: 'TO2_2025',
  team3: 'TO3_2025',
  team4: 'TO4_2025',
  monitor: 'BCS_2025',
};

export const DEFAULT_DELEGATED_USERS: DelegatedUser[] = [
  {
    id: 'del_math_01',
    name: 'Thầy Nguyễn Hữu Hoàng',
    title: 'Giáo viên bộ môn Toán',
    accessCode: 'UQ_TOAN10',
    isActive: true,
    notes: 'Phụ trách ghi nhận nề nếp, phát biểu và chấm điểm tốt tiết Toán',
    createdAt: '2026-09-05T08:00:00.000Z',
    delegatedBy: 'Bồ Công Lâm (GVCN)',
    permissions: {
      canLogDaily: true,
      canEditLogs: true,
      canDeleteLogs: false,
      canAdjustScores: false,
      canSendNotice: true,
      canManageSchedule: true,
      groupScope: 'all',
    },
  },
  {
    id: 'del_giamthi_02',
    name: 'Cô Phạm Thị Mai Nga',
    title: 'Cán bộ Giám thị Khối 10',
    accessCode: 'UQ_GTK10',
    isActive: true,
    notes: 'Kiểm tra trật tự, tác phong, đồng phục và chuyên cần',
    createdAt: '2026-09-05T08:00:00.000Z',
    delegatedBy: 'Bồ Công Lâm (GVCN)',
    permissions: {
      canLogDaily: true,
      canEditLogs: true,
      canDeleteLogs: true,
      canAdjustScores: true,
      canSendNotice: true,
      canManageSchedule: true,
      groupScope: 'all',
    },
  },
];

export const DEFAULT_SCHEDULED_ACTIVITIES: ScheduledActivity[] = [
  // LỊCH HẰNG NGÀY (DAILY)
  {
    id: 'sched_daily_01',
    title: 'Trực nhật vệ sinh lớp học & tưới bồn hoa hành lang',
    description: 'Quét lớp, lau bảng, đổ rác, sắp xếp bàn ghế ngay ngắn và tưới cây bồn hoa trước giờ truy bài sáng.',
    frequency: 'daily',
    category: 'cleaning',
    dayOfWeek: 'Monday',
    timeSlot: '06:35 - 06:50',
    session: 'morning',
    assignedScope: 'group',
    assignedGroup: 1,
    status: 'completed',
    priority: 'normal',
    autoRemind: true,
    reminderCount: 1,
    lastRemindedAt: '2026-10-26T06:15:00.000Z',
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-05T07:00:00.000Z',
  },
  {
    id: 'sched_daily_02',
    title: 'Kiểm tra sĩ số, đồng phục & phù hiệu đầu giờ',
    description: 'Tổ trưởng 4 tổ kiểm tra tác phong, khăn quàng/phù hiệu, giày dép và điểm danh sĩ số báo cáo Lớp trưởng.',
    frequency: 'daily',
    category: 'discipline',
    dayOfWeek: 'All',
    timeSlot: '06:50 - 07:00',
    session: 'morning',
    assignedScope: 'officers',
    status: 'in_progress',
    priority: 'high',
    autoRemind: true,
    reminderCount: 2,
    lastRemindedAt: '2026-10-27T06:30:00.000Z',
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-05T07:10:00.000Z',
  },
  {
    id: 'sched_daily_03',
    title: 'Truy bài đầu giờ & kiểm tra bài tập về nhà',
    description: 'Lớp phó học tập phối hợp các Tổ trưởng kiểm tra việc chuẩn bị bài cũ và hoàn thành BTVN của các thành viên.',
    frequency: 'daily',
    category: 'academic',
    dayOfWeek: 'Tuesday',
    timeSlot: '06:50 - 07:00',
    session: 'morning',
    assignedScope: 'group',
    assignedGroup: 2,
    status: 'pending',
    priority: 'high',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-05T07:15:00.000Z',
  },
  {
    id: 'sched_daily_04',
    title: 'Khóa cửa sổ, tắt quạt, điện & vệ sinh cuối buổi chiều',
    description: 'Kiểm tra ngăn bàn, tắt toàn bộ thiết bị điện, đóng cửa sổ phòng học sau tiết 5 buổi chiều.',
    frequency: 'daily',
    category: 'cleaning',
    dayOfWeek: 'Wednesday',
    timeSlot: '16:30 - 16:45',
    session: 'afternoon',
    assignedScope: 'group',
    assignedGroup: 3,
    status: 'pending',
    priority: 'normal',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-05T07:20:00.000Z',
  },

  // LỊCH HẰNG TUẦN (WEEKLY)
  {
    id: 'sched_weekly_01',
    title: 'Chào cờ đầu tuần & xếp hàng tập trung sân trường',
    description: 'Toàn lớp mặc đồng phục lễ phục đúng quy định, mang ghế chào cờ, tập trung đúng vị trí trước 06:45.',
    frequency: 'weekly',
    category: 'discipline',
    dayOfWeek: 'Monday',
    week: 8,
    timeSlot: '06:45 - 07:45 (Tiết 1)',
    session: 'morning',
    assignedScope: 'all',
    status: 'completed',
    priority: 'high',
    autoRemind: true,
    reminderCount: 1,
    lastRemindedAt: '2026-10-25T19:30:00.000Z',
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-06T08:00:00.000Z',
  },
  {
    id: 'sched_weekly_02',
    title: 'Chốt sổ nhật ký thi đua 4 Tổ & tổng hợp điểm tuần',
    description: 'Các Tổ trưởng hoàn tất nhập liệu vi phạm/tuyên dương trên hệ thống trước 17:00 Thứ Sáu để GVCN duyệt bảng điểm.',
    frequency: 'weekly',
    category: 'meeting',
    dayOfWeek: 'Friday',
    week: 8,
    timeSlot: '16:30 - 17:30',
    session: 'afternoon',
    assignedScope: 'officers',
    status: 'pending',
    priority: 'urgent',
    autoRemind: true,
    reminderCount: 1,
    lastRemindedAt: '2026-10-29T14:00:00.000Z',
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-06T08:30:00.000Z',
  },
  {
    id: 'sched_weekly_03',
    title: 'Tiết Sinh hoạt lớp cuối tuần & gửi phiếu báo cáo Phụ huynh',
    description: 'Tổng kết thi đua tuần, tuyên dương học sinh xuất sắc, nhắc nhở tồn tại và xuất phiếu PDF gửi Zalo cho phụ huynh.',
    frequency: 'weekly',
    category: 'meeting',
    dayOfWeek: 'Saturday',
    week: 8,
    timeSlot: '10:30 - 11:15 (Tiết 5)',
    session: 'morning',
    assignedScope: 'all',
    status: 'pending',
    priority: 'high',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-06T09:00:00.000Z',
  },
  {
    id: 'sched_weekly_04',
    title: 'Tổng vệ sinh khu vực tự quản & chăm sóc công trình thanh niên',
    description: 'Tổ trực tuần nhổ cỏ, quét dọn hành lang, lau cửa kính phòng học và khu vực cầu thang tầng 2.',
    frequency: 'weekly',
    category: 'cleaning',
    dayOfWeek: 'Saturday',
    week: 8,
    timeSlot: '11:15 - 11:35',
    session: 'morning',
    assignedScope: 'group',
    assignedGroup: 4,
    status: 'pending',
    priority: 'normal',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-06T09:15:00.000Z',
  },

  // LỊCH HẰNG THÁNG (MONTHLY)
  {
    id: 'sched_monthly_01',
    title: 'Sinh hoạt chủ điểm tháng & Diễn đàn Xây dựng tình bạn đẹp',
    description: 'Bí thư Chi đoàn và Ban cán sự chuẩn bị slide thuyết trình, câu hỏi đố vui và tiết mục văn nghệ sinh hoạt chuyên đề tháng.',
    frequency: 'monthly',
    category: 'movement',
    dayOfMonth: 15,
    month: 11,
    timeSlot: '07:30 - 09:00',
    session: 'morning',
    assignedScope: 'all',
    status: 'in_progress',
    priority: 'high',
    autoRemind: true,
    reminderCount: 1,
    lastRemindedAt: '2026-10-28T08:00:00.000Z',
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-10T08:00:00.000Z',
  },
  {
    id: 'sched_monthly_02',
    title: 'Đánh giá xếp loại hạnh kiểm tháng & Bình bầu Tổ Cờ Đỏ',
    description: 'Tổng hợp điểm tích lũy 4 tuần trong tháng, xét khen thưởng Tổ dẫn đầu và lập danh sách học sinh tiến bộ.',
    frequency: 'monthly',
    category: 'meeting',
    dayOfMonth: 28,
    month: 11,
    timeSlot: '10:30 - 11:30',
    session: 'morning',
    assignedScope: 'officers',
    status: 'pending',
    priority: 'urgent',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-10T08:30:00.000Z',
  },
  {
    id: 'sched_monthly_03',
    title: 'Phong trào Kế hoạch nhỏ & Thu gom giấy vụn gây quỹ Đoàn',
    description: 'Mỗi tổ thu gom sách báo cũ, vỏ lon phân loại tại góc lớp để nộp về Văn phòng Đoàn trường.',
    frequency: 'monthly',
    category: 'movement',
    dayOfMonth: 25,
    month: 11,
    timeSlot: '14:00 - 16:00',
    session: 'afternoon',
    assignedScope: 'all',
    status: 'pending',
    priority: 'normal',
    autoRemind: true,
    reminderCount: 0,
    createdBy: 'Bồ Công Lâm (GVCN)',
    createdAt: '2026-09-10T09:00:00.000Z',
  },
];

const STORAGE_KEYS = {
  STUDENTS: 'thidua_students_v1',
  CATEGORIES: 'thidua_categories_v1',
  CRITERIA: 'thidua_criteria_v1',
  LOGS: 'thidua_logs_v1',
  ADJUSTMENTS: 'thidua_adjustments_v1',
  CONFIG: 'thidua_config_v1',
  NOTIFICATIONS: 'thidua_notifications_v1',
  ACCESS_CODES: 'thidua_access_codes_v1',
  DELEGATED_USERS: 'thidua_delegated_users_v1',
  SCHEDULED_ACTIVITIES: 'thidua_scheduled_activities_v1',
};

export function loadStoredData() {
  try {
    const students = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const criteria = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    const logs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const adjustments = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    const config = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const accessCodes = localStorage.getItem(STORAGE_KEYS.ACCESS_CODES);
    const delegatedUsers = localStorage.getItem(STORAGE_KEYS.DELEGATED_USERS);
    const scheduledActivities = localStorage.getItem(STORAGE_KEYS.SCHEDULED_ACTIVITIES);

    let parsedAccessCodes = accessCodes
      ? (JSON.parse(accessCodes) as AccessCodesConfig)
      : DEFAULT_ACCESS_CODES;

    // Ensure teacher code defaults to CN230876 if it was GVCN2025
    if (!parsedAccessCodes || parsedAccessCodes.teacher === 'GVCN2025') {
      parsedAccessCodes = { ...DEFAULT_ACCESS_CODES, ...(parsedAccessCodes || {}), teacher: 'CN230876' };
    }

    return {
      students: students ? (JSON.parse(students) as Student[]) : DEFAULT_STUDENTS,
      categories: categories
        ? (JSON.parse(categories) as CriteriaCategory[])
        : DEFAULT_CRITERIA_CATEGORIES,
      criteria: criteria ? (JSON.parse(criteria) as CriteriaItem[]) : DEFAULT_CRITERIA_ITEMS,
      logs: logs ? (JSON.parse(logs) as DailyLogEntry[]) : DEFAULT_DAILY_LOGS,
      adjustments: adjustments
        ? (JSON.parse(adjustments) as ManualScoreAdjustment[])
        : DEFAULT_MANUAL_ADJUSTMENTS,
      config: config ? (JSON.parse(config) as ClassConfig) : DEFAULT_CLASS_CONFIG,
      notifications: notifications
        ? (JSON.parse(notifications) as NotificationRecord[])
        : [],
      accessCodes: parsedAccessCodes,
      delegatedUsers: delegatedUsers
        ? (JSON.parse(delegatedUsers) as DelegatedUser[])
        : DEFAULT_DELEGATED_USERS,
      scheduledActivities: scheduledActivities
        ? (JSON.parse(scheduledActivities) as ScheduledActivity[])
        : DEFAULT_SCHEDULED_ACTIVITIES,
    };
  } catch (err) {
    console.error('Error loading data from localStorage, fallback to defaults:', err);
    return {
      students: DEFAULT_STUDENTS,
      categories: DEFAULT_CRITERIA_CATEGORIES,
      criteria: DEFAULT_CRITERIA_ITEMS,
      logs: DEFAULT_DAILY_LOGS,
      adjustments: DEFAULT_MANUAL_ADJUSTMENTS,
      config: DEFAULT_CLASS_CONFIG,
      notifications: [],
      accessCodes: DEFAULT_ACCESS_CODES,
      delegatedUsers: DEFAULT_DELEGATED_USERS,
      scheduledActivities: DEFAULT_SCHEDULED_ACTIVITIES,
    };
  }
}

export function saveToStorage<T>(key: keyof typeof STORAGE_KEYS, data: T) {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
}

export function exportFullBackupJSON() {
  const data = loadStoredData();
  const backupObject = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    ...data,
  };
  const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_thidua_${data.config.className}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAllToDefaults() {
  localStorage.clear();
  return {
    students: DEFAULT_STUDENTS,
    categories: DEFAULT_CRITERIA_CATEGORIES,
    criteria: DEFAULT_CRITERIA_ITEMS,
    logs: DEFAULT_DAILY_LOGS,
    adjustments: DEFAULT_MANUAL_ADJUSTMENTS,
    config: DEFAULT_CLASS_CONFIG,
    notifications: [],
    accessCodes: DEFAULT_ACCESS_CODES,
    delegatedUsers: DEFAULT_DELEGATED_USERS,
    scheduledActivities: DEFAULT_SCHEDULED_ACTIVITIES,
  };
}
