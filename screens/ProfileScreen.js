import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../apiClient';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};
  const isFocused = useIsFocused();

  // State
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // --- Fetch profile & recipes
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await apiClient.get('/users/me');
      const myData = meRes.data.data;
      setCurrentUser(myData);

      let targetProfile = null;
      if (!userId || userId === 'me' || String(userId) === String(myData.id)) {
        targetProfile = myData;
      } else {
        const userRes = await apiClient.get(`/users/${userId}`);
        targetProfile = userRes.data.data;
      }
      setUser(targetProfile);

      // Lấy danh sách công thức
      const recipesRes = await apiClient.get(`/recipes/user/${targetProfile.id}?size=100&sort=createdAt,desc`);
      setRecipes(recipesRes.data.data || []);

      // Kiểm tra follow
      if (String(targetProfile.id) !== String(myData.id)) {
        const amIFollowing = myData.followings?.some(f => f.following.id === targetProfile.id);
        setIsFollowing(!!amIFollowing);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // FIX: Refresh khi quay lại từ EditProfile
  useEffect(() => {
    if (isFocused) fetchProfileData();
  }, [isFocused, fetchProfileData, route.params?.refresh]);

  // --- Handlers ---
  const handleShare = async () => {
    try {
      const url = `https://cookinote.com/profile/${user.id}`;
      await Share.share({
        message: `Xem hồ sơ bếp của ${user.username} trên CookiNote: ${url}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading || !user) return;
    setFollowLoading(true);

    const originalState = isFollowing;
    setIsFollowing(!originalState);

    setUser(prev => ({
      ...prev,
      followers: originalState
        ? (prev.followers || []).slice(0, -1)
        : [...(prev.followers || []), {}]
    }));

    try {
      if (originalState) {
        await apiClient.delete(`/follow/${user.id}`);
      } else {
        await apiClient.post(`/follow/${user.id}`);
      }
    } catch (err) {
      console.error(err);
      setIsFollowing(originalState);
      Alert.alert('Lỗi', 'Thao tác thất bại');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    Alert.alert('Xác nhận', 'Bạn có muốn xóa công thức này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/recipes/${recipeId}`);
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            Alert.alert('Thành công', 'Đã xóa công thức');
          } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Xóa thất bại');
          }
        }
      }
    ]);
  };

  const isOwnProfile = currentUser && user && (String(currentUser.id) === String(user.id));
  const isAdmin = currentUser?.roles?.some(r => r.name === 'ROLE_ADMIN') || currentUser?.email === 'cookinote.contact@gmail.com';
  const avatarUrl = user?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
  const avatarLetter = (user?.firstName?.[0] || user?.username?.[0] || '?').toUpperCase();

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
      activeOpacity={0.9}
      onLongPress={isOwnProfile ? () => handleDeleteRecipe(item.id) : null}
    >
      <Image
        source={{ uri: item.medias?.[0]?.media?.url || 'https://via.placeholder.com/300' }}
        style={styles.recipeImg}
      />
      <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.profileContainer}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
      )}

      <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.username}>@{user?.username}</Text>

      <View style={styles.statsContainer}>
        <Text style={styles.statText}>
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text> Người quan tâm
        </Text>
        <Text style={styles.statSeparator}>•</Text>
        <Text style={styles.statText}>
          <Text style={styles.statNumber}>{user?.followings?.length || 0}</Text> Bạn bếp
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditProfile', { refresh: true })}
          >
            <Feather name="edit-2" size={16} color="#333" />
            <Text style={styles.actionBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, isFollowing ? styles.followingBtn : styles.followBtn]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? "#333" : "#fff"} />
            ) : (
              <Text style={[styles.actionBtnText, !isFollowing && { color: '#fff' }]}>
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Feather name="share-2" size={16} color="#333" />
          <Text style={styles.actionBtnText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {isOwnProfile && isAdmin && (
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Feather name="shield" size={16} color="#fff" />
          <Text style={styles.adminBtnText}>Quản trị viên</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tabContainer}>
        <View style={styles.activeTab}>
          <Feather name="grid" size={18} color="#007bff" />
          <Text style={styles.activeTabText}>Công thức đã đăng ({recipes.length})</Text>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={recipes}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecipeItem}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.recipeList}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có công thức nào.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { padding: 4 },

  profileContainer: { alignItems: 'center', paddingTop: 10, paddingBottom: 20, backgroundColor: '#fff' },
  avatar: { width: 86, height: 86, borderRadius: 43, marginBottom: 12 },
  avatarPlaceholder: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: '#888' },

  name: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 4 },
  username: { fontSize: 15, color: '#777', marginBottom: 16 },

  statsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statText: { fontSize: 14, color: '#555' },
  statNumber: { fontWeight: 'bold', color: '#333' },
  statSeparator: { marginHorizontal: 10, color: '#ccc' },

  actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: '#333' },
  followBtn: { backgroundColor: '#007bff', borderColor: '#007bff' },
  followingBtn: { backgroundColor: '#f0f0f0', borderColor: '#ccc' },

  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    gap: 8,
    marginBottom: 20,
  },
  adminBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  tabContainer: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', marginTop: 0 },
  activeTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#007bff', gap: 8 },
  activeTabText: { color: '#007bff', fontWeight: '600', fontSize: 15 },

  recipeList: { paddingHorizontal: 12, justifyContent: 'space-between', marginTop: 12 },
  recipeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
  recipeImg: { width: '100%', height: 140, backgroundColor: '#f4f5f7' },
  recipeTitle: { padding: 10, fontSize: 14, fontWeight: '600', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 15 },
});
