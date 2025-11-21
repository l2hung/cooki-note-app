import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather'; // 🔹 Import Icon Feather

export default function LikedRecipesScreen() {
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/recipes/like')
      .then(res => setRecipes(res.data.data || []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

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
        {/* Placeholder view để cân bằng header nếu cần, ở đây ta để trống */}
        <View style={{ width: 24 }} /> 
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          {/* Empty Icon giống web */}
          <Feather name="book-open" size={64} color="#ccc" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Bạn chưa lưu công thức nào.</Text>
          <Text style={styles.emptySubText}>Hãy khám phá và nhấn thích nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          key={2} // Force re-render khi đổi số cột (nếu cần)
          renderItem={renderItem}
          // Căn chỉnh Grid giống CSS: gap 1.5rem ~ 24px, padding xung quanh
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
    backgroundColor: '#f4f5f7' // Khớp bg-color CSS
  },

  // HEADER STYLES
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, // padding: 1rem 1.5rem ~ 16px 24px
    paddingVertical: 16,
    gap: 16, // gap: 1rem
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
    backgroundColor: '#f4f5f7', // Khớp background thanh search
    borderRadius: 50, // border-radius: 50px
    paddingHorizontal: 16, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0', // border: 1px solid #e0e0e0
  },
  searchInput: {
    flex: 1,
    fontSize: 16, // font-size: 1rem
    color: '#333',
    paddingVertical: 0, // Fix text lệch trên Android
  },

  // CARD STYLES
  listContent: {
    paddingHorizontal: 24, // padding container
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 24, // gap dọc giữa các hàng
    overflow: 'hidden', 
    width: '47%', // Để chừa khoảng trống ở giữa (gap)
    
    // Box shadow giống CSS box-shadow: 0 4px 8px rgba(0,0,0,0.05)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  img: { 
    width: '100%', 
    height: 120, // height: 120px
    backgroundColor: '#eee',
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 12, // margin: 0.5rem 0.75rem
  },
  title: { 
    fontWeight: '600', 
    fontSize: 16, // font-size: 1rem
    color: '#333',
    marginBottom: 4,
  },
  author: { 
    color: '#777', 
    fontSize: 13, // font-size: 0.8rem
  },

  // EMPTY STATE & LOADING
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
    marginTop: -40, // Đẩy lên một chút cho cân đối
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