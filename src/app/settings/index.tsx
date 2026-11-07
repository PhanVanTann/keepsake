import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Switch } from '@/components/receipt';
import {
  useCategories,
  useCurrentCycle,
  useDelayedLoading,
  useIncomes,
  useKeyboardVisible,
  useProfile,
  useRecurringTransactions,
  useUpdateProfile,
} from '@/hooks';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { formatVnd, sumAmounts } from '@/lib/money';
import { PRIVACY_LABEL } from '@/lib/privacy';
import { colors } from '@/theme/tokens';
import type { MoneyMode, NotificationTone, PostPrivacy } from '@/types';

const MONEY_MODE_LABEL = { PAYDAY: '💼 Đều đặn', TOP_UP: '🎒 Lúc có lúc không' } as const;
const MONEY_MODE_EMOJI = { PAYDAY: '💼', TOP_UP: '🎒' } as const;
const MONEY_MODE_TITLE = { PAYDAY: 'Đều đặn', TOP_UP: 'Lúc có lúc không' } as const;
const MONEY_MODE_SUB = { PAYDAY: 'Có lương mỗi tháng', TOP_UP: 'Bố mẹ gửi, làm thêm…' } as const;
const NEXT_DEFAULT_PRIVACY: Record<PostPrivacy, PostPrivacy> = {
  FRIENDS: 'SELF',
  SELF: 'FRIENDS',
  SELECTED_FRIENDS: 'FRIENDS',
};

export default function SettingsScreen() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const cycle = useCurrentCycle();
  const incomes = useIncomes(cycle.data?.id);
  const recurring = useRecurringTransactions();
  const categories = useCategories();

  const [showLocationByDefault, setShowLocationByDefault] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [socialNotifications, setSocialNotifications] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayInput, setDayInput] = useState('');
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<MoneyMode>('PAYDAY');

  const totalIncome = sumAmounts((incomes.data ?? []).filter((i) => i.status === 'RECEIVED').map((i) => i.amount));
  const pendingMode = profile.data?.nextMoneyMode;
  const pendingDay = profile.data?.nextCycleStartDay;

  function openDayModal() {
    setDayInput(String(profile.data?.cycleStartDay ?? 25));
    setDayModalOpen(true);
  }

  function saveDay() {
    const day = Math.min(31, Math.max(1, parseInt(dayInput || '25', 10)));
    updateProfile.mutate({ nextCycleStartDay: day === profile.data?.cycleStartDay ? undefined : day });
    setDayModalOpen(false);
  }

  function openModeModal() {
    setSelectedMode(pendingMode ?? profile.data?.moneyMode ?? 'PAYDAY');
    setModeModalOpen(true);
  }

  function saveMode() {
    updateProfile.mutate({ nextMoneyMode: selectedMode === profile.data?.moneyMode ? undefined : selectedMode });
    setModeModalOpen(false);
  }

  const showLoading = useDelayedLoading(profile.isLoading);
  const keyboardVisible = useKeyboardVisible();

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[20px] text-ink">Cài đặt</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {showLoading && (
            <Text className="mt-10 text-center text-[13px] text-muted">Đang tải…</Text>
          )}
          {!profile.isLoading && (
          <>
          <SectionLabel>SỔ CHI</SectionLabel>
          <SectionCard>
            <Row label="Tiền vào" value={formatVnd(totalIncome)} onPress={() => router.push('/expenses/income')} />
            <Row
              label="Chi định kỳ"
              value={`${recurring.data?.length ?? 0} khoản`}
              last={false}
              onPress={() => router.push('/settings/recurring')}
            />
            <Row
              label="Danh mục"
              value={String(categories.data?.length ?? 0)}
              last={false}
              onPress={() => router.push('/settings/categories')}
            />
            <Row
              label="Kiểu tiền về"
              value={pendingMode ? `${MONEY_MODE_LABEL[profile.data!.moneyMode]} → ${MONEY_MODE_LABEL[pendingMode]} (kỳ sau)` : MONEY_MODE_LABEL[profile.data?.moneyMode ?? 'PAYDAY']}
              last={profile.data?.moneyMode !== 'PAYDAY'}
              onPress={openModeModal}
            />
            {profile.data?.moneyMode === 'PAYDAY' && (
              <Row
                label="Ngày nhận lương"
                value={
                  pendingDay
                    ? `Ngày ${profile.data.cycleStartDay} → ${pendingDay} (kỳ sau)`
                    : `Ngày ${profile.data?.cycleStartDay ?? 25}`
                }
                last
                onPress={openDayModal}
              />
            )}
          </SectionCard>

          <SectionLabel>QUYỀN RIÊNG TƯ</SectionLabel>
          <SectionCard>
            <Row
              label="Ai được xem (mặc định)"
              value={PRIVACY_LABEL[profile.data?.defaultPostPrivacy ?? 'FRIENDS']}
              onPress={() => {
                if (!profile.data) return;
                updateProfile.mutate({ defaultPostPrivacy: NEXT_DEFAULT_PRIVACY[profile.data.defaultPostPrivacy] });
              }}
            />
            <View className="h-[46px] flex-row items-center px-3.5">
              <Text className="flex-1 font-display-semibold text-[15px] text-ink">Hiện vị trí khi đăng</Text>
              <Switch value={showLocationByDefault} onValueChange={setShowLocationByDefault} tone="ink" />
            </View>
          </SectionCard>

          <SectionLabel>THÔNG BÁO</SectionLabel>
          <SectionCard>
            <View className="h-[46px] flex-row items-center border-b border-dashed border-line px-3.5">
              <Text className="flex-1 font-display-semibold text-[15px] text-ink">Cảnh báo ngân sách</Text>
              <Switch value={budgetAlerts} onValueChange={setBudgetAlerts} tone="ink" />
            </View>
            <View className="h-[52px] flex-row items-center border-b border-dashed border-line px-3.5">
              <Text className="flex-1 font-display-semibold text-[15px] text-ink">Giọng thông báo</Text>
              <View className="flex-row rounded-input bg-chip p-[3px]">
                {(['PLAYFUL', 'SERIOUS'] as NotificationTone[]).map((tone) => {
                  const active = profile.data?.notificationTone === tone;
                  return (
                    <Pressable
                      key={tone}
                      onPress={() => updateProfile.mutate({ notificationTone: tone })}
                      className={cn('h-[34px] items-center justify-center rounded-input px-2.5', active && 'bg-ink')}>
                      <Text className={cn('text-[13px]', active ? 'font-display-bold text-white' : 'font-display-semibold text-muted')}>
                        {tone === 'PLAYFUL' ? 'Chọc vui 😜' : 'Nghiêm túc'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View className="h-[46px] flex-row items-center px-3.5">
              <Text className="flex-1 font-display-semibold text-[15px] text-ink">Cảm xúc & tin nhắn</Text>
              <Switch value={socialNotifications} onValueChange={setSocialNotifications} tone="ink" />
            </View>
          </SectionCard>

          <SectionLabel>TÀI KHOẢN</SectionLabel>
          <SectionCard>
            {(profile.data?.email || profile.data?.phoneNumber) && (
              <View className="h-[46px] flex-row items-center border-b border-dashed border-line px-3.5">
                <Text className="flex-1 font-display-semibold text-[15px] text-ink">
                  {profile.data?.email ? 'Email' : 'Số điện thoại'}
                </Text>
                <Text className="font-mono text-[13px] text-muted">{profile.data?.email ?? profile.data?.phoneNumber}</Text>
              </View>
            )}
            <Pressable
              onPress={() =>
                Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để dùng app.', [
                  { text: 'Huỷ', style: 'cancel' },
                  { text: 'Đăng xuất', style: 'destructive', onPress: () => supabase.auth.signOut() },
                ])
              }
              className="h-[46px] flex-row items-center border-b border-dashed border-line px-3.5">
              <Text className="font-display-bold text-[15px] text-ink">Đăng xuất</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/settings/delete-account')} className="h-[46px] flex-row items-center px-3.5">
              <Text className="font-display-bold text-[15px] text-red-dark">Xoá tài khoản</Text>
            </Pressable>
          </SectionCard>
          </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={modeModalOpen} transparent animationType="slide" onRequestClose={() => setModeModalOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setModeModalOpen(false)} />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[46px] pt-2.5">
          <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Kiểu tiền về</Text>
          <Text className="mt-1 text-[13px] text-muted">Chu kỳ hiện tại giữ nguyên, áp dụng từ kỳ sau.</Text>

          <View className="mt-3.5 flex-row gap-2">
            {(['PAYDAY', 'TOP_UP'] as MoneyMode[]).map((m) => {
              const active = selectedMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setSelectedMode(m)}
                  className={cn(
                    'h-[104px] flex-1 justify-between rounded-card p-3',
                    active ? 'border-[2.5px] border-ink bg-paper' : 'border-[1.5px] border-line bg-chip'
                  )}>
                  <Text className="text-2xl" style={{ opacity: active ? 1 : 0.7 }}>
                    {MONEY_MODE_EMOJI[m]}
                  </Text>
                  <View>
                    <Text className={cn('text-[15px] text-ink', active ? 'font-display-extrabold' : 'font-display-bold')}>
                      {MONEY_MODE_TITLE[m]}
                    </Text>
                    <Text className="text-[12px] text-muted">{MONEY_MODE_SUB[m]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={saveMode} className="mt-4 h-[54px] items-center justify-center rounded-input bg-red">
            <Text className="font-display-extrabold text-[15px] text-white">
              {selectedMode === profile.data?.moneyMode ? 'Giữ nguyên' : 'Lưu, áp dụng từ kỳ sau'}
            </Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={dayModalOpen} transparent animationType="slide" onRequestClose={() => setDayModalOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setDayModalOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className={
            keyboardVisible
              ? 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[12px] pt-2.5'
              : 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[46px] pt-2.5'
          }>
          <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Ngày nhận lương</Text>
          <Text className="mt-1 text-[13px] text-muted">Chu kỳ hiện tại giữ nguyên, áp dụng từ kỳ sau.</Text>
          <TextInput
            value={dayInput}
            onChangeText={(t) => setDayInput(t.replace(/[^\d]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            placeholder="25"
            placeholderTextColor={colors.placeholder}
            className="mt-3 h-14 rounded-input bg-chip px-3.5 text-center font-mono-extrabold text-[22px] text-ink"
          />
          <Pressable onPress={saveDay} className="mt-4 h-[54px] items-center justify-center rounded-input bg-red">
            <Text className="font-display-extrabold text-[15px] text-white">Lưu</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mx-4 mb-1.5 mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">{children}</Text>;
}

function SectionCard({ children }: { children: ReactNode }) {
  return <View className="mx-4 bg-paper">{children}</View>;
}

function Row({
  label,
  value,
  last,
  onPress,
}: {
  label: string;
  value: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      className={cn('min-h-[46px] flex-row items-center gap-2 px-3.5 py-2.5', !last && 'border-b border-dashed border-line')}>
      <Text className="flex-1 font-display-semibold text-[15px] text-ink" numberOfLines={1}>
        {label}
      </Text>
      <Text className="shrink text-right font-mono text-[13px] text-muted">{value}</Text>
      {onPress && <ChevronRight size={16} color={colors.muted} />}
    </Wrapper>
  );
}
