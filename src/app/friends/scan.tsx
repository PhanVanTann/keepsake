import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ZigzagEdge } from '@/components/receipt';
import { friendRepo } from '@/data';
import { useAddFriendDirect } from '@/hooks';
import { colors } from '@/theme/tokens';
import type { User } from '@/types';

export default function FriendScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [found, setFound] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const addFriend = useAddFriendDirect();
  const scanningRef = useRef(false);

  async function handleScanned(result: BarcodeScanningResult) {
    if (found || scanningRef.current) return;
    const match = result.data.match(/^chitieunha:\/\/friend\/(.+)$/);
    const userId = match?.[1];
    if (!userId) {
      setNotFound(true);
      return;
    }

    scanningRef.current = true;
    try {
      const user = await friendRepo.getUserPreview(userId);
      if (user) {
        setFound(user);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } finally {
      scanningRef.current = false;
    }
  }

  async function handleAddFriend() {
    if (!found) return;
    await addFriend.mutateAsync(found.id);
    router.back();
  }

  return (
    <View className="flex-1 bg-[#1E2126]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <View className="h-[38px] flex-1 flex-row rounded-input bg-[#3A3D44] p-[3px]">
            <Pressable onPress={() => router.replace('/friends/qr')} className="flex-1 items-center justify-center">
              <Text className="font-display-semibold text-[14px] text-[#E1E4E8]">Mã của tôi</Text>
            </Pressable>
            <View className="flex-1 items-center justify-center rounded-input bg-paper">
              <Text className="font-display-bold text-[14px] text-ink">Quét mã</Text>
            </View>
          </View>
        </View>

        <View className="mx-auto mt-14" style={{ width: 260, height: 260 }}>
          {permission?.granted ? (
            <CameraView
              style={{ flex: 1, borderRadius: 4, overflow: 'hidden' }}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={found ? undefined : handleScanned}
            />
          ) : (
            <Pressable onPress={requestPermission} className="flex-1 items-center justify-center gap-3 rounded-frame bg-[#2A2D33]">
              <Text className="text-center text-[13px] text-[#E1E4E8]">Cần quyền camera để quét mã</Text>
              <View className="rounded-input bg-red px-4 py-2.5">
                <Text className="font-display-bold text-[14px] text-white">Cấp quyền</Text>
              </View>
            </Pressable>
          )}
        </View>
        <Text className="mt-6 text-center text-[15px] text-[#E1E4E8]">Đưa mã QR của bạn bè vào khung</Text>
        {notFound && !found && (
          <Text className="mt-2 text-center text-[13px] text-red">Không nhận ra mã này, thử lại nhé</Text>
        )}

        {found && (
          <View className="absolute bottom-10 left-4 right-4">
            <View className="gap-3.5 bg-paper p-4">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-green">✓ ĐÃ QUÉT ĐƯỢC</Text>
              <View className="flex-row items-center gap-3">
                <Avatar name={found.displayName} avatarUrl={found.avatarUrl} size={52} />
                <View className="flex-1">
                  <Text className="font-display-extrabold text-[17px] text-ink">{found.displayName}</Text>
                  <Text className="font-mono text-[12px] text-muted">@{found.username}</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setFound(null);
                    setNotFound(false);
                  }}
                  className="h-12 flex-1 items-center justify-center rounded-input border-[1.5px] border-ink">
                  <Text className="font-display-bold text-[14px] text-ink">Quét lại</Text>
                </Pressable>
                <Pressable onPress={handleAddFriend} className="h-12 flex-1 items-center justify-center rounded-input bg-red">
                  <Text className="font-display-extrabold text-[14px] text-white">Kết bạn ngay</Text>
                </Pressable>
              </View>
            </View>
            <ZigzagEdge width={358} edge="bottom" />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
