import dayjs from 'dayjs';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { RefreshCw, Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, BottomNav, LeaderRow, type BottomNavKey } from '@/components/receipt';
import { ErrOffline } from '@/components/errors/ErrOffline';
import { Skeleton } from '@/components/loading';
import {
  useCurrentCycle,
  useDelayedLoading,
  useFriends,
  useIncomes,
  useNetworkStatus,
  useProfile,
  useSavingGoal,
  useTransactions,
} from '@/hooks';
import { formatVnDateHeader, isSameDay } from '@/lib/date';
import { calcAvailableToSpend, calcSpendableBudget, formatVnd, sumAmounts } from '@/lib/money';
import { usePostDraftStore } from '@/store/postDraftStore';
import { colors } from '@/theme/tokens';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Camera cần cấu hình lại session khi đổi mặt trước/sau — chặn chụp lúc đang đổi, tránh
  // CameraImageCaptureException (chụp khi session chưa sẵn sàng).
  useEffect(() => {
    setIsCameraReady(false);
  }, [facing]);

  const friendsQuery = useFriends();
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const incomes = useIncomes(cycle.data?.id);
  const savingGoal = useSavingGoal(cycle.data?.id);
  const profile = useProfile();
  const setPhoto = usePostDraftStore((s) => s.setPhoto);
  const syncDefaultsFromProfile = usePostDraftStore((s) => s.syncDefaultsFromProfile);

  useEffect(() => {
    if (!profile.data) return;
    syncDefaultsFromProfile(profile.data.lastMomentToggle ? 'MOMENT' : 'EXPENSE', profile.data.defaultPostPrivacy);
  }, [profile.data, syncDefaultsFromProfile]);

  const isOffline = useNetworkStatus();
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (isOffline && !wasOfflineRef.current) setOfflineDismissed(false);
    wasOfflineRef.current = isOffline;
  }, [isOffline]);

  const todaySpent = sumAmounts(
    (transactions.data ?? [])
      .filter((t) => isSameDay(dayjs(t.transactionDate), dayjs()))
      .map((t) => t.amount)
  );
  const totalIncome = sumAmounts((incomes.data ?? []).filter((i) => i.status === 'RECEIVED').map((i) => i.amount));
  const spendable = calcSpendableBudget(totalIncome, savingGoal.data?.targetRemainingAmount ?? 0);
  const totalExpense = sumAmounts((transactions.data ?? []).map((t) => t.amount));
  const available = calcAvailableToSpend(spendable, totalExpense);

  const isStatsLoading = cycle.isLoading || transactions.isLoading || incomes.isLoading || savingGoal.isLoading;
  const showStatsLoading = useDelayedLoading(isStatsLoading);

  function goToFeed() {
    router.push('/feed');
  }

  function handleNavTab(key: BottomNavKey) {
    if (key === 'expenses') router.push('/expenses');
    else if (key === 'messages') router.push('/messages');
    else if (key === 'me') router.push('/me');
  }

  const openFeedGesture = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      if (e.translationY < -40) {
        runOnJS(goToFeed)();
      }
    });

  async function handleCapture() {
    if (!cameraRef.current || capturing || !isCameraReady) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setPhoto(photo.uri);
        router.push('/post/preview');
      }
    } catch {
      Alert.alert('Chụp ảnh thất bại', 'Thử chụp lại nhé.');
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-4">
          <View>
            <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">
              {formatVnDateHeader(dayjs())}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="h-11 flex-row items-center gap-2 rounded-input bg-paper pl-1.5 pr-3">
              <View className="flex-row">
                {(friendsQuery.data ?? []).slice(0, 2).map((f, i) => (
                  <Avatar key={f.id} name={f.displayName} avatarUrl={f.avatarUrl} size={28} bordered={i > 0} style={i > 0 && { marginLeft: -8 }} />
                ))}
              </View>
              <Text className="font-display-bold text-[13px] text-ink">
                {friendsQuery.isLoading ? '...' : `${friendsQuery.data?.length ?? 0} bạn`}
              </Text>
            </View>
          </View>
        </View>

        <View className="relative mx-4 mt-3 h-[392px] overflow-hidden rounded-frame bg-ink">
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
              flash={flash}
              onCameraReady={() => setIsCameraReady(true)}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-3 px-6">
              <Text className="text-center text-[13px] text-white">
                Cần quyền camera để chụp ảnh đăng bài
              </Text>
              <Pressable
                onPress={requestPermission}
                className="rounded-input bg-red px-4 py-2.5">
                <Text className="font-display-bold text-[14px] text-white">Cấp quyền camera</Text>
              </Pressable>
            </View>
          )}

          <CornerBrackets />

          {permission?.granted && (
            <>
              <View className="absolute right-4 top-16 gap-2.5">
                <Pressable
                  onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
                  className="h-11 w-11 items-center justify-center rounded-input bg-paper">
                  {flash === 'off' ? (
                    <ZapOff size={20} color={colors.ink} />
                  ) : (
                    <Zap size={20} color={colors.ink} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                  className="h-11 w-11 items-center justify-center rounded-input bg-paper">
                  <RefreshCw size={20} color={colors.ink} />
                </Pressable>
              </View>

              <View className="absolute left-14 right-14 top-5 h-8 items-center justify-center rounded-full bg-white/90">
                <Text className="text-center text-[12px] font-display-bold text-ink">
                  Chụp gì cũng được, cái ví cũng được 👛
                </Text>
              </View>
            </>
          )}
        </View>

        <GestureDetector gesture={openFeedGesture}>
          <View>
            <View className="mx-4 mt-4 overflow-hidden rounded-receipt bg-paper">
              <View className="flex-row items-center gap-4 px-4 py-3.5">
                <View className="flex-1 gap-2">
                  <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">HÔM NAY · CỦA BẠN</Text>
                  {showStatsLoading ? (
                    <>
                      <Skeleton width="80%" height={14} />
                      <Skeleton width="60%" height={14} />
                    </>
                  ) : (
                    <>
                      <LeaderRow label="Đã chi" value={formatVnd(todaySpent)} />
                      <LeaderRow
                        label="Còn trong chu kỳ"
                        value={formatVnd(available)}
                        valueClassName={available < 0 ? 'text-red' : 'text-green'}
                      />
                    </>
                  )}
                </View>
                <Pressable
                  onPress={handleCapture}
                  disabled={!permission?.granted || !isCameraReady || capturing}
                  className="h-24 w-24 items-center justify-center rounded-full bg-red"
                  style={{ opacity: !permission?.granted || !isCameraReady || capturing ? 0.5 : 1 }}>
                  <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white">
                    <Text className="font-mono-extrabold text-[15px] tracking-[1px] text-white">CHỤP</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <Pressable onPress={goToFeed} className="mt-5 items-center">
              <Text className="text-[13px] font-display-bold text-muted">Vuốt lên xem bảng tin</Text>
            </Pressable>
          </View>
        </GestureDetector>
      </SafeAreaView>
      <BottomNav active="camera" onChange={handleNavTab} />

      <ErrOffline visible={isOffline && !offlineDismissed} onContinue={() => setOfflineDismissed(true)} />
    </View>
  );
}

function CornerBrackets() {
  const common = 'absolute h-7 w-7 border-white';
  return (
    <>
      <View className={`${common} left-4 top-4 border-l-[3px] border-t-[3px]`} />
      <View className={`${common} right-4 top-4 border-r-[3px] border-t-[3px]`} />
      <View className={`${common} bottom-4 left-4 border-b-[3px] border-l-[3px]`} />
      <View className={`${common} bottom-4 right-4 border-b-[3px] border-r-[3px]`} />
    </>
  );
}
