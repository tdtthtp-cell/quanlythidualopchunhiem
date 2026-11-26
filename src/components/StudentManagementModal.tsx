import React, { useState, useRef, useMemo } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit,
  Edit3,
  Trash2,
  Search,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  Building2,
  Plus,
  Save,
  X,
  Shuffle,
  Layers,
  ClipboardPaste,
  Table,
  ArrowRightLeft,
  Lock,
} from 'lucide-react';
import {
  Student,
  GroupNumber,
  StudentRole,
  CurrentUser,
  HomeroomClass,
} from '../types';
import {
  exportStudentsToExcel,
  downloadSampleExcelTemplate,
  parseStudentsFromExcel,
} from '../utils/excel';

interface StudentManagementModalProps {
  students: Student[];
  allStudents?: Student[];
  className: string;
  homeroomClasses?: HomeroomClass[];
  currentUser: CurrentUser;
  onSwitchHomeroomClass?: (cls: HomeroomClass) => void;
  onOpenAddClassModal?: () => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onBatchAddStudents?: (
    students: Omit<Student, 'id'>[],
    targetClassName: string
  ) => void;
  onUpdateStudent: (student: Student) => void;
  onBatchUpdateStudents?: (students: Student[]) => void;
  onDeleteStudent: (id: string) => void;
  onBatchDeleteStudents: (studentIds: string[]) => void;
  onBatchImportStudents: (
    newStudents: Student[],
    mode?: 'append' | 'replace',
    targetClassName?: string
  ) => void;
}

interface BulkNewStudentRow {
  code: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  group: GroupNumber;
  role: StudentRole;
  parentName: string;
  parentPhone: string;
  address: string;
}

export const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  students,
  allStudents,
  className,
  homeroomClasses = [],
  currentUser,
  onSwitchHomeroomClass,
  onOpenAddClassModal,
  onAddStudent,
  onBatchAddStudents,
  onUpdateStudent,
  onBatchUpdateStudents,
  onDeleteStudent,
  onBatchDeleteStudents,
  onBatchImportStudents,
}) => {
  // Only Super Admin or Teacher has permission to add, edit, or delete students
  const isTeacher =
    currentUser.role === 'super_admin' || currentUser.role === 'teacher';

  const [selectedGroup, setSelectedGroup] = useState<GroupNumber | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteType, setBatchDeleteType] = useState<
    'selected' | 'group' | 'all'
  >('selected');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Inline Table Batch Edit Mode (Sửa nhanh hàng loạt trực tiếp trên bảng)
  const [isInlineBatchEditMode, setIsInlineBatchEditMode] = useState(false);
  const [inlineDraftMap, setInlineDraftMap] = useState<Record<string, Student>>(
    {}
  );

  // Modal: Batch Edit Selected Students (Sửa thuộc tính đồng loạt cho các HS đã chọn)
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [bulkEditGroupMode, setBulkEditGroupMode] = useState<
    'keep' | 'auto_even' | '1' | '2' | '3' | '4'
  >('keep');
  const [bulkEditTargetClass, setBulkEditTargetClass] = useState<string>('keep');
  const [bulkEditRole, setBulkEditRole] = useState<'keep' | StudentRole>('keep');
  const [bulkEditGender, setBulkEditGender] = useState<'keep' | 'Nam' | 'Nữ'>(
    'keep'
  );

  // Modal: Batch Add Students by Class (Thêm hàng loạt học sinh theo lớp)
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);
  const [batchAddTab, setBatchAddTab] = useState<'paste' | 'table'>('paste');
  const [batchAddTargetClass, setBatchAddTargetClass] =
    useState<string>(className);
  const [batchAddGroupRule, setBatchAddGroupRule] = useState<
    'auto_even' | '1' | '2' | '3' | '4'
  >('auto_even');
  const [batchPasteText, setBatchPasteText] = useState('');
  const [batchTableRows, setBatchTableRows] = useState<BulkNewStudentRow[]>([]);

  // Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelImportMode, setExcelImportMode] = useState<'append' | 'replace'>(
    'append'
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Single Student Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formClassName, setFormClassName] = useState(className);
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [formDob, setFormDob] = useState('2009-01-01');
  const [formGroup, setFormGroup] = useState<GroupNumber>(1);
  const [formRole, setFormRole] = useState<StudentRole>('Học sinh');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formParentEmail, setFormParentEmail] = useState('');
  const [formZaloPhone, setFormZaloPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Count students per class across all classes
  const studentCountByClass = useMemo(() => {
    const source = allStudents || students;
    const map: Record<string, number> = {};
    for (const s of source) {
      const cName = s.className || 'Lớp 10A3';
      map[cName] = (map[cName] || 0) + 1;
    }
    return map;
  }, [allStudents, students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGroup !== 'all' && s.group !== selectedGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          (s.parentPhone || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, selectedGroup, searchQuery]);

  // Checkbox selection helpers
  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));
  const isSomeFilteredSelected =
    filteredStudents.some((s) => selectedIds.includes(s.id)) &&
    !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedIds(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      const combined = new Set([
        ...selectedIds,
        ...filteredStudents.map((s) => s.id),
      ]);
      setSelectedIds(Array.from(combined));
    }
  };

  const handleToggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const showToast = (msg: string) => {
    setImportStatus(msg);
    setTimeout(() => setImportStatus(null), 4500);
  };

  // Generate clean class code prefix (e.g., "Lớp 10A3" -> "10A3")
  const getClassCodePrefix = (clsName: string) => {
    const clean = clsName
      .replace(/^Lớp\s*/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    return clean || 'HS';
  };

  // --- 1. BATCH ADD STUDENTS BY CLASS ---
  const createDefaultBulkRows = (
    targetCls: string,
    count: number,
    existingLen: number
  ): BulkNewStudentRow[] => {
    const prefix = getClassCodePrefix(targetCls);
    return Array.from({ length: count }, (_, idx) => {
      const seq = existingLen + idx + 1;
      const g = ((idx % 4) + 1) as GroupNumber;
      return {
        code: `${prefix}_${String(seq).padStart(2, '0')}`,
        fullName: '',
        gender: idx % 2 === 0 ? 'Nam' : 'Nữ',
        group: g,
        role: 'Học sinh',
        parentName: '',
        parentPhone: '',
        address: '',
      };
    });
  };

  const handleOpenBatchAddModal = () => {
    setBatchAddTargetClass(className);
    setBatchAddGroupRule('auto_even');
    setBatchPasteText('');
    const currentCnt = studentCountByClass[className] || students.length;
    setBatchTableRows(createDefaultBulkRows(className, 5, currentCnt));
    setBatchAddTab('paste');
    setIsBatchAddModalOpen(true);
  };

  // Parse pasted text into preview students
  const parsedPasteStudents = useMemo(() => {
    const lines = batchPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const prefix = getClassCodePrefix(batchAddTargetClass);
    const baseCount = studentCountByClass[batchAddTargetClass] || 0;

    return lines.map((line, idx) => {
      // Support delimiters: | or Tab or ; or ,
      const parts = line
        .split(/\||\t|;|,/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      let fullName = parts[0] || `Học sinh ${idx + 1}`;
      // Strip leading numbering like "1. Nguyễn Văn A"
      fullName = fullName.replace(/^\d+[\.\)\-\s]+/, '').trim();

      let gender: 'Nam' | 'Nữ' = 'Nam';
      const rawGender = (parts[1] || '').toLowerCase();
      if (
        rawGender === 'nữ' ||
        rawGender === 'nu' ||
        rawGender === 'f' ||
        fullName.toLowerCase().includes(' thị ') ||
        fullName.toLowerCase().includes(' ngọc ')
      ) {
        gender = 'Nữ';
      }

      let group: GroupNumber = ((idx % 4) + 1) as GroupNumber;
      if (batchAddGroupRule !== 'auto_even') {
        group = Number(batchAddGroupRule) as GroupNumber;
      } else if (parts[2]) {
        const gNum = Number(parts[2].replace(/\D/g, ''));
        if (gNum >= 1 && gNum <= 4) group = gNum as GroupNumber;
      }

      const parentName = parts[3] || `PH em ${fullName}`;
      const parentPhone =
        parts[4] || `0912${String(100000 + baseCount + idx + 1).slice(-6)}`;
      const address = parts[5] || '';
      const code = `${prefix}_${String(baseCount + idx + 1).padStart(2, '0')}`;

      return {
        code,
        fullName,
        className: batchAddTargetClass,
        gender,
        dob: '2009-05-15',
        group,
        role: 'Học sinh' as StudentRole,
        parentName,
        parentPhone,
        zaloPhone: parentPhone,
        address,
      };
    });
  }, [batchPasteText, batchAddTargetClass, batchAddGroupRule, studentCountByClass]);

  const handleConfirmBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    let listToSave: Omit<Student, 'id'>[] = [];

    if (batchAddTab === 'paste') {
      if (parsedPasteStudents.length === 0) return;
      listToSave = parsedPasteStudents;
    } else {
      const validRows = batchTableRows.filter((r) => r.fullName.trim().length > 0);
      if (validRows.length === 0) return;
      listToSave = validRows.map((r, idx) => ({
        code:
          r.code.trim() ||
          `${getClassCodePrefix(batchAddTargetClass)}_${String(idx + 1).padStart(2, '0')}`,
        fullName: r.fullName.trim(),
        className: batchAddTargetClass,
        gender: r.gender,
        dob: '2009-05-15',
        group:
          batchAddGroupRule === 'auto_even'
            ? r.group
            : (Number(batchAddGroupRule) as GroupNumber),
        role: r.role,
        parentName: r.parentName.trim() || `PH em ${r.fullName.trim()}`,
        parentPhone: r.parentPhone.trim() || '0912345678',
        zaloPhone: r.parentPhone.trim() || '0912345678',
        address: r.address.trim(),
      }));
    }

    if (onBatchAddStudents) {
      onBatchAddStudents(listToSave, batchAddTargetClass);
    } else {
      for (const st of listToSave) {
        onAddStudent(st);
      }
    }

    setIsBatchAddModalOpen(false);
    showToast(
      `Đã thêm hàng loạt ${listToSave.length} học sinh vào ${batchAddTargetClass} thành công!`
    );
  };

  // --- 2A. INLINE SPREADSHEET BATCH EDIT MODE ---
  const handleStartInlineBatchEdit = () => {
    const map: Record<string, Student> = {};
    for (const s of students) {
      map[s.id] = { ...s, className: s.className || className };
    }
    setInlineDraftMap(map);
    setIsInlineBatchEditMode(true);
  };

  const handleUpdateInlineDraft = <K extends keyof Student>(
    studentId: string,
    field: K,
    value: Student[K]
  ) => {
    setInlineDraftMap((prev) => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const modifiedInlineStudents = useMemo(() => {
    if (!isInlineBatchEditMode) return [];
    const changed: Student[] = [];
    for (const orig of students) {
      const draft = inlineDraftMap[orig.id];
      if (!draft) continue;
      if (
        draft.code !== orig.code ||
        draft.fullName !== orig.fullName ||
        draft.gender !== orig.gender ||
        draft.group !== orig.group ||
        draft.role !== orig.role ||
        draft.parentName !== orig.parentName ||
        draft.parentPhone !== orig.parentPhone ||
        (draft.zaloPhone || '') !== (orig.zaloPhone || '') ||
        (draft.address || '') !== (orig.address || '') ||
        (draft.className || className) !== (orig.className || className)
      ) {
        changed.push(draft);
      }
    }
    return changed;
  }, [isInlineBatchEditMode, students, inlineDraftMap, className]);

  const handleSaveInlineBatchEdit = () => {
    if (modifiedInlineStudents.length === 0) {
      setIsInlineBatchEditMode(false);
      return;
    }
    if (onBatchUpdateStudents) {
      onBatchUpdateStudents(modifiedInlineStudents);
    } else {
      for (const st of modifiedInlineStudents) {
        onUpdateStudent(st);
      }
    }
    setIsInlineBatchEditMode(false);
    showToast(
      `Đã lưu cập nhật hàng loạt cho ${modifiedInlineStudents.length} học sinh của ${className}!`
    );
  };

  // --- 2B. BATCH EDIT SELECTED STUDENTS MODAL ---
  const handleOpenBatchEditModal = () => {
    setBulkEditGroupMode('keep');
    setBulkEditTargetClass('keep');
    setBulkEditRole('keep');
    setBulkEditGender('keep');
    setIsBatchEditModalOpen(true);
  };

  const handleConfirmBatchEditSelected = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudents = students.filter((s) => selectedIds.includes(s.id));
    if (targetStudents.length === 0) return;

    const updatedList: Student[] = targetStudents.map((st, idx) => {
      let nextGroup = st.group;
      if (bulkEditGroupMode === 'auto_even') {
        nextGroup = ((idx % 4) + 1) as GroupNumber;
      } else if (bulkEditGroupMode !== 'keep') {
        nextGroup = Number(bulkEditGroupMode) as GroupNumber;
      }

      return {
        ...st,
        className:
          bulkEditTargetClass !== 'keep'
            ? bulkEditTargetClass
            : st.className || className,
        group: nextGroup,
        role: bulkEditRole !== 'keep' ? bulkEditRole : st.role,
        gender: bulkEditGender !== 'keep' ? bulkEditGender : st.gender,
      };
    });

    if (onBatchUpdateStudents) {
      onBatchUpdateStudents(updatedList);
    } else {
      for (const s of updatedList) {
        onUpdateStudent(s);
      }
    }

    setIsBatchEditModalOpen(false);
    setSelectedIds([]);
    showToast(
      `Đã cập nhật hàng loạt thông tin cho ${updatedList.length} học sinh thành công!`
    );
  };

  // Quick 1-click distribute selected students evenly across 4 groups
  const handleQuickDistributeFourGroups = () => {
    const targetList =
      selectedIds.length > 0
        ? students.filter((s) => selectedIds.includes(s.id))
        : students;
    if (targetList.length === 0) return;

    const updatedList: Student[] = targetList.map((st, idx) => ({
      ...st,
      className: st.className || className,
      group: ((idx % 4) + 1) as GroupNumber,
    }));

    if (onBatchUpdateStudents) {
      onBatchUpdateStudents(updatedList);
    } else {
      for (const s of updatedList) {
        onUpdateStudent(s);
      }
    }
    showToast(
      `Đã tự động chia đều ${updatedList.length} học sinh lớp ${className} vào 4 Tổ (Tổ 1 → Tổ 4)!`
    );
  };

  // --- 3. BATCH DELETE STUDENTS BY CLASS ---
  const handleOpenBatchDelete = (type: 'selected' | 'group' | 'all') => {
    setBatchDeleteType(type);
    setDeleteConfirmText('');
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = () => {
    if (batchDeleteType === 'selected') {
      const count = selectedIds.length;
      onBatchDeleteStudents(selectedIds);
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
      showToast(`Đã xoá hàng loạt ${count} học sinh đã chọn khỏi ${className}.`);
    } else if (batchDeleteType === 'group' && selectedGroup !== 'all') {
      const groupStudentIds = students
        .filter((s) => s.group === selectedGroup)
        .map((s) => s.id);
      onBatchDeleteStudents(groupStudentIds);
      setSelectedIds(selectedIds.filter((id) => !groupStudentIds.includes(id)));
      setIsBatchDeleteModalOpen(false);
      showToast(
        `Đã xoá toàn bộ ${groupStudentIds.length} học sinh Tổ ${selectedGroup} của ${className}.`
      );
    } else if (batchDeleteType === 'all') {
      if (deleteConfirmText.trim().toUpperCase() !== 'XOA TAT CA') {
        return;
      }
      const classStudentIds = students.map((s) => s.id);
      onBatchDeleteStudents(classStudentIds);
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
      showToast(
        `Đã xoá toàn bộ ${classStudentIds.length} học sinh của ${className} (các lớp khác được giữ nguyên).`
      );
    }
  };

  // Single Student Add / Edit
  const handleOpenAdd = () => {
    setEditingStudent(null);
    const prefix = getClassCodePrefix(className);
    setFormCode(`${prefix}_${String(students.length + 1).padStart(2, '0')}`);
    setFormName('');
    setFormClassName(className);
    setFormGender('Nam');
    setFormDob('2009-01-01');
    setFormGroup(selectedGroup !== 'all' ? selectedGroup : 1);
    setFormRole('Học sinh');
    setFormParentName('');
    setFormParentPhone('');
    setFormParentEmail('');
    setFormZaloPhone('');
    setFormAddress('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormCode(st.code);
    setFormName(st.fullName);
    setFormClassName(st.className || className);
    setFormGender(st.gender);
    setFormDob(st.dob || '2009-01-01');
    setFormGroup(st.group);
    setFormRole(st.role);
    setFormParentName(st.parentName);
    setFormParentPhone(st.parentPhone);
    setFormParentEmail(st.parentEmail || '');
    setFormZaloPhone(st.zaloPhone || st.parentPhone);
    setFormAddress(st.address || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        code: formCode,
        fullName: formName,
        className: formClassName,
        gender: formGender,
        dob: formDob,
        group: formGroup,
        role: formRole,
        parentName: formParentName,
        parentPhone: formParentPhone,
        parentEmail: formParentEmail,
        zaloPhone: formZaloPhone,
        address: formAddress,
      });
      showToast(`Đã cập nhật thông tin học sinh "${formName}" (${formClassName})!`);
    } else {
      onAddStudent({
        code: formCode,
        fullName: formName,
        className: formClassName,
        gender: formGender,
        dob: formDob,
        group: formGroup,
        role: formRole,
        parentName: formParentName,
        parentPhone: formParentPhone,
        parentEmail: formParentEmail,
        zaloPhone: formZaloPhone,
        address: formAddress,
      });
      showToast(`Đã thêm học sinh "${formName}" vào ${formClassName}!`);
    }
    setIsAddModalOpen(false);
  };

  // Excel import scoped to current className
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus(`Đang đọc file Excel cho ${className}...`);
      const parsed = await parseStudentsFromExcel(file);
      if (parsed.length === 0) {
        setImportStatus('File không có dữ liệu hợp lệ.');
        return;
      }
      // Stamp className and unique IDs for this class
      const stamped = parsed.map((st, idx) => ({
        ...st,
        id: `hs_${getClassCodePrefix(className).toLowerCase()}_${Date.now()}_${idx}`,
        className,
      }));
      onBatchImportStudents(stamped, excelImportMode, className);
      setSelectedIds([]);
      showToast(
        `Đã nhập thành công ${stamped.length} học sinh từ file Excel vào ${className} (${
          excelImportMode === 'append' ? 'Gộp thêm vào lớp' : 'Thay thế danh sách lớp'
        })!`
      );
    } catch (err) {
      console.error(err);
      setImportStatus('Lỗi khi đọc file Excel. Vui lòng sử dụng file mẫu chuẩn.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* MULTI-CLASS SELECTOR BAR (CHỌN LỚP CHỦ NHIỆM ĐỂ QUẢN LÝ HỌC SINH) */}
      {homeroomClasses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Chọn Lớp quản lý học sinh:
            </span>
            {homeroomClasses.map((cls) => {
              const isCurrent = cls.className === className;
              const count = studentCountByClass[cls.className] || 0;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    if (!isCurrent && onSwitchHomeroomClass) {
                      setSelectedIds([]);
                      setIsInlineBatchEditMode(false);
                      onSwitchHomeroomClass(cls);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{cls.className}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count} HS
                  </span>
                </button>
              );
            })}
          </div>

          {isTeacher && onOpenAddClassModal && (
            <button
              type="button"
              onClick={onOpenAddClassModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              + Thêm / Quản Lý Đa Lớp
            </button>
          )}
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Danh Sách Học Sinh {className} — Phân Chia 4 Tổ ({students.length}{' '}
                học sinh)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Đang chọn: {className}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thêm nhanh hàng loạt học sinh theo lớp, sửa hàng loạt trực tiếp trên bảng hoặc theo nhóm chọn, nhập/xuất Excel và xoá hàng loạt theo từng lớp.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isTeacher ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => downloadSampleExcelTemplate()}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  title="Tải file mẫu Excel chuẩn để điền dữ liệu"
                >
                  <Download className="w-3.5 h-3.5" />
                  Mẫu Excel
                </button>

                {/* Excel Import with Append/Replace selector for current class */}
                <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-0.5">
                  <select
                    aria-label="Chế độ nhập Excel"
                    value={excelImportMode}
                    onChange={(e) =>
                      setExcelImportMode(e.target.value as 'append' | 'replace')
                    }
                    className="bg-transparent text-[11px] font-bold text-emerald-800 px-2 py-1.5 focus:outline-none"
                  >
                    <option value="append">Gộp thêm vào {className}</option>
                    <option value="replace">Thay thế DS {className}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    title={`Tải file Excel lên để nhập hàng loạt vào ${className}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Nhập Excel
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => exportStudentsToExcel(students, className)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  title={`Xuất danh sách ${className} ra Excel`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Xuất Excel
                </button>

                {/* Toggle Inline Table Batch Edit */}
                {!isInlineBatchEditMode ? (
                  <button
                    type="button"
                    onClick={handleStartInlineBatchEdit}
                    disabled={students.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    title="Chỉnh sửa trực tiếp nhiều học sinh cùng lúc trên bảng"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa Hàng Loạt
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveInlineBatchEdit}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu Sửa ({modifiedInlineStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInlineBatchEditMode(false)}
                      className="flex items-center gap-1 px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      <X className="w-3.5 h-3.5" />
                      Thoát
                    </button>
                  </div>
                )}

                {/* Batch Add Students by Class */}
                <button
                  type="button"
                  onClick={handleOpenBatchAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  title="Dán danh sách hoặc nhập bảng nhiều học sinh cùng lúc theo lớp"
                >
                  <Layers className="w-3.5 h-3.5" />
                  + Thêm Hàng Loạt
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  + Thêm 1 HS
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => exportStudentsToExcel(students, className)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  title="Xuất toàn bộ danh sách ra Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Xuất Excel
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Chế độ xem danh sách (Chỉ GVCN & Super Admin có quyền thêm, sửa, xoá học sinh)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status notification */}
        {importStatus && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Inline Batch Edit Banner */}
        {isInlineBatchEditMode && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>
                ĐANG BẬT CHẾ ĐỘ SỬA HÀNG LOẠT TRÊN BẢNG ({className}) — Bạn có thể sửa trực tiếp Họ tên, Mã HS, Tổ, Chức vụ, SĐT, Lớp của nhiều học sinh cùng lúc ({modifiedInlineStudents.length} HS đã thay đổi).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickDistributeFourGroups}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Tự động chia đều 4 Tổ
              </button>
              <button
                type="button"
                onClick={handleSaveInlineBatchEdit}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu tất cả ({modifiedInlineStudents.length})
              </button>
            </div>
          </div>
        )}

        {/* Filters and Batch Actions Toolbar */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Tổ ({className}):
            </span>
            <button
              type="button"
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Cả lớp ({students.length})
            </button>
            {([1, 2, 3, 4] as GroupNumber[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedGroup === g
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                Tổ {g} ({students.filter((s) => s.group === g).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Tìm học sinh trong ${className}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Delete current filtered group button */}
            {isTeacher &&
              selectedGroup !== 'all' &&
              students.filter((s) => s.group === selectedGroup).length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenBatchDelete('group')}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg whitespace-nowrap transition-colors"
                >
                  Xoá Tổ {selectedGroup} ({className})
                </button>
              )}

            {/* Clear all current class button */}
            {isTeacher && students.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenBatchDelete('all')}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg whitespace-nowrap transition-colors"
                title={`Xoá toàn bộ học sinh của ${className} (không ảnh hưởng các lớp khác)`}
              >
                Xoá hết {className}
              </button>
            )}
          </div>
        </div>

        {/* BATCH ACTION BAR: Appears when 1 or more students are checked (Chỉ GVCN & Super Admin) */}
        {isTeacher && selectedIds.length > 0 && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>
                Đã chọn: <strong>{selectedIds.length}</strong> / {students.length}{' '}
                học sinh thuộc <strong>{className}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg font-medium"
              >
                Bỏ chọn
              </button>

              <button
                type="button"
                onClick={handleQuickDistributeFourGroups}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-bold rounded-lg transition-colors"
                title="Chia đều các học sinh đã chọn vào Tổ 1, 2, 3, 4"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Chia đều 4 Tổ
              </button>

              <button
                type="button"
                onClick={handleOpenBatchEditModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Sửa hàng loạt ({selectedIds.length} HS)
              </button>

              <button
                type="button"
                onClick={() => handleOpenBatchDelete('selected')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xoá hàng loạt ({selectedIds.length} HS)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                {isTeacher && (
                  <th className="py-3 px-3 text-center w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-indigo-600 flex items-center justify-center mx-auto"
                      title={
                        isAllFilteredSelected
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả học sinh hiển thị'
                      }
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : isSomeFilteredSelected ? (
                        <MinusSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-2 text-center w-10">STT</th>
                <th className="py-3 px-3">Mã HS</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-2 text-center">Lớp</th>
                <th className="py-3 px-3 text-center">Giới Tính</th>
                <th className="py-3 px-3 text-center">Tổ</th>
                <th className="py-3 px-4">Chức Vụ</th>
                <th className="py-3 px-4">Phụ Huynh</th>
                <th className="py-3 px-3">SĐT Zalo/Liên Lạc</th>
                <th className="py-3 px-4">Địa Chỉ</th>
                {isTeacher && !isInlineBatchEditMode && (
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={isTeacher ? 12 : 10}
                    className="py-12 text-center text-slate-400 space-y-2"
                  >
                    <div className="font-bold text-slate-600">
                      Chưa có học sinh nào trong danh sách {className}.
                    </div>
                    {isTeacher && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleOpenBatchAddModal}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                        >
                          + Thêm Hàng Loạt Học Sinh Vào {className}
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                        >
                          + Thêm 1 Học Sinh
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const isChecked = selectedIds.includes(st.id);
                  const draft = inlineDraftMap[st.id] || st;

                  if (isInlineBatchEditMode && isTeacher) {
                    return (
                      <tr
                        key={st.id}
                        className="bg-amber-50/20 hover:bg-amber-50/50 transition-colors"
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStudent(st.id)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.code}
                            onChange={(e) =>
                              handleUpdateInlineDraft(st.id, 'code', e.target.value)
                            }
                            className="w-20 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.fullName}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'fullName',
                                e.target.value
                              )
                            }
                            className="w-40 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={draft.className || className}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'className',
                                e.target.value
                              )
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-indigo-700 text-xs"
                          >
                            {homeroomClasses.length > 0 ? (
                              homeroomClasses.map((c) => (
                                <option key={c.id} value={c.className}>
                                  {c.className}
                                </option>
                              ))
                            ) : (
                              <option value={className}>{className}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={draft.gender}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'gender',
                                e.target.value as 'Nam' | 'Nữ'
                              )
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={draft.group}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'group',
                                Number(e.target.value) as GroupNumber
                              )
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-indigo-700 text-xs"
                          >
                            <option value={1}>Tổ 1</option>
                            <option value={2}>Tổ 2</option>
                            <option value={3}>Tổ 3</option>
                            <option value={4}>Tổ 4</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={draft.role}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'role',
                                e.target.value as StudentRole
                              )
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="Học sinh">Học sinh</option>
                            <option value="Tổ trưởng">Tổ trưởng</option>
                            <option value="Lớp trưởng">Lớp trưởng</option>
                            <option value="Lớp phó học tập">Lớp phó học tập</option>
                            <option value="Lớp phó lao động">Lớp phó lao động</option>
                            <option value="Cán sự cờ đỏ">Cán sự cờ đỏ</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.parentName}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'parentName',
                                e.target.value
                              )
                            }
                            className="w-36 bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.parentPhone}
                            onChange={(e) => {
                              handleUpdateInlineDraft(
                                st.id,
                                'parentPhone',
                                e.target.value
                              );
                              handleUpdateInlineDraft(
                                st.id,
                                'zaloPhone',
                                e.target.value
                              );
                            }}
                            className="w-28 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={draft.address || ''}
                            onChange={(e) =>
                              handleUpdateInlineDraft(
                                st.id,
                                'address',
                                e.target.value
                              )
                            }
                            className="w-40 bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {isTeacher && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStudent(st.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="py-3 px-2 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {st.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st.fullName}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {st.className || className}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {st.gender}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                          Tổ {st.group}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.role === 'Lớp trưởng' ||
                            st.role === 'Lớp phó học tập'
                              ? 'bg-purple-100 text-purple-800'
                              : st.role === 'Tổ trưởng'
                              ? 'bg-blue-100 text-blue-800'
                              : st.role === 'Cán sự cờ đỏ'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {st.parentName}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {st.zaloPhone || st.parentPhone}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {st.address || '—'}
                      </td>
                      {isTeacher && !isInlineBatchEditMode && (
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Bạn có chắc muốn xoá học sinh "${st.fullName}" khỏi danh sách ${className} không?`
                                )
                              ) {
                                onDeleteStudent(st.id);
                                setSelectedIds((prev) =>
                                  prev.filter((id) => id !== st.id)
                                );
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xoá học sinh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: THÊM HÀNG LOẠT HỌC SINH THEO LỚP (PASTE TEXT OR MULTI-ROW TABLE) */}
      {isBatchAddModalOpen && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Thêm Hàng Loạt Học Sinh Theo Lớp Chủ Nhiệm
                  </h3>
                  <p className="text-slate-500">
                    Dán nhanh danh sách từ Word/Excel/Zalo hoặc nhập bảng nhiều dòng và tự động chia đều vào 4 Tổ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleConfirmBatchAdd}
              className="overflow-y-auto py-4 space-y-4 flex-1"
            >
              {/* Target Class & Group Distribution Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Chọn Lớp Chủ Nhiệm cần thêm học sinh:
                  </label>
                  <select
                    value={batchAddTargetClass}
                    onChange={(e) => setBatchAddTargetClass(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-indigo-700"
                  >
                    {homeroomClasses.length > 0 ? (
                      homeroomClasses.map((cls) => (
                        <option key={cls.id} value={cls.className}>
                          {cls.className} — GVCN: {cls.homeroomTeacher} (Hiện có{' '}
                          {studentCountByClass[cls.className] || 0} HS)
                        </option>
                      ))
                    ) : (
                      <option value={className}>{className}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Quy tắc phân Tổ cho danh sách mới:
                  </label>
                  <select
                    value={batchAddGroupRule}
                    onChange={(e) =>
                      setBatchAddGroupRule(
                        e.target.value as 'auto_even' | '1' | '2' | '3' | '4'
                      )
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="auto_even">
                      🔀 Tự động chia đều vào 4 Tổ (Tổ 1 → Tổ 2 → Tổ 3 → Tổ 4)
                    </option>
                    <option value="1">Gán toàn bộ vào Tổ 1</option>
                    <option value="2">Gán toàn bộ vào Tổ 2</option>
                    <option value="3">Gán toàn bộ vào Tổ 3</option>
                    <option value="4">Gán toàn bộ vào Tổ 4</option>
                  </select>
                </div>
              </div>

              {/* Input Method Sub-tabs */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBatchAddTab('paste')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      batchAddTab === 'paste'
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Cách 1: Dán danh sách nhanh (Mỗi dòng 1 HS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchAddTab('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      batchAddTab === 'table'
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    Cách 2: Nhập bảng nhiều dòng trực tiếp
                  </button>
                </div>

                {batchAddTab === 'paste' && (
                  <button
                    type="button"
                    onClick={() =>
                      setBatchPasteText(
                        `Nguyễn Hoàng Khang | Nam | 1 | Nguyễn Văn Minh | 0918223311\nTrần Thị Ngọc Bích | Nữ | 2 | Trần Văn Hải | 0918223312\nLê Minh Tuấn | Nam | 3 | Lê Văn Long | 0918223313\nPhạm Phương Thảo | Nữ | 4 | Phạm Quốc Việt | 0918223314\nVõ Quốc Huy | Nam | 1 | Võ Văn Thành | 0918223315\nĐặng Ngọc Trâm | Nữ | 2 | Đặng Văn Sơn | 0918223316\nBùi Gia Hưng | Nam | 3 | Bùi Văn Đạt | 0918223317\nHoàng Bảo Ngọc | Nữ | 4 | Hoàng Văn Phúc | 0918223318`
                      )
                    }
                    className="text-purple-600 hover:text-purple-800 font-bold underline"
                  >
                    + Chèn danh sách mẫu 8 học sinh
                  </button>
                )}
              </div>

              {batchAddTab === 'paste' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nhập hoặc dán danh sách học sinh (Mỗi dòng 1 học sinh — Có thể chỉ gõ{' '}
                      <strong>Họ và tên</strong> hoặc theo mẫu:{' '}
                      <code>Họ tên | Giới tính | Tổ | Tên Phụ huynh | SĐT</code>):
                    </label>
                    <textarea
                      rows={6}
                      value={batchPasteText}
                      onChange={(e) => setBatchPasteText(e.target.value)}
                      placeholder={`Ví dụ:\nNguyễn Văn Nam\nTrần Thị Thu Hà\nLê Hoàng Khôi | Nam | 3 | Lê Văn Bình | 0912345678`}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Live Preview of Parsed Students */}
                  {parsedPasteStudents.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-700">
                        Xem trước danh sách sẽ thêm vào{' '}
                        <span className="text-indigo-700">
                          {batchAddTargetClass}
                        </span>{' '}
                        ({parsedPasteStudents.length} học sinh):
                      </div>
                      <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                            <tr>
                              <th className="py-1.5 px-2.5">Mã HS</th>
                              <th className="py-1.5 px-2.5">Họ và Tên</th>
                              <th className="py-1.5 px-2.5">Lớp</th>
                              <th className="py-1.5 px-2.5">Giới tính</th>
                              <th className="py-1.5 px-2.5">Tổ</th>
                              <th className="py-1.5 px-2.5">Phụ huynh</th>
                              <th className="py-1.5 px-2.5">SĐT Zalo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedPasteStudents.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-1 px-2.5 font-mono">
                                  {item.code}
                                </td>
                                <td className="py-1 px-2.5 font-bold text-slate-900">
                                  {item.fullName}
                                </td>
                                <td className="py-1 px-2.5 text-indigo-700 font-semibold">
                                  {item.className}
                                </td>
                                <td className="py-1 px-2.5">{item.gender}</td>
                                <td className="py-1 px-2.5 font-bold">
                                  Tổ {item.group}
                                </td>
                                <td className="py-1 px-2.5">{item.parentName}</td>
                                <td className="py-1 px-2.5 font-mono">
                                  {item.parentPhone}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <tr>
                          <th className="py-2 px-2 w-8">#</th>
                          <th className="py-2 px-2">Mã HS</th>
                          <th className="py-2 px-2">Họ và Tên *</th>
                          <th className="py-2 px-2">Giới tính</th>
                          <th className="py-2 px-2">Tổ</th>
                          <th className="py-2 px-2">Chức vụ</th>
                          <th className="py-2 px-2">Họ tên Phụ huynh</th>
                          <th className="py-2 px-2">SĐT Zalo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchTableRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.code}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = { ...row, code: e.target.value };
                                  setBatchTableRows(next);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.fullName}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = { ...row, fullName: e.target.value };
                                  setBatchTableRows(next);
                                }}
                                placeholder="Nhập họ và tên..."
                                className="w-40 bg-white border border-slate-300 rounded px-2 py-1 font-bold"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.gender}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = {
                                    ...row,
                                    gender: e.target.value as 'Nam' | 'Nữ',
                                  };
                                  setBatchTableRows(next);
                                }}
                                className="bg-white border border-slate-300 rounded px-2 py-1"
                              >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.group}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = {
                                    ...row,
                                    group: Number(e.target.value) as GroupNumber,
                                  };
                                  setBatchTableRows(next);
                                }}
                                className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-indigo-700"
                              >
                                <option value={1}>Tổ 1</option>
                                <option value={2}>Tổ 2</option>
                                <option value={3}>Tổ 3</option>
                                <option value={4}>Tổ 4</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.role}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = {
                                    ...row,
                                    role: e.target.value as StudentRole,
                                  };
                                  setBatchTableRows(next);
                                }}
                                className="bg-white border border-slate-300 rounded px-2 py-1"
                              >
                                <option value="Học sinh">Học sinh</option>
                                <option value="Tổ trưởng">Tổ trưởng</option>
                                <option value="Lớp trưởng">Lớp trưởng</option>
                                <option value="Lớp phó học tập">
                                  Lớp phó học tập
                                </option>
                                <option value="Lớp phó lao động">
                                  Lớp phó lao động
                                </option>
                                <option value="Cán sự cờ đỏ">Cán sự cờ đỏ</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.parentName}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = {
                                    ...row,
                                    parentName: e.target.value,
                                  };
                                  setBatchTableRows(next);
                                }}
                                placeholder="Tên PH..."
                                className="w-32 bg-white border border-slate-300 rounded px-2 py-1"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.parentPhone}
                                onChange={(e) => {
                                  const next = [...batchTableRows];
                                  next[idx] = {
                                    ...row,
                                    parentPhone: e.target.value,
                                  };
                                  setBatchTableRows(next);
                                }}
                                placeholder="0912..."
                                className="w-28 bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const base =
                        (studentCountByClass[batchAddTargetClass] || 0) +
                        batchTableRows.length;
                      setBatchTableRows((prev) => [
                        ...prev,
                        ...createDefaultBulkRows(batchAddTargetClass, 5, base),
                      ]);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                  >
                    + Thêm 5 dòng nhập tiếp
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Lưu Hàng Loạt Vào {batchAddTargetClass}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SỬA HÀNG LOẠT HỌC SINH ĐÃ CHỌN (BATCH EDIT SELECTED STUDENTS) */}
      {isBatchEditModalOpen && isTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Sửa Hàng Loạt Học Sinh Đã Chọn ({selectedIds.length} HS)
                  </h3>
                  <p className="text-slate-500">
                    Cập nhật đồng loạt Tổ, Lớp chủ nhiệm, Chức vụ hoặc Giới tính
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBatchEditSelected} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Đổi Tổ sinh hoạt hàng loạt ({selectedIds.length} học sinh):
                </label>
                <select
                  value={bulkEditGroupMode}
                  onChange={(e) =>
                    setBulkEditGroupMode(
                      e.target.value as
                        | 'keep'
                        | 'auto_even'
                        | '1'
                        | '2'
                        | '3'
                        | '4'
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-700"
                >
                  <option value="keep">— Giữ nguyên Tổ hiện tại —</option>
                  <option value="auto_even">
                    🔀 Tự động chia đều vào 4 Tổ (Tổ 1, 2, 3, 4)
                  </option>
                  <option value="1">Chuyển tất cả sang Tổ 1</option>
                  <option value="2">Chuyển tất cả sang Tổ 2</option>
                  <option value="3">Chuyển tất cả sang Tổ 3</option>
                  <option value="4">Chuyển tất cả sang Tổ 4</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Chuyển Lớp Chủ Nhiệm hàng loạt:
                </label>
                <select
                  value={bulkEditTargetClass}
                  onChange={(e) => setBulkEditTargetClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="keep">
                    — Giữ nguyên lớp hiện tại ({className}) —
                  </option>
                  {homeroomClasses.map((cls) => (
                    <option key={cls.id} value={cls.className}>
                      <ArrowRightLeft className="w-3 h-3 inline" /> Chuyển sang{' '}
                      {cls.className} (GVCN: {cls.homeroomTeacher})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Cập nhật Chức vụ:
                  </label>
                  <select
                    value={bulkEditRole}
                    onChange={(e) =>
                      setBulkEditRole(e.target.value as 'keep' | StudentRole)
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="keep">— Giữ nguyên —</option>
                    <option value="Học sinh">Học sinh</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó lao động">Lớp phó lao động</option>
                    <option value="Cán sự cờ đỏ">Cán sự cờ đỏ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Cập nhật Giới tính:
                  </label>
                  <select
                    value={bulkEditGender}
                    onChange={(e) =>
                      setBulkEditGender(e.target.value as 'keep' | 'Nam' | 'Nữ')
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="keep">— Giữ nguyên —</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-xs"
                >
                  Áp Dụng Sửa Hàng Loạt ({selectedIds.length} HS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: BATCH DELETE BY CLASS */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Xác Nhận Xoá Học Sinh Hàng Loạt ({className})
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Chỉ tác động lên học sinh thuộc {className}, các lớp khác được giữ nguyên
                </p>
              </div>
            </div>

            {batchDeleteType === 'selected' && (
              <div className="space-y-3 py-2">
                <p className="text-slate-700 leading-relaxed">
                  Bạn có chắc chắn muốn xoá{' '}
                  <strong className="text-rose-600 font-bold">
                    {selectedIds.length} học sinh
                  </strong>{' '}
                  đã được chọn khỏi danh sách <strong>{className}</strong> không?
                </p>
                <div className="max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {students
                    .filter((s) => selectedIds.includes(s.id))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="py-1 text-slate-600 flex justify-between"
                      >
                        <span>
                          {s.fullName} ({s.code})
                        </span>
                        <span className="text-slate-400">
                          {s.className || className} • Tổ {s.group}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {batchDeleteType === 'group' && selectedGroup !== 'all' && (
              <div className="space-y-3 py-2">
                <p className="text-slate-700 leading-relaxed">
                  Bạn có chắc chắn muốn xoá toàn bộ{' '}
                  <strong className="text-rose-600 font-bold">
                    {students.filter((s) => s.group === selectedGroup).length} học
                    sinh thuộc Tổ {selectedGroup}
                  </strong>{' '}
                  của lớp <strong>{className}</strong> không?
                </p>
              </div>
            )}

            {batchDeleteType === 'all' && (
              <div className="space-y-3 py-2">
                <p className="text-rose-700 font-medium leading-relaxed">
                  CẢNH BÁO: Thao tác này sẽ xoá toàn bộ{' '}
                  <strong>
                    {students.length} học sinh của {className}
                  </strong>
                  . Danh sách học sinh của các lớp chủ nhiệm khác không bị ảnh hưởng.
                </p>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhập chữ <strong className="text-rose-600">XOA TAT CA</strong>{' '}
                    để xác nhận xoá danh sách {className}:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="XOA TAT CA"
                    className="w-full bg-white border border-rose-300 rounded-lg p-2 font-mono font-bold text-rose-700 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Đồng ý xoá hàng loạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Single Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingStudent
                  ? 'Chỉnh Sửa Thông Tin Học Sinh'
                  : `Thêm Học Sinh Mới Vào ${formClassName}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lớp Chủ Nhiệm:
                  </label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-indigo-700"
                  >
                    {homeroomClasses.length > 0 ? (
                      homeroomClasses.map((cls) => (
                        <option key={cls.id} value={cls.className}>
                          {cls.className}
                        </option>
                      ))
                    ) : (
                      <option value={className}>{className}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã Học Sinh:
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và Tên:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giới tính:
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) =>
                      setFormGender(e.target.value as 'Nam' | 'Nữ')
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tổ (1 - 4):
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) =>
                      setFormGroup(Number(e.target.value) as GroupNumber)
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-indigo-700"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chức vụ cán bộ:
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as StudentRole)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Học sinh">Học sinh</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó lao động">Lớp phó lao động</option>
                    <option value="Cán sự cờ đỏ">Cán sự cờ đỏ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ tên Phụ huynh:
                  </label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Tên bố/mẹ"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SĐT Phụ huynh / Zalo:
                  </label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => {
                      setFormParentPhone(e.target.value);
                      if (!formZaloPhone) setFormZaloPhone(e.target.value);
                    }}
                    placeholder="0912345678"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Phụ huynh:
                  </label>
                  <input
                    type="email"
                    value={formParentEmail}
                    onChange={(e) => setFormParentEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa chỉ thường trú:
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Số nhà, phố, quận/huyện..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingStudent ? 'Cập nhật học sinh' : 'Lưu học sinh mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
