import { useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AmountStamp,
  Avatar,
  BottomNav,
  type BottomNavKey,
  LeaderRow,
  MonoLabel,
  Receipt,
  Switch,
} from '@/components/receipt';
import { useCurrentCycle, useFeed, useFriends, useMyPosts } from '@/hooks';

export default function ComponentsDemoScreen() {
  const [activeTab, setActiveTab] = useState<BottomNavKey>('camera');
  const [momentOnly, setMomentOnly] = useState(true);
  const [showLocation, setShowLocation] = useState(false);

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 20 }}
          showsVerticalScrollIndicator={false}>
          <View className="gap-1">
            <Text className="font-display-extrabold text-2xl text-ink">Component biên lai</Text>
            <MonoLabel tone="muted">Bước 1 — demo xem trên Expo Go</MonoLabel>
          </View>

          <Section title="Receipt + ZigzagEdge">
            <Receipt contentClassName="gap-3 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name="Minh Anh" />
                <View className="flex-1">
                  <Text className="font-display-bold text-[15px] text-ink">Minh Anh</Text>
                  <Text className="text-[12px] text-muted">12 phút trước</Text>
                </View>
                <AmountStamp amount={120000} />
              </View>
              <View className="h-[140px] items-center justify-center rounded-frame bg-[#7A4A36]">
                <Text className="text-[13px] text-[#EBD3C6]">[Ảnh: nồi lẩu nấm]</Text>
              </View>
              <Text className="text-[15px] leading-[21px] text-ink">
                Lẩu nấm cuối tuần, chia 4 người là vừa
              </Text>
            </Receipt>
          </Section>

          <Section title="LeaderRow">
            <Receipt zigzagBottom={false} contentClassName="gap-2 p-4">
              <LeaderRow label="Đã chi" value="245.000đ" />
              <LeaderRow label="Còn trong chu kỳ" value="2.160.000đ" valueClassName="text-green" />
              <LeaderRow label="Vượt ngân sách" value="-320.000đ" valueClassName="text-red" />
            </Receipt>
          </Section>

          <Section title="MonoLabel">
            <View className="flex-row flex-wrap gap-3">
              <MonoLabel tone="muted">HÔM NAY · CỦA BẠN</MonoLabel>
              <MonoLabel tone="ink">ĂN UỐNG</MonoLabel>
              <MonoLabel tone="red">VƯỢT NGÂN SÁCH</MonoLabel>
              <MonoLabel tone="green">TIỀN VÀO</MonoLabel>
            </View>
          </Section>

          <Section title="Avatar">
            <View className="flex-row items-center">
              <Avatar name="Minh Anh" />
              <Avatar name="Hoàng" bordered style={{ marginLeft: -10 }} />
              <Avatar name="Thảo" bordered style={{ marginLeft: -10 }} />
              <Avatar name="Quân" bordered style={{ marginLeft: -10 }} />
            </View>
          </Section>

          <Section title="Switch">
            <View className="gap-3">
              <Row label="📸 Chỉ chia sẻ khoảnh khắc">
                <Switch value={momentOnly} onValueChange={setMomentOnly} tone="red" />
              </Row>
              <Row label="Hiện vị trí">
                <Switch value={showLocation} onValueChange={setShowLocation} tone="ink" />
              </Row>
            </View>
          </Section>

          <Section title="BottomNav">
            <Text className="text-[13px] text-muted">
              Tab đang chọn: <Text className="font-mono-bold text-ink">{activeTab}</Text> — bấm thanh dưới để đổi
            </Text>
          </Section>

          <Section title="Data layer (bước 2) — hook → repo → mock, có loading 400-800ms">
            <DataLayerPreview />
          </Section>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </View>
  );
}

function DataLayerPreview() {
  const feed = useFeed();
  const myPosts = useMyPosts();
  const friendsQuery = useFriends();
  const cycle = useCurrentCycle();

  return (
    <Receipt zigzagBottom={false} contentClassName="gap-2 p-4">
      <LeaderRow label="Bài trên bảng tin" value={feed.isLoading ? '...' : String(feed.data?.length ?? 0)} />
      <LeaderRow label="Bài của tôi" value={myPosts.isLoading ? '...' : String(myPosts.data?.length ?? 0)} />
      <LeaderRow label="Bạn bè" value={friendsQuery.isLoading ? '...' : String(friendsQuery.data?.length ?? 0)} />
      <LeaderRow
        label="Chu kỳ hiện tại"
        value={cycle.isLoading || !cycle.data ? '...' : `${cycle.data.startDate} → ${cycle.data.endDate}`}
      />
    </Receipt>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <MonoLabel tone="muted">{title}</MonoLabel>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between rounded-input bg-paper px-4 py-3">
      <Text className="font-display text-[14px] text-ink">{label}</Text>
      {children}
    </View>
  );
}
