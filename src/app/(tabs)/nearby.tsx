import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Store = { id: string; name: string; category: string; distance: string; hours: string; phone: string; desc: string };
type Job   = { id: string; company: string; role: string; pay: string; distance: string; hours: string; desc: string };
type RE    = { id: string; address: string; type: string; price: string; size: string; floor: string; desc: string };

const STORES: Store[] = [
  { id: '1', name: '역삼 곱창',    category: '음식점', distance: '150m', hours: '17:00 - 24:00', phone: '02-1234-5678', desc: '30년 전통의 곱창 전문점. 신선한 재료만 사용합니다. 혼밥·단체 모두 환영해요.' },
  { id: '2', name: '카페 모모',    category: '카페',   distance: '200m', hours: '08:00 - 22:00', phone: '02-2345-6789', desc: '직접 로스팅한 스페셜티 커피와 수제 베이커리를 즐길 수 있는 조용한 카페예요.' },
  { id: '3', name: '행복 세탁소',  category: '세탁',   distance: '320m', hours: '08:00 - 21:00', phone: '02-3456-7890', desc: '드라이클리닝, 이불 세탁, 수선 전문. 당일 세탁 가능(오전 접수 기준).' },
  { id: '4', name: '강남 약국',    category: '약국',   distance: '450m', hours: '09:00 - 21:00', phone: '02-4567-8901', desc: '처방전 조제, 일반 의약품, 건강기능식품 판매. 친절한 상담 제공합니다.' },
  { id: '5', name: '역삼 미용실',  category: '미용',   distance: '500m', hours: '10:00 - 21:00', phone: '02-5678-9012', desc: '커트, 펌, 염색 전문. 예약 없이 방문 가능하며 남녀 모두 환영합니다.' },
  { id: '6', name: 'GS25 역삼점', category: '편의점', distance: '80m',  hours: '24시간',        phone: '02-6789-0123', desc: '24시간 운영 편의점. 택배 접수, ATM, 각종 공과금 납부 가능합니다.' },
  { id: '7', name: '꽃집 블루밍',  category: '꽃집',   distance: '600m', hours: '09:00 - 20:00', phone: '02-7890-1234', desc: '생화·드라이플라워 판매 및 꽃다발 제작. 당일 배달 서비스 제공합니다.' },
  { id: '8', name: '피트니스 클럽', category: '헬스',  distance: '700m', hours: '06:00 - 23:00', phone: '02-8901-2345', desc: '최신 운동기구 완비, PT 트레이너 상주. 1일권·월정액 모두 이용 가능합니다.' },
  { id: '9', name: '역삼 PC방',    category: 'PC방',   distance: '850m', hours: '24시간',        phone: '02-9012-3456', desc: '최신 사양 PC, 1인 독립석 완비. 먹거리 메뉴 다양하게 운영합니다.' },
];

const JOBS: Job[] = [
  { id: '1', company: '스타벅스 역삼점', role: '바리스타',     pay: '시급 12,000원', distance: '200m', hours: '09:00 - 18:00 (주 5일)',     desc: '커피 음료 제조 및 매장 관리. 경력 무관 지원 가능합니다. 교육 후 업무 시작.' },
  { id: '2', company: '편의점 GS25',    role: '야간 알바',    pay: '시급 11,500원', distance: '350m', hours: '23:00 - 07:00 (주 3~5일)',  desc: '야간 편의점 운영 보조. 재고 관리, 발주, 청소 포함. 야간 할증 적용.' },
  { id: '3', company: '역삼 헬스장',    role: '데스크 직원',  pay: '시급 13,000원', distance: '500m', hours: '06:00 - 14:00 (주 5일)',     desc: '회원 관리, 안내 업무, 청소. 운동에 관심 있는 분 우대. 헬스장 무료 이용 가능.' },
  { id: '4', company: '치킨 본가',      role: '배달·홀 서빙', pay: '시급 12,500원', distance: '600m', hours: '16:00 - 24:00 (주 3일 이상)', desc: '홀 서빙 및 배달 업무. 오토바이 면허 소지자 우대. 식사 제공.' },
  { id: '5', company: '역삼동 카페',    role: '홀 서빙',      pay: '시급 11,000원', distance: '250m', hours: '10:00 - 18:00 (주 4일)',     desc: '음료 서빙 및 테이블 관리. 커피 관심 있는 분 환영. 음료 무한 제공.' },
  { id: '6', company: '강남구 도서관',  role: '사서 보조',    pay: '시급 11,200원', distance: '900m', hours: '09:00 - 18:00 (주 5일)',     desc: '도서 정리 및 대출 반납 보조 업무. 조용한 환경. 주차 가능.' },
  { id: '7', company: '역삼 마트',      role: '계산원',       pay: '시급 11,500원', distance: '400m', hours: '09:00 - 21:00 (주 4~5일)',  desc: '고객 계산 및 진열 업무. 경력 무관. 점심 제공. 교통비 별도.' },
];

const REALESTATE: RE[] = [
  { id: '1', address: '역삼1동 00빌라',   type: '원룸 월세', price: '보증 500 / 45만',   size: '20㎡', floor: '3층/5층',   desc: '역세권 위치, 풀옵션(냉장고·세탁기·에어컨), 조용한 주거 환경. 관리비 5만원.' },
  { id: '2', address: '삼성1동 신축',     type: '오피스텔',  price: '보증 1000 / 85만', size: '33㎡', floor: '7층/15층',  desc: '2024년 신축. 1.5룸 구조, 빌트인 가전 완비. 단지 내 헬스장, 세탁실 이용 가능.' },
  { id: '3', address: '역삼2동 아파트',   type: '전세',      price: '3억 5천',           size: '59㎡', floor: '12층/20층', desc: '방 2개, 화장실 1개. 초등학교 도보 5분. 지하철 역세권. 주차 1대 가능.' },
  { id: '4', address: '대치2동 투룸',     type: '월세',      price: '보증 1000 / 70만', size: '45㎡', floor: '2층/4층',   desc: '방 2개 구조, 신축 리모델링. 학원가 도보 5분. 조용한 주택가 위치.' },
  { id: '5', address: '도곡1동 오피스텔', type: '전세',      price: '1억 8천',           size: '27㎡', floor: '5층/12층',  desc: '역 도보 3분. 주방·욕실 리모델링 완료. 관리비 포함 가격. 즉시 입주 가능.' },
  { id: '6', address: '개포동 빌라',      type: '매매',      price: '4억 2천',           size: '66㎡', floor: '4층/4층',   desc: '방 3개, 화장실 2개. 주차 가능, 남향. 초·중·고 모두 도보권. 융자 없음.' },
];

// ─── 공통 ────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={dStyles.infoRow}>
      <Ionicons name={icon} size={16} color="#888888" />
      <Text style={dStyles.infoLabel}>{label}</Text>
      <Text style={dStyles.infoValue}>{value}</Text>
    </View>
  );
}

function ModalShell({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[dStyles.container, { paddingTop: insets.top }]}>
        <View style={dStyles.header}>
          <TouchableOpacity onPress={onClose} style={dStyles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={dStyles.headerTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </Modal>
  );
}

// ─── 검색 모달 ───────────────────────────────────────────────────

function SearchModal({ visible, onClose, onSelectStore, onSelectJob, onSelectRE }: {
  visible: boolean;
  onClose: () => void;
  onSelectStore: (s: Store) => void;
  onSelectJob:   (j: Job)   => void;
  onSelectRE:    (r: RE)    => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filteredStores = q ? STORES.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) : [];
  const filteredJobs   = q ? JOBS.filter(j => j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q))     : [];
  const filteredRE     = q ? REALESTATE.filter(r => r.address.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)) : [];
  const total = filteredStores.length + filteredJobs.length + filteredRE.length;

  const handleClose = () => { setQuery(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[dStyles.container, { paddingTop: insets.top }]}>
        {/* 검색 헤더 */}
        <View style={sStyles.searchHeader}>
          <TouchableOpacity onPress={handleClose} style={dStyles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View style={sStyles.inputWrap}>
            <Ionicons name="search-outline" size={18} color="#888888" />
            <TextInput
              style={sStyles.input}
              placeholder="가게, 알바, 부동산 검색..."
              placeholderTextColor="#AAAAAA"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#AAAAAA" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* 입력 전 안내 */}
          {q.length === 0 && (
            <View style={sStyles.emptyWrap}>
              <Ionicons name="search-outline" size={52} color="#DDDDDD" />
              <Text style={sStyles.emptyText}>검색어를 입력해 주세요</Text>
              <Text style={sStyles.emptySubText}>가게 이름, 업종, 알바 직종, 주소 등으로 검색할 수 있어요</Text>
            </View>
          )}

          {/* 결과 없음 */}
          {q.length > 0 && total === 0 && (
            <View style={sStyles.emptyWrap}>
              <Ionicons name="alert-circle-outline" size={52} color="#DDDDDD" />
              <Text style={sStyles.emptyText}>검색 결과가 없어요</Text>
              <Text style={sStyles.emptySubText}>다른 키워드로 검색해 보세요</Text>
            </View>
          )}

          {/* 동네가게 결과 */}
          {filteredStores.length > 0 && (
            <>
              <Text style={sStyles.groupTitle}>동네가게 ({filteredStores.length})</Text>
              {filteredStores.map(s => (
                <TouchableOpacity key={s.id} style={styles.listItem}
                  onPress={() => { handleClose(); onSelectStore(s); }} activeOpacity={0.7}>
                  <View style={styles.listIcon}><Ionicons name="storefront-outline" size={22} color="#FF6F0F" /></View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.listSub}>{s.category} · {s.hours}</Text>
                  </View>
                  <Text style={styles.listDist}>{s.distance}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* 동네 알바 결과 */}
          {filteredJobs.length > 0 && (
            <>
              <Text style={sStyles.groupTitle}>동네 알바 ({filteredJobs.length})</Text>
              {filteredJobs.map(j => (
                <TouchableOpacity key={j.id} style={styles.listItem}
                  onPress={() => { handleClose(); onSelectJob(j); }} activeOpacity={0.7}>
                  <View style={[styles.listIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="briefcase-outline" size={22} color="#2196F3" /></View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{j.company}</Text>
                    <Text style={styles.listSub}>{j.role}</Text>
                    <Text style={styles.listPrice}>{j.pay}</Text>
                  </View>
                  <Text style={styles.listDist}>{j.distance}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* 동네 부동산 결과 */}
          {filteredRE.length > 0 && (
            <>
              <Text style={sStyles.groupTitle}>동네 부동산 ({filteredRE.length})</Text>
              {filteredRE.map(r => (
                <TouchableOpacity key={r.id} style={styles.listItem}
                  onPress={() => { handleClose(); onSelectRE(r); }} activeOpacity={0.7}>
                  <View style={[styles.listIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="home-outline" size={22} color="#4CAF50" /></View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{r.address}</Text>
                    <Text style={styles.listSub}>{r.type} · {r.size}</Text>
                    <Text style={styles.listPrice}>{r.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── 상세 모달 ───────────────────────────────────────────────────

function StoreDetailModal({ store, onClose }: { store: Store; onClose: () => void }) {
  const [called, setCalled] = useState(false);
  return (
    <ModalShell visible title={store.name} onClose={onClose}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={dStyles.body}>
          <View style={dStyles.thumbLarge}><Ionicons name="storefront-outline" size={48} color="#AAAAAA" /></View>
          <Text style={dStyles.detailName}>{store.name}</Text>
          <Text style={dStyles.detailCategory}>{store.category} · {store.distance}</Text>
          <View style={dStyles.infoBox}>
            <InfoRow icon="time-outline" label="영업시간" value={store.hours} />
            <InfoRow icon="call-outline" label="전화번호" value={store.phone} />
          </View>
          <Text style={dStyles.desc}>{store.desc}</Text>
          {called ? (
            <View style={dStyles.successBox}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
              <Text style={dStyles.successText}>전화 앱으로 연결했어요</Text>
            </View>
          ) : (
            <TouchableOpacity style={dStyles.actionBtn} activeOpacity={0.8}
              onPress={() => { setCalled(true); Linking.openURL(`tel:${store.phone.replace(/-/g, '')}`); }}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={dStyles.actionBtnText}>전화하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

// applied/onApply/onCancel을 props로 받아 NearbyScreen에서 상태를 관리
function JobDetailModal({ job, applied, onApply, onCancel, onClose }: {
  job: Job; applied: boolean; onApply: () => void; onCancel: () => void; onClose: () => void;
}) {
  return (
    <ModalShell visible title={job.company} onClose={onClose}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={dStyles.body}>
          <View style={[dStyles.thumbLarge, { backgroundColor: '#E3F2FD' }]}><Ionicons name="briefcase-outline" size={48} color="#2196F3" /></View>
          <Text style={dStyles.detailName}>{job.company}</Text>
          <Text style={dStyles.detailCategory}>{job.role} · {job.distance}</Text>
          <View style={dStyles.infoBox}>
            <InfoRow icon="cash-outline"  label="급여"     value={job.pay} />
            <InfoRow icon="time-outline"  label="근무시간" value={job.hours} />
          </View>
          <Text style={dStyles.desc}>{job.desc}</Text>
          {applied ? (
            <View style={dStyles.successBox}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
              <Text style={dStyles.successText}>지원이 완료됐어요!</Text>
              <Text style={dStyles.successSub}>업체에서 연락이 올 예정이에요</Text>
              <TouchableOpacity style={dStyles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                <Text style={dStyles.cancelBtnText}>지원 취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[dStyles.actionBtn, { backgroundColor: '#2196F3' }]} activeOpacity={0.8}
              onPress={onApply}>
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              <Text style={dStyles.actionBtnText}>지원하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

function REDetailModal({ re, onClose }: { re: RE; onClose: () => void }) {
  const [inquired, setInquired] = useState(false);
  return (
    <ModalShell visible title={re.address} onClose={onClose}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={dStyles.body}>
          <View style={[dStyles.thumbLarge, { backgroundColor: '#E8F5E9' }]}><Ionicons name="home-outline" size={48} color="#4CAF50" /></View>
          <Text style={dStyles.detailName}>{re.address}</Text>
          <Text style={dStyles.detailCategory}>{re.type}</Text>
          <Text style={dStyles.detailPrice}>{re.price}</Text>
          <View style={dStyles.infoBox}>
            <InfoRow icon="resize-outline" label="면적" value={re.size} />
            <InfoRow icon="layers-outline" label="층수" value={re.floor} />
          </View>
          <Text style={dStyles.desc}>{re.desc}</Text>
          {inquired ? (
            <View style={dStyles.successBox}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
              <Text style={dStyles.successText}>문의가 접수됐어요!</Text>
              <Text style={dStyles.successSub}>담당 중개사가 곧 연락드릴 예정이에요</Text>
            </View>
          ) : (
            <TouchableOpacity style={[dStyles.actionBtn, { backgroundColor: '#4CAF50' }]} activeOpacity={0.8}
              onPress={() => setInquired(true)}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
              <Text style={dStyles.actionBtnText}>문의하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

// ─── 더보기 전체목록 모달 ────────────────────────────────────────

function StoreListModal({ visible, onClose, onSelect }: {
  visible: boolean; onClose: () => void; onSelect: (s: Store) => void;
}) {
  return (
    <ModalShell visible={visible} title="동네가게 전체보기" onClose={onClose}>
      <FlatList
        data={STORES}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => { onClose(); onSelect(item); }} activeOpacity={0.7}>
            <View style={styles.listIcon}><Ionicons name="storefront-outline" size={22} color="#FF6F0F" /></View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <Text style={styles.listSub}>{item.category} · {item.hours}</Text>
              <Text style={styles.listPrice}>{item.phone}</Text>
            </View>
            <Text style={styles.listDist}>{item.distance}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginHorizontal: 16 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ModalShell>
  );
}

function JobListModal({ visible, onClose, onSelect, appliedJobs }: {
  visible: boolean; onClose: () => void; onSelect: (j: Job) => void; appliedJobs: Set<string>;
}) {
  return (
    <ModalShell visible={visible} title="동네 알바 전체보기" onClose={onClose}>
      <FlatList
        data={JOBS}
        keyExtractor={(j) => j.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => { onClose(); onSelect(item); }} activeOpacity={0.7}>
            <View style={[styles.listIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="briefcase-outline" size={22} color="#2196F3" /></View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>{item.company}</Text>
              <Text style={styles.listSub}>{item.role} · {item.hours}</Text>
              <Text style={styles.listPrice}>{item.pay}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.listDist}>{item.distance}</Text>
              {appliedJobs.has(item.id) && (
                <View style={styles.appliedBadge}><Text style={styles.appliedBadgeText}>지원완료</Text></View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginHorizontal: 16 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ModalShell>
  );
}

function REListModal({ visible, onClose, onSelect }: {
  visible: boolean; onClose: () => void; onSelect: (r: RE) => void;
}) {
  return (
    <ModalShell visible={visible} title="동네 부동산 전체보기" onClose={onClose}>
      <FlatList
        data={REALESTATE}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => { onClose(); onSelect(item); }} activeOpacity={0.7}>
            <View style={[styles.listIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="home-outline" size={22} color="#4CAF50" /></View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>{item.address}</Text>
              <Text style={styles.listSub}>{item.type} · {item.size} · {item.floor}</Text>
              <Text style={styles.listPrice}>{item.price}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginHorizontal: 16 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ModalShell>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────

export default function NearbyScreen() {
  const insets = useSafeAreaInsets();

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedJob,   setSelectedJob]   = useState<Job   | null>(null);
  const [selectedRE,    setSelectedRE]    = useState<RE    | null>(null);

  const [storeListVisible, setStoreListVisible] = useState(false);
  const [jobListVisible,   setJobListVisible]   = useState(false);
  const [reListVisible,    setReListVisible]    = useState(false);
  const [searchVisible,    setSearchVisible]    = useState(false);

  // 지원한 알바 ID 목록 — 모달을 닫았다 다시 열어도 유지
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const applyJob  = (id: string) => setAppliedJobs(prev => { const s = new Set(prev); s.add(id);    return s; });
  const cancelJob = (id: string) => setAppliedJobs(prev => { const s = new Set(prev); s.delete(id); return s; });

  const STORE_PREVIEW = STORES.slice(0, 5);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 근처</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => setSearchVisible(true)}>
          <Ionicons name="search-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* 인기 동네가게 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인기 동네가게</Text>
            <TouchableOpacity onPress={() => setStoreListVisible(true)} activeOpacity={0.7}>
              <Text style={styles.sectionMore}>더보기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeScroll}>
            {STORE_PREVIEW.map((store) => (
              <TouchableOpacity key={store.id} style={styles.storeCard} onPress={() => setSelectedStore(store)} activeOpacity={0.7}>
                <View style={styles.storeThumb}><Ionicons name="storefront-outline" size={28} color="#AAAAAA" /></View>
                <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                <Text style={styles.storeMeta}>{store.category}</Text>
                <Text style={styles.storeDist}>{store.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 동네 알바 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>동네 알바</Text>
            <TouchableOpacity onPress={() => setJobListVisible(true)} activeOpacity={0.7}>
              <Text style={styles.sectionMore}>더보기</Text>
            </TouchableOpacity>
          </View>
          {JOBS.slice(0, 4).map((job) => (
            <TouchableOpacity key={job.id} style={styles.listItem} onPress={() => setSelectedJob(job)} activeOpacity={0.7}>
              <View style={[styles.listIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="briefcase-outline" size={22} color="#2196F3" /></View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{job.company}</Text>
                <Text style={styles.listSub}>{job.role}</Text>
                <Text style={styles.listPrice}>{job.pay}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.listDist}>{job.distance}</Text>
                {appliedJobs.has(job.id) && (
                  <View style={styles.appliedBadge}><Text style={styles.appliedBadgeText}>지원완료</Text></View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 부동산 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>동네 부동산</Text>
            <TouchableOpacity onPress={() => setReListVisible(true)} activeOpacity={0.7}>
              <Text style={styles.sectionMore}>더보기</Text>
            </TouchableOpacity>
          </View>
          {REALESTATE.slice(0, 3).map((r) => (
            <TouchableOpacity key={r.id} style={styles.listItem} onPress={() => setSelectedRE(r)} activeOpacity={0.7}>
              <View style={[styles.listIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="home-outline" size={22} color="#4CAF50" /></View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{r.address}</Text>
                <Text style={styles.listSub}>{r.type}</Text>
                <Text style={styles.listPrice}>{r.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 상세 모달 */}
      {selectedStore && <StoreDetailModal key={selectedStore.id} store={selectedStore} onClose={() => setSelectedStore(null)} />}
      {selectedJob   && (
        <JobDetailModal
          key={selectedJob.id}
          job={selectedJob}
          applied={appliedJobs.has(selectedJob.id)}
          onApply={() => applyJob(selectedJob.id)}
          onCancel={() => cancelJob(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
        />
      )}
      {selectedRE    && <REDetailModal key={selectedRE.id} re={selectedRE} onClose={() => setSelectedRE(null)} />}

      {/* 더보기 전체목록 모달 */}
      <StoreListModal visible={storeListVisible} onClose={() => setStoreListVisible(false)} onSelect={setSelectedStore} />
      <JobListModal   visible={jobListVisible}   onClose={() => setJobListVisible(false)}   onSelect={setSelectedJob}   appliedJobs={appliedJobs} />
      <REListModal    visible={reListVisible}    onClose={() => setReListVisible(false)}    onSelect={setSelectedRE}    />

      {/* 검색 모달 */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelectStore={(s) => { setSearchVisible(false); setSelectedStore(s); }}
        onSelectJob={(j)   => { setSearchVisible(false); setSelectedJob(j);   }}
        onSelectRE={(r)    => { setSearchVisible(false); setSelectedRE(r);    }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  headerTitle:      { fontSize: 18, fontWeight: '700', color: '#212121' },
  iconBtn:          { padding: 6 },
  section:          { paddingVertical: 16 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#212121' },
  sectionMore:      { fontSize: 13, color: '#FF6F0F', fontWeight: '500' },
  divider:          { height: 8, backgroundColor: '#F5F5F5' },
  storeScroll:      { paddingHorizontal: 16, gap: 12 },
  storeCard:        { width: 90, alignItems: 'center', gap: 6 },
  storeThumb:       { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  storeName:        { fontSize: 13, fontWeight: '600', color: '#212121', textAlign: 'center' },
  storeMeta:        { fontSize: 11, color: '#888888' },
  storeDist:        { fontSize: 11, color: '#FF6F0F', fontWeight: '500' },
  listItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  listIcon:         { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listInfo:         { flex: 1, gap: 2 },
  listTitle:        { fontSize: 14, fontWeight: '600', color: '#212121' },
  listSub:          { fontSize: 12, color: '#888888' },
  listPrice:        { fontSize: 13, fontWeight: '700', color: '#212121', marginTop: 2 },
  listDist:         { fontSize: 12, color: '#FF6F0F', fontWeight: '500' },
  appliedBadge:     { backgroundColor: '#E3F2FD', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  appliedBadgeText: { fontSize: 10, color: '#2196F3', fontWeight: '700' },
});

const dStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 12 },
  backBtn:        { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 17, fontWeight: '700', color: '#212121' },
  body:           { padding: 24, alignItems: 'center', gap: 8 },
  thumbLarge:     { width: 100, height: 100, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  detailName:     { fontSize: 22, fontWeight: '700', color: '#212121', textAlign: 'center' },
  detailCategory: { fontSize: 14, color: '#888888', textAlign: 'center' },
  detailPrice:    { fontSize: 20, fontWeight: '700', color: '#FF6F0F', textAlign: 'center', marginTop: 4 },
  infoBox:        { width: '100%', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, gap: 10, marginTop: 8 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel:      { fontSize: 13, color: '#888888', width: 60 },
  infoValue:      { fontSize: 13, color: '#212121', fontWeight: '500', flex: 1 },
  desc:           { fontSize: 14, color: '#555555', lineHeight: 22, textAlign: 'center', marginTop: 4 },
  actionBtn:      { marginTop: 16, width: '100%', backgroundColor: '#FF6F0F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnText:  { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  successBox:     { marginTop: 16, width: '100%', backgroundColor: '#F1F8E9', borderRadius: 12, paddingVertical: 20, alignItems: 'center', gap: 6 },
  successText:    { fontSize: 15, fontWeight: '700', color: '#388E3C' },
  successSub:     { fontSize: 13, color: '#66BB6A' },
  cancelBtn:      { marginTop: 8, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 8, borderWidth: 1.5, borderColor: '#E53935' },
  cancelBtnText:  { fontSize: 14, fontWeight: '600', color: '#E53935' },
});

const sStyles = StyleSheet.create({
  searchHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 8 },
  inputWrap:     { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 10, gap: 6, height: 38 },
  input:         { flex: 1, fontSize: 15, color: '#212121', padding: 0 },
  groupTitle:    { fontSize: 13, fontWeight: '700', color: '#888888', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  emptyWrap:     { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText:     { fontSize: 16, color: '#AAAAAA', fontWeight: '600' },
  emptySubText:  { fontSize: 13, color: '#CCCCCC', textAlign: 'center', paddingHorizontal: 40 },
});
