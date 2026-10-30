import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Check,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react';
import { CriteriaCategory, CriteriaItem } from '../types';
import { DEFAULT_CRITERIA_CATEGORIES, DEFAULT_CRITERIA_ITEMS } from '../data/defaultCriteria';

interface CriteriaConfigModalProps {
  categories: CriteriaCategory[];
  criteria: CriteriaItem[];
  onUpdateCategories: (categories: CriteriaCategory[]) => void;
  onUpdateCriteria: (criteria: CriteriaItem[]) => void;
  onClose: () => void;
}

export const CriteriaConfigModal: React.FC<CriteriaConfigModalProps> = ({
  categories,
  criteria,
  onUpdateCategories,
  onUpdateCriteria,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // New item modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemCodeName, setItemCodeName] = useState('');
  const [itemCategory, setItemCategory] = useState(categories[0]?.name || 'Học tập');
  const [itemDelta, setItemDelta] = useState<number>(-1);
  const [itemIsSevere, setItemIsSevere] = useState(false);

  // Edit inline
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDelta, setEditDelta] = useState<number>(0);

  const totalMaxPoints = categories.reduce((sum, c) => sum + c.maxPoints, 0);

  const filteredItems = criteria.filter((c) => {
    if (selectedFilterCategory !== 'all' && c.category !== selectedFilterCategory) return false;
    return true;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCodeName.trim()) return;

    const newItem: CriteriaItem = {
      id: `crit_${Date.now()}`,
      codeName: itemCodeName.trim(),
      category: itemCategory,
      delta: itemDelta,
      type: itemDelta > 0 ? 'praise' : 'deduction',
      isSevere: itemIsSevere,
    };

    onUpdateCriteria([...criteria, newItem]);
    setItemCodeName('');
    setIsAddOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá tiêu chí này không?')) {
      onUpdateCriteria(criteria.filter((c) => c.id !== id));
    }
  };

  const handleSaveInlineEdit = (id: string) => {
    onUpdateCriteria(
      criteria.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            delta: editDelta,
            type: editDelta > 0 ? 'praise' : 'deduction',
          };
        }
        return c;
      })
    );
    setEditingItemId(null);
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Bạn có chắc muốn khôi phục toàn bộ tiêu chí về bảng cấu hình gốc (theo file ảnh mẫu) không?'
      )
    ) {
      onUpdateCategories(DEFAULT_CRITERIA_CATEGORIES);
      onUpdateCriteria(DEFAULT_CRITERIA_ITEMS);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Cấu Hình Tiêu Chí Chấm Điểm Thi Đua Tự Động
              </h3>
              <p className="text-xs text-slate-500">
                Đồng bộ theo bảng cấu hình mẫu: 7 nhóm tiêu chí (100đ chuẩn) & danh mục điểm trừ/cộng chi tiết.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Khôi phục tiêu chí gốc theo ảnh mẫu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi Phục Gốc
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'items'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Danh Mục Tiêu Chí (+/- Điểm) ({criteria.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Nhóm Tiêu Chí Chuẩn ({totalMaxPoints}đ)
            </button>
          </div>

          {activeTab === 'items' && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm Tiêu Chí
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1">
          {activeTab === 'items' && (
            <>
              {/* Filter by Category */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-semibold mr-1">Nhóm:</span>
                <button
                  onClick={() => setSelectedFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    selectedFilterCategory === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilterCategory(cat.name)}
                    className={`px-2.5 py-1 rounded-md font-semibold ${
                      selectedFilterCategory === cat.name
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Table of items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3">Mã Nội Dung</th>
                      <th className="py-2.5 px-3">Tiêu Chí (Nhóm)</th>
                      <th className="py-2.5 px-3 text-center">Điểm Trừ / Cộng</th>
                      <th className="py-2.5 px-3 text-center">Phân Loại</th>
                      <th className="py-2.5 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isEditing = editingItemId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.codeName}
                            {item.isSevere && (
                              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                                Nghiêm trọng
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editDelta}
                                  onChange={(e) => setEditDelta(parseInt(e.target.value) || 0)}
                                  className="w-16 px-1 py-0.5 border border-indigo-400 rounded text-center text-xs font-bold"
                                />
                                <button
                                  onClick={() => handleSaveInlineEdit(item.id)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  item.delta > 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.delta > 0 ? `+${item.delta}` : item.delta}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                item.type === 'praise'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {item.type === 'praise' ? 'Tuyên dương' : 'Vi phạm'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditDelta(item.delta);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Sửa điểm số"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Xoá tiêu chí"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab Categories */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                Bảng 7 nhóm tiêu chí lớn theo cấu hình chuẩn. Tổng điểm tối đa là{' '}
                <strong>100 điểm</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">
                        Nhóm #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Điểm tối đa:</span>
                      <input
                        type="number"
                        value={cat.maxPoints}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          onUpdateCategories(
                            categories.map((c) => (c.id === cat.id ? { ...c, maxPoints: val } : c))
                          );
                        }}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 text-center text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Thêm Tiêu Chí Mới */}
        {isAddOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h4 className="font-bold text-base text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Thêm Tiêu Chí Chấm Điểm Mới
              </h4>
              <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã nội dung / Tên hành vi:</label>
                  <input
                    type="text"
                    value={itemCodeName}
                    onChange={(e) => setItemCodeName(e.target.value)}
                    placeholder="Ví dụ: Giúp đỡ bạn học tập..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm tiêu chí:</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Điểm trừ/cộng (+ hoặc -):
                  </label>
                  <input
                    type="number"
                    value={itemDelta}
                    onChange={(e) => setItemDelta(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Nhập số âm (ví dụ: -2) nếu là vi phạm; số dương (+3) nếu là tuyên dương.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="severeCheck"
                    checked={itemIsSevere}
                    onChange={(e) => setItemIsSevere(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="severeCheck" className="text-slate-700 font-medium">
                    Đánh dấu là vi phạm nghiêm trọng (Tự động kích hoạt cảnh báo tức thì cho GVCN)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                  >
                    Lưu Tiêu Chí
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
