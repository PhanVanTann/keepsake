/** `icon` là tên icon Lucide (kebab-case), map sang component ở tầng UI. */
export type Category = {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  isActive: boolean;
};
