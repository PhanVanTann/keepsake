import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategories, useCategoryUsageCounts, useCreateCategory, useDelayedLoading, useKeyboardVisible } from '@/hooks';
import { categoryIcons, CUSTOM_CATEGORY_ICONS } from '@/lib/categoryIcons';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

export default function CategoriesScreen() {
  const categories = useCategories();
  const usage = useCategoryUsageCounts();
  const createCategory = useCreateCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(CUSTOM_CATEGORY_ICONS[0]);
  const customCategories = (categories.data ?? []).filter((c) => !c.isDefault);
  const defaultCategories = (categories.data ?? []).filter((c) => c.isDefault);
  const showLoading = useDelayedLoading(categories.isLoading);
  const keyboardVisible = useKeyboardVisible();

  function closeForm() {
    setFormOpen(false);
    setName('');
    setIcon(CUSTOM_CATEGORY_ICONS[0]);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createCategory.mutateAsync({ name: trimmed, icon });
      closeForm();
    } catch {
      Alert.alert('Không tạo được danh mục', 'Thử lại sau nhé.');
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[20px] text-ink">Danh mục</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {customCategories.length > 0 && (
            <>
              <Text className="mx-4 mb-1.5 mt-5 font-mono-bold text-[11px] tracking-[1px] text-muted">
                CỦA BẠN · {customCategories.length}
              </Text>
              <View className="mx-4 bg-paper">
                {customCategories.map((c, i) => {
                  const Icon = categoryIcons[c.icon] ?? categoryIcons.ellipsis;
                  return (
                    <View
                      key={c.id}
                      className={`flex-row items-center gap-3 p-3 ${i < customCategories.length - 1 ? 'border-b border-dashed border-line' : ''}`}>
                      <View className="h-10 w-10 items-center justify-center rounded-input bg-chip">
                        <Icon size={20} color={colors.ink} />
                      </View>
                      <Text className="flex-1 font-display-bold text-[15px] text-ink">{c.name}</Text>
                      <Text className="font-mono text-[12px] text-muted">{usage.data?.[c.id] ?? 0} lần</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <Text className="mx-4 mb-1.5 mt-5 font-mono-bold text-[11px] tracking-[1px] text-muted">MẶC ĐỊNH</Text>
          {showLoading && <Text className="mx-4 text-[13px] text-muted">Đang tải…</Text>}
          <View className="mx-4 flex-row flex-wrap gap-2">
            {!showLoading && defaultCategories.map((c) => {
              const Icon = categoryIcons[c.icon] ?? categoryIcons.ellipsis;
              return (
                <View key={c.id} style={{ width: '23%' }} className="h-[76px] items-center justify-center gap-1.5 rounded-input bg-paper">
                  <Icon size={20} color={colors.ink} />
                  <Text className="text-[12px] font-display-semibold text-ink">{c.name}</Text>
                  <Text className="font-mono text-[10px] text-muted">{usage.data?.[c.id] ?? 0} lần</Text>
                </View>
              );
            })}
          </View>
          <Text className="mx-4 mt-2.5 text-[12px] leading-[18px] text-muted">
            Danh mục mặc định không xoá được. Xoá danh mục của bạn thì các khoản cũ chuyển sang "Khác".
          </Text>
        </ScrollView>

        <View className="px-4 pb-10">
          <Pressable onPress={() => setFormOpen(true)} className="h-[54px] items-center justify-center rounded-input bg-ink">
            <Text className="font-display-extrabold text-[15px] text-white">+ Tạo danh mục</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={closeForm}>
        <Pressable className="flex-1 bg-black/50" onPress={closeForm} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className={
            keyboardVisible
              ? 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[12px] pt-2.5'
              : 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[46px] pt-2.5'
          }>
          <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Danh mục mới</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên danh mục, vd: Thú cưng"
            placeholderTextColor={colors.placeholder}
            className="mt-3 h-12 rounded-input bg-chip px-3.5 font-display text-[15px] text-ink"
          />

          <View className="mt-3 flex-row flex-wrap gap-2">
            {CUSTOM_CATEGORY_ICONS.map((iconKey) => {
              const Icon = categoryIcons[iconKey];
              const active = icon === iconKey;
              return (
                <Pressable
                  key={iconKey}
                  onPress={() => setIcon(iconKey)}
                  className={cn('h-12 w-12 items-center justify-center rounded-card', active ? 'bg-ink' : 'bg-chip')}>
                  <Icon size={20} color={active ? colors.paper : colors.ink} />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!name.trim() || createCategory.isPending}
            className="mt-4 h-[54px] items-center justify-center rounded-input bg-red"
            style={{ opacity: !name.trim() || createCategory.isPending ? 0.5 : 1 }}>
            <Text className="font-display-extrabold text-[15px] text-white">
              {createCategory.isPending ? 'Đang tạo…' : 'Tạo danh mục'}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
