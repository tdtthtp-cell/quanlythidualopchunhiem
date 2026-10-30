import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Student,
  DailyLogEntry,
  ManualScoreAdjustment,
  CriteriaItem,
  CriteriaCategory,
  ClassConfig,
  AccessCodesConfig,
  NotificationRecord,
} from '../types';
import { DEFAULT_CRITERIA_CATEGORIES, DEFAULT_CRITERIA_ITEMS } from '../data/defaultCriteria';
import { DEFAULT_STUDENTS } from '../data/defaultStudents';
import {
  DEFAULT_CLASS_CONFIG,
  DEFAULT_DAILY_LOGS,
  DEFAULT_MANUAL_ADJUSTMENTS,
} from '../data/defaultLogs';
import { DEFAULT_ACCESS_CODES } from '../utils/storage';

// Collection and Document paths
const PATHS = {
  STUDENTS: 'students',
  DAILY_LOGS: 'daily_logs',
  MANUAL_ADJUSTMENTS: 'manual_adjustments',
  CRITERIA_ITEMS: 'criteria_items',
  CRITERIA_CATEGORIES: 'criteria_categories',
  SETTINGS: 'settings',
  CONFIG_DOC: 'class_config',
  ACCESS_CODES_DOC: 'access_codes',
  NOTIFICATIONS: 'notifications',
};

// Check and seed initial data if Firestore database is empty
export async function initializeCloudDatabaseIfNeeded() {
  try {
    const studentsSnap = await getDocs(collection(db, PATHS.STUDENTS));
    if (studentsSnap.empty) {
      console.log('Seeding initial class data to Cloud Firestore...');
      const batch = writeBatch(db);

      // Seed Class Config
      const configRef = doc(db, PATHS.SETTINGS, PATHS.CONFIG_DOC);
      batch.set(configRef, DEFAULT_CLASS_CONFIG);

      // Seed Access Codes
      const codesRef = doc(db, PATHS.SETTINGS, PATHS.ACCESS_CODES_DOC);
      batch.set(codesRef, DEFAULT_ACCESS_CODES);

      // Seed Categories
      for (const cat of DEFAULT_CRITERIA_CATEGORIES) {
        batch.set(doc(db, PATHS.CRITERIA_CATEGORIES, cat.id), cat);
      }

      // Seed Criteria Items
      for (const item of DEFAULT_CRITERIA_ITEMS) {
        batch.set(doc(db, PATHS.CRITERIA_ITEMS, item.id), item);
      }

      // Seed Students
      for (const st of DEFAULT_STUDENTS) {
        batch.set(doc(db, PATHS.STUDENTS, st.id), st);
      }

      // Seed Initial Logs
      for (const log of DEFAULT_DAILY_LOGS) {
        batch.set(doc(db, PATHS.DAILY_LOGS, log.id), log);
      }

      // Seed Adjustments
      for (const adj of DEFAULT_MANUAL_ADJUSTMENTS) {
        batch.set(doc(db, PATHS.MANUAL_ADJUSTMENTS, adj.id), adj);
      }

      await batch.commit();
      console.log('Initial class data successfully seeded to Cloud Firestore!');
    } else {
      // Check if access codes or class config need update to CN230876 and Bồ Công Lâm
      const codesDocRef = doc(db, PATHS.SETTINGS, PATHS.ACCESS_CODES_DOC);
      const configDocRef = doc(db, PATHS.SETTINGS, PATHS.CONFIG_DOC);
      // Asynchronously update if needed
      getDocs(collection(db, PATHS.SETTINGS)).then((settingsSnap) => {
        settingsSnap.forEach((d) => {
          if (d.id === PATHS.ACCESS_CODES_DOC) {
            const data = d.data() as AccessCodesConfig;
            if (data.teacher === 'GVCN2025') {
              setDoc(codesDocRef, { ...data, teacher: 'CN230876' }, { merge: true });
            }
          }
          if (d.id === PATHS.CONFIG_DOC) {
            const cfg = d.data() as ClassConfig;
            if (cfg.homeroomTeacher === 'Nguyễn Thị Bích Thủy') {
              setDoc(configDocRef, { ...cfg, homeroomTeacher: 'Bồ Công Lâm', className: 'Lớp 10A3', academicYear: '2026 - 2027', teacherEmail: 'boconglam@huynhtanphat.edu.vn', teacherPhone: '09845119015' }, { merge: true });
            }
          }
        });
      }).catch(console.error);
    }
  } catch (error) {
    console.error('Error initializing Firestore data:', error);
  }
}

// Subscribe to Realtime Students
export function subscribeToStudents(callback: (students: Student[]) => void) {
  return onSnapshot(
    collection(db, PATHS.STUDENTS),
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });
      // Sort by code or ID
      list.sort((a, b) => a.code.localeCompare(b.code));
      callback(list);
    },
    (err) => console.error('Realtime students listener error:', err)
  );
}

// Subscribe to Realtime Daily Logs
export function subscribeToDailyLogs(callback: (logs: DailyLogEntry[]) => void) {
  return onSnapshot(
    collection(db, PATHS.DAILY_LOGS),
    (snapshot) => {
      const list: DailyLogEntry[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DailyLogEntry);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => console.error('Realtime logs listener error:', err)
  );
}

// Subscribe to Realtime Manual Adjustments
export function subscribeToAdjustments(callback: (adjs: ManualScoreAdjustment[]) => void) {
  return onSnapshot(
    collection(db, PATHS.MANUAL_ADJUSTMENTS),
    (snapshot) => {
      const list: ManualScoreAdjustment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ManualScoreAdjustment);
      });
      callback(list);
    },
    (err) => console.error('Realtime adjustments listener error:', err)
  );
}

// Subscribe to Realtime Criteria Items
export function subscribeToCriteriaItems(callback: (items: CriteriaItem[]) => void) {
  return onSnapshot(
    collection(db, PATHS.CRITERIA_ITEMS),
    (snapshot) => {
      const list: CriteriaItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as CriteriaItem);
      });
      callback(list);
    },
    (err) => console.error('Realtime criteria listener error:', err)
  );
}

// Subscribe to Realtime Criteria Categories
export function subscribeToCategories(callback: (cats: CriteriaCategory[]) => void) {
  return onSnapshot(
    collection(db, PATHS.CRITERIA_CATEGORIES),
    (snapshot) => {
      const list: CriteriaCategory[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as CriteriaCategory);
      });
      callback(list);
    },
    (err) => console.error('Realtime categories listener error:', err)
  );
}

// Subscribe to Realtime Class Config
export function subscribeToClassConfig(callback: (config: ClassConfig) => void) {
  return onSnapshot(
    doc(db, PATHS.SETTINGS, PATHS.CONFIG_DOC),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ClassConfig);
      }
    },
    (err) => console.error('Realtime config listener error:', err)
  );
}

// Subscribe to Realtime Access Codes
export function subscribeToAccessCodes(callback: (codes: AccessCodesConfig) => void) {
  return onSnapshot(
    doc(db, PATHS.SETTINGS, PATHS.ACCESS_CODES_DOC),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as AccessCodesConfig);
      }
    },
    (err) => console.error('Realtime access codes listener error:', err)
  );
}

// Subscribe to Realtime Notifications
export function subscribeToNotifications(callback: (notifs: NotificationRecord[]) => void) {
  return onSnapshot(
    collection(db, PATHS.NOTIFICATIONS),
    (snapshot) => {
      const list: NotificationRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as NotificationRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => console.error('Realtime notifications listener error:', err)
  );
}

// --- WRITE MUTATION FUNCTIONS (Synced to Cloud) ---

export async function cloudSaveStudent(student: Student) {
  await setDoc(doc(db, PATHS.STUDENTS, student.id), student);
}

export async function cloudDeleteStudent(studentId: string) {
  await deleteDoc(doc(db, PATHS.STUDENTS, studentId));
}

export async function cloudBatchDeleteStudents(studentIds: string[]) {
  if (studentIds.length === 0) return;
  const batch = writeBatch(db);
  for (const id of studentIds) {
    batch.delete(doc(db, PATHS.STUDENTS, id));
  }
  await batch.commit();
}

export async function cloudBatchSaveStudents(students: Student[]) {
  if (students.length === 0) return;
  // Firestore batches allow up to 500 writes
  const chunks: Student[][] = [];
  for (let i = 0; i < students.length; i += 400) {
    chunks.push(students.slice(i, i + 400));
  }
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const st of chunk) {
      batch.set(doc(db, PATHS.STUDENTS, st.id), st);
    }
    await batch.commit();
  }
}

export async function cloudSaveDailyLog(log: DailyLogEntry) {
  await setDoc(doc(db, PATHS.DAILY_LOGS, log.id), log);
}

export async function cloudDeleteDailyLog(logId: string) {
  await deleteDoc(doc(db, PATHS.DAILY_LOGS, logId));
}

export async function cloudSaveManualAdjustment(adj: ManualScoreAdjustment) {
  await setDoc(doc(db, PATHS.MANUAL_ADJUSTMENTS, adj.id), adj);
}

export async function cloudDeleteManualAdjustment(adjId: string) {
  await deleteDoc(doc(db, PATHS.MANUAL_ADJUSTMENTS, adjId));
}

export async function cloudSaveClassConfig(config: ClassConfig) {
  await setDoc(doc(db, PATHS.SETTINGS, PATHS.CONFIG_DOC), config);
}

export async function cloudSaveAccessCodes(codes: AccessCodesConfig) {
  await setDoc(doc(db, PATHS.SETTINGS, PATHS.ACCESS_CODES_DOC), codes);
}

export async function cloudSaveCriteriaItems(items: CriteriaItem[]) {
  const batch = writeBatch(db);
  for (const it of items) {
    batch.set(doc(db, PATHS.CRITERIA_ITEMS, it.id), it);
  }
  await batch.commit();
}

export async function cloudSaveCategories(cats: CriteriaCategory[]) {
  const batch = writeBatch(db);
  for (const c of cats) {
    batch.set(doc(db, PATHS.CRITERIA_CATEGORIES, c.id), c);
  }
  await batch.commit();
}

export async function cloudSaveNotification(notif: NotificationRecord) {
  await setDoc(doc(db, PATHS.NOTIFICATIONS, notif.id), notif);
}
