import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; // Import Icon
import apiClient from '../apiClient';

export default function RecipeDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const [recipe, setRecipe] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipeRes, userRes] = await Promise.all([
          apiClient.get(`/recipes/${id}`),
          apiClient.get('/users/me').catch(() => ({ data: { data: null } }))
        ]);

        const data = recipeRes.data.data;
        setRecipe(data);
        setLikeCount(data.likes?.length || 0);
        
        if (userRes.data?.data) {
          const user = userRes.data.data;
          setCurrentUser(user);
          setIsLiked(data.likes?.some(l => l.user?.id === user.id));
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải chi tiết công thức.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- HANDLERS ---

  const handleLike = async () => {
    const originalLiked = isLiked;
    const originalCount = likeCount;
    
    setIsLiked(!originalLiked);
    setLikeCount(originalLiked ? originalCount - 1 : originalCount + 1);

    try {
      if (originalLiked) await apiClient.delete(`/like/recipe/${id}`);
      else await apiClient.post(`/like/recipe/${id}`);
    } catch (err) {
      setIsLiked(originalLiked);
      setLikeCount(originalCount);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/comment/recipe/${id}`, { content: comment });
      if (res.data?.data) {
        setRecipe(prev => ({
          ...prev,
          comments: [res.data.data, ...(prev.comments || [])]
        }));
        setComment('');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToShoppingList = async () => {
    if (isAddingToList) return;
    setIsAddingToList(true);
    try {
        await apiClient.post('/shopping-list', { recipeId: recipe.id });
        Alert.alert('Thành công', 'Đã thêm vào danh sách đi chợ!');
    } catch (err) {
        Alert.alert('Lỗi', err.response?.data?.message || 'Thất bại');
    } finally {
        setIsAddingToList(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
        "Xác nhận xoá",
        "Bạn có chắc chắn muốn xoá công thức này?",
        [
            { text: "Hủy", style: "cancel" },
            { 
                text: "Xóa", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await apiClient.delete(`/recipes/${id}`);
                        Alert.alert("Đã xóa", "Công thức đã được xóa thành công.");
                        navigation.goBack();
                    } catch (err) {
                        Alert.alert("Lỗi", "Không thể xóa công thức.");
                    }
                } 
            }
        ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!recipe) return <View style={styles.center}><Text>Không tìm thấy công thức.</Text></View>;

  const sortedSteps = [...(recipe.steps || [])].sort((a, b) => a.stepOrder - b.stepOrder);
  const isOwner = currentUser?.id === recipe.user?.id;
  
  // Avatar helpers
  const getAvatar = (user) => user?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
  const authorAvatar = getAvatar(recipe.user);
  const myAvatar = getAvatar(currentUser);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Feather name="arrow-left" size={26} color="#333" />
            </TouchableOpacity>
            {isOwner && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                    <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
            )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* MAIN IMAGE */}
            <Image 
                source={{ uri: recipe.medias?.[0]?.media?.url || 'https://via.placeholder.com/400' }} 
                style={styles.mainImage} 
            />

            {/* TITLE & LIKE */}
            <View style={styles.titleRow}>
                <Text style={styles.title}>{recipe.title}</Text>
                <TouchableOpacity 
                    style={[styles.likeBtn, isLiked && styles.likedBtn]} 
                    onPress={handleLike}
                >
                    <Feather name="heart" size={20} color={isLiked ? "#ff4757" : "#555"} />
                    <Text style={[styles.likeCount, isLiked && { color: '#ff4757' }]}>{likeCount}</Text>
                </TouchableOpacity>
            </View>

            {/* AUTHOR INFO */}
            <TouchableOpacity 
                style={styles.authorInfo} 
                onPress={() => navigation.navigate('Profile', { userId: recipe.user?.id })}
            >
                {authorAvatar ? (
                    <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{recipe.user?.username?.[0]}</Text>
                    </View>
                )}
                <View>
                    <Text style={styles.authorName}>{recipe.user?.username}</Text>
                    <Text style={styles.date}>{new Date(recipe.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
            </TouchableOpacity>

            {/* META INFO */}
            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <Feather name="clock" size={16} color="#555" />
                    <Text style={styles.metaText}>{recipe.cookTimeMinutes} phút</Text>
                </View>
                <View style={styles.metaItem}>
                    <Feather name="bar-chart" size={16} color="#555" />
                    <Text style={styles.metaText}>{recipe.difficulty}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Feather name="users" size={16} color="#555" />
                    <Text style={styles.metaText}>{recipe.servings} người</Text>
                </View>
            </View>

            {/* INGREDIENTS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nguyên liệu</Text>
                    <TouchableOpacity 
                        style={[styles.addListBtn, isAddingToList && { opacity: 0.5 }]} 
                        onPress={handleAddToShoppingList}
                        disabled={isAddingToList}
                    >
                        <Feather name="shopping-cart" size={16} color="#007bff" />
                        <Text style={styles.addListText}>Thêm vào list</Text>
                    </TouchableOpacity>
                </View>
                {recipe.ingredients?.map((item, i) => (
                    <View key={i} style={styles.ingredientRow}>
                        <Text style={styles.ingName}>{item.ingredient.name}</Text>
                        <Text style={styles.ingQty}>{item.quantity} {item.unit}</Text>
                    </View>
                ))}
            </View>

            {/* STEPS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cách làm</Text>
                {sortedSteps.map((step) => (
                    <View key={step.id} style={styles.stepCard}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNum}>{step.stepOrder}</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepDesc}>{step.description}</Text>
                            {step.medias?.[0]?.media?.url && (
                                <Image 
                                    source={{ uri: step.medias[0].media.url }} 
                                    style={styles.stepImage} 
                                />
                            )}
                        </View>
                    </View>
                ))}
            </View>

            {/* COMMENTS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bình luận ({recipe.comments?.length || 0})</Text>
                {recipe.comments?.map(c => {
                    const cAvt = getAvatar(c.user);
                    return (
                        <View key={c.id} style={styles.commentItem}>
                            {cAvt ? (
                                <Image source={{ uri: cAvt }} style={styles.commentAvatar} />
                            ) : (
                                <View style={styles.commentAvatarPlace}>
                                    <Text>{c.user?.username?.[0]}</Text>
                                </View>
                            )}
                            <View style={styles.commentBubble}>
                                <Text style={styles.commentUser}>{c.user?.username}</Text>
                                <Text style={styles.commentText}>{c.content}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

        </ScrollView>

        {/* COMMENT INPUT */}
        <View style={styles.commentInputContainer}>
            {myAvatar ? (
                <Image source={{ uri: myAvatar }} style={styles.myAvatar} />
            ) : (
                <View style={styles.myAvatarPlace}><Text>{currentUser?.username?.[0]}</Text></View>
            )}
            <TextInput 
                placeholder="Viết bình luận..." 
                value={comment} 
                onChangeText={setComment} 
                style={styles.commentInput} 
            />
            <TouchableOpacity onPress={handleComment} disabled={submitting} style={styles.sendBtn}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 80 },

  // HEADER
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#f4f5f7' 
  },
  backBtn: { padding: 4 },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff1f2', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#fecaca',
    gap: 4 
  },
  deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },

  // MAIN CONTENT
  mainImage: { 
    width: '100%', 
    height: 260, 
    borderRadius: 20, 
    marginBottom: 16,
    backgroundColor: '#eee' 
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: 16,
    marginBottom: 12 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#222', 
    flex: 1, 
    marginRight: 8 
  },
  likeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#eee', 
    gap: 6 
  },
  likedBtn: { backgroundColor: '#ffe5e8', borderColor: '#ffcbd3' },
  likeCount: { fontSize: 14, color: '#555', fontWeight: '600' },

  // AUTHOR & META
  authorInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    marginBottom: 16, 
    gap: 10 
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  authorName: { fontWeight: '600', fontSize: 15, color: '#333' },
  date: { fontSize: 12, color: '#888' },

  metaContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 20,
    elevation: 1 
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#555', fontWeight: '500', fontSize: 13 },

  // SECTION COMMON
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 8
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  
  // INGREDIENTS
  addListBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#e6f7ff', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    gap: 6 
  },
  addListText: { color: '#007bff', fontSize: 12, fontWeight: '600' },
  ingredientRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  ingName: { fontSize: 15, color: '#333' },
  ingQty: { fontSize: 15, color: '#555', fontWeight: '500' },

  // STEPS
  stepCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 16, 
    padding: 16,
    paddingLeft: 50, // Chừa chỗ cho số thứ tự
    position: 'relative',
    elevation: 2
  },
  stepBadge: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    width: 30, 
    height: 30, 
    backgroundColor: '#3b82f6', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepDesc: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 12 },
  stepImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },

  // COMMENTS LIST
  commentItem: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAvatarPlace: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  commentBubble: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 10,
    elevation: 1 
  },
  commentUser: { fontWeight: 'bold', fontSize: 13, marginBottom: 2, color: '#333' },
  commentText: { fontSize: 14, color: '#444' },

  // COMMENT INPUT
  commentInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    gap: 10 
  },
  myAvatar: { width: 32, height: 32, borderRadius: 16 },
  myAvatarPlace: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  commentInput: { 
    flex: 1, 
    backgroundColor: '#f4f5f7', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    fontSize: 14 
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#007bff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});