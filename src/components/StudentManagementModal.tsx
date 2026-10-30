import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit,
  Trash2,
  Search,
  Filter,
  Check,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { Student, GroupNumber, StudentRole } from '../types';
import {
  exportStudentsToExcel,
  downloadSampleExcelTemplate,
  parseStudentsFromExcel,
} from '../utils/excel';

interface StudentManagementModalProps {
  students: Student[];
  className: string;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onBatchDeleteStudents: (studentIds: string[]) => void;
  onBatchImportStudents: (newStudents: Student[]) => void;
}

export const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  students,
  className,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBatchDeleteStudents,
  onBatchImportStudents,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupNumber | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteType, setBatchDeleteType] = useState<'selected' | 'group' | 'all'>('selected');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [formDob, setFormDob] = useState('2009-01-01');
  const [formGroup, setFormGroup] = useState<GroupNumber>(1);
  const [formRole, setFormRole] = useState<StudentRole>('Học sinh');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formParentEmail, setFormParentEmail] = useState('');
  const [formZaloPhone, setFormZaloPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const filteredStudents = students.filter((s) => {
    if (selectedGroup !== 'all' && s.group !== selectedGroup) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Checkbox selection helpers
  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));
  const isSomeFilteredSelected =
    filteredStudents.some((s) => selectedIds.includes(s.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Unselect all filtered students
      const filteredIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedIds(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all filtered students
      const combined = new Set([...selectedIds, ...filteredStudents.map((s) => s.id)]);
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

  // Batch delete trigger
  const handleOpenBatchDelete = (type: 'selected' | 'group' | 'all') => {
    setBatchDeleteType(type);
    setDeleteConfirmText('');
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = () => {
    if (batchDeleteType === 'selected') {
      onBatchDeleteStudents(selectedIds);
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
    } else if (batchDeleteType === 'group' && selectedGroup !== 'all') {
      const groupStudentIds = students.filter((s) => s.group === selectedGroup).map((s) => s.id);
      onBatchDeleteStudents(groupStudentIds);
      setSelectedIds(selectedIds.filter((id) => !groupStudentIds.includes(id)));
      setIsBatchDeleteModalOpen(false);
    } else if (batchDeleteType === 'all') {
      if (deleteConfirmText.trim().toUpperCase() !== 'XOA TAT CA') {
        alert('Vui lòng nhập chính xác "XOA TAT CA" để xác nhận xoá toàn bộ danh sách lớp.');
        return;
      }
      onBatchDeleteStudents(students.map((s) => s.id));
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormCode(`HS${1000 + students.length + 1}`);
    setFormName('');
    setFormGender('Nam');
    setFormDob('2009-01-01');
    setFormGroup(1);
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
    } else {
      onAddStudent({
        code: formCode,
        fullName: formName,
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
    }
    setIsAddModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Đang đọc file Excel...');
      const parsed = await parseStudentsFromExcel(file);
      if (parsed.length === 0) {
        setImportStatus('File không có dữ liệu hợp lệ.');
        return;
      }
      onBatchImportStudents(parsed);
      setSelectedIds([]);
      setImportStatus(`Đã nhập thành công ${parsed.length} học sinh từ file Excel!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setImportStatus('Lỗi khi đọc file Excel. Vui lòng sử dụng file mẫu chuẩn.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Danh Sách Học Sinh Lớp — Phân Chia 4 Tổ ({students.length} học sinh)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ nhập từ bàn phím, nhập hàng loạt từ Excel, xoá học sinh hàng loạt và kết xuất danh sách.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={() => downloadSampleExcelTemplate()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              title="Tải file mẫu Excel chuẩn để điền dữ liệu"
            >
              <Download className="w-3.5 h-3.5" />
              Tải Mẫu Excel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Tải file Excel lên để nhập hàng loạt"
            >
              <Upload className="w-3.5 h-3.5" />
              Nhập Hàng Loạt Excel
            </button>
            <button
              onClick={() => exportStudentsToExcel(students, className)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Xuất toàn bộ danh sách ra Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xuất Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              + Thêm Học Sinh
            </button>
          </div>
        </div>

        {/* Status notification if Excel import */}
        {importStatus && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Filters and Batch Actions Toolbar */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1">Tổ:</span>
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Tất cả ({students.length})
            </button>
            {([1, 2, 3, 4] as GroupNumber[]).map((g) => (
              <button
                key={g}
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

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã HS, phụ huynh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Clear all class button */}
            {students.length > 0 && (
              <button
                onClick={() => handleOpenBatchDelete('all')}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg whitespace-nowrap transition-colors"
                title="Xoá toàn bộ danh sách lớp"
              >
                Xoá hết lớp
              </button>
            )}
          </div>
        </div>

        {/* BATCH ACTION BAR: Appears when 1 or more students are checked */}
        {selectedIds.length > 0 && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Đã chọn: <strong>{selectedIds.length}</strong> / {students.length} học sinh</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg font-medium"
              >
                Bỏ chọn
              </button>
              <button
                onClick={() => handleOpenBatchDelete('selected')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xoá hàng loạt ({selectedIds.length} học sinh)
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
                {/* Select All Checkbox */}
                <th className="py-3 px-3 text-center w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-indigo-600 flex items-center justify-center mx-auto"
                    title={isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả học sinh hiển thị'}
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
                <th className="py-3 px-2 text-center w-10">STT</th>
                <th className="py-3 px-3">Mã HS</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-3 text-center">Giới Tính</th>
                <th className="py-3 px-3 text-center">Tổ</th>
                <th className="py-3 px-4">Chức Vụ</th>
                <th className="py-3 px-4">Phụ Huynh</th>
                <th className="py-3 px-3">SĐT Zalo/Liên Lạc</th>
                <th className="py-3 px-4">Địa Chỉ</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Không có học sinh nào trong danh sách.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const isChecked = selectedIds.includes(st.id);

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(st.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{st.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{st.gender}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                          Tổ {st.group}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.role === 'Lớp trưởng' || st.role === 'Lớp phó học tập'
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
                      <td className="py-3 px-4 text-slate-800 font-medium">{st.parentName}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {st.zaloPhone || st.parentPhone}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{st.address || '—'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xoá học sinh "${st.fullName}" khỏi danh sách lớp không?`)) {
                              onDeleteStudent(st.id);
                              setSelectedIds((prev) => prev.filter((id) => id !== st.id));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xoá học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL: BATCH DELETE */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Xác Nhận Xoá Học Sinh Hàng Loạt
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Hành động này sẽ xoá danh sách học sinh khỏi hệ thống
                </p>
              </div>
            </div>

            {batchDeleteType === 'selected' && (
              <div className="space-y-3 py-2">
                <p className="text-slate-700 leading-relaxed">
                  Bạn có chắc chắn muốn xoá{' '}
                  <strong className="text-rose-600 font-bold">{selectedIds.length} học sinh</strong>{' '}
                  đã được chọn khỏi danh sách lớp không?
                </p>
                <div className="max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {students
                    .filter((s) => selectedIds.includes(s.id))
                    .map((s) => (
                      <div key={s.id} className="py-1 text-slate-600 flex justify-between">
                        <span>{s.fullName} ({s.code})</span>
                        <span className="text-slate-400">Tổ {s.group}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {batchDeleteType === 'all' && (
              <div className="space-y-3 py-2">
                <p className="text-rose-700 font-medium leading-relaxed">
                  CẢNH BÁO: Thao tác này sẽ xoá toàn bộ <strong>{students.length} học sinh</strong> trong lớp.
                </p>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nhập chữ <strong className="text-rose-600">XOA TAT CA</strong> để xác nhận:
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

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingStudent ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Học Sinh:</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và Tên:</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính:</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổ (1 - 4):</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(Number(e.target.value) as GroupNumber)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-indigo-700"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức vụ cán bộ:</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên Phụ huynh:</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh / Zalo:</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Email Phụ huynh:</label>
                  <input
                    type="email"
                    value={formParentEmail}
                    onChange={(e) => setFormParentEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ thường trú:</label>
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
