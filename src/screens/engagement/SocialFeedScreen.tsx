import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEmployees } from '../../api/hook/useEmployee';
import {
  EngagementPost,
  useAddComment,
  useAddReaction,
  useCreatePost,
  usePosts,
  useToggleLike,
} from '../../api/hook/useEngagement';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SocialFeed'>;

export const SocialFeedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [currentEmpId, setCurrentEmpId] = useState('EMP001');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [showEmpDropdown, setShowEmpDropdown] = useState<boolean>(false);

  // Create Post Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState('Aarav Sharma');
  const [authorRole, setAuthorRole] = useState('Senior Software Engineer');
  const [postContent, setPostContent] = useState(
    '🎉 Super excited to announce our team successfully launched the HRMS Mobile App project! Huge congratulations to everyone involved! 🚀'
  );

  // Active Comment Input per post
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: postsRes, isLoading } = usePosts(currentEmpId);

  const createPostMutation = useCreatePost();
  const addCommentMutation = useAddComment();
  const toggleLikeMutation = useToggleLike();
  const addReactionMutation = useAddReaction();

  const employees = empRes?.data || [];

  // Auto-sync selected employee from organization employees list
  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
      setAuthorName(employees[0].name);
      setAuthorRole(employees[0].designation || employees[0].role || 'Employee');
    }
  }, [employees, selectedEmpId]);

  const handleSelectAuthor = (emp: any) => {
    setSelectedEmpId(emp.id);
    setAuthorName(emp.name);
    setAuthorRole(emp.designation || emp.role || 'Employee');
    setShowEmpDropdown(false);
  };

  const feedPosts: EngagementPost[] = postsRes?.data || [
    {
      id: 'POST101',
      author: 'Aarav Sharma',
      authorRole: 'Senior Software Engineer',
      content: '🎉 Super excited to announce our team successfully launched the HRMS Mobile App project! Huge congratulations to everyone involved! 🚀',
      likes: 14,
      likedByMe: true,
      reactions: [
        { type: '👏', count: 8 },
        { type: '🚀', count: 12 },
        { type: '🎉', count: 15 },
      ],
      comments: [
        { id: 'C1', user: 'Neha Patel', text: 'Kudos team! Fantastic work on the UI implementation.', date: '2026-07-29' },
        { id: 'C2', user: 'sam', text: 'Loved designing the component system! 🎨', date: '2026-07-29' },
      ],
      date: '2 hours ago',
    },
    {
      id: 'POST102',
      author: 'Vikram Malhotra',
      authorRole: 'Tech Lead',
      content: '📢 Reminder: Team Tech Sync is scheduled for tomorrow at 11 AM. We will review Q3 architecture benchmarks and performance goals.',
      likes: 6,
      likedByMe: false,
      reactions: [
        { type: '👍', count: 5 },
        { type: '💡', count: 3 },
      ],
      comments: [
        { id: 'C3', user: 'Aarav Sharma', text: 'Will share the benchmark metrics ahead of time.', date: '2026-07-28' },
      ],
      date: 'Yesterday',
    },
  ];

  // Handle Like Toggle
  const handleToggleLike = (postId: string) => {
    toggleLikeMutation.mutate(
      { postId, employeeId: currentEmpId },
      {
        onSuccess: () => {
          // Toast or Silent Refresh
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Reaction Toggle
  const handleAddReaction = (postId: string, type: string) => {
    addReactionMutation.mutate(
      { postId, employeeId: currentEmpId, type },
      {
        onSuccess: () => {
          Alert.alert('Reaction Added! ' + type, 'Your reaction was posted.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Add Comment
  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    addCommentMutation.mutate(
      { postId, userName: authorName, text: text.trim() },
      {
        onSuccess: () => {
          setCommentInputs(prev => ({ ...prev, [postId]: '' }));
          Alert.alert('Comment Posted 💬', 'Your comment has been added to the discussion.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Publish Post
  const handlePublishPost = () => {
    if (!postContent.trim()) {
      Alert.alert('Validation Error', 'Please enter post content.');
      return;
    }

    createPostMutation.mutate(
      {
        employeeId: selectedEmpId || currentEmpId,
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        content: postContent.trim(),
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setPostContent('');
          setShowEmpDropdown(false);
          Alert.alert('Post Published 📢', 'Your post is now live on the Corporate Wall!');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Social Feed & Announcements
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Corporate Wall, Kudos & Employee Announcements
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Create Post Banner Box */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.createPromptCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>AS</Text>
          </View>
          <Text style={[styles.promptText, { color: colors.textSecondary }]}>
            Share an announcement, kudos or team update...
          </Text>
        </TouchableOpacity>

        {/* Social Feed Posts List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Company Announcements & Wall Posts ({feedPosts.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          feedPosts.map(post => (
            <View
              key={post.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              {/* Post Author Header */}
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>
                    {post.author
                      ? post.author
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'EM'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>
                    {post.author}
                  </Text>
                  <Text style={[styles.authorRole, { color: colors.textSecondary }]}>
                    {post.authorRole} • {post.date}
                  </Text>
                </View>
              </View>

              {/* Post Content */}
              <Text style={[styles.postContentText, { color: colors.textPrimary }]}>
                {post.content}
              </Text>

              {/* Emoji Reactions Bar */}
              <View style={styles.reactionsBar}>
                {['👏', '🚀', '🎉', '❤️', '💡'].map(emoji => {
                  const existing = post.reactions.find(r => r.type === emoji);
                  const count = existing ? existing.count : 0;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.emojiChip, { backgroundColor: colors.background }]}
                      onPress={() => handleAddReaction(post.id, emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji} {count > 0 ? count : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Stats & Buttons */}
              <View style={[styles.actionRow, { borderTopColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleLike(post.id)}
                >
                  <Text style={{ fontSize: 16 }}>{post.likedByMe ? '❤️' : '🤍'}</Text>
                  <Text style={[styles.actionBtnText, { color: post.likedByMe ? '#ef4444' : colors.textSecondary }]}>
                    {post.likes} Likes
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionBtn}>
                  <Text style={{ fontSize: 16 }}>💬</Text>
                  <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                    {post.comments.length} Comments
                  </Text>
                </View>
              </View>

              {/* Comment Thread Accordion */}
              <View style={[styles.commentSection, { backgroundColor: colors.background }]}>
                {post.comments.map(c => (
                  <View key={c.id} style={styles.commentItem}>
                    <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>
                      {c.user} <Text style={[styles.commentDate, { color: colors.textSecondary }]}>• {c.date}</Text>
                    </Text>
                    <Text style={[styles.commentBody, { color: colors.textSecondary }]}>
                      {c.text}
                    </Text>
                  </View>
                ))}

                {/* Add Comment Input */}
                <View style={styles.addCommentRow}>
                  <TextInput
                    style={[
                      styles.commentInput,
                      { backgroundColor: colors.cardBackground, color: colors.inputText, borderColor: colors.inputBorder },
                    ]}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.inputPlaceholder}
                    value={commentInputs[post.id] || ''}
                    onChangeText={txt =>
                      setCommentInputs(prev => ({ ...prev, [post.id]: txt }))
                    }
                  />
                  <TouchableOpacity
                    style={[styles.commentSubmitBtn, { backgroundColor: colors.accent }]}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Text style={styles.commentSubmitBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Publish Post Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Publish Announcement / Social Post
            </Text>

            {/* EMPLOYEE DROPDOWN SELECTOR */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              SELECT POST AUTHOR / EMPLOYEE (DROPDOWN) *
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownSelectorBtn,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
              onPress={() => setShowEmpDropdown(!showEmpDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownSelectorLeft}>
                <View style={[styles.avatarMini, { backgroundColor: colors.accent }]}>
                  <Text style={styles.avatarMiniText}>
                    {authorName
                      ? authorName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'EM'}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.dropdownEmpName, { color: colors.textPrimary }]}>
                    {authorName || 'Select Employee'}
                  </Text>
                  <Text style={[styles.dropdownEmpRole, { color: colors.textSecondary }]}>
                    {authorRole || 'Staff'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
                {showEmpDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* DROPDOWN MENU LIST */}
            {showEmpDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {employees.length === 0 ? (
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        No employees found in organization
                      </Text>
                    </View>
                  ) : (
                    employees.map((emp: any) => {
                      const isSelected = selectedEmpId === emp.id;
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          style={[
                            styles.dropdownMenuItem,
                            isSelected && { backgroundColor: colors.accent + '20' },
                          ]}
                          onPress={() => handleSelectAuthor(emp)}
                        >
                          <View style={[styles.avatarMini, { backgroundColor: isSelected ? colors.accent : '#64748b' }]}>
                            <Text style={styles.avatarMiniText}>
                              {emp.name
                                ? emp.name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()
                                : 'EM'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.dropdownItemName, { color: colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                              {emp.name}
                            </Text>
                            <Text style={[styles.dropdownItemRole, { color: colors.textSecondary }]}>
                              {emp.designation || emp.role || 'Employee'}
                            </Text>
                          </View>
                          {isSelected && (
                            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 14 }}>✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AUTHOR NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={authorName}
              onChangeText={setAuthorName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AUTHOR ROLE / DESIGNATION *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={authorRole}
              onChangeText={setAuthorRole}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ANNOUNCEMENT CONTENT *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handlePublishPost}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Publish Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  addTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  createPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  promptText: {
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorRole: {
    fontSize: 10,
    marginTop: 1,
  },
  postContentText: {
    fontSize: 13,
    lineHeight: 19,
    marginVertical: 4,
  },
  reactionsBar: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  emojiChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100,100,100,0.15)',
  },
  emojiText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentSection: {
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  commentItem: {
    gap: 2,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  commentDate: {
    fontSize: 10,
    fontWeight: '400',
  },
  commentBody: {
    fontSize: 11,
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
  },
  commentSubmitBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  commentSubmitBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dropdownSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  dropdownSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownEmpName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownEmpRole: {
    fontSize: 10,
    marginTop: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 6,
    maxHeight: 180,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,100,100,0.1)',
    gap: 10,
  },
  dropdownItemName: {
    fontSize: 13,
  },
  dropdownItemRole: {
    fontSize: 10,
    marginTop: 1,
  },
});
