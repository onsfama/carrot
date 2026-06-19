import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
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

const INITIAL_POSTS: Post[] = [];

function PostDetailModal({ post, visible, onClose, liked, onLike }: {
  post: Post; visible: boolean; onClose: () => void; liked: boolean; onLike: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);

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
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [writeVisible, setWriteVisible] = useState(false);

  const filtered = posts.filter((p) =>
    (selectedTab === '전체' || p.category === selectedTab) &&
    (!searchText.trim() || p.title.includes(searchText.trim()) || p.preview.includes(searchText.trim()))
  );

  const toggleLike = (id: string) =>
    setLikedPosts((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const addPost = (draft: Omit<Post, 'id'>) =>
    setPosts((prev) => [{ ...draft, id: Date.now().toString() }, ...prev]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>동네생활</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => { setSearchVisible(v => !v); if (searchVisible) { setSearchText(''); Keyboard.dismiss(); } }}><Ionicons name={searchVisible ? 'close-outline' : 'search-outline'} size={24} color="#212121" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setWriteVisible(true)} activeOpacity={0.7}><Ionicons name="create-outline" size={24} color="#212121" /></TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#AAAAAA" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="동네생활 검색"
            placeholderTextColor="#AAAAAA"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      )}

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
  searchBar:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput:     { flex: 1, fontSize: 15, color: '#212121', padding: 0 },
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
