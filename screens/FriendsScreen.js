import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions,
  Alert // Import thêm Alert để thông báo
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; 
import apiClient from '../apiClient';

const { width } = Dimensions.get('window');

export default function FriendsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('feed'); 
  
  const [feed, setFeed] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {

        const meRes = await apiClient.get('/users/me');
        const myData = meRes.data.data;
        
        // Lấy mảng followings từ thông tin user
        // Cấu trúc: [{ id:..., following: {UserObject} }, ...]
        const followData = myData.followings || [];
        
        // Trích xuất object User
        const usersIFollow = followData.map(item => item.following);
        setFollowingList(usersIFollow);

        // Tạo Set ID để lọc Feed
        const followedIds = new Set(usersIFollow.map(u => u.id));

        if (activeTab === 'feed') {
          if (followedIds.size === 0) {
            setFeed([]);
          } else {
            // 2. Lấy tất cả công thức mới nhất
            const recipesRes = await apiClient.get('/recipes?size=50&sort=createdAt,desc');
            const allRecipes = recipesRes.data.data || [];
            
            // 3. Lọc client-side: Chỉ lấy bài của người mình follow
            const myFeed = allRecipes.filter(recipe => 
              recipe.user && followedIds.has(recipe.user.id)
            );
            setFeed(myFeed);
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu FriendsScreen:', err);
        // Nếu lỗi 401 (Hết hạn token), apiClient đã tự xử lý logout
        // Nếu lỗi 500, chỉ log ra console để tránh crash app
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // --- RENDER FEED ITEM ---
  const renderFeedItem = ({ item }) => {
    const author = item.user;
    const avatarUrl = author?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
    const postImage = item.medias?.[0]?.media?.url;

    return (
      <TouchableOpacity 
        style={styles.feedCard} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
      >
        <View style={styles.feedHeader}>
          <TouchableOpacity 
            style={styles.feedAuthorInfo} 
            onPress={() => navigation.navigate('Profile', { userId: author?.id })}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.feedAvatar} />
            ) : (
              <View style={styles.feedAvatarPlaceholder}>
                <Text style={styles.feedAvatarLetter}>{author?.username?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.feedAuthorName}>{author?.username}</Text>
          </TouchableOpacity>
        </View>

        <Image 
          source={{ uri: postImage || 'https://via.placeholder.com/400' }} 
          style={styles.feedImage} 
        />

        <View style={styles.feedContent}>
          <View style={styles.feedActions}>
            <Feather name="heart" size={24} color="#333" />
          </View>
          <Text style={styles.feedTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- RENDER USER ITEM ---
  const renderUserItem = ({ item }) => {
    const avatarUrl = item.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
    return (
      <TouchableOpacity 
        style={styles.userCard} 
        onPress={() => navigation.navigate('Profile', { userId: item.id })}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarLetter}>{item.username?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
        </View>
        <View style={styles.statusBtn}>
          <Text style={styles.statusText}>Bạn bếp</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Bạn bếp</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'feed' && styles.activeTabItem]} 
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Hoạt động</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'list' && styles.activeTabItem]} 
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            Các Bạn Bếp ({followingList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'feed' ? feed : followingList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={activeTab === 'feed' ? renderFeedItem : renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === 'feed' 
                  ? 'Feed đang trống. Hãy theo dõi thêm bạn bếp!' 
                  : 'Bạn chưa theo dõi ai.'}
              </Text>
              <TouchableOpacity 
                style={styles.findBtn}
                onPress={() => navigation.navigate('SearchTab')}
              >
                <Text style={styles.findBtnText}>Tìm bạn bếp</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: '#007bff' },
  tabText: { fontSize: 15, color: '#888', fontWeight: '600' },
  activeTabText: { color: '#007bff' },
  listContent: { paddingBottom: 20 },
  
  // Feed Card
  feedCard: { backgroundColor: '#fff', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  feedHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  feedAuthorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedAvatar: { width: 36, height: 36, borderRadius: 18 },
  feedAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  feedAvatarLetter: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  feedAuthorName: { fontSize: 15, fontWeight: '600', color: '#333' },
  feedImage: { width: '100%', height: 400, backgroundColor: '#eee' },
  feedContent: { padding: 12 },
  feedActions: { flexDirection: 'row', marginBottom: 8, gap: 16 },
  feedTitle: { fontSize: 15, fontWeight: '600', color: '#333', lineHeight: 22 },

  // User Card
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  userAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarLetter: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#222' },
  userHandle: { fontSize: 14, color: '#666', marginTop: 2 },
  statusBtn: { backgroundColor: '#e0e0e0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600', color: '#333' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  findBtn: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  findBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});