import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../apiClient';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  // State
  const [user, setUser] = useState(null); // Profile đang xem
  const [currentUser, setCurrentUser] = useState(null); // Người đang đăng nhập
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thông tin CỦA TÔI trước (để so sánh ID)
        const meRes = await apiClient.get('/users/me');
        const myData = meRes.data.data;
        setCurrentUser(myData);

        // 2. Xác định profile cần xem
        let targetProfile = null;
        
        // Logic quan trọng: Nếu không có userId HOẶC userId = 'me' HOẶC userId trùng với ID của tôi
        if (!userId || userId === 'me' || String(userId) === String(myData.id)) {
            targetProfile = myData; // Xem chính mình
        } else {
            // Xem người khác
            const userRes = await apiClient.get(`/users/${userId}`);
            targetProfile = userRes.data.data;
        }
        
        setUser(targetProfile);

        // 3. Lấy danh sách công thức
        const recipesRes = await apiClient.get(`/recipes/user/${targetProfile.id}?size=100&sort=createdAt,desc`);
        setRecipes(recipesRes.data.data || []);

        // 4. Kiểm tra Follow (Chỉ khi xem người khác)
        if (String(targetProfile.id) !== String(myData.id)) {
          // Kiểm tra trong list followings của tôi có ID người này không
          const amIFollowing = myData.followings?.some(f => f.following.id === targetProfile.id);
          setIsFollowing(!!amIFollowing);
        }

      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // --- LOGIC QUAN TRỌNG: Kiểm tra chủ sở hữu ---
  // Chỉ đúng khi cả 2 object đã load xong và ID trùng nhau
  const isOwnProfile = currentUser && user && (String(currentUser.id) === String(user.id));

  // --- HANDLERS ---

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
    
    // Optimistic update
    setIsFollowing(!originalState);
    
    // Cập nhật số lượng follower giả lập
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
      setIsFollowing(originalState); // Revert
      Alert.alert('Lỗi', 'Thao tác thất bại');
    } finally {
      setFollowLoading(false);
    }
  };

  // Helpers
  const avatarUrl = user?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
  const avatarLetter = (user?.firstName?.[0] || user?.username?.[0] || '?').toUpperCase();

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard} 
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
      activeOpacity={0.9}
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
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
      )}

      {/* Tên */}
      <Text style={styles.name}>
        {user?.firstName} {user?.lastName}
      </Text>
      <Text style={styles.username}>@{user?.username}</Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>
          <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text> Người quan tâm
        </Text>
        <Text style={styles.statSeparator}>•</Text>
        <Text style={styles.statText}>
          <Text style={styles.statNumber}>{user?.followings?.length || 0}</Text> Bạn bếp
        </Text>
      </View>

      {/* Actions (Sử dụng isOwnProfile chuẩn) */}
      <View style={styles.actionsContainer}>
        {isOwnProfile ? (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('EditProfile')}
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

      {/* Tabs */}
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

  actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: '#333' },
  followBtn: { backgroundColor: '#007bff', borderColor: '#007bff' },
  followingBtn: { backgroundColor: '#f0f0f0', borderColor: '#ccc' },

  tabContainer: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', marginTop: 10 },
  activeTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#007bff', gap: 8 },
  activeTabText: { color: '#007bff', fontWeight: '600', fontSize: 15 },

  recipeList: { paddingHorizontal: 12, justifyContent: 'space-between', marginTop: 12 },
  recipeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
  recipeImg: { width: '100%', height: 140, backgroundColor: '#f4f5f7' },
  recipeTitle: { padding: 10, fontSize: 14, fontWeight: '600', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 15 },
});