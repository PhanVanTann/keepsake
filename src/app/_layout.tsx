import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { friendRepo } from '@/data';
import { useAuth, useCancelAccountDeletion, useProfile } from '@/hooks';
import { usePendingInviteStore } from '@/store/pendingInviteStore';
import { useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

/** Màn xem trước được trước khi đăng nhập — link mời phải vào được dù chưa có session. */
const PUBLIC_SEGMENTS = ['auth', 'invite'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pendingInviteCode = usePendingInviteStore((s) => s.code);
  const clearPendingInvite = usePendingInviteStore((s) => s.clear);
  const profile = useProfile(!!session);
  const cancelAccountDeletion = useCancelAccountDeletion();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_SEGMENTS.includes(segments[0] as string);

    if (!session && !isPublic) {
      router.replace('/auth/login');
    }
  }, [session, isLoading, segments, router]);

  useEffect(() => {
    if (!session || !pendingInviteCode) return;
    const code = pendingInviteCode;
    clearPendingInvite();
    friendRepo.redeemInviteCode(code).catch(() => {
      // Mã hết hạn/đã dùng — bỏ qua lặng lẽ, không chặn luồng đăng nhập.
    });
  }, [session, pendingInviteCode, clearPendingInvite]);

  // "Đăng nhập lại trước hạn là khôi phục" (CLAUDE.md) — có session nghĩa là vừa đăng nhập lại.
  useEffect(() => {
    if (profile.data?.deletionRequestedAt) {
      cancelAccountDeletion.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data?.deletionRequestedAt]);

  // Thoát app giữa màn "Tiền của bạn về thế nào?" rồi mở lại không được bỏ qua bước đó.
  useEffect(() => {
    if (isLoading || !session || !profile.data) return;
    const isOnFinanceSetup = segments[0] === 'auth' && segments[1] === 'finance-setup';
    if (!profile.data.onboardingCompletedAt && !isOnFinanceSetup) {
      router.replace('/auth/finance-setup');
    }
  }, [isLoading, session, profile.data, segments, router]);

  return children;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useAppFonts();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            {/* Chạm ra ngoài ô nhập/nút bất kỳ màn nào cũng tự ẩn bàn phím — không chặn các nút/ô
                nhập bên trong vì Pressable chỉ nhận onPress khi không có gì bên trong "giành" chạm đó. */}
            <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="feed/index" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="feed/mine" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="post/preview" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="post/create" options={{ animation: 'slide_from_bottom' }} />
              </Stack>
            </Pressable>
          </AuthGate>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
