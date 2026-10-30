import {
  Student,
  CriteriaCategory,
  CriteriaItem,
  DailyLogEntry,
  ManualScoreAdjustment,
  ClassConfig,
  NotificationRecord,
  AccessCodesConfig,
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

const STORAGE_KEYS = {
  STUDENTS: 'thidua_students_v1',
  CATEGORIES: 'thidua_categories_v1',
  CRITERIA: 'thidua_criteria_v1',
  LOGS: 'thidua_logs_v1',
  ADJUSTMENTS: 'thidua_adjustments_v1',
  CONFIG: 'thidua_config_v1',
  NOTIFICATIONS: 'thidua_notifications_v1',
  ACCESS_CODES: 'thidua_access_codes_v1',
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
  };
}
