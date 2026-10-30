import * as XLSX from 'xlsx';
import { Student, StudentWeeklyScore, GroupNumber, StudentRole } from '../types';

export function exportStudentsToExcel(students: Student[], className: string) {
  const data = students.map((s, idx) => ({
    STT: idx + 1,
    'Mã Học Sinh': s.code,
    'Họ và Tên': s.fullName,
    'Giới Tính': s.gender,
    'Ngày Sinh': s.dob || '',
    Tổ: `Tổ ${s.group}`,
    'Chức Vụ': s.role,
    'Phụ Huynh': s.parentName,
    'SĐT Phụ Huynh': s.parentPhone,
    'Email Phụ Huynh': s.parentEmail || '',
    'SĐT Zalo': s.zaloPhone || s.parentPhone,
    'Địa Chỉ': s.address || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Học Sinh');
  XLSX.writeFile(workbook, `Danh_Sach_${className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Mã Học Sinh': 'HS1001',
      'Họ và Tên': 'Nguyễn Văn An',
      'Giới Tính': 'Nam',
      'Ngày Sinh': '2009-03-15',
      Tổ: 1,
      'Chức Vụ': 'Tổ trưởng',
      'Phụ Huynh': 'Nguyễn Văn Hùng',
      'SĐT Phụ Huynh': '0912345601',
      'Email Phụ Huynh': 'hung.nguyen@gmail.com',
      'SĐT Zalo': '0912345601',
      'Địa Chỉ': 'Hà Nội',
    },
    {
      'Mã Học Sinh': 'HS1002',
      'Họ và Tên': 'Trần Thị Mai Anh',
      'Giới Tính': 'Nữ',
      'Ngày Sinh': '2009-08-22',
      Tổ: 1,
      'Chức Vụ': 'Lớp phó học tập',
      'Phụ Huynh': 'Trần Văn Bình',
      'SĐT Phụ Huynh': '0912345602',
      'Email Phụ Huynh': 'binh.tran@gmail.com',
      'SĐT Zalo': '0912345602',
      'Địa Chỉ': 'Hà Nội',
    },
    {
      'Mã Học Sinh': 'HS1010',
      'Họ và Tên': 'Đặng Tuấn Kiệt',
      'Giới Tính': 'Nam',
      'Ngày Sinh': '2009-02-17',
      Tổ: 2,
      'Chức Vụ': 'Tổ trưởng',
      'Phụ Huynh': 'Đặng Đình Khoa',
      'SĐT Phụ Huynh': '0912345610',
      'Email Phụ Huynh': 'khoa.dang@gmail.com',
      'SĐT Zalo': '0912345610',
      'Địa Chỉ': 'Hà Nội',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu Nhập Học Sinh');
  XLSX.writeFile(workbook, `Mau_Nhap_Hoc_Sinh_LopChuNhiem.xlsx`);
}

export function parseStudentsFromExcel(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsed: Student[] = rawJson.map((row, index) => {
          // Normalize fields
          const fullName = String(row['Họ và Tên'] || row['Ho va Ten'] || row['Họ tên'] || row['fullName'] || `Học sinh ${index + 1}`).trim();
          const code = String(row['Mã Học Sinh'] || row['Ma HS'] || row['code'] || `HS${1000 + index + 1}`).trim();
          const genderRaw = String(row['Giới Tính'] || row['Gioi tinh'] || row['gender'] || 'Nam').toLowerCase();
          const gender: 'Nam' | 'Nữ' = genderRaw.includes('nữ') || genderRaw.includes('nu') || genderRaw === 'f' ? 'Nữ' : 'Nam';
          
          let groupNum: GroupNumber = 1;
          const groupRaw = String(row['Tổ'] || row['To'] || row['group'] || '1');
          if (groupRaw.includes('2')) groupNum = 2;
          else if (groupRaw.includes('3')) groupNum = 3;
          else if (groupRaw.includes('4')) groupNum = 4;

          const roleRaw = String(row['Chức Vụ'] || row['Chuc vu'] || row['role'] || 'Học sinh').trim();
          let role: StudentRole = 'Học sinh';
          if (roleRaw.toLowerCase().includes('tổ trưởng') || roleRaw.toLowerCase().includes('to truong')) role = 'Tổ trưởng';
          else if (roleRaw.toLowerCase().includes('lớp trưởng') || roleRaw.toLowerCase().includes('lop truong')) role = 'Lớp trưởng';
          else if (roleRaw.toLowerCase().includes('học tập')) role = 'Lớp phó học tập';
          else if (roleRaw.toLowerCase().includes('lao động')) role = 'Lớp phó lao động';
          else if (roleRaw.toLowerCase().includes('cờ đỏ')) role = 'Cán sự cờ đỏ';

          const parentName = String(row['Phụ Huynh'] || row['Phu huynh'] || row['parentName'] || `Phụ huynh ${fullName}`).trim();
          const parentPhone = String(row['SĐT Phụ Huynh'] || row['SDT'] || row['Phone'] || '0900000000').trim();
          const parentEmail = String(row['Email Phụ Huynh'] || row['Email'] || '').trim();
          const zaloPhone = String(row['SĐT Zalo'] || row['Zalo'] || parentPhone).trim();
          const address = String(row['Địa Chỉ'] || row['Dia chi'] || '').trim();
          const dob = String(row['Ngày Sinh'] || row['dob'] || '2009-01-01').trim();

          return {
            id: `hs_import_${Date.now()}_${index}`,
            code,
            fullName,
            gender,
            dob,
            group: groupNum,
            role,
            parentName,
            parentPhone,
            parentEmail,
            zaloPhone,
            address,
          };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportWeeklyRankingToExcel(
  scores: StudentWeeklyScore[],
  week: number,
  className: string
) {
  const data = scores.map((s) => ({
    'Hạng': s.rank,
    'Mã HS': s.student.code,
    'Họ và Tên': s.student.fullName,
    'Tổ': `Tổ ${s.student.group}`,
    'Chức Vụ': s.student.role,
    'Điểm Gốc': s.baseScore,
    'Điểm Khen (+)' : s.praisePoints,
    'Điểm Trừ (-)': s.deductionPoints,
    'Điều Chỉnh GVCN': s.manualAdjustment,
    'Tổng Điểm': s.totalScore,
    'Xếp Loại': s.conductRank,
    'Số Lượt Ghi Nhận': s.logCount,
    'Phụ Huynh': s.student.parentName,
    'SĐT Phụ Huynh': s.student.parentPhone,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Bảng Điểm Tuần ${week}`);
  XLSX.writeFile(workbook, `Bang_Thi_Dua_Tuan_${week}_${className}.xlsx`);
}

export function exportPeriodRankingToExcel(
  scores: StudentWeeklyScore[],
  periodLabel: string,
  className: string
) {
  const data = scores.map((s) => ({
    'Hạng': s.rank,
    'Mã HS': s.student.code,
    'Họ và Tên': s.student.fullName,
    'Tổ': `Tổ ${s.student.group}`,
    'Chức Vụ': s.student.role,
    'Điểm TB Tích Luỹ': s.totalScore,
    'Tổng Thưởng (+)' : s.praisePoints,
    'Tổng Phạt (-)': s.deductionPoints,
    'Tổng GVCN Chỉnh': s.manualAdjustment,
    'Xếp Loại Rèn Luyện': s.conductRank,
    'Tổng Lượt Nhật Ký': s.logCount,
    'Phụ Huynh': s.student.parentName,
    'SĐT Phụ Huynh': s.student.parentPhone,
  }));

  const safePeriod = periodLabel.replace(/\s+/g, '_');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Xếp Hạng ${periodLabel}`);
  XLSX.writeFile(workbook, `Bang_Xep_Hang_${safePeriod}_${className}.xlsx`);
}
