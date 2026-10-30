import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Student,
  CriteriaCategory,
  CriteriaItem,
  DailyLogEntry,
  ManualScoreAdjustment,
  ClassConfig,
  NotificationRecord,
  CurrentUser,
  AccessCodesConfig,
  GroupNumber,
} from './types';
import {
  loadStoredData,
  saveToStorage,
  DEFAULT_ACCESS_CODES,
} from './utils/storage';
import {
  calculateStudentWeeklyScores,
  calculateGroupSummaries,
} from './utils/scoring';
import {
  initializeCloudDatabaseIfNeeded,
  subscribeToStudents,
  subscribeToDailyLogs,
  subscribeToAdjustments,
  subscribeToCriteriaItems,
  subscribeToCategories,
  subscribeToClassConfig,
  subscribeToAccessCodes,
  subscribeToNotifications,
  cloudSaveStudent,
  cloudDeleteStudent,
  cloudBatchDeleteStudents,
  cloudBatchSaveStudents,
  cloudSaveDailyLog,
  cloudDeleteDailyLog,
  cloudSaveManualAdjustment,
  cloudDeleteManualAdjustment,
  cloudSaveClassConfig,
  cloudSaveAccessCodes,
  cloudSaveCriteriaItems,
  cloudSaveCategories,
  cloudSaveNotification,
} from './services/cloudSync';
import { HeaderNav } from './components/HeaderNav';
import { DashboardOverview } from './components/DashboardOverview';
import { DailySessionSheet } from './components/DailySessionSheet';
import { EmulationRankingTable } from './components/EmulationRankingTable';
import { StudentManagementModal } from './components/StudentManagementModal';
import { CriteriaConfigModal } from './components/CriteriaConfigModal';
import { PrintWeeklyReport } from './components/PrintWeeklyReport';
import { ParentNotificationModal } from './components/ParentNotificationModal';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import { BackupSyncModal } from './components/BackupSyncModal';
import { AccessCodeAuthModal, PendingRoleAuth } from './components/AccessCodeAuthModal';
import { ManageAccessCodesModal } from './components/ManageAccessCodesModal';

export default function App() {
  // Load initial data from localStorage for instant boot
  const initial = useMemo(() => loadStoredData(), []);

  const [students, setStudents] = useState<Student[]>(initial.students);
  const [categories, setCategories] = useState<CriteriaCategory[]>(initial.categories);
  const [criteria, setCriteria] = useState<CriteriaItem[]>(initial.criteria);
  const [logs, setLogs] = useState<DailyLogEntry[]>(initial.logs);
  const [adjustments, setAdjustments] = useState<ManualScoreAdjustment[]>(initial.adjustments);
  const [config, setConfig] = useState<ClassConfig>(initial.config);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initial.notifications);
  const [accessCodes, setAccessCodes] = useState<AccessCodesConfig>(initial.accessCodes || DEFAULT_ACCESS_CODES);

  // App navigation and current role: Mặc định mở ứng dụng là khoá phân quyền
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    role: 'student',
    name: 'Học sinh / Phụ huynh',
    groupAccess: 'all',
    title: 'Chế độ xem tra cứu (Đã khoá quyền)',
  });

  // Role Authentication states
  const [pendingAuth, setPendingAuth] = useState<PendingRoleAuth | null>(null);
  const [isManageCodesOpen, setIsManageCodesOpen] = useState(false);

  // Other Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [reportTargetStudentId, setReportTargetStudentId] = useState<string | undefined>(undefined);
  const [notificationTargetStudentId, setNotificationTargetStudentId] = useState<string | undefined>(undefined);

  // 1. Initialize Cloud Firestore and subscribe to real-time sync across devices
  useEffect(() => {
    // Check and seed initial data if Firestore database is empty
    initializeCloudDatabaseIfNeeded();

    // Setup real-time listeners for all collections
    const unsubStudents = subscribeToStudents((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        setStudents(cloudStudents);
        saveToStorage('STUDENTS', cloudStudents);
      }
    });

    const unsubLogs = subscribeToDailyLogs((cloudLogs) => {
      setLogs(cloudLogs);
      saveToStorage('LOGS', cloudLogs);
    });

    const unsubAdjustments = subscribeToAdjustments((cloudAdjs) => {
      setAdjustments(cloudAdjs);
      saveToStorage('ADJUSTMENTS', cloudAdjs);
    });

    const unsubCriteria = subscribeToCriteriaItems((cloudCriteria) => {
      if (cloudCriteria && cloudCriteria.length > 0) {
        setCriteria(cloudCriteria);
        saveToStorage('CRITERIA', cloudCriteria);
      }
    });

    const unsubCategories = subscribeToCategories((cloudCats) => {
      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
        saveToStorage('CATEGORIES', cloudCats);
      }
    });

    const unsubConfig = subscribeToClassConfig((cloudConfig) => {
      if (cloudConfig) {
        setConfig(cloudConfig);
        saveToStorage('CONFIG', cloudConfig);
      }
    });

    const unsubCodes = subscribeToAccessCodes((cloudCodes) => {
      if (cloudCodes) {
        setAccessCodes(cloudCodes);
        saveToStorage('ACCESS_CODES', cloudCodes);
      }
    });

    const unsubNotifications = subscribeToNotifications((cloudNotifs) => {
      setNotifications(cloudNotifs);
      saveToStorage('NOTIFICATIONS', cloudNotifs);
    });

    return () => {
      unsubStudents();
      unsubLogs();
      unsubAdjustments();
      unsubCriteria();
      unsubCategories();
      unsubConfig();
      unsubCodes();
      unsubNotifications();
    };
  }, []);

  // Dynamic calculations for current week & semester
  const weeklyScores = useMemo(() => {
    return calculateStudentWeeklyScores(
      students,
      logs,
      adjustments,
      config.currentWeek,
      config.currentSemester,
      config.baseScore
    );
  }, [students, logs, adjustments, config.currentWeek, config.currentSemester, config.baseScore]);

  const groupSummaries = useMemo(() => {
    return calculateGroupSummaries(weeklyScores);
  }, [weeklyScores]);

  // Severe infractions alert count
  const severeAlertCount = useMemo(() => {
    return logs.filter(
      (l) =>
        l.week === config.currentWeek &&
        l.semester === config.currentSemester &&
        (l.criteriaName.includes('Sử dụng ĐT') ||
          l.criteriaName.includes('không phép') ||
          l.delta <= -3)
    ).length;
  }, [logs, config.currentWeek, config.currentSemester]);

  // Role authentication request handler
  const handleRequestRoleChange = (roleValue: string) => {
    if (roleValue === 'teacher') {
      setPendingAuth({
        role: 'teacher',
        groupAccess: 'all',
        name: config.homeroomTeacher || 'GVCN',
        title: 'Giáo viên chủ nhiệm (Toàn quyền)',
        roleKey: 'teacher',
      });
    } else if (roleValue.startsWith('team_leader_')) {
      const g = Number(roleValue.replace('team_leader_', '')) as GroupNumber;
      const key = `team${g}` as keyof AccessCodesConfig;
      setPendingAuth({
        role: 'team_leader',
        groupAccess: g,
        name: `Tổ trưởng Tổ ${g}`,
        title: `Cán bộ Tổ ${g} (Nhập vi phạm/khen)`,
        roleKey: key,
      });
    } else if (roleValue === 'class_monitor') {
      setPendingAuth({
        role: 'class_monitor',
        groupAccess: 'all',
        name: 'Lớp trưởng / Lớp phó / Cờ đỏ',
        title: 'Ban cán sự lớp (Theo dõi chung)',
        roleKey: 'monitor',
      });
    }
  };

  const handleAuthSuccess = (roleAuth: PendingRoleAuth) => {
    setCurrentUser({
      role: roleAuth.role,
      name: roleAuth.name,
      groupAccess: roleAuth.groupAccess,
      title: roleAuth.title,
    });
    setPendingAuth(null);
  };

  // Handlers for Logs (Synced to Cloud)
  const handleAddLog = (newLogData: Omit<DailyLogEntry, 'id' | 'createdAt'>) => {
    const newEntry: DailyLogEntry = {
      ...newLogData,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    // Optimistic local update
    setLogs((prev) => [newEntry, ...prev]);
    // Sync to Cloud Firestore
    cloudSaveDailyLog(newEntry);

    // Celebrate praise
    if (newEntry.delta >= 3) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    cloudDeleteDailyLog(id);
  };

  // Handlers for Manual Adjustments (Synced to Cloud)
  const handleSaveManualAdjustment = (studentId: string, delta: number, reason: string) => {
    const existingAdj = adjustments.find(
      (a) => a.studentId === studentId && a.week === config.currentWeek && a.semester === config.currentSemester
    );

    if (delta === 0) {
      if (existingAdj) {
        cloudDeleteManualAdjustment(existingAdj.id);
        setAdjustments((prev) => prev.filter((a) => a.id !== existingAdj.id));
      }
      return;
    }

    const newAdj: ManualScoreAdjustment = {
      id: existingAdj ? existingAdj.id : `adj_${Date.now()}`,
      studentId,
      week: config.currentWeek,
      semester: config.currentSemester,
      delta,
      reason,
      adjustedBy: `${currentUser.name} (${currentUser.title})`,
      updatedAt: new Date().toISOString(),
    };

    setAdjustments((prev) => {
      const filtered = prev.filter((a) => a.id !== newAdj.id);
      return [...filtered, newAdj];
    });

    cloudSaveManualAdjustment(newAdj);
  };

  // Handlers for Students (Synced to Cloud)
  const handleAddStudent = (data: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...data,
      id: `hs_${Date.now()}`,
    };
    setStudents((prev) => [...prev, newStudent]);
    cloudSaveStudent(newStudent);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    cloudSaveStudent(updated);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    cloudDeleteStudent(id);
  };

  // BATCH DELETE STUDENTS HANDLER (Synced to Cloud)
  const handleBatchDeleteStudents = (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    const idsSet = new Set(studentIds);

    // Remove from students
    setStudents((prev) => prev.filter((s) => !idsSet.has(s.id)));

    // Clean up related logs and adjustments
    const logsToDelete = logs.filter((l) => idsSet.has(l.studentId));
    setLogs((prev) => prev.filter((l) => !idsSet.has(l.studentId)));
    for (const l of logsToDelete) {
      cloudDeleteDailyLog(l.id);
    }

    const adjsToDelete = adjustments.filter((a) => idsSet.has(a.studentId));
    setAdjustments((prev) => prev.filter((a) => !idsSet.has(a.studentId)));
    for (const a of adjsToDelete) {
      cloudDeleteManualAdjustment(a.id);
    }

    // Batch delete students in Cloud Firestore
    cloudBatchDeleteStudents(studentIds);
  };

  const handleBatchImportStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    cloudBatchSaveStudents(newStudents);
  };

  // Handlers for Config and Access Codes (Synced to Cloud)
  const handleUpdateConfig = (newConfig: ClassConfig) => {
    setConfig(newConfig);
    cloudSaveClassConfig(newConfig);
  };

  const handleUpdateAccessCodes = (newCodes: AccessCodesConfig) => {
    setAccessCodes(newCodes);
    cloudSaveAccessCodes(newCodes);
  };

  const handleUpdateCriteria = (newCriteria: CriteriaItem[]) => {
    setCriteria(newCriteria);
    cloudSaveCriteriaItems(newCriteria);
  };

  const handleUpdateCategories = (newCategories: CriteriaCategory[]) => {
    setCategories(newCategories);
    cloudSaveCategories(newCategories);
  };

  // Refresh after data restore
  const handleDataRestored = () => {
    const refreshed = loadStoredData();
    setStudents(refreshed.students);
    setCategories(refreshed.categories);
    setCriteria(refreshed.criteria);
    setLogs(refreshed.logs);
    setAdjustments(refreshed.adjustments);
    setConfig(refreshed.config);
    setNotifications(refreshed.notifications);
    setAccessCodes(refreshed.accessCodes || DEFAULT_ACCESS_CODES);

    // Push restored data to cloud
    cloudBatchSaveStudents(refreshed.students);
    cloudSaveClassConfig(refreshed.config);
    cloudSaveAccessCodes(refreshed.accessCodes || DEFAULT_ACCESS_CODES);
    cloudSaveCriteriaItems(refreshed.criteria);
    cloudSaveCategories(refreshed.categories);
  };

  const handleOpenReportForStudent = (studentId: string) => {
    setReportTargetStudentId(studentId);
    setActiveTab('reports');
  };

  const handleOpenNotificationForStudent = (studentId: string) => {
    setNotificationTargetStudentId(studentId);
    setActiveTab('notifications');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <HeaderNav
        config={config}
        onUpdateConfig={handleUpdateConfig}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
        onRequestRoleChange={handleRequestRoleChange}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        severeAlertCount={severeAlertCount}
        onOpenAlerts={() => setActiveTab('notifications')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCriteriaConfig={() => setIsCriteriaOpen(true)}
        onOpenStudentMgmt={() => setActiveTab('students')}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenManageAccessCodes={() => setIsManageCodesOpen(true)}
        studentCount={students.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            scores={weeklyScores}
            groupSummaries={groupSummaries}
            logs={logs}
            config={config}
            students={students}
            adjustments={adjustments}
            onNavigateToTab={setActiveTab}
            onOpenReportForStudent={handleOpenReportForStudent}
            onOpenNotificationForStudent={handleOpenNotificationForStudent}
          />
        )}

        {activeTab === 'daily_logs' && (
          <DailySessionSheet
            students={students}
            logs={logs}
            criteria={criteria}
            currentUser={currentUser}
            config={config}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            onOpenNotificationModal={(stId) => handleOpenNotificationForStudent(stId)}
          />
        )}

        {activeTab === 'emulation_table' && (
          <EmulationRankingTable
            scores={weeklyScores}
            config={config}
            currentUser={currentUser}
            students={students}
            logs={logs}
            adjustments={adjustments}
            onOpenReportModal={handleOpenReportForStudent}
            onOpenNotificationModal={handleOpenNotificationForStudent}
            onSaveManualAdjustment={handleSaveManualAdjustment}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagementModal
            students={students}
            className={config.className}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onBatchDeleteStudents={handleBatchDeleteStudents}
            onBatchImportStudents={handleBatchImportStudents}
          />
        )}

        {activeTab === 'notifications' && (
          <ParentNotificationModal
            scores={weeklyScores}
            logs={logs}
            config={config}
            initialStudentId={notificationTargetStudentId}
            onRecordNotification={(rec) => {
              const fullRec: NotificationRecord = {
                ...rec,
                id: `notif_${Date.now()}`,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => [fullRec, ...prev]);
              cloudSaveNotification(fullRec);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <PrintWeeklyReport
            scores={weeklyScores}
            config={config}
            categories={categories}
            initialStudentId={reportTargetStudentId}
            onBack={() => setActiveTab('emulation_table')}
          />
        )}
      </main>

      {/* Authentication Modal */}
      {pendingAuth && (
        <AccessCodeAuthModal
          pendingRole={pendingAuth}
          accessCodes={accessCodes}
          onSuccess={handleAuthSuccess}
          onCancel={() => setPendingAuth(null)}
        />
      )}

      {/* Manage Access Codes Modal (for GVCN) */}
      {isManageCodesOpen && (
        <ManageAccessCodesModal
          accessCodes={accessCodes}
          className={config.className}
          onUpdateAccessCodes={handleUpdateAccessCodes}
          onClose={() => setIsManageCodesOpen(false)}
        />
      )}

      {/* Global Modals */}
      {isSettingsOpen && (
        <ClassSettingsModal
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isCriteriaOpen && (
        <CriteriaConfigModal
          categories={categories}
          criteria={criteria}
          onUpdateCategories={handleUpdateCategories}
          onUpdateCriteria={handleUpdateCriteria}
          onClose={() => setIsCriteriaOpen(false)}
        />
      )}

      {isBackupOpen && (
        <BackupSyncModal
          onClose={() => setIsBackupOpen(false)}
          onDataRestored={handleDataRestored}
        />
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {config.schoolName} — Phần mềm Quản lý Thi đua Lớp Chủ Nhiệm {config.className}
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Năm học {config.academicYear} (35 tuần)</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Đồng bộ dữ liệu thời gian thực (Cloud Firestore)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
