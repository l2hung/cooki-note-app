import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons'; 
import apiClient from '../apiClient';
import ProfileMenu from '../components/ProfileMenu';

const { width } = Dimensions.get('window');

const getColumns = () => {
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, catRes, recipeRes] = await Promise.all([
          apiClient.get('/users/me').catch(() => ({ data: { data: null } })),
          apiClient.get('/category'),
          apiClient.get('/recipes?size=30&sort=createdAt,desc'),
        ]);

        setUser(userRes.data.data);
        setCategories(catRes.data.data || []);
        setRecipes(recipeRes.data.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu Home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const avatarLetter = user?.firstName?.[0]?.toUpperCase() ||
                       user?.username?.[0]?.toUpperCase() || '?';

  const latestAvatar = user?.medias?.slice().reverse().find(m => m.type === 'AVATAR');
  const avatarUrl = latestAvatar ? `${latestAvatar.media.url}?t=${Date.now()}` : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const renderRecipe = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard} 
      activeOpacity={0.9} 
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image
        source={{
          uri: item.medias?.[0]?.media?.url || 'https://via.placeholder.com/400x300/eee/aaa?text=No+Image',
        }}
        style={styles.recipeImage}
      />
      <Text style={styles.recipeTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.recipeAuthor}>bởi {item.user?.username || 'Ẩn danh'}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      // 🔹 1. Điều hướng đến trang chi tiết danh mục
      onPress={() => navigation.navigate('Category', { id: item.id, name: item.name })}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      {/* Header: Avatar - Search - Bell */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('SearchTab')}>
          <Feather name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Tìm kiếm công thức...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.notificationBtn} 
          onPress={() => navigation.navigate('NotificationTab')}
        >
          <Feather name="bell" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* DANH MỤC NGANG */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionText}>Danh mục</Text>
          {/* 🔹 2. Điều hướng đến trang xem tất cả danh mục */}
          <TouchableOpacity onPress={() => navigation.navigate('CategoryList')}>
            <Text style={styles.seeAll}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories.slice(0, 15)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategory}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* TIÊU ĐỀ CÔNG THỨC MỚI */}
      <Text style={styles.sectionTextLarge}>Công thức mới</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={recipes}
        numColumns={getColumns()}
        key={getColumns()} 
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.recipesGrid}
        showsVerticalScrollIndicator={false}
      />

      <ProfileMenu
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        user={user}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },

  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 12, 
    backgroundColor: '#f9fafb' 
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22, 
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5, 
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#64748b' },

  searchBar: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    height: 44, 
  },
  searchPlaceholder: { color: '#94a3b8', fontSize: 15 }, 

  notificationBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: { marginTop: 24 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  sectionText: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
  sectionTextLarge: { fontSize: 20, fontWeight: '600', color: '#1e293b', paddingHorizontal: 16, marginVertical: 20 },
  seeAll: { fontSize: 15, color: '#3b82f6' },

  categoryCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryName: { fontSize: 15, fontWeight: '500', color: '#334155' },

  recipesGrid: { paddingHorizontal: 12, paddingBottom: 20 },
  recipeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeImage: { width: '100%', height: 170, backgroundColor: '#f1f5f9' },
  recipeTitle: { fontSize: 15.5, fontWeight: '600', color: '#1e293b', padding: 12, paddingBottom: 4 },
  recipeAuthor: { fontSize: 13, color: '#64748b', paddingHorizontal: 12, paddingBottom: 12 },
});