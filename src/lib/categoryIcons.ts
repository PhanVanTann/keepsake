import {
  Car,
  Coffee,
  Dumbbell,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  Popcorn,
  Receipt,
  ShoppingBag,
  Smartphone,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

/** Map `Category.icon` (kebab-case) sang component icon Lucide. */
export const categoryIcons: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  popcorn: Popcorn,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  ellipsis: Ellipsis,
  gift: Gift,
  home: Home,
  plane: Plane,
  smartphone: Smartphone,
  coffee: Coffee,
  dumbbell: Dumbbell,
};

/** Icon cho người dùng chọn khi tạo danh mục riêng — bỏ 'ellipsis' (đã là fallback mặc định). */
export const CUSTOM_CATEGORY_ICONS = [
  'gift',
  'home',
  'plane',
  'smartphone',
  'coffee',
  'dumbbell',
  'shopping-bag',
  'popcorn',
] as const;
