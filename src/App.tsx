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
  DelegatedUser,
  ScheduledActivity,
  HomeroomClass,
} from './types';
import {
  loadStoredData,
  saveToStorage,
  DEFAULT_ACCESS_CODES,
  DEFAULT_DELEGATED_USERS,
  DEFAULT_SCHEDULED_ACTIVITIES,
  DEFAULT_HOMEROOM_CLASSES,
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
  subscribeToDelegatedUsers,
  subscribeToScheduledActivities,
  subscribeToHomeroomClasses,
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
  cloudSaveDelegatedUser,
  cloudDeleteDelegatedUser,
  cloudSaveScheduledActivity,
  cloudDeleteScheduledActivity,
  cloudSaveHomeroomClass,
  cloudDeleteHomeroomClass,
} from './services/cloudSync';
import { auth, onAuthStateChanged, SUPER_ADMIN_EMAIL } from './firebase';
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
import { ActivityScheduleManager } from './components/ActivityScheduleManager';
import { SuperAdminMultiClassModal } from './components/SuperAdminMultiClassModal';

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
  const [delegatedUsers, setDelegatedUsers] = useState<DelegatedUser[]>(initial.delegatedUsers || DEFAULT_DELEGATED_USERS);
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivity[]>(
    initial.scheduledActivities || DEFAULT_SCHEDULED_ACTIVITIES
  );
  const [homeroomClasses, setHomeroomClasses] = useState<HomeroomClass[]>(
    initial.homeroomClasses || DEFAULT_HOMEROOM_CLASSES
  );

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
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);

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

    // Listen to Firebase Google Auth state for Super Admin
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (
        firebaseUser &&
        firebaseUser.email &&
        firebaseUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        setCurrentUser({
          role: 'super_admin',
          name: firebaseUser.displayName || 'Super Admin',
          groupAccess: 'all',
          title: 'Super Admin',
        });
      }
    });

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

    const unsubDelegated = subscribeToDelegatedUsers((cloudDelegated) => {
      if (cloudDelegated && cloudDelegated.length > 0) {
        setDelegatedUsers(cloudDelegated);
        saveToStorage('DELEGATED_USERS', cloudDelegated);
      }
    });

    const unsubScheduled = subscribeToScheduledActivities((cloudScheduled) => {
      if (cloudScheduled && cloudScheduled.length > 0) {
        setScheduledActivities(cloudScheduled);
        saveToStorage('SCHEDULED_ACTIVITIES', cloudScheduled);
      }
    });

    const unsubHomeroomClasses = subscribeToHomeroomClasses((cloudClasses) => {
      if (cloudClasses && cloudClasses.length > 0) {
        setHomeroomClasses(cloudClasses);
        saveToStorage('HOMEROOM_CLASSES', cloudClasses);
      }
    });

    return () => {
      unsubAuth();
      unsubStudents();
      unsubLogs();
      unsubAdjustments();
      unsubCriteria();
      unsubCategories();
      unsubConfig();
      unsubCodes();
      unsubNotifications();
      unsubDelegated();
      unsubScheduled();
      unsubHomeroomClasses();
    };
  }, []);

  // Students belonging to the currently active homeroom class (legacy records default to 'Lớp 10A3')
  const currentClassStudents = useMemo(() => {
    const activeClass = config.className || 'Lớp 10A3';
    return students.filter((s) => (s.className || 'Lớp 10A3') === activeClass);
  }, [students, config.className]);

  // Dynamic calculations for current week & semester (scoped to current active class)
  const weeklyScores = useMemo(() => {
    return calculateStudentWeeklyScores(
      currentClassStudents,
      logs,
      adjustments,
      config.currentWeek,
      config.currentSemester,
      config.baseScore
    );
  }, [currentClassStudents, logs, adjustments, config.currentWeek, config.currentSemester, config.baseScore]);

  const groupSummaries = useMemo(() => {
    return calculateGroupSummaries(weeklyScores);
  }, [weeklyScores]);

  // Severe infractions alert count (scoped to current active class)
  const severeAlertCount = useMemo(() => {
    const classStudentIds = new Set(currentClassStudents.map((s) => s.id));
    return logs.filter(
      (l) =>
        classStudentIds.has(l.studentId) &&
        l.week === config.currentWeek &&
        l.semester === config.currentSemester &&
        (l.criteriaName.includes('Sử dụng ĐT') ||
          l.criteriaName.includes('không phép') ||
          l.delta <= -3)
    ).length;
  }, [logs, currentClassStudents, config.currentWeek, config.currentSemester]);

  // Pending scheduled activities count
  const pendingScheduleCount = useMemo(() => {
    return scheduledActivities.filter((a) => a.status !== 'completed').length;
  }, [scheduledActivities]);

  // Role authentication request handler
  const handleRequestRoleChange = (roleValue: string) => {
    const shortCls = (config.className || '10A3').replace(/^Lớp\s*/i, '').trim();
    if (roleValue === 'super_admin') {
      setPendingAuth({
        role: 'super_admin',
        groupAccess: 'all',
        name: 'Quản trị hệ thống',
        title: 'Super Admin',
      });
    } else if (roleValue === 'teacher') {
      setPendingAuth({
        role: 'teacher',
        groupAccess: 'all',
        name: config.homeroomTeacher || `GVCN ${shortCls}`,
        title: `GVCN ${shortCls}`,
        assignedClassName: config.className,
        roleKey: 'teacher',
      });
    } else if (roleValue.startsWith('team_leader_')) {
      const g = Number(roleValue.replace('team_leader_', '')) as GroupNumber;
      const key = `team${g}` as keyof AccessCodesConfig;
      setPendingAuth({
        role: 'team_leader',
        groupAccess: g,
        name: `Tổ trưởng Tổ ${g}`,
        title: `Tổ ${g} • ${shortCls}`,
        assignedClassName: config.className,
        roleKey: key,
      });
    } else if (roleValue === 'class_monitor') {
      setPendingAuth({
        role: 'class_monitor',
        groupAccess: 'all',
        name: `Ban cán sự ${shortCls}`,
        title: `BCS ${shortCls}`,
        assignedClassName: config.className,
        roleKey: 'monitor',
      });
    } else if (roleValue === 'delegated_prompt') {
      setPendingAuth({
        role: 'delegated',
        groupAccess: 'all',
        name: 'Người được uỷ quyền',
        title: `Admin ${shortCls}`,
        assignedClassName: config.className,
      });
    } else if (roleValue.startsWith('delegated_')) {
      const delId = roleValue.replace('delegated_', '');
      const matched = delegatedUsers.find((u) => u.id === delId);
      if (matched) {
        setPendingAuth({
          role: 'delegated',
          groupAccess: matched.permissions.groupScope,
          name: matched.name,
          title: `Admin ${shortCls}`,
          assignedClassName: config.className,
          delegatedUserId: matched.id,
          delegatedPermissions: matched.permissions,
        });
      }
    }
  };

  const handleAuthSuccess = (roleAuth: PendingRoleAuth) => {
    // If the authenticated role belongs to a specific homeroom class, switch workspace to that class
    if (roleAuth.matchedClass && roleAuth.matchedClass.className !== config.className) {
      handleSwitchHomeroomClass(roleAuth.matchedClass);
    }

    setCurrentUser({
      role: roleAuth.role,
      name: roleAuth.name,
      email: roleAuth.email,
      assignedClassName:
        roleAuth.role === 'super_admin'
          ? undefined
          : roleAuth.assignedClassName || config.className,
      groupAccess: roleAuth.groupAccess,
      title: roleAuth.title,
      delegatedPermissions: roleAuth.delegatedPermissions,
      delegatedUserId: roleAuth.delegatedUserId,
    });
    setPendingAuth(null);
  };

  // Multi-Class Homeroom handlers
  const handleSaveHomeroomClass = (item: HomeroomClass) => {
    setHomeroomClasses((prev) => {
      const exists = prev.some((c) => c.id === item.id);
      const updated = exists
        ? prev.map((c) => (c.id === item.id ? item : c))
        : [item, ...prev];
      saveToStorage('HOMEROOM_CLASSES', updated);
      return updated;
    });
    cloudSaveHomeroomClass(item).catch(console.error);

    // If the modified class is currently active, sync its config & accessCodes too
    if (item.className === config.className) {
      const nextCodes: AccessCodesConfig = {
        ...item.accessCodes,
      };
      setAccessCodes(nextCodes);
      cloudSaveAccessCodes(nextCodes).catch(console.error);
    }
  };

  const handleDeleteHomeroomClass = (classId: string) => {
    setHomeroomClasses((prev) => {
      const updated = prev.filter((c) => c.id !== classId);
      saveToStorage('HOMEROOM_CLASSES', updated);
      return updated;
    });
    cloudDeleteHomeroomClass(classId).catch(console.error);
  };

  const handleSwitchHomeroomClass = (item: HomeroomClass) => {
    const updatedConfig: ClassConfig = {
      ...config,
      className: item.className,
      schoolName: item.schoolName,
      academicYear: item.academicYear,
      homeroomTeacher: item.homeroomTeacher,
      teacherEmail: item.teacherEmail,
      teacherPhone: item.teacherPhone,
    };
    setConfig(updatedConfig);
    saveToStorage('CONFIG', updatedConfig);
    cloudSaveClassConfig(updatedConfig).catch(console.error);

    const updatedCodes: AccessCodesConfig = {
      ...item.accessCodes,
    };
    setAccessCodes(updatedCodes);
    saveToStorage('ACCESS_CODES', updatedCodes);
    cloudSaveAccessCodes(updatedCodes).catch(console.error);
  };

  // Delegated Users handlers
  const handleSaveDelegatedUser = (user: DelegatedUser) => {
    setDelegatedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      const updated = exists ? prev.map((u) => (u.id === user.id ? user : u)) : [user, ...prev];
      saveToStorage('DELEGATED_USERS', updated);
      return updated;
    });
    cloudSaveDelegatedUser(user).catch(console.error);
  };

  const handleDeleteDelegatedUser = (userId: string) => {
    setDelegatedUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      saveToStorage('DELEGATED_USERS', updated);
      return updated;
    });
    cloudDeleteDelegatedUser(userId).catch(console.error);
  };

  // Scheduled Activities handlers
  const handleSaveScheduledActivity = (activity: ScheduledActivity) => {
    setScheduledActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id);
      const updated = exists
        ? prev.map((a) => (a.id === activity.id ? activity : a))
        : [activity, ...prev];
      saveToStorage('SCHEDULED_ACTIVITIES', updated);
      return updated;
    });
    cloudSaveScheduledActivity(activity).catch(console.error);
  };

  const handleDeleteScheduledActivity = (activityId: string) => {
    setScheduledActivities((prev) => {
      const updated = prev.filter((a) => a.id !== activityId);
      saveToStorage('SCHEDULED_ACTIVITIES', updated);
      return updated;
    });
    cloudDeleteScheduledActivity(activityId).catch(console.error);
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

  const handleUpdateLog = (updatedLog: DailyLogEntry) => {
    setLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    cloudSaveDailyLog(updatedLog);
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

  // Handlers for Students (Synced to Cloud & Scoped by Class)
  const handleAddStudent = (data: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...data,
      className: data.className || config.className,
      id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setStudents((prev) => {
      const updated = [...prev, newStudent];
      saveToStorage('STUDENTS', updated);
      return updated;
    });
    cloudSaveStudent(newStudent);
  };

  const handleBatchAddStudents = (
    newStudentsData: Omit<Student, 'id'>[],
    targetClassName: string
  ) => {
    if (newStudentsData.length === 0) return;
    const now = Date.now();
    const createdList: Student[] = newStudentsData.map((data, idx) => ({
      ...data,
      className: data.className || targetClassName || config.className,
      id: `hs_${now}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    }));

    setStudents((prev) => {
      const updated = [...prev, ...createdList];
      saveToStorage('STUDENTS', updated);
      return updated;
    });
    cloudBatchSaveStudents(createdList);
  };

  const handleUpdateStudent = (updated: Student) => {
    const normalized: Student = {
      ...updated,
      className: updated.className || config.className,
    };
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === normalized.id ? normalized : s));
      saveToStorage('STUDENTS', next);
      return next;
    });
    cloudSaveStudent(normalized);
  };

  const handleBatchUpdateStudents = (updatedList: Student[]) => {
    if (updatedList.length === 0) return;
    const updateMap = new Map(updatedList.map((s) => [s.id, s]));
    setStudents((prev) => {
      const next = prev.map((s) => updateMap.get(s.id) || s);
      saveToStorage('STUDENTS', next);
      return next;
    });
    cloudBatchSaveStudents(updatedList);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage('STUDENTS', next);
      return next;
    });
    cloudDeleteStudent(id);
  };

  // BATCH DELETE STUDENTS HANDLER (Synced to Cloud)
  const handleBatchDeleteStudents = (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    const idsSet = new Set(studentIds);

    // Remove from students
    setStudents((prev) => {
      const next = prev.filter((s) => !idsSet.has(s.id));
      saveToStorage('STUDENTS', next);
      return next;
    });

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

  const handleBatchImportStudents = (
    newStudents: Student[],
    mode: 'append' | 'replace' = 'append',
    targetClassName: string = config.className
  ) => {
    const stamped = newStudents.map((s) => ({
      ...s,
      className: s.className || targetClassName,
    }));

    if (mode === 'append') {
      setStudents((prev) => {
        const next = [...prev, ...stamped];
        saveToStorage('STUDENTS', next);
        return next;
      });
      cloudBatchSaveStudents(stamped);
    } else {
      // Replace only students belonging to targetClassName, preserving other classes
      const oldClassIds = students
        .filter((s) => (s.className || 'Lớp 10A3') === targetClassName)
        .map((s) => s.id);

      setStudents((prev) => {
        const otherClassesStudents = prev.filter(
          (s) => (s.className || 'Lớp 10A3') !== targetClassName
        );
        const next = [...otherClassesStudents, ...stamped];
        saveToStorage('STUDENTS', next);
        return next;
      });

      if (oldClassIds.length > 0) {
        cloudBatchDeleteStudents(oldClassIds);
      }
      cloudBatchSaveStudents(stamped);
    }
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
        onOpenSuperAdminModal={() => setIsSuperAdminModalOpen(true)}
        onSwitchHomeroomClass={handleSwitchHomeroomClass}
        homeroomClasses={homeroomClasses}
        studentCount={currentClassStudents.length}
        delegatedUsers={delegatedUsers}
        pendingScheduleCount={pendingScheduleCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            scores={weeklyScores}
            groupSummaries={groupSummaries}
            logs={logs}
            config={config}
            students={currentClassStudents}
            adjustments={adjustments}
            onNavigateToTab={setActiveTab}
            onOpenReportForStudent={handleOpenReportForStudent}
            onOpenNotificationForStudent={handleOpenNotificationForStudent}
          />
        )}

        {activeTab === 'daily_logs' && (
          <DailySessionSheet
            students={currentClassStudents}
            logs={logs}
            criteria={criteria}
            currentUser={currentUser}
            config={config}
            onAddLog={handleAddLog}
            onUpdateLog={handleUpdateLog}
            onDeleteLog={handleDeleteLog}
            onOpenNotificationModal={(stId) => handleOpenNotificationForStudent(stId)}
          />
        )}

        {activeTab === 'schedule' && (
          <ActivityScheduleManager
            activities={scheduledActivities}
            students={currentClassStudents}
            config={config}
            currentUser={currentUser}
            onSaveActivity={handleSaveScheduledActivity}
            onDeleteActivity={handleDeleteScheduledActivity}
            onRecordNotification={(rec) => {
              const fullRec: NotificationRecord = {
                ...rec,
                id: `notif_${Date.now()}`,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => {
                const updated = [fullRec, ...prev];
                saveToStorage('NOTIFICATIONS', updated);
                return updated;
              });
              cloudSaveNotification(fullRec).catch(console.error);
            }}
          />
        )}

        {activeTab === 'emulation_table' && (
          <EmulationRankingTable
            scores={weeklyScores}
            config={config}
            currentUser={currentUser}
            students={currentClassStudents}
            logs={logs}
            adjustments={adjustments}
            onOpenReportModal={handleOpenReportForStudent}
            onOpenNotificationModal={handleOpenNotificationForStudent}
            onSaveManualAdjustment={handleSaveManualAdjustment}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagementModal
            students={currentClassStudents}
            allStudents={students}
            className={config.className}
            homeroomClasses={homeroomClasses}
            currentUser={currentUser}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onUpdateStudent={handleUpdateStudent}
            onBatchUpdateStudents={handleBatchUpdateStudents}
            onDeleteStudent={handleDeleteStudent}
            onBatchDeleteStudents={handleBatchDeleteStudents}
            onBatchImportStudents={handleBatchImportStudents}
            onSwitchHomeroomClass={handleSwitchHomeroomClass}
            onOpenAddClassModal={() => setIsSuperAdminModalOpen(true)}
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
          currentClassName={config.className}
          homeroomClasses={homeroomClasses}
          delegatedUsers={delegatedUsers}
          onSuccess={handleAuthSuccess}
          onCancel={() => setPendingAuth(null)}
        />
      )}

      {/* Super Admin Multi-Class & Class Officers Center Modal */}
      <SuperAdminMultiClassModal
        isOpen={isSuperAdminModalOpen}
        onClose={() => setIsSuperAdminModalOpen(false)}
        homeroomClasses={homeroomClasses}
        currentConfig={config}
        currentAccessCodes={accessCodes}
        students={currentClassStudents}
        allStudents={students}
        currentUser={currentUser}
        onSaveHomeroomClass={handleSaveHomeroomClass}
        onDeleteHomeroomClass={handleDeleteHomeroomClass}
        onSwitchHomeroomClass={handleSwitchHomeroomClass}
        onManageClassStudents={(cls) => {
          handleSwitchHomeroomClass(cls);
          setIsSuperAdminModalOpen(false);
          setActiveTab('students');
        }}
        onUpdateStudentRole={(studentId, newRole) => {
          const st = students.find((s) => s.id === studentId);
          if (st) {
            handleUpdateStudent({
              ...st,
              role: newRole as Student['role'],
            });
          }
        }}
      />

      {/* Manage Access Codes & Delegation Modal (for GVCN & Super Admin) */}
      {isManageCodesOpen && (
        <ManageAccessCodesModal
          accessCodes={accessCodes}
          delegatedUsers={delegatedUsers}
          className={config.className}
          teacherName={config.homeroomTeacher}
          onUpdateAccessCodes={handleUpdateAccessCodes}
          onSaveDelegatedUser={handleSaveDelegatedUser}
          onDeleteDelegatedUser={handleDeleteDelegatedUser}
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
