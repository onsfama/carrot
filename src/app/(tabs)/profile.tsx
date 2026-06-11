import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

const MANNER_TEMP = 36.5;
const MANNER_MAX  = 100;

const ACTIVITY_MENUS = [
  { id: '1', icon: 'pricetag-outline' as const, label: '판매 내역', color: '#FF6F0F', key: 'sell' },
  { id: '2', icon: 'bag-outline'      as const, label: '구매 내역', color: '#2196F3', key: 'buy'  },
  { id: '3', icon: 'heart-outline'    as const, label: '관심 목록', color: '#F44336', key: 'like' },
];

const SETTING_MENUS = [
  { id: '1', icon: 'location-outline'      as const, label: '내 동네 설정', key: 'location' },
  { id: '2', icon: 'notifications-outline' as const, label: '알림 설정',    key: 'noti'     },
  { id: '3', icon: 'headset-outline'       as const, label: '고객센터',     key: 'support'  },
  { id: '4', icon: 'document-text-outline' as const, label: '이용약관',     key: 'terms'    },
  { id: '5', icon: 'settings-outline'      as const, label: '앱 설정',      key: 'appsetting' },
];

const LOCATIONS = ['역삼1동', '역삼2동', '삼성1동', '대치2동', '도곡1동', '논현동', '청담동'];

const STATUS_LABEL: Record<string, string> = {
  selling: '판매중', reserved: '예약중', sold: '거래완료',
};

type SellItem = {
  id: string;
  title: string;
  price: number | null;
  price_type: string;
  status: string;
  image_urls: string[];
  created_at: string;
};

function formatPrice(price: number | null, priceType: string) {
  if (priceType === 'free') return '무료나눔';
  if (!price) return '가격협의';
  return `${price.toLocaleString()}원`;
}

function MannerBar({ temp }: { temp: number }) {
  const pct   = (temp / MANNER_MAX) * 100;
  const color = temp >= 50 ? '#FF6F0F' : temp >= 37 ? '#4CAF50' : '#2196F3';
  return (
    <View style={styles.mannerWrap}>
      <View style={styles.mannerTrack}>
        <View style={[styles.mannerFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.mannerTemp, { color }]}>{temp}°C</Text>
    </View>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={mStyles.header}>
      <TouchableOpacity onPress={onClose} style={mStyles.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#212121" />
      </TouchableOpacity>
      <Text style={mStyles.headerTitle}>{title}</Text>
    </View>
  );
}

function ItemRow({ item }: { item: SellItem }) {
  return (
    <View style={iStyles.row}>
      {item.image_urls?.[0]
        ? <Image source={{ uri: item.image_urls[0] }} style={iStyles.thumb} />
        : <View style={[iStyles.thumb, iStyles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#CCCCCC" />
          </View>
      }
      <View style={iStyles.info}>
        <Text style={iStyles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={iStyles.price}>{formatPrice(item.price, item.price_type)}</Text>
        <Text style={iStyles.status}>{STATUS_LABEL[item.status] ?? item.status}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [activeModal, setActiveModal]   = useState<string | null>(null);
  const [location, setLocation]         = useState('역삼1동');
  const [notiTrade, setNotiTrade]       = useState(true);
  const [notiCommunity, setNotiCommunity] = useState(true);
  const [notiMarketing, setNotiMarketing] = useState(false);

  const [sellItems, setSellItems]     = useState<SellItem[]>([]);
  const [likeItems, setLikeItems]     = useState<SellItem[]>([]);
  const [sellLoading, setSellLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const fetchSellItems = async () => {
    if (!user) return;
    setSellLoading(true);
    const { data } = await supabase
      .from('items')
      .select('id, title, price, price_type, status, image_urls, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setSellItems(data ?? []);
    setSellLoading(false);
  };

  const fetchLikeItems = async () => {
    if (!user) return;
    setLikeLoading(true);
    const { data } = await supabase
      .from('likes')
      .select('items(id, title, price, price_type, status, image_urls, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLikeItems((data ?? []).map((d: any) => d.items).filter(Boolean));
    setLikeLoading(false);
  };

  const open = (key: string) => {
    setActiveModal(key);
    if (key === 'sell') fetchSellItems();
    if (key === 'like') fetchLikeItems();
  };
  const close = () => setActiveModal(null);

  const handleLogout = () => {
    const doLogout = () => {
      signOut();
      router.replace('/login' as any);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('로그아웃 하시겠어요?')) doLogout();
      return;
    }

    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>나의 당근</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => open('appsetting')} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}><Ionicons name="person" size={36} color="#AAAAAA" /></View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.nickname ?? '당근 사용자'}</Text>
            <Text style={styles.userLocation}>{user?.email ? `${user.email} · ` : ''}{location}</Text>
            <MannerBar temp={MANNER_TEMP} />
            <Text style={styles.mannerLabel}>매너온도</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => open('profile')} activeOpacity={0.7}>
            <Text style={styles.profileBtnText}>프로필 보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* 활동 메뉴 */}
        <View style={styles.activityRow}>
          {ACTIVITY_MENUS.map((menu) => (
            <TouchableOpacity key={menu.id} style={styles.activityItem} onPress={() => open(menu.key)} activeOpacity={0.7}>
              <View style={[styles.activityIcon, { backgroundColor: menu.color + '20' }]}>
                <Ionicons name={menu.icon} size={24} color={menu.color} />
              </View>
              <Text style={styles.activityLabel}>{menu.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 설정 메뉴 */}
        <View style={styles.settingSection}>
          {SETTING_MENUS.map((menu, idx) => (
            <View key={menu.id}>
              <TouchableOpacity style={styles.settingItem} onPress={() => open(menu.key)} activeOpacity={0.7}>
                <Ionicons name={menu.icon} size={22} color="#555555" />
                <Text style={styles.settingLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
              </TouchableOpacity>
              {idx < SETTING_MENUS.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 판매 내역 */}
      <Modal visible={activeModal === 'sell'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="판매 내역" onClose={close} />
          {sellLoading
            ? <ActivityIndicator color="#FF6F0F" style={{ marginTop: 40 }} />
            : sellItems.length === 0
              ? <View style={mStyles.emptyBox}>
                  <Ionicons name="pricetag-outline" size={56} color="#E0E0E0" />
                  <Text style={mStyles.emptyTitle}>판매 내역이 없어요</Text>
                  <Text style={mStyles.emptyDesc}>홈에서 내 물건을 등록해보세요</Text>
                </View>
              : <FlatList
                  data={sellItems}
                  keyExtractor={i => i.id}
                  renderItem={({ item }) => <ItemRow item={item} />}
                />
          }
        </View>
      </Modal>

      {/* 구매 내역 */}
      <Modal visible={activeModal === 'buy'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="구매 내역" onClose={close} />
          <View style={mStyles.emptyBox}>
            <Ionicons name="bag-outline" size={56} color="#E0E0E0" />
            <Text style={mStyles.emptyTitle}>구매 내역이 없어요</Text>
            <Text style={mStyles.emptyDesc}>거래가 완료되면 여기에 표시돼요</Text>
          </View>
        </View>
      </Modal>

      {/* 관심 목록 */}
      <Modal visible={activeModal === 'like'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="관심 목록" onClose={close} />
          {likeLoading
            ? <ActivityIndicator color="#FF6F0F" style={{ marginTop: 40 }} />
            : likeItems.length === 0
              ? <View style={mStyles.emptyBox}>
                  <Ionicons name="heart-outline" size={56} color="#E0E0E0" />
                  <Text style={mStyles.emptyTitle}>관심 목록이 없어요</Text>
                  <Text style={mStyles.emptyDesc}>마음에 드는 물건에 하트를 눌러보세요</Text>
                </View>
              : <FlatList
                  data={likeItems}
                  keyExtractor={i => i.id}
                  renderItem={({ item }) => <ItemRow item={item} />}
                />
          }
        </View>
      </Modal>

      {/* 내 동네 설정 */}
      <Modal visible={activeModal === 'location'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="내 동네 설정" onClose={close} />
          <ScrollView>
            <Text style={mStyles.sectionLabel}>동네 선택</Text>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={mStyles.optionRow}
                onPress={() => { setLocation(loc); close(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={20} color="#888888" />
                <Text style={mStyles.optionText}>{loc}</Text>
                {location === loc && <Ionicons name="checkmark" size={20} color="#FF6F0F" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 알림 설정 */}
      <Modal visible={activeModal === 'noti'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="알림 설정" onClose={close} />
          <View style={mStyles.switchSection}>
            <SwitchRow label="거래 알림"     desc="채팅·거래 관련 알림"     value={notiTrade}     onChange={setNotiTrade}     />
            <SwitchRow label="동네생활 알림" desc="댓글·공감 관련 알림"     value={notiCommunity} onChange={setNotiCommunity} />
            <SwitchRow label="마케팅 알림"   desc="이벤트·혜택 관련 알림"   value={notiMarketing} onChange={setNotiMarketing} />
          </View>
        </View>
      </Modal>

      {/* 고객센터 */}
      <Modal visible={activeModal === 'support'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="고객센터" onClose={close} />
          <ScrollView>
            {[
              { icon: 'chatbubble-outline', label: '1:1 문의하기',    desc: '평균 응답 시간 2시간' },
              { icon: 'help-circle-outline', label: '자주 묻는 질문', desc: 'FAQ 바로가기' },
              { icon: 'call-outline',        label: '전화 상담',      desc: '평일 09:00 - 18:00' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={mStyles.supportRow} activeOpacity={0.7}>
                <View style={mStyles.supportIcon}><Ionicons name={item.icon as any} size={22} color="#FF6F0F" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={mStyles.supportLabel}>{item.label}</Text>
                  <Text style={mStyles.supportDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 이용약관 */}
      <Modal visible={activeModal === 'terms'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="이용약관" onClose={close} />
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={mStyles.termsTitle}>당근마켓 이용약관</Text>
            <Text style={mStyles.termsBody}>{`제1조 (목적)\n이 약관은 당근마켓 주식회사(이하 "회사")가 제공하는 당근마켓 서비스 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.\n\n제2조 (이용자의 의무)\n이용자는 관계 법령, 이 약관의 규정, 이용 안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.\n\n제3조 (서비스의 제공)\n회사는 이용자에게 아래와 같은 서비스를 제공합니다.\n1. 중고거래 게시판 서비스\n2. 동네생활 커뮤니티 서비스\n3. 내 근처 지역 정보 서비스\n4. 기타 회사가 정하는 서비스\n\n제4조 (개인정보 보호)\n회사는 이용자의 개인정보를 관련 법령에 따라 보호합니다. 개인정보 처리에 관한 상세한 내용은 개인정보 처리방침을 참조하시기 바랍니다.`}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* 프로필 보기 */}
      <Modal visible={activeModal === 'profile'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="프로필" onClose={close} />
          <View style={mStyles.emptyBox}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={52} color="#AAAAAA" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#212121', marginTop: 16 }}>{profile?.nickname ?? '당근 사용자'}</Text>
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 24 }}>{user?.email ?? ''}</Text>
            <View style={{ width: '80%' }}>
              <MannerBar temp={MANNER_TEMP} />
              <Text style={{ fontSize: 12, color: '#AAAAAA', marginTop: 4, textAlign: 'center' }}>매너온도</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#AAAAAA', textAlign: 'center', marginTop: 20, lineHeight: 20, paddingHorizontal: 32 }}>
              {'매너온도는 이웃과의 거래 후\n남겨주신 평가를 바탕으로 결정돼요'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* 앱 설정 */}
      <Modal visible={activeModal === 'appsetting'} animationType="slide" onRequestClose={close}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          <ModalHeader title="앱 설정" onClose={close} />
          <ScrollView>
            <Text style={mStyles.sectionLabel}>일반</Text>
            {[
              { label: '버전 정보',     value: '1.0.0' },
              { label: '캐시 삭제',    value: '12.4MB' },
              { label: '오픈소스 라이선스', value: '' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={mStyles.optionRow} activeOpacity={0.7}>
                <Text style={[mStyles.optionText, { flex: 1 }]}>{item.label}</Text>
                {item.value ? <Text style={mStyles.optionValue}>{item.value}</Text> : <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function SwitchRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={mStyles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={mStyles.switchLabel}>{label}</Text>
        <Text style={mStyles.switchDesc}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#FF6F0F' }} thumbColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#212121' },
  iconBtn:        { padding: 6 },
  profileSection: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  avatar:         { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileInfo:    { flex: 1, gap: 2 },
  userName:       { fontSize: 17, fontWeight: '700', color: '#212121' },
  userLocation:   { fontSize: 13, color: '#888888', marginBottom: 6 },
  mannerWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mannerTrack:    { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  mannerFill:     { height: '100%', borderRadius: 3 },
  mannerTemp:     { fontSize: 13, fontWeight: '700', minWidth: 44 },
  mannerLabel:    { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  profileBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  profileBtnText: { fontSize: 13, color: '#212121', fontWeight: '500' },
  divider:        { height: 8, backgroundColor: '#F5F5F5' },
  activityRow:    { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 16 },
  activityItem:   { flex: 1, alignItems: 'center', gap: 8 },
  activityIcon:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityLabel:  { fontSize: 12, color: '#212121', fontWeight: '500' },
  settingSection: { paddingVertical: 8 },
  settingItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  settingLabel:   { flex: 1, fontSize: 15, color: '#212121' },
  separator:      { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginHorizontal: 20 },
  logoutBtn:      { paddingVertical: 18, alignItems: 'center' },
  logoutText:     { fontSize: 14, color: '#AAAAAA' },
});

const mStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFFFFF' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 12 },
  backBtn:      { padding: 4 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#212121' },
  emptyBox:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: '#212121' },
  emptyDesc:    { fontSize: 14, color: '#AAAAAA' },
  sectionLabel: { fontSize: 13, color: '#AAAAAA', paddingHorizontal: 20, paddingVertical: 12 },
  optionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  optionText:   { fontSize: 15, color: '#212121' },
  optionValue:  { fontSize: 14, color: '#AAAAAA' },
  switchSection:{ padding: 20, gap: 4 },
  switchRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  switchLabel:  { fontSize: 15, color: '#212121', fontWeight: '500' },
  switchDesc:   { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  supportRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  supportIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center' },
  supportLabel: { fontSize: 15, color: '#212121', fontWeight: '500' },
  supportDesc:  { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  termsTitle:   { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 16 },
  termsBody:    { fontSize: 14, color: '#555555', lineHeight: 24 },
});

const iStyles = StyleSheet.create({
  row:             { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  thumb:           { width: 72, height: 72, borderRadius: 10 },
  thumbPlaceholder:{ backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  info:            { flex: 1, justifyContent: 'center', gap: 4 },
  title:           { fontSize: 15, color: '#212121', fontWeight: '500' },
  price:           { fontSize: 14, fontWeight: '700', color: '#212121' },
  status:          { fontSize: 12, color: '#888888' },
});
