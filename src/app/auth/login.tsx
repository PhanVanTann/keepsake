import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Phone } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

export default function LoginScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signInWithGoogle() {
    setIsSigningIn(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'chitieunha', path: '/' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Không lấy được đường dẫn đăng nhập từ Supabase.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) return;

      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code;
      if (typeof code !== 'string') throw new Error('Thiếu mã xác thực trong đường dẫn trả về.');

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;

      router.replace('/auth/finance-setup');
    } catch (e) {
      Alert.alert('Đăng nhập thất bại', e instanceof Error ? e.message : 'Có lỗi xảy ra, thử lại nhé.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <View className="flex-1 bg-bg px-4">
      <SafeAreaView className="flex-1 justify-end pb-6" edges={['top', 'bottom']}>
        <View className="mb-10">
          <Text className="font-display-extrabold text-[32px] leading-[36.8px] text-ink">
            Chụp một tấm,{'\n'}ghi một khoản.
          </Text>
          <Text className="mt-2.5 text-[15px] leading-[22.5px] text-muted">
            Khoe khoản chi với bạn bè bằng ảnh. App tự cộng sổ cho cả tháng.
          </Text>
        </View>

        <View className="gap-2.5">
          <Pressable
            onPress={signInWithGoogle}
            disabled={isSigningIn}
            className="h-14 flex-row items-center justify-center gap-2.5 rounded-input bg-ink">
            {isSigningIn ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <>
                <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-paper">
                  <Text className="font-display-extrabold text-[13px] text-ink">G</Text>
                </View>
                <Text className="font-display-bold text-[16px] text-white">Tiếp tục với Google</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/auth/phone')}
            className="h-14 flex-row items-center justify-center gap-2.5 rounded-input border-[1.5px] border-ink">
            <Phone size={20} color={colors.ink} />
            <Text className="font-display-bold text-[16px] text-ink">Tiếp tục bằng số điện thoại</Text>
          </Pressable>
          <Text className="mt-1.5 text-center text-[12px] leading-[18px] text-muted">
            Tiếp tục nghĩa là bạn đồng ý với <Text className="font-display-bold text-ink">Điều khoản</Text> và{' '}
            <Text className="font-display-bold text-ink">Quyền riêng tư</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
