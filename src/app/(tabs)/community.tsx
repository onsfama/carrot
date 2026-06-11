import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Post = {
  id: string;
  category: string;
  title: string;
  preview: string;
  body: string;
  location: string;
  time: string;
  views: number;
  comments: number;
  likes: number;
};

type Comment = { id: string; author: string; text: string; time: string };

const TABS        = ['전체', '동네질문', '생활정보', '분실·실종', '동네사건사고', '동네홍보'];
const WRITE_CATS  = TABS.slice(1);

const INITIAL_POSTS: Post[] = [
  { id: '1', category: '동네질문',     title: '역삼역 근처 주차장 어디가 저렴한가요?',       preview: '회사 다니면서 매일 주차하는데 좋은 곳 추천 부탁드려요.',             body: '회사 다니면서 매일 주차하는데 좋은 곳 추천 부탁드려요.\n\n역삼역 근처 공영주차장이 있다고 들었는데 거기가 저렴한지도 궁금합니다. 평일 기준으로 종일 주차하면 얼마 정도 나올까요?\n\n혹시 월정액 주차장 아시는 분 계신가요?',       location: '역삼1동', time: '5분 전',   views: 42,  comments: 8,  likes: 3  },
  { id: '2', category: '생활정보',     title: '오늘부터 역삼동 도로 공사 시작해요',           preview: '강남구청 공지사항 확인했는데 2주간 우회도로 이용하셔야 해요.',       body: '강남구청 공지사항 확인했는데 2주간 우회도로 이용하셔야 해요.\n\n역삼동 테헤란로 일부 구간이 하수도 공사로 인해 2주간 통제됩니다.\n우회도로: 선릉로 → 언주로 방면으로 우회하시면 됩니다.\n\n출퇴근 시간에 많이 막힐 것 같으니 미리 참고하세요!',   location: '역삼2동', time: '20분 전',  views: 128, comments: 15, likes: 22 },
  { id: '3', category: '분실·실종',    title: '검은 고양이 찾습니다 ㅠㅠ',                   preview: '어제 저녁 역삼1동 근처에서 잃어버렸어요. 목에 파란 방울 달려있어요.', body: '어제 저녁 역삼1동 근처에서 잃어버렸어요. 목에 파란 방울 달려있어요.\n\n이름은 까미이고 중성화된 수컷 고양이입니다. 나이는 3살이에요.\n발견하시면 꼭 연락 주세요. 사례금 드리겠습니다 ㅠㅠ',                  location: '역삼1동', time: '1시간 전', views: 305, comments: 31, likes: 47 },
  { id: '4', category: '동네사건사고', title: '삼성역 출구 앞 접촉사고 목격하신 분 계신가요', preview: '오전 8시쯤 3번 출구 앞에서 있었던 사고인데 블랙박스 영상 필요해요.', body: '오전 8시쯤 3번 출구 앞에서 있었던 사고인데 블랙박스 영상 필요해요.\n\n파란색 SUV가 은색 세단을 추돌하는 사고였어요. 블랙박스 영상이 있으신 분은 연락 부탁드립니다.\n\n경찰 신고는 이미 했고 보험 처리 중인데 과실 비율 때문에 목격자가 필요합니다.',  location: '삼성1동', time: '2시간 전', views: 89,  comments: 4,  likes: 1  },
  { id: '5', category: '생활정보',     title: '역삼동 맛있는 국밥집 발견했어요',              preview: '점심 먹으러 갔다가 너무 맛있어서 공유해요. 가격도 착하고 양도 많아요.', body: '점심 먹으러 갔다가 너무 맛있어서 공유해요. 가격도 착하고 양도 많아요.\n\n역삼역 3번 출구에서 5분 거리 "진짜 국밥" 이라는 가게인데요.\n순대국밥 8,000원, 돼지국밥 7,500원이고 양이 정말 많아요!\n\n점심 시간엔 줄 서야 하니 조금 일찍 가시길 추천해요.',         location: '역삼1동', time: '3시간 전', views: 214, comments: 19, likes: 38 },
  { id: '6', category: '동네홍보',     title: '이번 주 토요일 플리마켓 열려요 🎪',            preview: '대치동 공원에서 오전 10시부터 오후 5시까지. 먹거리 장터도 있어요!',   body: '대치동 공원에서 오전 10시부터 오후 5시까지. 먹거리 장터도 있어요!\n\n다양한 핸드메이드 제품과 빈티지 소품들이 준비되어 있습니다.\n먹거리 장터에는 수제버거, 길거리 타코, 수제 음료 등이 있어요.\n\n입장료는 무료이고 주차는 인근 공영주차장을 이용해주세요!',  location: '대치2동', time: '어제',     views: 532, comments: 43, likes: 91 },
  { id: '7', category: '동네질문',     title: '강남구 쓰레기 대형 폐기물 신청 어떻게 하나요', preview: '냉장고 버리려는데 신청 방법 아시는 분 알려주세요.',                  body: '냉장고 버리려는데 신청 방법 아시는 분 알려주세요.\n\n오래된 냉장고를 버려야 하는데 어디서 신청하는지 모르겠어요.\n구청 홈페이지에서 신청하면 되나요? 수거 비용은 얼마나 드나요?',                                                  location: '도곡1동', time: '어제',     views: 67,  comments: 12, likes: 5  },
];

const SAMPLE_COMMENTS: Record<string, Comment[]> = {
  '1': [{ id: 'c1', author: '역삼동 주민', text: '강남구 공영주차장 앱에서 검색해보세요! 시간당 800원이에요.', time: '3분 전' }, { id: 'c2', author: '테헤란로 이웃', text: '역삼역 2번 출구 뒤편에 월 10만원짜리 있어요.', time: '1분 전' }],
  '2': [{ id: 'c1', author: '출퇴근러', text: '헉 오늘 막히더니 이래서였군요 감사합니다', time: '15분 전' }, { id: 'c2', author: '역삼2동 주민', text: '언제까지 공사해요?', time: '10분 전' }],
  '3': [{ id: 'c1', author: '고양이집사', text: '꼭 찾으시길 바랍니다 ㅠㅠ', time: '50분 전' }, { id: 'c2', author: '역삼 이웃', text: '주변에 고양이 보이면 연락드릴게요', time: '30분 전' }],
  '4': [{ id: 'c1', author: '삼성1동 주민', text: '저도 봤어요. 그 사고 꽤 큰 사고였어요.', time: '1시간 전' }],
  '5': [{ id: 'c1', author: '점심러', text: '저도 가봤는데 진짜 맛있어요!', time: '2시간 전' }, { id: 'c2', author: '역삼 직장인', text: '오늘 점심 거기 가야겠네요 ㅎㅎ', time: '1시간 전' }],
  '6': [{ id: 'c1', author: '플마 팬', text: '매년 하는 거 맞죠? 올해도 기대돼요!', time: '어제' }, { id: 'c2', author: '대치동 주민', text: '저도 참여하고 싶은데 부스 신청은 어디서 하나요?', time: '어제' }],
  '7': [{ id: 'c1', author: '주민', text: '구청 홈페이지에서 신청하면 돼요. 냉장고는 보통 6,000원 정도예요.', time: '어제' }],
};

function PostDetailModal({ post, visible, onClose, liked, onLike }: {
  post: Post; visible: boolean; onClose: () => void; liked: boolean; onLike: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(SAMPLE_COMMENTS[post.id] ?? []);

  const submitComment = () => {
    if (!commentText.trim()) return;
    setLocalComments(prev => [...prev, { id: Date.now().toString(), author: '나', text: commentText.trim(), time: '방금' }]);
    setCommentText('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[mStyles.container, { paddingTop: insets.top }]}>
          {/* 헤더 */}
          <View style={mStyles.header}>
            <TouchableOpacity onPress={onClose} style={mStyles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={mStyles.headerTitle} numberOfLines={1}>{post.category}</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={mStyles.body}>
              <View style={mStyles.badge}>
                <Text style={mStyles.badgeText}>{post.category}</Text>
              </View>
              <Text style={mStyles.title}>{post.title}</Text>
              <Text style={mStyles.meta}>{post.location} · {post.time}</Text>
              <Text style={mStyles.bodyText}>{post.body}</Text>
              <View style={mStyles.statsRow}>
                <View style={mStyles.statItem}><Ionicons name="eye-outline" size={14} color="#AAAAAA" /><Text style={mStyles.statText}>조회 {post.views}</Text></View>
                <View style={mStyles.statItem}><Ionicons name="chatbubble-outline" size={14} color="#AAAAAA" /><Text style={mStyles.statText}>댓글 {localComments.length}</Text></View>
                <TouchableOpacity style={mStyles.statItem} onPress={onLike} activeOpacity={0.7}>
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#F44336' : '#AAAAAA'} />
                  <Text style={[mStyles.statText, liked && { color: '#F44336' }]}>공감 {post.likes + (liked ? 1 : 0)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={mStyles.divider} />

            {/* 댓글 */}
            <View style={mStyles.commentSection}>
              <Text style={mStyles.commentTitle}>댓글 {localComments.length}</Text>
              {localComments.map((c) => (
                <View key={c.id} style={mStyles.commentItem}>
                  <View style={mStyles.commentAvatar}><Ionicons name="person" size={14} color="#AAAAAA" /></View>
                  <View style={{ flex: 1 }}>
                    <View style={mStyles.commentTop}>
                      <Text style={mStyles.commentAuthor}>{c.author}</Text>
                      <Text style={mStyles.commentTime}>{c.time}</Text>
                    </View>
                    <Text style={mStyles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
              {localComments.length === 0 && <Text style={mStyles.noComment}>첫 댓글을 남겨보세요</Text>}
            </View>
          </ScrollView>

          {/* 댓글 입력 */}
          <View style={[mStyles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
            <View style={mStyles.commentAvatar}><Ionicons name="person" size={14} color="#AAAAAA" /></View>
            <TextInput
              style={mStyles.input}
              placeholder="댓글을 입력하세요"
              placeholderTextColor="#AAAAAA"
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <TouchableOpacity onPress={submitComment} activeOpacity={0.7}>
              <Ionicons name="send" size={20} color={commentText.trim() ? '#FF6F0F' : '#CCCCCC'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WriteModal({ visible, onClose, onSubmit }: {
  visible: boolean; onClose: () => void; onSubmit: (post: Omit<Post, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(WRITE_CATS[0]);
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      category,
      title: title.trim(),
      preview: body.trim().replace(/\n/g, ' ').slice(0, 60),
      body: body.trim(),
      location: '역삼1동',
      time: '방금',
      views: 0,
      comments: 0,
      likes: 0,
    });
    setTitle('');
    setBody('');
    setCategory(WRITE_CATS[0]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[wStyles.container, { paddingTop: insets.top }]}>
          {/* 헤더 */}
          <View style={wStyles.header}>
            <TouchableOpacity onPress={onClose} style={wStyles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#212121" />
            </TouchableOpacity>
            <Text style={wStyles.headerTitle}>동네생활 글쓰기</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[wStyles.submitBtn, canSubmit && wStyles.submitBtnActive]}
              disabled={!canSubmit}
              activeOpacity={0.7}
            >
              <Text style={[wStyles.submitText, canSubmit && wStyles.submitTextActive]}>완료</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {/* 카테고리 선택 */}
            <View style={wStyles.catSection}>
              <Text style={wStyles.catLabel}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={wStyles.catScroll}>
                {WRITE_CATS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[wStyles.catChip, category === cat && wStyles.catChipSelected]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[wStyles.catChipText, category === cat && wStyles.catChipTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={wStyles.divider} />

            {/* 제목 */}
            <TextInput
              style={wStyles.titleInput}
              placeholder="제목을 입력하세요"
              placeholderTextColor="#AAAAAA"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            <View style={wStyles.divider} />

            {/* 본문 */}
            <TextInput
              style={wStyles.bodyInput}
              placeholder={`${category}에 대해 이웃들과 이야기 나눠보세요.`}
              placeholderTextColor="#AAAAAA"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={styles.badge}><Text style={styles.badgeText}>{post.category}</Text></View>
        <Text style={styles.cardTitle} numberOfLines={1}>{post.title}</Text>
      </View>
      <Text style={styles.cardPreview} numberOfLines={1}>{post.preview}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardMeta}>{post.location} · {post.time}</Text>
        <View style={styles.cardStats}>
          <View style={styles.statItem}><Ionicons name="eye-outline" size={13} color="#AAAAAA" /><Text style={styles.statText}>{post.views}</Text></View>
          <View style={styles.statItem}><Ionicons name="chatbubble-outline" size={13} color="#AAAAAA" /><Text style={styles.statText}>{post.comments}</Text></View>
          <View style={styles.statItem}><Ionicons name="heart-outline" size={13} color="#AAAAAA" /><Text style={styles.statText}>{post.likes}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts]           = useState<Post[]>(INITIAL_POSTS);
  const [selectedTab, setSelectedTab] = useState('전체');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [writeVisible, setWriteVisible] = useState(false);

  const filtered = selectedTab === '전체' ? posts : posts.filter((p) => p.category === selectedTab);

  const toggleLike = (id: string) =>
    setLikedPosts((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const addPost = (draft: Omit<Post, 'id'>) =>
    setPosts((prev) => [{ ...draft, id: Date.now().toString() }, ...prev]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>동네생활</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}><Ionicons name="search-outline" size={24} color="#212121" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setWriteVisible(true)} activeOpacity={0.7}><Ionicons name="create-outline" size={24} color="#212121" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.tabSelected]} onPress={() => setSelectedTab(tab)} activeOpacity={0.7}>
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextSelected]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onPress={() => setSelectedPost(item)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>게시글이 없어요</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setWriteVisible(true)} activeOpacity={0.85}>
        <Ionicons name="pencil" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>글쓰기</Text>
      </TouchableOpacity>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          visible={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          liked={likedPosts.has(selectedPost.id)}
          onLike={() => toggleLike(selectedPost.id)}
        />
      )}

      <WriteModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onSubmit={addPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FFFFFF' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  headerTitle:     { fontSize: 18, fontWeight: '700', color: '#212121' },
  headerIcons:     { flexDirection: 'row' },
  iconBtn:         { padding: 6, marginLeft: 4 },
  tabWrapper:      { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  tabScroll:       { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab:             { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  tabSelected:     { backgroundColor: '#212121', borderColor: '#212121' },
  tabText:         { fontSize: 13, color: '#888888' },
  tabTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  card:            { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  cardTop:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:           { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:       { fontSize: 11, color: '#888888' },
  cardTitle:       { flex: 1, fontSize: 15, fontWeight: '600', color: '#212121' },
  cardPreview:     { fontSize: 13, color: '#888888', lineHeight: 18 },
  cardBottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardMeta:        { fontSize: 12, color: '#AAAAAA' },
  cardStats:       { flexDirection: 'row', gap: 8 },
  statItem:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statText:        { fontSize: 12, color: '#AAAAAA' },
  separator:       { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
  emptyBox:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:       { fontSize: 14, color: '#AAAAAA' },
  fab:             { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#FF6F0F', borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabText:         { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

const wStyles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  headerBtn:          { padding: 4 },
  headerTitle:        { flex: 1, fontSize: 16, fontWeight: '700', color: '#212121', textAlign: 'center' },
  submitBtn:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E0E0E0' },
  submitBtnActive:    { backgroundColor: '#FF6F0F' },
  submitText:         { fontSize: 14, fontWeight: '700', color: '#AAAAAA' },
  submitTextActive:   { color: '#FFFFFF' },
  catSection:         { paddingHorizontal: 16, paddingVertical: 14 },
  catLabel:           { fontSize: 13, color: '#888888', marginBottom: 10 },
  catScroll:          { gap: 8 },
  catChip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  catChipSelected:    { backgroundColor: '#212121', borderColor: '#212121' },
  catChipText:        { fontSize: 13, color: '#888888' },
  catChipTextSelected:{ color: '#FFFFFF', fontWeight: '600' },
  divider:            { height: StyleSheet.hairlineWidth, backgroundColor: '#E0E0E0', marginHorizontal: 16 },
  titleInput:         { paddingHorizontal: 16, paddingVertical: 16, fontSize: 17, fontWeight: '600', color: '#212121' },
  bodyInput:          { paddingHorizontal: 16, paddingTop: 16, fontSize: 15, color: '#212121', minHeight: 240, lineHeight: 24 },
});

const mStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 12 },
  backBtn:        { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 16, fontWeight: '600', color: '#212121' },
  body:           { padding: 20, gap: 10 },
  badge:          { alignSelf: 'flex-start', backgroundColor: '#FFF3E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:      { fontSize: 12, color: '#FF6F0F', fontWeight: '500' },
  title:          { fontSize: 20, fontWeight: '700', color: '#212121', lineHeight: 28 },
  meta:           { fontSize: 13, color: '#AAAAAA' },
  bodyText:       { fontSize: 15, color: '#333333', lineHeight: 24, marginTop: 6 },
  statsRow:       { flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0' },
  statItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:       { fontSize: 13, color: '#AAAAAA' },
  divider:        { height: 8, backgroundColor: '#F5F5F5' },
  commentSection: { padding: 20, gap: 16 },
  commentTitle:   { fontSize: 15, fontWeight: '700', color: '#212121' },
  commentItem:    { flexDirection: 'row', gap: 10 },
  commentAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  commentAuthor:  { fontSize: 13, fontWeight: '600', color: '#212121' },
  commentTime:    { fontSize: 12, color: '#AAAAAA' },
  commentText:    { fontSize: 14, color: '#444444', lineHeight: 20 },
  noComment:      { fontSize: 14, color: '#AAAAAA', textAlign: 'center', paddingVertical: 20 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  input:          { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#212121' },
});
