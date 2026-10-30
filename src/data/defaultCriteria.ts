import { CriteriaCategory, CriteriaItem } from '../types';

export const DEFAULT_CRITERIA_CATEGORIES: CriteriaCategory[] = [
  { id: 'cat_hoctap', name: 'Học tập', maxPoints: 30, color: 'indigo' },
  { id: 'cat_chuyencan', name: 'Chuyên cần', maxPoints: 15, color: 'blue' },
  { id: 'cat_nennep', name: 'Nền nếp', maxPoints: 20, color: 'amber' },
  { id: 'cat_vesinh', name: 'Vệ sinh', maxPoints: 10, color: 'emerald' },
  { id: 'cat_tacphong', name: 'Tác phong', maxPoints: 10, color: 'purple' },
  { id: 'cat_hoatdong', name: 'Hoạt động', maxPoints: 10, color: 'rose' },
  { id: 'cat_tuquan', name: 'Tự quản', maxPoints: 5, color: 'teal' },
];

export const DEFAULT_CRITERIA_ITEMS: CriteriaItem[] = [
  // Chuyên cần
  { id: 'crit_1', codeName: 'Nghỉ có phép', category: 'Chuyên cần', delta: -1, type: 'deduction' },
  { id: 'crit_2', codeName: 'Đi muộn', category: 'Chuyên cần', delta: -1, type: 'deduction' },
  { id: 'crit_3', codeName: 'Nghỉ không phép', category: 'Chuyên cần', delta: -3, type: 'deduction', isSevere: true },

  // Học tập (Trừ)
  { id: 'crit_4', codeName: 'Không thuộc bài', category: 'Học tập', delta: -2, type: 'deduction' },
  { id: 'crit_5', codeName: 'Không soạn, làm BTVN', category: 'Học tập', delta: -2, type: 'deduction' },

  // Tác phong (Trừ)
  { id: 'crit_6', codeName: 'Vi phạm đồng phục', category: 'Tác phong', delta: -2, type: 'deduction' },

  // Nền nếp (Trừ)
  { id: 'crit_7', codeName: 'Mất trật tự', category: 'Nền nếp', delta: -1, type: 'deduction' },
  { id: 'crit_8', codeName: 'Sử dụng ĐT sai quy định', category: 'Nền nếp', delta: -3, type: 'deduction', isSevere: true },

  // Hoạt động / Phong trào (Cộng)
  { id: 'crit_9', codeName: 'Đạt giải cấp trường', category: 'Hoạt động', delta: 5, type: 'praise' },
  { id: 'crit_10', codeName: 'Các hoạt động ngoại khóa, tình nguyện', category: 'Hoạt động', delta: 3, type: 'praise' },
  { id: 'crit_11', codeName: 'Hỗ trợ chụp ảnh, quay video, truyền thông lớp', category: 'Hoạt động', delta: 3, type: 'praise' },

  // Tự quản / Việc tốt (Cộng)
  { id: 'crit_12', codeName: 'Việc tốt & Tinh thần tập thể', category: 'Tự quản', delta: 5, type: 'praise' },
  { id: 'crit_13', codeName: 'Ngăn chặn hành vi vi phạm trong lớp', category: 'Tự quản', delta: 3, type: 'praise' },

  // Phát biểu xây dựng bài (Cộng)
  { id: 'crit_14', codeName: 'Phát biểu / 1 lượt', category: 'Học tập', delta: 1, type: 'praise' },
  { id: 'crit_15', codeName: 'Phát biểu / 2 lượt', category: 'Học tập', delta: 2, type: 'praise' },
  { id: 'crit_16', codeName: 'Phát biểu / 3 lượt', category: 'Học tập', delta: 3, type: 'praise' },

  // Điểm tốt kiểm tra miệng / 15p (Cộng)
  { id: 'crit_17', codeName: 'Điểm tốt', category: 'Học tập', delta: 1, type: 'praise' },
  { id: 'crit_18', codeName: 'Điểm tốt / 2 lượt', category: 'Học tập', delta: 2, type: 'praise' },
  { id: 'crit_19', codeName: 'Điểm tốt / 3 lượt', category: 'Học tập', delta: 3, type: 'praise' },

  // Vệ sinh trực nhật (Trừ)
  { id: 'crit_20', codeName: 'Vệ sinh / 1 lượt', category: 'Vệ sinh', delta: -1, type: 'deduction' },
  { id: 'crit_21', codeName: 'Vệ sinh / 2 lượt', category: 'Vệ sinh', delta: -2, type: 'deduction' },
  { id: 'crit_22', codeName: 'Vệ sinh / 3 lượt', category: 'Vệ sinh', delta: -3, type: 'deduction' },
];
