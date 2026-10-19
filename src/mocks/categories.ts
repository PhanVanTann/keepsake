import type { Category } from '@/types';

export const categories: Category[] = [
  { id: 'cat_an_uong', name: 'Ăn uống', icon: 'utensils', isDefault: true, isActive: true },
  { id: 'cat_di_lai', name: 'Đi lại', icon: 'car', isDefault: true, isActive: true },
  { id: 'cat_mua_sam', name: 'Mua sắm', icon: 'shopping-bag', isDefault: true, isActive: true },
  { id: 'cat_hoa_don', name: 'Hoá đơn', icon: 'receipt', isDefault: true, isActive: true },
  { id: 'cat_giai_tri', name: 'Giải trí', icon: 'popcorn', isDefault: true, isActive: true },
  { id: 'cat_suc_khoe', name: 'Sức khoẻ', icon: 'heart-pulse', isDefault: true, isActive: true },
  { id: 'cat_giao_duc', name: 'Giáo dục', icon: 'graduation-cap', isDefault: true, isActive: true },
  { id: 'cat_khac', name: 'Khác', icon: 'ellipsis', isDefault: true, isActive: true },
];

export function findCategory(id: string): Category {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Không tìm thấy category: ${id}`);
  return found;
}
