import React, { useState, useCallback } from 'react'; // 1. Thêm useCallback
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import apiClient from '../apiClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // 2. Thêm useFocusEffect
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

export default function LikedRecipesScreen() {
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // 3. Sử dụng useFocusEffect để tải lại danh sách mỗi khi màn hình được hiển thị
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchLikedRecipes = async () => {
        // Nếu danh sách đang trống thì hiện loading, nếu có rồi thì update ngầm
        if (recipes.length === 0) setLoading(true);

        try {
          const res = await apiClient.get('/recipes/like');
          if (isActive) {
            setRecipes(res.data.data || []);
          }
        } catch (err) {
          console.error(err);
          if (isActive) setRecipes([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchLikedRecipes();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image 
        source={{ uri: item.medias?.[0]?.media?.url || 'https://via.placeholder.com/300' }} 
        style={styles.img} 
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.author}>bởi {item.user?.username || 'Ẩn danh'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER GIỐNG WEB */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={26} color="#555" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput 
            placeholder="Tìm trong công thức đã lưu..." 
            placeholderTextColor="#aaa"
            value={search} 
            onChangeText={setSearch} 
            style={styles.searchInput} 
          />
        </View>
        <View style={{ width: 24 }} /> 
      </View>

      {/* CONTENT */}
      {loading && recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book-open" size={64} color="#ccc" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>
             {search ? 'Không tìm thấy công thức nào.' : 'Bạn chưa lưu công thức nào.'}
          </Text>
          {!search && <Text style={styles.emptySubText}>Hãy khám phá và nhấn thích nhé!</Text>}
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          key={2} 
          renderItem={renderItem}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f5f7' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    gap: 16, 
  },
  backButton: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f4f5f7', 
    borderRadius: 50, 
    paddingHorizontal: 16, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0', 
  },
  searchInput: {
    flex: 1,
    fontSize: 16, 
    color: '#333',
    paddingVertical: 0, 
  },
  listContent: {
    paddingHorizontal: 24, 
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 24, 
    overflow: 'hidden', 
    width: '47%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  img: { 
    width: '100%', 
    height: 120, 
    backgroundColor: '#eee',
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 12, 
  },
  title: { 
    fontWeight: '600', 
    fontSize: 16, 
    color: '#333',
    marginBottom: 4,
  },
  author: { 
    color: '#777', 
    fontSize: 13, 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 16,
  },
  emptyState: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: -40, 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#aaa', 
    marginBottom: 8 
  },
  emptySubText: {
    fontSize: 16,
    color: '#aaa',
  },
});
