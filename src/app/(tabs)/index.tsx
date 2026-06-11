import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth';

// ─── 타입 ───────────────────────────────────────────────

type CategoryItem = {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

type Item = {
  id: string;
  title: string;
  price: string;
  location: string;
  time: string;
  likes: number;
  category: string;
  image?: string;
  description?: string;
  sellerId?: string;
  sellerNickname?: string;
};

type WriteSubmitItem = Omit<Item, 'id' | 'likes'> & { imageUris?: string[] };

type ChatRoom = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  items: { title: string; price: number | null; price_type: string; image_urls: string[] } | null;
  buyer: { nickname: string } | null;
  seller: { nickname: string } | null;
  lastMessage: { content: string; created_at: string; sender_id: string } | null;
};

type DbMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

// ─── 데이터 ─────────────────────────────────────────────

const CATEGORIES: CategoryItem[] = [
  { id: '1', name: '중고거래',    icon: 'swap-horizontal', color: '#FF6F0F' },
  { id: '2', name: '부동산',      icon: 'home',            color: '#4CAF50' },
  { id: '3', name: '알바',        icon: 'briefcase',       color: '#2196F3' },
  { id: '4', name: '중고차',      icon: 'car',             color: '#9C27B0' },
  { id: '5', name: '동네맛집',    icon: 'restaurant',      color: '#F44336' },
  { id: '6', name: '과외·클래스', icon: 'school',          color: '#FF9800' },
  { id: '7', name: '생활서비스',  icon: 'construct',       color: '#00BCD4' },
  { id: '8', name: '농수산물',    icon: 'leaf',            color: '#8BC34A' },
];

function formatRelativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return '일주일 전';
}

// ─── 카테고리 섹션 ──────────────────────────────────────

type CategorySectionProps = {
  selected: string | null;
  onSelect: (name: string | null) => void;
};

function CategorySection({ selected, onSelect }: CategorySectionProps) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => onSelect(isSelected ? null : cat.name)}
            >
              <View style={[
                styles.categoryIcon,
                { backgroundColor: cat.color },
                isSelected && styles.categoryIconSelected,
              ]}>
                <Ionicons name={cat.icon} size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.categorySeparator} />
    </View>
  );
}

// ─── 상품 카드 ───────────────────────────────────────────

function ItemCard({ item, onPress, liked, onToggleLike }: { item: Item; onPress: () => void; liked: boolean; onToggleLike: () => void }) {
  const likeCount = item.likes + (liked ? 1 : 0);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnail} />
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.location} · {item.time}</Text>
        <Text style={styles.cardPrice}>{item.price}</Text>
        <TouchableOpacity style={styles.cardLikes} onPress={(e) => { e.stopPropagation?.(); onToggleLike(); }} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#FF6F0F' : '#888888'} />
          <Text style={[styles.cardLikesText, liked && { color: '#FF6F0F' }]}>{likeCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

// ─── 채팅 모달 ──────────────────────────────────────────

function ChatModal({ item, roomId, otherNickname, onClose }: { item: Item | null; roomId: string | null; otherNickname: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setDbMessages([]);
    setInput('');
    if (!roomId) return;

    supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setDbMessages(data ?? []);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
      });

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setDbMessages(prev => [...prev, payload.new as DbMessage]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  if (!item) return null;

  function formatTime(iso: string) {
    const d = new Date(iso);
    const h = d.getHours();
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  async function sendMessage() {
    if (!input.trim() || !roomId || !user) return;
    const content = input.trim();
    setInput('');
    const { error } = await supabase.from('messages').insert({ room_id: roomId, sender_id: user.id, content });
    if (error) {
      setInput(content);
      Alert.alert('전송 실패', error.message);
    }
  }

  return (
    <Modal visible={!!item} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.chatContainer, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onClose} style={styles.detailBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName} numberOfLines={1}>{otherNickname ?? '당근 사용자'}</Text>
            <Text style={styles.chatHeaderSub} numberOfLines={1}>{item.title} · {item.price}</Text>
          </View>
        </View>

        {/* 메시지 목록 */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.chatMessages}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {dbMessages.map((msg) => {
              const fromMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={[styles.msgRow, fromMe && styles.msgRowMe]}>
                  {!fromMe && <View style={styles.msgAvatar}><Ionicons name="person" size={14} color="#AAAAAA" /></View>}
                  <View style={[styles.msgBubble, fromMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                    <Text style={[styles.msgText, fromMe && styles.msgTextMe]}>{msg.content}</Text>
                  </View>
                  <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* 입력창 */}
          <View style={[styles.chatInputRow, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.chatInput}
              placeholder="메시지 보내기"
              placeholderTextColor="#AAAAAA"
              value={input}
              onChangeText={setInput}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── 상세 페이지 모달 ────────────────────────────────────

function ItemDetailModal({ item, onClose, onChat, liked, onToggleLike }: { item: Item | null; onClose: () => void; onChat: (item: Item) => void; liked: boolean; onToggleLike: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  if (!item) return null;

  return (
    <Modal visible={!!item} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={styles.detailBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View style={styles.detailHeaderRight}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={24} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="ellipsis-vertical" size={24} color="#212121" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* 이미지 */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.detailImage} />
          ) : (
            <View style={styles.detailImagePlaceholder} />
          )}

          {/* 판매자 정보 */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={20} color="#AAAAAA" />
            </View>
            <View>
              <Text style={styles.sellerName}>{item.sellerNickname ?? '당근 사용자'}</Text>
              <Text style={styles.sellerLocation}>{item.location}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          {/* 상품 정보 */}
          <View style={styles.detailBody}>
            <View style={styles.detailCategoryBadge}>
              <Text style={styles.detailCategoryText}>{item.category}</Text>
            </View>
            <Text style={styles.detailTitle}>{item.title}</Text>
            <Text style={styles.detailMeta}>{item.time} · 조회 {Math.floor(Math.random() * 100 + 10)}</Text>
            <Text style={styles.detailDescription}>
              {item.description ?? '상품 설명이 없습니다.'}
            </Text>
          </View>
        </ScrollView>

        {/* 하단 구매 바 */}
        <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.heartBtn} activeOpacity={0.7} onPress={onToggleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#FF6F0F' : '#212121'} />
          </TouchableOpacity>
          <View style={styles.detailFooterCenter}>
            <Text style={styles.detailFooterPrice}>{item.price}</Text>
          </View>
          {item.sellerId !== user?.id && (
            <TouchableOpacity style={styles.chatBtn} activeOpacity={0.8} onPress={() => { onClose(); onChat(item); }}>
              <Text style={styles.chatBtnText}>채팅하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── 글쓰기 모달 ─────────────────────────────────────────

async function uploadImages(uris: string[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] ?? 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('items')
        .upload(fileName, blob, { contentType: mimeType });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(fileName);
        urls.push(publicUrl);
      }
    } catch (e) {
      console.error('이미지 업로드 실패:', e);
    }
  }
  return urls;
}

type WriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (item: WriteSubmitItem) => void;
};

function WriteModal({ visible, onClose, onSubmit }: WriteModalProps) {
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].name);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다. 설정에서 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10));
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('제목을 입력해 주세요.');
      return;
    }
    onSubmit({
      title: title.trim(),
      price: price.trim() ? `${Number(price.replace(/,/g, '')).toLocaleString()}원` : '가격 미정',
      location: '역삼1동',
      time: '방금 전',
      category: selectedCat,
      image: images[0],
      imageUris: images,
    });
    setTitle('');
    setPrice('');
    setImages([]);
    setSelectedCat(CATEGORIES[0].name);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalHeaderBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>내 물건 팔기</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.modalHeaderBtn} activeOpacity={0.7}>
            <Text style={styles.modalDone}>완료</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.modalBody, { paddingBottom: insets.bottom + 24 }]}>
          {/* 사진 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageRow}>
              {images.map((uri) => (
                <View key={uri} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(uri)} activeOpacity={0.8}>
                    <Ionicons name="close-circle" size={20} color="#212121" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity style={styles.imageAddBox} activeOpacity={0.7} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={28} color="#888888" />
                  <Text style={styles.imageAddText}>{images.length}/10</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.formSeparator} />

          {/* 제목 */}
          <TextInput
            style={styles.input}
            placeholder="글 제목"
            placeholderTextColor="#AAAAAA"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.formSeparator} />

          {/* 카테고리 선택 */}
          <Text style={styles.catLabel}>카테고리</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((cat) => {
              const selected = selectedCat === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catGridChip, selected && { borderColor: cat.color, backgroundColor: cat.color + '18' }]}
                  onPress={() => setSelectedCat(cat.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.catGridIcon, { backgroundColor: selected ? cat.color : cat.color + '30' }]}>
                    <Ionicons name={cat.icon} size={15} color={selected ? '#FFFFFF' : cat.color} />
                  </View>
                  <Text style={[styles.catGridText, selected && { color: cat.color, fontWeight: '700' }]}>
                    {cat.name}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={15} color={cat.color} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formSeparator} />

          {/* 가격 */}
          <View style={styles.priceRow}>
            <Text style={styles.pricePrefix}>₩</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="가격 (선택사항)"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.formSeparator} />

          {/* 설명 */}
          <TextInput
            style={[styles.input, styles.descInput]}
            placeholder="역삼1동에 올릴 게시글 내용을 작성해 주세요."
            placeholderTextColor="#AAAAAA"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── 주소 설정 모달 ──────────────────────────────────────

const QUICK_LOCATIONS = ['역삼1동', '역삼2동', '삼성1동', '삼성2동', '대치2동', '도곡1동', '개포1동'];

function LocationModal({ visible, current, onSelect, onClose }: {
  visible: boolean;
  current: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState(current);

  function confirm() {
    const trimmed = input.trim();
    if (trimmed) { onSelect(trimmed); onClose(); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalHeaderBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>내 동네 설정</Text>
          <TouchableOpacity onPress={confirm} style={styles.modalHeaderBtn} activeOpacity={0.7}>
            <Text style={styles.modalDone}>확인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locInputRow}>
          <Ionicons name="search-outline" size={18} color="#888888" />
          <TextInput
            style={styles.locInput}
            value={input}
            onChangeText={setInput}
            placeholder="동명으로 검색 (예: 역삼1동)"
            placeholderTextColor="#AAAAAA"
            returnKeyType="done"
            onSubmitEditing={confirm}
            autoFocus
          />
          {input.length > 0 && (
            <TouchableOpacity onPress={() => setInput('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.locQuickTitle}>최근 동네</Text>
        {QUICK_LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[styles.locQuickItem, current === loc && styles.locQuickItemActive]}
            onPress={() => { onSelect(loc); onClose(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={18} color={current === loc ? '#FF6F0F' : '#888888'} />
            <Text style={[styles.locQuickText, current === loc && styles.locQuickTextActive]}>{loc}</Text>
            {current === loc && <Ionicons name="checkmark" size={18} color="#FF6F0F" />}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ─── 검색 모달 ──────────────────────────────────────────

function SearchModal({ visible, items, onClose, onSelectItem }: {
  visible: boolean;
  items: Item[];
  onClose: () => void;
  onSelectItem: (item: Item) => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = query.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.searchHeader}>
          <View style={styles.searchInputRow}>
            <Ionicons name="search-outline" size={18} color="#888888" />
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
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
          <TouchableOpacity onPress={() => { setQuery(''); onClose(); }} style={styles.searchCancelBtn} activeOpacity={0.7}>
            <Text style={styles.searchCancelText}>취소</Text>
          </TouchableOpacity>
        </View>

        {query.trim() === '' ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>검색어를 입력해 주세요</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>"{query}"에 대한 검색 결과가 없어요</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => { onClose(); onSelectItem(item); }}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.thumbnail} /> : <View style={styles.thumbnail} />}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.location} · {item.time}</Text>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── 알림 모달 ──────────────────────────────────────────

const NOTIFICATIONS = [
  { id: '1', icon: 'heart' as const,         color: '#FF6F0F', text: '회원님이 관심 등록한 상품의 가격이 내려갔어요.', time: '5분 전' },
  { id: '2', icon: 'chatbubble' as const,    color: '#2196F3', text: '새로운 채팅 메시지가 도착했어요.', time: '20분 전' },
  { id: '3', icon: 'location' as const,      color: '#4CAF50', text: '역삼1동 근처에 새 중고거래가 올라왔어요.', time: '1시간 전' },
  { id: '4', icon: 'star' as const,          color: '#FF9800', text: '등록하신 상품에 관심을 보이는 사람이 있어요.', time: '3시간 전' },
  { id: '5', icon: 'megaphone' as const,     color: '#9C27B0', text: '당근마켓 이벤트: 이번 주 무료 나눔 특집!', time: '어제' },
];

function NotificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.detailBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>알림</Text>
          <View style={styles.modalHeaderBtn} />
        </View>
        <FlatList
          data={NOTIFICATIONS}
          keyExtractor={(n) => n.id}
          renderItem={({ item: n }) => (
            <TouchableOpacity style={styles.notiItem} activeOpacity={0.7}>
              <View style={[styles.notiIconBox, { backgroundColor: n.color + '22' }]}>
                <Ionicons name={n.icon} size={20} color={n.color} />
              </View>
              <View style={styles.notiText}>
                <Text style={styles.notiBody}>{n.text}</Text>
                <Text style={styles.notiTime}>{n.time}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyText}>알림이 없어요</Text></View>}
        />
      </View>
    </Modal>
  );
}

// ─── 채팅 목록 모달 ─────────────────────────────────────

function ChatListModal({ visible, chatRooms, userId, onClose, onSelectRoom }: {
  visible: boolean;
  chatRooms: ChatRoom[];
  userId: string | null;
  onClose: () => void;
  onSelectRoom: (room: ChatRoom) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.detailBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>채팅</Text>
          <View style={styles.modalHeaderBtn} />
        </View>
        <FlatList
          data={chatRooms}
          keyExtractor={(room) => room.id}
          renderItem={({ item: room }) => {
            const otherNickname = userId === room.buyer_id
              ? (room.seller?.nickname ?? '판매자')
              : (room.buyer?.nickname ?? '구매자');
            const thumb = room.items?.image_urls?.[0];
            return (
              <TouchableOpacity style={styles.chatRoomItem} activeOpacity={0.7} onPress={() => { onClose(); onSelectRoom(room); }}>
                {thumb
                  ? <Image source={{ uri: thumb }} style={styles.chatRoomThumb} />
                  : <View style={styles.chatRoomThumb} />}
                <View style={styles.chatRoomInfo}>
                  <Text style={styles.chatRoomName}>{otherNickname}</Text>
                  <Text style={styles.chatRoomPreview} numberOfLines={1}>{room.lastMessage?.content ?? room.items?.title ?? ''}</Text>
                </View>
                <Text style={styles.chatRoomTime}>{formatRelativeTime(room.lastMessage?.created_at ?? room.created_at)}</Text>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={[styles.separator, { marginHorizontal: 0 }]} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>아직 채팅이 없어요</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// ─── 홈 화면 ────────────────────────────────────────────

const CATEGORY_ID: Record<string, number> = {
  '중고거래': 1, '부동산': 2, '알바': 3, '중고차': 4,
  '동네맛집': 5, '과외·클래스': 6, '생활서비스': 7, '농수산물': 8,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(name), profiles!seller_id(nickname)')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setItems(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price_type === 'free' ? '무료' : row.price_type === 'negotiable' ? '협의' : `${(row.price as number)?.toLocaleString()}원`,
        location: row.location,
        time: formatRelativeTime(row.created_at),
        likes: row.like_count,
        category: (row.categories as { name: string } | null)?.name ?? '',
        image: (row.image_urls as string[])?.[0],
        description: row.description ?? undefined,
        sellerId: row.seller_id,
        sellerNickname: (row.profiles as { nickname: string } | null)?.nickname,
      }))
    );
    setIsLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [chatItem, setChatItem] = useState<Item | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatOtherNickname, setChatOtherNickname] = useState<string | null>(null);
  const [writeVisible, setWriteVisible] = useState(false);
  const [location, setLocation] = useState('역삼1동');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [searchVisible, setSearchVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [chatListVisible, setChatListVisible] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  const fetchChatRooms = async () => {
    if (!user) return;
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select(`id, item_id, buyer_id, seller_id, created_at,
        items(title, price, price_type, image_urls),
        buyer:buyer_id(nickname),
        seller:seller_id(nickname)`)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (!rooms?.length) { setChatRooms([]); return; }

    const { data: messages } = await supabase
      .from('messages')
      .select('room_id, content, created_at, sender_id')
      .in('room_id', rooms.map(r => r.id))
      .order('created_at', { ascending: false });

    const lastByRoom: Record<string, { content: string; created_at: string; sender_id: string }> = {};
    messages?.forEach(m => {
      if (!lastByRoom[m.room_id]) lastByRoom[m.room_id] = m;
    });

    const merged = rooms
      .map(room => ({ ...room, lastMessage: lastByRoom[room.id] ?? null }))
      .sort((a, b) => {
        const ta = new Date(a.lastMessage?.created_at ?? a.created_at).getTime();
        const tb = new Date(b.lastMessage?.created_at ?? b.created_at).getTime();
        return tb - ta;
      });

    setChatRooms(merged as ChatRoom[]);
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function startChat(item: Item) {
    if (!user || !item.sellerId || item.sellerId === user.id) return;
    let { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('item_id', item.id)
      .eq('buyer_id', user.id)
      .maybeSingle();
    if (!room) {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.sellerId })
        .select('id')
        .single();
      if (error) {
        Alert.alert('채팅 오류', error.message);
        return;
      }
      room = newRoom;
    }
    if (room) {
      setChatRoomId(room.id);
      setChatItem(item);
      setChatOtherNickname(item.sellerNickname ?? null);
    }
  }

  async function handleSubmit(newItem: WriteSubmitItem) {
    if (!user) return;
    const imageUrls = newItem.imageUris?.length
      ? await uploadImages(newItem.imageUris, user.id)
      : [];
    const priceNum = newItem.price === '협의' || newItem.price === '가격 미정'
      ? null
      : parseInt(newItem.price.replace(/[^0-9]/g, ''), 10) || null;
    const priceType = newItem.price === '무료' ? 'free' : priceNum === null ? 'negotiable' : 'fixed';
    await supabase.from('items').insert({
      seller_id: user.id,
      title: newItem.title,
      description: newItem.description,
      price: priceNum,
      price_type: priceType,
      category_id: CATEGORY_ID[newItem.category] ?? 1,
      location: newItem.location,
      image_urls: imageUrls,
    });
    fetchItems();
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.locationButton} activeOpacity={0.7} onPress={() => setLocationModalVisible(true)}>
            <Text style={styles.locationText}>{location}</Text>
            <Ionicons name="chevron-down" size={18} color="#212121" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => setSearchVisible(true)}>
              <Ionicons name="search-outline" size={24} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => setNotificationVisible(true)}>
              <Ionicons name="notifications-outline" size={24} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => { setChatListVisible(true); fetchChatRooms(); }}>
              <Ionicons name="chatbubble-outline" size={24} color="#212121" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 목록 */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => setSelectedItem(item)}
            liked={likedIds.has(item.id)}
            onToggleLike={() => toggleLike(item.id)}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <CategorySection selected={selectedCategory} onSelect={setSelectedCategory} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {isLoading ? '불러오는 중...' : '해당 카테고리의 게시글이 없어요'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setWriteVisible(true)}>
        <Ionicons name="pencil" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>글쓰기</Text>
      </TouchableOpacity>

      {/* 상세 모달 */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onChat={(item) => { setSelectedItem(null); startChat(item); }}
        liked={selectedItem ? likedIds.has(selectedItem.id) : false}
        onToggleLike={() => selectedItem && toggleLike(selectedItem.id)}
      />

      {/* 채팅 모달 */}
      <ChatModal item={chatItem} roomId={chatRoomId} otherNickname={chatOtherNickname} onClose={() => { setChatItem(null); setChatRoomId(null); setChatOtherNickname(null); }} />

      {/* 검색 모달 */}
      <SearchModal
        visible={searchVisible}
        items={items}
        onClose={() => setSearchVisible(false)}
        onSelectItem={(item) => { setSearchVisible(false); setSelectedItem(item); }}
      />

      {/* 알림 모달 */}
      <NotificationModal visible={notificationVisible} onClose={() => setNotificationVisible(false)} />

      {/* 채팅 목록 모달 */}
      <ChatListModal
        visible={chatListVisible}
        chatRooms={chatRooms}
        userId={user?.id ?? null}
        onClose={() => setChatListVisible(false)}
        onSelectRoom={(room) => {
          setChatListVisible(false);
          const otherNickname = room.buyer_id === user?.id
            ? (room.seller?.nickname ?? null)
            : (room.buyer?.nickname ?? null);
          const item: Item = {
            id: room.item_id,
            title: room.items?.title ?? '',
            price: room.items
              ? room.items.price_type === 'free' ? '무료'
                : room.items.price_type === 'negotiable' ? '협의'
                : `${(room.items.price as number)?.toLocaleString()}원`
              : '',
            location: '', time: '', likes: 0, category: '',
            image: room.items?.image_urls?.[0],
            sellerId: room.seller_id,
          };
          setChatRoomId(room.id);
          setChatItem(item);
          setChatOtherNickname(otherNickname);
        }}
      />

      {/* 주소 모달 */}
      <LocationModal
        visible={locationModalVisible}
        current={location}
        onSelect={setLocation}
        onClose={() => setLocationModalVisible(false)}
      />

      {/* 글쓰기 모달 */}
      <WriteModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

// ─── 스타일 ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#FFFFFF' },
  headerWrapper:        { backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  locationButton:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:         { fontSize: 17, fontWeight: '700', color: '#212121' },
  headerIcons:          { flexDirection: 'row', alignItems: 'center' },
  iconButton:           { padding: 6, marginLeft: 4 },
  listContent:          { paddingBottom: 80, flexGrow: 1 },
  // 카테고리
  categoryList:         { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },
  categoryItem:         { alignItems: 'center', width: 64, gap: 6 },
  categoryIcon:         { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryIconSelected: { transform: [{ scale: 1.1 }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  categoryName:         { fontSize: 11, color: '#212121', textAlign: 'center' },
  categoryNameSelected: { fontWeight: '700', color: '#FF6F0F' },
  categorySeparator:    { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0' },
  // 카드
  card:                 { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  thumbnail:            { width: 110, height: 110, borderRadius: 8, backgroundColor: '#E0E0E0', flexShrink: 0 },
  cardInfo:             { flex: 1, justifyContent: 'flex-start', gap: 4 },
  cardTitle:            { fontSize: 15, color: '#212121', lineHeight: 21 },
  cardMeta:             { fontSize: 13, color: '#888888' },
  cardPrice:            { fontSize: 15, fontWeight: '700', color: '#212121', marginTop: 2 },
  cardLikes:            { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, alignSelf: 'flex-end' },
  cardLikesText:        { fontSize: 13, color: '#888888' },
  separator:            { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0', marginHorizontal: 16 },
  // 빈 화면
  emptyBox:             { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:            { fontSize: 14, color: '#AAAAAA' },
  // FAB
  fab:                  { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#FF6F0F', borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabText:              { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  // 상세 모달
  detailContainer:      { flex: 1, backgroundColor: '#FFFFFF' },
  detailHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, height: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  detailBackBtn:        { padding: 8 },
  detailHeaderRight:    { flexDirection: 'row' },
  detailImage:          { width: '100%', height: 300 },
  detailImagePlaceholder: { width: '100%', height: 300, backgroundColor: '#E0E0E0' },
  sellerRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  sellerAvatar:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  sellerName:           { fontSize: 15, fontWeight: '600', color: '#212121' },
  sellerLocation:       { fontSize: 13, color: '#888888', marginTop: 2 },
  detailDivider:        { height: 8, backgroundColor: '#F5F5F5' },
  detailBody:           { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  detailCategoryBadge:  { alignSelf: 'flex-start', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  detailCategoryText:   { fontSize: 12, color: '#888888' },
  detailTitle:          { fontSize: 20, fontWeight: '700', color: '#212121' },
  detailMeta:           { fontSize: 13, color: '#AAAAAA' },
  detailDescription:    { fontSize: 15, color: '#444444', lineHeight: 22, marginTop: 8 },
  detailFooter:         { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF', gap: 12 },
  heartBtn:             { padding: 4 },
  detailFooterCenter:   { flex: 1 },
  detailFooterPrice:    { fontSize: 17, fontWeight: '700', color: '#212121' },
  chatBtn:              { backgroundColor: '#FF6F0F', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  chatBtnText:          { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  // 글쓰기 모달
  modalContainer:       { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  modalHeaderBtn:       { padding: 8, minWidth: 48 },
  modalTitle:           { fontSize: 16, fontWeight: '700', color: '#212121' },
  modalDone:            { fontSize: 16, fontWeight: '600', color: '#FF6F0F', textAlign: 'right' },
  modalBody:            { padding: 16 },
  imageRow:             { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  imagePreviewWrapper:  { position: 'relative' },
  imagePreview:         { width: 80, height: 80, borderRadius: 8 },
  imageRemoveBtn:       { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFFFFF', borderRadius: 10 },
  imageAddBox:          { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imageAddText:         { fontSize: 11, color: '#888888' },
  formSeparator:        { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0', marginVertical: 4 },
  input:                { fontSize: 15, color: '#212121', paddingVertical: 16 },
  priceRow:             { flexDirection: 'row', alignItems: 'center' },
  pricePrefix:          { fontSize: 15, color: '#212121', marginRight: 4, paddingVertical: 16 },
  priceInput:           { flex: 1 },
  descInput:            { minHeight: 120 },
  catLabel:             { fontSize: 13, color: '#888888', marginTop: 12, marginBottom: 8 },
  catGrid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  catGridChip:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  catGridIcon:          { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catGridText:          { fontSize: 13, color: '#555555' },
  // 채팅
  chatContainer:        { flex: 1, backgroundColor: '#FFFFFF' },
  chatHeader:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, height: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  chatHeaderInfo:       { flex: 1 },
  chatHeaderName:       { fontSize: 15, fontWeight: '600', color: '#212121' },
  chatHeaderSub:        { fontSize: 12, color: '#888888', marginTop: 1 },
  chatMessages:         { flex: 1, backgroundColor: '#F8F8F8' },
  msgRow:               { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgRowMe:             { flexDirection: 'row-reverse' },
  msgAvatar:            { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgBubble:            { maxWidth: '70%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleThem:        { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E0E0E0' },
  msgBubbleMe:          { backgroundColor: '#FF6F0F' },
  msgText:              { fontSize: 15, color: '#212121', lineHeight: 21 },
  msgTextMe:            { color: '#FFFFFF' },
  msgTime:              { fontSize: 11, color: '#AAAAAA', marginBottom: 2 },
  chatInputRow:         { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  chatInput:            { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#212121' },
  sendBtn:              { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6F0F', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:      { backgroundColor: '#CCCCCC' },
  // 검색
  searchHeader:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  searchInputRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput:          { flex: 1, fontSize: 15, color: '#212121' },
  searchCancelBtn:      { paddingHorizontal: 4 },
  searchCancelText:     { fontSize: 15, color: '#FF6F0F', fontWeight: '500' },
  // 알림
  notiItem:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  notiIconBox:          { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notiText:             { flex: 1, gap: 3 },
  notiBody:             { fontSize: 14, color: '#212121', lineHeight: 20 },
  notiTime:             { fontSize: 12, color: '#AAAAAA' },
  // 채팅 목록
  chatRoomItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  chatRoomThumb:        { width: 52, height: 52, borderRadius: 8, backgroundColor: '#E0E0E0', flexShrink: 0 },
  chatRoomInfo:         { flex: 1, gap: 4 },
  chatRoomName:         { fontSize: 15, fontWeight: '600', color: '#212121' },
  chatRoomPreview:      { fontSize: 13, color: '#888888' },
  chatRoomTime:         { fontSize: 12, color: '#AAAAAA' },
  // 주소 모달
  locInputRow:          { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, gap: 8, backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  locInput:             { flex: 1, fontSize: 15, color: '#212121' },
  locQuickTitle:        { fontSize: 13, color: '#888888', fontWeight: '600', marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  locQuickItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  locQuickItemActive:   { backgroundColor: '#FFF5F0' },
  locQuickText:         { flex: 1, fontSize: 15, color: '#212121' },
  locQuickTextActive:   { color: '#FF6F0F', fontWeight: '600' },
});
