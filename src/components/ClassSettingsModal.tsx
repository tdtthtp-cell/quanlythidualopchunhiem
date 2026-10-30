import React, { useState } from 'react';
import { Settings, Save, School, User, Calendar, BookOpen } from 'lucide-react';
import { ClassConfig } from '../types';

interface ClassSettingsModalProps {
  config: ClassConfig;
  onUpdateConfig: (config: ClassConfig) => void;
  onClose: () => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [className, setClassName] = useState(config.className);
  const [academicYear, setAcademicYear] = useState(config.academicYear);
  const [teacher, setTeacher] = useState(config.homeroomTeacher);
  const [email, setEmail] = useState(config.teacherEmail);
  const [phone, setPhone] = useState(config.teacherPhone);
  const [currentWeek, setCurrentWeek] = useState(config.currentWeek);
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(config.currentSemester);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      schoolName: schoolName.trim(),
      className: className.trim(),
      academicYear: academicYear.trim(),
      homeroomTeacher: teacher.trim(),
      teacherEmail: email.trim(),
      teacherPhone: phone.trim(),
      currentWeek: Number(currentWeek),
      currentSemester,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Cài Đặt Thông Tin Lớp Chủ Nhiệm & Năm Học
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên Trường / Đơn Vị Quản Lý:
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Lớp Chủ Nhiệm:</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-indigo-700"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Năm Học:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tuần học hiện tại:</label>
              <select
                value={currentWeek}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setCurrentWeek(w);
                  setCurrentSemester(w <= 18 ? 1 : 2);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} ({w <= 18 ? 'Học kỳ I' : 'Học kỳ II'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Học Kỳ:</label>
              <select
                value={currentSemester}
                onChange={(e) => setCurrentSemester(Number(e.target.value) as 1 | 2)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
              >
                <option value={1}>Học kỳ I (18 tuần)</option>
                <option value={2}>Học kỳ II (17 tuần)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1">
              Họ và tên Giáo viên chủ nhiệm:
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SĐT Giáo viên chủ nhiệm:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email GVCN:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
            >
              Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
